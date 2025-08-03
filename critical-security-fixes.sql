-- 🚨 CASCADE DELETE 제거 - 데이터 손실 방지
-- property_comments 테이블 외래키 재생성
ALTER TABLE property_comments 
DROP CONSTRAINT IF EXISTS property_comments_property_id_fkey;

ALTER TABLE property_comments
ADD CONSTRAINT property_comments_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE RESTRICT;  -- CASCADE 대신 RESTRICT 사용

-- manager_history 테이블 외래키도 안전하게
ALTER TABLE manager_history
DROP CONSTRAINT IF EXISTS manager_history_property_id_fkey;

ALTER TABLE manager_history
ADD CONSTRAINT manager_history_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE RESTRICT;

-- properties 테이블의 manager_id도 안전하게
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS properties_manager_id_fkey;

ALTER TABLE properties
ADD CONSTRAINT properties_manager_id_fkey
FOREIGN KEY (manager_id)
REFERENCES users(id)
ON DELETE SET NULL;  -- 사용자 삭제 시 NULL로 설정