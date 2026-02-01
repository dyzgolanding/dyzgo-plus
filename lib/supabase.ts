import { createBrowserClient } from '@supabase/ssr'

// Si generas tipos con Supabase CLI, impórtalos así:
// import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Exportamos una instancia singleton para usar en Client Components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)