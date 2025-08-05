import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Service Role Key가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 실제 부동산 매물 샘플 데이터 (강남/서초 중심)
const REAL_PROPERTIES = [
  {
    property_name: '래미안 대치팰리스 84㎡',
    location: '서울특별시 강남구 대치동',
    building_name: '래미안 대치팰리스',
    room_number: '101동 1205호',
    property_type: 'apt',
    transaction_type: 'sale',
    property_status: 'available',
    area_pyeong: 25.4,
    area_m2: 84,
    floor_current: 12,
    floor_total: 25,
    room_count: 3,
    bath_count: 2,
    price: 1850000000, // 18억 5천만원
    lease_price: null,
    monthly_fee: 450000,
    description: '대치동 역세권 프리미엄 아파트입니다. 남향으로 채광이 우수하며, 리모델링이 완료되어 즉시 입주 가능합니다. 근처에 대치초등학교, 대치중학교가 있어 교육환경이 우수합니다.',
    special_notes: '즉시 입주 가능, 주차 2대, 개별난방',
    available_date: '2025-01-15',
    exclusive_type: 'general',
    exclusive_end_date: null,
    manager_name: '하상현',
    owner_name: '김소유',
    owner_phone: '010-1111-2222',
    customer_name: null,
    customer_phone: null,
    customer_request: null
  },
  {
    property_name: '서초 아크로타워 전세',
    location: '서울특별시 서초구 서초동',
    building_name: '아크로타워',
    room_number: '205동 805호',
    property_type: 'apt',
    transaction_type: 'lease',
    property_status: 'available',
    area_pyeong: 32.1,
    area_m2: 106,
    floor_current: 8,
    floor_total: 20,
    room_count: 4,
    bath_count: 2,
    price: null,
    lease_price: 1200000000, // 전세 12억
    monthly_fee: 350000,
    description: '서초역 도보 3분 거리의 신축 아파트입니다. 한강뷰를 감상할 수 있으며, 최신 시설을 갖추고 있습니다. 주변에 서초고등학교, 서울고등학교 등 명문학교가 위치해 있습니다.',
    special_notes: '신축, 한강뷰, 고층, 주차 2대',
    available_date: '2025-02-01',
    exclusive_type: 'general',
    exclusive_end_date: null,
    manager_name: '박소현',
    owner_name: '이집주',
    owner_phone: '010-2222-3333',
    customer_name: '정고객',
    customer_phone: '010-4444-5555',
    customer_request: '2월 입주 희망, 아이 학교 때문에 서초 지역만 고려'
  },
  {
    property_name: '반포 자이 월세',
    location: '서울특별시 서초구 반포동',
    building_name: '반포 자이',
    room_number: '301동 1102호',
    property_type: 'apt',
    transaction_type: 'monthly',
    property_status: 'negotiating',
    area_pyeong: 28.5,
    area_m2: 94,
    floor_current: 11,
    floor_total: 30,
    room_count: 3,
    bath_count: 2,
    price: 300000000, // 보증금 3억
    lease_price: null,
    monthly_fee: 280000,
    description: '반포한강공원이 바로 앞에 있는 강변 아파트입니다. 쾌적한 주거환경과 우수한 교통편을 자랑합니다. 지하철 3호선 고속터미널역까지 도보 10분 거리입니다.',
    special_notes: '한강뷰, 고속터미널역 근처, 펜트하우스급 뷰',
    available_date: '2025-01-20',
    exclusive_type: 'exclusive',
    exclusive_end_date: '2025-02-20',
    manager_name: '김매니저',  
    owner_name: '박임대',
    owner_phone: '010-3333-4444',
    customer_name: '최관심',
    customer_phone: '010-5555-6666',
    customer_request: '한강뷰 필수, 1월 말 입주 희망'
  },
  {
    property_name: '역삼동 오피스텔',
    location: '서울특별시 강남구 역삼동',
    building_name: '역삼 트윈타워',
    room_number: 'A동 1205호',
    property_type: 'officetel',
    transaction_type: 'monthly',
    property_status: 'available',
    area_pyeong: 15.2,
    area_m2: 50,
    floor_current: 12,
    floor_total: 25,
    room_count: 1,
    bath_count: 1,
    price: 100000000, // 보증금 1억
    lease_price: null,
    monthly_fee: 180000,
    description: '강남역 도보 5분 거리의 신축 오피스텔입니다. 투자 및 거주 목적 모두 적합하며, 주변 상권이 발달되어 있습니다. 24시간 보안시스템과 피트니스 센터를 운영합니다.',
    special_notes: '신축, 강남역 근처, 피트니스 센터, 24시간 보안',
    available_date: '2025-01-10',
    exclusive_type: 'general',
    exclusive_end_date: null,
    manager_name: '하상현',
    owner_name: '김투자',
    owner_phone: '010-4444-5555',
    customer_name: null,
    customer_phone: null,
    customer_request: null
  },
  {
    property_name: '청담동 단독주택',
    location: '서울특별시 강남구 청담동',
    building_name: null,
    room_number: null,
    property_type: 'house',
    transaction_type: 'sale',
    property_status: 'reserved',
    area_pyeong: 45.8,
    area_m2: 151,
    floor_current: 3,
    floor_total: 3,
    room_count: 5,
    bath_count: 3,
    price: 2800000000, // 28억원
    lease_price: null,
    monthly_fee: 0,
    description: '청담동 한복판에 위치한 프리미엄 단독주택입니다. 지하 1층, 지상 3층 구조로 넓은 정원을 보유하고 있습니다. 갤러리아 백화점, 청담역이 도보 거리에 있어 최고의 입지를 자랑합니다.',
    special_notes: '단독주택, 정원 보유, 청담 핵심 위치, 주차 3대',
    available_date: '2025-03-01',
    exclusive_type: 'exclusive',
    exclusive_end_date: '2025-04-01',
    manager_name: '박소현',
    owner_name: '최부자',
    owner_phone: '010-5555-6666',
    customer_name: '강구매',
    customer_phone: '010-6666-7777',
    customer_request: '청담동 단독주택만 고려, 3월 입주 예정'
  }
];

