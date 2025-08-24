// ──────────────────────────────────────────────────────────────
// src/routes/login/+server.ts
//
// Purpose ▸ Handles login requests for xPENDING budgeting app.
//            Authenticates user with Supabase, sets session cookies, and redirects.
//
// Exports ▸
//   • POST – authenticates user and redirects to dashboard
//
// Depends ▸
//   • $lib/supabaseClient – Supabase client
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Login page
//
// Notes   ▸ Stores access/refresh tokens in cookies. Redirects on success.
// ──────────────────────────────────────────────────────────────

import type { RequestHandler } from '@sveltejs/kit';
import { json, redirect }       from '@sveltejs/kit';
import { supabase }             from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return json({ message: error.message }, { status: 400 });

  // store the two tokens Supabase gave us
  cookies.set('sb-access-token',  data.session.access_token,  { path: '/', httpOnly: true, sameSite: 'lax', secure: true });
  cookies.set('sb-refresh-token', data.session.refresh_token, { path: '/', httpOnly: true, sameSite: 'lax', secure: true });

  // redirect client into the protected area
  throw redirect(303, '/budgeting');
};