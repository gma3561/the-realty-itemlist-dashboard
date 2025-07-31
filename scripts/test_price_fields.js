// 매물 등록 금액 필드 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testPropertyRegistration() {
  try {
    // 1. 로그인
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });

    if (loginError) {
      console.log('❌ 로그인 실패:', loginError.message);
      return;
    }

    console.log('✅ 로그인 성공');

    // 2. 룩업 테이블 조회
    const [propertyTypes, propertyStatuses, transactionTypes] = await Promise.all([
      supabase.from('property_types').select('id, name').eq('name', '아파트'),
      supabase.from('property_statuses').select('id, name').eq('name', '거래가능'),
      supabase.from('transaction_types').select('id, name').eq('name', '매매')
    ]);

    console.log('룩업 데이터:');
    console.log('- 매물유형:', propertyTypes.data?.[0]?.name);
    console.log('- 상태:', propertyStatuses.data?.[0]?.name);
    console.log('- 거래유형:', transactionTypes.data?.[0]?.name);

    if (!propertyTypes.data?.[0] || !propertyStatuses.data?.[0] || !transactionTypes.data?.[0]) {
      console.log('❌ 룩업 데이터가 없습니다');
      return;
    }

    // 3. 매물 등록 테스트 (금액 필드 포함)
    const testProperty = {
      property_name: '매매가 테스트 매물',
      location: '서울시 강남구',
      building: '101동',
      unit: '1001호',
      property_type_id: propertyTypes.data[0].id,
      property_status_id: propertyStatuses.data[0].id,
      transaction_type_id: transactionTypes.data[0].id,
      price: 2500000000, // 매매가 25억
      lease_price: null,
      supply_area_sqm: 84.56,
      private_area_sqm: 65.23,
      floor_info: '10층',
      rooms_bathrooms: '3룸 2욕실',
      direction: '남향',
      maintenance_fee: 150000,
      parking: '1대',
      move_in_date: '즉시입주',
      special_notes: '매매가 입력 테스트용',
      is_commercial: false,
      manager_id: loginData.user.id
    };

    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert(testProperty)
      .select();

    if (propertyError) {
      console.log('❌ 매물 등록 실패:', propertyError.message);
    } else {
      console.log('✅ 매매가 포함 매물 등록 성공!');
      console.log('등록된 매물:', {
        name: propertyData[0].property_name,
        price: propertyData[0].price,
        lease_price: propertyData[0].lease_price
      });

      // 정리
      await supabase.from('properties').delete().eq('id', propertyData[0].id);
      console.log('🗑️ 테스트 매물 정리 완료');
    }

    await supabase.auth.signOut();
    console.log('✅ 테스트 완료');

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testPropertyRegistration();