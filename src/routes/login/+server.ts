//Real DB
// import type { RequestHandler } from '@sveltejs/kit';
// import { create }          from '$lib/budgeting/server/sessions';
// import { verify, signToken } from '$lib/budgeting/server/auth';
// import { findUserByName }  from '$lib/budgeting/server/db';  // your real DB lookup

// export const POST: RequestHandler = async ({ request, cookies }) => {
//   const { username, password } = await request.json();
//   const user = await findUserByName(username);
//   if (!user || !verify(password, user.hashedPassword)) {
//     return new Response('Unauthorized', { status: 401 });
//   }

//   // In-memory session cookie
//   const sessionId = create(user.id);
//   cookies.set('session', sessionId, {
//     path: '/', httpOnly: true, sameSite: 'lax'
//   });

//   // JWT cookie (optional)
//   const token = signToken(user.id);
//   cookies.set('session_jwt', token, {
//     path: '/', httpOnly: true, secure: import.meta.env.PROD, maxAge: 60*60*24*7
//   });

//   return new Response(null, { status: 200 });
// };

// src/routes/login/+server.ts  (or +page.server.ts if using form actions)
// src/routes/login/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { create }    from '$lib/budgeting/server/sessions';
import { validate }  from '$lib/budgeting/server/users';
import { redirect }  from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { username, password } = await request.json();

  // use your JSON-backed validate() helper
  if (!validate(username, password)) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401
    });
  }

  // on success, create an in-memory session
  const sessionId = create(username);
  cookies.set('session', sessionId, {
    path:   '/',
    httpOnly: true,
    sameSite: 'lax'
  });

  // redirect into the app
  throw redirect(302, '/budgeting');
};