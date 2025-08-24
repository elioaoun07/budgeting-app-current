<script lang="ts">
  import type { PageServerLoad } from './$types';
  import { supabase } from '$lib/supabaseClient';

  /**
   * Fetch transactions for the authenticated user and return them grouped by date.
   * Returned shape:
   *   groupedTransactions: Array<{ date: string, total: number, items: Transaction[] }>
   */
  export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
      return { groupedTransactions: [] };
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', locals.user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to load transactions for dashboard:', error);
      return { groupedTransactions: [] };
    }

    const rows = data ?? [];

    // Group by date (YYYY-MM-DD)
    const groups: Record<string, typeof rows> = {};
    for (const r of rows) {
      // normalize date field to YYYY-MM-DD
      const d = r.date ? String(r.date).split('T')[0] : 'unknown';
      if (!groups[d]) groups[d] = [];
      groups[d].push(r);
    }

    // Convert to sorted array with totals
    const groupedTransactions = Object.entries(groups)
      .map(([date, items]) => {
        const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
        return { date, total, items };
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first

    return { groupedTransactions };
  };

  // data is provided by +page.server.ts
  export let data: {
    groupedTransactions: Array<{ date: string; total: number; items: any[] }>;
    totals: { totalSpent: number; totalIncome: number; net: number; transactionsCount: number };
    topCategories: Array<{ category: string; total: number }>;
    monthlySeries: Array<{ month: string; total: number }>;
    accounts: Array<{ id: string; name: string; type: string }>;
    filters: any;
  };

  import { onMount } from 'svelte';

  // local copy so we can update UI optimistically
  let grouped = data.groupedTransactions ? JSON.parse(JSON.stringify(data.groupedTransactions)) : [];

  // openGroups must be reassigned to trigger Svelte reactivity when mutated
  let openGroups = new Set<string>();

  // editing state
  let editingId: string | null = null;
  let editingDraft: any = null;
  let editingOriginalGroupDate: string | null = null;
  let saving = false;
  let errorMsg = '';

  // expand today's group by default
  onMount(() => {
    if (data.groupedTransactions?.[0]) openGroups.add(data.groupedTransactions[0].date);
  });

  const fmtAmount = (v: number) =>
    v.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return d;
    }
  };

  function toggle(date: string) {
    if (openGroups.has(date)) openGroups.delete(date);
    else openGroups.add(date);
    openGroups = new Set(openGroups); // trigger reactivity
  }

  function startEdit(item, groupDate: string) {
    editingId = item.id;
    // create a draft; ensure date is YYYY-MM-DD for the date input
    editingDraft = {
      id: item.id,
      date: item.date ? String(item.date).slice(0, 10) : '',
      amount: Number(item.amount) ?? 0,
      category: item.category ?? '',
      subcategory: item.subcategory ?? '',
      description: item.description ?? '',
      account_id: item.account_id ?? item.accountId ?? null
    };
    editingOriginalGroupDate = groupDate;
    errorMsg = '';
  }

  function cancelEdit() {
    editingId = null;
    editingDraft = null;
    editingOriginalGroupDate = null;
    errorMsg = '';
  }

  async function saveEdit() {
    if (!editingDraft) return;
    saving = true;
    errorMsg = '';

    try {
      const res = await fetch('/budgeting/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDraft)
      });

      if (!res.ok) {
        const txt = await res.text();
        errorMsg = txt || `Save failed (${res.status})`;
        saving = false;
        return;
      }

      // optimistic UI update:
      // if date changed to another day, reload to get server grouping (simpler)
      const newDateKey = editingDraft.date;
      if (editingOriginalGroupDate && newDateKey !== editingOriginalGroupDate) {
        // redirect / reload to reflect grouping changes
        window.location.href = window.location.pathname + window.location.search;
        return;
      }

      // otherwise update the item in place and adjust group totals
      for (const g of grouped) {
        if (g.date === editingOriginalGroupDate) {
          const idx = g.items.findIndex((it) => it.id === editingDraft.id);
          if (idx > -1) {
            const oldAmount = Number(g.items[idx].amount) || 0;
            g.items[idx] = {
              ...g.items[idx],
              amount: editingDraft.amount,
              date: editingDraft.date,
              category: editingDraft.category,
              subcategory: editingDraft.subcategory,
              description: editingDraft.description,
              account_id: editingDraft.account_id
            };
            g.total = g.total - oldAmount + Number(editingDraft.amount || 0);
          }
          break;
        }
      }

      // reassign grouped to trigger reactivity if needed
      grouped = JSON.parse(JSON.stringify(grouped));
      cancelEdit();
    } catch (err) {
      errorMsg = String(err);
    } finally {
      saving = false;
    }
  }
