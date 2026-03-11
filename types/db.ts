import type { Database } from '../database.types'

type Tables = Database['public']['Tables']

export type EventRow        = Tables['events']['Row']
export type ClubRow         = Tables['clubs']['Row']
export type ProfileRow      = Tables['profiles']['Row']
export type TicketRow       = Tables['tickets']['Row']
export type TicketTierRow   = Tables['ticket_tiers']['Row']
export type ExperienceRow   = Tables['experiences']['Row']

// Shapes que devuelven las queries con joins frecuentes
export type EventWithTiers = EventRow & {
  ticket_tiers: Pick<TicketTierRow, 'id' | 'name' | 'price' | 'total_stock' | 'sold_tickets'>[]
}

export type TicketWithRelations = TicketRow & {
  profiles: Pick<ProfileRow, 'full_name' | 'email'> | null
  ticket_tiers: Pick<TicketTierRow, 'id' | 'name' | 'price'> | null
}
