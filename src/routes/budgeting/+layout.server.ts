// src/routes/budgeting/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { supabase }             from '$lib/supabaseClient';
import { getUserCategoryPrefs } from '$lib/budgeting/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      user: null,
      initialPrefs: { added: [], removed: [], order: [] },
      accounts: []
    };
  }

  const initialPrefs = await getUserCategoryPrefs(locals.user.id);

  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id,name,type')
    .eq('user_id', locals.user.id)
    .order('inserted_at', { ascending: true });

  if (error) throw error;

  return {
    user: locals.user,
    initialPrefs,
    accounts: accounts ?? []
  };
};
