import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pokédex',
        short_name: 'Pokédex',
        theme_color: '#1565C0',
        background_color: '#EEF4FF',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pokédex1.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pokédex.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})