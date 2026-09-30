import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Otomatis update di background saat ada versi baru
      includeAssets: ['favicon.ico'], 
      manifest: {
        name: 'SKTD - Sistem Ketersediaan Tempat Duduk',
        short_name: 'SKTD',
        description: 'Aplikasi monitoring ketersediaan tempat duduk gereja secara real-time.',
        theme_color: '#1e3a8a', // Warna biru tua (sesuai tema aplikasi)
        background_color: '#ffffff',
        display: 'standalone', // Membuka seperti aplikasi native (tanpa address bar browser)
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Untuk ikon adaptif di Android
          }
        ]
      }
    })
  ],
})