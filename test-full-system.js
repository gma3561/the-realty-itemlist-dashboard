const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 전체 시스템 통합 테스트\n');

async function testSystem() {
  let results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // 1. 룩업 테이블 확인
  console.log('1️⃣ 룩업 테이블 스키마 확인');
  try {
    const tables = ['property_types', 'transaction_types', 'property_statuses'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) throw error;
      
      if (data[0] && typeof data[0].id === 'string') {
        console.log(`  ✅ ${table}: STRING 타입 확인`);
        results.passed++;
      } else {
        console.log(`  ❌ ${table}: 타입 문제`);
        results.failed++;
      }
    }
  } catch (error) {
    console.log('  ❌ 룩업 테이블 오류:', error.message);
    results.failed++;
  }

  // 2. 매물 데이터 타입 확인
  console.log('\n2️⃣ 매물 데이터 타입 확인');
  try {
    const { data: properties } = await supabase
      .from('properties')
      .select('id, property_type, transaction_type, property_status')
      .limit(5);
    
    if (properties?.length > 0) {
      const sample = properties[0];
      console.log(`  샘플: type=${sample.property_type}, tx=${sample.transaction_type}, status=${sample.property_status}`);
      
      if (typeof sample.property_type === 'string' && 
          typeof sample.transaction_type === 'string' && 
          typeof sample.property_status === 'string') {
        console.log('  ✅ 모든 필드가 STRING 타입');
        results.passed++;
      } else {
        console.log('  ❌ 타입 불일치 발견');
        results.failed++;
      }
    }
  } catch (error) {
    console.log('  ❌ 매물 조회 오류:', error.message);
    results.failed++;
  }

  // 3. manager_history 테이블 확인
  console.log('\n3️⃣ manager_history 테이블 확인');
  try {
    const { error } = await supabase.from('manager_history').select('id').limit(1);
    if (!error || error.code !== '42P01') {
      console.log('  ✅ manager_history 테이블 존재');
      results.passed++;
    } else {
      console.log('  ❌ manager_history 테이블 없음');
      results.failed++;
    }
  } catch (error) {
    console.log('  ❌ 확인 실패:', error.message);
    results.failed++;
  }

  // 4. 코멘트 시스템 확인
  console.log('\n4️⃣ 코멘트 시스템 확인');
  try {
    const { data, error } = await supabase
      .from('property_comments')
      .select('count')
      .single();
    
    if (!error) {
      console.log(`  ✅ property_comments 테이블 정상 (${data.count}개 코멘트)`);
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ 코멘트 테이블 오류:', error.message);
    results.failed++;
  }

  // 5. 페이지네이션 확인
  console.log('\n5️⃣ 대량 데이터 처리 확인');
  try {
    const { data, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`  총 매물 수: ${count}개`);
    
    if (count > 1000) {
      console.log('  ⚠️  경고: 1000개 이상 매물 - 페이지네이션 필수!');
      results.warnings++;
    } else {
      console.log('  ✅ 현재 데이터 규모에서는 문제 없음');
      results.passed++;
    }
  } catch (error) {
    console.log('  ❌ 카운트 실패:', error.message);
    results.failed++;
  }

  // 6. 매물 생성 테스트 (새 스키마)
  console.log('\n6️⃣ 새 스키마로 매물 생성 테스트');
  try {
    const testProperty = {
      property_name: '시스템 테스트 매물',
      location: '서울시 강남구',
      property_type: 'apt',  // STRING
      transaction_type: 'sale',  // STRING  
      property_status: 'available',  // STRING
      price: 500000000,
      area_pyeong: 25,
      area_m2: 82.5,
      manager_id: 'system-test@example.com'
    };

    const { data, error } = await supabase
      .from('properties')
      .insert([testProperty])
      .select()
      .single();

    if (error) throw error;

    console.log('  ✅ 매물 생성 성공:', data.id.substring(0, 8));
    results.passed++;

    // 생성한 테스트 데이터 삭제
    await supabase.from('properties').delete().eq('id', data.id);
    
  } catch (error) {
    console.log('  ❌ 매물 생성 실패:', error.message);
    results.failed++;
  }

  // 결과 요약
  console.log('\n📊 테스트 결과 요약');
  console.log('================');
  console.log(`✅ 통과: ${results.passed}개`);
  console.log(`❌ 실패: ${results.failed}개`);
  console.log(`⚠️  경고: ${results.warnings}개`);
  
  if (results.failed === 0) {
    console.log('\n🎉 모든 테스트 통과! 시스템 정상 작동 중');
  } else {
    console.log('\n🚨 일부 테스트 실패 - 수정 필요');
  }

  // 개선 필요 사항
  console.log('\n📋 개선 필요 사항:');
  if (results.failed > 0 || results.warnings > 0) {
    console.log('1. manager_history 테이블 관련 코드 수정 필요');
    console.log('2. 페이지네이션 구현 필요 (현재 50개 제한)');
    console.log('3. 수수료 관련 기능 추가 필요');
    console.log('4. 자동 매칭 로직 구현 필요');
  } else {
    console.log('- 기본 기능은 모두 정상 작동');
    console.log('- 추가 기능 구현 가능');
  }
}

testSystem();