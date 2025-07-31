// 브라우저에서 발생할 수 있는 문제들 디버깅
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 브라우저 환경 디버깅');
console.log('======================');

// 환경변수 확인
console.log('\n1️⃣ 환경변수 확인');
console.log('------------------');
console.log(`VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL}`);
console.log(`VITE_SUPABASE_ANON_KEY 길이: ${process.env.VITE_SUPABASE_ANON_KEY?.length}자`);

// 빌드된 파일의 환경변수 확인
const fs = require('fs');
const path = require('path');

console.log('\n2️⃣ 빌드된 파일 환경변수 확인');
console.log('------------------------------');

try {
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // 환경변수가 제대로 빌드에 포함되었는지 확인
    if (indexContent.includes('qwxghpwasmvottahchky.supabase.co')) {
      console.log('✅ Supabase URL이 빌드에 포함됨');
    } else {
      console.log('❌ Supabase URL이 빌드에 누락됨');
    }
    
    if (indexContent.includes('eyJhbGciOiJIUzI1NiIs')) {
      console.log('✅ Supabase 키가 빌드에 포함됨');
    } else {
      console.log('❌ Supabase 키가 빌드에 누락됨');
    }
  } else {
    console.log('❌ dist/index.html 파일을 찾을 수 없음');
  }
} catch (err) {
  console.log('⚠️ 빌드 파일 확인 중 오류:', err.message);
}

async function debugBrowserIssues() {
  try {
    console.log('\n3️⃣ CORS 및 연결 테스트');
    console.log('------------------------');
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    );
    
    // 간단한 연결 테스트
    const { data, error } = await supabase
      .from('properties')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ 기본 연결 실패:', error.message);
      if (error.message.includes('CORS')) {
        console.log('🔍 CORS 문제 감지됨');
      }
    } else {
      console.log('✅ 기본 연결 성공');
    }
    
    console.log('\n4️⃣ 실제 프론트엔드 시나리오 시뮬레이션');
    console.log('--------------------------------------');
    
    // 1단계: 비로그인 상태로 매물 조회 (실제 브라우저 첫 접속)
    console.log('🔄 1단계: 비로그인 상태 매물 조회...');
    const { data: anonProperties, error: anonError } = await supabase
      .from('properties')
      .select(`
        *,
        property_types(id, name),
        property_statuses(id, name),
        transaction_types(id, name)
      `)
      .order('created_at', { ascending: false });
    
    if (anonError) {
      console.log(`❌ 비로그인 조회 실패: ${anonError.message}`);
      console.log(`   코드: ${anonError.code}`);
      
      if (anonError.code === 'PGRST116') {
        console.log('🔍 RLS 정책으로 인한 접근 제한 - 이것이 매물이 안 보이는 이유일 수 있음');
      }
    } else {
      console.log(`✅ 비로그인 조회 성공: ${anonProperties?.length || 0}개`);
    }
    
    // 2단계: 로그인 시도
    console.log('\n🔄 2단계: 로그인 시도...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });
    
    if (signInError) {
      console.log(`❌ 로그인 실패: ${signInError.message}`);
      return;
    }
    
    console.log('✅ 로그인 성공');
    
    // 3단계: 로그인 후 매물 조회
    console.log('\n🔄 3단계: 로그인 후 매물 조회...');
    const { data: authProperties, error: authError } = await supabase
      .from('properties')
      .select(`
        *,
        property_types(id, name),
        property_statuses(id, name),
        transaction_types(id, name)
      `)
      .order('created_at', { ascending: false });
    
    if (authError) {
      console.log(`❌ 로그인 후 조회 실패: ${authError.message}`);
    } else {
      console.log(`✅ 로그인 후 조회 성공: ${authProperties?.length || 0}개`);
      
      if (authProperties && authProperties.length > 0) {
        console.log('\n📋 실제 표시될 데이터:');
        authProperties.forEach((property, index) => {
          console.log(`   ${index + 1}. ${property.property_name}`);
          console.log(`      타입: ${property.property_types?.name || 'null'}`);
          console.log(`      상태: ${property.property_statuses?.name || 'null'}`);
          console.log(`      거래: ${property.transaction_types?.name || 'null'}`);
        });
      }
    }
    
    console.log('\n5️⃣ 브라우저 디버깅 가이드');
    console.log('-------------------------');
    console.log('브라우저에서 다음을 확인해주세요:');
    console.log('');
    console.log('1. F12 → Console 탭에서 오류 메시지 확인');
    console.log('   - "CORS error" → 서버 설정 문제');
    console.log('   - "Network error" → 네트워크 연결 문제');
    console.log('   - "RLS policy" → 데이터베이스 권한 문제');
    console.log('');
    console.log('2. F12 → Network 탭에서 API 요청 확인');
    console.log('   - properties 요청이 실패하는지 확인');
    console.log('   - 응답 코드가 200이 아닌지 확인');
    console.log('');
    console.log('3. F12 → Application 탭에서 로그인 상태 확인');
    console.log('   - Local Storage에 supabase 관련 데이터 확인');
    console.log('');
    console.log('4. 페이지 새로고침 (Ctrl+F5 또는 Cmd+Shift+R)');
    console.log('   - 캐시 문제일 수 있음');
    
    // 주요 문제 원인 분석
    console.log('\n🔍 주요 문제 원인 분석');
    console.log('======================');
    
    if (anonError && anonError.code === 'PGRST116') {
      console.log('🚨 가장 가능성 높은 원인: RLS 정책');
      console.log('   - 비로그인 상태에서는 매물 조회 불가');
      console.log('   - 로그인 후에만 매물 표시');
      console.log('   - 프론트엔드에서 로그인 상태 체크 필요');
      console.log('');
      console.log('💡 해결 방법:');
      console.log('   1. 웹사이트 접속 → 자동으로 로그인 페이지로 이동');
      console.log('   2. admin@the-realty.co.kr / password123 로그인');
      console.log('   3. 로그인 성공 후 매물 목록 확인');
    }
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
}

debugBrowserIssues();