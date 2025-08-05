// QA 디버깅을 위한 브라우저 콘솔 헬퍼
// 브라우저 콘솔에서 실행하세요

console.log('🔍 QA 디버깅 도구 실행');
console.log('========================');

// 1. 환경변수 확인
console.log('\n1️⃣ 환경 정보:');
console.log('- URL:', window.location.href);
console.log('- Hostname:', window.location.hostname);
console.log('- Port:', window.location.port);

// 2. localStorage 확인
console.log('\n2️⃣ LocalStorage 내용:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`- ${key}:`, value?.substring(0, 100) + (value?.length > 100 ? '...' : ''));
}

// 3. QA 바이패스 상태 확인
console.log('\n3️⃣ QA 바이패스 상태:');
if (window.QABypass) {
  console.log('- QA 바이패스 사용 가능');
  console.log('- 현재 상태:', window.QABypass.getStatus());
} else {
  console.log('- QA 바이패스 비활성화 상태');
}

// 4. Supabase 클라이언트 확인
console.log('\n4️⃣ 전역 객체 확인:');
console.log('- React DevTools:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
console.log('- Vite:', !!window.__vite_plugin_react_preamble_installed__);

// 5. 네트워크 요청 모니터링 함수
console.log('\n5️⃣ 네트워크 모니터링 활성화');
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 API 요청:', args[0]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('✅ API 응답:', args[0], response.status);
      return response;
    })
    .catch(error => {
      console.error('❌ API 오류:', args[0], error);
      throw error;
    });
};

console.log('\n✅ QA 디버깅 도구 준비 완료!');
console.log('이제 페이지를 새로고침하거나 작업을 수행해보세요.');

// QA 바이패스 로그인 함수들 제공
window.qaLogin = {
  admin: () => {
    if (window.QABypass) {
      window.QABypass.setUser('admin');
      console.log('🔑 관리자로 로그인됨');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.log('❌ QA 바이패스 비활성화됨');
    }
  },
  user: () => {
    if (window.QABypass) {
      window.QABypass.setUser('user');
      console.log('🔑 일반사용자로 로그인됨');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.log('❌ QA 바이패스 비활성화됨');
    }
  },
  logout: () => {
    if (window.QABypass) {
      window.QABypass.clearUser();
      console.log('🚪 로그아웃됨');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.log('❌ QA 바이패스 비활성화됨');
    }
  }
};

console.log('\n🎮 QA 로그인 단축키:');
console.log('- qaLogin.admin() - 관리자 로그인');
console.log('- qaLogin.user() - 일반사용자 로그인');  
console.log('- qaLogin.logout() - 로그아웃');