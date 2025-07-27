-- 기존 테이블 삭제 (필요시 주석 해제)
-- DROP TABLE IF EXISTS public.properties;
-- DROP TABLE IF EXISTS public.property_types;
-- DROP TABLE IF EXISTS public.transaction_types;
-- DROP TABLE IF EXISTS public.property_statuses;

-- properties 테이블
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    property_name TEXT NOT NULL,
    location TEXT NOT NULL,
    building TEXT,
    unit TEXT,
    property_type_id TEXT NOT NULL,
    property_status_id TEXT NOT NULL,
    transaction_type_id TEXT NOT NULL,
    sale_price BIGINT,
    lease_price BIGINT,
    price BIGINT,
    supply_area_sqm NUMERIC(10,2),
    private_area_sqm NUMERIC(10,2),
    floor_info TEXT,
    rooms_bathrooms TEXT,
    direction TEXT,
    maintenance_fee TEXT,
    parking TEXT,
    move_in_date TEXT,
    approval_date TEXT,
    special_notes TEXT,
    manager_memo TEXT,
    is_commercial BOOLEAN DEFAULT false,
    manager_id TEXT,
    
    -- 원본 코드와의 호환성을 위한 추가 컬럼
    property_type TEXT,
    property_status TEXT,
    transaction_type TEXT
);

-- 룩업 테이블: 매물 유형
CREATE TABLE IF NOT EXISTS public.property_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0
);

-- 룩업 테이블: 거래 유형
CREATE TABLE IF NOT EXISTS public.transaction_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0
);

-- 룩업 테이블: 매물 상태
CREATE TABLE IF NOT EXISTS public.property_statuses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER DEFAULT 0
);

-- 타임스탬프 갱신 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- properties 테이블 업데이트 트리거
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 원본 코드와의 호환성을 위한 트리거 함수들
CREATE OR REPLACE FUNCTION update_property_type_text()
RETURNS TRIGGER AS $$
BEGIN
    SELECT name INTO NEW.property_type FROM property_types WHERE id = NEW.property_type_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_transaction_type_text()
RETURNS TRIGGER AS $$
BEGIN
    SELECT name INTO NEW.transaction_type FROM transaction_types WHERE id = NEW.transaction_type_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_property_status_text()
RETURNS TRIGGER AS $$
BEGIN
    SELECT name INTO NEW.property_status FROM property_statuses WHERE id = NEW.property_status_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 호환성 트리거 생성
DROP TRIGGER IF EXISTS trg_update_property_type_text ON public.properties;
CREATE TRIGGER trg_update_property_type_text
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW WHEN (NEW.property_type_id IS NOT NULL)
EXECUTE FUNCTION update_property_type_text();

DROP TRIGGER IF EXISTS trg_update_transaction_type_text ON public.properties;
CREATE TRIGGER trg_update_transaction_type_text
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW WHEN (NEW.transaction_type_id IS NOT NULL)
EXECUTE FUNCTION update_transaction_type_text();

DROP TRIGGER IF EXISTS trg_update_property_status_text ON public.properties;
CREATE TRIGGER trg_update_property_status_text
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW WHEN (NEW.property_status_id IS NOT NULL)
EXECUTE FUNCTION update_property_status_text();

-- RLS 정책 설정 (public 읽기 권한)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_statuses ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 public 읽기 권한 부여
CREATE POLICY "Enable read access for all users" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.property_types FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.transaction_types FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.property_statuses FOR SELECT USING (true);

-- 모든 테이블에 anon 쓰기 권한 부여 (테스트 목적)
CREATE POLICY "Enable insert for anon" ON public.properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for anon" ON public.property_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for anon" ON public.transaction_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for anon" ON public.property_statuses FOR INSERT WITH CHECK (true);

-- 룩업 테이블 데이터 초기화
INSERT INTO public.property_types (id, name, "order")
VALUES 
    ('apt', '아파트', 1),
    ('officetel', '오피스텔', 2),
    ('villa', '빌라/연립', 3),
    ('house', '단독주택', 4),
    ('commercial', '상가', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.transaction_types (id, name, "order")
VALUES 
    ('sale', '매매', 1),
    ('lease', '전세', 2),
    ('rent', '월세', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.property_statuses (id, name, "order")
VALUES 
    ('available', '거래가능', 1),
    ('reserved', '거래보류', 2),
    ('completed', '거래완료', 3)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;