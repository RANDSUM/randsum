import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? 'https://rcownsizpvjkzkgfcloe.supabase.co'
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY']

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set this in your .env file or EAS secrets.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
