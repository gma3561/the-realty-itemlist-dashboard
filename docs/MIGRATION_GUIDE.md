# Supabase 마이그레이션 가이드

## 📋 사전 준비 사항

1. **Supabase 프로젝트 생성**
   - [Supabase Dashboard](https://app.supabase.com)에서 새 프로젝트 생성
   - 프로젝트 URL과 API 키 확인

2. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   cp .env.example .env
   ```
   
   `.env` 파일에 다음 정보 입력:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **필수 패키지 설치**
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

## 🚀 마이그레이션 실행 단계

### 1단계: 스키마 마이그레이션

Supabase SQL Editor에서 다음 순서로 마이그레이션 실행:

```bash
# 순서대로 실행
1. 20250727000000_initial_schema.sql
2. 20250727000001_initial_data.sql
3. 20250728000000_modify_schema.sql
4. 20250730000000_extended_schema.sql
5. 20250730000001_lookup_data.sql
6. 20250802000000_enhanced_rls_policies.sql
7. 20250804000000_google_drive_hybrid.sql
8. 20250805000000_create_users_table.sql
```

### 2단계: 데이터 마이그레이션

```bash
# 마이그레이션 스크립트 실행
node scripts/migrate_to_supabase.js
```

## 📊 마이그레이션 데이터 구조

### 사용자 계정
- 13명의 직원 계정 자동 생성
- 임시 비밀번호: `TheRealty2025!`
- 역할 구분: admin (정연서), staff (나머지)

### 매물 데이터
- 총 1,468개 매물 자동 이전
- 기존 담당자 유지
- 미배정 매물은 정연서(대표)에게 자동 배정

## ✅ 마이그레이션 후 확인 사항

1. **Supabase Dashboard에서 확인**
   - Authentication > Users: 13명 직원 계정 생성 확인
   - Table Editor > properties: 1,468개 매물 데이터 확인

2. **권한 테스트**
   ```sql
   -- 관리자 권한 확인
   SELECT * FROM public.users WHERE role = 'admin';
   
   -- 매물 수 확인
   SELECT COUNT(*) FROM public.properties;
   
   -- 담당자별 매물 수
   SELECT u.name, COUNT(p.id) as property_count
   FROM public.users u
   LEFT JOIN public.properties p ON u.id = p.manager_id
   GROUP BY u.name
   ORDER BY property_count DESC;
   ```

3. **RLS 정책 확인**
   - 관리자는 모든 데이터 접근 가능
   - 일반 직원은 본인 담당 매물만 편집 가능

## 🔧 문제 해결

### 사용자 생성 실패
- 이메일 형식 확인 (@the-realty.co.kr)
- Service Role Key 권한 확인

### 매물 데이터 이전 실패
- UUID 중복 확인
- 필수 필드 누락 확인
- 외래키 제약 조건 확인

## 📝 다음 단계

1. **비밀번호 변경 안내**
   - 모든 직원에게 임시 비밀번호 전달
   - 첫 로그인 시 비밀번호 변경 요청

2. **애플리케이션 연동**
   - Supabase 클라이언트 설정
   - 인증 플로우 구현
   - 실시간 구독 설정

3. **백업 설정**
   - Supabase 자동 백업 활성화
   - 정기적인 데이터 내보내기 일정 수립