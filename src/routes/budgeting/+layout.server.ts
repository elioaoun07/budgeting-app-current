import type { LayoutServerLoad } from './$types';
import { supabase }              from '$lib/supabaseClient';
import { getUserCategories }     from '$lib/budgeting/server/db';
import { getDefaultCategories }  from '$lib/budgeting/defaults';

/**
 * Loads
 *  • the authenticated user (or null)
 *  • all of the user’s accounts
 *  • the category list for the FIRST account, falling back to defaults
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  /* ── 1. Anonymous visitor ───────────────────────────────── */
  if (!locals.user) {
    return {
      user: null,
      initialCategories: getDefaultCategories('expense'), // generic fallback
      accounts: []
    };
  }

  /* ── 2. Fetch the user’s accounts ───────────────────────── */
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id,name,type')                  // type = 'income' | 'expense'
    .eq('user_id', locals.user.id)
    .order('inserted_at', { ascending: true });

  if (error) throw error;

  /* ── 3. Determine initial category list ─────────────────── */
  let initialCategories = getDefaultCategories(
    accounts?.[0]?.type ?? 'expense'        // if no account, use expense set
  );

  if (accounts && accounts.length) {
    const userCats = await getUserCategories(
      locals.user.id,
      accounts[0].id
    );
    if (userCats.length) initialCategories = userCats;
  }

  /* ── 4. Return data to client ───────────────────────────── */
  return {
    user: locals.user,
    initialCategories,          // array of Category
    accounts: accounts ?? []
  };
};
