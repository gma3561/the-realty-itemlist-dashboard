
> the-realty-itemlist-dashboard@1.0.0 generate-sql
> node scripts/generate_sample_sql.js

-- 샘플 매물 데이터 INSERT 문
-- 실행 방법: Supabase Dashboard > SQL Editor에서 아래 쿼리를 실행하세요
--
-- 2025-07-31 생성됨

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '힐탑빌 302호',
  '한남동 1-241',
  3,
  1,
  1,
  2500000000,
  NULL,
  137.46,
  '3층/4층',
  '3/2개',
  '남향',
  '20만원+',
  '1대',
  '즉시입주',
  '1992.10.02',
  '한남동 유엔빌리지 내에 위치한 고급빌라입니다. 수리가 매우 잘되어있는 최고의 컨디션입니다.',
  '{"customer_name":"박윤정","customer_phone":"010-7467-0890","customer_notes":"소유주"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '힐탑빌 302호 (전세)',
  '한남동 1-241',
  3,
  2,
  1,
  1400000000,
  NULL,
  137.46,
  '3층/4층',
  '3/2개',
  '남향',
  '20만원+',
  '1대',
  '즉시입주',
  '1992.10.02',
  '한남동 유엔빌리지 내에 위치한 고급빌라입니다.',
  '{"customer_name":"박윤정","customer_phone":"010-7467-0890","customer_notes":"소유주"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '힐탑빌 302호 (월세)',
  '한남동 1-241',
  3,
  3,
  1,
  9000000,
  100000000,
  137.46,
  '3층/4층',
  '3/2개',
  '남향',
  '20만원+',
  '1대',
  '즉시입주',
  '1992.10.02',
  '한남동 유엔빌리지 내에 위치한 고급빌라입니다.',
  '{"customer_name":"박윤정","customer_phone":"010-7467-0890","customer_notes":"소유주"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '강남 오피스텔',
  '강남구 역삼동',
  2,
  1,
  2,
  800000000,
  NULL,
  84.5,
  '15층/20층',
  '1/1개',
  '남동향',
  '15만원',
  '1대',
  '2025-09-01',
  '2018.03.15',
  '강남역 도보 5분, 신축 오피스텔',
  '{"customer_name":"김영희","customer_phone":"010-8888-9999","customer_notes":"투자목적"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '잠실 아파트',
  '송파구 잠실동',
  1,
  2,
  1,
  600000000,
  NULL,
  114.2,
  '12층/25층',
  '4/2개',
  '남향',
  '25만원',
  '2대',
  '2025-08-15',
  '2005.12.20',
  '잠실역 도보 10분, 한강조망 가능',
  '{"customer_name":"이철수","customer_phone":"010-1111-2222","customer_notes":"실거주"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '홍대 상가',
  '마포구 홍익로',
  5,
  3,
  1,
  5000000,
  50000000,
  66.1,
  '1층/5층',
  '2/1개',
  '동향',
  '10만원',
  '없음',
  '협의',
  '2010.05.30',
  '홍대 번화가, 유동인구 많음, 카페/음식점 적합',
  '{"customer_name":"박사장","customer_phone":"010-3333-4444","customer_notes":"임대사업자"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '서초 단독주택',
  '서초구 반포동',
  4,
  1,
  3,
  1800000000,
  NULL,
  198.3,
  '지상2층/지하1층',
  '5/3개',
  '남서향',
  '없음',
  '3대',
  '거래완료',
  '1995.08.10',
  '한강조망, 대형 정원, 리모델링 완료',
  '{"customer_name":"최부자","customer_phone":"010-5555-6666","customer_notes":"거래완료"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

INSERT INTO properties (
  property_name, location, property_type_id, transaction_type_id, property_status_id,
  price, lease_price, supply_area_sqm, floor_info, rooms_bathrooms, direction,
  maintenance_fee, parking, move_in_date, building_approval_date, special_notes,
  resident, manager_id, created_at, updated_at
) VALUES (
  '분양 신축 아파트',
  '구리시 교문동',
  1,
  4,
  1,
  450000000,
  NULL,
  84.9,
  '10층/15층',
  '3/2개',
  '남향',
  '미정',
  '1대',
  '2026-03-01',
  '미정',
  '2026년 3월 입주 예정, 분양권 전매 가능',
  '{"customer_name":"분양사무소","customer_phone":"010-7777-8888","customer_notes":"분양담당자"}'::jsonb,
  '00000000-0000-0000-0000-000000000000',
  NOW(),
  NOW()
);

-- 매물 데이터 삽입 완료
-- 총 8개의 샘플 매물이 생성됩니다.
