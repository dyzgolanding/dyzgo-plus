'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser, verifyEventOwnership } from '@/lib/supabase-server'
import { resendTicketEmail } from './resend-ticket-email'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateTicket(t: Record<string, unknown>, index: number): string | null {
  if (!t.id || !UUID_RE.test(String(t.id)))
    return `Ticket #${index + 1}: id inválido o faltante.`
  if (!t.event_id || !UUID_RE.test(String(t.event_id)))
    return `Ticket #${index + 1}: event_id inválido o faltante.`
  if (!t.tier_id || !UUID_RE.test(String(t.tier_id)))
    return `Ticket #${index + 1}: tier_id inválido o faltante.`
  if (t.status !== 'valid')
    return `Ticket #${index + 1}: status debe ser 'valid'.`
  if (t.ticket_type !== 'courtesy')
    return `Ticket #${index + 1}: ticket_type debe ser 'courtesy'.`
  if (t.guest_email && !EMAIL_RE.test(String(t.guest_email)))
    return `Ticket #${index + 1}: guest_email tiene formato inválido.`
  return null
}

export async function createCourtesyTickets(eventId: string, newTickets: Record<string, unknown>[]) {
  try {
    const user = await getAuthenticatedUser()
    await verifyEventOwnership(eventId, user.id)

    if (!newTickets || newTickets.length === 0)
      return { success: false, error: 'No se proporcionaron tickets.' }

    // Validar cada ticket antes de insertar
    for (let i = 0; i < newTickets.length; i++) {
      const validationError = validateTicket(newTickets[i], i)
      if (validationError) return { success: false, error: validationError }
      // Asegurar que el event_id del ticket coincide con el eventId verificado
      if (String(newTickets[i].event_id) !== eventId)
        return { success: false, error: `Ticket #${i + 1}: event_id no coincide con el evento autorizado.` }
    }

    const { error: insertError } = await supabaseAdmin.from('tickets').insert(newTickets)
    if (insertError) return { success: false, error: insertError.message }

    const emailPromises = newTickets.map(t => resendTicketEmail(t.id as string))
    await Promise.allSettled(emailPromises)

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: msg }
  }
}
