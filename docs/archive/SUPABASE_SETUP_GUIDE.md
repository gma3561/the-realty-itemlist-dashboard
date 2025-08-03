# Supabase 설정 가이드 (2025년 최신)

## 1. Realtime 활성화 방법

### 방법 1: Dashboard UI 사용 (권장)
1. Supabase Dashboard 로그인
2. **Database → Replication** 페이지로 이동
3. 테이블 목록에서 다음 테이블 찾기:
   - `properties`
   - `users`
4. 각 테이블 옆의 **"Enable replication"** 토글 ON으로 설정

### 방법 2: SQL Editor 사용
Supabase Dashboard → **SQL Editor**에서 다음 쿼리 실행:

```sql
-- Realtime publication 생성
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- properties 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE properties;

-- users 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## 2. Storage 버킷 생성

### 방법 1: Dashboard UI 사용
1. Supabase Dashboard → **Storage** 페이지
2. **"New Bucket"** 버튼 클릭
3. Bucket 이름: `property-files`
4. Public 옵션: **OFF** (비공개)
5. **"Create Bucket"** 클릭

### 방법 2: SQL Editor 사용
SQL Editor에서 다음 쿼리 실행:

```sql
-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-files', 'property-files', false)
ON CONFLICT (id) DO NOTHING;
```

## 3. property_files 테이블 및 정책 설정

SQL Editor에서 `supabase_storage_setup.sql` 파일의 전체 내용 실행:

```sql
-- 1. Storage 정책 설정
-- 인증된 사용자는 파일 업로드 가능
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-files');

-- 매물 담당자는 자신의 매물 파일 조회 가능
CREATE POLICY "Users can view their property files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'property-files' AND
  (
    -- 관리자는 모든 파일 조회 가능
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
    OR
    -- 일반 사용자는 자신이 담당한 매물 파일만 조회
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = (storage.foldername(name)::int)
      AND properties.manager_id = auth.uid()
    )
  )
);

-- 매물 담당자는 자신의 매물 파일 삭제 가능
CREATE POLICY "Users can delete their property files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'property-files' AND
  (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = (storage.foldername(name)::int)
      AND properties.manager_id = auth.uid()
    )
  )
);

-- 2. 파일 메타데이터 테이블 생성
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
```

## 4. 설정 확인

### Realtime 확인
```sql
-- Publication 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Storage 버킷 확인
```sql
-- 버킷 목록 확인
SELECT * FROM storage.buckets;
```

### property_files 테이블 확인
```sql
-- 테이블 구조 확인
\d property_files

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'property_files';
```

## 5. 주의사항

1. **RLS (Row Level Security)**
   - 민감한 데이터가 있는 테이블은 반드시 RLS 활성화
   - 적절한 정책 설정 필수

2. **성능 고려사항**
   - Realtime은 변경사항을 모든 구독자에게 전달
   - 대량 업데이트 시 성능 영향 고려

3. **2025년 업데이트**
   - 4월 4일부터 지리적 라우팅 개선
   - Realtime Settings 화면 추가 예정

## 문제 해결

### Realtime이 작동하지 않을 때
1. 테이블에 RLS가 활성화되어 있는지 확인
2. Publication에 테이블이 추가되었는지 확인
3. 클라이언트 코드에서 올바른 채널명 사용 확인

### Storage 업로드 실패 시
1. 버킷이 생성되었는지 확인
2. Storage 정책이 올바르게 설정되었는지 확인
3. 파일 크기 제한 확인 (기본 50MB)