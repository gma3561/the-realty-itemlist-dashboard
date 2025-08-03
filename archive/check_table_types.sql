-- 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- properties 테이블 구조도 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;

-- auth.uid() 반환 타입 확인
SELECT auth.uid(), pg_typeof(auth.uid());