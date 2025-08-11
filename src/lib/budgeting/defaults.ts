/* ──────────────────────────────────────────────────────────────
   src/lib/budgeting/defaults.ts

   Purpose   ▸ Hard-coded fallback data: the canonical list of
               “expense” and “income” categories used when a user
               has no custom preferences yet.

   Exports   ▸
     • interface  Category
     • const      defaultCategoriesByType
     • func       getDefaultCategories()

   Used by   ▸
     • store.ts            – seeds first-time users with defaults
     • db.ts               – returns defaults when SQL row is absent
     • Any UI that needs a full list without waiting for the API

   Calls     ▸ none (pure constants / helpers)
───────────────────────────────────────────────────────────────── */


/* ──────────────────────────────────────────────────────────────
   Category model
──────────────────────────────────────────────────────────────── */
export interface Category {
  name:  string;          // visible label
  icon:  string;          // your Icon component’s name or emoji
  color: string;          // hex / css color
  subs?: string[];        // optional sub-categories
}

/* ──────────────────────────────────────────────────────────────
   Default sets keyed by account type
──────────────────────────────────────────────────────────────── */
export const defaultCategoriesByType: Record<'expense' | 'income', Category[]> = {
  /* -------- EXPENSE (8 items) -------- */
  expense: [
    {
      name:  'Shopping',
      icon:  'Cart',
      color: '#1e90ff',
      subs:  ['Supermarket', 'Home utilities']
    },
    {
      name:  'Car',
      icon:  'Car',
      color: '#ff6347',
      subs:  ['Fuel', 'Insurance', 'Repairs']
    },
    {
      name:  'Home',
      icon:  'Home',
      color: '#32cd32',
      subs:  ['Electricity', 'Generator', 'Maintenance', 'Water']
    },
    {
      name:  'Entertainment',
      icon:  'Film',
      color: '#433d94ff',
      subs:  ['Dining Out', 'Movies', 'Outing']
    },
    {
      name:  'Personal',
      icon:  'User',
      color: '#ffa500',
      subs:  ['Shopping', 'Selfcare']
    },
    {
      name:  'Gifts',
      icon:  'Gift',
      color:  '#8a2be2',
      subs:  ['Birthday', 'Wedding', 'Christmas']
    },
    {
      name:  'Healthcare',
      icon:  'Heart',
      color: '#20b2aa',
      subs:  ['Doctor Visit', 'Pharmacy', 'Skincare', 'Health Insurance']
    },
    {
      name:  'Travel',
      icon:  'Airplane',
      color: '#ff4500',
      subs:  ['Flight', 'Hotel', 'Car Rental']
    }
  ],

  /* -------- INCOME (3 items) -------- */
  income: [
    { name: 'Salary', icon: 'Salary', color: '#10b981' },
    { name: 'Bonus',  icon: 'Bonus', color: '#3b82f6' },
    { name: 'Gift',   icon: 'Gift', color: '#f59e0b' }
  ]
};

/* ──────────────────────────────────────────────────────────────
   Helper: fetch defaults for a given account type
──────────────────────────────────────────────────────────────── */
export function getDefaultCategories(
  type: 'income' | 'expense'
): Category[] {
  return defaultCategoriesByType[type] ?? [];
}
