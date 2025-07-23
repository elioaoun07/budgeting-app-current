// svelte.config.cjs
const adapter = require('@sveltejs/adapter-vercel');
const sveltePreprocess = require('svelte-preprocess');

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
  preprocess: sveltePreprocess(),

  kit: {
    adapter: adapter()
  }
};