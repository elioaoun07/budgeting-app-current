import { writable, derived, get } from 'svelte/store';
import type { ThemeName } from '$lib/budgeting/themes';
import { themes } from '$lib/budgeting/themes';
import { page } from '$app/stores';
import { supabase } from '$lib/supabaseClient';

/* 1️⃣ helper to load pref from Supabase */
async function fetchTheme(userId: string): Promise<ThemeName | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('fetchTheme error', error);
  }
  return (data?.theme ?? null) as ThemeName | null;
}

/* 2️⃣ helper to save pref */
async function saveTheme(userId: string, theme: ThemeName) {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, theme }, { onConflict: 'user_id' });
  if (error) console.error('saveTheme error', error);
}

/* 3️⃣ create store */
function initialTheme(): ThemeName {
  if (typeof localStorage !== 'undefined') {
    const t = localStorage.getItem('app-theme');
    if (t && t in themes) return t as ThemeName;
  }
  return 'wood';
}

function createThemeStore() {
  const { subscribe, set } = writable<ThemeName>(initialTheme());

  return {
    subscribe,
    async set(theme: ThemeName) {
      if (!(theme in themes)) return;
      set(theme);
      localStorage?.setItem('app-theme', theme);

      const uid = get(userId);
      if (uid) await saveTheme(uid, theme);
      document.cookie = `sb-theme=${theme}; Path=/; SameSite=Lax`;
    }
  };
}

export const themeStore = createThemeStore();

/* 4️⃣ track current user id from $page */
const userId = derived(page, ($p) => $p.data.session?.user?.id ?? null);

/* 5️⃣ when user logs in/out, load their theme */
userId.subscribe(async (uid) => {
  if (!uid) return;
  const dbTheme = await fetchTheme(uid);
  if (dbTheme) themeStore.set(dbTheme);
});
