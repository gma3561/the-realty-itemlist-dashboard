-- 데이터베이스 스키마 수정 스크립트
-- Supabase SQL 편집기에서 실행하세요.

-- 원본 코드와의 호환성을 위한 추가 컬럼
ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS property_status TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT;

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

-- 기존 데이터 업데이트
UPDATE properties p
SET 
  property_type = (SELECT name FROM property_types WHERE id = p.property_type_id),
  transaction_type = (SELECT name FROM transaction_types WHERE id = p.transaction_type_id),
  property_status = (SELECT name FROM property_statuses WHERE id = p.property_status_id)
WHERE 
  property_type IS NULL OR transaction_type IS NULL OR property_status IS NULL;

-- 기존 룩업 데이터 확인 및 추가
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