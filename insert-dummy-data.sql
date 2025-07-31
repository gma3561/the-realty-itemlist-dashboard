-- =====================================================
-- 더미 데이터 삽입 스크립트
-- =====================================================

-- 1. 테스트용 사용자 프로필 생성 (실제 auth.users가 있다고 가정)
-- 주의: 실제로는 Supabase Auth를 통해 사용자를 먼저 생성해야 합니다

-- 2. 더미 매물 데이터 삽입
INSERT INTO properties (
    property_name,
    location,
    building_name,
    room_number,
    property_type,
    transaction_type,
    property_status,
    area_pyeong,
    area_m2,
    floor_current,
    floor_total,
    room_count,
    bath_count,
    price,
    lease_price,
    monthly_fee,
    description,
    special_notes,
    available_date,
    exclusive_type,
    manager_id,
    manager_name,
    owner_name,
    owner_phone,
    customer_name,
    customer_phone,
    customer_request,
    view_count
) VALUES
-- 아파트 매물
('강남 래미안 34평', '서울특별시 강남구 삼성동', '래미안 삼성', '101동 1502호', 'apt', 'sale', 'available',
 34, 112.4, 15, 25, 3, 2, 2100000000, NULL, 500000,
 '역세권 도보 5분, 남향, 전세대 리모델링 완료', '즉시 입주 가능, 주차 2대 가능',
 '2025-08-01', '전속', 'staff1@realty.com', '김직원', '박소유', '010-1111-2222',
 '이고객', '010-3333-4444', '학군이 좋은 곳 희망', 125),

('판교 아이파크 25평', '경기도 성남시 분당구 판교동', '판교 아이파크', '205동 801호', 'apt', 'lease', 'available',
 25, 82.6, 8, 15, 2, 1, NULL, 700000000, 300000,
 '판교역 도보 10분, 2022년 신축', '풀옵션, 즉시 입주 가능',
 '2025-09-01', '일반', 'staff2@realty.com', '이직원', '최소유', '010-5555-6666',
 NULL, NULL, NULL, 89),

('잠실 엘스 45평', '서울특별시 송파구 잠실동', '잠실엘스', '35동 2103호', 'apt', 'sale', 'contract',
 45, 148.8, 21, 30, 4, 2, 3200000000, NULL, 650000,
 '한강뷰, 로얄층, 학군 최고', '8월 말 입주 가능',
 '2025-08-30', '전속', 'manager@realty.com', '박매니저', '정소유', '010-7777-8888',
 '김구매', '010-9999-0000', '한강뷰 필수', 234),

-- 오피스텔 매물
('역삼 센트럴푸르지오시티', '서울특별시 강남구 역삼동', '센트럴푸르지오시티', 'A동 1205호', 'officetel', 'monthly', 'available',
 10, 33.1, 12, 40, 1, 1, NULL, NULL, 1200000,
 '역삼역 직결, 풀옵션', '보증금 20,000,000원',
 '2025-07-15', '일반', 'staff1@realty.com', '김직원', '한소유', '010-1234-5678',
 NULL, NULL, NULL, 67),

('강남 파인타워', '서울특별시 강남구 논현동', '파인타워', '1810호', 'officetel', 'sale', 'available',
 12, 39.7, 18, 25, 1, 1, 650000000, NULL, 250000,
 '강남역 도보 3분, 투자 적합', '임대 수익률 연 4.5%',
 '2025-08-10', '전속', 'staff2@realty.com', '이직원', '윤소유', '010-2468-1357',
 '박투자', '010-1357-2468', '투자 목적', 145),

-- 빌라 매물
('성수 신축빌라', '서울특별시 성동구 성수동', '성수 프리미엄빌라', '301호', 'villa', 'lease', 'available',
 20, 66.1, 3, 4, 2, 1, NULL, 400000000, 200000,
 '2024년 신축, 주차 가능', '반려동물 가능',
 '2025-07-20', '일반', 'manager@realty.com', '박매니저', '서소유', '010-3690-2580',
 NULL, NULL, NULL, 34),

-- 상가 매물
('강남대로 1층 상가', '서울특별시 강남구 역삼동', '강남빌딩', '1층', 'store', 'sale', 'available',
 30, 99.2, 1, 10, 0, 1, 4500000000, NULL, 0,
 '대로변 코너, 높은 유동인구', '권리금 별도 협의',
 '2025-09-01', '전속', 'admin@realty.com', '관리자', '강소유', '010-1010-2020',
 '상가투자', '010-3030-4040', '프랜차이즈 입점 희망', 567),

