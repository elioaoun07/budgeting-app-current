import type { RequestHandler } from '@sveltejs/kit';
import { destroy } from '$lib/budgeting/server/sessions';

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('session');
  if (sessionId) destroy(sessionId);
  cookies.delete('session',     { path: '/' });
  cookies.delete('session_jwt', { path: '/' });
  return new Response(null, { status: 204 });
};