'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function geocodeAllEvents(): Promise<{ updated: number; failed: number; skipped: number }> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!apiKey) throw new Error('No Google Maps API key configured')

  const { data: events, error } = await supabaseAdmin
    .from('events')
    .select('id, street, street_number, commune, region, location')
    .or('latitude.is.null,longitude.is.null')

  if (error) throw new Error(error.message)
  if (!events || events.length === 0) return { updated: 0, failed: 0, skipped: 0 }

  let updated = 0, failed = 0, skipped = 0

  for (const event of events) {
    const parts = [
      [event.street, event.street_number].filter(Boolean).join(' '),
      event.commune,
      event.region,
    ].filter(Boolean)

    const address = parts.length > 0 ? parts.join(', ') : (event.location || '')
    if (!address) { skipped++; continue }

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ', Chile')}&key=${apiKey}`
      )
      const data = await res.json()
      const loc = data?.results?.[0]?.geometry?.location

      if (!loc) { failed++; continue }

      await supabaseAdmin
        .from('events')
        .update({ latitude: loc.lat, longitude: loc.lng })
        .eq('id', event.id)

      updated++
    } catch {
      failed++
    }

    // Pequeña pausa para no saturar la API
    await new Promise(r => setTimeout(r, 80))
  }

  return { updated, failed, skipped }
}
