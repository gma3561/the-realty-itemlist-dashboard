-- 구글 로그인 기반 권한 시스템 마이그레이션
-- 이 스크립트는 기존 시스템을 구글 OAuth 인증 기반으로 전환합니다

-- 1. users 테이블 수정 (구글 계정 정보 추가)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'google',
ALTER COLUMN email DROP NOT NULL, -- 구글 이메일은 @the-realty.co.kr이 아닐 수 있음
DROP CONSTRAINT IF EXISTS users_email_check; -- 도메인 제약 제거

-- 2. 구글 계정과 사내 계정 매핑 테이블
CREATE TABLE IF NOT EXISTS public.user_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    google_email TEXT NOT NULL UNIQUE,
    internal_email TEXT NOT NULL CHECK (internal_email LIKE '%@the-realty.co.kr'),
    user_id UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 기존 하드코딩된 관리자들을 users 테이블에 추가
INSERT INTO public.users (email, name, role_id, auth_provider)
VALUES 
    ('jenny@the-realty.co.kr', '정연서', 'admin', 'google'),
    ('lucas@the-realty.co.kr', '하상현', 'admin', 'google'),
    ('hmlee@the-realty.co.kr', '이혜만', 'admin', 'google'),
    ('jma@the-realty.co.kr', '장민아', 'employee', 'google'),
    ('jed@the-realty.co.kr', '정이든', 'employee', 'google'),
    ('jsh@the-realty.co.kr', '장승환', 'employee', 'google'),
    ('pjh@the-realty.co.kr', '박지혜', 'employee', 'google')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role_id = EXCLUDED.role_id,
    auth_provider = EXCLUDED.auth_provider;

-- 4. properties 테이블의 manager_id를 user_id로 마이그레이션
-- 먼저 user_id 컬럼이 없다면 추가
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id);

-- manager_id에서 user_id로 데이터 마이그레이션
UPDATE public.properties p
SET user_id = u.id
FROM public.users u
WHERE 
    p.manager_id = u.email OR
    p.manager_id = CONCAT('hardcoded-', u.email) OR
    p.manager_id = u.id::TEXT;

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;

-- 새로운 정책 생성
-- 관리자는 모든 매물 조회 가능
CREATE POLICY "Admins can view all properties" ON public.properties
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role_id = 'admin'
    )
);

-- 일반 사용자는 본인 매물만 조회 가능
CREATE POLICY "Users can view own properties" ON public.properties
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
);

-- 본인 매물만 수정 가능
CREATE POLICY "Users can update own properties" ON public.properties
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 관리자는 모든 매물 수정 가능
CREATE POLICY "Admins can update all properties" ON public.properties
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role_id = 'admin'
    )
);

-- 6. 사용자 정보 조회를 위한 뷰 생성
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role_id,
    r.name as role_name,
    u.avatar_url,
    u.created_at,
    u.last_login,
    u.is_active,
    COALESCE(
        (SELECT COUNT(*) FROM public.properties WHERE user_id = u.id),
        0
    ) as property_count
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id;

-- 7. 사용자 프로필 RLS 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 본인 정보만 조회 가능
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 관리자는 모든 사용자 정보 조회 가능
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role_id = 'admin'
    )
);

-- 8. 구글 로그인 시 자동으로 사용자 생성/업데이트하는 함수
CREATE OR REPLACE FUNCTION public.handle_google_auth()
RETURNS TRIGGER AS $$
DECLARE
    internal_email TEXT;
    user_role TEXT;
BEGIN
    -- 구글 이메일로 내부 이메일 찾기
    SELECT um.internal_email INTO internal_email
    FROM public.user_mappings um
    WHERE um.google_email = NEW.email;
    
    -- 매핑이 있으면 내부 사용자 정보 업데이트
    IF internal_email IS NOT NULL THEN
        -- 기존 사용자의 role 가져오기
        SELECT role_id INTO user_role
        FROM public.users
        WHERE email = internal_email;
        
        -- 사용자 정보 업데이트
        UPDATE public.users
        SET 
            google_id = NEW.id,
            avatar_url = NEW.raw_user_meta_data->>'avatar_url',
            last_login = NOW(),
            updated_at = NOW()
        WHERE email = internal_email;
        
        -- auth.users의 ID와 매핑
        UPDATE public.users
        SET id = NEW.id
        WHERE email = internal_email
        AND id != NEW.id;
    ELSE
        -- 신규 사용자는 employee 권한으로 생성
        INSERT INTO public.users (id, email, name, google_id, avatar_url, role_id, auth_provider)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            NEW.id,
            NEW.raw_user_meta_data->>'avatar_url',
            'employee',
            'google'
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            google_id = EXCLUDED.google_id,
            avatar_url = EXCLUDED.avatar_url,
            last_login = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 트리거 생성 (구글 로그인 시 자동 실행)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_google_auth();

-- 10. 기존 데이터 정리
-- manager_id가 이메일인 경우 user_id로 완전히 마이그레이션되었는지 확인
SELECT 
    COUNT(*) as unmigrated_count,
    COUNT(DISTINCT manager_id) as unique_managers
FROM public.properties
WHERE user_id IS NULL
AND manager_id IS NOT NULL;

-- 마이그레이션 완료 후 manager_id 컬럼은 더 이상 사용하지 않음
-- 추후 삭제 가능: ALTER TABLE public.properties DROP COLUMN manager_id;