### <FileName> (<relative\path\to\file>)

- **Purpose**: <One sentence summary of what it does>
- **Exports**: <List of exported functions\types\classes\components, or "—" if none>
- **Props**: <List of props (for Svelte components), or "—" if not applicable>
- **Events**: <List of custom events dispatched (for Svelte components), or "—" if not applicable>
- **Depends on**: <Key helpers, stores, libraries, or APIs it uses>
- **Used by**: <List of files\components\pages that use this>
- **Notes**: <Any extra notes, edge cases, or implementation details>

---

# Budgeting App – Source Overview

This document describes the main files and components in the app, using a uniform template for clarity.

---

## Shared Data & Helpers (`src\lib\budgeting\`)

### defaults.ts (`src\lib\budgeting\defaults.ts`)
- **Purpose**: Holds built-in category sets (expense & income) and a helper to fetch them by account type.
- **Exports**: `Category` (interface), `defaultCategoriesByType`, `getDefaultCategories()`
- **Props**: —
- **Events**: —
- **Depends on**: —
- **Used by**: `store.ts`, `db.ts`, UI components needing master list
- **Notes**: Pure constants

### localNLP.ts (`src\lib\budgeting\localNLP.ts`)
- **Purpose**: Parses raw speech\OCR strings into `{ amount, category, subcategory, description }` for pre-filling expense forms.
- **Exports**: `localParse()`, internal `wordsToNumber()`
- **Props**: —
- **Events**: —
- **Depends on**: —
- **Used by**: `QuickSpeechEntry.svelte`, `CameraModal.svelte`, `routes\budgeting\+page.svelte`
- **Notes**: Pure functions

---

## Server-side Helpers (`src\lib\budgeting\server\`)

### db.ts (`src\lib\budgeting\server\db.ts`)
- **Purpose**: Data-access layer for user category preferences (reads & upserts custom category list).
- **Exports**: `getUserCategories`, `saveUserCategories`, `UserCategories` (type)
- **Props**: —
- **Events**: —
- **Depends on**: `$lib\supabaseClient`, `defaults.ts`
- **Used by**: `api\user\categories\+server.ts`, `+layout.server.ts`
- **Notes**: Handles fallback to defaults

### gsheets.server.ts (`src\lib\budgeting\server\gsheets.server.ts`)
- **Purpose**: Integrates with Google Sheets for allocations, salary, and scheduled payments.
- **Exports**: `getAllocations`, `getSalary`, `setSalary`, `listScheduled`, `addScheduledPayment`, etc.
- **Props**: —
- **Events**: —
- **Depends on**: Google Sheets API
- **Used by**: API endpoints for allocations, salary, recurring, scheduled
- **Notes**: Handles all Google Sheets logic

---

## Client Stores (`src\lib\budgeting\`)

### store.ts (`src\lib\budgeting\store.ts`)
- **Purpose**: Central store for accounts, currentAccount, categories; wraps all REST calls for UI.
- **Exports**: Writable stores (`accounts`, `currentAccount`, `categories`, `rawPrefs`), helpers (`loadAccounts`, `createAccount`, `selectAccount`, `loadCategories`, `saveCategories`, `createCategory`)
- **Props**: —
- **Events**: —
- **Depends on**: API routes, `getDefaultCategories()`
- **Used by**: Sidebar, AddAccountModal, AddCategoryModal, CategoryManagementModal, main dashboard
- **Notes**: Single source of truth

---

## UI Components (`src\lib\budgeting\`)

### AddAccountModal.svelte (`src\lib\budgeting\AddAccountModal.svelte`)
- **Purpose**: Modal dialog for creating a new account (wallet, bank, cash, etc.).
- **Exports**: Svelte component
- **Props**: `open: boolean` (two-way bound)
- **Events**: —
- **Depends on**: `createAccount()` from `store.ts`
- **Used by**: `Sidebar.svelte`
- **Notes**: Modal overlays page

