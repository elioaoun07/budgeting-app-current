<script lang="ts">
  import { enhance } from '$app/forms';

  // `form` is populated by the server action response
  export let form:
    | { error?: string; message?: string; email?: string; full_name?: string }
    | undefined;
</script>

<div class="auth-wrap">
  <h1>Create your account</h1>

  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
  {#if form?.message}
    <p class="message">{form.message}</p>
  {/if}

  <form method="POST" use:enhance>
    <label>
      Full name
      <input name="full_name" type="text" value={form?.full_name ?? ''} autocomplete="name" required />
    </label>

    <label>
      Email
      <input name="email" type="email" value={form?.email ?? ''} autocomplete="email" required />
    </label>

    <label>
      Password
      <input name="password" type="password" minlength="6" autocomplete="new-password" required />
    </label>

    <label>
      Confirm password
      <input name="confirm" type="password" minlength="6" autocomplete="new-password" required />
    </label>

    <button type="submit">Sign up</button>
  </form>

  <p class="foot">
    Already have an account? <a href="/login">Log in</a>
  </p>
</div>

<style>
  .auth-wrap { max-width: 420px; margin: 4rem auto; display: grid; gap: 1rem; }
  form { display: grid; gap: .75rem; }
  label { display: grid; gap: .35rem; font-size: .95rem; }
  input { padding: .7rem .8rem; border-radius: .5rem; border: 1px solid var(--border, #3b3b3b33); }
  button { padding: .8rem 1rem; border: 0; border-radius: .6rem; cursor: pointer; }
  .error { color: #ff6961; }
  .message { color: #66c18c; }
  .foot { opacity: .9; }
</style>