-- RLS 정책 확인 쿼리
-- Supabase SQL Editor에서 실행하세요

-- 1. properties 테이블의 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'properties';

-- 2. properties 테이블의 현재 정책 확인
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties';

-- 3. RLS가 비활성화되어 있다면 활성화
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. 기존 정책 삭제 (필요시)
-- DROP POLICY IF EXISTS "Enable read for authenticated users" ON properties;
-- DROP POLICY IF EXISTS "Enable insert for authenticated users" ON properties;
-- DROP POLICY IF EXISTS "Enable update for authenticated users" ON properties;
-- DROP POLICY IF EXISTS "Enable delete for authenticated users" ON properties;

-- 5. 인증된 사용자만 읽기 가능하도록 정책 생성
CREATE POLICY "Enable read for authenticated users only" 
ON properties FOR SELECT 
TO authenticated
USING (true);

-- 6. 인증된 사용자만 삽입 가능
CREATE POLICY "Enable insert for authenticated users only" 
ON properties FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 7. 본인 매물만 수정 가능 (또는 관리자)
CREATE POLICY "Enable update for own properties only" 
ON properties FOR UPDATE 
TO authenticated
USING (
    auth.email() = manager_id 
    OR auth.email() IN (
        'jenny@the-realty.co.kr',
        'lucas@the-realty.co.kr',
        'hmlee@the-realty.co.kr'
    )
);

-- 8. 본인 매물만 삭제 가능 (또는 관리자)
CREATE POLICY "Enable delete for own properties only" 
ON properties FOR DELETE 
TO authenticated
USING (
    auth.email() = manager_id 
    OR auth.email() IN (
        'jenny@the-realty.co.kr',
        'lucas@the-realty.co.kr',
        'hmlee@the-realty.co.kr'
    )
);

-- 9. 다른 테이블들도 동일하게 설정
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 룩업 테이블은 인증된 사용자 읽기만 허용
CREATE POLICY "Enable read for authenticated users" ON property_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for authenticated users" ON transaction_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for authenticated users" ON property_statuses FOR SELECT TO authenticated USING (true);

-- users 테이블은 본인 정보만 조회 가능
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);