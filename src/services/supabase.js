import { createClient } from '@supabase/supabase-js';
import { IS_DEVELOPMENT, securityLog, LOG_LEVELS } from '../config/security.js';
import ENV_CONFIG from '../config/env.js';

// 환경설정에서 Supabase 설정 가져오기 (GitHub Pages 호환)
const supabaseUrl = ENV_CONFIG.SUPABASE_URL;
const supabaseAnonKey = ENV_CONFIG.SUPABASE_ANON_KEY;

// URL 유효성 검사
try {
  new URL(supabaseUrl);
} catch (error) {
  const errorMsg = 'Supabase URL이 유효하지 않습니다.';
  console.error(errorMsg, { url: supabaseUrl });
  // GitHub Pages에서는 예외를 던지지 않고 경고만 출력
  if (IS_DEVELOPMENT) {
    throw new Error(errorMsg);
  }
}

// 개발 모드에서만 설정 정보 출력
if (IS_DEVELOPMENT) {
  console.log('🔗 Supabase 설정:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length,
    environment: ENV_CONFIG.ENVIRONMENT
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
      'X-Client-Info': `the-realty-dashboard/${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
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
        securityLog(LOG_LEVELS.ERROR, 'Supabase 연결 실패', { error: error.message });
      } else {
        securityLog(LOG_LEVELS.INFO, 'Supabase 연결 성공');
      }
    })
    .catch((error) => {
      securityLog(LOG_LEVELS.ERROR, 'Supabase 연결 테스트 실패', { error: error.message });
    });
}

export default supabase;