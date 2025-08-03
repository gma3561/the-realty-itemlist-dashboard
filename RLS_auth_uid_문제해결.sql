-- 🚨 RLS auth.uid() 문제 해결
-- 실행일: 2025-08-03
-- 목적: Google OAuth UUID와 내부 시스템 UUID 매핑

-- ================================================
-- 1. auth_user_mappings 테이블 생성
-- ================================================

CREATE TABLE IF NOT EXISTS auth_user_mappings (
    google_uid UUID PRIMARY KEY,
    internal_user_id UUID NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_internal_user FOREIGN KEY (internal_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 추가
CREATE INDEX idx_auth_mapping_internal ON auth_user_mappings(internal_user_id);
CREATE INDEX idx_auth_mapping_email ON auth_user_mappings(email);

-- ================================================
-- 2. RLS 정책 수정 - auth.uid() 대신 이메일 기반
-- ================================================

-- properties 테이블 RLS 정책 재작성
DROP POLICY IF EXISTS "매물 조회 권한" ON properties;
CREATE POLICY "매물 조회 권한" ON properties FOR SELECT
USING (
    -- 1. 인증되지 않은 사용자도 조회 가능
    true
);

DROP POLICY IF EXISTS "매물 생성 권한" ON properties;
CREATE POLICY "매물 생성 권한" ON properties FOR INSERT
WITH CHECK (
    -- Google 로그인한 사용자 중 관리자만
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
    )
);

DROP POLICY IF EXISTS "매물 수정 권한" ON properties;
CREATE POLICY "매물 수정 권한" ON properties FOR UPDATE
USING (
    -- 관리자이거나 담당자
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (
            -- 관리자
            auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
            OR
            -- 담당자 (이메일로 매칭)
            properties.manager_id = auth.users.email
        )
    )
);

DROP POLICY IF EXISTS "매물 삭제 권한" ON properties;
CREATE POLICY "매물 삭제 권한" ON properties FOR DELETE
USING (
    -- 관리자만
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
    )
);

-- ================================================
-- 3. property_comments RLS 정책 수정
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
    -- user_id가 이메일로 저장되어 있다면
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email = property_comments.user_id
    )
);

DROP POLICY IF EXISTS "작성자와 관리자만 삭제 가능" ON property_comments;
CREATE POLICY "작성자와 관리자만 삭제 가능" ON property_comments
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND (
            -- 작성자
            auth.users.email = property_comments.user_id
            OR
            -- 관리자
            auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
        )
    )
);

-- ================================================
-- 4. 환경변수 설정을 위한 함수
-- ================================================

CREATE OR REPLACE FUNCTION set_admin_emails(emails TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.admin_emails', emails, false);
END;
$$ LANGUAGE plpgsql;

-- 기본 관리자 이메일 설정 (애플리케이션에서 오버라이드 가능)
SELECT set_admin_emails('admin@the-realty.co.kr,manager@the-realty.co.kr');

-- ================================================
-- 5. 기존 users 테이블의 manager_id 타입 확인 및 수정
-- ================================================

DO $$ 
BEGIN
    -- properties.manager_id가 UUID인 경우 TEXT로 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'manager_id'
        AND data_type = 'uuid'
    ) THEN
        -- 외래키 제거
        ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_manager_id_fkey;
        
        -- 타입 변경 (이메일 저장용)
        ALTER TABLE properties 
        ALTER COLUMN manager_id TYPE TEXT 
        USING manager_id::TEXT;
    END IF;
END $$;

-- ================================================
-- 6. 검증 쿼리
-- ================================================

-- RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('properties', 'property_comments')
ORDER BY tablename, policyname;