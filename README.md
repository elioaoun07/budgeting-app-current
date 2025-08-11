- **<FileName>**
  - **Purpose** <what it does, one sentence>
  - **Exports** <functions / types>  (omit or write “—” if none)
  - **Used by** <caller list>
  - **Calls / Depends on** <key helpers, stores, or libraries>
  - **Props** <key reactive props or events>  (UI components only)

---

## Shared data & helpers (`src/lib/budgeting/`)

- **defaults.ts**  
  - **Purpose** Holds the built-in category sets (expense & income) and a helper to fetch them by account type.  
  - **Exports** `Category` (interface), `defaultCategoriesByType`, `getDefaultCategories()`  
  - **Used by** `store.ts` (initial state), `db.ts` (fallback when no DB row), various UI components that need the master list.  
  - **Calls / Depends on** — (pure constants)

- **localNLP.ts**
  - **Purpose** Offline helper that parses raw speech or OCR strings into `{ amount, category, subcategory, description }` so the expense form can pre-fill fields.
  - **Exports** `localParse()` (main), internal `wordsToNumber()` utility.
  - **Used by** `QuickSpeechEntry.svelte`, `CameraModal.svelte`, `routes/budgeting/+page.svelte`.
  - **Calls / Depends on** — (pure functions)


---


## Server-side helpers (`src/lib/budgeting/server`)

- **db.ts**  
  - **Purpose** Data-access layer for the `user_category_prefs` table (reads & upserts a user’s custom category list).  
  - **Exports** `getUserCategories`, `saveUserCategories`, `UserCategories` (type)  
  - **Used by**  
    - `routes/budgeting/api/user/categories/+server.ts` (GET & POST)  
    - `routes/budgeting/+layout.server.ts` (initial load)  
  - **Calls / Depends on** `$lib/supabaseClient`, `lib/budgeting/defaults`


---

## Client stores (`src/lib/budgeting/`)

- **store.ts**  
  - **Purpose** Single source of truth for accounts, currentAccount, and categories; hides all REST calls from the UI.  
  - **Exports** Writable stores (`accounts`, `currentAccount`, `categories`, `rawPrefs`) and helper functions (`loadAccounts`, `createAccount`, `selectAccount`, `loadCategories`, `saveCategories`, `createCategory`).  
  - **Used by** Sidebar, AddAccountModal, AddCategoryModal, CategoryManagementModal, and the main budgeting page.  
  - **Calls / Depends on** Budgeting API routes (`/api/accounts`, `/api/user/categories`) and `getDefaultCategories()` from `defaults.ts`.  

---

## UI components (`src/lib/budgeting/`)

- **AddAccountModal.svelte**  
  - **Purpose** Modal dialog for creating a new “account” (wallet, bank, cash, etc.).  
  - **Exports** —  
  - **Used by** `Sidebar.svelte` (opened from the “＋ Account” button)  
  - **Calls / Depends on** `createAccount()` from `store.ts`  
  - **Props** `open : boolean` (two-way bound to show / hide the modal)

---