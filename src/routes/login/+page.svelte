<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  let username = '';
  let password = '';
  let error = '';

  async function submit() {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      // clear any cached data, then redirect
      await invalidateAll();
      window.location.href = '/budgeting';
    } else {
      error = 'Invalid credentials';
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  {#if error}<p style="color:red">{error}</p>{/if}
  <label>
    Username
    <input bind:value={username} required />
  </label>
  <label>
    Password
    <input type="password" bind:value={password} required />
  </label>
  <button type="submit">Log In</button>
</form>