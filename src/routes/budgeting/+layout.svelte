<!--
──────────────────────────────────────────────────────────────
src/routes/budgeting/+layout.svelte

Purpose ▸ Main layout for budgeting dashboard.
           Provides navigation, welcome animation, floating particles background,
           and slots for page content. Handles account/category loading and logout.

Exports ▸
  • Svelte layout – Budgeting dashboard shell

Depends ▸
  • $lib/budgeting/store – account/category stores
  • Svelte transitions/easing – for animations

Used in ▸
  • All budgeting dashboard pages

Notes   ▸ Responsive design, mobile sidebar, animated welcome, improved input/button styles.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadAccounts, loadCategories, currentAccount, accounts, categories, type TemplateEntry } from '$lib/budgeting/store';
  import { templates, addTemplate, removeTemplate, createTransactionFromTemplate } from '$lib/budgeting/store';
  import { updateTemplate } from '$lib/budgeting/store';
  import { quintOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  import { supabase } from '$lib/supabaseClient';

  export let data; // { user, initialPrefs, accounts }

  let showWelcome = true;
  let particles = [];
  let navOpen = false;
  let isMobile = false;
  let showUserMenu = false; // New state for user menu
  let transactionsExpanded = true; // State for transactions submenu

  // Quick actions state
  let qaOpen = false;
  let qaName = '';
  let qaAmount: number | null = null;
  let qaDesc = '';
  // template form fields
  let qaAccountId: string | null = null;
  let qaCategory: string | null = null;
  let qaSubcategory: string | null = null;
  let qaCategories: any[] = [];
  let qaSubcategories: string[] = [];
  // local reactive copy of templates
  let templatesLocal: any[] = [];
  const _unsub_templates = templates.subscribe(v => templatesLocal = v);

  // Edit-template modal state
  let editOpen = false;
  let editTemplate: TemplateEntry | null = null;
  let editName = '';
  let editAmount: number | null = null;
  let editAccountId: string | null = null;
  let editCategory: string | null = null;
  let editSubcategory: string | null = null;
  let editDescription = '';
  // lists for edit modal (dependent on account/category)
  let editCategories: any[] = [];
  let editSubcategories: string[] = [];

  function openEditTemplate(t) {
    editTemplate = t;
    editName = t.name;
    editAmount = t.amount;
    editAccountId = t.account_id ?? $currentAccount?.id ?? null;
    editCategory = t.category ?? null;
    editSubcategory = t.subcategory ?? null;
    editDescription = t.description ?? '';
    editOpen = true;
  }

  function closeEditTemplate() {
    editOpen = false;
    editTemplate = null;
  }

  function saveEditedTemplate() {
    if (!editTemplate) return;
    updateTemplate(editTemplate.id, {
      name: editName,
      amount: editAmount ?? undefined,
      account_id: editAccountId ?? null,
      category: editCategory ?? null,
      subcategory: editSubcategory ?? null,
      description: editDescription ?? null
    });
    closeEditTemplate();
  }

  // reactively update edit modal category list when selected account changes
  $: if (editAccountId) {
    if ($currentAccount && editAccountId === $currentAccount.id) {
      editCategories = $categories ?? [];
    } else {
      (async () => {
        try {
          const res = await fetch(`/budgeting/api/user/categories?accountId=${encodeURIComponent(editAccountId)}`);
          if (res.ok) {
            const remote = await res.json();
            editCategories = Array.isArray(remote) ? remote : [];
          } else {
            editCategories = [];
          }
        } catch (err) {
          console.warn('Failed to load edit categories for account', editAccountId, err);
          editCategories = [];
        }
      })();
    }
    if (!editCategories.find(c => c.name === editCategory)) editCategory = null;
  } else {
    editCategories = $categories ?? [];
    if (!editCategories.find(c => c.name === editCategory)) editCategory = null;
  }

  // edit modal subcategories derive from selected category
  $: if (editCategory) {
    const found = editCategories.find(c => c.name === editCategory);
    editSubcategories = found && Array.isArray(found.subs) ? found.subs : [];
    if (!editSubcategories.includes(editSubcategory || '')) editSubcategory = null;
  } else {
    editSubcategories = [];
  }

  // Initialize floating particles
  onMount(() => {
  isMobile = window.innerWidth < 768;
    createParticles();
  // Show the sidebar by default on desktop, keep it closed on small screens.
  navOpen = !isMobile;
    // If server provided accounts, hydrate client store to avoid extra fetch.
    if (data?.accounts && data.accounts.length) {
      try {
        // Lazily import the store to avoid circular import in some setups
        import('$lib/budgeting/store').then(mod => {
          // Keep server-provided order but prefer the user's saved default account
          // for the initial selection (do not mutate the accounts array order).
          mod.accounts.set(data.accounts);
          if (data.accounts.length) {
            try {
              const def = typeof mod.getDefaultAccountId === 'function' ? mod.getDefaultAccountId() : null;
              const found = def ? data.accounts.find(a => a.id === def) : null;
              mod.currentAccount.set(found ?? data.accounts[0]);
            } catch (e) {
              try { mod.currentAccount.set(data.accounts[0]); } catch {}
            }
          }
        }).catch(() => {
          // Fallback to client-side load if hydrate fails
          loadAccounts();
        });
      } catch (e) {
        loadAccounts();
      }
    } else {
      loadAccounts();
    }
    
    // Hide welcome after delay
    setTimeout(() => {
      showWelcome = false;
    }, 2000);
  });

  // initialize default QA account on mount
  onMount(() => {
    qaAccountId = $currentAccount?.id ?? null;
  });

  // reactively update QA category list when selected account changes
  $: if (qaAccountId) {
    // if the QA account matches the global current account, reuse loaded categories
    if ($currentAccount && qaAccountId === $currentAccount.id) {
      qaCategories = $categories ?? [];
    } else {
      // fetch categories for that account from the user categories endpoint
      (async () => {
        try {
          const res = await fetch(`/budgeting/api/user/categories?accountId=${encodeURIComponent(qaAccountId)}`);
          if (res.ok) {
            const remote = await res.json();
            qaCategories = Array.isArray(remote) ? remote : [];
          } else {
            qaCategories = [];
          }
        } catch (err) {
          console.warn('Failed to load QA categories for account', qaAccountId, err);
          qaCategories = [];
        }
      })();
    }
    // reset dependent fields if no longer valid
    if (!qaCategories.find(c => c.name === qaCategory)) qaCategory = null;
  } else {
    qaCategories = $categories ?? [];
    if (!qaCategories.find(c => c.name === qaCategory)) qaCategory = null;
  }

  // subcategories derive from selected category
  $: if (qaCategory) {
    const found = qaCategories.find(c => c.name === qaCategory);
    qaSubcategories = found && Array.isArray(found.subs) ? found.subs : [];
    if (!qaSubcategories.includes(qaSubcategory || '')) qaSubcategory = null;
  } else {
    qaSubcategories = [];
  }

  function createParticles() {
    particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
  }

  // Load categories when account changes
  $: if ($currentAccount) {
    loadCategories();
  }

  function toggleNav() {
    navOpen = !navOpen;
  }

  // Unified menu click handler: ensure clicking the hamburger will close the
  // sidebar when it's open (and open when closed). This avoids any edge-case
  // where a toggle might be missed by other UI state.
  function handleMenuClick(event) {
    // keep normal behavior but be explicit about closing
    if (navOpen) {
      navOpen = false;
    } else {
      navOpen = true;
    }
  }

  // Toggle user menu visibility
  function toggleUserMenu() {
    showUserMenu = !showUserMenu;
  }

  // Toggle transactions submenu
  function toggleTransactions() {
    transactionsExpanded = !transactionsExpanded;
  }

  function dispatchEditCategories() {
    // Create custom event for editing categories
    window.dispatchEvent(new CustomEvent('requestEditCategories'));
  }

  // Close user menu when clicking outside
  function handleClickOutside(event) {
    if (showUserMenu && !document.getElementById('user-menu-container')?.contains(event.target)) {
      showUserMenu = false;
    }
  }

  // Add event listener for outside clicks
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function logout() {
    // Best-effort server-side logout first (clears server session cookies)
    try {
      await fetch('/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (err) {
      // Non-fatal: log and continue to client-side sign-out
      console.warn('Server logout request failed (continuing):', err);
    }

    try {
      // Sign out from Supabase (client session)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
      }
    } catch (error) {
      console.error('Supabase signOut failed:', error);
    } finally {
      // Close the user menu and force navigation to the login page.
      // Use replace so logout doesn't remain in history.
      showUserMenu = false;
      try {
        window.location.replace('/login');
      } catch (e) {
        // Fallback to href assignment
        window.location.href = '/login';
      }
    }
  }

  async function help() {
    // Close the user menu and navigate to the help page.
    showUserMenu = false;
    try {
      window.location.replace('/help');
    } catch (e) {
      window.location.href = '/help';
    }
  }

  // Quick actions helpers
  async function saveQuickAsTemplate() {
    if (!qaName || qaAmount === null || Number.isNaN(qaAmount)) return;
    const accId = qaAccountId ?? $currentAccount?.id ?? null;
    addTemplate({
      name: qaName,
      amount: qaAmount,
      account_id: accId,
      description: qaDesc,
      category: qaCategory ?? null,
      subcategory: qaSubcategory ?? null
    });
    qaName = '';
    qaAmount = null;
    qaDesc = '';
    qaAccountId = $currentAccount?.id ?? null;
    qaCategory = null;
    qaSubcategory = null;
    qaOpen = false;
  }

  async function useTemplate(t) {
  // open a confirmation dialog so user can adjust amount/description before committing
  confirmTemplate = t;
  confirmAmount = t.amount;
  confirmDescription = t.description ?? '';
  confirmOpen = true;
  }

  // --- Toast / mobile success messages ---
  type Toast = { id: number; message: string; type?: 'success' | 'error' };
  let toasts: Toast[] = [];

  // Confirm-before-send modal state
  let confirmOpen = false;
  let confirmTemplate: TemplateEntry | null = null;
  let confirmAmount: number | null = null;
  let confirmDescription: string = '';

  async function confirmSend() {
    if (!confirmTemplate) return;
    try {
      const payload = { ...confirmTemplate, amount: confirmAmount, description: confirmDescription } as any;
      // createTransactionFromTemplate expects a TemplateEntry but will POST to transactions; forward edited fields
      const created = await createTransactionFromTemplate(payload as any);
      window.dispatchEvent(new CustomEvent('transactionCreated', { detail: { amount: confirmAmount, category: confirmTemplate.category } }));
    } catch (err) {
      console.error('Failed to create transaction from confirmed template', err);
      window.dispatchEvent(new CustomEvent('transactionFailed', { detail: { message: String(err?.message ?? err) } }));
    } finally {
      confirmOpen = false;
      confirmTemplate = null;
      confirmAmount = null;
      confirmDescription = '';
    }
  }

  function cancelConfirm() {
    confirmOpen = false;
    confirmTemplate = null;
    confirmAmount = null;
    confirmDescription = '';
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    toasts = [{ id, message, type }, ...toasts];
    // auto-dismiss
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3200);
  }

  function removeToast(id: number) {
    toasts = toasts.filter(t => t.id !== id);
  }

  // Listen for global transactionCreated events and show a mobile-friendly toast
  onMount(() => {
    const handler = (e: any) => {
      const d = e?.detail ?? {};
      const amt = d.amount ?? d?.amount === 0 ? d.amount : null;
      const prettyAmt = amt !== null && amt !== undefined ? `$${Number(amt).toFixed(2)}` : '';
      const category = d.category ?? d?.categoryName ?? '';
      const message = d.message ?? `Logged ${prettyAmt} ${category ? `to ${category}` : 'transaction'}`.trim();
      showToast(message, 'success');
    };

    window.addEventListener('transactionCreated', handler as EventListener);

    const failedHandler = (e: any) => {
      const msg = e?.detail?.message ?? 'Failed to log transaction';
      showToast(msg, 'error');
    };

    window.addEventListener('transactionFailed', failedHandler as EventListener);

    return () => {
      window.removeEventListener('transactionCreated', handler as EventListener);
      window.removeEventListener('transactionFailed', failedHandler as EventListener);
    };
  });

  // cleanup subscriptions
  onMount(() => {
    return () => {
      try { _unsub_templates(); } catch (e) {}
    };
  });
