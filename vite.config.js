import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
var repo = '3d-print-cost';
// Get current directory for ES modules (replaces __dirname)
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
// Read package.json to get version
var packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
// Get build info
var getBuildInfo = function () {
    var date = new Date().toISOString().split('T')[0];
    return {
        date: date,
        timestamp: Date.now(),
    };
};
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var isProd = mode === 'production';
    var base = isProd ? "/".concat(repo, "/") : '/';
    var buildInfo = getBuildInfo();
    return {
        base: base,
        define: {
            __APP_VERSION__: JSON.stringify(packageJson.version),
            __BUILD_DATE__: JSON.stringify(buildInfo.date),
            __BUILD_TIMESTAMP__: buildInfo.timestamp,
        },
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'prompt',
                injectRegister: 'auto',
                devOptions: { enabled: false },
                includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
                    skipWaiting: false,
                    clientsClaim: false
                },
                manifest: {
                    id: "".concat(base, "?source=pwa"),
                    name: '3D Print Cost',
                    short_name: '3D Cost',
                    description: '3D Print Cost Calculator',
                    start_url: base,
                    scope: base,
                    display: 'standalone',
                    theme_color: '#0b132b',
                    background_color: '#0b132b',
                    icons: [
                        { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                        { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                        { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                    ],
                    screenshots: [
                        { src: 'screenshots/desktop-1280x800.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: 'Cost Overview (Desktop)' },
                        { src: 'screenshots/mobile-750x1334.png', sizes: '750x1334', type: 'image/png', label: 'Input Form (Mobile)' }
                    ]
                }
            })
        ],
        build: {
            // Increase warning limit since PDF bundle is intentionally large but lazy-loaded
            chunkSizeWarningLimit: 2000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        pdf: [
                            '@react-pdf/renderer',
                            '@react-pdf/layout',
                            '@react-pdf/image',
                            '@react-pdf/textkit',
                            '@react-pdf/font',
                            '@react-pdf/pdfkit',
                            'yoga-layout',
                        ],
                    },
                },
            },
        },
    };
});
