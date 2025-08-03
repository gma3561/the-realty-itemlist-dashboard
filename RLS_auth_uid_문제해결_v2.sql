-- 🚨 RLS auth.uid() 문제 해결 v2
-- 실행일: 2025-08-03
-- 목적: Google OAuth UUID와 내부 시스템 UUID 매핑

-- ================================================
-- 1. auth_user_mappings 테이블 생성 (UUID 타입으로 수정)
-- ================================================

CREATE TABLE IF NOT EXISTS auth_user_mappings (
    google_uid UUID PRIMARY KEY,
    internal_user_id UUID NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_internal_user FOREIGN KEY (internal_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_auth_mapping_internal ON auth_user_mappings(internal_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_mapping_email ON auth_user_mappings(email);

-- ================================================
-- 2. manager_id 처리 방식 결정
-- ================================================

-- 옵션 1: manager_id를 UUID로 유지하고 users 테이블 참조
-- 옵션 2: manager_id를 TEXT로 변경하고 이메일 저장

-- 현재 manager_id 타입 확인
SELECT 
    column_name, 
    data_type,
    '현재 properties.manager_id 타입' as info
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'manager_id';

-- ================================================
-- 3. RLS 정책 수정 - 더 간단한 접근
-- ================================================

-- properties 테이블 RLS 정책
DROP POLICY IF EXISTS "매물 조회 권한" ON properties;
CREATE POLICY "매물 조회 권한" ON properties FOR SELECT
USING (true); -- 모든 사용자 조회 가능

DROP POLICY IF EXISTS "매물 생성 권한" ON properties;
CREATE POLICY "매물 생성 권한" ON properties FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL -- 로그인한 사용자만
);

DROP POLICY IF EXISTS "매물 수정 권한" ON properties;
CREATE POLICY "매물 수정 권한" ON properties FOR UPDATE
USING (
    auth.uid() IS NOT NULL -- 로그인한 사용자만
);

DROP POLICY IF EXISTS "매물 삭제 권한" ON properties;
CREATE POLICY "매물 삭제 권한" ON properties FOR DELETE
USING (
    auth.uid() IS NOT NULL -- 로그인한 사용자만
);

-- ================================================
-- 4. property_comments RLS 정책 (간단 버전)
-- ================================================

DROP POLICY IF EXISTS "모든 사용자 읽기 가능" ON property_comments;
CREATE POLICY "모든 사용자 읽기 가능" ON property_comments
FOR SELECT USING (true);

DROP POLICY IF EXISTS "인증된 사용자만 작성 가능" ON property_comments;
CREATE POLICY "인증된 사용자만 작성 가능" ON property_comments
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "작성자만 수정 가능" ON property_comments;
CREATE POLICY "작성자만 수정 가능" ON property_comments
FOR UPDATE USING (
    auth.uid() IS NOT NULL 
    AND user_id = (SELECT email FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "작성자만 삭제 가능" ON property_comments;
CREATE POLICY "작성자만 삭제 가능" ON property_comments
FOR DELETE USING (
    auth.uid() IS NOT NULL 
    AND user_id = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- ================================================
-- 5. 관리자 권한은 애플리케이션 레벨에서 처리
-- ================================================

-- AuthContext.jsx에서 이미 처리 중:
-- const adminEmails = ENV_CONFIG.ADMIN_EMAILS?.split(',')
-- const isAdmin = adminEmails.includes(googleUser.email)

-- ================================================
-- 6. 검증 쿼리
-- ================================================

-- RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('properties', 'property_comments')
ORDER BY tablename, policyname;

-- 테이블 존재 확인
SELECT 
    'auth_user_mappings' as table_name,
    EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'auth_user_mappings'
    ) as exists;

-- ================================================
-- 7. 주의사항
-- ================================================

-- 이 접근 방식은:
-- 1. RLS를 단순화하여 기본 인증만 체크
-- 2. 세부 권한은 애플리케이션에서 처리
-- 3. 환경변수 기반 관리자 설정 활용

-- 장점:
-- - Google OAuth와 충돌 없음
-- - 구현이 단순함
-- - 애플리케이션 레벨 권한 관리와 일치

-- 단점:
-- - DB 레벨 보안이 약함
-- - 애플리케이션 로직에 의존