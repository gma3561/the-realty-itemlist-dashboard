// 샘플 매물 데이터를 SQL INSERT문으로 생성하는 스크립트

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
    property_type_id: 3,
    transaction_type_id: 2, // 전세
    property_status_id: 1,
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
    property_type_id: 3,
    transaction_type_id: 3, // 월세
    property_status_id: 1,
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

// 관리자 ID (하드코딩된 관리자들 중 하나 사용)
const managerId = '00000000-0000-0000-0000-000000000000'; // 기본 admin ID

function generateSQL() {
  console.log('-- 샘플 매물 데이터 INSERT 문');
  console.log('-- 실행 방법: Supabase Dashboard > SQL Editor에서 아래 쿼리를 실행하세요');
  console.log('--');
  console.log('-- 2025-07-31 생성됨\n');
  
  sampleProperties.forEach((property, index) => {
    const values = [
      `'${property.property_name.replace(/'/g, "''")}'`, // property_name
      `'${property.location.replace(/'/g, "''")}'`, // location
      property.property_type_id, // property_type_id
      property.transaction_type_id, // transaction_type_id
      property.property_status_id, // property_status_id
      property.price || 'NULL', // price
      property.lease_price || 'NULL', // lease_price
      property.supply_area_sqm || 'NULL', // supply_area_sqm
      property.floor_info ? `'${property.floor_info.replace(/'/g, "''")}'` : 'NULL', // floor_info
      property.rooms_bathrooms ? `'${property.rooms_bathrooms.replace(/'/g, "''")}'` : 'NULL', // rooms_bathrooms
      property.direction ? `'${property.direction.replace(/'/g, "''")}'` : 'NULL', // direction
      property.maintenance_fee ? `'${property.maintenance_fee.replace(/'/g, "''")}'` : 'NULL', // maintenance_fee
      property.parking ? `'${property.parking.replace(/'/g, "''")}'` : 'NULL', // parking
      property.move_in_date ? `'${property.move_in_date.replace(/'/g, "''")}'` : 'NULL', // move_in_date
      property.building_approval_date ? `'${property.building_approval_date.replace(/'/g, "''")}'` : 'NULL', // building_approval_date
      property.special_notes ? `'${property.special_notes.replace(/'/g, "''")}'` : 'NULL', // special_notes
      property.resident ? `'${property.resident.replace(/'/g, "''")}'::jsonb` : 'NULL', // resident
      `'${managerId}'`, // manager_id
      'NOW()', // created_at
      'NOW()' // updated_at
    ];
    
    console.log(`INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  ${values.join(',\n  ')}
);`);
    
    if (index < sampleProperties.length - 1) {
      console.log('');
    }
  });
  
  console.log('\n-- 매물 데이터 삽입 완료');
  console.log(`-- 총 ${sampleProperties.length}개의 샘플 매물이 생성됩니다.`);
}

// 스크립트 실행
if (require.main === module) {
  generateSQL();
}

module.exports = { generateSQL, sampleProperties };