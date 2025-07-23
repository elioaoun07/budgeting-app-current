// src/lib/budgeting/defaults.ts

// — Category type —  
export interface Category {
  name:  string;
  icon:  string;
  color: string;
  subs?: string[];       // optional list of sub-categories
}

// — Your 8 default categories, with their icons, colors, and sub-lists —  
export const defaultCategories: Category[] = [
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
    color: '#8a2be2',
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
];

export const defaultIncomeCategories: Category[] = [
  { name: 'Salary', icon: '💰',  color: '#10b981' },
  { name: 'Bonus',  icon: '🎉',  color: '#3b82f6' },
  { name: 'Gift',   icon: '🎁',  color: '#f59e0b' }
];