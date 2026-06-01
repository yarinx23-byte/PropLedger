import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.error(
    'Missing Supabase env vars. Create a .env file in the project root with ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
  )
}

// Only build a real client when configured; otherwise leave it null so the app
// can render a setup screen instead of crashing on an invalid URL.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