</script>

<!-- Floating particles background -->
<div class="particles-container">
  {#each particles as p (p.id)}
    <div 
      class="particle" 
      style="
        --x: {p.x}%;
        --y: {p.y}%;
        --size: {p.size}px;
        --duration: {p.duration}s;
        --delay: {p.delay}s;
      "
    ></div>
  {/each}
</div>

<!-- Welcome animation -->
{#if showWelcome}
  <div class="welcome-screen" out:fly={{ y: -50, duration: 800, easing: quintOut }}>
    <div class="logo-container">
      <div class="logo-badge">
        <svg viewBox="0 0 48 48" width="48" height="48">
          <path fill="currentColor" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm10 26l-4-4-6 6-6-6-4 4-6-6 2-2 14 14 16-16 2 2-10 10z"/>
        </svg>
      </div>
      <h1 class="app-name">xPEND<span class="app-name-light">ING</span></h1>
    </div>
    <p class="welcome-subtitle">Advanced Financial Intelligence</p>
  </div>
{/if}

<!-- Main app container -->
<div class="app-container" in:fade={{ duration: 500 }}>
  <!-- Top navigation bar -->
  <header class="top-bar">
    <div class="nav-left">
  <button class="menu-button" on:click={handleMenuClick} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <h2 class="page-title">Dashboard</h2>
    </div>
    
    <div class="nav-right">
      <div class="user-info" id="user-menu-container">
        <span class="user-name">{data.user?.email?.split('@')[0] ?? 'User'}</span>
        <div class="user-avatar" on:click={toggleUserMenu} role="button" aria-label="User menu">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        
        <!-- User dropdown menu -->
        {#if showUserMenu}
          <div class="user-menu" out:fly={{ y: 10, duration: 200 }}>
            <button class="user-menu-item" on:click={help}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path d="M9.09 9a3 3 0 1 1 5.82 1c-.26.78-.92 1.07-1.82 1.72C12.6 12.88 12 13.5 12 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Help
            </button>
            <button class="user-menu-item" on:click={logout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <!-- Side navigation -->
  <nav class="side-nav" class:open={navOpen} class:mobile={isMobile}>
    <div class="nav-header">
      <div class="logo-badge small">
        <svg viewBox="0 0 48 48" width="24" height="24">
          <path fill="currentColor" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm10 26l-4-4-6 6-6-6-4 4-6-6 2-2 14 14 16-16 2 2-10 10z"/>
        </svg>
      </div>
      <h3 class="nav-app-name">xPEND<span class="app-name-light">ING</span></h3>
    </div>
    
    <ul class="nav-menu">
      <li class="nav-item {transactionsExpanded ? 'expanded' : ''}">
        <button class="nav-link nav-parent {transactionsExpanded ? 'expanded' : ''}" on:click={toggleTransactions}>
          <div class="nav-link-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Transactions
          </div>
          <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        {#if transactionsExpanded}
          <ul class="sub-menu" transition:fly={{ y: -10, duration: 200 }}>
            <li class="sub-nav-item">
              <a href="/budgeting" class="sub-nav-link active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Overview
              </a>
            </li>
            <li class="sub-nav-item">
              <button class="sub-nav-link" on:click={() => dispatchEditCategories()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M18.5 2.50002C18.8978 2.10218 19.4374 1.87866 20 1.87866C20.5626 1.87866 21.1022 2.10218 21.5 2.50002C21.8978 2.89785 22.1213 3.43738 22.1213 4.00002C22.1213 4.56266 21.8978 5.10218 21.5 5.50002L12 15L8 16L9 12L18.5 2.50002Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Edit Categories
              </button>
            </li>
          </ul>
        {/if}
      </li>
      <li class="nav-item">
        <a href="/dashboard" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 4H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 4L14 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 20L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 20H21V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 4H9V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Dashboard
        </a>
      </li>
      <!-- <li class="nav-item">
        <a href="/budgets" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 17V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 17V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M15 17V14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 20V22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M20 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M2 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18.364 5.63604L16.95 7.05025" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M7.05029 16.9497L5.63608 18.3639" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18.364 18.364L16.95 16.95" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M7.05029 7.05025L5.63608 5.63604" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Budgets
        </a>
      </li>
      <li class="nav-item">
        <a href="/reports" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 3V19H21V3H3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 13H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 17H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Reports
        </a>
      </li>
      <li class="nav-item">
        <a href="/settings" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
             Simplified settings icon
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M19.4 15C19.2667 15.2667 19.36 15.8 19.7 16.2C20.04 16.6 20.5667 16.7333 21 16.5C21.4333 16.2667 21.7333 15.8667 21.8 15.4C21.8667 14.9333 21.7333 14.5 21.4 14.2C21.0667 13.9 20.5667 13.7667 20 13.8C19.4333 13.8333 19 14.0333 18.7 14.4C18.4 14.7667 18.2667 15.2 18.3 15.7C18.3333 16.2 18.5333 16.6333 18.9 16.9C19.2667 17.1667 19.7 17.2667 20.2 17.2C20.7 17.1333 21.1333 16.9 21.4 16.5C21.6667 16.1 21.7667 15.6333 21.7 15.1C21.6333 14.5667 21.4 14.1333 21 13.8C20.6 13.4667 20.1333 13.2667 19.6 13.2C19.0667 13.1333 18.6 13.2333 18.2 13.5C17.8 13.7667 17.5333 14.1667 17.4 14.7C17.2667 15.2333 17.3333 15.7667 17.6 16.2C17.8667 16.6333 18.2667 16.9333 18.8 17C19.3333 17.0667 19.8333 16.9667 20.3 16.7C20.7667 16.4333 21.1333 16.0333 21.4 15.5C21.6667 14.9667 21.7667 14.4 21.7 13.8C21.6333 13.2 21.4 12.6667 21 12.2C20.6 11.7333 20.1 11.4333 19.5 11.3C18.9 11.1667 18.3 11.2333 17.7 11.5C17.1 11.7667 16.6333 12.1667 16.3 12.7C15.9667 13.2333 15.8333 13.8333 15.9 14.5C15.9667 15.1667 16.2333 15.7667 16.7 16.2C17.1667 16.6333 17.7333 16.9 18.4 16.9C19.0667 16.9 19.6333 16.6333 20.1 16.1C20.5667 15.5667 20.8 14.9667 20.8 14.3" stroke="currentColor" stroke-width="2"/>
          </svg>
          Settings
        </a>
      </li> -->
    </ul>
    
    <div class="nav-footer">
      <button class="logout-button" on:click={logout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Logout
      </button>
    </div>
  </nav>

  <!-- Main content area -->
  <main class="main-content">
    <slot />
  </main>

  <!-- Quick Actions floating button -->
  <div class="quick-actions">
    <button class="qa-fab" aria-label="Quick actions" on:click={() => qaOpen = !qaOpen}>
      <!-- simple lightning / star icon -->
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15 9H22L16.5 13L19 20L12 16L5 20L7.5 13L2 9H9L12 2Z" stroke="white" stroke-width="0.8" fill="currentColor"/>
      </svg>
    </button>

    {#if qaOpen}
      <div class="qa-panel" out:fly={{ y: 6, duration: 120 }}>
        <h4>Quick Templates</h4>
        
        <!-- Template List -->
        <div class="qa-list">
          {#if templatesLocal.length === 0}
            <div class="qa-empty">No templates yet — add one below</div>
          {:else}
            {#each templatesLocal as t (t.id)}
              <div class="qa-item">
                <div class="qa-info">
                  <div class="qa-name">{t.name}</div>
                  <div class="qa-meta">${t.amount.toFixed(2)} · {t.description}</div>
                </div>
                <div class="qa-actions">
                  <button class="qa-use" on:click={() => useTemplate(t)} title="Log this transaction">Use</button>
                  <button class="qa-edit" on:click={() => openEditTemplate(t)} title="Edit template">✎</button>
                  <button class="qa-del" on:click={() => removeTemplate(t.id)} title="Remove template">×</button>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Add New Template Form -->
        <form on:submit|preventDefault={saveQuickAsTemplate}>
          <div class="input-group">
            <label for="qaName">Name</label>
            <input 
              type="text" 
              id="qaName" 
              placeholder="e.g. Daily coffee" 
              bind:value={qaName} 
              required 
            />
          </div>

          <div class="input-group">
            <label for="qaAccount">Account</label>
            <select 
              id="qaAccount" 
              bind:value={qaAccountId}
              required
            >
              <option value="">Select account</option>
              {#each $accounts as acc}
                <option value={acc.id}>{acc.name}</option>
              {/each}
            </select>
          </div>

          <div class="input-group">
            <label for="qaCategory">Category</label>
            <select 
              id="qaCategory" 
              bind:value={qaCategory}
              required
            >
              <option value="">Select category</option>
              {#each $categories as cat}
                <option value={cat.name}>{cat.name}</option>
              {/each}
            </select>
          </div>

          <div class="input-group">
            <label for="qaSubcategory">Subcategory</label>
            <select 
              id="qaSubcategory" 
              bind:value={qaSubcategory}
              disabled={!qaCategories || qaCategories.length === 0}
            >
              <option value="">Select subcategory</option>
              {#each qaSubcategories as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>

          <div class="input-group">
            <label for="qaAmount">Amount</label>
            <input 
              type="number" 
              id="qaAmount" 
              placeholder="Amount" 
              bind:value={qaAmount} 
              required 
            />
          </div>

          <div class="input-group">
            <label for="qaDesc">Description (optional)</label>
            <textarea 
              id="qaDesc" 
              placeholder="Description (optional)" 
              bind:value={qaDesc} 
            ></textarea>
          </div>

          <div class="qa-form-actions">
            <button type="submit" disabled={!qaName || qaAmount === null}>Save template</button>
            <button type="button" on:click={() => qaOpen = false}>Cancel</button>
          </div>
        </form>
      </div>
    {/if}
  </div>
</div>

<!-- Confirm modal -->
{#if confirmOpen && confirmTemplate}
  <div class="confirm-backdrop">
    <div class="confirm-modal" role="dialog" aria-modal="true">
      <h3>Confirm transaction</h3>
      <p class="confirm-meta">{confirmTemplate.name} · {confirmTemplate.category}{confirmTemplate.subcategory ? ` / ${confirmTemplate.subcategory}` : ''}</p>
      <label>Amount</label>
      <input type="number" bind:value={confirmAmount} />
      <label>Description</label>
      <input bind:value={confirmDescription} />
      <div class="qa-form-actions">
        <button type="submit" on:click={confirmSend}>Confirm</button>
        <button type="button" class="btn-secondary" on:click={cancelConfirm}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit template modal -->
{#if editOpen && editTemplate}
  <div class="confirm-backdrop">
    <div class="confirm-modal" role="dialog" aria-modal="true">
      <h3>Edit template</h3>

      <form on:submit|preventDefault={saveEditedTemplate}>
        <div class="input-group">
          <label for="editName">Name</label>
          <input id="editName" type="text" bind:value={editName} required />
        </div>

        <div class="input-group">
          <label for="editAccount">Account</label>
          <select id="editAccount" bind:value={editAccountId} required>
            <option value="">Select account</option>
            {#each $accounts as a}
              <option value={a.id}>{a.name}</option>
            {/each}
          </select>
        </div>

        <div class="input-group">
          <label for="editCategory">Category</label>
          <select id="editCategory" bind:value={editCategory} required>
            <option value="">Select category</option>
            {#each editCategories as c}
              <option value={c.name}>{c.name}</option>
            {/each}
          </select>
        </div>

        <div class="input-group">
          <label for="editSubcategory">Subcategory</label>
          <select id="editSubcategory" bind:value={editSubcategory} disabled={!editCategories || editCategories.length === 0}>
            <option value="">Select subcategory</option>
            {#each editSubcategories as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </div>

        <div class="input-group">
          <label for="editAmount">Amount</label>
          <input id="editAmount" type="number" bind:value={editAmount} />
        </div>

        <div class="input-group">
          <label for="editDesc">Description</label>
          <textarea id="editDesc" bind:value={editDescription}></textarea>
        </div>

        <div class="qa-form-actions">
          <button type="submit">Save</button>
          <button type="button" class="btn-secondary" on:click={closeEditTemplate}>Cancel</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
    background: #0a0f1c; /* From login page */
    color: #e2e8f0; /* From login page */
    overflow-x: hidden;
    position: relative;
  }

  .particles-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: var(--size);
    height: var(--size);
    background: rgba(59, 130, 246, 0.3); /* From login page - #3b82f6 with opacity */
    border-radius: 50%;
    top: var(--y);
    left: var(--x);
    animation: float var(--duration) infinite ease-in-out;
    animation-delay: var(--delay);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); /* From login page */
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(10px, 15px); }
    50% { transform: translate(20px, 5px); }
    75% { transform: translate(5px, 20px); }
  }

  .welcome-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0f1c, #1e3a8a); /* From login page */
    z-index: 1000;
  }

  .logo-container {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo-badge {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6); /* From login page */
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    box-shadow: 0 20px 40px rgba(30, 58, 138, 0.4); /* From login page */
    animation: float-slow 6s ease-in-out infinite;
  }

  .logo-badge.small {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    margin: 0;
  }

  .logo-badge svg {
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  .app-name {
    margin: 0;
    font-weight: 800;
    font-size: 2.5rem;
    letter-spacing: -1px;
    background: linear-gradient(90deg, #f1f5f9, #cbd5e1); /* From login page */
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-family: 'Space Grotesk', sans-serif;
  }

  .app-name-light {
    font-weight: 300;
    color: #94a3b8;
    opacity: 0.7;
  }

  .nav-app-name {
    margin: 0;
    font-weight: 700;
    font-size: 1.4rem;
    letter-spacing: -0.5px;
    background: linear-gradient(90deg, #f1f5f9, #cbd5e1); /* From login page */
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-family: 'Space Grotesk', sans-serif;
  }

  .welcome-subtitle {
    margin: 0;
    font-size: 1.1rem;
    color: #94a3b8; /* From login page */
    font-weight: 400;
    letter-spacing: 0.5px;
  }

  @keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }

  .app-container {
    display: flex;
    min-height: 100vh;
    position: relative;
  }

  .top-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: rgba(15, 23, 42, 0.85); /* From login page - card bg */
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(30, 58, 138, 0.2); /* From login page */
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    z-index: 100;
  }

  .nav-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .menu-button {
    background: none;
    border: none;
    color: #94a3b8; /* From login page */
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .menu-button:hover {
    background: rgba(59, 130, 246, 0.1); /* From login page */
    color: #e2e8f0; /* From login page */
  }

  .page-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #e2e8f0; /* From login page */
  }

  .nav-right {
    display: flex;
    align-items: center;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    position: relative;
  }

  .user-name {
    font-size: 0.9rem;
    color: #94a3b8; /* From login page */
    font-weight: 500;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6); /* From login page */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .user-avatar:hover {
    transform: scale(1.05);
  }

  .user-avatar svg {
    width: 100%;
    height: 100%;
    color: white;
  }

  /* User dropdown menu */
  .user-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(30, 58, 138, 0.3);
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    min-width: 150px;
    z-index: 1000;
    backdrop-filter: blur(10px);
  }

  .user-menu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    color: #e2e8f0;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .user-menu-item:hover {
    background: rgba(59, 130, 246, 0.15);
  }

  .side-nav {
    width: 260px;
    background: rgba(15, 23, 42, 0.7); /* From login page - card bg with less opacity */
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(30, 58, 138, 0.2); /* From login page */
    height: 100vh;
    position: fixed;
    top: 60px;
    left: 0;
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    z-index: 90;
  transform: translateX(0);
  }

  .side-nav.mobile {
    transform: translateX(-100%);
  }

  .side-nav.mobile.open {
    transform: translateX(0);
  }

  /* For non-mobile screens allow explicit closing via `.open` class.
     When `.open` is not present, hide the sidebar (so the hamburger can close it). */
  .side-nav:not(.open) {
    transform: translateX(-100%);
  }

  .nav-header {
    padding: 0 1.5rem 1.5rem;
    border-bottom: 1px solid rgba(30, 58, 138, 0.2); /* From login page */
    margin-bottom: 1rem;
  }

  .nav-menu {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
  }

  .nav-item {
    margin-bottom: 0.25rem;
  }

  .nav-item.active .nav-link {
    background: rgba(59, 130, 246, 0.15); /* From login page - primary color with opacity */
    color: #3b82f6; /* From login page - primary bright blue */
    border-left: 3px solid #3b82f6; /* From login page */
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.5rem;
    color: #94a3b8; /* From login page */
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
    background: none;
    border: none;
    width: 100%;
    cursor: pointer;
  }

  .nav-link:hover {
    background: rgba(59, 130, 246, 0.1); /* From login page */
    color: #e2e8f0; /* From login page */
  }

  .nav-link svg {
    flex-shrink: 0;
  }

  /* Enhanced nav parent styles */
  .nav-parent {
    justify-content: space-between;
    position: relative;
  }

  .nav-link-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .chevron {
    transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    opacity: 0.7;
  }

  .nav-parent.expanded .chevron {
    transform: rotate(180deg);
  }

  /* Sub-menu styles */
  .sub-menu {
    list-style: none;
    padding: 0;
    margin: 0;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    border-radius: 0 0 12px 12px;
    border: 1px solid rgba(30, 58, 138, 0.3);
    border-top: none;
    margin-left: 1rem;
    margin-right: 1rem;
    overflow: hidden;
    box-shadow: 
      0 10px 25px -5px rgba(0, 0, 0, 0.25),
      0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }

  .sub-nav-item {
    margin: 0;
  }

  .sub-nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 400;
    transition: all 0.2s ease;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    position: relative;
  }

  .sub-nav-link:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #e2e8f0;
    transform: translateX(4px);
  }

  .sub-nav-link.active {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    border-left: 2px solid #3b82f6;
  }

  .sub-nav-link svg {
    flex-shrink: 0;
    opacity: 0.8;
  }

  .nav-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(30, 58, 138, 0.2); /* From login page */
  }

  .logout-button {
    width: 100%;
    background: rgba(239, 68, 68, 0.1); /* Keeping red for logout */
    color: #f87171; /* Keeping red for logout */
    border: 1px solid rgba(239, 68, 68, 0.3); /* Keeping red for logout */
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }

  .logout-button:hover {
    background: rgba(239, 68, 68, 0.2); /* Keeping red for logout */
    color: #ef4444; /* Keeping red for logout */
  }

  /* --- Improved Input Styles --- */
  /* These styles target input fields within the main content area */
  .main-content input[type="text"],
  .main-content input[type="number"],
  .main-content input[type="email"],
  .main-content input[type="password"],
  .main-content textarea,
  .main-content select {
    width: 100%;
    padding: 0.85rem 1rem; /* Slightly reduced padding for a cleaner look */
    background: rgba(30, 41, 59, 0.7); /* From login page - input bg */
    border: 1px solid rgba(71, 85, 105, 0.4); /* From login page - border */
    border-radius: 8px; /* Slightly less rounded than login */
    font-size: 1rem;
    color: #e2e8f0; /* From login page - text */
    box-sizing: border-box;
    transition: all 0.2s ease; /* Faster, smoother transition */
    font-family: 'Inter', sans-serif; /* Ensure consistent font */
  }

  .main-content input[type="text"]:focus,
  .main-content input[type="number"]:focus,
  .main-content input[type="email"]:focus,
  .main-content input[type="password"]:focus,
  .main-content textarea:focus,
  .main-content select:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.8); /* Brighter blue focus border */
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25); /* Consistent focus glow */
    background: rgba(30, 41, 59, 0.9); /* Slightly lighter bg on focus */
  }

  /* Placeholder styling */
  .main-content input::placeholder,
  .main-content textarea::placeholder {
    color: #94a3b8; /* From login page - placeholder color */
    opacity: 1; /* Ensure full opacity */
  }

  /* Textarea specific adjustments */
  .main-content textarea {
    min-height: 100px; /* Standard height */
    resize: vertical; /* Allow vertical resizing only */
  }

  /* Labels for inputs (if used) */
  .main-content label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: #cbd5e1; /* Slightly lighter than secondary text */
  }

  /* Input groups for better organization */
  .main-content .input-group {
    margin-bottom: 1.25rem; /* Consistent spacing */
  }

  /* Buttons within forms */
  .main-content button:not(.nav-link, .sub-nav-link, .menu-button, .logout-button, .user-menu-item) {
    /* Target buttons that are not part of the nav */
    width: 100%;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6); /* Consistent with login */
    color: white;
    border: none;
    padding: 0.85rem; /* Match input height roughly */
    border-radius: 8px; /* Match input rounding */
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 4px 6px rgba(30, 58, 138, 0.2); /* Subtle shadow */
  }

  .main-content button:not(.nav-link, .sub-nav-link, .menu-button, .logout-button, .user-menu-item):hover {
    background: linear-gradient(135deg, #2c5282, #4299e1); /* Slightly different gradient on hover */
    transform: translateY(-2px); /* Subtle lift */
    box-shadow: 0 6px 8px rgba(30, 58, 138, 0.3); /* Enhanced shadow */
  }

  .main-content button:not(.nav-link, .sub-nav-link, .menu-button, .logout-button, .user-menu-item):active {
    transform: translateY(0); /* Reset on click */
    box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2); /* Reduced shadow */
  }

  .main-content button:not(.nav-link, .sub-nav-link, .menu-button, .logout-button, .user-menu-item):disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .main-content {
    flex: 1;
    margin-top: 60px;
    margin-left: 260px;
    padding: 2rem;
    min-height: calc(100vh - 60px);
    /* Optional: Add a subtle background to main content area */
    /* background: rgba(15, 23, 42, 0.5); */ 
  }

  @media (max-width: 768px) {
    .side-nav {
      transform: translateX(-100%);
    }
    
    .side-nav.open {
      transform: translateX(0);
    }
    
    .main-content {
      margin-left: 0;
      padding: 1.5rem;
    }
    
    .top-bar {
      padding: 0 1rem;
    }
    
    .logo-badge {
      width: 60px;
      height: 60px;
    }
    
    .app-name {
      font-size: 2rem;
    }
  }

/* Updated styles for Quick Actions */
.quick-actions {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1100;
}

.qa-fab {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
  border: none;
  box-shadow: 0 10px 30px rgba(30,58,138,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qa-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 15px 35px rgba(30,58,138,0.4);
}

.qa-panel {
  margin-bottom: 10px;
  width: 300px;
  background: rgba(15,23,42,0.95);
  border: 1px solid rgba(30,58,138,0.3);
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  margin-bottom: 12px;
}

.qa-list {
  max-height: 220px;
  overflow: auto;
  margin-bottom: 0.5rem;
}

.qa-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(71,85,105,0.06);
}

.qa-info {
  overflow: hidden;
}

.qa-name {
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 0.25rem;
}

.qa-meta {
  font-size: 0.85rem;
  color: #94a3b8;
}

.qa-actions {
  display: flex;
  gap: 0.5rem;
}

.qa-use, .qa-edit, .qa-del {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qa-use {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.qa-use:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  transform: translateY(-1px);
}

.qa-edit {
  background: rgba(110, 110, 110, 0.1);
  color: #6e6e6e;
  border: 1px solid rgba(110, 110, 110, 0.3);
}

.qa-edit:hover {
  background: rgba(110, 110, 110, 0.2);
  color: #6e6e6e;
  transform: translateY(-1px);
}

.qa-del {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.qa-del:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: translateY(-1px);
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #cbd5e1;
}

.input-group input[type="text"],
.input-group input[type="number"],
.input-group select,
.input-group textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 8px;
  font-size: 1rem;
  color: #e2e8f0;
  box-sizing: border-box;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
}

.input-group input[type="text"]:focus,
.input-group input[type="number"]:focus,
.input-group select:focus,
.input-group textarea:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  background: rgba(30, 41, 59, 0.9);
}

.input-group textarea {
  min-height: 60px;
  resize: vertical;
}

.qa-form-actions {
  display: flex;
  gap: 0.5rem;
}

.qa-form-actions button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.qa-form-actions button[type="submit"] {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  color: white;
}

.qa-form-actions button[type="submit"]:hover {
  background: linear-gradient(135deg, #2c5282, #4299e1);
  transform: translateY(-1px);
}

.qa-form-actions button[type="button"] {
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  border: 1px solid rgba(71, 85, 105, 0.4);
}

.qa-form-actions button[type="button"]:hover {
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
  transform: translateY(-1px);
}
/* Toast notifications (mobile-friendly) */
.toasts-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  z-index: 1200;
  pointer-events: none; /* let clicks pass through except for buttons */
}
.toast {
  pointer-events: auto;
  min-width: 200px;
  max-width: 92%;
  background: rgba(15,23,42,0.95);
  color: #e6fffa;
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 8px 24px rgba(2,6,23,0.6);
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(59,130,246,0.12);
  font-weight: 600;
}
.toast.success { background: linear-gradient(90deg, rgba(16,185,129,0.06), rgba(59,130,246,0.04)); color: #bbf7d0; border-color: rgba(16,185,129,0.18); }
.toast.error { background: linear-gradient(90deg, rgba(239,68,68,0.06), rgba(30,41,59,0.04)); color: #fecaca; border-color: rgba(239,68,68,0.12); }
.toast .close-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
}

/* Confirm modal */
.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}
.confirm-modal {
  width: 92%;
  max-width: 420px;
  background: rgba(15,23,42,0.98);
  border: 1px solid rgba(59,130,246,0.08);
  padding: 1rem;
  border-radius: 12px;
}
.confirm-modal h3 { margin: 0 0 8px 0; }
.confirm-meta { color: #94a3b8; font-size: 0.9rem; margin-bottom: 8px; }
.confirm-modal input { width: 100%; padding: 0.6rem; margin-bottom: 8px; background: rgba(30,41,59,0.7); border:1px solid rgba(71,85,105,0.4); border-radius:6px; color: #e2e8f0; }
.confirm-actions { display:flex; gap:8px; }
.confirm-actions .btn-secondary { background: transparent; border: 1px solid rgba(71,85,105,0.4); }
</style>

<!-- Toast markup -->
{#if toasts && toasts.length}
  <div class="toasts-container">
    {#each toasts as t (t.id)}
      <div class="toast {t.type}">
        <div class="toast-body">{t.message}</div>
        <button class="close-btn" on:click={() => removeToast(t.id)} aria-label="Dismiss">×</button>
      </div>
    {/each}
  </div>
{/if}