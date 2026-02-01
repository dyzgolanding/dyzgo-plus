import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'; 

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
}

const initialEventData: EventData = {
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
  accentColor: '#FF00FF',         
  
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
    showInstagram: true 
  }
}

interface EventData {
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
  socialLinks: { instagram: string; tiktok: string; website: string }
  tickets: Ticket[]
  uploaded_dbs: any[]
  ambassadors: any[]
  settings: {
    isPrivate: boolean
    absorbFee: boolean
    showRemaining: boolean
    allowMarketplace: boolean
    allowOverprice: boolean
    showInstagram: boolean
  }
}

interface EventState {
  eventData: EventData
  activeSection: 'info' | 'tickets' | 'design' | 'settings' | 'experience'
  
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

  resetEvent: () => set({ eventData: initialEventData, activeSection: 'info' }),

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
    set((state) => ({ eventData: { ...state.eventData, musicGenre: genre } }))
    const { id } = get().eventData
    if (id) {
       await supabase
        .from('events')
        .update({ music_genre: genre }) 
        .eq('id', id)
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

  // --- FUNCIÓN CORREGIDA ---
  loadEvent: async (id) => {
      // Pedimos ticket_tiers(*) para que traiga TODAS las columnas, incluida tickets_included
      const { data: event, error } = await supabase
        .from('events')
        .select(`
            *, 
            ticket_tiers(*)
        `)
        .eq('id', id)
        .single()
      
      if (error || !event) return;

      const tickets = event.ticket_tiers?.map((t: any) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          quantity: t.total_stock,
          description: t.description,
          isActive: t.is_active,
          isNominative: t.nominative,
          isGhostSoldOut: t.fake_sold,
          startDate: t.sales_start_at,
          endDate: t.sales_end_at,
          type: t.type || 'paid', 
          color: (t.type === 'courtesy') ? 'pink' : 'purple',
          
          // AQUÍ ESTABA EL ERROR: Faltaba mapear tickets_included de la BD al store
          ticketsIncluded: t.tickets_included || 1 
      })) || []

      tickets.sort((a: Ticket, b: Ticket) => a.price - b.price);

      set({
          eventData: {
              ...initialEventData,
              id: event.id,
              name: event.title,
              venue: event.club_name,
              clubId: event.club_id, 
              address: event.address || '',
              region: event.region || '',
              commune: event.commune || '',
              street: event.street || '',
              number: event.number || '',
              date: event.date,
              endDate: event.end_date || '',
              startTime: event.start_time || '',
              endTime: event.end_time || '',
              description: event.description || '',
              musicGenre: event.music_genre || '',
              coverImage: event.image_url,
              
              themeColor: event.theme_color || initialEventData.themeColor,
              themeColorEnd: event.theme_color_end || initialEventData.themeColorEnd,
              cardBackgroundColor: event.card_background_color || initialEventData.cardBackgroundColor,
              borderColor: event.border_color || initialEventData.borderColor,
              accentColor: event.accent_color || initialEventData.accentColor,

              tickets: tickets,
              settings: {
                  ...initialEventData.settings,
                  isPrivate: event.status === 'draft', 
              }
          }
      })
  },

  addTicket: async (ticket) => {
    const currentState = get().eventData;
    const tempId = uuidv4(); 

    if (currentState.id) {
        const { data } = await supabase
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
            type: ticket.type || 'paid', 
            sales_start_at: ticket.startDate ? new Date(ticket.startDate).toISOString() : null,
            sales_end_at: ticket.endDate ? new Date(ticket.endDate).toISOString() : null,
            
            // Asegúrate que al crear también se guarde
            tickets_included: ticket.ticketsIncluded || 1
          })
          .select()
          .single()

        if (data) {
            set((state) => ({
                eventData: {
                  ...state.eventData,
                  tickets: [...state.eventData.tickets, { ...ticket, id: data.id }]
                }
            }))
        }
    } else {
        set((state) => ({
            eventData: {
              ...state.eventData,
              tickets: [...state.eventData.tickets, { ...ticket, id: tempId }]
            }
        }))
    }
  },

  removeTicket: async (id) => {
    const currentState = get().eventData;
    if (currentState.id) await supabase.from('ticket_tiers').delete().eq('id', id)
    set((state) => ({
      eventData: { ...state.eventData, tickets: state.eventData.tickets.filter((t) => t.id !== id) }
    }))
  },

  updateTicket: async (id, data) => {
    const currentState = get().eventData;
    
    // Actualización local inmediata (Optimistic UI)
    set((state) => ({
      eventData: {
        ...state.eventData,
        tickets: state.eventData.tickets.map((t) => t.id === id ? { ...t, ...data } : t)
      }
    }))

    // Actualización en Base de Datos
    if (currentState.id) {
        const dbPayload: any = {}
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
        
        // Se guarda el cambio en la DB al editar
        if (data.ticketsIncluded !== undefined) dbPayload.tickets_included = data.ticketsIncluded

        await supabase.from('ticket_tiers').update(dbPayload).eq('id', id)
    }
  }
}))