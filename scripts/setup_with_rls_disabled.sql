-- 임시로 RLS 비활성화하고 데이터 삽입 후 다시 활성화
-- 이 스크립트를 Supabase 대시보드 SQL 에디터에서 실행하세요

-- 1. RLS 임시 비활성화
ALTER TABLE public.property_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_statuses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners DISABLE ROW LEVEL SECURITY;

-- 2. 데이터 삽입
-- 매물 종류 데이터
INSERT INTO public.property_types (name) VALUES 
  ('원룸'),
  ('투룸'),
  ('쓰리룸'),
  ('오피스텔'),
  ('아파트'),
  ('빌라'),
  ('단독주택'),
  ('상가')
ON CONFLICT (name) DO NOTHING;

-- 진행 상태 데이터
INSERT INTO public.property_statuses (name) VALUES 
  ('매물확보'),
  ('광고진행'),
  ('계약진행'),
  ('거래완료'),
  ('매물취소')
ON CONFLICT (name) DO NOTHING;

-- 거래 유형 데이터
INSERT INTO public.transaction_types (name) VALUES 
  ('매매'),
  ('전세'),
  ('월세'),
  ('단기임대')
ON CONFLICT (name) DO NOTHING;

-- 테스트용 소유주 데이터 (unique constraint 추가)
ALTER TABLE public.owners ADD CONSTRAINT owners_phone_unique UNIQUE (phone);
INSERT INTO public.owners (name, phone, contact_relation) VALUES 
  ('김소유자', '010-1234-5678', '본인'),
  ('박소유자', '010-2345-6789', '본인'),
  ('이소유자', '010-3456-7890', '대리인')
ON CONFLICT (phone) DO NOTHING;

-- 3. RLS 다시 활성화
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- 4. 결과 확인
SELECT 'property_types' as table_name, count(*) as count FROM property_types
UNION ALL
SELECT 'property_statuses' as table_name, count(*) as count FROM property_statuses  
UNION ALL
SELECT 'transaction_types' as table_name, count(*) as count FROM transaction_types
UNION ALL
SELECT 'owners' as table_name, count(*) as count FROM owners;