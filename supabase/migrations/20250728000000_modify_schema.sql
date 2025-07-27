-- 스키마 수정: 누락된 컬럼 추가
ALTER TABLE IF EXISTS public.properties 
  ADD COLUMN IF NOT EXISTS property_type TEXT,
  ADD COLUMN IF NOT EXISTS transaction_type TEXT,
  ADD COLUMN IF NOT EXISTS property_status TEXT,
  ADD COLUMN IF NOT EXISTS lease_price NUMERIC,
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC;

-- 기존의 price 컬럼에서 데이터 마이그레이션 (선택적)
UPDATE public.properties 
SET sale_price = price 
WHERE transaction_type = 'sale' AND sale_price IS NULL AND price IS NOT NULL;

-- lookup 테이블 ID 대신 직접 텍스트 값 사용 허용 위한 외래 키 제약 조건 완화
ALTER TABLE IF EXISTS public.properties 
  DROP CONSTRAINT IF EXISTS properties_property_type_id_fkey,
  DROP CONSTRAINT IF EXISTS properties_transaction_type_id_fkey,
  DROP CONSTRAINT IF EXISTS properties_property_status_id_fkey;

-- 로우 레벨 보안 정책 수정
DROP POLICY IF EXISTS "인증된 사용자만 접근 가능" ON public.properties;
CREATE POLICY "모든 사용자 접근 가능" ON public.properties FOR ALL USING (true);

-- 테스트 사용자 생성
INSERT INTO public.users (id, email, name, role, status)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@the-realty.co.kr', '관리자', 'admin', 'active')
ON CONFLICT (id) DO NOTHING;