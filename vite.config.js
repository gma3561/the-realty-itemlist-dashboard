import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'skipWaiting', // 즉시 업데이트
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [] // 런타임 캐싱 비활성화
        },
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
    build: {
      outDir: 'dist',
      sourcemap: false,
      // 프로덕션 빌드 최적화
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,      // console.* 제거
          drop_debugger: true,     // debugger 제거
          pure_funcs: ['console.log', 'console.warn', 'console.info']
        },
        mangle: true,
        format: {
          comments: false          // 주석 제거
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // 벤더 청크 분리
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'ui-vendor': ['lucide-react', 'recharts']
          },
          // 캐시 무력화를 위한 해시 추가
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    // 개발 서버 설정
    server: {
      host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접속 허용 (테일스케일 포함)
      port: 5175, // 다른 AI와 충돌 방지를 위해 포트 변경
      strictPort: true,
      open: true
    },
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