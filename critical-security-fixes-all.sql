-- 🚨 CASCADE DELETE 일괄 제거 - 데이터 손실 방지
-- 한 번에 모두 실행

-- 1. property_comments 테이블
ALTER TABLE property_comments 
DROP CONSTRAINT IF EXISTS property_comments_property_id_fkey;

ALTER TABLE property_comments
ADD CONSTRAINT property_comments_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE RESTRICT;

-- 2. manager_history 테이블
ALTER TABLE manager_history
DROP CONSTRAINT IF EXISTS manager_history_property_id_fkey;

ALTER TABLE manager_history
ADD CONSTRAINT manager_history_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE RESTRICT;

-- 3. property_history 테이블 (있다면)
ALTER TABLE property_history
DROP CONSTRAINT IF EXISTS property_history_property_id_fkey;

ALTER TABLE property_history
ADD CONSTRAINT property_history_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE RESTRICT;

-- 4. properties 테이블의 manager_id (사용자 삭제 시 NULL로만)
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS properties_manager_id_fkey;

ALTER TABLE properties
ADD CONSTRAINT properties_manager_id_fkey
FOREIGN KEY (manager_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- 5. 기타 property_id를 참조하는 테이블들 확인
-- (property_images, property_documents 등이 있다면)

-- 확인 쿼리: CASCADE가 남아있는지 체크
SELECT 
    tc.table_name, 
    tc.constraint_name,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND rc.delete_rule = 'CASCADE'
ORDER BY tc.table_name;