-- 누락된 룩업 데이터 추가 SQL
-- 실행일: 2025-08-03
-- 목적: QA 테스트에서 발견된 누락 데이터 추가

-- 1. property_statuses 테이블에 누락된 상태 추가
INSERT INTO property_statuses (id, name, display_order) 
VALUES 
  ('cancelled', '거래철회', 4),
  ('inspection_available', '임장가능', 5)
ON CONFLICT (id) DO NOTHING;

-- 2. transaction_types 테이블에 누락된 거래유형 추가
INSERT INTO transaction_types (id, name, display_order) 
VALUES 
  ('presale', '분양', 1),
  ('developer', '시행사매물', 2),
  ('rent', '월세/렌트', 5)
ON CONFLICT (id) DO NOTHING;

-- 3. 추가 확인 쿼리
SELECT 'property_statuses' as table_name, COUNT(*) as count FROM property_statuses
UNION ALL
SELECT 'transaction_types', COUNT(*) FROM transaction_types;

-- 4. 상세 내용 확인
SELECT '=== Property Statuses ===' as info;
SELECT * FROM property_statuses ORDER BY display_order;

SELECT '=== Transaction Types ===' as info;
SELECT * FROM transaction_types ORDER BY display_order;