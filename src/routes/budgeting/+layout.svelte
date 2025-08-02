<script lang="ts">
  import { onMount } from 'svelte';
  import { loadAccounts, loadCategories, loadUserPrefs, currentAccount } from '$lib/budgeting/store';
  export let data; // { user, initialPrefs, accounts }

  // on start load their accounts
  onMount(() => {
    loadAccounts();
  });

  // whenever they pick (or we auto‐pick) an account, refresh cats + prefs
  $: if ($currentAccount) {
    loadCategories();
    loadUserPrefs();
  }
</script>

<slot />
