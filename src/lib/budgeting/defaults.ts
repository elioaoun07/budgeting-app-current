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
      color: '#ff1493',
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
    { name: 'Salary', icon: '💰', color: '#10b981' },
    { name: 'Bonus',  icon: '🎉', color: '#3b82f6' },
    { name: 'Gift',   icon: '🎁', color: '#f59e0b' }
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
