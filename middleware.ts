import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // 1. Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Definir rutas
  const path = request.nextUrl.pathname
  const isLoginPage = path === '/login'
  
  // Define qué rutas proteges (TODO menos login y estáticos)
  const isProtectedRoute = !isLoginPage && !path.startsWith('/_next') && !path.startsWith('/api') && path !== '/favicon.ico'

  // --- LOGS DE DEPURACIÓN ---
  if (!path.startsWith('/_next')) {
    // console.log(`[Middleware] Path: ${path} | User: ${user ? 'Logueado' : 'No Logueado'}`)
  }

  // 3. Obtener Rol (Solo si hay usuario)
  let userRole = null
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles') // <--- ¡CORREGIDO! (Estaba en 'profile')
      .select('role')
      .eq('id', user.id)
      .single()
    
    userRole = profile?.role
    // console.log(`[Middleware] Rol detectado: ${userRole}`)
    
    if (error) console.error('[Middleware Error DB]:', error.message)
  }

  // --- LÓGICA DE REDIRECCIÓN ---

  // CASO A: El Admin intenta ir al Login -> Lo mandamos al Dashboard
  if (user && userRole === 'admin' && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // CASO B: Protección de Rutas
  if (isProtectedRoute) {
    // Solo pasa si hay usuario Y es admin
    const canAccess = user && userRole === 'admin'
    
    if (!canAccess) {
      console.log('[Middleware] Acceso denegado. Redirigiendo a Login.')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}