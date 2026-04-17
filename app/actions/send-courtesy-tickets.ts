'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser, verifyEventOwnership } from '@/lib/supabase-server'
import { waitUntil } from '@vercel/functions'

export interface CourtesyRecipient {
  email: string
  nombre: string
  apellido: string
  rut?: string
  cantidad: number
}

export interface CourtesySendResult {
  success: boolean
  total: number
  emailsFailed: string[]
  error?: string
}

export async function sendCourtesyTickets(
  recipients: CourtesyRecipient[],
  eventId: string,
  tierId: string
): Promise<CourtesySendResult> {
  try {
    // Verificar sesión activa y ownership del evento
    const user = await getAuthenticatedUser()
    await verifyEventOwnership(eventId, user.id)

    const SBURL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SBKEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SBURL || !SBKEY) {
      return { success: false, total: 0, emailsFailed: [], error: 'Variables de entorno no configuradas.' }
    }

    const newTickets: any[] = []

    for (const recipient of recipients) {
      // Buscar user_id por RUT server-side (supabaseAdmin bypasea RLS)
      let finalUserId: string | null = null
      if (recipient.rut) {
        // El RUT llega formateado "12345678-9" (igual que se guarda en profiles)
        const formattedRut = recipient.rut.toUpperCase()
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('rut', formattedRut)
          .maybeSingle()
        if (profile?.id) finalUserId = profile.id
      }

      const count = Math.max(1, Number(recipient.cantidad) || 1)
      for (let i = 0; i < count; i++) {
        newTickets.push({
          id: crypto.randomUUID(),
          user_id: finalUserId,
          event_id: eventId,
          tier_id: tierId,
          status: 'valid',
          ticket_type: 'courtesy',
          qr_hash: crypto.randomUUID(),
          guest_name: `${recipient.nombre} ${recipient.apellido}`.trim() || null,
          guest_email: recipient.email || null,
          purchase_date: new Date().toISOString(),
          buy_order: `COURTESY-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
          paid_price: 0,
        })
      }
    }

    // Insertar tickets
    const { error: insertError } = await supabaseAdmin.from('tickets').insert(newTickets)
    if (insertError) {
      return { success: false, total: 0, emailsFailed: [], error: insertError.message }
    }

    // Disparar emails en segundo plano — no bloquea el server action
    // waitUntil mantiene el proceso vivo en Vercel hasta que terminen todos los envíos
    const BATCH_SIZE = 4
    const BATCH_DELAY_MS = 1100
    const MAX_RETRIES = 4

    const sendAllEmails = async () => {
      const sendWithRetry = async (ticket: any): Promise<void> => {
        let delay = 500
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const res = await fetch(`${SBURL}/functions/v1/send-ticket-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SBKEY}`,
              },
              body: JSON.stringify({ type: 'UPDATE', record: ticket }),
            })
            if (res.status === 429 && attempt < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, delay))
              delay *= 2
              continue
            }
            if (!res.ok) {
              const body = await res.text()
              console.error(`[sendCourtesyTickets] Email error for ${ticket.guest_email}:`, body)
            }
            return
          } catch (err) {
            if (attempt < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, delay))
              delay *= 2
            } else {
              console.error(`[sendCourtesyTickets] Email exception for ${ticket.guest_email}:`, err)
            }
          }
        }
      }

      for (let i = 0; i < newTickets.length; i += BATCH_SIZE) {
        const batch = newTickets.slice(i, i + BATCH_SIZE)
        await Promise.all(batch.map(sendWithRetry))
        if (i + BATCH_SIZE < newTickets.length) {
          await new Promise(r => setTimeout(r, BATCH_DELAY_MS))
        }
      }
    }

    // Retorna inmediatamente — los emails se envían en background
    waitUntil(sendAllEmails())

    return { success: true, total: newTickets.length, emailsFailed: [] }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, total: 0, emailsFailed: [], error: msg }
  }
}
