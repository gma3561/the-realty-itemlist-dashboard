// 환경변수 설정 (GitHub Pages 호환)

// 안전한 환경변수 접근 함수
const getEnvVar = (key, fallback = '') => {
  try {
    return import.meta.env[key] || fallback;
  } catch (error) {
    console.warn(`환경변수 ${key} 접근 실패, fallback 사용:`, fallback);
    return fallback;
  }
};

// GitHub Pages에서 환경변수가 없을 경우를 대비한 fallback 값들
export const ENV_CONFIG = {
  // Supabase 설정 (확실한 fallback)
  SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', 'https://qwxghpwasmvottahchky.supabase.co'),
  SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8'),

  // 애플리케이션 설정
  ENVIRONMENT: getEnvVar('VITE_ENVIRONMENT', 'production'),
  APP_NAME: getEnvVar('VITE_APP_NAME', '팀 매물장'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '2.0.0'),

  // 관리자 설정
  ADMIN_EMAILS: getEnvVar('VITE_ADMIN_EMAILS', 'jenny@the-realty.co.kr,lucas@the-realty.co.kr,hmlee@the-realty.co.kr'),

  // 기능 설정
  ENABLE_DEMO_BANNER: getEnvVar('VITE_ENABLE_DEMO_BANNER', 'true') !== 'false',
  ENABLE_PWA: getEnvVar('VITE_ENABLE_PWA', 'true') !== 'false',
  USE_DUMMY_DATA: getEnvVar('VITE_USE_DUMMY_DATA', 'false') !== 'false', // Supabase 실제 데이터 사용
};

// 개발 모드에서 환경변수 정보 출력
if (ENV_CONFIG.ENVIRONMENT === 'development') {
  console.log('🔧 환경변수 설정:', {
    environment: ENV_CONFIG.ENVIRONMENT,
    hasSupabaseUrl: !!ENV_CONFIG.SUPABASE_URL,
    hasSupabaseKey: !!ENV_CONFIG.SUPABASE_ANON_KEY,
    appName: ENV_CONFIG.APP_NAME,
    version: ENV_CONFIG.APP_VERSION,
    adminEmailsCount: ENV_CONFIG.ADMIN_EMAILS.split(',').length,
    demoMode: ENV_CONFIG.ENABLE_DEMO_BANNER
  });
}

export default ENV_CONFIG;