async function createSampleProperties() {
  console.log('🏠 실제 매물 샘플 데이터 생성 중...\n');

  // 먼저 사용자 목록 확인하여 실제 manager_id 매핑
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email');

  console.log('👥 등록된 사용자 목록:');
  users?.forEach(user => {
    console.log(`   - ${user.name}: ${user.id.substring(0, 8)}...`);
  });

  if (!users || users.length === 0) {
    console.log('❌ 먼저 사용자를 생성해주세요. (setup-real-users.js 실행)');
    return;
  }

  // 사용자 이름으로 ID 매핑
  const userMapping = {};
  users.forEach(user => {
    userMapping[user.name] = user.id;
  });

  console.log('\n🏠 매물 데이터 생성 중...');

  for (const propData of REAL_PROPERTIES) {
    try {
      // manager_name을 실제 user_id로 변환
      const managerId = userMapping[propData.manager_name];
      
      const propertyToInsert = {
        ...propData,
        manager_id: managerId,
        user_id: managerId,
        created_by: managerId,
        updated_by: managerId,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // manager_name은 데이터베이스에 저장하지 않음 (테이블에 없는 컬럼)
      delete propertyToInsert.manager_name;

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyToInsert)
        .select()
        .single();

      if (error) {
        console.log(`❌ ${propData.property_name} 생성 실패:`, error.message);
      } else {
        console.log(`✅ ${propData.property_name} 생성 완료`);
      }

    } catch (error) {
      console.error(`❌ ${propData.property_name} 처리 중 오류:`, error.message);
    }
  }

  // 생성된 매물 확인
  console.log('\n📋 생성된 매물 목록:');
  const { data: properties } = await supabase
    .from('properties')
    .select(`
      property_name, 
      location, 
      property_status, 
      transaction_type,
      users!properties_manager_id_fkey(name)
    `)
    .order('created_at', { ascending: false });

  if (properties) {
    properties.forEach((prop, idx) => {
      console.log(`   ${idx + 1}. ${prop.property_name}`);
      console.log(`      - 위치: ${prop.location}`);
      console.log(`      - 상태: ${prop.property_status}`);
      console.log(`      - 거래: ${prop.transaction_type}`);
      console.log(`      - 담당: ${prop.users?.name || '정보 없음'}\n`);
    });
  }

  console.log('🎉 실제 매물 샘플 데이터 생성 완료!');
}

createSampleProperties();