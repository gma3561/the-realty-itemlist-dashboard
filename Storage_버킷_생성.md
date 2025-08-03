# 🪣 Storage 버킷 생성 가이드

## Supabase 대시보드에서 직접 생성

### 1. Storage 섹션 접속
1. Supabase 대시보드 로그인
2. 좌측 메뉴에서 **Storage** 클릭
3. **New bucket** 버튼 클릭

### 2. 버킷 생성 설정
- **Name**: `property-images`
- **Public bucket**: ✅ 체크 (공개 접근 허용)
- **File size limit**: 5MB (또는 원하는 크기)
- **Allowed MIME types**: 
  ```
  image/jpeg
  image/jpg
  image/png
  image/webp
  image/gif
  ```

### 3. 버킷 정책 설정 (선택사항)

공개 버킷으로 설정한 경우 추가 정책이 필요 없지만, 
더 세밀한 제어가 필요하면 아래 SQL을 실행:

```sql
-- 모든 사용자가 이미지 조회 가능
CREATE POLICY "공개 이미지 조회" ON storage.objects 
FOR SELECT USING (bucket_id = 'property-images');

-- 인증된 사용자만 업로드 가능
CREATE POLICY "인증된 사용자 업로드" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.uid() IS NOT NULL
);

-- 관리자만 삭제 가능
CREATE POLICY "관리자만 삭제" ON storage.objects 
FOR DELETE USING (
    bucket_id = 'property-images' 
    AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.email = ANY(string_to_array(current_setting('app.admin_emails', true), ','))
    )
);
```

## 또는 SQL로 생성

```sql
-- Storage 버킷 생성 (Supabase SQL Editor에서 실행)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;
```

## 프론트엔드 코드 확인

PropertyImageUpload.jsx가 이미 구현되어 있으므로,
버킷만 생성하면 즉시 사용 가능합니다.

```javascript
// 이미 구현된 업로드 코드
const { data, error } = await supabase.storage
  .from('property-images')
  .upload(filePath, file);
```

## 테스트 방법

1. 매물 상세 페이지 접속
2. 이미지 업로드 시도
3. 성공 시 이미지 URL 확인:
   ```
   https://[project-ref].supabase.co/storage/v1/object/public/property-images/[file-path]
   ```