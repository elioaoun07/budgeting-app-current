import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

export const load: PageServerLoad = async ({ locals }) => {
  // If you're already logged in, send to app
  if ((locals as any)?.user) {
    throw redirect(303, '/budgeting');
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const full_name = String(formData.get('full_name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const confirm = String(formData.get('confirm') ?? '');

    if (!full_name || !email || !password || !confirm) {
      return fail(400, { error: 'Please fill all fields.', full_name, email });
    }
    if (password !== confirm) {
      return fail(400, { error: 'Passwords do not match.', full_name, email });
    }
    if (password.length < 6) {
      return fail(400, { error: 'Password must be at least 6 characters.', full_name, email });
    }

    // Create Supabase auth user (email/password)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name } // stored in user_metadata
      }
    });

    if (error) {
      return fail(400, { error: error.message, full_name, email });
    }

    // Create user profile in your "profiles" table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, email, full_name }]);
      if (profileError) {
        return fail(400, { error: profileError.message, full_name, email });
      }
    }

    // If your project requires email confirmation, session will be null.
    if (data.user && !data.session) {
      return {
        message:
          'Account created. Please check your email to confirm your address, then log in.',
        email,
        full_name
      };
    }

    // If no confirmation required and session exists, just send user to login
    throw redirect(303, '/login');
  }
};
