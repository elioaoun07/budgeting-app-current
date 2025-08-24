<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let password = '';
  let confirm = '';
  let errorMsg = '';
  let message = '';
  let sessionReady = false;
  let loadingSession = true;
  let submitting = false;
  let showPassword = false;
  let showConfirm = false;
  let invalidToken = false;
  let passwordInput: HTMLInputElement | null = null;

  onMount(async () => {
    // parse fragment params
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const access_token = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');

    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      });
      if (error) {
        errorMsg = error.message;
      } else {
        sessionReady = true;
      }
    } else {
      // no tokens in the URL fragment — guide the user to request a new reset
      invalidToken = true;
    }

    loadingSession = false;

    if (sessionReady) {
      await tick();
      passwordInput?.focus();
    }
  });

  async function updatePassword() {
    errorMsg = '';
    message = '';
    if (!sessionReady) {
      errorMsg = 'Session not restored yet';
      return;
    }
    if (!password || !confirm) {
      errorMsg = 'Please fill both fields';
      return;
    }
    if (password !== confirm) {
      errorMsg = 'Passwords do not match';
      return;
    }

    submitting = true;
    const { error } = await supabase.auth.updateUser({ password });
    submitting = false;
    if (error) {
      errorMsg = error.message;
    } else {
      message = 'Password updated! Redirecting to login...';
      setTimeout(() => (window.location.href = '/login'), 1200);
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') updatePassword();
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  :global(body) {
    background: linear-gradient(180deg, #070911 0%, #071129 60%);
    color: #e2e8f0;
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }

  .container {
    min-height: calc(100vh - 40px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
  }

  .card {
    width: 100%;
    max-width: 480px;
    background: linear-gradient(180deg, rgba(10,14,25,0.6), rgba(15,23,42,0.7));
    border: 1px solid rgba(59,130,246,0.06);
    box-shadow: 0 8px 30px rgba(2,6,23,0.6);
    border-radius: 12px;
    padding: 28px;
  }

  .brand {
    display:flex; align-items:center; gap:12px; margin-bottom:8px;
  }
  .logo {
    width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#1e3a8a,#3b82f6);
    display:flex; align-items:center; justify-content:center; color:white; font-weight:700;
  }

  h1 { margin:0; font-size:1.2rem; }
  .muted { color:#98a6bf; font-size:0.95rem; margin-bottom:14px; }

  .input-row { display:flex; gap:8px; align-items:center; margin-bottom:12px; }
  .input-field {
    flex:1; padding:0.9rem 12px; background: rgba(8,12,20,0.6); border-radius:8px; border:1px solid rgba(71,85,105,0.22);
    color:#e2e8f0; font-size:0.98rem; box-sizing:border-box;
  }
  .field-action { background:transparent; border:none; color:#9fb3f8; cursor:pointer; padding:6px 8px; border-radius:6px; }
  .field-action:disabled { opacity:0.5; cursor:not-allowed; }

  .note { font-size:0.9rem; color:#9ca6bf; margin-bottom:12px; }

  .error { color:#fecaca; background:rgba(239,68,68,0.04); padding:10px; border-radius:8px; margin-bottom:10px; }
  .success { color:#bbf7d0; background:rgba(16,185,129,0.04); padding:10px; border-radius:8px; margin-bottom:10px; }

  .submit-btn {
    width:100%; padding:0.95rem; border-radius:10px; border:none; font-weight:700; color:white;
    background: linear-gradient(135deg,#1e3a8a,#3b82f6); cursor:pointer; font-size:1rem;
  }
  .submit-btn[disabled] { opacity:0.6; cursor:not-allowed; }

  .footer { margin-top:12px; display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .footer a { color:#cfe0ff; text-decoration:none; font-size:0.95rem; }

  .loader { width:20px; height:20px; border-radius:50%; border:3px solid rgba(255,255,255,0.08); border-top-color: #3b82f6; animation:spin 1s linear infinite; display:inline-block; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>

<div class="container">
  <div class="card" role="main" aria-labelledby="reset-title">
    <div class="brand">
      <div class="logo">B</div>
      <div>
        <h1 id="reset-title">Reset your password</h1>
        <div class="muted">Enter a new password to finish resetting your account.</div>
      </div>
    </div>

    {#if loadingSession}
      <div class="note">Restoring session... <span class="loader" aria-hidden="true"></span></div>
    {/if}
    {#if invalidToken}
      <div class="error" role="alert">
        Invalid or missing reset token. You can request a new password reset link.
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <a class="submit-btn" href="/forgot-password" style="text-align:center;display:inline-block;flex:1;">Request password reset</a>
        <a href="/login" class="field-action" style="align-self:center;">Back to login</a>
      </div>
    {/if}

    {#if errorMsg}
      <div class="error" role="alert">{errorMsg}</div>
    {/if}
    {#if message}
      <div class="success" role="status">{message}</div>
    {/if}

    <div class="input-row">
      <input
        class="input-field"
        bind:this={passwordInput}
        type={showPassword ? 'text' : 'password'}
        bind:value={password}
        placeholder="New password"
        aria-label="New password"
        on:keydown={onKey}
        disabled={invalidToken}
      />
      <button class="field-action" type="button" on:click={() => (showPassword = !showPassword)} aria-pressed={showPassword} aria-label="Toggle show password" disabled={invalidToken}>
        {#if showPassword}Hide{:else}Show{/if}
      </button>
    </div>

    <div class="input-row">
      <input
        class="input-field"
        type={showConfirm ? 'text' : 'password'}
        bind:value={confirm}
        placeholder="Confirm password"
        aria-label="Confirm password"
        on:keydown={onKey}
        disabled={invalidToken}
      />
      <button class="field-action" type="button" on:click={() => (showConfirm = !showConfirm)} aria-pressed={showConfirm} aria-label="Toggle show confirm" disabled={invalidToken}>
        {#if showConfirm}Hide{:else}Show{/if}
      </button>
    </div>

    <div class="note">Use a strong password. We recommend 8+ characters with numbers or symbols.</div>

  <button class="submit-btn" on:click={updatePassword} disabled={invalidToken || !sessionReady || !password || !confirm || submitting} aria-busy={submitting}>
      {#if submitting}Saving...{:else}Update password{/if}
    </button>

    <div class="footer">
      <div>
        <a href="/login">Back to login</a>
      </div>
      <div class="muted">Need help? <a href="/help" style="color:#9fb3f8">Contact support</a></div>
    </div>
  </div>
</div>
