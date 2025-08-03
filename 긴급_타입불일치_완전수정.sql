-- 🚨 긴급: 타입 불일치 완전 해결 SQL
-- 실행일: 2025-08-03
-- 목적: properties 테이블의 외래키 제약조건 확인 및 수정

-- ================================================
-- 1. 현재 상태 확인
-- ================================================

-- properties 테이블의 현재 컬럼 타입 확인
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('property_type', 'transaction_type', 'property_status')
ORDER BY ordinal_position;

-- 외래키 제약조건 확인
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'properties' 
AND tc.constraint_type = 'FOREIGN KEY';

-- ================================================
-- 2. 외래키가 있다면 제거하고 재생성 (CASCADE 없이)
-- ================================================

-- property_type 외래키 처리
DO $$ 
BEGIN
    -- 기존 외래키 제거
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'properties_property_type_fkey' 
        AND table_name = 'properties'
    ) THEN
        ALTER TABLE properties DROP CONSTRAINT properties_property_type_fkey;
    END IF;
    
    -- TEXT 타입이라면 외래키 추가
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'property_type' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE properties 
        ADD CONSTRAINT properties_property_type_fkey 
        FOREIGN KEY (property_type) 
        REFERENCES property_types(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- transaction_type 외래키 처리
DO $$ 
BEGIN
    -- 기존 외래키 제거
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'properties_transaction_type_fkey' 
        AND table_name = 'properties'
    ) THEN
        ALTER TABLE properties DROP CONSTRAINT properties_transaction_type_fkey;
    END IF;
    
    -- TEXT 타입이라면 외래키 추가
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'transaction_type' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE properties 
        ADD CONSTRAINT properties_transaction_type_fkey 
        FOREIGN KEY (transaction_type) 
        REFERENCES transaction_types(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- property_status 외래키 처리
DO $$ 
BEGIN
    -- 기존 외래키 제거
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'properties_property_status_fkey' 
        AND table_name = 'properties'
    ) THEN
        ALTER TABLE properties DROP CONSTRAINT properties_property_status_fkey;
    END IF;
    
    -- TEXT 타입이라면 외래키 추가
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'property_status' 
        AND data_type = 'text'
    ) THEN
        ALTER TABLE properties 
        ADD CONSTRAINT properties_property_status_fkey 
        FOREIGN KEY (property_status) 
        REFERENCES property_statuses(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ================================================
-- 3. 만약 아직도 UUID 타입이라면 TEXT로 변경
-- ================================================

DO $$ 
BEGIN
    -- property_type_id → property_type으로 변경이 필요한 경우
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'property_type_id'
    ) THEN
        -- 컬럼명 변경
        ALTER TABLE properties RENAME COLUMN property_type_id TO property_type;
        
        -- 타입 변경
        ALTER TABLE properties 
        ALTER COLUMN property_type TYPE TEXT 
        USING property_type::TEXT;
    END IF;
    
    -- transaction_type_id → transaction_type으로 변경이 필요한 경우
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'transaction_type_id'
    ) THEN
        -- 컬럼명 변경
        ALTER TABLE properties RENAME COLUMN transaction_type_id TO transaction_type;
        
        -- 타입 변경
        ALTER TABLE properties 
        ALTER COLUMN transaction_type TYPE TEXT 
        USING transaction_type::TEXT;
    END IF;
    
    -- property_status_id → property_status로 변경이 필요한 경우
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'property_status_id'
    ) THEN
        -- 컬럼명 변경
        ALTER TABLE properties RENAME COLUMN property_status_id TO property_status;
        
        -- 타입 변경
        ALTER TABLE properties 
        ALTER COLUMN property_status TYPE TEXT 
        USING property_status::TEXT;
    END IF;
END $$;

-- ================================================
-- 4. 최종 검증
-- ================================================

-- 컬럼 타입 최종 확인
SELECT 
    '✅ 최종 컬럼 타입' as info,
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('property_type', 'transaction_type', 'property_status');

-- 외래키 최종 확인
SELECT 
    '✅ 최종 외래키 (CASCADE 없어야 함)' as info,
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'properties' 
AND tc.constraint_type = 'FOREIGN KEY';

-- 샘플 데이터로 작동 테스트
DO $$ 
BEGIN
    -- 테스트 데이터 삽입 시도
    INSERT INTO properties (
        id, 
        property_name, 
        property_type, 
        transaction_type, 
        property_status,
        created_at
    ) VALUES (
        gen_random_uuid(),
        'TEST_PROPERTY_DELETE_ME',
        'apt',
        'sale', 
        'available',
        NOW()
    );
    
    -- 즉시 삭제
    DELETE FROM properties WHERE property_name = 'TEST_PROPERTY_DELETE_ME';
    
    RAISE NOTICE '✅ 타입 테스트 성공! STRING 타입으로 정상 작동';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ 타입 테스트 실패: %', SQLERRM;
END $$;