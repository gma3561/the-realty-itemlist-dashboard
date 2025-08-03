const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🌐 웹 애플리케이션 QA 테스트 시나리오\n');
console.log('📋 테스트 환경: http://localhost:5173\n');

async function prepareTestData() {
  console.log('🔧 테스트 데이터 준비 중...\n');
  
  // 테스트용 사용자 생성
  const testUser = {
    email: 'qa-test@the-realty.com',
    name: 'QA 테스터',
    role: 'agent',
    status: 'active'
  };
  
  // 테스트용 매물 확인
  const { data: properties } = await supabase
    .from('properties')
    .select('id, property_name, manager_id')
    .limit(3);
    
  console.log('📌 테스트용 매물:');
  properties.forEach((p, i) => {
    console.log(`  ${i+1}. ${p.property_name} (담당: ${p.manager_id})`);
  });
  
  return { testUser, testPropertyId: properties[0].id };
}

async function printTestScenarios() {
  const { testUser, testPropertyId } = await prepareTestData();
  
  console.log('\n' + '='.repeat(60));
  console.log('📝 웹 QA 테스트 시나리오');
  console.log('='.repeat(60));
  
  console.log('\n### 1️⃣ 로그인 테스트');
  console.log('1. http://localhost:5173 접속');
  console.log('2. Google 로그인 버튼 클릭');
  console.log('3. Google 계정으로 로그인');
  console.log('✅ 예상결과: 대시보드로 이동');
  
  console.log('\n### 2️⃣ 매물 목록 테스트');
  console.log('1. 상단 메뉴에서 "매물목록" 클릭');
  console.log('2. 매물 목록이 표시되는지 확인');
  console.log('3. 필터 기능 테스트:');
  console.log('   - 매물종류: 아파트 선택');
  console.log('   - 거래유형: 매매 선택');
  console.log('   - 진행상태: 거래가능 선택');
  console.log('✅ 예상결과: 필터에 맞는 매물만 표시');
  
  console.log('\n### 3️⃣ 매물 상세 + 코멘트 테스트');
  console.log('1. 매물 목록에서 아무 매물 클릭');
  console.log('2. 매물 상세 정보 확인');
  console.log('3. 페이지 하단 "코멘트" 섹션 확인');
  console.log('4. 코멘트 입력:');
  console.log('   - "테스트 코멘트입니다" 입력');
  console.log('   - 전송 버튼 클릭');
  console.log('✅ 예상결과: 코멘트가 즉시 목록에 추가됨');
  
  console.log('\n### 4️⃣ 코멘트 수정/삭제 테스트');
  console.log('1. 방금 작성한 코멘트의 수정 버튼(연필) 클릭');
  console.log('2. "수정된 테스트 코멘트" 로 변경');
  console.log('3. 체크 버튼 클릭');
  console.log('✅ 예상결과: 코멘트 내용 변경됨');
  console.log('');
  console.log('4. 삭제 버튼(휴지통) 클릭');
  console.log('5. 확인 대화상자에서 "확인" 클릭');
  console.log('✅ 예상결과: 코멘트가 사라짐');
  
  console.log('\n### 5️⃣ 실시간 업데이트 테스트');
  console.log('1. 브라우저 새 탭에서 같은 매물 페이지 열기');
  console.log('2. 한쪽 탭에서 코멘트 작성');
  console.log('✅ 예상결과: 다른 탭에도 즉시 코멘트 표시');
  
  console.log('\n### 6️⃣ 권한 테스트');
  console.log('1. 다른 사용자가 작성한 코멘트 확인');
  console.log('✅ 예상결과: 수정/삭제 버튼이 보이지 않음');
  console.log('');
  console.log('2. 로그아웃 후 매물 상세 페이지 접속');
  console.log('✅ 예상결과: 코멘트 읽기는 가능, 작성 불가');
  
  console.log('\n### 7️⃣ 데이터 타입 확인');
  console.log('1. 새 매물 등록 (상단 "매물등록" 버튼)');
  console.log('2. 양식 작성:');
  console.log('   - 매물종류: 아파트');
  console.log('   - 거래유형: 매매');
  console.log('   - 진행상태: 거래가능');
  console.log('3. 저장 버튼 클릭');
  console.log('✅ 예상결과: 정상 저장 (스키마 타입 문제 없음)');
  
  console.log('\n### 8️⃣ 대량 데이터 처리');
  console.log('1. 매물 목록 페이지에서 스크롤');
  console.log('✅ 현재상태: 최대 50개만 표시 (페이지네이션 미구현)');
  console.log('⚠️  알려진 이슈: 2781개 중 50개만 표시됨');
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 체크리스트');
  console.log('='.repeat(60));
  console.log('□ 로그인/로그아웃 정상 작동');
  console.log('□ 매물 목록 필터링 작동');
  console.log('□ 매물 상세 페이지 표시');
  console.log('□ 코멘트 작성 기능');
  console.log('□ 코멘트 수정 기능 (본인만)');
  console.log('□ 코멘트 삭제 기능 (본인만)');
  console.log('□ 실시간 코멘트 업데이트');
  console.log('□ 비로그인 사용자 코멘트 읽기');
  console.log('□ 매물 등록 (STRING 타입 정상)');
  
  console.log('\n💡 테스트 팁:');
  console.log('- 개발자 도구(F12) 콘솔에서 에러 확인');
  console.log('- 네트워크 탭에서 API 호출 확인');
  console.log('- Supabase 대시보드에서 실시간 데이터 확인');
  
  console.log('\n🚀 서버 실행 명령: npm run dev');
}

printTestScenarios();