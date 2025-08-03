-- 현재 테이블 상태 확인 스크립트
-- Supabase 대시보드에서 실행해서 기존 데이터 확인

-- 1. 기존 property_types 데이터 확인
SELECT 'property_types 테이블:' as table_info;
SELECT id, name, created_at FROM property_types ORDER BY created_at;

-- 2. 기존 transaction_types 데이터 확인  
SELECT 'transaction_types 테이블:' as table_info;
SELECT id, name, created_at FROM transaction_types ORDER BY created_at;

-- 3. 기존 property_statuses 데이터 확인
SELECT 'property_statuses 테이블:' as table_info;
SELECT id, name, created_at FROM property_statuses ORDER BY created_at;

-- 4. 기존 properties 데이터 확인
SELECT 'properties 테이블:' as table_info;
SELECT COUNT(*) as total_count FROM properties;
SELECT property_name, location, created_at FROM properties ORDER BY created_at LIMIT 5;

-- 5. 테이블 구조 확인
SELECT 'properties 테이블 구조:' as table_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;