// ──────────────────────────────────────────────────────────────
// src/lib/supabaseClient.ts
//
// Purpose ▸ Creates and exports a Supabase client for database and auth access.
//
// Exports ▸
//   • supabase – configured Supabase client
//
// Depends ▸
//   • @supabase/supabase-js – Supabase SDK
//   • $env/static/public – environment variables for URL and anon key
//
// Used in ▸
//   • All server/database interactions
//
// Notes   ▸ Session persistence and URL session detection are disabled.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);