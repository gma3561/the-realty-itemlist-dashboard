// 프론트엔드와 동일한 조건으로 매물 조회 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 프론트엔드에서 사용하는 것과 동일한 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY; // 서비스 키가 아닌 anon 키 사용

console.log('🔍 프론트엔드 매물 조회 디버깅');
console.log('==============================');
console.log(`URL: ${supabaseUrl}`);
console.log(`키 타입: Anon Key (프론트엔드와 동일)`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugFrontendQuery() {
  try {
    console.log('\n1️⃣ Anon 키로 연결 테스트');
    console.log('---------------------------');
    
    // 프론트엔드와 동일한 조회 (anon 키)
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
      console.log('❌ Anon 키로 조회 실패:', anonError.message);
      console.log('   - 코드:', anonError.code);
      console.log('   - 상세:', anonError.details);
      console.log('   - 힌트:', anonError.hint);
      
      if (anonError.code === 'PGRST116') {
        console.log('\n🔍 RLS 정책 문제일 가능성:');
        console.log('   - 매물 테이블에 RLS가 적용되어 있을 수 있음');
        console.log('   - 로그인하지 않은 상태에서는 데이터 조회 불가');
      }
      
      return;
    }
    
    console.log(`✅ Anon 키로 조회 성공: ${anonProperties?.length || 0}개`);
    
    if (anonProperties && anonProperties.length > 0) {
      anonProperties.forEach((property, index) => {
        console.log(`   ${index + 1}. ${property.property_name}`);
        console.log(`      매물종류: ${property.property_types?.name || 'null'}`);
        console.log(`      진행상태: ${property.property_statuses?.name || 'null'}`);
        console.log(`      거래유형: ${property.transaction_types?.name || 'null'}`);
      });
    }
    
    console.log('\n2️⃣ 인증된 사용자로 테스트');
    console.log('---------------------------');
    
    // 관리자로 로그인 시도
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });
    
    if (signInError) {
      console.log('❌ 로그인 실패:', signInError.message);
      return;
    }
    
    console.log('✅ 로그인 성공:', signInData.user.email);
    
    // 로그인 후 다시 조회
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
      console.log('❌ 인증 후 조회 실패:', authError.message);
      return;
    }
    
    console.log(`✅ 인증 후 조회 성공: ${authProperties?.length || 0}개`);
    
    if (authProperties && authProperties.length > 0) {
      authProperties.forEach((property, index) => {
        console.log(`   ${index + 1}. ${property.property_name}`);
        console.log(`      매물종류: ${property.property_types?.name || 'null'}`);
        console.log(`      진행상태: ${property.property_statuses?.name || 'null'}`);
        console.log(`      거래유형: ${property.transaction_types?.name || 'null'}`);
      });
    }
    
    console.log('\n3️⃣ RLS 정책 확인');
    console.log('------------------');
    
    // RLS 정책 확인을 위한 간단한 조회
    const { data: simpleData, error: simpleError } = await supabase
      .from('properties')
      .select('id, property_name')
      .limit(1);
    
    if (simpleError) {
      console.log('❌ 간단한 조회도 실패:', simpleError.message);
      if (simpleError.message.includes('RLS') || simpleError.message.includes('policy')) {
        console.log('🔍 RLS 정책으로 인한 문제 확인됨');
        console.log('   해결 방법:');
        console.log('   1. Supabase 대시보드에서 properties 테이블의 RLS 정책 확인');
        console.log('   2. 인증된 사용자가 매물을 조회할 수 있도록 정책 수정');
        console.log('   3. 또는 임시로 RLS 비활성화');
      }
    } else {
      console.log('✅ 간단한 조회 성공');
    }
    
    console.log('\n4️⃣ 브라우저 환경 시뮬레이션');
    console.log('-----------------------------');
    
    // 브라우저에서와 같은 상황 시뮬레이션
    console.log('브라우저에서 일어나는 일:');
    console.log('1. 페이지 로드 → anon 키로 매물 조회 시도');
    console.log('2. 로그인 페이지로 리다이렉트');
    console.log('3. 로그인 후 → 인증된 상태로 매물 조회');
    
    if (anonProperties?.length === 0 && authProperties?.length > 0) {
      console.log('\n💡 원인 분석:');
      console.log('   - 비인증 상태에서는 매물 조회 불가 (RLS 정책)');
      console.log('   - 로그인 후에는 매물 조회 가능');
      console.log('   - 프론트엔드에서 로그인 상태 확인 필요');
    }
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
}

debugFrontendQuery();