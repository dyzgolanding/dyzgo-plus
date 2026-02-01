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

  // 1. Obtener usuario (Seguro y cacheado por Supabase Auth)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Definir rutas y lógica de exclusión
  const path = request.nextUrl.pathname
  
  // Excluir archivos estáticos y API de la protección para evitar bloqueos de imágenes/estilos
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.startsWith('/static') || 
    path.includes('.') // Excluye archivos con extensión (.png, .svg, .css, etc)
  ) {
    return response
  }

  const isLoginPage = path === '/login'
  const isAuthCallback = path === '/auth/callback'
  
  // Definimos qué rutas requieren estar logueado (Casi todas excepto login)
  const isProtectedRoute = !isLoginPage && !isAuthCallback

  // --- LÓGICA DE REDIRECCIÓN ---

  // CASO A: Usuario NO logueado intenta entrar a ruta protegida -> Login
  if (isProtectedRoute && !user) {
    // console.log(`[Middleware] Acceso denegado a ${path}. Redirigiendo a Login.`)
    const redirectUrl = new URL('/login', request.url)
    // Guardamos a dónde quería ir para redirigirlo después de loguearse (opcional)
    redirectUrl.searchParams.set('redirectedFrom', path)
    return NextResponse.redirect(redirectUrl)
  }

  // CASO B: Usuario LOGUEADO intenta entrar al Login -> Dashboard
  if (isLoginPage && user) {
    // console.log('[Middleware] Usuario ya logueado. Redirigiendo a Dashboard.')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // NOTA DE SEGURIDAD:
  // Hemos eliminado la consulta a la tabla 'profiles' aquí por rendimiento y lógica.
  // Es mejor manejar los roles (Owner vs Staff) dentro de la App (Layouts) o con RLS.
  // Si bloqueas aquí por 'admin', un 'owner' recién registrado no podría entrar ni al Onboarding.

  return response
}

// Configuración del Matcher optimizada
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto las que comienzan con:
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (archivo favicon)
     * - Cualquier archivo con extensión (imágenes en public/, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}