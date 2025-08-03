-- 단계별로 실행하여 어디서 에러가 나는지 확인

-- STEP 1: 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-files', 'property-files', false)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: 기존 정책 삭제
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- STEP 3: Storage 정책 (단순 버전)
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-files');

CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'property-files');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'property-files');

-- STEP 4: 테이블 생성
DROP TABLE IF EXISTS property_files;

CREATE TABLE property_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,  -- 외래키 제약 제거
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 5: RLS 활성화
ALTER TABLE property_files ENABLE ROW LEVEL SECURITY;

-- STEP 6: 간단한 정책부터 시작
-- 모든 인증된 사용자가 볼 수 있음
CREATE POLICY "Anyone can view files" ON property_files
FOR SELECT TO authenticated
USING (true);

-- 모든 인증된 사용자가 추가할 수 있음
CREATE POLICY "Anyone can insert files" ON property_files
FOR INSERT TO authenticated
WITH CHECK (true);

-- 본인이 업로드한 파일만 삭제
CREATE POLICY "Users can delete own files" ON property_files
FOR DELETE TO authenticated
USING (uploaded_by = auth.uid());