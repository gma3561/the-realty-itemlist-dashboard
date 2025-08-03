-- Users 테이블 생성 (auth.users와 연동)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  phone TEXT,
  department TEXT,
  position TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS 정책들

-- 1. 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (id = auth.uid());

-- 3. 관리자만 사용자 정보 생성 가능
CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. 관리자는 모든 사용자 정보 수정 가능
CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. 사용자는 자신의 일부 정보만 수정 가능 (이름, 전화번호 등)
CREATE POLICY "Users can update own basic info" ON public.users
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (
    -- role은 변경 불가
    role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

-- 6. 관리자만 사용자 삭제 가능 (실제로는 is_active를 false로 변경)
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- auth.users 생성 시 public.users에도 자동으로 레코드 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 초기 관리자 계정 설정 (이메일 기반)
UPDATE public.users 
SET role = 'admin' 
WHERE email IN (
  'gyum@the-realty.co.kr',
  'lucas@the-realty.co.kr',
  'jenny@the-realty.co.kr'
);

-- 권한 부여
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;