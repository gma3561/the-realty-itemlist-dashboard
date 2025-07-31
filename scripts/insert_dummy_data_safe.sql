-- 안전한 더미데이터 삽입 스크립트 (기존 데이터 유지)
-- Supabase 대시보드의 SQL Editor에서 실행하세요.

-- 1. 기존 룩업 테이블 ID 확인 및 활용
-- 먼저 기존 데이터의 ID를 확인합니다
DO $$
DECLARE
    apt_id UUID;
    villa_id UUID;
    sale_id UUID;
    lease_id UUID;
    rent_id UUID;
    available_id UUID;
BEGIN
    -- 기존 룩업 테이블 ID 가져오기
    SELECT id INTO apt_id FROM property_types WHERE name = '아파트' LIMIT 1;
    SELECT id INTO villa_id FROM property_types WHERE name = '빌라/연립' LIMIT 1;
    SELECT id INTO sale_id FROM transaction_types WHERE name = '매매' LIMIT 1;
    SELECT id INTO lease_id FROM transaction_types WHERE name = '전세' LIMIT 1;
    SELECT id INTO rent_id FROM transaction_types WHERE name = '월세' LIMIT 1;
    SELECT id INTO available_id FROM property_statuses WHERE name = '거래가능' LIMIT 1;
    
    -- ID가 없으면 생성
    IF apt_id IS NULL THEN
        INSERT INTO property_types (name) VALUES ('아파트') RETURNING id INTO apt_id;
    END IF;
    
    IF villa_id IS NULL THEN
        INSERT INTO property_types (name) VALUES ('빌라/연립') RETURNING id INTO villa_id;
    END IF;
    
    IF sale_id IS NULL THEN
        INSERT INTO transaction_types (name) VALUES ('매매') RETURNING id INTO sale_id;
    END IF;
    
    IF lease_id IS NULL THEN
        INSERT INTO transaction_types (name) VALUES ('전세') RETURNING id INTO lease_id;
    END IF;
    
    IF rent_id IS NULL THEN
        INSERT INTO transaction_types (name) VALUES ('월세') RETURNING id INTO rent_id;
    END IF;
    
    IF available_id IS NULL THEN
        INSERT INTO property_statuses (name) VALUES ('거래가능') RETURNING id INTO available_id;
    END IF;
    
    -- 더미 매물 데이터 삽입 (중복 방지)
    INSERT INTO properties (
        property_name, location, property_type, transaction_type, property_status,
        price, lease_price, monthly_rent, supply_area_pyeong, private_area_pyeong,
        supply_area_sqm, private_area_sqm, floor_info, room_bathroom, direction,
        maintenance_fee_text, parking, description, resident, manager_id,
        created_at, updated_at
    ) 
    SELECT * FROM (VALUES
        ('힐탑빌 302호', '한남동 1-241', villa_id, sale_id, available_id, 
        250000, NULL, NULL, 41, 37, 135.54, 122.31, 
        '3층/4층', '3/2개', '남향', '20만원+', '1대', 
        '한남동 유엔빌리지 내에 위치한 고급빌라. 수리가 매우 잘되어있는 최고의 컨디션.', 
        '{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
        'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

        ('힐탑빌 302호 (전세)', '한남동 1-241', villa_id, lease_id, available_id, 
        NULL, 140000, NULL, 41, 37, 135.54, 122.31, 
        '3층/4층', '3/2개', '남향', '20만원+', '1대', 
        '한남동 유엔빌리지 내에 위치한 고급빌라', 
        '{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
        'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

        ('힐탑빌 302호 (월세)', '한남동 1-241', villa_id, rent_id, available_id, 
        NULL, 10000, 900, 41, 37, 135.54, 122.31, 
        '3층/4층', '3/2개', '남향', '20만원+', '1대', 
        '한남동 유엔빌리지 내에 위치한 고급빌라', 
        '{"name":"박윤정","phone":"010-7467-0890","email":"","address":"","notes":""}',
        'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

        ('롯데캐슬이스트폴 4804호', '자양동 680-63번지', apt_id, lease_id, available_id, 
        NULL, 210000, NULL, 54.49, 41.9, 180.19, 138.51, 
        '48/48층', '4/2개', '남향', '확인불가', '1.32대', 
        '롯데캐슬이스트폴. 커뮤니티시설 최상, 강남 잠실 출퇴근 편리', 
        '{"name":"넥스트커넥트","phone":"010-3315-5752","email":"","address":"","notes":""}',
        'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

        ('롯데캐슬이스트폴 4804호 (월세)', '자양동 680-63번지', apt_id, rent_id, available_id, 
        NULL, 30000, 680, 54.49, 41.9, 180.19, 138.51, 
        '48/48층', '4/2개', '남향', '확인불가', '1.32대', 
        '롯데캐슬이스트폴. 커뮤니티시설 최상', 
        '{"name":"넥스트커넥트","phone":"010-3315-5752","email":"","address":"","notes":""}',
        'hardcoded-lucas@the-realty.co.kr', NOW(), NOW()),

        ('강남센트럴아이파크 2505호', '강남구 논현동', apt_id, sale_id, available_id, 
        450000, NULL, NULL, 84, 65, 277.69, 214.88, 
        '25/40층', '4/3개', '남동향', '35만원', '2대', 
        '강남역 도보 5분, 최고급 아파트', 
        '{"name":"김영희","phone":"010-1234-5678","email":"","address":"","notes":""}',
        'hardcoded-lucas@the-realty.co.kr', NOW(), NOW()),

        ('래미안원베일리 1203호', '서초구 반포동', apt_id, lease_id, available_id, 
        NULL, 180000, NULL, 59, 45, 195.04, 148.76, 
        '12/35층', '3/2개', '남향', '25만원', '1대', 
        '한강뷰, 반포한강공원 인접', 
        '{"name":"이민수","phone":"010-9876-5432","email":"","address":"","notes":""}',
        'hardcoded-hmlee@the-realty.co.kr', NOW(), NOW()),

        ('잠실트리지움 3407호', '송파구 잠실동', apt_id, sale_id, available_id, 
        380000, NULL, NULL, 76, 58, 251.24, 191.74, 
        '34/50층', '4/2개', '남서향', '28만원', '2대', 
        '롯데월드, 석촌호수 인근 프리미엄 아파트', 
        '{"name":"박철수","phone":"010-5555-7777","email":"","address":"","notes":""}',
        'hardcoded-jenny@the-realty.co.kr', NOW(), NOW()),

        ('상암월드컵파크 1508호', '마포구 상암동', apt_id, rent_id, available_id, 
        NULL, 20000, 150, 49, 38, 162.08, 125.62, 
        '15/30층', '3/2개', '동남향', '20만원', '1대', 
        '월드컵공원 인접, DMC 비즈니스 단지', 
        '{"name":"최영자","phone":"010-3333-9999","email":"","address":"","notes":""}',
        'hardcoded-lucas@the-realty.co.kr', NOW(), NOW()),

        ('이촌삼성래미안 2201호', '용산구 이촌동', apt_id, lease_id, available_id, 
        NULL, 160000, NULL, 52, 40, 171.90, 132.23, 
        '22/28층', '3/2개', '한강조망', '22만원', '1대', 
        '한강조망 최고층, 이촌한강공원 도보 2분', 
        '{"name":"홍길동","phone":"010-7777-1111","email":"","address":"","notes":""}',
        'hardcoded-hmlee@the-realty.co.kr', NOW(), NOW())
    ) AS new_properties(property_name, location, property_type, transaction_type, property_status,
        price, lease_price, monthly_rent, supply_area_pyeong, private_area_pyeong,
        supply_area_sqm, private_area_sqm, floor_info, room_bathroom, direction,
        maintenance_fee_text, parking, description, resident, manager_id, created_at, updated_at)
    WHERE NOT EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.property_name = new_properties.property_name 
        AND p.location = new_properties.location
    );
    
    RAISE NOTICE '더미 데이터 삽입 완료!';
END $$;

-- 삽입 결과 확인
SELECT 
    COUNT(*) as total_properties,
    pt.name as property_type,
    tt.name as transaction_type,
    COUNT(*) as count_by_type
FROM properties p
JOIN property_types pt ON p.property_type = pt.id
JOIN transaction_types tt ON p.transaction_type = tt.id
GROUP BY pt.name, tt.name
ORDER BY pt.name, tt.name;

-- 성공 메시지
SELECT '✅ 안전한 더미 매물 데이터 삽입 완료!' as message;