<!--
──────────────────────────────────────────────────────────────
src/routes/login/+page.svelte

Purpose ▸ Login page for xPENDING budgeting app.
           Lets the user sign in with email and password, shows animated quotes and particles.
           Handles authentication, error feedback, and redirects to dashboard on success.

Exports ▸
  • Svelte page – Login

Depends ▸
  • $app/navigation – SvelteKit navigation helpers
  • Svelte transitions/easing – for animations

Used in ▸
  • App entry (login)

Notes   ▸ Animated background, typing quotes, error/success feedback, responsive design.
──────────────────────────────────────────────────────────────
-->
<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  let email = '';
  let password = '';
  let error = '';
  let isSubmitting = false;
  let card;
  let inputs = [];
  let particles = [];
  let showParticles = false;
  let currentQuoteIndex = 0;
  let displayedText = '';
  let isDeleting = false;
  
  const quotes = [
    "Every expense tracked is XP earned toward financial mastery.",
    "Budget wisely, level up faster.",
    "Your financial journey begins with a single transaction.",
    "Spend smart, save smarter, succeed faster.",
    "Financial freedom is the ultimate achievement."
  ];

  // Initialize floating particles
  onMount(() => {
    createParticles();
    if (inputs[0]) inputs[0].focus();
    
    // Start typing animation
    typeText();
  });

  function createParticles() {
    particles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
  }

  function typeText() {
    const currentQuote = quotes[currentQuoteIndex];
    const typingSpeed = isDeleting ? 20 : 75;
    const pauseAfterTyping = 2000;
    const pauseAfterDeleting = 500;

    if (!isDeleting && displayedText.length < currentQuote.length) {
      // Typing
      displayedText = currentQuote.substring(0, displayedText.length + 1);
      setTimeout(typeText, typingSpeed);
    } else if (isDeleting && displayedText.length > 0) {
      // Deleting
      displayedText = displayedText.substring(0, displayedText.length - 1);
      setTimeout(typeText, typingSpeed);
    } else if (!isDeleting && displayedText.length === currentQuote.length) {
      // Pause after typing, then start deleting
      setTimeout(() => {
        isDeleting = true;
        typeText();
      }, pauseAfterTyping);
    } else {
      // Pause after deleting, then move to next quote
      setTimeout(() => {
        isDeleting = false;
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        typeText();
      }, pauseAfterDeleting);
    }
  }

  async function submit() {
    if (isSubmitting) return;
    isSubmitting = true;
    error = '';
    showParticles = true;
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      // Fire-and-forget global invalidation to avoid blocking the UI.
      // This avoids waiting for all page load functions (which can be slow)
      // while still prompting the app to refresh data in the background.
      invalidateAll().catch(() => {});

      // Shorter success animation so redirect feels snappier
      card.classList.add('success-glow');
      setTimeout(() => {
        window.location.href = '/budgeting';
      }, 200);
    } else {
      error = 'Invalid credentials';
      // Error animation
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 600);
    }

    isSubmitting = false;
  }
</script>

<div class="background">
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
  
  <div class="grid-overlay"></div>
</div>

