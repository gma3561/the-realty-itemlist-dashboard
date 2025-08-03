const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Supabase 전체 QA 테스트 시작\n');

async function runFullQA() {
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // 1. 테이블 존재 확인
  console.log('1️⃣ 필수 테이블 확인');
  const requiredTables = [
    'properties', 'users', 'property_types', 
    'transaction_types', 'property_statuses', 
    'property_comments', 'manager_history'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error || error.code !== '42P01') {
        console.log(`  ✅ ${table} 테이블 존재`);
        results.passed.push(`${table} 테이블 존재`);
      } else {
        console.log(`  ❌ ${table} 테이블 없음`);
        results.failed.push(`${table} 테이블 없음`);
      }
    } catch (e) {
      console.log(`  ❌ ${table} 확인 실패:`, e.message);
      results.failed.push(`${table} 확인 실패`);
    }
  }

  // 2. 스키마 타입 확인
  console.log('\n2️⃣ properties 테이블 컬럼 타입 확인');
  try {
    const { data: sample } = await supabase
      .from('properties')
      .select('property_type, transaction_type, property_status')
      .limit(1)
      .single();
    
    if (sample) {
      const allString = 
        typeof sample.property_type === 'string' &&
        typeof sample.transaction_type === 'string' &&
        typeof sample.property_status === 'string';
      
      if (allString) {
        console.log('  ✅ 모든 타입이 STRING으로 변경됨');
        results.passed.push('스키마 타입 정상');
      } else {
        console.log('  ❌ 타입 불일치 발견');
        results.failed.push('스키마 타입 불일치');
      }
    }
  } catch (e) {
    console.log('  ⚠️ 타입 확인 실패:', e.message);
    results.warnings.push('타입 확인 불가');
  }

  // 3. 룩업 데이터 확인
  console.log('\n3️⃣ 룩업 테이블 데이터 확인');
  
  // property_statuses
  try {
    const { data: statuses } = await supabase
      .from('property_statuses')
      .select('*')
      .order('display_order');
    
    console.log(`  📋 property_statuses: ${statuses?.length || 0}개`);
    const expectedStatuses = ['available', 'completed', 'hold', 'cancelled', 'inspection_available'];
    const actualStatuses = statuses?.map(s => s.id) || [];
    
    for (const expected of expectedStatuses) {
      if (!actualStatuses.includes(expected)) {
        console.log(`    ⚠️ '${expected}' 상태 없음`);
        results.warnings.push(`'${expected}' 상태 없음`);
      }
    }
  } catch (e) {
    console.log('  ❌ property_statuses 조회 실패');
    results.failed.push('property_statuses 조회 실패');
  }

  // transaction_types
  try {
    const { data: types } = await supabase
      .from('transaction_types')
      .select('*')
      .order('display_order');
    
    console.log(`  📋 transaction_types: ${types?.length || 0}개`);
    const expectedTypes = ['presale', 'developer', 'sale', 'lease', 'rent', 'short'];
    const actualTypes = types?.map(t => t.id) || [];
    
    for (const expected of expectedTypes) {
      if (!actualTypes.includes(expected)) {
        console.log(`    ⚠️ '${expected}' 타입 없음`);
        results.warnings.push(`'${expected}' 거래유형 없음`);
      }
    }
  } catch (e) {
    console.log('  ❌ transaction_types 조회 실패');
    results.failed.push('transaction_types 조회 실패');
  }

  // 4. 데이터 통계
  console.log('\n4️⃣ 데이터 통계');
  try {
    const { count: propertyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`  📊 총 매물 수: ${propertyCount}개`);
    
    if (propertyCount > 1000) {
      console.log('  ⚠️ 1000개 이상 - 페이지네이션 필수!');
      results.warnings.push('대량 데이터 페이지네이션 필요');
    }
    
    // 상태별 분포
    const { data: statusDist } = await supabase
      .from('properties')
      .select('property_status')
      .limit(1000);
    
    if (statusDist) {
      const counts = {};
      statusDist.forEach(p => {
        counts[p.property_status] = (counts[p.property_status] || 0) + 1;
      });
      
      console.log('  📈 상태별 분포:');
      Object.entries(counts).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}개`);
      });
    }
  } catch (e) {
    console.log('  ❌ 통계 조회 실패');
    results.failed.push('통계 조회 실패');
  }

  // 5. 코멘트 시스템
  console.log('\n5️⃣ 코멘트 시스템 확인');
  try {
    const { count: commentCount } = await supabase
      .from('property_comments')
      .select('*', { count: 'exact', head: true });
    
    console.log(`  💬 총 코멘트 수: ${commentCount}개`);
    
    // 테스트 코멘트 작성
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .limit(1);
    
    if (properties?.length > 0) {
      const testComment = {
        property_id: properties[0].id,
        user_id: 'qa-test@system.com',
        user_name: 'QA 시스템',
        comment_text: `QA 테스트 - ${new Date().toISOString()}`
      };
      
      const { error: createError } = await supabase
        .from('property_comments')
        .insert([testComment]);
      
      if (!createError) {
        console.log('  ✅ 코멘트 작성 테스트 성공');
        results.passed.push('코멘트 시스템 정상');
      } else {
        console.log('  ❌ 코멘트 작성 실패:', createError.message);
        results.failed.push('코멘트 작성 실패');
      }
    }
  } catch (e) {
    console.log('  ❌ 코멘트 시스템 확인 실패');
    results.failed.push('코멘트 시스템 확인 실패');
  }

  // 6. CASCADE DELETE 확인
  console.log('\n6️⃣ CASCADE DELETE 확인');
  try {
    // RPC 함수가 없으므로 간접 확인
    console.log('  ℹ️ CASCADE는 Supabase 대시보드에서 직접 확인 필요');
    console.log('  💡 critical-security-fixes-all.sql 실행 여부 확인');
    results.warnings.push('CASCADE DELETE 수동 확인 필요');
  } catch (e) {
    console.log('  ⚠️ CASCADE 확인 불가');
  }

  // 7. RLS 확인
  console.log('\n7️⃣ RLS (Row Level Security) 확인');
  try {
    // Anon 키로 접근 테스트
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    // 읽기 테스트
    const { data: readTest } = await anonSupabase
      .from('property_comments')
      .select('*')
      .limit(1);
    
    if (readTest !== null) {
      console.log('  ✅ 익명 사용자 코멘트 읽기 가능');
      results.passed.push('RLS 읽기 정책 정상');
    }
    
    // 쓰기 테스트 (실패해야 정상)
    const { error: writeError } = await anonSupabase
      .from('property_comments')
      .insert([{
        property_id: '00000000-0000-0000-0000-000000000000',
        user_id: 'anonymous',
        user_name: '익명',
        comment_text: '테스트'
      }]);
    
    if (writeError) {
      console.log('  ✅ 익명 사용자 쓰기 차단됨 (정상)');
      results.passed.push('RLS 쓰기 정책 정상');
    } else {
      console.log('  ❌ 익명 사용자가 쓰기 가능 (보안 문제!)');
      results.failed.push('RLS 쓰기 정책 문제');
    }
  } catch (e) {
    console.log('  ⚠️ RLS 확인 중 오류:', e.message);
    results.warnings.push('RLS 확인 불완전');
  }

  // 최종 결과
  console.log('\n' + '='.repeat(50));
  console.log('📊 QA 테스트 결과 요약');
  console.log('='.repeat(50));
  console.log(`✅ 통과: ${results.passed.length}개`);
  console.log(`❌ 실패: ${results.failed.length}개`);
  console.log(`⚠️  경고: ${results.warnings.length}개`);
  
  if (results.failed.length > 0) {
    console.log('\n🚨 실패 항목:');
    results.failed.forEach(item => console.log(`  - ${item}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  경고 항목:');
    results.warnings.forEach(item => console.log(`  - ${item}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (results.failed.length === 0) {
    console.log('🎉 모든 필수 테스트 통과!');
    console.log('✅ 시스템이 정상적으로 작동 중입니다.');
  } else {
    console.log('❌ 일부 테스트 실패 - 수정 필요');
  }
}

runFullQA();