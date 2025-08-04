-- 샘플 매물 데이터 생성 (수파베이스에서 직접 실행)

-- 샘플 매물 상태와 거래 유형 ID 조회
DO $$
DECLARE
    available_status_id UUID;
    reserved_status_id UUID;
    completed_status_id UUID;
    
    sale_type_id UUID;
    lease_type_id UUID;
    rent_type_id UUID;
    
    apartment_type_id UUID;
    officetel_type_id UUID;
    villa_type_id UUID;
    house_type_id UUID;
    commercial_type_id UUID;
    
    admin_user_id UUID;
    employee1_id UUID;
    employee2_id UUID;
    employee3_id UUID;
BEGIN
    -- 상태 ID 조회
    SELECT id INTO available_status_id FROM public.property_statuses WHERE name = '거래가능' LIMIT 1;
    SELECT id INTO reserved_status_id FROM public.property_statuses WHERE name = '거래보류' LIMIT 1;
    SELECT id INTO completed_status_id FROM public.property_statuses WHERE name = '거래완료' LIMIT 1;
    
    -- 거래 유형 ID 조회
    SELECT id INTO sale_type_id FROM public.transaction_types WHERE name = '매매' LIMIT 1;
    SELECT id INTO lease_type_id FROM public.transaction_types WHERE name = '전세' LIMIT 1;
    SELECT id INTO rent_type_id FROM public.transaction_types WHERE name = '월세' LIMIT 1;
    
    -- 매물 유형 ID 조회
    SELECT id INTO apartment_type_id FROM public.property_types WHERE name = '아파트' LIMIT 1;
    SELECT id INTO officetel_type_id FROM public.property_types WHERE name = '오피스텔' LIMIT 1;
    SELECT id INTO villa_type_id FROM public.property_types WHERE name = '빌라' LIMIT 1;
    SELECT id INTO house_type_id FROM public.property_types WHERE name = '단독주택' LIMIT 1;
    SELECT id INTO commercial_type_id FROM public.property_types WHERE name = '상가' LIMIT 1;
    
    -- 사용자 ID 조회
    SELECT id INTO admin_user_id FROM public.users WHERE email = 'admin@the-realty.co.kr' LIMIT 1;
    SELECT id INTO employee1_id FROM public.users WHERE email = 'employee1@the-realty.co.kr' LIMIT 1;
    SELECT id INTO employee2_id FROM public.users WHERE email = 'employee2@the-realty.co.kr' LIMIT 1;
    SELECT id INTO employee3_id FROM public.users WHERE email = 'employee3@the-realty.co.kr' LIMIT 1;
    
    -- 샘플 매물 데이터 추가
    INSERT INTO public.properties (
        manager_id, 
        property_status_id, 
        location, 
        property_name, 
        building, 
        unit, 
        property_type_id, 
        transaction_type_id, 
        price, 
        lease_price,
        supply_area_sqm, 
        private_area_sqm, 
        supply_area_pyeong, 
        private_area_pyeong, 
        floor_info, 
        rooms_bathrooms, 
        direction, 
        maintenance_fee, 
        parking, 
        move_in_date, 
        special_notes,
        user_id,
        funnel_stage_id,
        is_visible_to_all,
        created_at
    ) VALUES 
    -- 아파트 매물 (매매)
    (
        admin_user_id, 
        available_status_id, 
        '서울시 강남구 역삼동', 
        '래미안 역삼 1234동 5678호', 
        '래미안 역삼', 
        '1234동 5678호', 
        apartment_type_id, 
        sale_type_id, 
        1500000000, 
        NULL,
        84.56, 
        69.42, 
        25.58, 
        21.00, 
        '15층', 
        '3R/2B', 
        '남향', 
        '25만원', 
        '2대', 
        '즉시입주가능', 
        '역세권, 신축',
        admin_user_id,
        'inquiry',
        true,
        CURRENT_TIMESTAMP
    ),
    
    -- 오피스텔 매물 (전세)
    (
        employee1_id, 
        available_status_id, 
        '서울시 서초구 반포동', 
        '반포자이 32평 오피스텔', 
        '반포자이', 
        'B동 905호', 
        officetel_type_id, 
        lease_type_id, 
        NULL, 
        450000000,
        105.8, 
        80.12, 
        32.00, 
        24.24, 
        '9층', 
        '2R/1B', 
        '동향', 
        '15만원', 
        '1대', 
        '협의가능', 
        '한강뷰, 깔끔한 인테리어',
        employee1_id,
        'consultation',
        true,
        CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    
    -- 빌라 매물 (월세)
    (
        employee2_id, 
        reserved_status_id, 
        '서울시 마포구 합정동', 
        '합정동 신축 빌라', 
        '합정 스카이빌', 
        '202호', 
        villa_type_id, 
        rent_type_id, 
        1000000, 
        20000000,
        59.5, 
        45.12, 
        18.00, 
        13.65, 
        '2층', 
        '2R/1B', 
        '남서향', 
        '8만원', 
        '1대', 
        '즉시입주가능', 
        '신축, 조용한 주택가',
        employee2_id,
        'visit',
        true,
        CURRENT_TIMESTAMP - INTERVAL '14 days'
    ),
    
    -- 단독주택 매물 (매매)
    (
        employee3_id, 
        completed_status_id, 
        '경기도 성남시 분당구', 
        '분당 단독주택 매매', 
        NULL, 
        NULL, 
        house_type_id, 
        sale_type_id, 
        2300000000, 
        NULL,
        198.35, 
        165.29, 
        60.00, 
        50.00, 
        '2층', 
        '5R/3B', 
        '남향', 
        '없음', 
        '3대', 
        '협의가능', 
        '넓은 정원, 리모델링 완료',
        employee3_id,
        'contract',
        false,
        CURRENT_TIMESTAMP - INTERVAL '30 days'
    ),
    
    -- 상가 매물 (임대)
    (
        admin_user_id, 
        available_status_id, 
        '서울시 종로구 효자동', 
        '효자동 1층 상가', 
        '효자빌딩', 
        '1층 102호', 
        commercial_type_id, 
        rent_type_id, 
        3000000, 
        50000000,
        66.12, 
        66.12, 
        20.00, 
        20.00, 
        '1층', 
        '1R/1B', 
        '동향', 
        '30만원', 
        '없음', 
        '즉시입주가능', 
        '유동인구 많음, 인테리어 깔끔',
        admin_user_id,
        'negotiation',
        true,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    );
    
    -- 결과 출력
    RAISE NOTICE '샘플 매물 데이터가 추가되었습니다.';
END $$;