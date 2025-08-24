import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const password = String(formData.get('password') ?? '');
    const confirm = String(formData.get('confirm') ?? '');

    if (!password || !confirm) {
      return fail(400, { error: 'Please fill both password fields' });
    }
    if (password !== confirm) {
      return fail(400, { error: 'Passwords do not match' });
    }

    // delegate to Supabase to update the user's password
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return fail(400, { error: error.message });
    }

    // Redirect to login after successful reset
    throw redirect(303, '/login');
  }
};
