import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/3d-print-cost/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      devOptions: { enabled: false },
      includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/?source=pwa',
        name: '3D Print Cost',
        short_name: '3D Cost',
        description: 'Kostenrechner für 3D-Drucke',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        theme_color: '#0b132b',
        background_color: '#0b132b',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          { src: 'screenshots/desktop-1280x800.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide',  label: 'Kostenübersicht (Desktop)' },
          { src: 'screenshots/mobile-750x1334.png',  sizes: '750x1334',  type: 'image/png', label: 'Eingaben (Mobil)' }
        ]
      }
    })
  ]
}))
