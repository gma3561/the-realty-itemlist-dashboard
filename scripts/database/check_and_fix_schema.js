const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixSchema() {
  console.log('🔍 Properties 테이블 구조 확인 중...\n');
  
  try {
    // 간단한 테스트 쿼리로 스키마 확인
    const { data: sample, error } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Properties 테이블 조회 실패:', error.message);
      return;
    }
    
    // 기존 데이터가 있으면 컬럼 구조 출력
    if (sample && sample.length > 0) {
      console.log('✅ Properties 테이블 컬럼 구조:');
      console.log(Object.keys(sample[0]));
    } else {
      console.log('📌 Properties 테이블은 비어있습니다.');
    }
    
    // 스키마에 맞는 최소한의 데이터 삽입 테스트
    const testData = {
      property_name: '테스트 매물',
      location: '강남구 삼성동',
      property_type_id: null,
      transaction_type_id: null,
      property_status_id: null,
      price: 1000000000,
      // 이미 스키마에 있는 컬럼들만 사용
      supply_area_sqm: 100,
      private_area_sqm: 85,
      supply_area_pyeong: 30,
      private_area_pyeong: 25,
      floor_info: '10층',
      parking: '2대',
      special_notes: '테스트 매물입니다',
      registration_date: new Date().toISOString().split('T')[0]
    };
    
    console.log('\n📌 테스트 데이터 삽입 시도...');
    const { data, error: insertError } = await supabase
      .from('properties')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.error('❌ 삽입 실패:', insertError.message);
      console.log('\n🔧 사용 가능한 컬럼만 사용하여 재시도...');
    } else {
      console.log('✅ 테스트 데이터 삽입 성공!');
      console.log('삽입된 데이터:', data);
      
      // 테스트 데이터 삭제
      if (data && data[0]) {
        await supabase
          .from('properties')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 테스트 데이터 삭제 완료');
      }
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkAndFixSchema();