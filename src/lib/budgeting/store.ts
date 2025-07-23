// src/lib/budgeting/store.ts
import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Category } from './defaults';
import {
  defaultCategories,
  defaultIncomeCategories
} from './defaults';

/* ═══════════════  ACCOUNTS  ═══════════════ */

export interface Account {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

function loadAccounts(): Account[] {
  if (!browser) return [];
  try {
    return JSON.parse(localStorage.getItem('budgeting:accounts') ?? '[]');
  } catch {
    return [];
  }
}

function persistAccounts(accs: Account[]) {
  if (browser) {
    localStorage.setItem('budgeting:accounts', JSON.stringify(accs));
  }
}

export const accounts = writable<Account[]>(loadAccounts());
export const currentAccount = writable<Account | null>(null);

// restore last-active account
const LS_ACTIVE = 'budgeting:activeAccount';
if (browser) {
  const saved = localStorage.getItem(LS_ACTIVE);
  if (saved) {
    const acct = loadAccounts().find(a => a.id === saved) ?? null;
    currentAccount.set(acct);
  }
}

// account helpers
export function createAccount(name: string, type: 'income'|'expense') {
  const acc: Account = { id: crypto.randomUUID(), name, type };
  accounts.update(list => {
    const upd = [...list, acc];
    persistAccounts(upd);
    return upd;
  });
  currentAccount.set(acc);
}
export function selectAccount(id: string) {
  const acct = get(accounts).find(a => a.id === id) ?? null;
  currentAccount.set(acct);
}

/* ══════════  CATEGORY PREFERENCES  ══════════ */

export interface UserPrefs {
  added:   Category[];
  removed: string[];
  order:   string[];
}

const prefsKey = (acc: Account|null) =>
  `budgeting:categoryPrefs:${acc?.id ?? 'none'}`;

function loadPrefs(acc: Account|null): UserPrefs {
  if (!browser) return { added: [], removed: [], order: [] };
  try {
    return JSON.parse(
      localStorage.getItem(prefsKey(acc)) ?? 'null'
    ) ?? { added: [], removed: [], order: [] };
  } catch {
    return { added: [], removed: [], order: [] };
  }
}

/**
 * Must be called in a component's onMount() so that
 * we only touch localStorage in the browser _after_ hydration.
 */
export function initBudgetingStore() {
  if (!browser) return;

  // 1️⃣ load prefs for current account
  rawPrefs.set(loadPrefs(get(currentAccount)));

  // 2️⃣ reload when account switches
  currentAccount.subscribe(acc => {
    rawPrefs.set(loadPrefs(acc));
  });

  // 3️⃣ persist on any prefs change
  rawPrefs.subscribe(p => {
    localStorage.setItem(prefsKey(get(currentAccount)), JSON.stringify(p));
  });
}

export const rawPrefs = writable<UserPrefs>({ added: [], removed: [], order: [] });

/* ═══════════  MERGED CATEGORIES  ═══════════ */

export const categories = derived(
  [rawPrefs, currentAccount],
  ([$raw, $acc], set) => {
    const base = $acc?.type === 'income'
      ? defaultIncomeCategories
      : defaultCategories;

    const merged = [...base, ...$raw.added]
      .filter(c => !$raw.removed.includes(c.name))
      .reduce<Category[]>((out, c) =>
        out.some(o => o.name === c.name) ? out : out.concat(c),
      [], [] as Category[]);

    if ($raw.order.length) {
      merged.sort((a,b) => {
        const ia = $raw.order.indexOf(a.name),
              ib = $raw.order.indexOf(b.name);
        return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
      });
    }

    set(merged);
  },
  defaultCategories
);

/* ══════════════  ICON MAP  ══════════════ */

export const icons = derived(categories, $cats =>
  Object.fromEntries($cats.map(c => [
    c.name,
    { icon: c.icon, color: c.color }
  ])));