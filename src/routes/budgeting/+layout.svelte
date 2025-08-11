<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadAccounts, loadCategories, currentAccount } from '$lib/budgeting/store';
  import { quintOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';
  
  export let data; // { user, initialPrefs, accounts }

  let showWelcome = true;
  let particles = [];
  let navOpen = false;
  let isMobile = false;

  // Initialize floating particles
  onMount(() => {
    isMobile = window.innerWidth < 768;
    createParticles();
    loadAccounts();
    
    // Hide welcome after delay
    setTimeout(() => {
      showWelcome = false;
    }, 2000);
  });

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

  function logout() {
    // Implement your logout logic here, e.g., calling a Supabase logout function
    // Example:
    // import { supabase } from '$lib/supabaseClient';
    // await supabase.auth.signOut();
    // Then redirect or reload
  }
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
      <button class="menu-button" on:click={toggleNav} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <h2 class="page-title">Dashboard</h2>
    </div>
    
    <div class="nav-right">
      <div class="user-info">
        <span class="user-name">{data.user?.email?.split('@')[0] ?? 'User'}</span>
        <div class="user-avatar">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M5 20C5 16.134 8.13401 13 12 13C15.866 13 19 16.134 19 20" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
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
      <li class="nav-item active">
        <a href="/dashboard" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Dashboard
        </a>
      </li>
      <li class="nav-item">
        <a href="/transactions" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 4H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 4L14 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 20L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 20H21V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 4H9V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Transactions
        </a>
      </li>
      <li class="nav-item">
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
            <!-- Simplified settings icon -->
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M19.4 15C19.2667 15.2667 19.36 15.8 19.7 16.2C20.04 16.6 20.5667 16.7333 21 16.5C21.4333 16.2667 21.7333 15.8667 21.8 15.4C21.8667 14.9333 21.7333 14.5 21.4 14.2C21.0667 13.9 20.5667 13.7667 20 13.8C19.4333 13.8333 19 14.0333 18.7 14.4C18.4 14.7667 18.2667 15.2 18.3 15.7C18.3333 16.2 18.5333 16.6333 18.9 16.9C19.2667 17.1667 19.7 17.2667 20.2 17.2C20.7 17.1333 21.1333 16.9 21.4 16.5C21.6667 16.1 21.7667 15.6333 21.7 15.1C21.6333 14.5667 21.4 14.1333 21 13.8C20.6 13.4667 20.1333 13.2667 19.6 13.2C19.0667 13.1333 18.6 13.2333 18.2 13.5C17.8 13.7667 17.5333 14.1667 17.4 14.7C17.2667 15.2333 17.3333 15.7667 17.6 16.2C17.8667 16.6333 18.2667 16.9333 18.8 17C19.3333 17.0667 19.8333 16.9667 20.3 16.7C20.7667 16.4333 21.1333 16.0333 21.4 15.5C21.6667 14.9667 21.7667 14.4 21.7 13.8C21.6333 13.2 21.4 12.6667 21 12.2C20.6 11.7333 20.1 11.4333 19.5 11.3C18.9 11.1667 18.3 11.2333 17.7 11.5C17.1 11.7667 16.6333 12.1667 16.3 12.7C15.9667 13.2333 15.8333 13.8333 15.9 14.5C15.9667 15.1667 16.2333 15.7667 16.7 16.2C17.1667 16.6333 17.7333 16.9 18.4 16.9C19.0667 16.9 19.6333 16.6333 20.1 16.1C20.5667 15.5667 20.8 14.9667 20.8 14.3" stroke="currentColor" stroke-width="2"/>
          </svg>
          Settings
        </a>
      </li>
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
</div>

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

  .light {
    font-weight: 300;
    opacity: 0.7;
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
  }

  .user-avatar svg {
    width: 100%;
    height: 100%;
    color: white;
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
  }

  .side-nav.mobile {
    transform: translateX(-100%);
  }

  .side-nav.mobile.open {
    transform: translateX(0);
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
  }

  .nav-link:hover {
    background: rgba(59, 130, 246, 0.1); /* From login page */
    color: #e2e8f0; /* From login page */
  }

  .nav-link svg {
    flex-shrink: 0;
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
  .main-content button:not(.nav-link, .menu-button, .logout-button) {
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

  .main-content button:not(.nav-link, .menu-button, .logout-button):hover {
    background: linear-gradient(135deg, #2c5282, #4299e1); /* Slightly different gradient on hover */
    transform: translateY(-2px); /* Subtle lift */
    box-shadow: 0 6px 8px rgba(30, 58, 138, 0.3); /* Enhanced shadow */
  }

  .main-content button:not(.nav-link, .menu-button, .logout-button):active {
    transform: translateY(0); /* Reset on click */
    box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2); /* Reduced shadow */
  }

  .main-content button:not(.nav-link, .menu-button, .logout-button):disabled {
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
</style>