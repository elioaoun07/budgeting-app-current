<script lang="ts">
  // Simple placeholder help page. Replace contact details with real support channels.
  const supportEmail = 'support@example.com';
  const docsUrl = '/docs';
  const reportBugUrl = 'https://github.com/elioaoun07/budgeting-app-current/issues/new';
</script>

<div class="container">
  <div class="card" role="main" aria-labelledby="help-title">
    <div class="brand">
      <div class="logo">B</div>
      <div>
        <h1 id="help-title">Help & Support</h1>
        <div class="muted">Find answers, report issues, or contact our support team.</div>
      </div>
    </div>

    <div class="section">
      <h2>Documentation</h2>
      <p>Check our docs for how to use the app and troubleshoot common issues.</p>
      <a class="btn" href={docsUrl}>Open documentation</a>
    </div>

    <div class="section">
      <h2>Contact support</h2>
      <p>If you can't find an answer, email us and include a short description and screenshots.</p>
      <a class="btn" href={`mailto:${supportEmail}?subject=Support%20request`}>Email support</a>
    </div>

    <div class="section">
      <h2>Report a bug</h2>
      <p>Found a bug or unexpected behavior? Help us improve by reporting it.</p>
      <a class="btn ghost" href={reportBugUrl} target="_blank" rel="noopener">Report an issue</a>
    </div>

    <div class="footer">
      <a href="/login">Back to login</a>
      <a href="/forgot-password">Forgot password</a>
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  .container { min-height: calc(100vh - 40px); display:flex; align-items:center; justify-content:center; padding:40px 16px; }
  .card { width:100%; max-width:680px; padding:24px; border-radius:12px; background:linear-gradient(180deg, rgba(10,14,25,0.6), rgba(15,23,42,0.7)); border:1px solid rgba(59,130,246,0.06); box-shadow:0 10px 30px rgba(2,6,23,0.6); color:#e6eefb; }
  .brand { display:flex; gap:12px; align-items:center; margin-bottom:10px; }
  .logo { width:44px; height:44px; border-radius:10px; background:linear-gradient(135deg,#1e3a8a,#3b82f6); display:flex; align-items:center; justify-content:center; color:white; font-weight:700; }
  h1 { margin:0; font-size:1.15rem; }
  .muted { color:#98a6bf; font-size:0.95rem; }

  .section { margin-top:14px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.03); }
  .section h2 { margin:0 0 6px 0; font-size:1rem; }
  .section p { margin:0 0 8px 0; color:#b9c7e8; }

  .btn { display:inline-block; padding:0.6rem 0.9rem; border-radius:8px; background:linear-gradient(135deg,#1e3a8a,#3b82f6); color:white; text-decoration:none; font-weight:600; }
  .btn.ghost { background:transparent; color:#cfe0ff; border:1px solid rgba(255,255,255,0.04); }

  .footer { display:flex; justify-content:space-between; margin-top:16px; }
  .footer a { color:#cfe0ff; text-decoration:none; }
</style>
