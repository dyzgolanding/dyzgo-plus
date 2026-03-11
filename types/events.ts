// Tipos compartidos del dominio de eventos en DYZGO

/** Item en la lista de eventos (shape de la respuesta de Supabase) */
export interface EventListItem {
  id: string
  created_at: string
  name: string
  venue: string
  date: string
  end_time: string
  cover_image: string
  status: string
  tickets: EventListTicket[]
}

export interface EventListTicket {
  quantity: number
  quantity_sold: number
}

/** Props para la tarjeta de evento en la lista */
export interface EventCardProps {
  id: string
  title: string
  date: string
  location: string
  image: string
  status: string
  sold: number
  total: number
  canEdit: boolean
}
