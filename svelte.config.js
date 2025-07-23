// svelte.config.js
const adapter = require('@sveltejs/adapter-vercel');
const preprocess = require('svelte-preprocess');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // run svelte-preprocess on <style lang="scss">, PostCSS, etc.
  preprocess: preprocess(),

  kit: {
    adapter: adapter()
  }
};

module.exports = config;