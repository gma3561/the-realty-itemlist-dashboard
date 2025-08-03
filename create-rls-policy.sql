-- RLS 정책 생성 스크립트
-- Supabase 대시보드 > SQL Editor에서 실행

-- 1. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON properties;
DROP POLICY IF EXISTS "Allow all operations" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON properties;

-- 2. 새로운 허용적인 정책 생성
CREATE POLICY "Allow all operations" ON properties
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. RLS 활성화 확인
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. 정책 확인 쿼리
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties';

-- 완료 메시지
SELECT 'RLS 정책 생성 완료!' as message;