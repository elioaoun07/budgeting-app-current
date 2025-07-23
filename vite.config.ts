import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA }   from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(),VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name:        'My Budgeting App',
        short_name:  'BudgetApp',
        description: 'Track your income & expenses on the go',
        theme_color: '#1e90ff',
        background_color: '#ffffff',
        display:     'standalone',
        start_url:   '/',
        icons: [
          {
            src:   '/pwa-192x192.png',
            sizes: '192x192',
            type:  'image/png'
          },
          {
            src:   '/pwa-512x512.png',
            sizes: '512x512',
            type:  'image/png'
          },
          // optional maskable icon:
          {
            src:   '/pwa-maskable.png',
            sizes: '512x512',
            type:  'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })]
});
