// 거래유형별 가격 입력 폼 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testPriceFormValidation() {
  try {
    console.log('💰 거래유형별 가격 입력 테스트');
    console.log('==============================');

    // 관리자 로그인
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });

    if (loginError) {
      console.log('❌ 로그인 실패:', loginError.message);
      return;
    }

    console.log('✅ 관리자 로그인 성공');

    // 룩업 데이터 조회
    const [propertyTypes, propertyStatuses, transactionTypes] = await Promise.all([
      supabase.from('property_types').select('*'),
      supabase.from('property_statuses').select('*'),
      supabase.from('transaction_types').select('*')
    ]);

    const testCases = [
      {
        name: '매매 테스트',
        transactionType: '매매',
        data: {
          price: 2500000000,
          lease_price: null
        }
      },
      {
        name: '전세 테스트',
        transactionType: '전세',
        data: {
          price: null,
          lease_price: 200000000
        }
      },
      {
        name: '월세 테스트',
        transactionType: '월세',
        data: {
          price: 500000,
          lease_price: 50000000
        }
      },
      {
        name: '분양 테스트',
        transactionType: '분양',
        data: {
          price: 3000000000,
          lease_price: null
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 ${testCase.name}`);
      console.log('-------------------');

      const transactionType = transactionTypes.data.find(tt => tt.name === testCase.transactionType);
      const propertyType = propertyTypes.data.find(pt => pt.name === '아파트');
      const propertyStatus = propertyStatuses.data.find(ps => ps.name === '거래가능');

      if (!transactionType || !propertyType || !propertyStatus) {
        console.log('❌ 필요한 룩업 데이터가 없습니다');
        continue;
      }

      const testProperty = {
        property_name: `${testCase.name} 매물`,
        location: '서울시 강남구 테스트동',
        building: '101동',
        unit: '1001호',
        property_type_id: propertyType.id,
        property_status_id: propertyStatus.id,
        transaction_type_id: transactionType.id,
        price: testCase.data.price,
        lease_price: testCase.data.lease_price,
        supply_area_sqm: 84.5,
        private_area_sqm: 65.2,
        manager_id: loginData.user.id,
        resident: JSON.stringify({
          name: '테스트 고객',
          phone: '010-1234-5678',
          email: 'test@example.com',
          address: '서울시 강남구',
          notes: `${testCase.name} 고객`
        })
      };

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .insert(testProperty)
        .select();

      if (propertyError) {
        console.log('❌ 매물 등록 실패:', propertyError.message);
      } else {
        console.log('✅ 매물 등록 성공!');
        console.log(`   거래유형: ${testCase.transactionType}`);
        
        if (testCase.data.price) {
          console.log(`   가격: ${testCase.data.price.toLocaleString()}원`);
        }
        if (testCase.data.lease_price) {
          console.log(`   보증금: ${testCase.data.lease_price.toLocaleString()}원`);
        }

        // 정리
        await supabase.from('properties').delete().eq('id', propertyData[0].id);
        console.log('   🗑️ 테스트 매물 정리 완료');
      }
    }

    await supabase.auth.signOut();
    console.log('\n✅ 모든 테스트 완료!');

    console.log('\n📋 거래유형별 가격 필드 매핑:');
    console.log('- 매매: price (매매가)');
    console.log('- 전세: lease_price (전세 보증금)');
    console.log('- 월세: lease_price (보증금) + price (월세)');
    console.log('- 분양: price (분양가)');
    console.log('- 단기임대: price (일일요금)');

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error.message);
  }
}

testPriceFormValidation();