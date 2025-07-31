// properties 테이블 스키마 확인 (간단 버전)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Properties 테이블 스키마 확인');
console.log('================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPropertiesSchema() {
  try {
    console.log('📝 properties 테이블 샘플 데이터 확인');
    console.log('------------------------------------');
    
    // 샘플 데이터 조회
    const { data: sampleData, error: sampleError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ 샘플 데이터 조회 실패:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ 현재 테이블 구조 (샘플 데이터 기준):');
      console.log('컬럼 목록:', Object.keys(sampleData[0]));
      console.log('\n샘플 데이터:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('📄 테이블이 비어있습니다.');
    }

    console.log('\n🧪 테스트 삽입 시도');
    console.log('-------------------');
    
    // 테스트 데이터로 삽입 시도
    const testData = {
      title: '테스트 매물',
      address: '서울시 강남구',
      price: 100000,
      sale_price: 50000,
      rental_price: 100,
      area_pyeong: 20.5,
      area_sqft: 680,
      description: '테스트 설명',
      property_type_id: '550e8400-e29b-41d4-a716-446655440000',
      property_status_id: '550e8400-e29b-41d4-a716-446655440001',
      transaction_type_id: '550e8400-e29b-41d4-a716-446655440002'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('properties')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('❌ 테스트 삽입 실패:', insertError.message);
      console.log('상세 오류:', insertError);
      
      // 누락된 컬럼 분석
      if (insertError.message.includes('Could not find')) {
        const match = insertError.message.match(/Could not find the '([^']+)' column/);
        if (match) {
          console.log(`\n🔧 누락된 컬럼: ${match[1]}`);
          console.log('이 컬럼을 추가해야 합니다.');
        }
      }
    } else {
      console.log('✅ 테스트 삽입 성공');
      console.log('삽입된 데이터:', insertData);
      
      // 테스트 데이터 삭제
      if (insertData && insertData[0]) {
        await supabase
          .from('properties')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }

  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error);
  }
}

checkPropertiesSchema();