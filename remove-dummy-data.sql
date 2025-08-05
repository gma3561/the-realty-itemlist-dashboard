-- Supabase 더미 데이터 삭제 스크립트
-- 주의: 이 스크립트는 테스트/더미 데이터를 삭제합니다. 실행 전 백업을 권장합니다.

-- 1. recent_activities 테이블에서 system 사용자의 모든 활동 삭제
DELETE FROM recent_activities 
WHERE changed_by = 'system' 
   OR changed_by_name = 'system'
   OR changed_by LIKE '%test%'
   OR changed_by LIKE '%dummy%';

-- 2. property_status_history 테이블에서 system 사용자의 변경 이력 삭제
DELETE FROM property_status_history 
WHERE changed_by = 'system' 
   OR changed_by LIKE '%test%'
   OR changed_by LIKE '%dummy%';

-- 3. properties 테이블에서 테스트/더미 매물 삭제
DELETE FROM properties 
WHERE property_name LIKE '%테스트%' 
   OR property_name LIKE '%test%'
   OR property_name LIKE '%dummy%'
   OR property_name LIKE '%샘플%'
   OR property_name LIKE '%sample%'
   OR manager_id = 'system'
   OR manager_id LIKE '%test%';

-- 4. users 테이블에서 테스트 사용자 삭제 (주의: hardcoded 관리자는 제외)
DELETE FROM users 
WHERE (email LIKE '%test%' 
   OR email LIKE '%dummy%'
   OR email LIKE '%sample%'
   OR name = 'system'
   OR name LIKE '%테스트%')
   AND email NOT LIKE 'hardcoded-%';

-- 5. co_brokers 테이블에서 테스트 공동중개사 삭제
DELETE FROM co_brokers 
WHERE broker_name LIKE '%테스트%' 
   OR broker_name LIKE '%test%'
   OR broker_name LIKE '%dummy%';

-- 6. manager_history 테이블에서 system 사용자 관련 이력 삭제
DELETE FROM manager_history 
WHERE changed_by = 'system' 
   OR changed_by LIKE '%test%';

-- 7. statistics 테이블에서 테스트 통계 삭제
DELETE FROM statistics 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email LIKE '%test%' 
     OR name = 'system'
);

-- 8. user_login_history에서 테스트 로그인 기록 삭제
DELETE FROM user_login_history 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE email LIKE '%test%' 
     OR name = 'system'
);

-- 더미 데이터 삭제 확인
SELECT 'recent_activities' as table_name, COUNT(*) as remaining_count FROM recent_activities WHERE changed_by = 'system'
UNION ALL
SELECT 'property_status_history', COUNT(*) FROM property_status_history WHERE changed_by = 'system'
UNION ALL  
SELECT 'properties (테스트)', COUNT(*) FROM properties WHERE property_name LIKE '%테스트%' OR property_name LIKE '%test%'
UNION ALL
SELECT 'users (test)', COUNT(*) FROM users WHERE email LIKE '%test%' OR name = 'system';