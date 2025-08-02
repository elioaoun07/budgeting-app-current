// src/routes/budgeting/api/accounts/+server.ts
import type { RequestHandler } from './$types';
import { json }                from '@sveltejs/kit';
import { supabase }            from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
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
  const user = locals.user;
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