### AddCategoryModal.svelte (`src\lib\budgeting\AddCategoryModal.svelte`)
- **Purpose**: Modal dialog for creating a new budget category (name, color, icon).
- **Exports**: Svelte component
- **Props**: —
- **Events**: `save`, `cancel`
- **Depends on**: `createCategory` from `store.ts`, `Icon.svelte`
- **Used by**: Category management UI
- **Notes**: Modal overlays page

### CalculatorModal.svelte (`src\lib\budgeting\CalculatorModal.svelte`)
- **Purpose**: Modal calculator for quick math and tip calculation.
- **Exports**: Svelte component
- **Props**: `visible`, `prefill`, `onResult`, `onClose`
- **Events**: `result`, `close`
- **Depends on**: `mathjs`
- **Used by**: Amount entry, tip calculation
- **Notes**: Modal overlays page

### CameraModal.svelte (`src\lib\budgeting\CameraModal.svelte`)
- **Purpose**: Modal for capturing images and extracting text via OCR.
- **Exports**: Svelte component
- **Props**: `visible`
- **Events**: `result`, `close`
- **Depends on**: Tesseract.js, MediaDevices API
- **Used by**: Receipt scanning
- **Notes**: Modal overlays page

### CategoryManagementModal.svelte (`src\lib\budgeting\CategoryManagementModal.svelte`)
- **Purpose**: Modal for editing, reordering, and removing budget categories.
- **Exports**: Svelte component
- **Props**: —
- **Events**: `save`, `cancel`
- **Depends on**: `categoriesStore`, `saveCategories`, `Icon.svelte`
- **Used by**: Category management UI
- **Notes**: Modal overlays page

### QuickSpeechEntry.svelte (`src\lib\budgeting\QuickSpeechEntry.svelte`)
- **Purpose**: Quick speech-to-text entry for budgeting.
- **Exports**: Svelte component
- **Props**: —
- **Events**: `spoken`
- **Depends on**: SpeechRecognition API
- **Used by**: Fast entry via voice
- **Notes**: Button toggles listening

### RecurringModal.svelte (`src\lib\budgeting\RecurringModal.svelte`)
- **Purpose**: Modal for creating a new recurring payment or bill.
- **Exports**: Svelte component
- **Props**: `visible`
- **Events**: `save`, `close`
- **Depends on**: Svelte createEventDispatcher
- **Used by**: Recurring payments UI
- **Notes**: Modal overlays page

### SalaryModal.svelte (`src\lib\budgeting\SalaryModal.svelte`)
- **Purpose**: Modal for editing the user's salary.
- **Exports**: Svelte component
- **Props**: `visible`, `salary`
- **Events**: `save`, `close`
- **Depends on**: Svelte transitions, createEventDispatcher
- **Used by**: Salary entry\edit
- **Notes**: Modal overlays page

### ScheduledPopup.svelte (`src\lib\budgeting\ScheduledPopup.svelte`)
- **Purpose**: Popup reminder for scheduled payments.
- **Exports**: Svelte component
- **Props**: `item` (category, subcategory, amount, nextDate)
- **Events**: `confirm`, `close`
- **Depends on**: createEventDispatcher
- **Used by**: Scheduled payment reminders
- **Notes**: Modal overlays page

### Sidebar.svelte (`src\lib\budgeting\Sidebar.svelte`)
- **Purpose**: Sidebar panel for account and budgeting actions.
- **Exports**: Svelte component
- **Props**: `visible`, `username`
- **Events**: `close`, `editsalary`, `addrecurring`, `requestAddCategory`
- **Depends on**: Svelte transitions, navigation, store, AddAccountModal
- **Used by**: Main navigation\sidebar
- **Notes**: Modal overlays page

---

## Icon System (`src\lib\icons\`)

