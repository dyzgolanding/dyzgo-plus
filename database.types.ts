export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string | null
          id: string
          subtitle: string | null
          title: string
          type: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          subtitle?: string | null
          title: string
          type: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          subtitle?: string | null
          title?: string
          type?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist: {
        Row: {
          created_at: string
          email: string | null
          event_context: string | null
          id: string
          name: string
          org_id: string
          reason: string | null
          rut: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_context?: string | null
          id?: string
          name: string
          org_id: string
          reason?: string | null
          rut?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_context?: string | null
          id?: string
          name?: string
          org_id?: string
          reason?: string | null
          rut?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      clubs: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image: string | null
          instagram: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          image?: string | null
          instagram?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          image?: string | null
          instagram?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string | null
        }
        Relationships: []
      }
      event_alerts: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_alerts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          access_code: string
          created_at: string
          event_id: string
          id: string
          is_active: boolean | null
          name: string
          role: string | null
        }
        Insert: {
          access_code: string
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean | null
          name: string
          role?: string | null
        }
        Update: {
          access_code?: string
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          ambassadors: Json | null
          block_mass_ips: boolean | null
          category: string | null
          club_id: number | null
          club_name: string | null
          commune: string | null
          created_at: string | null
          date: string
          description: string | null
          dress_code: string | null
          end_date: string | null
          end_time: string | null
          experience_id: string | null
          hour: string
          id: string
          image_url: string | null
          instagram_url: string | null
          is_active: boolean | null
          is_resellable: boolean | null
          is_transferable: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          max_tickets_per_person: number | null
          min_age_men: number | null
          min_age_women: number | null
          music_genre: string | null
          organizer_id: string
          price: number | null
          prohibited_items: string[] | null
          region: string | null
          require_rut: boolean | null
          status: string | null
          street: string | null
          street_number: string | null
          theme_color: string | null
          ticket_custom_message: string | null
          title: string
          uploaded_dbs: Json | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          ambassadors?: Json | null
          block_mass_ips?: boolean | null
          category?: string | null
          club_id?: number | null
          club_name?: string | null
          commune?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          dress_code?: string | null
          end_date?: string | null
          end_time?: string | null
          experience_id?: string | null
          hour: string
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_resellable?: boolean | null
          is_transferable?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          max_tickets_per_person?: number | null
          min_age_men?: number | null
          min_age_women?: number | null
          music_genre?: string | null
          organizer_id: string
          price?: number | null
          prohibited_items?: string[] | null
          region?: string | null
          require_rut?: boolean | null
          status?: string | null
          street?: string | null
          street_number?: string | null
          theme_color?: string | null
          ticket_custom_message?: string | null
          title: string
          uploaded_dbs?: Json | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          ambassadors?: Json | null
          block_mass_ips?: boolean | null
          category?: string | null
          club_id?: number | null
          club_name?: string | null
          commune?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          dress_code?: string | null
          end_date?: string | null
          end_time?: string | null
          experience_id?: string | null
          hour?: string
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_resellable?: boolean | null
          is_transferable?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_tickets_per_person?: number | null
          min_age_men?: number | null
          min_age_women?: number | null
          music_genre?: string | null
          organizer_id?: string
          price?: number | null
          prohibited_items?: string[] | null
          region?: string | null
          require_rut?: boolean | null
          status?: string | null
          street?: string | null
          street_number?: string | null
          theme_color?: string | null
          ticket_custom_message?: string | null
          title?: string
          uploaded_dbs?: Json | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_collaborators: {
        Row: {
          can_edit_events: boolean | null
          can_manage_money: boolean | null
          can_scan_tickets: boolean | null
          can_view_stats: boolean | null
          created_at: string | null
          experience_id: string | null
          id: string
          role: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          can_edit_events?: boolean | null
          can_manage_money?: boolean | null
          can_scan_tickets?: boolean | null
          can_view_stats?: boolean | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          can_edit_events?: boolean | null
          can_manage_money?: boolean | null
          can_scan_tickets?: boolean | null
          can_view_stats?: boolean | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_collaborators_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          account_number: string | null
          account_type: string | null
          bank_email: string | null
          bank_holder_name: string | null
          bank_name: string | null
          bank_rut: string | null
          banner_url: string | null
          billing_address: string | null
          billing_city: string | null
          billing_email: string | null
          billing_name: string | null
          billing_rut: string | null
          created_at: string | null
          description: string | null
          id: string
          instagram_handle: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          producer_id: string
          website_url: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          bank_email?: string | null
          bank_holder_name?: string | null
          bank_name?: string | null
          bank_rut?: string | null
          banner_url?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_rut?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          producer_id: string
          website_url?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          bank_email?: string | null
          bank_holder_name?: string | null
          bank_name?: string | null
          bank_rut?: string | null
          banner_url?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_rut?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          producer_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_invites: {
        Row: {
          created_at: string | null
          id: string
          is_used: boolean | null
          sender_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          sender_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          sender_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_invites_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          related_id: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_id?: string | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_id?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          concept: string | null
          created_at: string | null
          experience_id: string | null
          id: string
          status: string | null
        }
        Insert: {
          amount: number
          concept?: string | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          amount?: number
          concept?: string | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      producers: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          expo_push_token: string | null
          full_name: string | null
          gender: string | null
          id: string
          instagram_username: string | null
          level: number | null
          music_preferences: string[] | null
          organization_name: string | null
          party_frequency: string | null
          premium_interested: boolean | null
          role: string | null
          rut: string | null
          staff_code: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          instagram_username?: string | null
          level?: number | null
          music_preferences?: string[] | null
          organization_name?: string | null
          party_frequency?: string | null
          premium_interested?: boolean | null
          role?: string | null
          rut?: string | null
          staff_code?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          instagram_username?: string | null
          level?: number | null
          music_preferences?: string[] | null
          organization_name?: string | null
          party_frequency?: string | null
          premium_interested?: boolean | null
          role?: string | null
          rut?: string | null
          staff_code?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      queue_reports: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string | null
          vibe_level: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id?: string | null
          vibe_level: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string | null
          vibe_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "queue_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_listings: {
        Row: {
          bank_data: Json | null
          created_at: string
          current_highest_bid: number | null
          id: string
          price: number
          reserved_for_user_id: string | null
          reserved_until: string | null
          seller_id: string
          sold_at: string | null
          status: string
          ticket_id: string | null
        }
        Insert: {
          bank_data?: Json | null
          created_at?: string
          current_highest_bid?: number | null
          id?: string
          price: number
          reserved_for_user_id?: string | null
          reserved_until?: string | null
          seller_id: string
          sold_at?: string | null
          status?: string
          ticket_id?: string | null
        }
        Update: {
          bank_data?: Json | null
          created_at?: string
          current_highest_bid?: number | null
          id?: string
          price?: number
          reserved_for_user_id?: string | null
          reserved_until?: string | null
          seller_id?: string
          sold_at?: string | null
          status?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resale_listings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_offers: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          offered_price: number
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          offered_price: number
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          offered_price?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "resale_offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resale_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "resale_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      resale_transactions: {
        Row: {
          amount: number | null
          buy_order: string | null
          buyer_id: string | null
          created_at: string | null
          id: string
          listing_id: string | null
          status: string | null
          token_ws: string | null
        }
        Insert: {
          amount?: number | null
          buy_order?: string | null
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          status?: string | null
          token_ws?: string | null
        }
        Update: {
          amount?: number | null
          buy_order?: string | null
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          status?: string | null
          token_ws?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resale_transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "resale_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_clubs: {
        Row: {
          club_id: number | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          club_id?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          club_id?: number | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_clubs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_events: {
        Row: {
          event_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          user_id: string
        }
        Update: {
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          created_at: string | null
          event_id: string | null
          event_name: string | null
          id: string
          result_message: string | null
          scanned_at: string
          staff_code: string | null
          staff_id: string | null
          ticket_id: string | null
          ticket_type_name: string | null
          valid: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          result_message?: string | null
          scanned_at?: string
          staff_code?: string | null
          staff_id?: string | null
          ticket_id?: string | null
          ticket_type_name?: string | null
          valid?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          result_message?: string | null
          scanned_at?: string
          staff_code?: string | null
          staff_id?: string | null
          ticket_id?: string | null
          ticket_type_name?: string | null
          valid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "event_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          email: string
          event_id: string | null
          experience_id: string | null
          id: string
          role: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          event_id?: string | null
          experience_id?: string | null
          id?: string
          role: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_id?: string | null
          experience_id?: string | null
          id?: string
          role?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          end_hour: string | null
          event_id: string | null
          fake_sold: boolean | null
          hour_start: string | null
          id: string
          is_active: boolean | null
          low_stock_alert_sent: boolean | null
          name: string
          nominative: boolean | null
          price: number
          promo_type: string | null
          sales_end_at: string | null
          sales_start_at: string | null
          sold_tickets: number
          tickets_included: number | null
          total_stock: number
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_hour?: string | null
          event_id?: string | null
          fake_sold?: boolean | null
          hour_start?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_alert_sent?: boolean | null
          name: string
          nominative?: boolean | null
          price: number
          promo_type?: string | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          sold_tickets?: number
          tickets_included?: number | null
          total_stock: number
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_hour?: string | null
          event_id?: string | null
          fake_sold?: boolean | null
          hour_start?: string | null
          id?: string
          is_active?: boolean | null
          low_stock_alert_sent?: boolean | null
          name?: string
          nominative?: boolean | null
          price?: number
          promo_type?: string | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          sold_tickets?: number
          tickets_included?: number | null
          total_stock?: number
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_transfers: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          sender_id: string | null
          ticket_id: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          sender_id?: string | null
          ticket_id?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          sender_id?: string | null
          ticket_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_transfers_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_transfers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          buy_order: string | null
          created_at: string | null
          currency: string | null
          event_id: string
          expires_at: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          paid_price: number | null
          promoter_code: string | null
          purchase_date: string | null
          purchase_price: number | null
          purchased_at: string | null
          qr_hash: string
          scanned_at: string | null
          session_id: string | null
          status: string | null
          ticket_type: string | null
          tier_id: string | null
          used: boolean | null
          user_id: string | null
          user_rut: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          buy_order?: string | null
          created_at?: string | null
          currency?: string | null
          event_id: string
          expires_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id: string
          paid_price?: number | null
          promoter_code?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchased_at?: string | null
          qr_hash: string
          scanned_at?: string | null
          session_id?: string | null
          status?: string | null
          ticket_type?: string | null
          tier_id?: string | null
          used?: boolean | null
          user_id?: string | null
          user_rut?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          buy_order?: string | null
          created_at?: string | null
          currency?: string | null
          event_id?: string
          expires_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          paid_price?: number | null
          promoter_code?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchased_at?: string | null
          qr_hash?: string
          scanned_at?: string | null
          session_id?: string | null
          status?: string | null
          ticket_type?: string | null
          tier_id?: string | null
          used?: boolean | null
          user_id?: string | null
          user_rut?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_payment_methods: {
        Row: {
          card_number: string | null
          card_type: string | null
          created_at: string
          id: string
          is_default: boolean | null
          tbk_user: string
          user_id: string
        }
        Insert: {
          card_number?: string | null
          card_type?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          tbk_user: string
          user_id: string
        }
        Update: {
          card_number?: string | null
          card_type?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          tbk_user?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      friends_view: {
        Row: {
          friend_id: string | null
          user_id: string | null
        }
        Insert: {
          friend_id?: string | null
          user_id?: string | null
        }
        Update: {
          friend_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_friend_request: {
        Args: { request_from_id: string }
        Returns: undefined
      }
      accept_resale_offer:
        | {
            Args: {
              p_listing_id: string
              p_offer_id: string
              p_seller_id: string
            }
            Returns: undefined
          }
        | { Args: { p_offer_id: string }; Returns: Json }
      accept_resale_offer_secure: {
        Args: { p_offer_id: string }
        Returns: undefined
      }
      accept_team_invitation: { Args: { row_id: string }; Returns: undefined }
      add_experience: {
        Args: { amount: number; user_uuid: string }
        Returns: undefined
      }
      buy_resale_ticket: {
        Args: { p_buyer_id: string; p_listing_id: string }
        Returns: Json
      }
      buy_ticket_transfer:
        | {
            Args: {
              p_buyer_id: string
              p_listing_id: string
              p_new_qr_hash: string
              p_ticket_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_buyer_id: string
              p_listing_id: string
              p_new_qr_hash: string
              p_new_ticket_id: string
              p_ticket_id: string
            }
            Returns: undefined
          }
      calculate_level: { Args: { xp_value: number }; Returns: number }
      calculate_level_from_xp: { Args: { xp: number }; Returns: number }
      cancel_resale_listing: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      check_user_ban: { Args: { event_uuid: string }; Returns: boolean }
      claim_ticket: {
        Args: { p_new_owner_id: string; p_token: string }
        Returns: Json
      }
      claim_ticket_transfer:
        | { Args: { p_new_owner_id: string; p_token: string }; Returns: Json }
        | { Args: { transfer_token: string }; Returns: Json }
      claim_ticket_via_link: {
        Args: { p_ticket_id: string; p_token: string }
        Returns: undefined
      }
      cleanup_expired_reservations: { Args: never; Returns: undefined }
      confirm_assistance: {
        Args: { user_id: string; xp_reward: number }
        Returns: undefined
      }
      create_resale_offer: {
        Args: {
          p_buyer_id: string
          p_listing_id: string
          p_offered_price: number
        }
        Returns: undefined
      }
      delete_old_notifications: { Args: never; Returns: undefined }
      delete_own_user:
        | { Args: never; Returns: undefined }
        | { Args: { p_reason: string }; Returns: undefined }
      delete_user_account: {
        Args: { delete_reason?: string }
        Returns: undefined
      }
      execute_direct_purchase: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      execute_resale_transfer: {
        Args: { p_buy_order: string }
        Returns: undefined
      }
      get_daily_sales: {
        Args: { days_lookback: number; event_uuid: string }
        Returns: {
          date_day: string
          ticket_count: number
          total_revenue: number
        }[]
      }
      get_event_analytics: { Args: { p_event_id: string }; Returns: Json }
      get_event_demographics: {
        Args: { target_event_id: string }
        Returns: {
          age_range: string
          count: number
          gender_group: string
        }[]
      }
      get_event_flow_status: {
        Args: { target_event_id: string }
        Returns: Json
      }
      get_friends_at_event: {
        Args: { current_user_id: string; event_lookup_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_level_from_xp: { Args: { xp: number }; Returns: number }
      get_my_friends: {
        Args: { current_user_id: string }
        Returns: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          expo_push_token: string | null
          full_name: string | null
          gender: string | null
          id: string
          instagram_username: string | null
          level: number | null
          music_preferences: string[] | null
          organization_name: string | null
          party_frequency: string | null
          premium_interested: boolean | null
          role: string | null
          rut: string | null
          staff_code: string | null
          username: string | null
          xp: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_profile_by_email: {
        Args: { email_input: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_scan_velocity: {
        Args: { range_minutes?: number; target_event_id: string }
        Returns: {
          bucket_time: string
          scan_count: number
        }[]
      }
      get_top_customers: {
        Args: { org_uuid: string }
        Returns: {
          customer_email: string
          customer_name: string
          last_purchase: string
          tickets_bought: number
          total_spent: number
        }[]
      }
      increment_event_views: { Args: { event_id: string }; Returns: undefined }
      instant_friend_connection: {
        Args: { new_friend_id: string }
        Returns: undefined
      }
      is_experience_owner: {
        Args: { target_experience_id: string }
        Returns: boolean
      }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      issue_courtesy_ticket: {
        Args: {
          p_event_id: string
          p_guest_email: string
          p_guest_name: string
          p_producer_id: string
          p_quantity: number
          p_ticket_type?: string
        }
        Returns: {
          buy_order: string | null
          created_at: string | null
          currency: string | null
          event_id: string
          expires_at: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          paid_price: number | null
          promoter_code: string | null
          purchase_date: string | null
          purchase_price: number | null
          purchased_at: string | null
          qr_hash: string
          scanned_at: string | null
          session_id: string | null
          status: string | null
          ticket_type: string | null
          tier_id: string | null
          used: boolean | null
          user_id: string | null
          user_rut: string | null
          utm_medium: string | null
          utm_source: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      publish_ticket_for_resale: {
        Args: {
          p_bank_data: Json
          p_price: number
          p_seller_id: string
          p_ticket_id: string
        }
        Returns: string
      }
      purchase_ticket: {
        Args: { p_paid_price?: number; p_tier_id: string; p_user_id: string }
        Returns: Json
      }
      remove_friend: { Args: { friend_id: string }; Returns: undefined }
      reserve_ticket_atomic:
        | {
            Args: {
              p_currency: string
              p_event_id: string
              p_price: number
              p_tier_id: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_currency: string
              p_event_id: string
              p_price: number
              p_tier_id: string
              p_user_id: string
            }
            Returns: Json
          }
      rpc_analytics_attendance_flow: {
        Args: { p_event_id: string }
        Returns: {
          checkins: number
          hour: string
        }[]
      }
      rpc_analytics_funnel: {
        Args: { p_days?: number; p_event_id: string }
        Returns: {
          add_to_cart: number
          checkout: number
          conversion_cart_to_buy: number
          conversion_total: number
          day: string
          purchases: number
          views: number
        }[]
      }
      rpc_analytics_kpis: {
        Args: { p_days?: number; p_event_id?: string; p_experience_id: string }
        Returns: {
          avg_ticket: number
          conversion_rate: number
          no_show_rate: number
          potential_revenue: number
          refunded_rate: number
          revenue_net: number
          scanned_count: number
          tickets_sold: number
          total_stock: number
          unique_users: number
          visits: number
        }[]
      }
      rpc_analytics_new_users_timeseries: {
        Args: { p_days?: number; p_event_id?: string; p_experience_id: string }
        Returns: {
          day: string
          new_users: number
        }[]
      }
      rpc_analytics_sales_timeseries: {
        Args: { p_days?: number; p_event_id?: string; p_experience_id: string }
        Returns: {
          day: string
          revenue: number
          tickets_sold: number
        }[]
      }
      rpc_analytics_tiers: {
        Args: { p_event_id: string }
        Returns: {
          current_price: number
          fill_percentage: number
          name: string
          potential_remaining: number
          remaining: number
          revenue: number
          revenue_percentage: number
          sold: number
          tier_id: string
          total_stock: number
        }[]
      }
      rpc_analytics_users_list: {
        Args: { p_event_id?: string; p_experience_id: string }
        Returns: {
          customer_key: string
          email: string
          first_purchase: string
          last_purchase: string
          name: string
          tickets_count: number
          total_spent: number
          user_id: string
        }[]
      }
      rpc_dashboard_summary: {
        Args: { p_event_id: string }
        Returns: {
          attendance_count: number
          attendance_rate: number
          avg_ticket: number
          days_left: number
          occupancy_rate: number
          pace_trend: number
          revenue_net: number
          sales_today: number
          sales_yesterday: number
          sold_count: number
          total_stock: number
        }[]
      }
      scan_ticket: {
        Args: { p_qr_content: string; p_staff_code: string }
        Returns: Json
      }
      transfer_owner: {
        Args: {
          p_new_user_id: string
          p_ticket_id: string
          p_transfer_id: string
        }
        Returns: undefined
      }
      transfer_ticket_direct: {
        Args: { p_recipient_id: string; p_ticket_id: string }
        Returns: undefined
      }
      transfer_ticket_to_friend: {
        Args: { p_recipient_id: string; p_ticket_id: string }
        Returns: Json
      }
      void_ticket: { Args: { ticket_id_input: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
