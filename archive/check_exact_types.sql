-- 1. users 테이블의 정확한 구조 확인
\d users;

-- 2. properties 테이블의 정확한 구조 확인  
\d properties;

-- 3. 컬럼 타입 상세 확인
SELECT 
    c.table_name,
    c.column_name, 
    c.data_type,
    c.udt_name
FROM information_schema.columns c
WHERE c.table_name IN ('users', 'properties')
AND c.column_name IN ('id', 'manager_id')
ORDER BY c.table_name, c.ordinal_position;

-- 4. auth.uid() 타입 확인
SELECT pg_typeof(auth.uid()) as auth_uid_type;