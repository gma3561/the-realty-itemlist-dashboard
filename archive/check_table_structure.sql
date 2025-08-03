-- 1. users 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. properties 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'properties'
ORDER BY ordinal_position;

-- 3. auth.uid() 타입 확인
SELECT 
    auth.uid() as uid_value,
    pg_typeof(auth.uid()) as uid_type;

-- 4. 특정 컬럼들의 타입만 확인
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('users', 'properties')
AND column_name IN ('id', 'manager_id', 'role')
ORDER BY table_name, column_name;