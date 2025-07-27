-- Supabase 데이터베이스에서 실행할 SQL 명령어들

-- 1. RLS 비활성화 (개발/테스트용)
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_statuses DISABLE ROW LEVEL SECURITY;

-- 2. 익명 사용자 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO anon;
GRANT SELECT ON property_types TO anon;
GRANT SELECT ON transaction_types TO anon;
GRANT SELECT ON property_statuses TO anon;

-- 3. 인증된 사용자 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO authenticated;
GRANT SELECT ON property_types TO authenticated;
GRANT SELECT ON transaction_types TO authenticated;
GRANT SELECT ON property_statuses TO authenticated;

-- 4. 테이블 존재 확인
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('properties', 'property_types', 'transaction_types', 'property_statuses');

-- 5. 샘플 데이터 확인
SELECT COUNT(*) as total_properties FROM properties;
SELECT COUNT(*) as total_types FROM property_types;
SELECT COUNT(*) as total_statuses FROM property_statuses;
SELECT COUNT(*) as total_transactions FROM transaction_types;