'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthenticatedUser, verifyEventOwnership } from '@/lib/supabase-server'

export async function getStaffScans(eventId: string, staffIds: string[]) {
  try {
    // Verificar sesión activa y ownership del evento
    const user = await getAuthenticatedUser()
    await verifyEventOwnership(eventId, user.id)

    const { data, error } = await supabaseAdmin
      .from('scans')
      .select('staff_id, created_at')
      .in('staff_id', staffIds)
      .eq('event_id', eventId)

    if (error) {
      console.error('[getStaffScans]', error.message)
      return []
    }

    return data ?? []
  } catch (err: unknown) {
    console.error('[getStaffScans] auth error:', err instanceof Error ? err.message : err)
    return []
  }
}
