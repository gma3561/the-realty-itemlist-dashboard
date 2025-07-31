-- 룩업 테이블에 기본 데이터 추가
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

-- 테스트용 소유주 데이터
INSERT INTO public.owners (name, phone, contact_relation) VALUES 
  ('김소유자', '010-1234-5678', '본인'),
  ('박소유자', '010-2345-6789', '본인'),
  ('이소유자', '010-3456-7890', '대리인')
ON CONFLICT DO NOTHING;