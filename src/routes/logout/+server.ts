// ──────────────────────────────────────────────────────────────
// src/routes/logout/+server.ts
//
// Purpose ▸ Handles logout requests for xPENDING budgeting app.
//            Destroys the user's session and removes session cookies.
//
// Exports ▸
//   • POST – logs out the user and clears session cookies
//
// Depends ▸
//   • $lib/budgeting/server/sessions – destroy
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Logout endpoint
//
// Notes   ▸ Deletes session and JWT cookies. Returns 204 on success.
// ──────────────────────────────────────────────────────────────

import type { RequestHandler } from '@sveltejs/kit';
import { destroy } from '../../lib/budgeting/server/sessions';

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('session');
  if (sessionId) destroy(sessionId);
  // server-side app session cookies
  cookies.delete('session',     { path: '/' });
  cookies.delete('session_jwt', { path: '/' });
  // Supabase auth cookies used by hooks.server.ts — remove them so the server
  // does not recreate a user session on the next request.
  try {
    cookies.delete('sb-access-token',  { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
  } catch (e) {
    // ignore — deletion is best-effort
    console.warn('Failed to delete sb- cookies during logout', e);
  }
  return new Response(null, { status: 204 });
};