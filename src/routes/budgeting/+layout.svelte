<!-- src/routes/budgeting/+layout.svelte -->
<script lang="ts">
  import '../../app.css';
  import { onMount } from 'svelte';
  import { initBudgetingStore } from '$lib/budgeting/store';

  // once the page is mounted in the browser, wire up our localStorage logic
  onMount(() => {
    initBudgetingStore();
  });
</script>

<slot />