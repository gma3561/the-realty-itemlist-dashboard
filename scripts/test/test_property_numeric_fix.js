// 매물 등록 숫자 필드 처리 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔢 매물 등록 숫자 필드 처리 테스트');
console.log('================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 프론트엔드와 동일한 숫자 필드 처리 함수
const processNumericFields = (values) => {
  const numericFields = [
    'price', 'lease_price', 'supply_area_sqm', 'private_area_sqm', 
    'supply_area_pyeong', 'private_area_pyeong', 'maintenance_fee'
  ];
  
  const processedValues = { ...values };
  
  numericFields.forEach(field => {
    if (processedValues[field] === '' || processedValues[field] === undefined) {
      processedValues[field] = null;
    } else if (processedValues[field] !== null) {
      // 숫자로 변환
      const numValue = parseFloat(processedValues[field]);
      processedValues[field] = isNaN(numValue) ? null : numValue;
    }
  });
  
  return processedValues;
};

async function testPropertyNumericFix() {
  try {
    // 룩업 테이블에서 유효한 ID들 조회
    console.log('1️⃣ 룩업 테이블 ID 조회');
    console.log('----------------------');
    
    const [propertyTypes, propertyStatuses, transactionTypes] = await Promise.all([
      supabase.from('property_types').select('id, name').limit(1),
      supabase.from('property_statuses').select('id, name').limit(1),
      supabase.from('transaction_types').select('id, name').limit(1)
    ]);

    if (!propertyTypes.data?.[0] || !propertyStatuses.data?.[0] || !transactionTypes.data?.[0]) {
      console.log('❌ 룩업 테이블에 데이터가 없습니다.');
      return;
    }

    console.log('✅ 룩업 테이블 데이터 확인 완료');

    console.log('\n2️⃣ 빈 문자열 포함 데이터로 테스트');
    console.log('------------------------------------');
    
    // 빈 문자열이 포함된 테스트 데이터 (실제 폼에서 올 수 있는 데이터)
    const testDataWithEmptyStrings = {
      property_name: '테스트 매물 - 빈 문자열 처리',
      location: '서울시 강남구 테스트동',
      building: '101동',
      unit: '1001호',
      property_type_id: propertyTypes.data[0].id,
      property_status_id: propertyStatuses.data[0].id,
      transaction_type_id: transactionTypes.data[0].id,
      price: '', // 빈 문자열
      lease_price: '50000000', // 유효한 숫자
      supply_area_sqm: '', // 빈 문자열
      private_area_sqm: '75.2',
      supply_area_pyeong: '', // 빈 문자열
      private_area_pyeong: '',
      floor_info: '10층',
      rooms_bathrooms: '3룸 2욕실',
      direction: '남향',
      maintenance_fee: '', // 빈 문자열
      parking: '1대',
      move_in_date: '즉시입주',
      special_notes: '숫자 필드 처리 테스트',
      manager_memo: '빈 문자열 처리 테스트',
      is_commercial: false
    };

    console.log('원본 데이터 (빈 문자열 포함):');
    console.log(JSON.stringify(testDataWithEmptyStrings, null, 2));

    // 숫자 필드 처리 적용
    const processedData = processNumericFields(testDataWithEmptyStrings);
    console.log('\n처리된 데이터 (null 변환):');
    console.log(JSON.stringify(processedData, null, 2));

    console.log('\n3️⃣ 데이터베이스에 삽입 테스트');
    console.log('------------------------------');

    const { data: insertData, error: insertError } = await supabase
      .from('properties')
      .insert(processedData)
      .select();

    if (insertError) {
      console.log('❌ 매물 등록 실패:', insertError.message);
      console.log('상세 오류:', insertError);
    } else {
      console.log('✅ 매물 등록 성공!');
      console.log('등록된 데이터:', JSON.stringify(insertData[0], null, 2));
      
      // 테스트 데이터 삭제
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

testPropertyNumericFix();