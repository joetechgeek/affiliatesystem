import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Ensure the URL is valid
let validatedSupabaseUrl: string
try {
  validatedSupabaseUrl = new URL(supabaseUrl).toString()
} catch (error) {
  console.error('Invalid Supabase URL:', supabaseUrl)
  throw new Error('Invalid Supabase URL')
}

export const supabase = createClient(validatedSupabaseUrl, supabaseAnonKey)
