-- 더 간단한 더미데이터 삽입 스크립트 (manager_id 없이)
-- Supabase 대시보드의 SQL Editor에서 실행하세요.

DO $$
DECLARE
    apt_id UUID;
    villa_id UUID;
    sale_id UUID;
    lease_id UUID;
    rent_id UUID;
    available_id UUID;
BEGIN
    -- property_types 확인/생성
    SELECT id INTO apt_id FROM property_types WHERE name = '아파트' LIMIT 1;
    IF apt_id IS NULL THEN
        INSERT INTO property_types (name) VALUES ('아파트') RETURNING id INTO apt_id;
    END IF;
    
    SELECT id INTO villa_id FROM property_types WHERE name = '빌라/연립' LIMIT 1;
    IF villa_id IS NULL THEN
        INSERT INTO property_types (name) VALUES ('빌라/연립') RETURNING id INTO villa_id;
    END IF;
    
    -- transaction_types 확인/생성
    SELECT id INTO sale_id FROM transaction_types WHERE name = '매매' LIMIT 1;
    IF sale_id IS NULL THEN
        INSERT INTO transaction_types (name) VALUES ('매매') RETURNING id INTO sale_id;
    END IF;
    
    SELECT id INTO lease_id FROM transaction_types WHERE name = '전세' LIMIT 1;
    IF lease_id IS NULL THEN
        INSERT INTO transaction_types (name) VALUES ('전세') RETURNING id INTO lease_id;
    END IF;
    
    SELECT id INTO rent_id FROM transaction_types WHERE name = '월세' LIMIT 1;
    IF rent_id IS NULL THEN
        INSERT INTO transaction_types (name) VALUES ('월세') RETURNING id INTO rent_id;
    END IF;
    
    -- property_statuses 확인/생성
    SELECT id INTO available_id FROM property_statuses WHERE name = '거래가능' LIMIT 1;
    IF available_id IS NULL THEN
        INSERT INTO property_statuses (name) VALUES ('거래가능') RETURNING id INTO available_id;
    END IF;
    
    -- 더미 매물 데이터 삽입 (manager_id 없이)
    INSERT INTO properties (
        property_name, location, property_type_id, transaction_type_id, property_status_id,
        price, lease_price, supply_area_pyeong, private_area_pyeong,
        supply_area_sqm, private_area_sqm, floor_info, rooms_bathrooms, direction,
        maintenance_fee, parking, special_notes, resident,
        created_at, updated_at
    ) VALUES
        ('힐탑빌 302호', '한남동 1-241', villa_id, sale_id, available_id, 
        250000, NULL, 41, 37, 135.54, 122.31, 
        '3층/4층', '3/2개', '남향', '20만원+', '1대', 
        '한남동 유엔빌리지 내에 위치한 고급빌라. 수리가 매우 잘되어있는 최고의 컨디션.', 
        '{"name":"박윤정","phone":"010-7467-0890"}',
        NOW(), NOW()),

        ('힐탑빌 302호 (전세)', '한남동 1-241', villa_id, lease_id, available_id, 
        NULL, 140000, 41, 37, 135.54, 122.31, 
        '3층/4층', '3/2개', '남향', '20만원+', '1대', 
        '한남동 유엔빌리지 내에 위치한 고급빌라', 
        '{"name":"박윤정","phone":"010-7467-0890"}',
        NOW(), NOW()),

        ('롯데캐슬이스트폴 4804호', '자양동 680-63번지', apt_id, lease_id, available_id, 
        NULL, 210000, 54.49, 41.9, 180.19, 138.51, 
        '48/48층', '4/2개', '남향', '확인불가', '1.32대', 
        '롯데캐슬이스트폴. 커뮤니티시설 최상, 강남 잠실 출퇴근 편리', 
        '{"name":"넥스트커넥트","phone":"010-3315-5752"}',
        NOW(), NOW()),

        ('강남센트럴아이파크 2505호', '강남구 논현동', apt_id, sale_id, available_id, 
        450000, NULL, 84, 65, 277.69, 214.88, 
        '25/40층', '4/3개', '남동향', '35만원', '2대', 
        '강남역 도보 5분, 최고급 아파트', 
        '{"name":"김영희","phone":"010-1234-5678"}',
        NOW(), NOW()),

        ('래미안원베일리 1203호', '서초구 반포동', apt_id, lease_id, available_id, 
        NULL, 180000, 59, 45, 195.04, 148.76, 
        '12/35층', '3/2개', '남향', '25만원', '1대', 
        '한강뷰, 반포한강공원 인접', 
        '{"name":"이민수","phone":"010-9876-5432"}',
        NOW(), NOW()),

        ('잠실트리지움 3407호', '송파구 잠실동', apt_id, sale_id, available_id, 
        380000, NULL, 76, 58, 251.24, 191.74, 
        '34/50층', '4/2개', '남서향', '28만원', '2대', 
        '롯데월드, 석촌호수 인근 프리미엄 아파트', 
        '{"name":"박철수","phone":"010-5555-7777"}',
        NOW(), NOW()),

        ('상암월드컵파크 1508호', '마포구 상암동', apt_id, rent_id, available_id, 
        20000, 20000, 49, 38, 162.08, 125.62, 
        '15/30층', '3/2개', '동남향', '20만원', '1대', 
        '월드컵공원 인접, DMC 비즈니스 단지', 
        '{"name":"최영자","phone":"010-3333-9999"}',
        NOW(), NOW()),

        ('이촌삼성래미안 2201호', '용산구 이촌동', apt_id, lease_id, available_id, 
        NULL, 160000, 52, 40, 171.90, 132.23, 
        '22/28층', '3/2개', '한강조망', '22만원', '1대', 
        '한강조망 최고층, 이촌한강공원 도보 2분', 
        '{"name":"홍길동","phone":"010-7777-1111"}',
        NOW(), NOW());
    
    RAISE NOTICE '8개 더미 매물 데이터 삽입 완료!';
END $$;

-- 삽입 결과 확인
SELECT 
    p.property_name,
    p.location,
    pt.name as property_type,
    tt.name as transaction_type,
    ps.name as status,
    p.price,
    p.lease_price
FROM properties p
LEFT JOIN property_types pt ON p.property_type_id = pt.id
LEFT JOIN transaction_types tt ON p.transaction_type_id = tt.id
LEFT JOIN property_statuses ps ON p.property_status_id = ps.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 총 매물 수 확인
SELECT COUNT(*) as total_properties FROM properties;