// add accountId parameter everywhere
export async function getUserCategoryPrefs(
  userId: string,
  accountId: string
): Promise<UserPrefs> {
  const { data, error } = await supabase
    .from('user_category_prefs')
    .select('prefs')
    .eq('user_id',    userId)
    .eq('account_id', accountId)
    .single();

  if (error && error.code === 'PGRST116') {
    return { added: [], removed: [], order: [] };
  }
  if (error) throw error;
  return data!.prefs as UserPrefs;
}

export async function saveUserCategoryPrefs(
  userId: string,
  accountId: string,
  prefs: UserPrefs
): Promise<void> {
  const { error } = await supabase
    .from('user_category_prefs')
    .upsert(
      { user_id: userId, account_id: accountId, prefs },
      { onConflict: ['user_id','account_id'], returning: 'minimal' }
    );
  if (error) throw error;
}
