// src/lib/budgeting/store.ts
import { writable, derived, get } from 'svelte/store';
import type { Category }          from './defaults';

/** ── ACCOUNTS ─────────────────────────────────────────────── */
export interface Account {
  id:   string;
  name: string;
  type: 'income' | 'expense';
}

export const accounts       = writable<Account[]>([]);
export const currentAccount = writable<Account | null>(null);

export async function loadAccounts() {
  const res = await fetch('/budgeting/api/accounts');
  if (!res.ok) throw new Error(await res.text());
  const data: Account[] = await res.json();
  accounts.set(data);
  if (!get(currentAccount) && data.length) {
    currentAccount.set(data[0]);
  }
}

export async function createAccount(
  name: string,
  type: 'income' | 'expense'
) {
  const res = await fetch('/budgeting/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type })
  });
  if (!res.ok) throw new Error(await res.text());
  const newAcc: Account = await res.json();
  accounts.update(list => [...list, newAcc]);
  currentAccount.set(newAcc);
}

export function selectAccount(id: string) {
  const acc = get(accounts).find(a => a.id === id) ?? null;
  currentAccount.set(acc);
}

/** ── CATEGORIES ───────────────────────────────────────────── */
export const baseCategories = writable<Category[]>([]);

/**
 * Load DB categories for the selected account
 */
export async function loadCategories() {
  const acc = get(currentAccount);
  if (!acc) return;
  const res = await fetch(
    `/budgeting/api/categories?accountId=${encodeURIComponent(acc.id)}`
  );
  if (!res.ok) throw new Error(await res.text());
  const cats: Category[] = await res.json();
  baseCategories.set(cats);
}

/**
 * Create a new category in Supabase and refresh list
 */
export async function createCategory(
  name: string,
  icon: string,
  color: string,
  subs: string[] = []
) {
  const acc = get(currentAccount);
  if (!acc) throw new Error('No account selected');
  const res = await fetch(
    `/budgeting/api/categories?accountId=${encodeURIComponent(acc.id)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, color, subs })
    }
  );
  if (!res.ok) throw new Error(await res.text());
  const cat: Category = await res.json();
  baseCategories.update(list => [...list, cat]);
}

/** ── USER PREFS (order / added / removed) ───────────────── */
export interface UserPrefs {
  added:   Category[];
  removed: string[];
  order:   string[];
}

export const rawPrefs = writable<UserPrefs>({ added: [], removed: [], order: [] });

export async function loadUserPrefs() {
  const acc = get(currentAccount);
  if (!acc) return;
  const res = await fetch(
    `/budgeting/api/user/categories?accountId=${encodeURIComponent(acc.id)}`
  );
  if (!res.ok) throw new Error(await res.text());
  rawPrefs.set(await res.json());
}

rawPrefs.subscribe(async (prefs) => {
  const acc = get(currentAccount);
  if (!acc) return;
  await fetch(
    `/budgeting/api/user/categories?accountId=${encodeURIComponent(acc.id)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    }
  );
});

/** ── MERGE & DERIVE FINAL CATEGORIES ──────────────────────── */
export const categories = derived(
  [baseCategories, rawPrefs],
  ([base, raw], set) => {
    let merged = [...base, ...raw.added]
      .filter(c => !raw.removed.includes(c.name))
      .reduce<Category[]>((out, c) =>
        out.find(o => o.name === c.name) ? out : [...out, c]
      , []);
    if (raw.order.length) {
      merged.sort((a, b) =>
        raw.order.indexOf(a.name) - raw.order.indexOf(b.name)
      );
    }
    set(merged);
  },
  [] as Category[]
);

/** ── ICON LOOKUP ──────────────────────────────────────────── */
export const icons = derived(categories, $cats => {
  const map: Record<string, { icon: string; color: string }> = {};
  $cats.forEach(c => {
    map[c.name] = { icon: c.icon, color: c.color };
  });
  return map;
});
