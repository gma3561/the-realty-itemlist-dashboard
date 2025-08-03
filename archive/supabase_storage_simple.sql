-- Supabase Storage 간단한 설정
-- 복잡한 권한 체크 없이 기본 기능만 구현

-- 1. Storage 버킷 생성 (이미 있으면 스킵)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-files', 'property-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage 정책 - 인증된 사용자만 허용
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- 새 정책 생성
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-files');

CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'property-files');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'property-files');

-- 3. 파일 메타데이터 테이블 (단순화)
DROP TABLE IF EXISTS property_files;

CREATE TABLE property_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 단순한 RLS 정책
ALTER TABLE property_files ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 파일 정보를 볼 수 있음
CREATE POLICY "Authenticated users can view all files" ON property_files
FOR SELECT TO authenticated
USING (true);

-- 모든 인증된 사용자가 파일 정보를 추가할 수 있음
CREATE POLICY "Authenticated users can insert files" ON property_files
FOR INSERT TO authenticated
WITH CHECK (true);

-- 업로드한 사용자만 삭제 가능
CREATE POLICY "Users can delete own files" ON property_files
FOR DELETE TO authenticated
USING (uploaded_by = auth.uid());

-- 5. 확인
SELECT * FROM storage.buckets WHERE id = 'property-files';
SELECT * FROM pg_policies WHERE tablename = 'property_files';