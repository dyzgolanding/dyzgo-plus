'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser, verifyEventOwnership } from '@/lib/supabase-server'

export interface TicketTierSave {
  id: string
  name: string
  price: number
  total_stock: number
  description?: string
  sales_end_at?: string | null
  is_active?: boolean
  nominative?: boolean
  fake_sold?: boolean
  sales_start_at?: string | null
  hour_start?: string | null
  end_hour?: string | null
  type: 'paid' | 'courtesy'
  sort_order: number
}

export interface EventPayload {
  title: string
  region?: string
  commune?: string
  street?: string
  street_number?: string
  latitude?: number | null
  longitude?: number | null
  club_name?: string
  date: string
  end_date?: string
  hour?: string
  end_time?: string
  image_url?: string | null
  description?: string
  music_genre?: string
  dress_code?: string
  min_age_men?: number
  min_age_women?: number
  prohibited_items?: string[]
  instagram_url?: string
  category?: string
  accent_color?: string
  is_active?: boolean
  status?: string
}

export interface SaveEventResult {
  success: boolean
  eventId?: string
  error?: string
}

export async function saveEvent(
  eventId: string | null,
  eventPayload: EventPayload,
  tickets: TicketTierSave[]
): Promise<SaveEventResult> {
  let newlyCreatedId: string | null = null

  try {
    const user = await getAuthenticatedUser()

    if (eventId) {
      await verifyEventOwnership(eventId, user.id)
    }

    // Fix 4: Validación server-side del stock antes de escribir nada en la DB
    if (eventId && tickets.length > 0) {
      const existingIds = tickets.map(t => t.id).filter(id => id && id.length > 20)
      if (existingIds.length > 0) {
        const { data: soldCounts } = await supabaseAdmin
          .from('ticket_tiers')
          .select('id, name, sold_tickets')
          .eq('event_id', eventId)
          .in('id', existingIds)

        if (soldCounts) {
          for (const dbTier of soldCounts) {
            const uiTier = tickets.find(t => t.id === dbTier.id)
            const sold = (dbTier.sold_tickets as number) ?? 0
            if (uiTier && uiTier.total_stock < sold) {
              return {
                success: false,
                error: `El stock del ticket "${uiTier.name}" (${uiTier.total_stock}) no puede ser menor a la cantidad ya vendida (${sold}).`,
              }
            }
          }
        }
      }
    }

    // Paso 1: guardar evento
    let currentEventId = eventId

    if (eventId) {
      const { error } = await supabaseAdmin
        .from('events')
        .update(eventPayload)
        .eq('id', eventId)
      if (error) throw new Error(`Error actualizando evento: ${error.message}`)
    } else {
      const { data: newEvent, error } = await supabaseAdmin
        .from('events')
        .insert([{ ...eventPayload, organizer_id: user.id }])
        .select('id')
        .single()
      if (error || !newEvent) throw new Error(`Error creando evento: ${error?.message}`)
      currentEventId = newEvent.id
      newlyCreatedId = newEvent.id
    }

    if (!currentEventId) throw new Error('No se pudo obtener el ID del evento.')

    // Paso 2: eliminar tiers borrados de la UI
    const { data: existingTiers } = await supabaseAdmin
      .from('ticket_tiers')
      .select('id')
      .eq('event_id', currentEventId)

    if (existingTiers) {
      const uiIds = tickets.map(t => t.id).filter(id => id && id.length > 20)
      const idsToDelete = existingTiers.map(t => t.id as string).filter(dbId => !uiIds.includes(dbId))
      if (idsToDelete.length > 0) {
        const { error: delError } = await supabaseAdmin
          .from('ticket_tiers')
          .delete()
          .in('id', idsToDelete)
        if (delError) throw new Error(`Error eliminando tickets: ${delError.message}`)
      }
    }

    // Paso 3: upsert tiers — si falla, rollback del evento nuevo
    if (tickets.length > 0) {
      const ticketsToSave = tickets.map(t => ({ ...t, event_id: currentEventId }))
      const { error: ticketError } = await supabaseAdmin
        .from('ticket_tiers')
        .upsert(ticketsToSave)

      if (ticketError) {
        if (newlyCreatedId) {
          try { await supabaseAdmin.from('events').delete().eq('id', newlyCreatedId) } catch { /* ignorar */ }
        }
        throw new Error(`Error guardando tickets: ${ticketError.message}`)
      }
    }

    return { success: true, eventId: currentEventId }
  } catch (err: unknown) {
    // Rollback de emergencia: si se creó un evento nuevo pero algo falló después
    if (newlyCreatedId) {
      try { await supabaseAdmin.from('events').delete().eq('id', newlyCreatedId) } catch { /* ignorar */ }
    }
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return { success: false, error: msg }
  }
}
