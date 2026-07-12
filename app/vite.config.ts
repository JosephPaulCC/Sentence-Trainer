import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sentence Builder',
        short_name: 'Sentences',
        description: 'Rebuild sentences word by word to master them.',
        start_url: '/',
        display: 'standalone',
        // Both colors come from the app's palette in src/index.css:
        // --color-indigo (accent) and --color-page (page background).
        theme_color: '#3A4A9F',
        background_color: '#DFE4EE',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
