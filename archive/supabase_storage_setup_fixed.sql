-- Supabase Storage 버킷 생성 및 정책 설정
-- Supabase SQL Editor에서 실행

-- 1. Storage 버킷 생성 (이미 있으면 스킵)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-files', 'property-files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage 정책 설정 (간소화된 버전)
-- 인증된 사용자는 파일 업로드 가능
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-files');

-- 인증된 사용자는 파일 조회 가능 (간소화)
CREATE POLICY "Authenticated users can view files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'property-files');

-- 인증된 사용자는 파일 삭제 가능 (간소화)
CREATE POLICY "Authenticated users can delete files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'property-files');

-- 3. 파일 메타데이터 테이블 생성
CREATE TABLE IF NOT EXISTS property_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE property_files ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 파일 정보 조회 가능
CREATE POLICY "Admin can view all files" ON property_files
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
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
    AND properties.manager_id = auth.uid()
  )
);

-- 인증된 사용자는 파일 정보 추가 가능
CREATE POLICY "Authenticated users can insert files" ON property_files
FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- 파일 정보 삭제 정책
CREATE POLICY "Users can delete their files" ON property_files
FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- 4. 확인 쿼리
-- 버킷 확인
SELECT * FROM storage.buckets WHERE id = 'property-files';

-- 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('objects', 'property_files')
ORDER BY tablename, policyname;