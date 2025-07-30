# 더부동산 통합 관리 시스템 설정 안내

이 문서는 더부동산 통합 관리 시스템의 초기 설정 및 테스트 방법을 안내합니다.

## 1. 환경 설정

### 1.1. 필수 소프트웨어
- Node.js 14.x 이상
- npm 7.x 이상
- Supabase 계정 및 프로젝트

### 1.2. 환경 변수 설정
`.env.local` 파일을 프로젝트 루트에 생성하고 다음 환경 변수를 설정하세요:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. 데이터베이스 설정

### 2.1. 마이그레이션 파일 실행
Supabase에서 다음 마이그레이션 파일을 순서대로 실행하세요:

1. `supabase/migrations/20250727000000_initial_schema.sql`
2. `supabase/migrations/20250727000001_initial_data.sql`
3. `supabase/migrations/20250728000000_modify_schema.sql`
4. `supabase/migrations/20250730000000_extended_schema.sql`
5. `supabase/migrations/20250730000001_lookup_data.sql`

마이그레이션 파일은 Supabase 대시보드의 SQL 편집기에서 실행하거나, Supabase CLI를 사용하여 실행할 수 있습니다.

### 2.2. 테스트 데이터 생성

테스트 데이터를 생성하기 위해 다음 스크립트를 실행하세요:

```bash
# 의존성 설치
npm install @supabase/supabase-js dotenv

# 연결 테스트
node scripts/check_connection.js

# 더미 데이터 생성
node scripts/generate_dummy_data.js
```

## 3. 웹 연결 테스트

### 3.1. 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 3.2. 로그인 테스트

더미 데이터에서 생성된 계정으로 로그인할 수 있습니다:

- 관리자: admin@the-realty.co.kr / admin123!
- 직원1: employee1@the-realty.co.kr / employee1!
- 직원2: employee2@the-realty.co.kr / employee2!

### 3.3. 기능 테스트

다음 기능이 정상적으로 작동하는지 확인하세요:

1. 로그인 및 인증
2. 대시보드 통계 및 차트 표시
3. 매물 목록 조회
4. 매물 등록 및 수정
5. 권한에 따른 접근 제한

## 4. 문제 해결

### 4.1. 데이터베이스 연결 오류
- `.env.local` 파일의 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- `scripts/check_connection.js` 스크립트를 실행하여 세부 오류 확인

### 4.2. 테이블 스키마 오류
- 마이그레이션 파일이 올바른 순서로 실행되었는지 확인
- Supabase 대시보드에서 테이블 구조 확인

### 4.3. 인증 오류
- Supabase 대시보드에서 인증 설정 확인
- 이메일 확인 설정 해제 여부 확인 (개발 환경)

## 5. 배포 안내

### 5.1. GitHub Pages 배포

```bash
# 빌드
npm run build

# 배포
npm run deploy
```

### 5.2. 환경 변수 설정
GitHub Pages 배포 시 다음 환경 변수를 GitHub Secrets에 설정하세요:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 6. 추가 자료

- [Supabase 문서](https://supabase.com/docs)
- [React 문서](https://reactjs.org/docs/getting-started.html)
- [TailwindCSS 문서](https://tailwindcss.com/docs)