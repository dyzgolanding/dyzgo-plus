'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser, verifyEventOwnership } from '@/lib/supabase-server'

export interface CourtesyDrinkItem {
  item_id: string
  quantity: number
}

export interface CourtesyDrinkResult {
  success: boolean
  order_id?: string
  total_items?: number
  error?: string
}

export async function sendCourtesyDrinks(
  eventId: string,
  guestEmail: string,
  guestName: string,
  items: CourtesyDrinkItem[]
): Promise<CourtesyDrinkResult> {
  try {
    const user = await getAuthenticatedUser()
    await verifyEventOwnership(eventId, user.id)

    if (!items.length) return { success: false, error: 'Selecciona al menos un ítem.' }
    if (!guestName.trim()) return { success: false, error: 'El nombre del destinatario es obligatorio.' }

    // El destinatario debe tener cuenta en DyzGO (user_id NOT NULL en consumption_orders)
    let recipientUserId: string | null = null
    if (guestEmail.trim()) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', guestEmail.toLowerCase().trim())
        .maybeSingle()
      if (profile?.id) recipientUserId = profile.id
    }

    if (!recipientUserId) {
      return { success: false, error: 'El destinatario no tiene cuenta en DyzGO. Solo se pueden enviar cortesías a usuarios registrados.' }
    }

    // Verificar los ítems desde la DB (no confiar en el cliente)
    const itemIds = items.map(i => i.item_id)
    const { data: menuItems, error: itemsError } = await supabaseAdmin
      .from('consumption_items')
      .select('id, name, price')
      .in('id', itemIds)
      .eq('event_id', eventId)
      .eq('is_available', true)

    if (itemsError || !menuItems?.length) {
      return { success: false, error: 'No se pudieron verificar los ítems seleccionados.' }
    }

    const itemMap = Object.fromEntries(menuItems.map(i => [i.id, i]))

    // Crear la orden con order_type = 'courtesy'
    const orderId = crypto.randomUUID()
    const { error: orderError } = await supabaseAdmin
      .from('consumption_orders')
      .insert({
        id: orderId,
        event_id: eventId,
        user_id: recipientUserId,
        total_amount: 0,
        status: 'paid',
        order_type: 'courtesy',
        guest_email: guestEmail.trim() || null,
        guest_name: guestName.trim() || null,
        payment_buy_order: `COURTESY-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
      })

    if (orderError) return { success: false, error: orderError.message }

    // Crear los ítems (uno por unidad)
    const orderItems = items.flatMap(({ item_id, quantity }) => {
      const menuItem = itemMap[item_id]
      if (!menuItem) return []
      return Array.from({ length: quantity }, () => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        item_id,
        item_name: menuItem.name,
        unit_price: menuItem.price,
        status: 'inactive',
      }))
    })

    const { error: itemsInsertError } = await supabaseAdmin
      .from('consumption_order_items')
      .insert(orderItems)

    if (itemsInsertError) {
      await supabaseAdmin.from('consumption_orders').delete().eq('id', orderId)
      return { success: false, error: itemsInsertError.message }
    }

    // Notificar al receptor si tiene cuenta en DyzGO
    if (recipientUserId) {
      const SBURL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SBKEY = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (SBURL && SBKEY) {
        fetch(`${SBURL}/functions/v1/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SBKEY}`,
          },
          body: JSON.stringify({
            user_id: recipientUserId,
            type: 'consumption_courtesy',
            title: '🥂 ¡Recibiste tragos de cortesía!',
            message: `Tenés ${orderItems.length} bebida${orderItems.length !== 1 ? 's' : ''} esperándote. Abrí DyzGO para activarlas en la barra.`,
            related_id: orderId,
          }),
        }).catch(console.error)
      }
    }

    return { success: true, order_id: orderId, total_items: orderItems.length }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
