import { writable, get } from 'svelte/store';
import { getDefaultCategories } from './defaults';
import type { Category } from './defaults';

/* ────────────────────────────────────────────────────────────
   1. ACCOUNTS
────────────────────────────────────────────────────────────── */
export interface Account {
  id:   string;
  name: string;
  type: 'income' | 'expense';
}

export const accounts       = writable<Account[]>([]);
export const currentAccount = writable<Account | null>(null);

/* Load the user’s accounts once on app start */
export async function loadAccounts() {
  const res = await fetch('/budgeting/api/accounts');
  if (!res.ok) throw new Error(await res.text());
  const data: Account[] = await res.json();
  accounts.set(data);

  if (!get(currentAccount) && data.length) {
    currentAccount.set(data[0]);       // auto-select first account
  }
}

/* Create a new account and auto-select it */
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

/* Manual selection (e.g., dropdown) */
export function selectAccount(id: string) {
  const acc = get(accounts).find(a => a.id === id) ?? null;
  currentAccount.set(acc);
}

/* ────────────────────────────────────────────────────────────
   2. CATEGORIES  (single JSONB list)
────────────────────────────────────────────────────────────── */
export const categories = writable<Category[]>(
  getDefaultCategories('expense')        // safe initial value
);

/* Load from DB for the selected account, else defaults */
export async function loadCategories() {
  const acc = get(currentAccount);
  if (!acc) return;

  const res = await fetch(
    `/budgeting/api/user/categories?accountId=${encodeURIComponent(acc.id)}`
  );
  const userCats: Category[] = res.ok ? await res.json() : [];
  const base = getDefaultCategories(acc.type);

  categories.set(userCats.length ? userCats : base);
}

/* Save whole list back to DB */
export async function saveCategories(newList: Category[]) {
  const acc = get(currentAccount);
  if (!acc) return;

  await fetch(
    `/budgeting/api/user/categories?accountId=${encodeURIComponent(acc.id)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newList)
    }
  );
  categories.set(newList);
}

/* Convenience helper used by AddCategoryModal */
export async function createCategory(
  name: string,
  icon: string,
  color: string,
  subs: string[] = []
) {
  const newCat: Category = { name, icon, color, subs };
  await saveCategories([...get(categories), newCat]);
}

/* ────────────────────────────────────────────────────────────
   3. Legacy alias so old components can still import rawPrefs
────────────────────────────────────────────────────────────── */
export const rawPrefs = categories;
