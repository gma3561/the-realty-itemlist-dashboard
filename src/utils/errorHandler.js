// 에러 메시지 보안 처리 유틸리티

const isDevelopment = import.meta.env.MODE === 'development';

// 에러 타입별 사용자 친화적 메시지
const ERROR_MESSAGES = {
  // 인증 관련
  'auth/invalid-credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/user-not-found': '등록되지 않은 사용자입니다.',
  'auth/unauthorized': '권한이 없습니다.',
  
  // 데이터베이스 관련
  'PGRST116': '요청한 데이터를 찾을 수 없습니다.',
  'PGRST204': '요청한 리소스를 찾을 수 없습니다.',
  '23505': '이미 존재하는 데이터입니다.',
  '23503': '참조하는 데이터가 존재하지 않습니다.',
  '42P01': '요청한 테이블을 찾을 수 없습니다.',
  
  // 네트워크 관련
  'network-error': '네트워크 연결을 확인해주세요.',
  'timeout': '요청 시간이 초과되었습니다.',
  
  // 기본 메시지
  'default': '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
};

// 보안 로거 (프로덕션에서는 외부 서비스로 전송)
export const secureLogger = {
  error: (message, error, context = {}) => {
    if (isDevelopment) {
      console.error(message, error, context);
    } else {
      // 프로덕션에서는 Sentry, LogRocket 등으로 전송
      // 민감한 정보는 제거하고 전송
      const sanitizedError = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          // 민감한 정보 제거
          user: context.user ? { id: context.user.id } : undefined
        }
      };
      
      // TODO: 외부 로깅 서비스로 전송
      // sendToLoggingService(sanitizedError);
    }
  },
  
  warn: (message, context = {}) => {
    if (isDevelopment) {
      console.warn(message, context);
    }
  },
  
  info: (message, context = {}) => {
    if (isDevelopment) {
      console.info(message, context);
    }
  }
};

// 에러 처리 함수
export const handleError = (error, context = {}) => {
  // 서버에 로깅 (민감한 정보 포함 가능)
  secureLogger.error('Error occurred', error, context);
  
  // 사용자에게 보여줄 메시지 결정
  let userMessage = ERROR_MESSAGES.default;
  
  // Supabase 에러 처리
  if (error.code) {
    userMessage = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.default;
  }
  
  // PostgreSQL 에러 코드 처리
  if (error.details?.includes('duplicate key')) {
    userMessage = ERROR_MESSAGES['23505'];
  }
  
  // 네트워크 에러 처리
  if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
    userMessage = ERROR_MESSAGES['network-error'];
  }
  
  return {
    success: false,
    error: userMessage,
    // 개발 환경에서만 상세 정보 제공
    ...(isDevelopment && { debugInfo: error })
  };
};

// API 응답 래퍼
export const apiWrapper = async (apiCall, context = {}) => {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    return handleError(error, context);
  }
};

export default {
  handleError,
  apiWrapper,
  secureLogger
};