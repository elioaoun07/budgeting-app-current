/* ──────────────────────────────────────────────────────────────
   src/lib/budgeting/store.ts

   Purpose ▸ Central Svelte store for budgeting state.
             *Only this file* may talk to `/budgeting/api/*` from
             client-side code; UI components subscribe to the stores.

   Exports ▸
     • Writable stores
         – accounts          : Account[]
         – currentAccount    : Account | null
         – categories        : Category[]
         – rawPrefs          : alias to categories (legacy)
     • Async helpers
         – loadAccounts()    – GET /api/accounts   → hydrate store
         – createAccount()   – POST /api/accounts  → add & select
         – selectAccount()   – manually switch currentAccount
         – loadCategories()  – GET /api/user/categories
         – saveCategories()  – POST /api/user/categories
         – createCategory()  – convenience wrapper → saveCategories
   Depends ▸ `getDefaultCategories()` (defaults.ts)

   Used by ▸
     • Sidebar.svelte              – account selector
     • AddAccountModal.svelte      – calls createAccount()
     • CategoryManagementModal.*   – reorder / delete categories
     • AddCategoryModal.svelte     – calls createCategory()
     • routes/budgeting/+page.svelte (expense form)
───────────────────────────────────────────────────────────────── */

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

/*
 * Add a new subcategory to an existing category and persist.
 * If the sub already exists, this is a no-op.
 */
export async function addSubcategory(categoryName: string, subName: string) {
  const list = get(categories).map(c => ({ ...c, subs: Array.isArray(c.subs) ? [...c.subs] : [] }));
  const idx = list.findIndex(c => c.name === categoryName);
  if (idx === -1) return;
  const subs = list[idx].subs;
  if (!subs.includes(subName)) {
    subs.push(subName);
    list[idx].subs = subs;
    await saveCategories(list);
  }
}

/* ────────────────────────────────────────────────────────────
   3. Legacy alias so old components can still import rawPrefs
────────────────────────────────────────────────────────────── */
export const rawPrefs = categories;
