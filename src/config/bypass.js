/**
 * QA 환경을 위한 조건부 바이패스 설정
 * 
 * 보안 원칙:
 * 1. 프로덕션 환경에서는 절대 활성화되지 않음
 * 2. 환경 변수로 명시적 활성화 필요
 * 3. 개발/QA 환경에서만 사용
 * 4. 명확한 활성화 조건과 제한사항
 */

import ENV_CONFIG from './env';

// 바이패스 활성화 조건 검사
export const isProductionEnvironment = () => {
  // GitHub Pages 프로덕션 환경 감지
  if (window.location.hostname === 'gma3561.github.io') {
    return true;
  }
  
  // NODE_ENV가 production인 경우
  if (import.meta.env.PROD) {
    return true;
  }
  
  // VITE_ENVIRONMENT가 production인 경우
  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    return true;
  }
  
  return false;
};

// 바이패스 기능 활성화 여부 확인
export const isBypassEnabled = () => {
  // GitHub Pages에서도 바이패스 비활성화 (실제 구글 로그인 사용)
  // 데모 모드가 필요한 경우 URL 파라미터로 활성화 가능
  const urlParams = new URLSearchParams(window.location.search);
  const demoMode = urlParams.get('demo') === 'true';
  
  if (window.location.hostname === 'gma3561.github.io' && !demoMode) {
    return false; // 구글 로그인 사용
  }
  
  // 프로덕션 환경에서는 절대 비활성화
  if (isProductionEnvironment()) {
    return false;
  }
  
  // 환경 변수에서 명시적으로 활성화된 경우만
  const enableBypass = import.meta.env.VITE_ENABLE_BYPASS;
  return enableBypass === 'true' || enableBypass === true;
};

// QA 테스트를 위한 사전 정의된 사용자들
export const QA_TEST_USERS = {
  admin: {
    id: 'qa-admin-user-001',
    email: 'Lucas@the-realty.co.kr',
    name: '하상현',
    role: 'admin',
    isAdmin: true,
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    // QA 식별을 위한 플래그
    isQAUser: true,
    testUserType: 'admin'
  },
  
  user: {
    id: 'qa-user-001',
    email: 'sso@the-realty.co.kr', 
    name: '박소현',
    role: 'user',
    isAdmin: false,
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    // QA 식별을 위한 플래그
    isQAUser: true,
    testUserType: 'user'
  },

  manager: {
    id: 'qa-manager-001',
    email: 'qa-manager@test.local',
    name: 'QA 매니저',
    role: 'user', // 매니저도 기본적으로 user 역할
    isAdmin: false,
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    // QA 식별을 위한 플래그
    isQAUser: true,
    testUserType: 'manager'
  }
};

// 바이패스 사용자 정보 저장
export const setBypassUser = (userType = 'admin') => {
  if (!isBypassEnabled()) {
    console.warn('바이패스 기능이 비활성화되어 있습니다.');
    return false;
  }

  const user = QA_TEST_USERS[userType];
  if (!user) {
    console.error(`잘못된 사용자 타입: ${userType}`);
    return false;
  }

  try {
    localStorage.setItem('temp-bypass-user', JSON.stringify(user));
    console.log(`QA 바이패스 로그인: ${user.name} (${user.email})`);
    return true;
  } catch (error) {
    console.error('바이패스 사용자 설정 실패:', error);
    return false;
  }
};

// 바이패스 사용자 정보 가져오기
export const getBypassUser = () => {
  if (!isBypassEnabled()) {
    return null;
  }

  try {
    const storedUser = localStorage.getItem('temp-bypass-user');
    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);
    
    // QA 사용자 유효성 검사
    if (!user.isQAUser) {
      console.warn('유효하지 않은 QA 사용자 데이터');
      clearBypassUser();
      return null;
    }

    return user;
  } catch (error) {
    console.error('바이패스 사용자 정보 로드 실패:', error);
    clearBypassUser();
    return null;
  }
};

// 바이패스 사용자 정보 삭제
export const clearBypassUser = () => {
  try {
    localStorage.removeItem('temp-bypass-user');
    console.log('QA 바이패스 로그아웃 완료');
    return true;
  } catch (error) {
    console.error('바이패스 사용자 정보 삭제 실패:', error);
    return false;
  }
};

// 바이패스 상태 확인
export const getBypassStatus = () => {
  return {
    isEnabled: isBypassEnabled(),
    isProduction: isProductionEnvironment(),
    currentUser: getBypassUser(),
    availableUsers: Object.keys(QA_TEST_USERS),
    environment: {
      hostname: window.location.hostname,
      isProduction: import.meta.env.PROD,
      viteEnvironment: import.meta.env.VITE_ENVIRONMENT,
      enableBypass: import.meta.env.VITE_ENABLE_BYPASS
    }
  };
};

// 개발자를 위한 디버그 정보
export const logBypassInfo = () => {
  if (!isBypassEnabled()) {
    console.log('🔒 바이패스 기능이 비활성화되어 있습니다.');
    return;
  }

  const status = getBypassStatus();
  console.group('🧪 QA 바이패스 시스템 정보');
  console.log('활성화 상태:', status.isEnabled ? '✅ 활성화' : '❌ 비활성화');
  console.log('환경:', status.isProduction ? '🚀 프로덕션' : '🔧 개발/QA');
  console.log('현재 사용자:', status.currentUser?.name || '없음');
  console.log('사용 가능한 사용자:', status.availableUsers);
  console.log('환경 변수:', status.environment);
  
  if (status.isEnabled) {
    console.log('\n사용법:');
    console.log('setBypassUser("admin")   - 관리자로 로그인');
    console.log('setBypassUser("user")    - 일반사용자로 로그인');
    console.log('setBypassUser("manager") - 매니저로 로그인');
    console.log('clearBypassUser()        - 바이패스 로그아웃');
  }
  console.groupEnd();
};

// 전역 객체에 바이패스 함수들 노출 (개발 환경에서만)
if (isBypassEnabled() && typeof window !== 'undefined') {
  window.QABypass = {
    setUser: setBypassUser,
    clearUser: clearBypassUser,
    getUser: getBypassUser,
    getStatus: getBypassStatus,
    logInfo: logBypassInfo,
    users: QA_TEST_USERS
  };
  
  // 개발자를 위한 안내 메시지
  console.log('🧪 QA 바이패스 시스템이 활성화되었습니다. window.QABypass 객체를 사용하세요.');
}