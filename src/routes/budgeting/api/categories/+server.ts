// src/routes/budgeting/api/categories/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json, error as kitError } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return new Response(null, { status: 401 });
  const accountId = url.searchParams.get('accountId');
  if (!accountId) throw kitError(400, 'Missing accountId');

  const { data, error } = await supabase
    .from('categories')
    .select('name,icon,color,subs')
    .eq('user_id',    locals.user.id)
    .eq('account_id', accountId)
    .order('inserted_at', { ascending: true });

  if (error) throw kitError(500, error.message);
  return json(data ?? []);
};

export const POST: RequestHandler = async ({ url, request, locals }) => {
  if (!locals.user) return new Response(null, { status: 401 });
  const accountId = url.searchParams.get('accountId');
  if (!accountId) throw kitError(400, 'Missing accountId');

  const { name, icon, color, subs } = await request.json();
  if (!name || !icon || !color) throw kitError(400, 'Missing fields');

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id:    locals.user.id,
      account_id: accountId,
      name,
      icon,
      color,
      subs: subs ?? []
    })
    .select('name,icon,color,subs')
    .single();

  if (error) throw kitError(500, error.message);
  return json(data, { status: 201 });
};
