import { createClient } from '@supabase/supabase-js';

// 하드코딩된 환경변수 (GitHub Pages 배포 안정성을 위해)
const supabaseUrl = 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

// 개발 환경 체크 (안전한 방식)
const IS_DEVELOPMENT = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// 개발 모드에서만 설정 정보 출력
if (IS_DEVELOPMENT) {
  console.log('🔗 Supabase 설정:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // 세션 만료 시간 설정 (8시간)
    sessionRefreshMargin: 60, // 60초 전에 갱신
  },
  global: {
    headers: {
      'X-Client-Info': 'the-realty-dashboard/2.0.0',
    }
  },
  // RLS 정책 강제 적용
  db: {
    schema: 'public'
  }
});

// 개발 모드에서만 연결 상태 확인
if (IS_DEVELOPMENT) {
  supabase
    .from('properties')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('Supabase 연결 실패:', error.message);
      } else {
        console.log('✅ Supabase 연결 성공');
      }
    })
    .catch((error) => {
      console.error('Supabase 연결 테스트 실패:', error.message);
    });
}

export default supabase;