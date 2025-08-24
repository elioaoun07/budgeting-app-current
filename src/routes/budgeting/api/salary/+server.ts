// ──────────────────────────────────────────────────────────────
// src/routes/budgeting/api/salary/+server.ts
//
// Purpose ▸ API endpoints for fetching and updating the user's salary.
//            Handles GET (fetch salary) and POST (update salary) requests.
//
// Exports ▸
//   • GET  – returns current salary
//   • POST – updates salary
//
// Depends ▸
//   • $lib/budgeting/server/gsheets.server – getSalary, setSalary
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Budgeting dashboard (salary display/edit)
//
// Notes   ▸ Data is stored/fetched from Google Sheets.
// ──────────────────────────────────────────────────────────────

import { json } from '@sveltejs/kit';
import { getSalary, setSalary } from '$lib/budgeting/server/gsheets.server';

export async function GET() {
    try {
        const salary = await getSalary();
        return json({ salary });
    } catch (error) {
        return json({ error: String(error) }, { status: 500 });
    }
}

export async function POST({ request }) {
  const { salary } = await request.json();
  try {
    await setSalary(salary);
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: String(e) }, { status: 500 });
  }
}