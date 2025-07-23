// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
import sveltePreprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
export default {
  // enable TypeScript, PostCSS, etc via svelte-preprocess
  preprocess: sveltePreprocess(),

  kit: {
    // deploy target
    adapter: adapter(),

    // (optional) if you need to tweak Vite here:
    // vite: { /* ... */ }
  }
};