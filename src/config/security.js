// 보안 설정 중앙 관리

// 환경 설정
export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';

// 개발 모드 여부
export const IS_DEVELOPMENT = ENVIRONMENT === 'development';
export const IS_PRODUCTION = ENVIRONMENT === 'production';

// 애플리케이션 정보
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || '팀 매물장',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: ENVIRONMENT
};

// 보안 정책 설정
export const SECURITY_POLICIES = {
  // 세션 관리
  SESSION: {
    // 세션 타임아웃 (밀리초) - 8시간
    TIMEOUT: 8 * 60 * 60 * 1000,
    // 비활성 상태 타임아웃 (밀리초) - 2시간
    IDLE_TIMEOUT: 2 * 60 * 60 * 1000,
    // 자동 로그아웃 경고 시간 (밀리초) - 5분
    WARNING_TIME: 5 * 60 * 1000
  },
  
  // 비밀번호 정책
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false
  },
  
  // API 요청 제한
  RATE_LIMITING: {
    // 일반 API 요청 (분당 요청 수)
    GENERAL_RPM: 100,
    // 로그인 시도 (분당 요청 수)  
    LOGIN_RPM: 10,
    // 파일 업로드 (분당 요청 수)
    UPLOAD_RPM: 20
  },
  
  // 데이터 유효성 검사
  VALIDATION: {
    // 최대 파일 크기 (바이트) - 10MB
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    // 허용된 파일 형식
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    // 최대 텍스트 길이
    MAX_TEXT_LENGTH: 1000,
    // 최대 메모 길이
    MAX_MEMO_LENGTH: 2000
  }
};

// CSP (Content Security Policy) 설정
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Vite 개발 모드용
    'https://unpkg.com' // 차트 라이브러리용
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Tailwind CSS용
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:', // Supabase 이미지용
  ],
  'connect-src': [
    "'self'",
    'https://aekgsysvipnwxhwixglg.supabase.co' // Supabase API
  ]
};

// 민감한 정보 마스킹
export const maskSensitiveData = (data, type = 'phone') => {
  if (!data) return '';
  
  switch (type) {
    case 'phone':
      // 전화번호: 010-****-1234
      return data.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
    case 'email':
      // 이메일: use***@domain.com
      const [name, domain] = data.split('@');
      const maskedName = name.length > 3 
        ? name.substring(0, 3) + '*'.repeat(name.length - 3)
        : name;
      return `${maskedName}@${domain}`;
    case 'card':
      // 카드번호: ****-****-****-1234
      return data.replace(/(\d{4})-(\d{4})-(\d{4})-(\d{4})/, '****-****-****-$4');
    default:
      return data;
  }
};

// SQL 인젝션 방지를 위한 입력 검증
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // 잠재적으로 위험한 문자 제거
  return input
    .replace(/[<>\"']/g, '') // HTML/SQL 특수문자 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .trim();
};

// XSS 방지를 위한 HTML 이스케이프
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// 로그 수준 설정
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

export const CURRENT_LOG_LEVEL = IS_DEVELOPMENT ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

// 보안 로깅
export const securityLog = (level, message, data = {}) => {
  if (level > CURRENT_LOG_LEVEL) return;
  
  const logData = {
    timestamp: new Date().toISOString(),
    level: Object.keys(LOG_LEVELS)[level],
    message,
    ...data,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error('🔒 Security Error:', logData);
      break;
    case LOG_LEVELS.WARN:
      // console.warn('🔒 Security Warning:', logData);
      break;
    case LOG_LEVELS.INFO:
      // console.info('🔒 Security Info:', logData);
      break;
    case LOG_LEVELS.DEBUG:
      console.debug('🔒 Security Debug:', logData);
      break;
  }
};

// 개발 모드에서만 콘솔 출력
if (IS_DEVELOPMENT) {
  // console.info('🔒 보안 설정이 로드되었습니다.', {
    environment: ENVIRONMENT,
    appVersion: APP_CONFIG.version,
    securityPolicies: Object.keys(SECURITY_POLICIES)
  });
}