-- properties 테이블에 누락된 컬럼 추가
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS direction TEXT,
ADD COLUMN IF NOT EXISTS room_bathroom TEXT,
ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC;

-- direction 컬럼이 이미 있다면 제거 (중복 방지)
-- 이미 89번 라인에 direction이 정의되어 있음

-- 기존 rooms_bathrooms 컬럼명을 room_bathroom으로 변경 가능성 체크
-- ALTER TABLE public.properties RENAME COLUMN rooms_bathrooms TO room_bathroom;

-- 월세 관련 컬럼 추가 (필요한 경우)
-- monthly_rent는 월세금액 저장용

COMMENT ON COLUMN public.properties.direction IS '향 정보 (남향, 동향 등)';
COMMENT ON COLUMN public.properties.monthly_rent IS '월세 금액 (월세 거래시)';

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_properties_ad_status ON public.properties(ad_status);
CREATE INDEX IF NOT EXISTS idx_properties_registration_date ON public.properties(registration_date);