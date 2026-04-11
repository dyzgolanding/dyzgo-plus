'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Reenvía el email de ticket a un asistente llamando a la misma
 * Edge Function `send-ticket-email` que se usa al confirmar la compra.
 * El payload es idéntico al que genera webpay/index.ts en las líneas 382-386.
 */
export async function resendTicketEmail(ticketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Obtener el ticket completo de la DB (necesitamos todos los campos que usa la edge fn)
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return { success: false, error: 'Ticket no encontrado.' }
    }

    if (ticket.status !== 'valid') {
      return { success: false, error: 'Solo se puede reenviar el correo de tickets confirmados (status: valid).' }
    }

    // 2. Llamar a la Edge Function con el mismo payload que usa webpay al confirmar el pago
    const SBURL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SBKEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SBURL || !SBKEY) {
      return { success: false, error: 'Variables de entorno no configuradas.' }
    }

    const res = await fetch(`${SBURL}/functions/v1/send-ticket-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SBKEY}`,
      },
      body: JSON.stringify({ type: 'UPDATE', record: ticket }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[resendTicketEmail] Edge function error:', body)
      return { success: false, error: 'Error al contactar el servicio de email.' }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[resendTicketEmail]', msg)
    return { success: false, error: msg }
  }
}