<div class="container">
  <div class="card" bind:this={card} in:fly={{ y: 50, duration: 800, easing: quintOut }}>
    <div class="logo-container">
      <div class="logo-badge">
        <svg viewBox="0 0 48 48" width="32" height="32">
          <path fill="currentColor" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm10 26l-4-4-6 6-6-6-4 4-6-6 2-2 14 14 16-16 2 2-10 10z"/>
        </svg>
      </div>
      <h1 class="app-name">xPEND<span class="app-name-light">ING</span></h1>
      <p class="subtitle">Advanced Financial Intelligence</p>
    </div>
    
    <form on:submit|preventDefault={submit}>
      <div class="input-group">
        <div class="input-wrapper">
          <input 
            type="email" 
            bind:value={email} 
            required 
            autocomplete="email"
            bind:this={inputs[0]}
            disabled={isSubmitting}
            placeholder=" "
          />
          <label>Email Address</label>
          <div class="input-highlight"></div>
        </div>
      </div>
      
      <div class="input-group">
        <div class="input-wrapper">
          <input 
            type="password" 
            bind:value={password} 
            required 
            autocomplete="current-password"
            bind:this={inputs[1]}
            disabled={isSubmitting}
            placeholder=" "
          />
          <label>Password</label>
          <div class="input-highlight"></div>
        </div>
      </div>
      
      {#if error}
        <div class="error-container" in:fly={{ x: -20, duration: 300 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>{error}</span>
        </div>
      {/if}
      
      <button 
        type="submit" 
        class:loading={isSubmitting}
        disabled={isSubmitting}
        out:fly={{ x: 50, duration: 300, delay: 100 }}
      >
        <span class="button-text">{isSubmitting ? 'Authenticating' : 'Access Dashboard'}</span>
      </button>
    </form>
    
    <div class="footer">
      <a href="/forgot-password" class="footer-link">Recover Credentials</a>
      <div class="divider"></div>
      <a href="/signup" class="footer-link">New Account</a>
    </div>
  </div>
  
  <!-- Space-themed typing animation -->
  <div class="space-message">
    <div class="signal-line"></div>
    <div class="message-content">
      <div class="typed-text-container">
        <span class="typed-text">{displayedText}</span>
        <span class="cursor" class:blink={!isDeleting}></span>
      </div>
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    min-height: 100vh;
    background: #0a0f1c;
    color: #e2e8f0;
    overflow: hidden;
    position: relative;
  }

  .background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  .particles-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .particle {
    position: absolute;
    width: var(--size);
    height: var(--size);
    background: rgba(59, 130, 246, 0.3);
    border-radius: 50%;
    top: var(--y);
    left: var(--x);
    animation: float var(--duration) infinite ease-in-out;
    animation-delay: var(--delay);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(10px, 15px); }
    50% { transform: translate(20px, 5px); }
    75% { transform: translate(5px, 20px); }
  }

  .grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: 
      linear-gradient(rgba(30, 58, 138, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30, 58, 138, 0.08) 1px, transparent 1px);
    background-size: 30px 30px;
    mask: radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%);
  }

  .container {
    width: 100%;
    max-width: 420px;
    padding: 2rem;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 10;
  }

  .card {
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    border-radius: 20px;
    padding: 2.5rem;
    width: 100%;
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(30, 58, 138, 0.2),
      0 0 60px rgba(30, 58, 138, 0.15);
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(30, 58, 138, 0.25);
    transform: translateZ(0);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    margin-bottom: 1.5rem;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #1e3a8a, #3b82f6, #1e3a8a);
    background-size: 200% 100%;
    animation: gradient 3s linear infinite;
  }

  .card:hover {
    transform: translateY(-8px);
    box-shadow: 
      0 35px 60px -15px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(30, 58, 138, 0.3),
      0 0 80px rgba(30, 58, 138, 0.25);
  }

  .success-glow {
    animation: success-pulse 0.8s ease;
    box-shadow: 
      0 0 40px rgba(16, 185, 129, 0.4),
      0 0 0 1px rgba(16, 185, 129, 0.3);
  }

  .logo-container {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .logo-badge {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    box-shadow: 0 10px 25px rgba(30, 58, 138, 0.4);
    animation: float-slow 6s ease-in-out infinite;
  }

  .logo-badge svg {
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }

  .app-name {
    margin: 0 0 0.25rem;
    font-weight: 800;
    font-size: 1.8rem;
    letter-spacing: -0.5px;
    background: linear-gradient(90deg, #f1f5f9, #cbd5e1);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .app-name-light {
    font-weight: 300;
    color: #94a3b8;
    opacity: 0.7;
  }

  .subtitle {
    margin: 0;
    font-size: 0.9rem;
    color: #94a3b8;
    font-weight: 400;
    letter-spacing: 0.5px;
  }

  .input-group {
    margin-bottom: 1.75rem;
    position: relative;
  }

  .input-wrapper {
    position: relative;
  }

  input {
    width: 100%;
    padding: 1.25rem 1rem 0.5rem;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(71, 85, 105, 0.4);
    border-radius: 12px;
    font-size: 1rem;
    color: #e2e8f0;
    box-sizing: border-box;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    z-index: 2;
  }

  input:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.7);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    background: rgba(30, 41, 59, 0.9);
  }

  input:not(:placeholder-shown) + label,
  input:focus + label {
    transform: translateY(-100%) scale(0.85);
    color: #3b82f6;
    font-weight: 500;
  }

  label {
    position: absolute;
    top: 1.25rem;
    left: 1rem;
    color: #94a3b8;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    transform-origin: left;
    z-index: 1;
    font-size: 1rem;
  }

  .input-highlight {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #1e3a8a, #3b82f6);
    transform: scaleX(0);
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    border-radius: 2px;
  }

  input:focus + label + .input-highlight {
    transform: scaleX(1);
  }

  .error-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    padding: 0.8rem 1rem;
    margin-bottom: 1.5rem;
    color: #f87171;
    font-size: 0.9rem;
    animation: slide-in 0.3s ease-out;
  }

  .error-container svg {
    flex-shrink: 0;
    color: #ef4444;
  }

  button {
    width: 100%;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    color: white;
    border: none;
    padding: 1.25rem;
    border-radius: 12px;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3.75rem;
    box-shadow: 0 10px 25px rgba(30, 58, 138, 0.4);
    letter-spacing: 0.5px;
  }

  button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: 0.5s;
  }

  button:hover:not(:disabled)::before {
    left: 100%;
  }

  button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(30, 58, 138, 0.5);
  }

  button:disabled {
    opacity: 0.8;
    cursor: not-allowed;
    transform: none !important;
  }

  .button-text {
    transition: opacity 0.3s ease;
    z-index: 2;
  }

  .loading .button-text {
    opacity: 0;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
    font-size: 0.9rem;
  }

  .footer-link {
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
    padding: 0.25rem 0;
  }

  .footer-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background: linear-gradient(90deg, #1e3a8a, #3b82f6);
    transition: width 0.3s ease;
  }

  .footer-link:hover {
    color: #e2e8f0;
  }

  .footer-link:hover::after {
    width: 100%;
  }

  .divider {
    width: 4px;
    height: 4px;
    background: #475569;
    border-radius: 50%;
  }

  /* Space message styling */
  .space-message {
    width: 100%;
    margin-top: 1rem;
    position: relative;
  }

  .signal-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
    margin-bottom: 0.75rem;
    position: relative;
  }

  .signal-line::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 30%;
    background: linear-gradient(90deg, #3b82f6, transparent);
    animation: signal-scan 3s linear infinite;
  }

  .message-content {
    padding: 1rem;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(59, 130, 246, 0.2);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  .transmission-label {
    display: block;
    font-size: 0.7rem;
    color: #3b82f6;
    letter-spacing: 1px;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .typed-text-container {
    min-height: 1.5rem;
    display: flex;
    align-items: center;
  }

  .typed-text {
    color: #e2e8f0;
    font-size: 0.9rem;
    line-height: 1.4;
    font-family: 'Courier New', monospace;
  }

  .cursor {
    display: inline-block;
    width: 8px;
    height: 1.2rem;
    background: #3b82f6;
    margin-left: 2px;
    vertical-align: text-bottom;
    transition: opacity 0.3s;
  }

  .cursor.blink {
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes signal-scan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(300%); }
  }

  .shake {
    animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  @keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
  }

  @keyframes success-pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 1rem;
    }
    
    .card {
      padding: 2rem 1.5rem;
    }
    
    .logo-badge {
      width: 56px;
      height: 56px;
    }
    
    .app-name {
      font-size: 1.5rem;
    }
  }
</style>