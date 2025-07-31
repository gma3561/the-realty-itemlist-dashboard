const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzc2MjQxOCwiZXhwIjoyMDUzMzM4NDE4fQ.Ay9ksUHlxE2-PdVaQrqRAIdOqSTGHlNpE-Zp6PRHM8w';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 샘플 매물 데이터 (CSV 데이터를 기반으로 생성)
const sampleProperties = [
  {
    property_name: '힐탑빌 302호',
    location: '한남동 1-241',
    property_type_id: 3, // 빌라/연립
    transaction_type_id: 1, // 매매
    property_status_id: 1, // 매물확보
    price: 2500000000, // 25억
    supply_area_sqm: 137.46,
    floor_info: '3층/4층',
    rooms_bathrooms: '3/2개',
    direction: '남향',
    maintenance_fee: '20만원+',
    parking: '1대',
    move_in_date: '즉시입주',
    building_approval_date: '1992.10.02',
    special_notes: '한남동 유엔빌리지 내에 위치한 고급빌라입니다. 수리가 매우 잘되어있는 최고의 컨디션입니다.',
    resident: JSON.stringify({
      customer_name: '박윤정',
      customer_phone: '010-7467-0890',
      customer_notes: '소유주'
    })
  },
  {
    property_name: '힐탑빌 302호 (전세)',
    location: '한남동 1-241',
    property_type_id: 3, // 빌라/연립
    transaction_type_id: 2, // 전세
    property_status_id: 1, // 매물확보
    price: 1400000000, // 14억
    supply_area_sqm: 137.46,
    floor_info: '3층/4층',
    rooms_bathrooms: '3/2개',
    direction: '남향',
    maintenance_fee: '20만원+',
    parking: '1대',
    move_in_date: '즉시입주',
    building_approval_date: '1992.10.02',
    special_notes: '한남동 유엔빌리지 내에 위치한 고급빌라입니다.',
    resident: JSON.stringify({
      customer_name: '박윤정',
      customer_phone: '010-7467-0890',
      customer_notes: '소유주'
    })
  },
  {
    property_name: '힐탑빌 302호 (월세)',
    location: '한남동 1-241',
    property_type_id: 3, // 빌라/연립
    transaction_type_id: 3, // 월세
    property_status_id: 1, // 매물확보
    price: 9000000, // 900만원 (월세)
    lease_price: 100000000, // 1억 (보증금)
    supply_area_sqm: 137.46,
    floor_info: '3층/4층',
    rooms_bathrooms: '3/2개',
    direction: '남향',
    maintenance_fee: '20만원+',
    parking: '1대',
    move_in_date: '즉시입주',
    building_approval_date: '1992.10.02',
    special_notes: '한남동 유엔빌리지 내에 위치한 고급빌라입니다.',
    resident: JSON.stringify({
      customer_name: '박윤정',
      customer_phone: '010-7467-0890',
      customer_notes: '소유주'
    })
  },
  {
    property_name: '강남 오피스텔',
    location: '강남구 역삼동',
    property_type_id: 2, // 오피스텔
    transaction_type_id: 1, // 매매
    property_status_id: 2, // 광고진행
    price: 800000000, // 8억
    supply_area_sqm: 84.5,
    floor_info: '15층/20층',
    rooms_bathrooms: '1/1개',
    direction: '남동향',
    maintenance_fee: '15만원',
    parking: '1대',
    move_in_date: '2025-09-01',
    building_approval_date: '2018.03.15',
    special_notes: '강남역 도보 5분, 신축 오피스텔',
    resident: JSON.stringify({
      customer_name: '김영희',
      customer_phone: '010-8888-9999',
      customer_notes: '투자목적'
    })
  },
  {
    property_name: '잠실 아파트',
    location: '송파구 잠실동',
    property_type_id: 1, // 아파트
    transaction_type_id: 2, // 전세
    property_status_id: 1, // 매물확보
    price: 600000000, // 6억
    supply_area_sqm: 114.2,
    floor_info: '12층/25층',
    rooms_bathrooms: '4/2개',
    direction: '남향',
    maintenance_fee: '25만원',
    parking: '2대',
    move_in_date: '2025-08-15',
    building_approval_date: '2005.12.20',
    special_notes: '잠실역 도보 10분, 한강조망 가능',
    resident: JSON.stringify({
      customer_name: '이철수',
      customer_phone: '010-1111-2222',
      customer_notes: '실거주'
    })
  },
  {
    property_name: '홍대 상가',
    location: '마포구 홍익로',
    property_type_id: 5, // 상가
    transaction_type_id: 3, // 월세
    property_status_id: 1, // 매물확보
    price: 5000000, // 500만원 (월세)
    lease_price: 50000000, // 5천만원 (보증금)
    supply_area_sqm: 66.1,
    floor_info: '1층/5층',
    rooms_bathrooms: '2/1개',
    direction: '동향',
    maintenance_fee: '10만원',
    parking: '없음',
    move_in_date: '협의',
    building_approval_date: '2010.05.30',
    special_notes: '홍대 번화가, 유동인구 많음, 카페/음식점 적합',
    resident: JSON.stringify({
      customer_name: '박사장',
      customer_phone: '010-3333-4444',
      customer_notes: '임대사업자'
    })
  },
  {
    property_name: '서초 단독주택',
    location: '서초구 반포동',
    property_type_id: 4, // 단독주택
    transaction_type_id: 1, // 매매
    property_status_id: 3, // 거래완료
    price: 1800000000, // 18억
    supply_area_sqm: 198.3,
    floor_info: '지상2층/지하1층',
    rooms_bathrooms: '5/3개',
    direction: '남서향',
    maintenance_fee: '없음',
    parking: '3대',
    move_in_date: '거래완료',
    building_approval_date: '1995.08.10',
    special_notes: '한강조망, 대형 정원, 리모델링 완료',
    resident: JSON.stringify({
      customer_name: '최부자',
      customer_phone: '010-5555-6666',
      customer_notes: '거래완료'
    })
  },
  {
    property_name: '분양 신축 아파트',
    location: '구리시 교문동',
    property_type_id: 1, // 아파트
    transaction_type_id: 4, // 분양
    property_status_id: 1, // 매물확보
    price: 450000000, // 4.5억
    supply_area_sqm: 84.9,
    floor_info: '10층/15층',
    rooms_bathrooms: '3/2개',
    direction: '남향',
    maintenance_fee: '미정',
    parking: '1대',
    move_in_date: '2026-03-01',
    building_approval_date: '미정',
    special_notes: '2026년 3월 입주 예정, 분양권 전매 가능',
    resident: JSON.stringify({
      customer_name: '분양사무소',
      customer_phone: '010-7777-8888',
      customer_notes: '분양담당자'
    })
  }
];

