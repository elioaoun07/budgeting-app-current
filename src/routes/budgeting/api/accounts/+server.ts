// ──────────────────────────────────────────────────────────────
// src/routes/budgeting/api/accounts/+server.ts
//
// Purpose ▸ API endpoints for fetching and creating user accounts.
//            Handles GET (list accounts) and POST (create account) requests.
//
// Exports ▸
//   • GET  – returns array of accounts for the current user
//   • POST – creates a new account for the current user
//
// Depends ▸
//   • $lib/supabaseClient – Supabase client
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Budgeting dashboard (account management)
//
// Notes   ▸ Requires user authentication via locals.user.
// ──────────────────────────────────────────────────────────────

import type { RequestHandler } from './$types';
import { json }                from '@sveltejs/kit';
import { supabase }            from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ locals }) => {
  const user = (locals as any).user;
  if (!user) {
    // no user → empty list
    return json([], { status: 200 });
  }
    const { data, error } = await supabase
    .from('accounts')
    .select('id,name,type')
    .eq('user_id', user.id)
    .order('inserted_at', { ascending: true });

  if (error) {
    console.error('Could not load accounts:', error);
    return json({ error: error.message }, { status: 500 });
  }

  return json(data, { status: 200 });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const { name, type } = await request.json();

  const { data, error } = await supabase
    .from('accounts')
    .insert({ user_id: user.id, name, type })
    .select('id,name,type')
    .single();

  if (error) {
    console.error('Could not create account:', error);
    return json({ error: error.message }, { status: 400 });
  }

  return json(data, { status: 201 });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, name } = body || {};
  if (!id || typeof name !== 'string') {
    return json({ error: 'Missing id or name' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('accounts')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,name,type')
    .single();

  if (error) {
    console.error('Could not update account:', error);
    return json({ error: error.message }, { status: 400 });
  }

  return json(data, { status: 200 });
};