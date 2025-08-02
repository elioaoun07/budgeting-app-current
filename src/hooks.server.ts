// ➜ src/hooks.server.ts
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
