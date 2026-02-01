'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  // En Next.js 15, cookies() es asíncrono.
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Aseguramos que las opciones se pasen correctamente
              cookieStore.set({ name, value, ...options })
            })
          } catch {
            // Se ignoran errores en Server Components o contextos donde no se pueden setear cookies
          }
        },
      },
    }
  )

  // Corrección de tipado estricto para evitar errores de build
  const email = formData.get('email')?.toString() || ''
  const password = formData.get('password')?.toString() || ''

  // 1. Iniciar Sesión
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent('Credenciales inválidas')}`)
  }

  if (user) {
    // 2. Verificar Rol (Tabla profiles)
    // Usamos maybeSingle para evitar errores si el perfil no existe
    const { data: profile } = await supabase
        .from('profiles') 
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    // Si no es admin, fuera.
    if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut()
        return redirect(`/login?error=${encodeURIComponent('Acceso denegado. No eres administrador.')}`)
    }

    // 3. NUEVO: Verificar si tiene Productora (Tabla experiences)
    const { data: experience } = await supabase
        .from('experiences')
        .select('id')
        .eq('producer_id', user.id)
        .maybeSingle()

    // LÓGICA DE REDIRECCIÓN INTELIGENTE
    if (!experience) {
        // Si no tiene productora -> Al Onboarding
        revalidatePath('/onboarding', 'layout')
        return redirect('/onboarding')
    }
  }

  // 4. Si tiene productora -> Al Dashboard (Login normal)
  revalidatePath('/', 'layout')
  redirect('/')
}