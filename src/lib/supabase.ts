import { createClient } from '@supabase/supabase-js';

// Access Supabase credentials from environment variables using Vite's syntax
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// Singleton Supabase client — one instance for the entire app.
// lockAcquireTimeout omitted intentionally: the SDK default (10 000 ms) lets the
// auth lock resolve during token refresh. Setting it to 0 caused instant lock
// failures when another tab held the mutex, blocking all queries for 60 s.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'bv-auth-token',
    },
});
