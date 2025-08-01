# 팀 매물장 관리 시스템

부동산 중개사무소를 위한 통합 매물 관리 플랫폼입니다. 팀원 간 매물 정보를 효율적으로 공유하고 관리할 수 있는 대시보드를 제공합니다.

## 프로젝트 개요

약 15명의 부동산 중개인이 사용할 수 있는 팀 매물장 관리 시스템으로, PWA를 지원하여 모바일에서도 편리하게 사용할 수 있습니다.

## 주요 기능

- 🏢 **매물 관리**: 체계적인 매물 등록, 조회, 수정, 삭제
- 🔍 **검색 및 필터링**: 지역, 매물종류, 매물명, 가격대별 필터링
- 📊 **통계 대시보드**: 등록 매물 수, 관리자별 계약 수 등 통계
- 👥 **권한 관리**: 관리자 및 일반 사용자 권한 구분
- 📱 **PWA 지원**: 모바일에서도 편리하게 사용 가능
- 📝 **매물 상세 정보**: 담당자, 소유주, 매물 특성 등 체계적 관리

## 기술 스택

### 프론트엔드
- React
- TailwindCSS
- React Router
- React Query
- Recharts (데이터 시각화)
- Formik & Yup (폼 관리)

### 백엔드
- Supabase (인증, 데이터베이스, 스토리지)
- PostgreSQL

### 개발 도구
- Vite
- ESLint
- Vitest

## 시작하기

상세한 설치 및 개발 환경 설정 방법은 [SETUP.md](./SETUP.md) 문서를 참고하세요.

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/username/the-realty-itemlist-dashboard.git
cd the-realty-itemlist-dashboard

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 환경 변수를 설정하세요:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
│   └── index.jsx               # 진입점
└── docs/                       # 문서
```

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run preview`: 빌드된 앱 미리보기
- `npm run lint`: 코드 린팅
- `npm run test`: 테스트 실행
- `npm run deploy`: GitHub Pages에 배포

## 상세 문서

더 자세한 내용은 다음 문서를 참고하세요:

- [기획서](./docs/팀_매물장_기획서.md)
- [PRD (제품 요구사항 문서)](./docs/팀_매물장_PRD.md)
- [프로젝트 구조 설계](./docs/프로젝트_구조_설계.md)
- [매칭 구조 설계](./docs/매칭_구조_설계.md)
- [초기 데이터 설정](./docs/초기_데이터_설정.md)
- [CSV 마이그레이션 문제점 분석](./docs/CSV_마이그레이션_문제점_분석.md)
- [상세 디렉토리 구성 및 UI 설계](./docs/상세_디렉토리_구성_및_UI_설계.md) 
