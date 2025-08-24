// ➜ src/hooks.server.ts
// ──────────────────────────────────────────────────────────────
// Purpose ▸ SvelteKit server hook for authentication and route protection.
//            Loads user from Supabase session tokens, sets event.locals.user,
//            and redirects based on authentication state.
//
// Depends ▸
//   • @sveltejs/kit – SvelteKit types and redirect
//   • $lib/supabaseClient – Supabase client
//
// Used in ▸
//   • All server requests (route protection, user loading)
//
// Notes   ▸ Redirects unauthenticated users from /budgeting to /login.
//           Redirects authenticated users away from /login.
// ──────────────────────────────────────────────────────────────

import type { Handle }     from '@sveltejs/kit';
import { supabase }        from '$lib/supabaseClient';
import { redirect }        from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const accessToken  = event.cookies.get('sb-access-token');
  const refreshToken = event.cookies.get('sb-refresh-token');

  if (accessToken && refreshToken) {
    // tell the client library about our two tokens
    await supabase.auth.setSession({
      access_token:  accessToken,
      refresh_token: refreshToken
    });

    // fetch the user associated with that session
    const { data: { user }, error } = await supabase.auth.getUser();
    event.locals.user = error ? null : user;
  } else {
    event.locals.user = null;
  }

  const url = event.url.pathname;
  if (!event.locals.user && url.startsWith('/budgeting')) {
    throw redirect(303, '/login');
  }
  if (event.locals.user && url === '/login') {
    throw redirect(303, '/budgeting');
  }

  return resolve(event);
};
