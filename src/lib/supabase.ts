import { createClient } from '@supabase/supabase-js';

// Access Supabase credentials from environment variables using Vite's syntax
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// Singleton Supabase client — one instance for the entire app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'bv-auth-token',
        // lockAcquireTimeout intentionally omitted:
        // With a hard limit, queries fail if the token is being refreshed (lock held).
        // Without it, queries queue and complete naturally once the lock releases (~5-15s).
    },
});