async function createSampleData() {
  console.log('샘플 매물 데이터 생성을 시작합니다...');
  
  // 먼저 기존 사용자 조회
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(10);
  
  if (userError) {
    console.error('사용자 조회 실패:', userError);
    return;
  }
  
  // 사용자가 없으면 기본 관리자 ID 사용
  const managerIds = users && users.length > 0 
    ? users.map(u => u.id)
    : ['00000000-0000-0000-0000-000000000000']; // 기본 admin ID
  
  console.log(`사용 가능한 관리자 ID: ${managerIds.length}개`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const propertyData of sampleProperties) {
    try {
      // 랜덤 관리자 할당
      const managerId = managerIds[Math.floor(Math.random() * managerIds.length)];
      
      const finalPropertyData = {
        ...propertyData,
        manager_id: managerId,
        created_at: new Date().toISOString()
      };
      
      // 데이터베이스에 삽입
      const { data, error } = await supabase
        .from('properties')
        .insert([finalPropertyData])
        .select();
      
      if (error) {
        console.error(`매물 "${propertyData.property_name}" 삽입 실패:`, error);
        errorCount++;
      } else {
        console.log(`매물 "${propertyData.property_name}" 삽입 성공`);
        successCount++;
      }
      
    } catch (err) {
      console.error(`매물 "${propertyData.property_name}" 처리 중 오류:`, err);
      errorCount++;
    }
  }
  
  console.log(`\n샘플 데이터 생성 완료:`);
  console.log(`- 성공: ${successCount}개`);
  console.log(`- 실패: ${errorCount}개`);
  
  return { success: successCount, errors: errorCount };
}

// 스크립트 실행
if (require.main === module) {
  createSampleData()
    .then(() => {
      console.log('샘플 데이터 생성이 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('샘플 데이터 생성 중 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = createSampleData;