</script>

<style>
  /* Reuse app dark card styles for consistency */
  .container { max-width: 1100px; margin: 1.5rem auto; padding: 1rem; color: var(--text,#e2e8f0); }
  .top-grid { display:grid; grid-template-columns: 1fr 320px; gap:1rem; align-items:start; margin-bottom:1rem; }
  .card { background: rgba(15,23,42,0.85); border-radius:14px; padding:1rem; border:1px solid rgba(59,130,246,0.12); box-shadow:0 8px 30px rgba(2,6,23,0.6); }
  .filters { display:flex; flex-direction:row; gap:0.5rem; flex-wrap:wrap; align-items:center; }
  form.filters-form input, form.filters-form select { background: rgba(30,41,59,0.7); color:var(--text); border:1px solid rgba(71,85,105,0.35); padding:0.5rem; border-radius:8px; }
  .cards { display:grid; grid-template-columns: repeat(3,1fr); gap:0.75rem; }
  .stat { padding:0.75rem; border-radius:10px; background:linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); }
  .stat h3 { margin:0; font-size:0.9rem; color:#94a3b8; font-weight:600; }
  .stat .val { font-weight:800; font-size:1.3rem; margin-top:0.4rem; }
  .chart { height:120px; display:flex; gap:6px; align-items:end; padding-top:10px; }
  .bar { background:linear-gradient(180deg,#3b82f6,#1e3a8a); border-radius:6px 6px 4px 4px; width:18px; display:flex; align-items:flex-end; justify-content:center; color:rgba(255,255,255,0.9); font-size:10px; padding-bottom:4px; }
  .list { margin-top:1rem; display:grid; gap:0.75rem; }
  .group { padding:0.85rem; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(59,130,246,0.04); }
  .group-header { display:flex; justify-content:space-between; align-items:center; gap:0.5rem; cursor:pointer; }
  .items { margin-top:0.6rem; display:grid; gap:0.45rem; }
  .item { display:flex; justify-content:space-between; gap:0.5rem; padding:0.45rem; border-radius:8px; background:rgba(0,0,0,0.12); align-items:center; }
  .meta { color:#94a3b8; font-size:0.85rem; }
  .small { font-size:0.8rem; color:#94a3b8; }
  .edit-row { display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; width:100%; }
  .edit-row input, .edit-row select { background: rgba(30,41,59,0.7); color:var(--text); border:1px solid rgba(71,85,105,0.35); padding:0.35rem 0.5rem; border-radius:6px; }
  .btn { padding:0.4rem 0.65rem; border-radius:6px; border:none; cursor:pointer; }
  .btn.save { background:#10b981; color:white; }
  .btn.cancel { background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--text); }
  .btn.edit { background:#3b82f6; color:white; }
  .err { color:#f87171; font-size:0.85rem; margin-top:0.25rem; }
  @media (max-width:900px) { .top-grid { grid-template-columns: 1fr; } .cards { grid-template-columns: repeat(2,1fr); } }
</style>

<div class="container">
  <h1 style="margin-bottom:0.6rem">Dashboard — Transactions</h1>

  <div class="top-grid">
    <div class="card">
      <form class="filters-form" method="get" style="display:flex;flex-direction:column;gap:0.6rem">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <div class="filters">
            <label class="small muted">From</label>
            <input type="date" name="startDate" value={data.filters?.startDate ?? ''} />
            <label class="small muted">To</label>
            <input type="date" name="endDate" value={data.filters?.endDate ?? ''} />
            <label class="small muted">Account</label>
            <select name="accountId">
              <option value="">All</option>
              {#each data.accounts as a}
                <option value={a.id} selected={a.id === data.filters?.accountId}>{a.name}</option>
              {/each}
            </select>
            <label class="small muted">Categories (comma)</label>
            <input type="text" name="categories" placeholder="food,transport" value={data.filters?.categories?.join?.(',') ?? (data.filters?.categories || '')} />
            <label class="small muted">Min</label>
            <input type="number" step="0.01" name="minAmount" placeholder="0" value={data.filters?.minAmount ?? ''} />
            <label class="small muted">Max</label>
            <input type="number" step="0.01" name="maxAmount" placeholder="0" value={data.filters?.maxAmount ?? ''} />
          </div>
        </div>

        <div style="display:flex;gap:0.5rem;justify-content:flex-end">
          <button class="small" type="submit" style="padding:0.5rem 0.75rem;border-radius:8px;background:#3b82f6;color:white;border:none">Apply</button>
          <a href="/dashboard" class="small" style="padding:0.5rem 0.75rem;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04);color:var(--text)">Clear</a>
        </div>
      </form>

      <div style="margin-top:0.8rem" class="cards">
        <div class="stat">
          <h3>Total Spent</h3>
          <div class="val">{fmtAmount(data.totals?.totalSpent ?? 0)}</div>
          <div class="small muted">{data.totals?.transactionsCount ?? 0} txns</div>
        </div>
        <div class="stat">
          <h3>Total Income</h3>
          <div class="val">{fmtAmount(data.totals?.totalIncome ?? 0)}</div>
          <div class="small muted">Net: {fmtAmount(data.totals?.net ?? 0)}</div>
        </div>
        <div class="stat">
          <h3>Top Category</h3>
          {#if data.topCategories?.length}
            <div class="val">{data.topCategories[0].category}</div>
            <div class="small muted">{fmtAmount(data.topCategories[0].total)}</div>
          {:else}
            <div class="val">—</div>
            <div class="small muted">No data</div>
          {/if}
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="small muted" style="margin:0 0 0.5rem 0">Monthly (recent)</h3>
      <div class="chart" aria-hidden="true">
        {#if data.monthlySeries?.length}
          {#each data.monthlySeries as m}
            {#if data.monthlySeries.length}
              <!-- scale bars by max absolute value -->
              <div
                class="bar"
                style="height: {Math.max(6, Math.round((Math.abs(m.total) / Math.max(...data.monthlySeries.map(x=>Math.abs(x.total),0))) * 100))}%"
                title="{m.month}: {fmtAmount(m.total)}"
              >
              </div>
            {/if}
          {/each}
        {:else}
          <div class="small muted">No monthly data</div>
        {/if}
      </div>

      <div style="margin-top:0.6rem">
        <h4 style="margin:0 0 0.35rem 0">Top categories</h4>
        <ul class="small muted">
          {#if data.topCategories?.length}
            {#each data.topCategories as c}
              <li>{c.category} — {fmtAmount(c.total)}</li>
            {/each}
          {:else}
            <li>No categories</li>
          {/if}
        </ul>
      </div>
    </div>
  </div>

  <div class="list">
    {#if !grouped || grouped.length === 0}
      <div class="card small muted">No transactions found for the selected filters.</div>
    {:else}
      {#each grouped as group}
        <div class="group">
          <div class="group-header" on:click={() => toggle(group.date)}>
            <div>
              <div style="font-weight:700">{fmtDate(group.date)}</div>
              <div class="small muted">{group.items.length} item{group.items.length>1?'s':''}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700">{fmtAmount(group.total)}</div>
              <div class="small muted">{openGroups.has(group.date) ? 'Hide' : 'Show'}</div>
            </div>
          </div>

          {#if openGroups.has(group.date)}
            <div class="items">
              {#each group.items as it}
                <div class="item">
                  {#if editingId === it.id}
                    <div style="flex:1">
                      <div class="edit-row">
                        <input type="date" bind:value={editingDraft.date} />
                        <input type="number" step="0.01" bind:value={editingDraft.amount} style="width:120px" />
                        <input placeholder="Category" bind:value={editingDraft.category} style="width:160px" />
                        <input placeholder="Subcategory" bind:value={editingDraft.subcategory} style="width:140px" />
                        <input placeholder="Description" bind:value={editingDraft.description} style="flex:1" />
                      </div>
                      {#if errorMsg}<div class="err">{errorMsg}</div>{/if}
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;margin-left:8px">
                      <button class="btn save" on:click|preventDefault={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                      <button class="btn cancel" on:click|preventDefault={cancelEdit}>Cancel</button>
                    </div>
                  {:else}
                    <div style="flex:1">
                      <div style="font-weight:700">{it.category ?? '—'}{it.subcategory ? ` › ${it.subcategory}` : ''}</div>
                      <div class="meta">{it.description ?? ''} · <span class="small muted">{it.account_id ?? ''}</span></div>
                    </div>

                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-left:8px">
                      <div style="font-weight:700">{fmtAmount(Number(it.amount) || 0)}</div>
                      <div style="display:flex;gap:6px">
                        <button class="btn edit" on:click={() => startEdit(it, group.date)}>Edit</button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>