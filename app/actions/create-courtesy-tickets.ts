'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { resendTicketEmail } from './resend-ticket-email'
import { v4 as uuidv4 } from 'uuid'

export async function createCourtesyTickets(newTickets: any[]) {
    try {
        // Asignar IDs si no los tienen, aunque ya vienen con crypto.randomUUID() desde el cliente, pero por si acaso.
        // Insertamos usando supabaseAdmin para overridear cualquier política RLS en tickets o activity_logs (que suele causar crash).
        const { error: insertError } = await supabaseAdmin.from('tickets').insert(newTickets)
        if (insertError) {
            return { success: false, error: insertError.message }
        }

        // Llamar a los emails usando nuestro backend con service_role
        const emailPromises = newTickets.map(t => resendTicketEmail(t.id))
        await Promise.allSettled(emailPromises)

        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}
