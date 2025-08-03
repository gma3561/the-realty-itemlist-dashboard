// Playwright MCP를 통한 간단한 QA 테스트
console.log('🎭 Playwright MCP QA 테스트 가이드\n');

console.log('Claude에서 다음 명령을 실행하세요:\n');

console.log('1. 브라우저 열기:');
console.log('   "브라우저를 열고 https://gma3561.github.io/the-realty-itemlist-dashboard/ 로 이동해주세요"\n');

console.log('2. 로그인 테스트:');
console.log('   "이메일 필드에 jenny@the-realty.co.kr 입력하고 비밀번호 필드에 admin123! 입력 후 로그인 버튼 클릭해주세요"\n');

console.log('3. 대시보드 확인:');
console.log('   "현재 페이지의 스크린샷을 찍고 통계 카드가 몇 개 있는지 확인해주세요"\n');

console.log('4. 매물 페이지 이동:');
console.log('   "매물 메뉴를 클릭하고 매물 목록이 표시되는지 확인해주세요"\n');

console.log('5. 반응형 테스트:');
console.log('   "브라우저 창 크기를 375px로 조절하고 모바일 뷰가 제대로 표시되는지 확인해주세요"\n');

// 테스트 케이스 체크리스트
const testCases = {
  '홈페이지 접속': {
    url: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
    expected: '로그인 페이지 표시'
  },
  '로그인 기능': {
    email: 'jenny@the-realty.co.kr',
    password: 'admin123!',
    expected: '대시보드로 이동'
  },
  '대시보드 요소': {
    elements: ['통계 카드', '차트', '네비게이션 메뉴'],
    expected: '모든 요소 정상 표시'
  },
  '매물 관리': {
    actions: ['매물 메뉴 클릭', '목록 확인', '검색 테스트'],
    expected: '매물 데이터 표시'
  },
  '반응형 디자인': {
    viewports: ['375px (모바일)', '768px (태블릿)', '1920px (데스크톱)'],
    expected: '각 뷰포트에서 적절한 레이아웃'
  }
};

console.log('\n📋 테스트 체크리스트:');
Object.entries(testCases).forEach(([test, details]) => {
  console.log(`\n✅ ${test}:`);
  console.log(`   예상 결과: ${details.expected}`);
});