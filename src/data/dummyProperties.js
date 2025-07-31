// 하드코딩된 더미 매물 데이터
export const dummyProperties = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    property_name: '힐탑빌 302호',
    location: '한남동 1-241',
    property_type_id: '550e8400-e29b-41d4-a716-446655440003', // 빌라/연립
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440001', // 매매
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: 250000,
    lease_price: null,
    monthly_rent: null,
    supply_area_pyeong: 41,
    private_area_pyeong: 37,
    supply_area_sqm: 135.54,
    private_area_sqm: 122.31,
    floor_info: '3층/4층',
    room_bathroom: '3/2개',
    direction: '남향',
    maintenance_fee_text: '20만원+',
    parking: '1대',
    description: '한남동 유엔빌리지 내에 위치한 고급빌라. 수리가 매우 잘되어있는 최고의 컨디션.',
    resident: '{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-jenny@the-realty.co.kr',
    created_at: '2025-07-31T00:00:00.000Z',
    updated_at: '2025-07-31T00:00:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    property_name: '힐탑빌 302호 (전세)',
    location: '한남동 1-241',
    property_type_id: '550e8400-e29b-41d4-a716-446655440003', // 빌라/연립
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440002', // 전세
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: null,
    lease_price: 140000,
    monthly_rent: null,
    supply_area_pyeong: 41,
    private_area_pyeong: 37,
    supply_area_sqm: 135.54,
    private_area_sqm: 122.31,
    floor_info: '3층/4층',
    room_bathroom: '3/2개',
    direction: '남향',
    maintenance_fee_text: '20만원+',
    parking: '1대',
    description: '한남동 유엔빌리지 내에 위치한 고급빌라',
    resident: '{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-jenny@the-realty.co.kr',
    created_at: '2025-07-31T00:01:00.000Z',
    updated_at: '2025-07-31T00:01:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    property_name: '롯데캐슬이스트폴 4804호',
    location: '자양동 680-63번지',
    property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440002', // 전세
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: null,
    lease_price: 210000,
    monthly_rent: null,
    supply_area_pyeong: 54.49,
    private_area_pyeong: 41.9,
    supply_area_sqm: 180.19,
    private_area_sqm: 138.51,
    floor_info: '48/48층',
    room_bathroom: '4/2개',
    direction: '남향',
    maintenance_fee_text: '확인불가',
    parking: '1.32대',
    description: '롯데캐슬이스트폴. 커뮤니티시설 최상, 강남 잠실 출퇴근 편리',
    resident: '{"name":"넥스트커넥트","phone":"010-3315-5752","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-jenny@the-realty.co.kr',
    created_at: '2025-07-31T00:02:00.000Z',
    updated_at: '2025-07-31T00:02:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    property_name: '강남센트럴아이파크 2505호',
    location: '강남구 논현동',
    property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440001', // 매매
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: 450000,
    lease_price: null,
    monthly_rent: null,
    supply_area_pyeong: 84,
    private_area_pyeong: 65,
    supply_area_sqm: 277.69,
    private_area_sqm: 214.88,
    floor_info: '25/40층',
    room_bathroom: '4/3개',
    direction: '남동향',
    maintenance_fee_text: '35만원',
    parking: '2대',
    description: '강남역 도보 5분, 최고급 아파트',
    resident: '{"name":"김영희","phone":"010-1234-5678","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-lucas@the-realty.co.kr',
    created_at: '2025-07-31T00:03:00.000Z',
    updated_at: '2025-07-31T00:03:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    property_name: '래미안원베일리 1203호',
    location: '서초구 반포동',
    property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440002', // 전세
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: null,
    lease_price: 180000,
    monthly_rent: null,
    supply_area_pyeong: 59,
    private_area_pyeong: 45,
    supply_area_sqm: 195.04,
    private_area_sqm: 148.76,
    floor_info: '12/35층',
    room_bathroom: '3/2개',
    direction: '남향',
    maintenance_fee_text: '25만원',
    parking: '1대',
    description: '한강뷰, 반포한강공원 인접',
    resident: '{"name":"이민수","phone":"010-9876-5432","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-hmlee@the-realty.co.kr',
    created_at: '2025-07-31T00:04:00.000Z',
    updated_at: '2025-07-31T00:04:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    property_name: '잠실트리지움 3407호',
    location: '송파구 잠실동',
    property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440001', // 매매
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: 380000,
    lease_price: null,
    monthly_rent: null,
    supply_area_pyeong: 76,
    private_area_pyeong: 58,
    supply_area_sqm: 251.24,
    private_area_sqm: 191.74,
    floor_info: '34/50층',
    room_bathroom: '4/2개',
    direction: '남서향',
    maintenance_fee_text: '28만원',
    parking: '2대',
    description: '롯데월드, 석촌호수 인근 프리미엄 아파트',
    resident: '{"name":"박철수","phone":"010-5555-7777","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-jenny@the-realty.co.kr',
    created_at: '2025-07-31T00:05:00.000Z',
    updated_at: '2025-07-31T00:05:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    property_name: '상암월드컵파크 1508호',
    location: '마포구 상암동',
    property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440003', // 월세
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: null,
    lease_price: 20000,
    monthly_rent: 150,
    supply_area_pyeong: 49,
    private_area_pyeong: 38,
    supply_area_sqm: 162.08,
    private_area_sqm: 125.62,
    floor_info: '15/30층',
    room_bathroom: '3/2개',
    direction: '동남향',
    maintenance_fee_text: '20만원',
    parking: '1대',
    description: '월드컵공원 인접, DMC 비즈니스 단지',
    resident: '{"name":"최영자","phone":"010-3333-9999","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-lucas@the-realty.co.kr',
    created_at: '2025-07-31T00:06:00.000Z',
    updated_at: '2025-07-31T00:06:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    property_name: '이촌삼성래미안 2201호',
    location: '용산구 이촌동',
    property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440002', // 전세
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: null,
    lease_price: 160000,
    monthly_rent: null,
    supply_area_pyeong: 52,
    private_area_pyeong: 40,
    supply_area_sqm: 171.90,
    private_area_sqm: 132.23,
    floor_info: '22/28층',
    room_bathroom: '3/2개',
    direction: '한강조망',
    maintenance_fee_text: '22만원',
    parking: '1대',
    description: '한강조망 최고층, 이촌한강공원 도보 2분',
    resident: '{"name":"홍길동","phone":"010-7777-1111","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-hmlee@the-realty.co.kr',
    created_at: '2025-07-31T00:07:00.000Z',
    updated_at: '2025-07-31T00:07:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440009',
    property_name: '한남동 힐탑빌 월세',
    location: '한남동 1-241',
    property_type_id: '550e8400-e29b-41d4-a716-446655440003', // 빌라/연립
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440003', // 월세
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: null,
    lease_price: 10000,
    monthly_rent: 900,
    supply_area_pyeong: 41,
    private_area_pyeong: 37,
    supply_area_sqm: 135.54,
    private_area_sqm: 122.31,
    floor_info: '3층/4층',
    room_bathroom: '3/2개',
    direction: '남향',
    maintenance_fee_text: '20만원+',
    parking: '1대',
    description: '한남동 유엔빌리지 내에 위치한 고급빌라',
    resident: '{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-jenny@the-realty.co.kr',
    created_at: '2025-07-31T00:08:00.000Z',
    updated_at: '2025-07-31T00:08:00.000Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    property_name: '롯데캐슬이스트폴 4804호 월세',
    location: '자양동 680-63번지',
    property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트
    transaction_type_id: '650e8400-e29b-41d4-a716-446655440003', // 월세
    property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
    price: null,
    lease_price: 30000,
    monthly_rent: 680,
    supply_area_pyeong: 54.49,
    private_area_pyeong: 41.9,
    supply_area_sqm: 180.19,
    private_area_sqm: 138.51,
    floor_info: '48/48층',
    room_bathroom: '4/2개',
    direction: '남향',
    maintenance_fee_text: '확인불가',
    parking: '1.32대',
    description: '롯데캐슬이스트폴. 커뮤니티시설 최상',
    resident: '{"name":"넥스트커넥트","phone":"010-3315-5752","email":"","address":"","notes":""}',
    manager_id: 'hardcoded-lucas@the-realty.co.kr',
    created_at: '2025-07-31T00:09:00.000Z',
    updated_at: '2025-07-31T00:09:00.000Z'
  }
];

// 룩업 테이블 더미 데이터
export const dummyPropertyTypes = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: '아파트' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: '오피스텔' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: '빌라/연립' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: '단독주택' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: '상가' }
];

export const dummyTransactionTypes = [
  { id: '650e8400-e29b-41d4-a716-446655440001', name: '매매' },
  { id: '650e8400-e29b-41d4-a716-446655440002', name: '전세' },
  { id: '650e8400-e29b-41d4-a716-446655440003', name: '월세' }
];

export const dummyPropertyStatuses = [
  { id: '750e8400-e29b-41d4-a716-446655440001', name: '거래가능' },
  { id: '750e8400-e29b-41d4-a716-446655440002', name: '거래보류' },
  { id: '750e8400-e29b-41d4-a716-446655440003', name: '거래완료' }
];