### Icon.svelte (`src\lib\icons\Icon.svelte`)
- **Purpose**: Renders SVG icons by name for use in the UI.
- **Exports**: Svelte component, `icons` (array), `fetchSvg(name)`
- **Props**: `name`, `size`, `color`
- **Events**: —
- **Depends on**: Inline SVG markup
- **Used by**: Category icons, actions
- **Notes**: SVGs injected as HTML

---

## OCR System (`src\lib\ocr\`)

### engine.ts (`src\lib\ocr\engine.ts`)
- **Purpose**: Provides OCR extraction using Tesseract.js.
- **Exports**: `recognise(file)`
- **Props**: —
- **Events**: —
- **Depends on**: Tesseract.js
- **Used by**: Receipt\document OCR
- **Notes**: Logs progress to console

### receipts\index.ts (`src\lib\ocr\receipts\index.ts`)
- **Purpose**: Exports all available receipt parsers for OCR extraction.
- **Exports**: `receiptParsers`
- **Props**: —
- **Events**: —
- **Depends on**: `spinneys.ts`, `carrefour.ts`
- **Used by**: OCR pipeline
- **Notes**: Add new parsers as needed

### receipts\spinneys.ts (`src\lib\ocr\receipts\spinneys.ts`)
- **Purpose**: Parser for Spinneys receipts for OCR extraction.
- **Exports**: `spinneys` (ReceiptParser)
- **Props**: —
- **Events**: —
- **Depends on**: `types`
- **Used by**: OCR pipeline
- **Notes**: Matches “spinneys” and extracts “Total USD”

---

## API Endpoints (`src\routes\budgeting\api\`)

### accounts\+server.ts
- **Purpose**: API endpoints for fetching and creating user accounts.
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: Supabase client, SvelteKit API helpers
- **Used by**: Account management
- **Notes**: Requires authentication

### allocations\+server.ts
- **Purpose**: API endpoint for fetching budget allocations from Google Sheets.
- **Exports**: `GET`
- **Props**: —
- **Events**: —
- **Depends on**: `gsheets.server`
- **Used by**: Allocation display
- **Notes**: Returns error 500 if fetching fails

### categories\+server.ts
- **Purpose**: API endpoints for fetching and creating budget categories.
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: Supabase client, SvelteKit API helpers
- **Used by**: Category management
- **Notes**: Requires authentication

### recurring\+server.ts
- **Purpose**: API endpoints for fetching and creating recurring payments.
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: `gsheets.server`
- **Used by**: Recurring payments
- **Notes**: Data stored in Google Sheets

### salary\+server.ts
- **Purpose**: API endpoints for fetching and updating the user's salary.
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: `gsheets.server`
- **Used by**: Salary display\edit
- **Notes**: Data stored in Google Sheets

### scheduled\+server.ts
- **Purpose**: API endpoints for scheduled payments (reminders and confirmations).
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: `gsheets.server`
- **Used by**: Scheduled payment reminders
- **Notes**: Requires authentication for POST

### transactions\+server.ts
- **Purpose**: API endpoints for fetching and creating user transactions.
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: Supabase client, SvelteKit API helpers
- **Used by**: Transaction history, expense entry
- **Notes**: Requires authentication

### user\categories\+server.ts
- **Purpose**: API endpoints for fetching and saving the user's budget categories.
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: `db.ts`, SvelteKit API helpers
- **Used by**: Category management
- **Notes**: Requires authentication

### user\theme\+server.ts
- **Purpose**: API endpoints for fetching and saving the user's theme preference.
- **Exports**: `GET`, `POST`
- **Props**: —
- **Events**: —
- **Depends on**: `db.ts`, SvelteKit API helpers
- **Used by**: Theme selection
- **Notes**: Requires authentication

---

## Layouts & Pages

### +layout.server.ts (`src\routes\budgeting\+layout.server.ts`)
- **Purpose**: Loads user, accounts, and initial categories for budgeting pages.
- **Exports**: `load`
- **Props**: —
- **Events**: —
- **Depends on**: Supabase client, `getUserCategories`, `getDefaultCategories`
- **Used by**: Budgeting dashboard layout
- **Notes**: Falls back to default categories

