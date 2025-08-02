// src/routes/budgeting/api/user/categories/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json, error as kitError } from '@sveltejs/kit';
import {
  getUserCategoryPrefs,
  saveUserCategoryPrefs
} from '$lib/budgeting/server/db';

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return new Response(null, { status: 401 });
  const accountId = url.searchParams.get('accountId');
  if (!accountId) throw kitError(400, 'Missing accountId');
  const prefs = await getUserCategoryPrefs(locals.user.id, accountId);
  return json(prefs);
};

export const POST: RequestHandler = async ({ url, locals, request }) => {
  if (!locals.user) return new Response(null, { status: 401 });
  const accountId = url.searchParams.get('accountId');
  if (!accountId) throw kitError(400, 'Missing accountId');
  const prefs = await request.json();
  await saveUserCategoryPrefs(locals.user.id, accountId, prefs);
  return new Response(null, { status: 204 });
};
