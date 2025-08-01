const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { VitePWA } = require('vite-plugin-pwa')

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo192.png'],
      manifest: {
        name: 'The Realty 팀 매물장',
        short_name: '팀 매물장',
        description: 'The Realty 부동산 중개사무소 팀 매물장 관리 시스템',
        theme_color: '#0284c7',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/the-realty-itemlist-dashboard/'
})