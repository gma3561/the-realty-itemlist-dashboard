# 🚨 CASCADE DELETE 제거 SQL (일괄 실행)

## 실행 방법
1. Supabase SQL Editor 접속
2. 아래 SQL 전체 복사
3. 붙여넣기 후 RUN 클릭

---

```sql
-- ================================================
-- CASCADE DELETE 일괄 제거 쿼리
-- 실행일: 2025-08-03
-- 목적: 데이터 연쇄 삭제 방지
-- ================================================

-- 1. property_comments 테이블 외래키 재설정
ALTER TABLE property_comments 
DROP CONSTRAINT IF EXISTS property_comments_property_id_fkey;

ALTER TABLE property_comments
ADD CONSTRAINT property_comments_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES properties(id) 
ON DELETE RESTRICT;  -- 매물 삭제 시 코멘트가 있으면 삭제 불가

-- 2. manager_history 테이블 외래키 재설정
ALTER TABLE manager_history
DROP CONSTRAINT IF EXISTS manager_history_property_id_fkey;

ALTER TABLE manager_history
ADD CONSTRAINT manager_history_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE RESTRICT;  -- 매물 삭제 시 히스토리가 있으면 삭제 불가

-- 3. property_history 테이블 외래키 재설정 (테이블이 있는 경우)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'property_history') THEN
        ALTER TABLE property_history
        DROP CONSTRAINT IF EXISTS property_history_property_id_fkey;
        
        ALTER TABLE property_history
        ADD CONSTRAINT property_history_property_id_fkey
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- 4. properties 테이블의 manager_id 외래키 재설정
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS properties_manager_id_fkey;

ALTER TABLE properties
ADD CONSTRAINT properties_manager_id_fkey
FOREIGN KEY (manager_id)
REFERENCES users(id)
ON DELETE SET NULL;  -- 사용자 삭제 시 담당자만 NULL로 설정

-- 5. 기타 properties 참조 테이블 확인 및 수정
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- property_images 테이블 처리
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'property_images') THEN
        ALTER TABLE property_images
        DROP CONSTRAINT IF EXISTS property_images_property_id_fkey;
        
        ALTER TABLE property_images
        ADD CONSTRAINT property_images_property_id_fkey
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE RESTRICT;
    END IF;
    
    -- property_documents 테이블 처리
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'property_documents') THEN
        ALTER TABLE property_documents
        DROP CONSTRAINT IF EXISTS property_documents_property_id_fkey;
        
        ALTER TABLE property_documents
        ADD CONSTRAINT property_documents_property_id_fkey
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ================================================
-- 검증 쿼리: CASCADE가 남아있는지 확인
-- ================================================
SELECT 
    '⚠️ CASCADE DELETE가 아직 남아있습니다!' as warning,
    tc.table_name as "테이블명", 
    tc.constraint_name as "제약조건명",
    rc.delete_rule as "삭제규칙"
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND rc.delete_rule = 'CASCADE'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 결과가 없으면 모든 CASCADE가 제거된 것입니다.

-- ================================================
-- 실행 후 확인사항
-- ================================================
-- 1. 위 검증 쿼리 결과가 비어있는지 확인
-- 2. 매물 삭제 테스트:
--    - 코멘트가 있는 매물 삭제 시도 → 실패해야 정상
--    - 빈 매물 삭제 → 성공해야 정상
```

---

## ⚠️ 실행 전 주의사항

1. **백업 권장**: 중요한 프로덕션 데이터가 있다면 백업 먼저
2. **영향 범위**: 
   - 매물 삭제가 더 엄격해집니다
   - 연관 데이터가 있으면 삭제 불가
3. **롤백 방법**: CASCADE로 되돌리려면 RESTRICT를 CASCADE로 변경

## ✅ 실행 후 확인

1. 마지막 SELECT 쿼리 결과가 **비어있어야** 정상
2. 결과가 있다면 해당 테이블도 수정 필요

## 🎯 예상 결과

```
Query returned successfully: 0 rows affected
```

모든 쿼리가 성공적으로 실행되고, CASCADE가 남아있지 않으면 완료!