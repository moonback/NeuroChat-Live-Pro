import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          manifest: false,
          includeAssets: [
            'bip.mp3',
            'bip1.mp3',
            'icon-192.png',
            'icon-512.png',
          ],
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,webmanifest}'],
            navigateFallback: 'index.html',
            runtimeCaching: [
              {
                urlPattern: ({ request }) => request.destination === 'document',
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'nc-pages',
                },
              },
              {
                urlPattern: ({ request }) =>
                  ['style', 'script', 'worker'].includes(request.destination),
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'nc-assets',
                },
              },
              {
                urlPattern: ({ request }) =>
                  ['audio', 'image', 'font'].includes(request.destination),
                handler: 'CacheFirst',
                options: {
                  cacheName: 'nc-media',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                  },
                },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
