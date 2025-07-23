import type { RequestHandler } from '@sveltejs/kit';
import { getUserIdFromLocals }   from '$lib/budgeting/server/auth';
import { getUserCategoryPrefs, saveUserCategoryPrefs }
  from '$lib/budgeting/server/db';

export const GET: RequestHandler = async ({ locals }) => {
  const userId = getUserIdFromLocals(locals);
  if (!userId) return new Response(null, { status: 401 });
  const prefs = await getUserCategoryPrefs(userId);
  return new Response(JSON.stringify(prefs), { status: 200 });
};

export const POST: RequestHandler = async ({ locals, request }) => {
  const userId = getUserIdFromLocals(locals);
  if (!userId) return new Response(null, { status: 401 });
  const prefs = await request.json();
  await saveUserCategoryPrefs(userId, prefs);
  return new Response(null, { status: 204 });
};