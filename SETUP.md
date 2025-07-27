# 팀 매물장 프로젝트 개발 환경 설정 가이드

이 문서는 팀 매물장 관리 시스템의 개발 환경 설정 및 실행 방법에 대한 가이드입니다.

## 필수 요구사항

- Node.js 18.0.0 이상
- npm 8.0.0 이상
- Supabase 계정 (무료 계획으로 시작 가능)

## 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/username/the-realty-itemlist-dashboard.git
cd the-realty-itemlist-dashboard
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 프로젝트 설정

1. [Supabase 웹사이트](https://supabase.com/)에서 계정을 생성하고 로그인합니다.
2. 새 프로젝트를 생성합니다.
3. 생성된 프로젝트의 `Settings > API` 메뉴에서 `Project URL`과 `anon/public` 키를 확인합니다.

### 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. 데이터베이스 스키마 설정

Supabase Studio의 SQL 에디터에서 다음 파일의 SQL 스크립트를 실행합니다:

1. `supabase/migrations/20250727000000_initial_schema.sql` - 기본 스키마 생성
2. `supabase/migrations/20250727000001_initial_data.sql` - 초기 데이터 설정

이 스크립트는 필요한 테이블과 관계, RLS 정책, 트리거를 설정하고 기본 코드 데이터를 추가합니다.

### 6. Google OAuth 설정 (선택적)

Google 로그인을 사용하려면 다음 단계를 수행합니다:

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트를 생성합니다.
2. `APIs & Services > OAuth consent screen`에서 동의 화면을 설정합니다.
3. `APIs & Services > Credentials`에서 OAuth 2.0 클라이언트 ID를 생성합니다.
   - 승인된 자바스크립트 출처: `http://localhost:5173`
   - 승인된 리디렉션 URI: `http://localhost:5173/auth/callback`
4. Supabase 프로젝트의 `Authentication > Providers > Google`에서 Google OAuth를 활성화합니다.
   - 클라이언트 ID와 클라이언트 시크릿을 입력합니다.
   - `Domains with auth redirects allowed`: `localhost`

## 개발 서버 실행

```bash
npm run dev
```

이 명령어는 Vite 개발 서버를 시작합니다. 기본적으로 `http://localhost:5173`에서 접근 가능합니다.

## 빌드 및 배포

### 프로덕션 빌드 생성

```bash
npm run build
```

빌드된 파일은 `dist` 디렉토리에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

### 배포

배포 전 환경 변수와 Supabase 설정을 확인하세요.

```bash
npm run deploy
```

## 프로젝트 구조

```
the-realty-itemlist-dashboard/
├── public/                     # 정적 파일
├── src/                        # 소스 코드
│   ├── components/             # 재사용 가능한 컴포넌트
│   ├── pages/                  # 페이지 컴포넌트
│   ├── context/                # Context API
│   ├── hooks/                  # 커스텀 훅
│   ├── services/               # API 및 서비스
│   ├── utils/                  # 유틸리티 함수
│   ├── styles/                 # 스타일 관련 파일
│   ├── App.jsx                 # 앱 컴포넌트
│   └── main.jsx                # 진입점
├── supabase/                   # Supabase 관련 파일
│   └── migrations/             # SQL 마이그레이션 스크립트
├── docs/                       # 문서
└── ...
```

## 개발 가이드라인

### 코드 컨벤션

- **컴포넌트**: PascalCase 사용 (예: `PropertyCard.jsx`)
- **함수 및 변수**: camelCase 사용
- **파일 및 디렉토리**: 케밥 케이스(kebab-case) 사용 (예: `property-card`)
- **CSS 클래스**: TailwindCSS 사용

### 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- 기능 브랜치: `feature/feature-name`
- 버그 수정 브랜치: `fix/bug-name`

### 커밋 메시지 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 변경 (포맷팅, 세미콜론 누락 등)
refactor: 코드 리팩토링
test: 테스트 코드 추가 또는 수정
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 문제 해결

### 공통 문제

1. **Supabase 연결 오류**
   - 환경 변수가 올바르게 설정되었는지 확인
   - Supabase 프로젝트가 활성 상태인지 확인

2. **Google 로그인 오류**
   - OAuth 설정 확인
   - 허용된 도메인 및 리디렉션 URI 확인

3. **빌드 오류**
   - `npm ci`로 클린 설치 시도
   - Node.js 버전 확인

## 추가 자료

더 자세한 내용은 다음 문서를 참고하세요:

- [기획서](./docs/팀_매물장_기획서.md)
- [PRD (제품 요구사항 문서)](./docs/팀_매물장_PRD.md)
- [프로젝트 구조 설계](./docs/프로젝트_구조_설계.md)
- [매칭 구조 설계](./docs/매칭_구조_설계.md)
- [초기 데이터 설정](./docs/초기_데이터_설정.md)
- [CSV 마이그레이션 문제점 분석](./docs/CSV_마이그레이션_문제점_분석.md)
- [상세 디렉토리 구성 및 UI 설계](./docs/상세_디렉토리_구성_및_UI_설계.md)