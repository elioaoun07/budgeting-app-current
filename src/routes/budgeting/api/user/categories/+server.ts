// ──────────────────────────────────────────────────────────────
// src/routes/budgeting/api/user/categories/+server.ts
//
// Purpose ▸ API endpoints for fetching and saving the user's budget categories.
//            Handles GET (list categories) and POST (overwrite categories) requests.
//
// Exports ▸
//   • GET  – returns array of categories for the current user/account
//   • POST – overwrites all categories for the current user/account
//
// Depends ▸
//   • $lib/budgeting/server/db – getUserCategories, saveUserCategories
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Budgeting dashboard (category management)
//
// Notes   ▸ Requires user authentication via locals.user. Throws 400 on missing accountId.
// ──────────────────────────────────────────────────────────────

import type { RequestHandler } from '@sveltejs/kit';
import { json, error as kitErr } from '@sveltejs/kit';
import { getUserCategories, saveUserCategories }
  from '$lib/budgeting/server/db';

/* GET → entire list or [] */
export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) return new Response(null, { status: 401 });

  const accountId = url.searchParams.get('accountId');
  if (!accountId) throw kitErr(400, 'Missing accountId');

  const cats = await getUserCategories(locals.user.id, accountId);
  return json(cats);
};

/* POST → overwrite entire list */
export const POST: RequestHandler = async ({ locals, url, request }) => {
  if (!locals.user) return new Response(null, { status: 401 });

  const accountId = url.searchParams.get('accountId');
  if (!accountId) throw kitErr(400, 'Missing accountId');

  const categories = await request.json();       // expect array
  await saveUserCategories(locals.user.id, accountId, categories);
  return new Response(null, { status: 204 });
};
