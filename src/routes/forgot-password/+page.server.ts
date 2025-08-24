import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export const actions: Actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();

    if (!email) {
      return fail(400, { error: 'Email required' });
    }

    // reset link will point to /reset-password page in your app
    const redirectTo = `${url.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      return fail(400, { error: error.message, email });
    }

    return { message: 'Reset link sent! Please check your email.', email };
  }
};
