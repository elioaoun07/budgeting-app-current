// src/routes/budgeting/api/transactions/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json }              from '@sveltejs/kit';
import { supabase }          from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  // 1) Make sure we have a logged-in user
  const user = locals.user;
  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Pull the expense data out of the request
  const { date, account_id, category, subcategory, amount, description } = await request.json();

  // 3) Insert into the `transactions` table, including user_id
  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      date,
      account_id,
      category,
      subcategory,
      amount,
      description
    });

  // 4) Handle errors / success
  if (error) {
    console.error('Expense insert failed:', error);
    return json({ success: false, error: error.message }, { status: 400 });
  }

  return json({ success: true });
};