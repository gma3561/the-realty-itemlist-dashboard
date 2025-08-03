// 수정된 매물 등록 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 수정된 매물 등록 테스트');
console.log('==========================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPropertyInsert() {
  try {
    // 먼저 룩업 테이블에서 유효한 ID들 조회
    console.log('1️⃣ 룩업 테이블 ID 조회');
    console.log('----------------------');
    
    const [propertyTypes, propertyStatuses, transactionTypes] = await Promise.all([
      supabase.from('property_types').select('id, name').limit(1),
      supabase.from('property_statuses').select('id, name').limit(1),
      supabase.from('transaction_types').select('id, name').limit(1)
    ]);

    console.log('Property Types:', propertyTypes.data);
    console.log('Property Statuses:', propertyStatuses.data);
    console.log('Transaction Types:', transactionTypes.data);

    if (!propertyTypes.data?.[0] || !propertyStatuses.data?.[0] || !transactionTypes.data?.[0]) {
      console.log('❌ 룩업 테이블에 데이터가 없습니다.');
      return;
    }

    console.log('\n2️⃣ 올바른 스키마로 매물 등록 테스트');
    console.log('--------------------------------------');
    
    // 데이터베이스 스키마에 맞는 테스트 데이터
    const testData = {
      property_name: '테스트 매물 - 수정된 스키마',
      location: '서울시 강남구 테스트동',
      building: '101동',
      unit: '1001호',
      property_type_id: propertyTypes.data[0].id,
      property_status_id: propertyStatuses.data[0].id,
      transaction_type_id: transactionTypes.data[0].id,
      price: 100000000,
      lease_price: 50000000,
      supply_area_sqm: 84.5,
      private_area_sqm: 75.2,
      supply_area_pyeong: Math.round(84.5 * 0.3025 * 100) / 100,
      private_area_pyeong: Math.round(75.2 * 0.3025 * 100) / 100,
      floor_info: '10층',
      rooms_bathrooms: '3룸 2욕실',
      direction: '남향',
      maintenance_fee: 150000,
      parking: '1대',
      move_in_date: '즉시입주',
      special_notes: '테스트용 매물입니다.',
      manager_memo: '매물 등록 테스트',
      is_commercial: false
    };

    console.log('테스트 데이터:', JSON.stringify(testData, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('properties')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('❌ 매물 등록 실패:', insertError.message);
      console.log('상세 오류:', insertError);
    } else {
      console.log('✅ 매물 등록 성공!');
      console.log('등록된 데이터:', JSON.stringify(insertData[0], null, 2));
      
      // 등록된 테스트 데이터 삭제
      if (insertData[0]) {
        const { error: deleteError } = await supabase
          .from('properties')
          .delete()
          .eq('id', insertData[0].id);
          
        if (!deleteError) {
          console.log('🗑️ 테스트 데이터 삭제 완료');
        }
      }
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testPropertyInsert();