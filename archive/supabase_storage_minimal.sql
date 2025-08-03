-- 최소한의 설정만으로 Storage 사용

-- 1. 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-files', 'property-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. 모든 기존 정책 삭제
DO $$ 
BEGIN
    -- Storage 정책 삭제
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their property files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their property files" ON storage.objects;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. 가장 단순한 Storage 정책
CREATE POLICY "storage_access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'property-files')
WITH CHECK (bucket_id = 'property-files');

-- 4. 파일 추적 테이블 (최소 구성)
DROP TABLE IF EXISTS property_files CASCADE;

CREATE TABLE property_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 테이블에 대한 간단한 접근 권한
ALTER TABLE property_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_files_access" ON property_files
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 완료 메시지
SELECT 'Storage 설정이 완료되었습니다. 이제 파일 업로드를 테스트해보세요.' as message;