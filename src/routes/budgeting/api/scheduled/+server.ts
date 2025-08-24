// ──────────────────────────────────────────────────────────────
// src/routes/budgeting/api/scheduled/+server.ts
//
// Purpose ▸ API endpoints for scheduled payments (reminders and confirmations).
//            Handles GET (list scheduled payments) and POST (confirm payment).
//
// Exports ▸
//   • GET  – returns array of scheduled payments
//   • POST – confirms a scheduled payment and logs it as an expense
//
// Depends ▸
//   • $lib/budgeting/server/gsheets.server – getScheduledPayments, appendExpense, setLastPaid
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Budgeting dashboard (scheduled payment reminders)
//
// Notes   ▸ Data is stored/fetched from Google Sheets. Requires user authentication for POST.
// ──────────────────────────────────────────────────────────────

import { json } from '@sveltejs/kit';
import { getScheduledPayments, appendExpense, setLastPaid, addScheduledPayment } from '$lib/budgeting/server/gsheets.server';

export async function GET() {
    try {
        const payments = await getScheduledPayments();
        return json(payments);
    } catch (e) {
        return json({ error: String(e) }, { status: 500 });
    }
}

export async function POST({ request, locals }) {
    const { category, subcategory, amount } = await request.json();
    const username = locals.user;
    if (!username) return json({ error: 'unauthenticated' }, { status: 401 });

    try {
        const today = new Date().toISOString().split('T')[0];
        await appendExpense(today, category, subcategory, amount, 'Scheduled Payment', username);
        await setLastPaid(category, subcategory, today);
        return json({ success: true });
    } catch (error) {
        return json({ success: false, error: String(error) }, { status: 500 });
    }
}