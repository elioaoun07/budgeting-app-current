// src/hooks.server.ts

import type { Handle } from '@sveltejs/kit';
import { getUser }       from '$lib/budgeting/server/sessions';    // in-memory sessions
import { verifyToken }   from '$lib/budgeting/server/auth';                  // JWT helpers
// import { getUserBySession, getUserByJwtSub } from '$lib/budgeting/server/db'; // real-DB access (uncomment when ready)
import { redirect }      from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // 1) Try JWT‐based login first
  const jwtToken = event.cookies.get('session_jwt');
  if (jwtToken) {
    try {
      const payload = verifyToken(jwtToken);

      // ----- In-memory / JWT fallback logic (keep this for now) -----
      event.locals.user = { id: payload.sub };

      // ----- Real-DB alternative: uncomment when you have a DB -----
      // const user = await getUserByJwtSub(payload.sub);
      // event.locals.user = user ? { id: user.id } : null;

    } catch {
      event.locals.user = null;
      event.cookies.delete('session_jwt');
    }
  } else {
    // 2) Fallback to cookie session lookup
    const sessionId = event.cookies.get('session');
    const username  = getUser(sessionId);  // in-memory stub
    event.locals.user = username
      ? { id: username }
      : null;

    // ----- Real-DB alternative: uncomment when you have a DB -----
    // const user = sessionId
    //   ? await getUserBySession(sessionId)
    //   : null;
    // event.locals.user = user ? { id: user.id } : null;
  }

  // 3) Protect routes
  const { pathname } = event.url;
  const publicPaths  = ['/login', '/favicon.ico', '/manifest.webmanifest'];
  const isPublic     = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!event.locals.user && !isPublic) {
    throw redirect(302, '/login');
  }
  if (event.locals.user && pathname === '/login') {
    throw redirect(302, '/budgeting');
  }

  return resolve(event);
};