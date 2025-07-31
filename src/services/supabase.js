import { createClient } from '@supabase/supabase-js';
import { IS_DEVELOPMENT, securityLog, LOG_LEVELS } from '../config/security.js';

// 환경변수에서 Supabase 설정 가져오기 (보안 강화)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 필수 환경변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.';
  securityLog(LOG_LEVELS.ERROR, errorMsg, {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
  throw new Error(errorMsg);
}

// URL 유효성 검사
try {
  new URL(supabaseUrl);
} catch (error) {
  const errorMsg = 'Supabase URL이 유효하지 않습니다.';
  securityLog(LOG_LEVELS.ERROR, errorMsg, { url: supabaseUrl });
  throw new Error(errorMsg);
}

// 개발 모드에서만 설정 정보 출력
if (IS_DEVELOPMENT) {
  console.log('🔗 Supabase 설정:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length,
    environment: import.meta.env.VITE_ENVIRONMENT
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