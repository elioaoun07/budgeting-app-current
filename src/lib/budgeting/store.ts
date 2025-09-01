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

/* ────────────────────────────────────────────────────────────
   4. QUICK TEMPLATES (client-side favorites like "daily coffee")
   Stored in localStorage per user client; lightweight helpers to
   create transactions from a template (POST /budgeting/api/transactions).
────────────────────────────────────────────────────────────── */
export interface TemplateEntry {
  id: string; // simple client-side id
  name: string; // friendly name (e.g., "Daily coffee")
  amount: number;
  category?: string | null;
  subcategory?: string | null;
  account_id?: string | null;
  description?: string | null;
}

const LS_KEY = 'xpending:quick_templates';

function loadTemplatesFromStorage(): TemplateEntry[] {
  try {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TemplateEntry[];
  } catch (e) {
    console.warn('Failed to read templates from localStorage', e);
    return [];
  }
}

function saveTemplatesToStorage(list: TemplateEntry[]) {
  try {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save templates to localStorage', e);
  }
}

import { writable as writableClient } from 'svelte/store';

export const templates = writableClient<TemplateEntry[]>([]);

// Only access localStorage in the browser
if (typeof window !== 'undefined') {
  try {
    templates.set(loadTemplatesFromStorage());
  } catch (e) {
    console.warn('Failed to initialize templates from storage', e);
  }

  // persist changes
  templates.subscribe(list => saveTemplatesToStorage(list));
}

// helpers
export function addTemplate(t: Omit<TemplateEntry, 'id'>) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  templates.update(list => [{ id, ...t }, ...list]);
  return id;
}

export function removeTemplate(id: string) {
  templates.update(list => list.filter(x => x.id !== id));
}

/**
 * Update an existing template by id with partial changes.
 * The templates store is persisted to localStorage automatically.
 */
export function updateTemplate(id: string, changes: Partial<Omit<TemplateEntry, 'id'>>) {
  templates.update(list => list.map(t => t.id === id ? { ...t, ...changes } : t));
}

export interface CreateTransactionPayload {
  action: 'create' | 'bulk' | string;
  date?: string | null;
  amount?: number | null;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
  account_id?: string | null;
}

export async function createTransactionFromTemplate(t: TemplateEntry) {
  // Build payload expected by /budgeting/api/transactions
  // choose a sensible category fallback to avoid DB NOT NULL constraint
  const currentCats = get(categories);
  const fallbackCategory = (Array.isArray(currentCats) && currentCats[0] && currentCats[0].name) ? currentCats[0].name : 'Misc';

  const payload: CreateTransactionPayload = {
    action: 'create',
    date: new Date().toISOString(),
    amount: t.amount,
    category: t.category ?? fallbackCategory,
    subcategory: t.subcategory ?? null,
    description: t.description ?? null,
    account_id: t.account_id ?? null
  };

  const res = await fetch('/budgeting/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Failed to create transaction (${res.status})`);
  }

  const body = await res.json();
  return body.transaction;
}
