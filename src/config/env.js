// 환경변수 설정 (GitHub Pages 호환)
import { PRODUCTION_ENV } from './production-env.js';

// 안전한 환경변수 접근 함수
const getEnvVar = (key, fallback = '') => {
  try {
    return import.meta.env[key] || fallback;
  } catch (error) {
    console.warn('환경변수 접근 실패, fallback 사용:', fallback);
    return fallback;
  }
};

// GitHub Pages 환경 감지 (런타임에서 수행)
let isGitHubPages = false;
try {
  isGitHubPages = window.location.hostname.includes('github.io');
} catch (e) {
  // 빌드 타임에서는 window가 없으므로 false로 설정
  isGitHubPages = false;
}

// 환경변수 설정 - GitHub Pages에서는 하드코딩된 값 사용
export const ENV_CONFIG = {
  // Supabase 설정
  SUPABASE_URL: isGitHubPages ? PRODUCTION_ENV.SUPABASE_URL : getEnvVar('VITE_SUPABASE_URL', PRODUCTION_ENV.SUPABASE_URL),
  SUPABASE_ANON_KEY: isGitHubPages ? PRODUCTION_ENV.SUPABASE_ANON_KEY : getEnvVar('VITE_SUPABASE_ANON_KEY', PRODUCTION_ENV.SUPABASE_ANON_KEY),

  // 애플리케이션 설정
  ENVIRONMENT: isGitHubPages ? PRODUCTION_ENV.ENVIRONMENT : getEnvVar('VITE_ENVIRONMENT', 'development'),
  APP_NAME: isGitHubPages ? PRODUCTION_ENV.APP_NAME : getEnvVar('VITE_APP_NAME', '팀 매물장'),
  APP_VERSION: isGitHubPages ? PRODUCTION_ENV.APP_VERSION : getEnvVar('VITE_APP_VERSION', '2.0.0'),

  // 관리자 설정
  ADMIN_EMAILS: isGitHubPages ? PRODUCTION_ENV.ADMIN_EMAILS : getEnvVar('VITE_ADMIN_EMAILS', PRODUCTION_ENV.ADMIN_EMAILS),

  // 기능 설정
  ENABLE_DEMO_BANNER: isGitHubPages ? PRODUCTION_ENV.ENABLE_DEMO_BANNER : (getEnvVar('VITE_ENABLE_DEMO_BANNER', 'true') !== 'false'),
  ENABLE_PWA: isGitHubPages ? PRODUCTION_ENV.ENABLE_PWA : (getEnvVar('VITE_ENABLE_PWA', 'true') !== 'false'),
  USE_DUMMY_DATA: isGitHubPages ? PRODUCTION_ENV.USE_DUMMY_DATA : (getEnvVar('VITE_USE_DUMMY_DATA', 'false') !== 'false'),
};

// Supabase 설정 검증
if (!ENV_CONFIG.SUPABASE_URL || !ENV_CONFIG.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다.');
  console.warn('더미 데이터 모드로 자동 전환됩니다.');
  ENV_CONFIG.USE_DUMMY_DATA = true;
}

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