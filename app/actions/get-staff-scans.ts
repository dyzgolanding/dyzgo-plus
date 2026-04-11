'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getStaffScans(eventId: string, staffIds: string[]) {
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
}
