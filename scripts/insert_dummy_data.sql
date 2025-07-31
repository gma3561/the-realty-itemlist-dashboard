-- 팀 매물장 더미데이터 삽입 스크립트
-- Supabase 대시보드의 SQL Editor에서 실행하세요.

-- 1. 룩업 테이블 데이터 삽입 (UUID 기반)
-- property_types 테이블
INSERT INTO property_types (id, name) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '아파트'),
  ('550e8400-e29b-41d4-a716-446655440002', '오피스텔'),
  ('550e8400-e29b-41d4-a716-446655440003', '빌라/연립'),
  ('550e8400-e29b-41d4-a716-446655440004', '단독주택'),
  ('550e8400-e29b-41d4-a716-446655440005', '상가')
ON CONFLICT (id) DO NOTHING;

-- transaction_types 테이블
INSERT INTO transaction_types (id, name) VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', '매매'),
  ('650e8400-e29b-41d4-a716-446655440002', '전세'),
  ('650e8400-e29b-41d4-a716-446655440003', '월세')
ON CONFLICT (id) DO NOTHING;

-- property_statuses 테이블
INSERT INTO property_statuses (id, name) VALUES 
  ('750e8400-e29b-41d4-a716-446655440001', '거래가능'),
  ('750e8400-e29b-41d4-a716-446655440002', '거래보류'),
  ('750e8400-e29b-41d4-a716-446655440003', '거래완료')
ON CONFLICT (id) DO NOTHING;

-- 2. CSV 기반 더미 매물 데이터 삽입
INSERT INTO properties (
  property_name, location, property_type, transaction_type, property_status,
  price, lease_price, monthly_rent, supply_area_pyeong, private_area_pyeong,
  supply_area_sqm, private_area_sqm, floor_info, room_bathroom, direction,
  maintenance_fee_text, parking, description, resident, manager_id,
  created_at, updated_at
) VALUES 

-- 1. 한남동 힐탑빌 매매
('힐탑빌 302호', '한남동 1-241', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 
250000, NULL, NULL, 41, 37, 135.54, 122.31, 
'3층/4층', '3/2개', '남향', '20만원+', '1대', 
'한남동 유엔빌리지 내에 위치한 고급빌라. 수리가 매우 잘되어있는 최고의 컨디션.', 
'{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

-- 2. 한남동 힐탑빌 전세
('힐탑빌 302호 (전세)', '한남동 1-241', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 
NULL, 140000, NULL, 41, 37, 135.54, 122.31, 
'3층/4층', '3/2개', '남향', '20만원+', '1대', 
'한남동 유엔빌리지 내에 위치한 고급빌라', 
'{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

-- 3. 한남동 힐탑빌 월세
('힐탑빌 302호 (월세)', '한남동 1-241', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 
NULL, 10000, 900, 41, 37, 135.54, 122.31, 
'3층/4층', '3/2개', '남향', '20만원+', '1대', 
'한남동 유엔빌리지 내에 위치한 고급빌라', 
'{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

-- 4. 롯데캐슬이스트폴 전세
('롯데캐슬이스트폴 4804호', '자양동 680-63번지', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 
NULL, 210000, NULL, 54.49, 41.9, 180.19, 138.51, 
'48/48층', '4/2개', '남향', '확인불가', '1.32대', 
'롯데캐슬이스트폴. 커뮤니티시설 최상, 강남 잠실 출퇴근 편리', 
'{"name":"넥스트커넥트","phone":"010-3315-5752","email":"","address":"","notes":""}',
'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

-- 5. 롯데캐슬이스트폴 월세
('롯데캐슬이스트폴 4804호 (월세)', '자양동 680-63번지', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 
NULL, 30000, 680, 54.49, 41.9, 180.19, 138.51, 
'48/48층', '4/2개', '남향', '확인불가', '1.32대', 
'롯데캐슬이스트폴. 커뮤니티시설 최상', 
'{"name":"넥스트커넥트","phone":"010-3315-5752","email":"","address":"","notes":""}',
'hardcoded-lucas@the-realty.co.kr', NOW(), NOW()),

-- 6. 강남센트럴아이파크 매매
('강남센트럴아이파크 2505호', '강남구 논현동', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 
450000, NULL, NULL, 84, 65, 277.69, 214.88, 
'25/40층', '4/3개', '남동향', '35만원', '2대', 
'강남역 도보 5분, 최고급 아파트', 
'{"name":"김영희","phone":"010-1234-5678","email":"","address":"","notes":""}',
'hardcoded-lucas@the-realty.co.kr', NOW(), NOW()),

-- 7. 래미안원베일리 전세
('래미안원베일리 1203호', '서초구 반포동', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 
NULL, 180000, NULL, 59, 45, 195.04, 148.76, 
'12/35층', '3/2개', '남향', '25만원', '1대', 
'한강뷰, 반포한강공원 인접', 
'{"name":"이민수","phone":"010-9876-5432","email":"","address":"","notes":""}',
'hardcoded-hmlee@the-realty.co.kr', NOW(), NOW()),

-- 8. 잠실트리지움 매매
('잠실트리지움 3407호', '송파구 잠실동', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 
380000, NULL, NULL, 76, 58, 251.24, 191.74, 
'34/50층', '4/2개', '남서향', '28만원', '2대', 
'롯데월드, 석촌호수 인근 프리미엄 아파트', 
'{"name":"박철수","phone":"010-5555-7777","email":"","address":"","notes":""}',
'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

-- 9. 상암월드컵파크 월세
('상암월드컵파크 1508호', '마포구 상암동', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 
NULL, 20000, 150, 49, 38, 162.08, 125.62, 
'15/30층', '3/2개', '동남향', '20만원', '1대', 
'월드컵공원 인접, DMC 비즈니스 단지', 
'{"name":"최영자","phone":"010-3333-9999","email":"","address":"","notes":""}',
'hardcoded-lucas@the-realty.co.kr', NOW(), NOW()),

-- 10. 이촌삼성래미안 전세
('이촌삼성래미안 2201호', '용산구 이촌동', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 
NULL, 160000, NULL, 52, 40, 171.90, 132.23, 
'22/28층', '3/2개', '한강조망', '22만원', '1대', 
'한강조망 최고층, 이촌한강공원 도보 2분', 
'{"name":"홍길동","phone":"010-7777-1111","email":"","address":"","notes":""}',
'hardcoded-hmlee@the-realty.co.kr', NOW(), NOW());

-- 3. 삽입 결과 확인
SELECT 
  COUNT(*) as total_properties,
  property_type,
  transaction_type,
  COUNT(*) as count_by_type
FROM properties 
GROUP BY property_type, transaction_type
ORDER BY property_type, transaction_type;

-- 성공 메시지
SELECT '✅ 더미 매물 데이터 10개 삽입 완료!' as message;