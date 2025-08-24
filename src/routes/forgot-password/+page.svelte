<script lang="ts">
  import { enhance } from '$app/forms';

  export let form: { error?: string; message?: string; email?: string } | undefined;

  let submitting = false;

  function handleEnhance(formEl: HTMLFormElement) {
    return enhance(formEl, {
      pending() {
        submitting = true;
      },
      result({ type, update }) {
        // simple UX: stop spinner when result arrives
        submitting = false;
        return update;
      }
    });
  }
</script>

<div class="container">
  <div class="card" role="main" aria-labelledby="forgot-title">
    <div class="brand">
      <div class="logo">B</div>
      <div>
        <h1 id="forgot-title">Recover your credentials</h1>
        <div class="muted">Enter your email and we'll send a secure reset link.</div>
      </div>
    </div>

    {#if form?.error}
      <div class="error" role="alert" aria-live="assertive">{form.error}</div>
    {/if}
    {#if form?.message}
      <div class="message" role="status" aria-live="polite">{form.message}</div>
    {/if}

    <form method="POST" use:handleEnhance class="form">
      <label class="label">Email</label>
      <div class="input-row">
        <input
          class="input"
          type="email"
          name="email"
          required
          value={form?.email ?? ''}
          placeholder="you@domain.com"
          aria-label="Email address"
        />
        <button class="submit" type="submit" disabled={submitting} aria-busy={submitting}>
          {#if submitting}
            Sending...
          {:else}
            Send Reset Link
          {/if}
        </button>
      </div>
    </form>

    <div class="footer">
      <a href="/login">Back to login</a>
      <a href="/help" class="support">Contact support</a>
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .container { min-height: calc(100vh - 40px); display:flex; align-items:center; justify-content:center; padding:40px 16px; }
  .card { width:100%; max-width:520px; padding:24px; border-radius:12px; background:linear-gradient(180deg, rgba(10,14,25,0.6), rgba(15,23,42,0.7)); border:1px solid rgba(59,130,246,0.06); box-shadow:0 10px 30px rgba(2,6,23,0.6); color:#e6eefb; }
  .brand { display:flex; gap:12px; align-items:center; margin-bottom:8px; }
  .logo { width:44px; height:44px; border-radius:10px; background:linear-gradient(135deg,#1e3a8a,#3b82f6); display:flex; align-items:center; justify-content:center; color:white; font-weight:700; }
  h1 { margin:0; font-size:1.15rem; }
  .muted { color:#98a6bf; font-size:0.95rem; }

  .error { color:#fecaca; background:rgba(239,68,68,0.04); padding:10px; border-radius:8px; margin:10px 0; }
  .message { color:#bbf7d0; background:rgba(16,185,129,0.04); padding:10px; border-radius:8px; margin:10px 0; }

  .form { margin-top:8px; }
  .label { display:block; margin-bottom:6px; color:#bcd2ff; }
  .input-row { display:flex; gap:8px; align-items:center; }
  .input { flex:1; padding:0.9rem 12px; border-radius:8px; border:1px solid rgba(71,85,105,0.22); background:rgba(8,12,20,0.6); color:#e6eefb; }
  .input::placeholder { color:#8fa3d6; }

  .submit { padding:0.85rem 12px; border-radius:10px; border:none; background:linear-gradient(135deg,#1e3a8a,#3b82f6); color:white; font-weight:700; cursor:pointer; }
  .submit[disabled] { opacity:0.6; cursor:not-allowed; }

  .footer { display:flex; justify-content:space-between; margin-top:14px; font-size:0.95rem; }
  .footer a { color:#cfe0ff; text-decoration:none; }
  .support { color:#9fb3f8; }
</style>