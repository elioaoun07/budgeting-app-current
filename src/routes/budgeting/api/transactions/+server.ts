// src/routes/budgeting/api/transactions/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json }              from '@sveltejs/kit';
import { supabase }          from '$lib/supabaseClient';

// READ existing transactions
export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Transaction fetch failed:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }

  return json({ success: true, transactions: data });
};

// CREATE a new transaction
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { date, account_id, category, subcategory, amount, description } =
    await request.json();

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id:    user.id,
      date,
      account_id,
      category,
      subcategory,
      amount,
      description
    });

  if (error) {
    console.error('Expense insert failed:', error);
    return json({ success: false, error: error.message }, { status: 400 });
  }

  return json({ success: true });
};
