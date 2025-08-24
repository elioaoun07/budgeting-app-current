// ──────────────────────────────────────────────────────────────
// src/routes/budgeting/api/transactions/+server.ts
//
// Purpose ▸ API endpoints for fetching and creating user transactions.
//            Handles GET (list transactions) and POST (add transaction) requests.
//
// Exports ▸
//   • GET  – returns array of transactions for the current user
//   • POST – creates a new transaction for the current user
//
// Depends ▸
//   • $lib/supabaseClient – Supabase client
//   • @sveltejs/kit – SvelteKit API helpers
//
// Used in ▸
//   • Budgeting dashboard (transaction history, expense entry)
//
// Notes   ▸ Requires user authentication via locals.user.
// ──────────────────────────────────────────────────────────────

import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

function toISODate(d: string | null | undefined) {
  if (!d) return null;
  // if already includes time, return as-is; if only yyyy-mm-dd, append UTC midnight
  return d.length === 10 ? `${d}T00:00:00.000Z` : d;
}

// READ existing transactions
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user;
    if (!user) return json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Transaction fetch failed:', error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    return json({ success: true, transactions: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error(err);
    return json({ success: false, error: String(err) }, { status: 500 });
  }
};

// CREATE a new transaction
export const POST: RequestHandler = async ({ request, locals }) => {
  const payload = await request.json();

  const action = payload?.action ?? 'create'; // default action

  if (action === 'create') {
    // handle single creation
    const { date, amount, category, subcategory, description, account_id } = payload;
    // whitelist expected fields and coerce types
    const transDate = toISODate(date);
    const transAccountId = account_id ?? null;
    const transCategory = category ?? null;
    const transSubcategory = subcategory ?? null;
    const transAmount = amount !== undefined ? Number(amount) : null;
    const transDescription = description ?? null;

    if (transAmount === null || Number.isNaN(transAmount)) {
      return json({ success: false, error: 'Invalid or missing amount' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: locals.user.id,
        date: transDate,
        account_id: transAccountId,
        category: transCategory,
        subcategory: transSubcategory,
        amount: transAmount,
        description: transDescription
      })
      .select()
      .single();

    if (error) {
      console.error('Expense insert failed:', error);
      return json({ success: false, error: error.message }, { status: 400 });
    }

    return json({ success: true, transaction: data }, { status: 201 });
  }

  if (action === 'bulk' || action === 'import') {
    // handle bulk import or alternative POST flow
    const items = Array.isArray(payload.items) ? payload.items : [];

    // TODO: validate and insert many rows

    return json({ success: true, inserted: items.length }, { status: 201 });
  }

  return json({ success: false, error: 'unknown action' }, { status: 400 });
};

// UPDATE an existing transaction
export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) return json({ success: false, error: 'unauthenticated' }, { status: 401 });

    const body = await request.json();
    const { id } = body;
    if (!id) return json({ success: false, error: 'missing id' }, { status: 400 });

    // build updates from allowed fields only
    const updates: Record<string, any> = {};
    if (body.date !== undefined) updates.date = toISODate(body.date);
    if (body.amount !== undefined) {
      const amt = Number(body.amount);
      if (Number.isNaN(amt)) return json({ success: false, error: 'invalid amount' }, { status: 400 });
      updates.amount = amt;
    }
    if (body.category !== undefined) updates.category = body.category;
    if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
    if (body.description !== undefined) updates.description = body.description;
    if (body.account_id !== undefined) updates.account_id = body.account_id;

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', locals.user.id)
      .select()
      .single();

    if (error) {
      console.error('Transaction update failed:', error);
      return json({ success: false, error: error.message }, { status: 500 });
    }

    return json({ success: true, transaction: data }, { status: 200 });
  } catch (err) {
    console.error(err);
    return json({ success: false, error: String(err) }, { status: 500 });
  }
};
