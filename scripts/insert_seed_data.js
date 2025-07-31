// 서비스 역할로 시드 데이터 직접 삽입
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwxghpwasmvottahchky.supabase.co';
// 여기서 서비스 역할 키가 필요합니다. anon 키로는 RLS 때문에 데이터 삽입이 안됩니다.
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log('서비스 역할 키가 없습니다. 다음 방법 중 하나를 사용하세요:');
  console.log('1. Supabase 대시보드에서 seed_lookup_data.sql 실행');
  console.log('2. 환경변수 VITE_SUPABASE_SERVICE_ROLE_KEY 설정');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function insertSeedData() {
  try {
    console.log('시드 데이터 삽입 시작...');

    // 매물 종류 데이터
    const propertyTypes = [
      { name: '원룸' },
      { name: '투룸' },
      { name: '쓰리룸' },
      { name: '오피스텔' },
      { name: '아파트' },
      { name: '빌라' },
      { name: '단독주택' },
      { name: '상가' }
    ];

    console.log('매물 종류 데이터 삽입...');
    const { data: insertedPropertyTypes, error: propertyTypeError } = await supabase
      .from('property_types')
      .upsert(propertyTypes, { onConflict: 'name' })
      .select();

    if (propertyTypeError) {
      console.error('매물 종류 삽입 실패:', propertyTypeError);
    } else {
      console.log(`✅ 매물 종류 ${insertedPropertyTypes.length}개 삽입 성공`);
    }

    // 진행 상태 데이터
    const propertyStatuses = [
      { name: '매물확보' },
      { name: '광고진행' },
      { name: '계약진행' },
      { name: '거래완료' },
      { name: '매물취소' }
    ];

    console.log('진행 상태 데이터 삽입...');
    const { data: insertedStatuses, error: statusError } = await supabase
      .from('property_statuses')
      .upsert(propertyStatuses, { onConflict: 'name' })
      .select();

    if (statusError) {
      console.error('진행 상태 삽입 실패:', statusError);
    } else {
      console.log(`✅ 진행 상태 ${insertedStatuses.length}개 삽입 성공`);
    }

    // 거래 유형 데이터
    const transactionTypes = [
      { name: '매매' },
      { name: '전세' },
      { name: '월세' },
      { name: '단기임대' }
    ];

    console.log('거래 유형 데이터 삽입...');
    const { data: insertedTransactionTypes, error: transactionError } = await supabase
      .from('transaction_types')
      .upsert(transactionTypes, { onConflict: 'name' })
      .select();

    if (transactionError) {
      console.error('거래 유형 삽입 실패:', transactionError);
    } else {
      console.log(`✅ 거래 유형 ${insertedTransactionTypes.length}개 삽입 성공`);
    }

    // 테스트용 소유주 데이터
    const owners = [
      { name: '김소유자', phone: '010-1234-5678', contact_relation: '본인' },
      { name: '박소유자', phone: '010-2345-6789', contact_relation: '본인' },
      { name: '이소유자', phone: '010-3456-7890', contact_relation: '대리인' }
    ];

    console.log('소유주 데이터 삽입...');
    const { data: insertedOwners, error: ownerError } = await supabase
      .from('owners')
      .upsert(owners, { onConflict: 'phone' })
      .select();

    if (ownerError) {
      console.error('소유주 삽입 실패:', ownerError);
    } else {
      console.log(`✅ 소유주 ${insertedOwners.length}개 삽입 성공`);
    }

    console.log('✅ 모든 시드 데이터 삽입 완료!');

  } catch (error) {
    console.error('❌ 시드 데이터 삽입 실패:', error);
  }
}

insertSeedData();