### +layout.svelte (`src\routes\budgeting\+layout.svelte`)
- **Purpose**: Main layout for budgeting dashboard (navigation, welcome animation, floating particles, slots).
- **Exports**: Svelte layout
- **Props**: —
- **Events**: —
- **Depends on**: Store, transitions\easing
- **Used by**: All budgeting dashboard pages
- **Notes**: Responsive design

### +page.svelte (`src\routes\budgeting\+page.svelte`)
- **Purpose**: Main budgeting dashboard page (expense entry, allocations, reminders, category management).
- **Exports**: Svelte page
- **Props**: —
- **Events**: —
- **Depends on**: Store, helpers, modals, Icon.svelte
- **Used by**: Main dashboard
- **Notes**: Responsive design, salary breakdown, quick entry

### receipt\+page.svelte (`src\routes\budgeting\receipt\+page.svelte`)
- **Purpose**: Receipt scanning page for budgeting.
- **Exports**: Svelte page
- **Props**: —
- **Events**: —
- **Depends on**: OCR engine, receipt parsers
- **Used by**: Receipt scanning
- **Notes**: Uses device camera if available

### login\+page.svelte (`src\routes\login\+page.svelte`)
- **Purpose**: Login page for xPENDING budgeting app (email\password, animated quotes, particles).
- **Exports**: Svelte page
- **Props**: —
- **Events**: —
- **Depends on**: Navigation, transitions\easing
- **Used by**: App entry
- **Notes**: Animated background, error\success feedback

---

## Auth & Session

### supabaseClient.ts (`src\lib\supabaseClient.ts`)
- **Purpose**: Creates and exports a Supabase client for database and auth access.
- **Exports**: `supabase`
- **Props**: —
- **Events**: —
- **Depends on**: Supabase SDK, environment variables
- **Used by**: All server\database interactions
- **Notes**: Session persistence disabled

### hooks.server.ts (`src\hooks.server.ts`)
- **Purpose**: SvelteKit server hook for authentication and route protection.
- **Exports**: `handle`
- **Props**: —
- **Events**: —
- **Depends on**: Supabase client, SvelteKit redirect
- **Used by**: All server requests
- **Notes**: Redirects unauthenticated users

### login\+server.ts (`src\routes\login\+server.ts`)
- **Purpose**: Handles login requests (authenticates user, sets session cookies, redirects).
- **Exports**: `POST`
- **Props**: —
- **Events**: —
- **Depends on**: Supabase client, SvelteKit API helpers
- **Used by**: Login page
- **Notes**: Stores tokens in cookies

### logout\+server.ts (`src\routes\logout\+server.ts`)
- **Purpose**: Handles logout requests (destroys session, removes cookies).
- **Exports**: `POST`
- **Props**: —
- **Events**: —
- **Depends on**: Session destroy helper
- **Used by**: Logout endpoint
- **Notes**: Deletes session\JWT cookies

---

## Global Styles & Types

### app.css (`src\app.css`)
- **Purpose**: Global styles for the budgeting app (imports Tailwind CSS and forms plugin).
- **Exports**: —
- **Props**: —
- **Events**: —
- **Depends on**: Tailwind CSS, forms plugin
- **Used by**: All pages\components
- **Notes**: Custom styles can be added

### app.d.ts (`src\app.d.ts`)
- **Purpose**: Type definitions for SvelteKit app (extends App.Locals for authentication).
- **Exports**: —
- **Props**: —
- **Events**: —
- **Depends on**: SvelteKit types
- **Used by**: All server endpoints\hooks
- **Notes**: Extend as needed

### app.html (`src\app.html`)
- **Purpose**: Main HTML template for the app (PWA support, favicon, viewport, SvelteKit body).
- **Exports**: —
- **Props**: —
- **Events**: —
- **Depends on**: SvelteKit
- **Used by**: All pages
- **Notes**: PWA and mobile support

---