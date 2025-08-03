# 팀 매물장 - 부동산 매물 관리 시스템

[![GitHub Pages](https://img.shields.io/badge/demo-live-green)](https://gma3561.github.io/the-realty-itemlist-dashboard/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-enabled-3ECF8E)](https://supabase.com/)

부동산 중개사무소를 위한 현대적인 매물 관리 시스템입니다. Google OAuth 인증, 실시간 데이터 동기화, QA 테스트 지원을 포함한 완전한 팀 협업 플랫폼입니다.

## 🚀 주요 기능

### 📋 매물 관리
- ✅ 매물 등록, 수정, 삭제
- ✅ 실시간 매물 상태 추적
- ✅ 이미지 업로드 및 갤러리
- ✅ 권한 기반 접근 제어

### 👥 사용자 관리
- ✅ Google OAuth 로그인
- ✅ 역할 기반 권한 (관리자/사용자)
- ✅ QA 바이패스 시스템 (개발/테스트용)

### 📊 성과 분석
- ✅ 대시보드 통계
- ✅ 직원별 성과 추적
- ✅ 매물 상태 차트

### 🧪 QA 지원
- ✅ 환경별 설정 관리
- ✅ 테스트 사용자 바이패스
- ✅ 포괄적인 테스트 인프라

## 🛠️ 기술 스택

### Frontend
- **React 18** - 현대적인 UI 프레임워크
- **Vite** - 빠른 빌드 도구
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **React Router** - 클라이언트 사이드 라우팅
- **Recharts** - 반응형 차트 라이브러리

### Backend & Database
- **Supabase** - 실시간 데이터베이스 및 인증
- **Row Level Security (RLS)** - 데이터 보안
- **Google OAuth** - 안전한 로그인

### Testing & DevOps
- **Vitest** - 단위 테스트
- **Playwright** - E2E 테스트
- **GitHub Actions** - CI/CD 파이프라인
- **GitHub Pages** - 자동 배포

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/gma3561/the-realty-itemlist-dashboard.git
cd the-realty-itemlist-dashboard
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 편집하여 실제 값 입력
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173/the-realty-itemlist-dashboard/`로 접속

## 🧪 QA 테스트

개발 환경에서는 QA 바이패스 기능이 활성화되어 있습니다:

### 로그인 페이지에서 테스트
- **관리자 계정**: 모든 권한 테스트
- **일반사용자 계정**: 제한된 권한 테스트  
- **매니저 계정**: 매니저 권한 테스트

### 콘솔에서 직접 제어
```javascript
// 관리자로 로그인
window.QABypass.setUser('admin');

// 일반사용자로 로그인
window.QABypass.setUser('user');

// 바이패스 상태 확인
window.QABypass.getStatus();

// 로그아웃
window.QABypass.clearUser();
```

## 📁 프로젝트 구조

```
├── src/
│   ├── components/         # React 컴포넌트
│   │   ├── auth/          # 인증 관련
│   │   ├── common/        # 공통 컴포넌트
│   │   ├── layout/        # 레이아웃
│   │   └── property/      # 매물 관련
│   ├── pages/             # 페이지 컴포넌트
│   ├── services/          # API 서비스
│   ├── hooks/             # Custom Hooks
│   ├── context/           # React Context
│   ├── utils/             # 유틸리티
│   └── config/            # 설정 파일
├── tests/                 # 테스트 파일
│   ├── unit/              # 단위 테스트
│   ├── integration/       # 통합 테스트
│   └── e2e/              # E2E 테스트
├── docs/                  # 프로젝트 문서
└── scripts/               # 빌드/배포 스크립트
```

## 🧪 테스트

### 단위 테스트
```bash
npm run test              # 테스트 실행
npm run test:watch        # Watch 모드
npm run test:coverage     # 커버리지 포함
```

### E2E 테스트
```bash
npm run test:e2e          # E2E 테스트 실행
npm run test:e2e:ui       # UI 모드로 실행
npm run test:e2e:headed   # 브라우저 표시 모드
```

### 전체 테스트
```bash
npm run test:all          # 모든 테스트 실행
```

## 🚀 배포

### GitHub Pages 자동 배포
main 브랜치에 Push하면 자동으로 배포됩니다.

### 수동 배포
```bash
npm run build
npm run deploy
```

## 🔒 보안

- **Google OAuth** 인증
- **Row Level Security (RLS)** 적용
- **환경별 바이패스 제어** (프로덕션에서 자동 비활성화)
- **민감한 정보 로깅 방지**

## 📚 문서

- [개발자 가이드](./docs/GETTING_STARTED.md)
- [테스트 인프라](./docs/테스트_인프라_구축_완료보고서.md)
- [QA 바이패스 시스템](./docs/QA_바이패스_시스템_구현_완료보고서.md)
- [API 문서](./docs/API_문서.md)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

프로젝트 문의: [GitHub Issues](https://github.com/gma3561/the-realty-itemlist-dashboard/issues)

---

**🔥 Live Demo**: [https://gma3561.github.io/the-realty-itemlist-dashboard/](https://gma3561.github.io/the-realty-itemlist-dashboard/)