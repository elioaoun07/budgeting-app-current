const adapter = require('@sveltejs/adapter-auto');
const { vitePreprocess } = require('@sveltejs/kit/vite');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

module.exports = config;