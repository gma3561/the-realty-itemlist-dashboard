# Supabase 설정 가이드

## 1. 시드 데이터 추가

수파베이스 대시보드의 SQL 에디터에서 다음 SQL을 실행하세요:

```sql
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
ON CONFLICT (phone) DO NOTHING;

-- 테스트용 사용자 데이터 (필요한 경우)
INSERT INTO public.users (id, email, name, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@the-realty.co.kr', '관리자', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'user@the-realty.co.kr', '일반사용자', 'user')
ON CONFLICT (id) DO NOTHING;
```

## 2. 데이터 확인을 위한 쿼리

```sql
-- 데이터 확인
SELECT 'property_types' as table_name, count(*) as count FROM property_types
UNION ALL
SELECT 'property_statuses' as table_name, count(*) as count FROM property_statuses  
UNION ALL
SELECT 'transaction_types' as table_name, count(*) as count FROM transaction_types
UNION ALL
SELECT 'owners' as table_name, count(*) as count FROM owners
UNION ALL
SELECT 'users' as table_name, count(*) as count FROM users;
```

## 3. 테스트 매물 등록

```sql
-- 테스트 매물 등록 (UUID는 실제 조회된 값으로 교체)
INSERT INTO public.properties (
  property_name,
  location,
  property_type_id,
  property_status_id,
  transaction_type_id,
  owner_id,
  price,
  supply_area_sqm,
  private_area_sqm,
  floor_info,
  rooms_bathrooms,
  direction,
  maintenance_fee,
  parking,
  move_in_date,
  special_notes
) VALUES (
  '테스트 아파트',
  '서울시 강남구 삼성동',
  (SELECT id FROM property_types WHERE name = '아파트' LIMIT 1),
  (SELECT id FROM property_statuses WHERE name = '매물확보' LIMIT 1),
  (SELECT id FROM transaction_types WHERE name = '전세' LIMIT 1),
  (SELECT id FROM owners WHERE name = '김소유자' LIMIT 1),
  500000000,
  84.5,
  59.8,
  '15층/25층',
  '3개/2개',
  '남향',
  '15만원',
  '2대',
  '즉시입주',
  '테스트용 매물입니다'
);
```

## 4. 매물 조회 테스트

```sql
-- 등록된 매물 조회
SELECT 
  p.*,
  pt.name as property_type_name,
  ps.name as property_status_name,
  tt.name as transaction_type_name,
  o.name as owner_name
FROM properties p
LEFT JOIN property_types pt ON p.property_type_id = pt.id
LEFT JOIN property_statuses ps ON p.property_status_id = ps.id  
LEFT JOIN transaction_types tt ON p.transaction_type_id = tt.id
LEFT JOIN owners o ON p.owner_id = o.id
ORDER BY p.created_at DESC;
```