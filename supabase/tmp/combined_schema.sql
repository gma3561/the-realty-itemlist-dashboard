-- 확장 모듈 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 테이블 (auth.users와 연동)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL CHECK (email LIKE '%@the-realty.co.kr'),
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- 사용자 로그인 이력
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- 소유주 정보
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  id_number TEXT,
  phone TEXT,
  contact_relation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 매물종류 코드 테이블
CREATE TABLE IF NOT EXISTS public.property_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 진행상태 코드 테이블
CREATE TABLE IF NOT EXISTS public.property_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 거래유형 코드 테이블
CREATE TABLE IF NOT EXISTS public.transaction_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 매물 테이블
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL,
  ad_status TEXT DEFAULT 'inactive' CHECK (ad_status IN ('active', 'inactive', 'pending')),
  ad_period DATERANGE,
  temp_property_number TEXT,
  registered_number TEXT,
  registration_date DATE,
  property_status_id UUID REFERENCES public.property_statuses(id) ON DELETE SET NULL,
  transaction_completed_date DATE,
  location TEXT NOT NULL,
  property_name TEXT NOT NULL,
  building TEXT,
  unit TEXT,
  property_type_id UUID REFERENCES public.property_types(id) ON DELETE SET NULL,
  is_commercial BOOLEAN DEFAULT FALSE,
  transaction_type_id UUID REFERENCES public.transaction_types(id) ON DELETE SET NULL,
  price NUMERIC,
  supply_area_sqm NUMERIC,
  private_area_sqm NUMERIC,
  supply_area_pyeong NUMERIC,
  private_area_pyeong NUMERIC,
  floor_info TEXT,
  rooms_bathrooms TEXT,
  direction TEXT,
  maintenance_fee TEXT,
  parking TEXT,
  move_in_date TEXT,
  approval_date TEXT,
  special_notes TEXT,
  manager_memo TEXT,
  resident TEXT,
  lease_type TEXT,
  lease_price NUMERIC,
  contract_period DATERANGE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 공동중개사 테이블
CREATE TABLE IF NOT EXISTS public.co_brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  broker_name TEXT NOT NULL,
  broker_contact TEXT,
  share_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 담당자 변경 이력
CREATE TABLE IF NOT EXISTS public.manager_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  previous_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  new_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 매물 미디어 (사진, 영상)
CREATE TABLE IF NOT EXISTS public.property_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 통계 테이블
CREATE TABLE IF NOT EXISTS public.statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  registered_properties INTEGER DEFAULT 0,
  completed_transactions INTEGER DEFAULT 0,
  period DATERANGE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 설정
CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON public.properties(manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type_id ON public.properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_status_id ON public.properties(property_status_id);
CREATE INDEX IF NOT EXISTS idx_properties_transaction_type_id ON public.properties(transaction_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location);
CREATE INDEX IF NOT EXISTS idx_co_brokers_property_id ON public.co_brokers(property_id);
CREATE INDEX IF NOT EXISTS idx_manager_history_property_id ON public.manager_history(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON public.property_media(property_id);

-- RLS(Row Level Security) 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자에 대한 접근 정책
CREATE POLICY "인증된 사용자만 접근 가능" ON public.users 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.property_types 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.property_statuses 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.transaction_types 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.properties 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.owners 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.co_brokers 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.manager_history 
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "인증된 사용자만 접근 가능" ON public.property_media 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 관리자만 접근 가능한 정책
CREATE POLICY "관리자만 접근 가능" ON public.user_login_history 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

CREATE POLICY "관리자만 접근 가능" ON public.statistics 
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- 자신의 정보만 업데이트 가능한 정책 (일반 사용자)
CREATE POLICY "자신의 정보만 업데이트 가능" ON public.users 
  FOR UPDATE USING (
    auth.uid() = id OR 
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- 트리거 함수: 매물 담당자 변경 시 이력 기록
CREATE OR REPLACE FUNCTION public.on_manager_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    INSERT INTO public.manager_history
      (property_id, previous_manager_id, new_manager_id, changed_by)
    VALUES
      (NEW.id, OLD.manager_id, NEW.manager_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 매물 테이블에 트리거 설정
DROP TRIGGER IF EXISTS trg_manager_change ON public.properties;
CREATE TRIGGER trg_manager_change
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.on_manager_change();

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 업데이트 가능한 테이블에 updated_at 트리거 설정
DROP TRIGGER IF EXISTS trg_update_users_timestamp ON public.users;
CREATE TRIGGER trg_update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_update_owners_timestamp ON public.owners;
CREATE TRIGGER trg_update_owners_timestamp
  BEFORE UPDATE ON public.owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_update_property_types_timestamp ON public.property_types;
CREATE TRIGGER trg_update_property_types_timestamp
  BEFORE UPDATE ON public.property_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_update_property_statuses_timestamp ON public.property_statuses;
CREATE TRIGGER trg_update_property_statuses_timestamp
  BEFORE UPDATE ON public.property_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_update_transaction_types_timestamp ON public.transaction_types;
CREATE TRIGGER trg_update_transaction_types_timestamp
  BEFORE UPDATE ON public.transaction_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_update_properties_timestamp ON public.properties;
CREATE TRIGGER trg_update_properties_timestamp
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

DROP TRIGGER IF EXISTS trg_update_co_brokers_timestamp ON public.co_brokers;
CREATE TRIGGER trg_update_co_brokers_timestamp
  BEFORE UPDATE ON public.co_brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- 매물종류 초기 데이터
INSERT INTO property_types (id, name, created_at, updated_at) VALUES
  (uuid_generate_v4(), '아파트', NOW(), NOW()),
  (uuid_generate_v4(), '주상복합', NOW(), NOW()),
  (uuid_generate_v4(), '빌라/연립', NOW(), NOW()),
  (uuid_generate_v4(), '오피스텔', NOW(), NOW()),
  (uuid_generate_v4(), '단독주택', NOW(), NOW()),
  (uuid_generate_v4(), '타운하우스', NOW(), NOW()),
  (uuid_generate_v4(), '빌딩/건물', NOW(), NOW()),
  (uuid_generate_v4(), '사무실/상가', NOW(), NOW()),
  (uuid_generate_v4(), '상가주택', NOW(), NOW()),
  (uuid_generate_v4(), '원룸', NOW(), NOW()),
  (uuid_generate_v4(), '다가구', NOW(), NOW()),
  (uuid_generate_v4(), '한옥', NOW(), NOW()),
  (uuid_generate_v4(), '숙박/콘도', NOW(), NOW()),
  (uuid_generate_v4(), '전원/농가', NOW(), NOW()),
  (uuid_generate_v4(), '공장/창고', NOW(), NOW()),
  (uuid_generate_v4(), '재개발', NOW(), NOW()),
  (uuid_generate_v4(), '재건축', NOW(), NOW()),
  (uuid_generate_v4(), '아파트분양권', NOW(), NOW()),
  (uuid_generate_v4(), '주상복합분양권', NOW(), NOW()),
  (uuid_generate_v4(), '오피스텔분양권', NOW(), NOW()),
  (uuid_generate_v4(), '지식산업센터', NOW(), NOW()),
  (uuid_generate_v4(), '기타', NOW(), NOW());

-- 진행상태 초기 데이터
INSERT INTO property_statuses (id, name, created_at, updated_at) VALUES
  (uuid_generate_v4(), '거래가능', NOW(), NOW()),
  (uuid_generate_v4(), '거래완료', NOW(), NOW()),
  (uuid_generate_v4(), '거래보류', NOW(), NOW()),
  (uuid_generate_v4(), '거래유형추가', NOW(), NOW()),
  (uuid_generate_v4(), '공동중개요청', NOW(), NOW()),
  (uuid_generate_v4(), '거래철회', NOW(), NOW());

-- 거래유형 초기 데이터
INSERT INTO transaction_types (id, name, created_at, updated_at) VALUES
  (uuid_generate_v4(), '분양', NOW(), NOW()),
  (uuid_generate_v4(), '매매', NOW(), NOW()),
  (uuid_generate_v4(), '전세', NOW(), NOW()),
  (uuid_generate_v4(), '월세/렌트', NOW(), NOW()),
  (uuid_generate_v4(), '단기', NOW(), NOW());