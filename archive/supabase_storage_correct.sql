-- Supabase Storage 설정 (올바른 타입 버전)

-- 1. Storage 버킷 생성 (이미 있으면 스킵)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-files', 'property-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. 기존 Storage 정책 삭제
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 3. 새로운 Storage 정책 생성
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-files');

CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'property-files');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'property-files');

-- 4. 파일 메타데이터 테이블 삭제 후 재생성
DROP TABLE IF EXISTS property_files;

CREATE TABLE property_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL, -- auth.uid()가 TEXT를 반환하므로
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS 정책 설정
ALTER TABLE property_files ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 파일 정보 조회 가능
CREATE POLICY "Admin can view all files" ON property_files
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()  -- UUID를 TEXT로 변환
    AND users.role = 'admin'
  )
);

-- 일반 사용자는 자신이 담당한 매물의 파일만 조회
CREATE POLICY "Users can view their property files" ON property_files
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = property_files.property_id
    AND properties.manager_id = auth.uid()  -- 둘 다 TEXT 타입
  )
);

-- 인증된 사용자는 파일 정보 추가 가능
CREATE POLICY "Authenticated users can insert files" ON property_files
FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid());  -- 둘 다 TEXT 타입

-- 파일 정보 삭제 정책
CREATE POLICY "Users can delete their files" ON property_files
FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid() OR  -- 둘 다 TEXT 타입
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()  -- UUID를 TEXT로 변환
    AND users.role = 'admin'
  )
);

-- 6. 확인 쿼리
SELECT * FROM storage.buckets WHERE id = 'property-files';
SELECT * FROM pg_policies WHERE tablename = 'property_files';