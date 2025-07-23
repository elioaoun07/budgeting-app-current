import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA }   from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), VitePWA({
      registerType:  'autoUpdate',
      injectRegister:'inline',            // injects SW registration script
      filename:      'manifest.webmanifest',
      includeAssets: [                     // make sure these live in `static/`
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable.png',
        'favicon.png'
      ],
      manifest: {
        name:             'My Budgeting App',
        short_name:       'BudgetApp',
        description:      'Track your income & expenses',
        start_url:        '/',
        display:          'standalone',
        background_color: '#ffffff',
        theme_color:      '#1e90ff',
        icons: [
          { src: '/pwa-192x192.png',     sizes: '192x192',   type: 'image/png'   },
          { src: '/pwa-512x512.png',     sizes: '512x512',   type: 'image/png'   },
          { src: '/pwa-maskable.png',    sizes: '512x512',   type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
});