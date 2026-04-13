import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export interface Ticket {
  id: string
  name: string
  price: number
  quantity: number
  color: string
  description?: string
  isNominative: boolean
  dependencyId?: string
  isActive?: boolean
  isGhostSoldOut?: boolean
  startDate?: string
  endDate?: string
  type?: 'paid' | 'courtesy'
  ticketsIncluded?: number
  sold?: number
}

interface UploadedDB {
  id: string
  name: string
  url: string
}

interface Ambassador {
  id: string
  name: string
  email: string
}

export interface EventData {
  id: string | null
  name: string
  venue: string
  clubId?: string
  address: string
  region: string
  commune: string
  street: string
  number: string
  date: string
  endDate: string
  startTime: string
  endTime: string
  description: string
  category: string
  musicGenre: string
  musicTags: string[]
  prohibitedItems: string[]
  minAgeMen: number
  minAgeWomen: number
  dressCode: string
  coverImage: string | null
  themeColor: string
  themeColorEnd: string
  cardBackgroundColor: string
  borderColor: string
  accentColor: string
  borderRadius: string
  fontStyle: string
  status?: string
  socialLinks: { instagram: string; tiktok: string; website: string }
  tickets: Ticket[]
  uploaded_dbs: UploadedDB[]
  ambassadors: Ambassador[]
  settings: {
    isPrivate: boolean
    absorbFee: boolean
    showRemaining: boolean
    allowMarketplace: boolean
    allowOverprice: boolean
    showInstagram: boolean
  }
}

// Tipo para la fila de ticket_tiers de Supabase
interface TicketTierRow {
  id: string
  name: string
  price: number
  total_stock: number
  description?: string
  is_active?: boolean
  nominative?: boolean
  fake_sold?: boolean
  sales_start_at?: string
  sales_end_at?: string
  type?: string
  tickets_included?: number
  sold_tickets?: number
}

export const initialEventData: EventData = {
  id: null,
  name: '',
  venue: '',
  clubId: '',
  address: '',
  region: '',
  commune: '',
  street: '',
  number: '',
  date: '',
  endDate: '',
  startTime: '',
  endTime: '',
  description: '',
  category: 'Reggaeton',
  musicGenre: '',
  musicTags: [],
  prohibitedItems: [],
  minAgeMen: 21,
  minAgeWomen: 18,
  dressCode: 'Casual',
  socialLinks: { instagram: '', tiktok: '', website: '' },
  coverImage: null,
  themeColor: '#4a0e4d',
  themeColorEnd: '#090014',
  cardBackgroundColor: '#1a0b2e',
  borderColor: '#8A2BE2',
  accentColor: '#FF31D8',
  borderRadius: 'rounded-[2rem]',
  fontStyle: 'font-sans',
  tickets: [],
  uploaded_dbs: [],
  ambassadors: [],
  settings: {
    isPrivate: false,
    absorbFee: false,
    showRemaining: true,
    allowMarketplace: true,
    allowOverprice: false,
    showInstagram: true,
  },
}

interface EventState {
  eventData: EventData
  activeSection: 'info' | 'tickets' | 'design' | 'settings' | 'experience'
  tempFile?: File | null

  setEventName: (name: string) => void
  setEventVenue: (venue: string) => void
  setClubId: (id: string) => void
  setEventAddress: (address: string) => void
  setEventRegion: (region: string) => void
  setEventCommune: (commune: string) => void
  setEventStreet: (street: string) => void
  setEventNumber: (number: string) => void
  setEventDate: (date: string) => void
  setEventEndDate: (date: string) => void
  setEventTime: (start: string, end: string) => void
  setCategory: (category: string) => void
  setMusicGenre: (genre: string) => Promise<void>
  setExperience: (data: Partial<EventData>) => void
  setCoverImage: (url: string) => void
  setThemeColor: (color: string) => void
  setThemeColorEnd: (color: string) => void
  setCardBackgroundColor: (color: string) => void
  setBorderColor: (color: string) => void
  setAccentColor: (color: string) => void
  setBorderRadius: (radius: string) => void
  setFontStyle: (font: string) => void
  updateSettings: (settings: Partial<EventData['settings']> | Partial<EventData>) => void
  setActiveSection: (section: EventState['activeSection']) => void
  addTicket: (ticket: Omit<Ticket, 'id'>) => Promise<void>
  removeTicket: (id: string) => Promise<void>
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>
  resetEvent: () => void
  loadEvent: (id: string) => Promise<void>
}

