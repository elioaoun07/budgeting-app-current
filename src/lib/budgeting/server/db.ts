import { supabase } from '$lib/supabaseClient';
import type { Category } from '$lib/budgeting/defaults';

/* ─────────────── Types ─────────────── */
export type UserCategories = Category[];   // whole list

/* ───────── Fetch full list ───────── */
export async function getUserCategories(
  userId: string,
  accountId: string
): Promise<UserCategories> {
  const { data, error } = await supabase
    .from('user_category_prefs')
    .select('categories')
    .eq('user_id',    userId)
    .eq('account_id', accountId)
    .single();                  // row or none

  if (error && error.code !== 'PGRST116') throw error; // 116 = no row

  return data?.categories ?? [];          // empty → use defaults
}

/* ───────── Upsert full list ───────── */
export async function saveUserCategories(
  userId: string,
  accountId: string,
  categories: UserCategories
) {
  const { error } = await supabase
    .from('user_category_prefs')
    .upsert(
      { user_id: userId, account_id: accountId, categories },
      { onConflict: ['user_id', 'account_id'] }
    );

  if (error) throw error;
}
