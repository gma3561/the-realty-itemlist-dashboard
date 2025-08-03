const { defineConfig, loadEnv } = require('vite')
const react = require('@vitejs/plugin-react')
const { VitePWA } = require('vite-plugin-pwa')

// https://vitejs.dev/config/
module.exports = defineConfig(({ command, mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
    base: mode === 'production' ? '/the-realty-itemlist-dashboard/' : '/',
    // 환경변수를 명시적으로 정의
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(env.VITE_ENVIRONMENT || 'production'),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || '팀 매물장'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '2.0.0'),
      'import.meta.env.VITE_ADMIN_EMAILS': JSON.stringify(env.VITE_ADMIN_EMAILS || ''),
      'import.meta.env.VITE_ENABLE_DEMO_BANNER': JSON.stringify(env.VITE_ENABLE_DEMO_BANNER || 'true'),
      'import.meta.env.VITE_ENABLE_PWA': JSON.stringify(env.VITE_ENABLE_PWA || 'true'),
      'import.meta.env.VITE_USE_DUMMY_DATA': JSON.stringify(env.VITE_USE_DUMMY_DATA || 'false')
    }
  }
})