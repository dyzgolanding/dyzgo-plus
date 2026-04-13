import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase-admin'

/** Cliente Supabase con cookies del usuario (respeta RLS, lee sesión real) */
export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Actions de solo-lectura no se pueden setear cookies — ignorar
          }
        },
      },
    }
  )
}

/**
 * Obtiene el usuario autenticado desde la sesión activa.
 * Lanza error si no hay sesión válida.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No autorizado. Inicia sesión para continuar.')
  return user
}

/**
 * Verifica que el usuario autenticado sea el organizador del evento.
 * Lanza error si el evento no existe o no le pertenece.
 */
export async function verifyEventOwnership(eventId: string, userId: string): Promise<void> {
  const { data: event, error } = await supabaseAdmin
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single()

  if (error || !event) throw new Error('Evento no encontrado.')
  if (event.organizer_id !== userId) throw new Error('No tienes permiso para modificar este evento.')
}
