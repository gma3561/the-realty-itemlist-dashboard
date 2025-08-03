-- properties 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- 샘플 데이터 확인
SELECT * FROM properties LIMIT 1;