export const useEventStore = create<EventState>((set, get) => ({
  eventData: initialEventData,
  activeSection: 'info',

  resetEvent: () => set({ eventData: initialEventData, activeSection: 'info', tempFile: null } as Partial<EventState>),

  setEventName: (name) => set((state) => ({ eventData: { ...state.eventData, name } })),
  setEventVenue: (venue) => set((state) => ({ eventData: { ...state.eventData, venue } })),
  setClubId: (clubId) => set((state) => ({ eventData: { ...state.eventData, clubId } })),
  setEventAddress: (address) => set((state) => ({ eventData: { ...state.eventData, address } })),
  setEventRegion: (region) => set((state) => ({ eventData: { ...state.eventData, region } })),
  setEventCommune: (commune) => set((state) => ({ eventData: { ...state.eventData, commune } })),
  setEventStreet: (street) => set((state) => ({ eventData: { ...state.eventData, street } })),
  setEventNumber: (number) => set((state) => ({ eventData: { ...state.eventData, number } })),
  setEventDate: (date) => set((state) => ({ eventData: { ...state.eventData, date } })),
  setEventEndDate: (endDate) => set((state) => ({ eventData: { ...state.eventData, endDate } })),
  setEventTime: (startTime, endTime) => set((state) => ({ eventData: { ...state.eventData, startTime, endTime } })),
  setCategory: (category) => set((state) => ({ eventData: { ...state.eventData, category } })),

  setMusicGenre: async (genre) => {
    const previous = get().eventData.musicGenre
    // Actualización optimista
    set((state) => ({ eventData: { ...state.eventData, musicGenre: genre } }))
    const { id } = get().eventData
    if (id) {
      const { error } = await supabase
        .from('events')
        .update({ music_genre: genre })
        .eq('id', id)
      if (error) {
        // Rollback si la DB falla
        set((state) => ({ eventData: { ...state.eventData, musicGenre: previous } }))
        console.error('[Store] setMusicGenre failed:', error.message)
      }
    }
  },

  setExperience: (data) => set((state) => ({ eventData: { ...state.eventData, ...data } })),
  setCoverImage: (coverImage) => set((state) => ({ eventData: { ...state.eventData, coverImage } })),
  setThemeColor: (color) => set((state) => ({ eventData: { ...state.eventData, themeColor: color } })),
  setThemeColorEnd: (color) => set((state) => ({ eventData: { ...state.eventData, themeColorEnd: color } })),
  setCardBackgroundColor: (color) => set((state) => ({ eventData: { ...state.eventData, cardBackgroundColor: color } })),
  setBorderColor: (color) => set((state) => ({ eventData: { ...state.eventData, borderColor: color } })),
  setAccentColor: (color) => set((state) => ({ eventData: { ...state.eventData, accentColor: color } })),
  setBorderRadius: (radius) => set((state) => ({ eventData: { ...state.eventData, borderRadius: radius } })),
  setFontStyle: (font) => set((state) => ({ eventData: { ...state.eventData, fontStyle: font } })),

  updateSettings: (newSettings) => set((state) => {
    if ('isPrivate' in newSettings || 'absorbFee' in newSettings || 'showInstagram' in newSettings) {
      return { eventData: { ...state.eventData, settings: { ...state.eventData.settings, ...newSettings } } }
    }
    return { eventData: { ...state.eventData, ...newSettings } }
  }),

  setActiveSection: (section) => set({ activeSection: section }),

  loadEvent: async (id) => {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*, ticket_tiers(*)')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!event) return

      const tickets: Ticket[] = (event.ticket_tiers as TicketTierRow[] ?? [])
        .map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          quantity: t.total_stock,
          description: t.description,
          isActive: t.is_active,
          isNominative: t.nominative ?? false,
          isGhostSoldOut: t.fake_sold,
          startDate: t.sales_start_at,
          endDate: t.sales_end_at,
          type: (t.type === 'courtesy' ? 'courtesy' : 'paid') as Ticket['type'],
          color: t.type === 'courtesy' ? 'pink' : 'purple',
          ticketsIncluded: t.tickets_included ?? 1,
          sold: t.sold_tickets,
        }))
        .sort((a, b) => a.price - b.price)

      set({
        eventData: {
          ...initialEventData,
          id: event.id,
          name: event.title,
          venue: event.club_name,
          clubId: event.club_id,
          address: event.address ?? '',
          region: event.region ?? '',
          commune: event.commune ?? '',
          street: event.street ?? '',
          number: event.number ?? '',
          date: event.date,
          endDate: event.end_date ?? '',
          startTime: event.start_time ?? '',
          endTime: event.end_time ?? '',
          description: event.description ?? '',
          musicGenre: event.music_genre ?? '',
          coverImage: event.image_url,
          themeColor: event.theme_color ?? initialEventData.themeColor,
          themeColorEnd: event.theme_color_end ?? initialEventData.themeColorEnd,
          cardBackgroundColor: event.card_background_color ?? initialEventData.cardBackgroundColor,
          borderColor: event.border_color ?? initialEventData.borderColor,
          accentColor: event.accent_color ?? initialEventData.accentColor,
          tickets,
          status: event.status ?? 'draft',
          settings: {
            ...initialEventData.settings,
            isPrivate: event.status === 'draft',
          },
        },
      })
    } catch (error) {
      console.error('[Store] loadEvent failed:', error)
    }
  },

  addTicket: async (ticket) => {
    const currentState = get().eventData

    if (currentState.id) {
      try {
        const { data, error } = await supabase
          .from('ticket_tiers')
          .insert({
            event_id: currentState.id,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price,
            total_stock: ticket.quantity,
            is_active: ticket.isActive,
            fake_sold: ticket.isGhostSoldOut,
            nominative: ticket.isNominative,
            type: ticket.type ?? 'paid',
            sales_start_at: ticket.startDate ? new Date(ticket.startDate).toISOString() : null,
            sales_end_at: ticket.endDate ? new Date(ticket.endDate).toISOString() : null,
            tickets_included: ticket.ticketsIncluded ?? 1,
          })
          .select()
          .single()

        if (error) throw error
        if (data) {
          set((state) => ({
            eventData: {
              ...state.eventData,
              tickets: [...state.eventData.tickets, { ...ticket, id: data.id }],
            },
          }))
        }
      } catch (error) {
        console.error('[Store] addTicket failed:', error)
      }
    } else {
      // Sin evento guardado aún: solo actualiza estado local
      set((state) => ({
        eventData: {
          ...state.eventData,
          tickets: [...state.eventData.tickets, { ...ticket, id: uuidv4() }],
        },
      }))
    }
  },

  removeTicket: async (id) => {
    const previousTickets = get().eventData.tickets
    // Actualización optimista
    set((state) => ({
      eventData: { ...state.eventData, tickets: state.eventData.tickets.filter((t) => t.id !== id) },
    }))
    if (get().eventData.id) {
      const { error } = await supabase.from('ticket_tiers').delete().eq('id', id)
      if (error) {
        // Rollback
        set((state) => ({ eventData: { ...state.eventData, tickets: previousTickets } }))
        console.error('[Store] removeTicket failed:', error.message)
      }
    }
  },

  updateTicket: async (id, data) => {
    const previousTickets = get().eventData.tickets
    // Actualización optimista
    set((state) => ({
      eventData: {
        ...state.eventData,
        tickets: state.eventData.tickets.map((t) => (t.id === id ? { ...t, ...data } : t)),
      },
    }))

    if (get().eventData.id) {
      const dbPayload: Partial<{
        name: string
        price: number
        total_stock: number
        is_active: boolean
        fake_sold: boolean
        nominative: boolean
        description: string
        sales_start_at: string | null
        sales_end_at: string | null
        type: string
        tickets_included: number
      }> = {}

      if (data.name !== undefined) dbPayload.name = data.name
      if (data.price !== undefined) dbPayload.price = data.price
      if (data.quantity !== undefined) dbPayload.total_stock = data.quantity
      if (data.isActive !== undefined) dbPayload.is_active = data.isActive
      if (data.isGhostSoldOut !== undefined) dbPayload.fake_sold = data.isGhostSoldOut
      if (data.isNominative !== undefined) dbPayload.nominative = data.isNominative
      if (data.description !== undefined) dbPayload.description = data.description
      if (data.startDate !== undefined) dbPayload.sales_start_at = data.startDate ? new Date(data.startDate).toISOString() : null
      if (data.endDate !== undefined) dbPayload.sales_end_at = data.endDate ? new Date(data.endDate).toISOString() : null
      if (data.type !== undefined) dbPayload.type = data.type
      if (data.ticketsIncluded !== undefined) dbPayload.tickets_included = data.ticketsIncluded

      const { error } = await supabase.from('ticket_tiers').update(dbPayload).eq('id', id)
      if (error) {
        // Rollback
        set((state) => ({ eventData: { ...state.eventData, tickets: previousTickets } }))
        console.error('[Store] updateTicket failed:', error.message)
      }
    }
  },
}))
