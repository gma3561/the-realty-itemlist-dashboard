import { createClient } from '@supabase/supabase-js';
import ENV_CONFIG from '../config/env';

// Supabase 환경변수에서 가져오기
const supabaseUrl = ENV_CONFIG.SUPABASE_URL;
const supabaseAnonKey = ENV_CONFIG.SUPABASE_ANON_KEY;

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

// Supabase 클라이언트 생성 (환경변수가 없으면 null)
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
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
}) : null;

// 개발 모드에서만 연결 상태 확인
if (IS_DEVELOPMENT && supabase) {
  supabase
    .from('properties')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.warn('Supabase 연결 실패');
      } else {
        console.log('✅ Supabase 연결 성공');
      }
    })
    .catch((error) => {
      console.warn('Supabase 연결 테스트 실패');
    });
}

export default supabase;