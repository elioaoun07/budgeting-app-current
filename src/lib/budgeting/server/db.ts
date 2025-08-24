/* ──────────────────────────────────────────────────────────────
  src/lib/budgeting/server/db.ts
 
  Purpose ▸ Typed helpers that read / write the **user_category_prefs**
            table.  They are the ONE AND ONLY place in the codebase
            that should touch a user’s customised category list.
            All UI or API code must go through these helpers.
 
  Exports ▸
    • type  UserCategories        – alias = Category[]
    • func  getUserCategories()   – SELECT categories             ⇢  returns [] if none
    • func  saveUserCategories()  – UPSERT full array (insert or update)
 
  Depends ▸
    • $lib/supabaseClient         – PostgREST connection
    • Category (type)             – from defaults.ts
 
  Used in ▸
    • routes/budgeting/api/user/categories/+server.ts
        – GET  → getUserCategories()
        – POST → saveUserCategories()
    • routes/budgeting/+layout.server.ts
        – Initial dashboard load to pre-hydrate the UI
 
  Notes   ▸ If getUserCategories() returns an empty array the client
            falls back to the hard-coded defaults in defaults.ts.
  ────────────────────────────────────────────────────────────── */


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
