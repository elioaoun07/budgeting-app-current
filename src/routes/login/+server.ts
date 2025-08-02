// ➜ src/routes/login/+server.ts
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