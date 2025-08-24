// ──────────────────────────────────────────────────────────────
// src/routes/budgeting/api/recurring/+server.ts
//
// Purpose ▸ API endpoints for fetching and creating recurring payments.
//            Handles GET (list scheduled payments) and POST (add new payment) requests.
//
// Exports ▸
//   • GET  – returns array of scheduled payments
//   • POST – adds a new scheduled payment
//
// Depends ▸
//   • $lib/budgeting/server/gsheets.server – listScheduled, addScheduledPayment
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Budgeting dashboard (recurring payments)
//
// Notes   ▸ Data is stored/fetched from Google Sheets.
// ──────────────────────────────────────────────────────────────

import { json } from '@sveltejs/kit';
import { addScheduledPayment, listScheduled } from '$lib/budgeting/server/gsheets.server';

export async function GET() {
  const rows = await listScheduled();
  return json(rows.map(r => r._rawData));
}

export async function POST({ request }) {
  const rec = await request.json();
  await addScheduledPayment(rec);
  return json({ success: true });
}
