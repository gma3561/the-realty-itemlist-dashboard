-- Google Drive 하이브리드 시스템을 위한 스키마 수정

-- 기존 property_media 테이블 삭제 (있는 경우)
DROP TABLE IF EXISTS public.property_media;

-- 새로운 이미지 관리 테이블 생성
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Google Drive 정보
  google_drive_id TEXT NOT NULL,
  google_drive_url TEXT NOT NULL,
  google_folder_id TEXT,
  
  -- Supabase 썸네일 (빠른 로딩용)
  thumbnail_path TEXT,
  thumbnail_url TEXT,
  
  -- 파일 정보
  original_filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  
  -- 표시 정보
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  alt_text TEXT,
  
  -- 메타데이터
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_display_order ON public.property_images(property_id, display_order);
CREATE INDEX IF NOT EXISTS idx_property_images_google_drive_id ON public.property_images(google_drive_id);

-- 기존 property_shares 테이블에 Google Drive 관련 컬럼 추가
ALTER TABLE public.property_shares 
ADD COLUMN IF NOT EXISTS share_folder_id TEXT,
ADD COLUMN IF NOT EXISTS include_high_quality BOOLEAN DEFAULT false;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_property_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_property_images_timestamp ON public.property_images;
CREATE TRIGGER trg_update_property_images_timestamp
  BEFORE UPDATE ON public.property_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_images_updated_at();

-- RLS 정책 설정
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 조회 가능
CREATE POLICY "property_images_select_policy" ON public.property_images
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- 매물 담당자만 이미지 추가 가능
CREATE POLICY "property_images_insert_policy" ON public.property_images
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- 매물 담당자이거나
      auth.uid() IN (
        SELECT manager_id FROM public.properties WHERE id = property_id
      ) OR
      -- 관리자인 경우
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    )
  );

-- 이미지 업로드한 사용자나 매물 담당자만 수정 가능
CREATE POLICY "property_images_update_policy" ON public.property_images
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND (
      -- 업로드한 사용자이거나
      auth.uid() = uploaded_by OR
      -- 매물 담당자이거나
      auth.uid() IN (
        SELECT manager_id FROM public.properties WHERE id = property_id
      ) OR
      -- 관리자인 경우
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    )
  );

-- 이미지 업로드한 사용자나 매물 담당자만 삭제 가능
CREATE POLICY "property_images_delete_policy" ON public.property_images
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND (
      -- 업로드한 사용자이거나
      auth.uid() = uploaded_by OR
      -- 매물 담당자이거나
      auth.uid() IN (
        SELECT manager_id FROM public.properties WHERE id = property_id
      ) OR
      -- 관리자인 경우
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    )
  );

-- Supabase Storage Bucket 설정을 위한 정책
-- (Supabase 대시보드에서 수동으로 설정해야 함)

-- 썸네일 버킷 정책 예시 (SQL로는 적용 불가, 참고용)
/*
Bucket name: property-thumbnails
Public: true
File size limit: 5MB
Allowed MIME types: image/jpeg, image/png, image/webp

RLS Policies:
1. SELECT: auth.uid() IS NOT NULL
2. INSERT: auth.uid() IS NOT NULL  
3. UPDATE: auth.uid() IS NOT NULL
4. DELETE: auth.uid() IS NOT NULL
*/

-- 매물 이미지 개수 체크 함수 (옵션)
CREATE OR REPLACE FUNCTION public.get_property_image_count(property_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.property_images 
    WHERE property_id = property_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 매물의 대표 이미지 가져오기 함수
CREATE OR REPLACE FUNCTION public.get_property_primary_image(property_uuid UUID)
RETURNS TABLE (
  id UUID,
  thumbnail_url TEXT,
  google_drive_url TEXT,
  alt_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id,
    pi.thumbnail_url,
    pi.google_drive_url,
    pi.alt_text
  FROM public.property_images pi
  WHERE pi.property_id = property_uuid
    AND pi.is_primary = true
  ORDER BY pi.display_order
  LIMIT 1;
  
  -- 대표 이미지가 없으면 첫 번째 이미지 반환
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      pi.id,
      pi.thumbnail_url,
      pi.google_drive_url,
      pi.alt_text
    FROM public.property_images pi
    WHERE pi.property_id = property_uuid
    ORDER BY pi.display_order
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 테스트 데이터 삽입 (개발용)
-- INSERT INTO public.property_images (
--   property_id,
--   google_drive_id,
--   google_drive_url,
--   thumbnail_path,
--   thumbnail_url,
--   original_filename,
--   file_size,
--   mime_type,
--   display_order,
--   is_primary
-- ) VALUES (
--   '매물_UUID',
--   'Google_Drive_File_ID',
--   'https://drive.google.com/uc?export=view&id=Google_Drive_File_ID',
--   'property_uuid/thumb_01_image.jpg',
--   'https://supabase.co/storage/v1/object/public/property-thumbnails/property_uuid/thumb_01_image.jpg',
--   'original_image.jpg',
--   2048576,
--   'image/jpeg',
--   1,
--   true
-- );