('홍대 카페거리 상가', '서울특별시 마포구 서교동', '홍대프라자', '2층', 'store', 'monthly', 'available',
 25, 82.6, 2, 5, 0, 1, NULL, NULL, 3500000,
 '홍대입구역 도보 5분', '보증금 50,000,000원, 인테리어 상태 양호',
 '2025-08-01', '일반', 'staff1@realty.com', '김직원', '류소유', '010-5050-6060',
 NULL, NULL, NULL, 123),

-- 사무실 매물
('테헤란로 사무실', '서울특별시 강남구 역삼동', '테헤란빌딩', '805호', 'office', 'lease', 'available',
 40, 132.2, 8, 15, 0, 2, NULL, 800000000, 400000,
 '역삼역 도보 3분, 즉시 입주 가능', '10개 이상 워크스테이션 설치 가능',
 '2025-07-25', '일반', 'staff2@realty.com', '이직원', '민소유', '010-7070-8080',
 'IT기업', '010-9090-1010', 'IT 스타트업', 89),

-- 단독주택 매물
('평창동 단독주택', '서울특별시 종로구 평창동', NULL, NULL, 'house', 'sale', 'available',
 80, 264.5, 1, 2, 5, 3, 5500000000, NULL, 0,
 '대지 150평, 정원 있음', '전면 리모델링 완료',
 '2025-10-01', '전속', 'manager@realty.com', '박매니저', '독소유', '010-2020-3030',
 '주택구매', '010-4040-5050', '조용한 동네 선호', 234),

-- 토지 매물
('용인 대지', '경기도 용인시 수지구', NULL, NULL, 'land', 'sale', 'available',
 200, 661.2, 0, 0, 0, 0, 2000000000, NULL, 0,
 '개발 가능 지역, 도로 인접', '건폐율 60%, 용적률 200%',
 '2025-08-15', '일반', 'admin@realty.com', '관리자', '토소유', '010-6060-7070',
 NULL, NULL, NULL, 45),

-- 추가 아파트 매물 (다양한 상태)
('대치 은마아파트', '서울특별시 강남구 대치동', '은마아파트', '5동 705호', 'apt', 'sale', 'completed',
 32, 105.8, 7, 15, 3, 2, 1850000000, NULL, 420000,
 '대치초 도보 5분, 리모델링 완료', '거래 완료',
 '2025-06-01', '전속', 'staff1@realty.com', '김직원', '은소유', '010-8080-9090',
 '완료고객', '010-1212-3434', '학군 중심', 456),

('송파 헬리오시티', '서울특별시 송파구 가락동', '헬리오시티', '103동 3201호', 'apt', 'lease', 'hold',
 35, 115.7, 32, 45, 3, 2, NULL, 900000000, 550000,
 '초고층 타워, 송파 신도시', '소유자 사정으로 보류',
 '2025-09-15', '일반', 'staff2@realty.com', '이직원', '헬소유', '010-3434-5656',
 NULL, NULL, NULL, 78),

-- 월세 전환 매물
('마포 래미안', '서울특별시 마포구 아현동', '마포래미안', '105동 1102호', 'apt', 'monthly', 'available',
 28, 92.6, 11, 20, 3, 1, NULL, NULL, 1500000,
 '공덕역 도보 10분', '보증금 30,000,000원, 주차 1대',
 '2025-08-05', '일반', 'manager@realty.com', '박매니저', '마소유', '010-5656-7878',
 '월세희망', '010-7878-9090', '교통 편리한 곳', 167);

-- 매물 이미지 추가 (일부 매물에만)
INSERT INTO property_images (property_id, image_url, is_primary, display_order)
SELECT 
    p.id,
    'https://via.placeholder.com/800x600/4F46E5/ffffff?text=' || REPLACE(p.property_name, ' ', '+'),
    true,
    1
FROM properties p
WHERE p.property_name IN ('강남 래미안 34평', '판교 아이파크 25평', '잠실 엘스 45평', '강남대로 1층 상가')
LIMIT 4;

-- 통계 확인
SELECT 
    '✅ 데이터 삽입 완료!' as message,
    COUNT(*) as total_properties,
    COUNT(CASE WHEN property_status = 'available' THEN 1 END) as available,
    COUNT(CASE WHEN property_status = 'contract' THEN 1 END) as contract,
    COUNT(CASE WHEN property_status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN property_status = 'hold' THEN 1 END) as hold
FROM properties;