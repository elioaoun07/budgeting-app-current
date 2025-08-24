import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    return {
      groupedTransactions: [],
      totals: {},
      topCategories: [],
      monthlySeries: [],
      accounts: [],
      filters: {}
    };
  }

  const params = Object.fromEntries(url.searchParams.entries());
  const startDate = params.startDate || null;
  const endDate = params.endDate || null;
  const accountId = params.accountId || null;
  const categories = params.categories
    ? params.categories.split(',').map((s) => s.trim()).filter(Boolean)
    : null;
  const minAmount = params.minAmount ? Number(params.minAmount) : null;
  const maxAmount = params.maxAmount ? Number(params.maxAmount) : null;

  // fetch accounts for filter dropdown
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id,name,type')
    .eq('user_id', locals.user.id)
    .order('inserted_at', { ascending: true });

  // build transactions query
  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', locals.user.id)
    .order('date', { ascending: false });

  if (accountId) query = query.eq('account_id', accountId);
  if (categories && categories.length) query = query.in('category', categories);
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (minAmount !== null) query = query.gte('amount', minAmount);
  if (maxAmount !== null) query = query.lte('amount', maxAmount);

  const { data } = await query;
  const rows = data ?? [];

  // aggregations
  let totalSpent = 0;
  let totalIncome = 0;
  const byCategory: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const r of rows) {
    const amt = Number(r.amount) || 0;
    if (amt < 0) totalSpent += Math.abs(amt);
    else totalIncome += amt;

    const cat = r.category ?? 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + amt;

    const m = r.date ? String(r.date).slice(0, 7) : 'unknown';
    byMonth[m] = (byMonth[m] || 0) + amt;
  }

  const topCategories = Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
    .slice(0, 8);

  const months = Object.keys(byMonth).sort();
  const monthlySeries = months.map((m) => ({ month: m, total: byMonth[m] })).slice(-12);

  // group by date (YYYY-MM-DD)
  const groups: Record<string, typeof rows> = {};
  for (const r of rows) {
    const d = r.date ? String(r.date).split('T')[0] : 'unknown';
    (groups[d] ||= []).push(r);
  }
  const groupedTransactions = Object.entries(groups)
    .map(([date, items]) => ({
      date,
      total: items.reduce((s, it) => s + (Number(it.amount) || 0), 0),
      items
    }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    groupedTransactions,
    totals: { totalSpent, totalIncome, net: totalIncome - totalSpent, transactionsCount: rows.length },
    topCategories,
    monthlySeries,
    accounts: accounts ?? [],
    filters: { startDate, endDate, accountId, categories, minAmount, maxAmount }
  };
};