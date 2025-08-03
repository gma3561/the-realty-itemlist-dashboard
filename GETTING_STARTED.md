# 🚀 빠른 시작 가이드

> 새로운 개발자를 위한 단계별 설정 가이드

## 📋 사전 요구사항

- **Node.js 18+** 설치
- **Git** 설치  
- **macOS** (키체인 기능 사용)
- **Google Cloud Console** 접근 권한
- **Supabase** 프로젝트 생성

## ⚡ 5분 빠른 설정

### 1️⃣ 프로젝트 클론 및 설치
```bash
# 저장소 클론
git clone [repository-url]
cd the-realty-itemlist-dashboard

# 의존성 설치
npm install
```

### 2️⃣ 환경변수 복사
```bash
# 환경변수 파일 복사
cp .env.local.example .env.local
```

### 3️⃣ Supabase 설정 확인
`.env.local` 파일에서 Supabase 설정이 올바른지 확인:
```env
VITE_SUPABASE_URL=https://qwxghpwasmvottahchky.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4️⃣ 데이터베이스 마이그레이션
```bash
# Supabase 스키마 적용
supabase db push
```

### 5️⃣ 개발 서버 시작
```bash
# 개발 서버 실행
npm run dev
```

🎉 **http://localhost:5173** 에서 확인!

## 🔐 Google Drive 연동 (선택사항)

이미지 업로드 기능을 사용하려면 Google Drive API 설정이 필요합니다.

### 준비물
- Google Cloud Console 서비스 계정 JSON 파일
- Google Drive 폴더 ID

### 설정 방법
```bash
# 키체인 설정 도구 실행
npm run keychain setup

# 설정 확인
npm run keychain status

# 연결 테스트
npm run keychain test
```

상세 가이드: [키체인 설정 가이드](docs/키체인_설정_가이드.md)

## 🛠️ 개발 도구

```bash
# 코드 품질 검사
npm run lint

# 테스트 실행
npm run test

# E2E 테스트 (Playwright)
npm run test:e2e

# 프로덕션 빌드
npm run build
```

## 📁 주요 폴더 구조

```
src/
├── components/          # React 컴포넌트
│   ├── property/       # 매물 관련
│   ├── customer/       # 고객 관리  
│   └── auth/           # 인증
├── pages/              # 페이지 컴포넌트
├── services/           # API 연동
└── utils/              # 유틸리티

docs/                   # 기획 문서
├── 팀_매물장_PRD.md     # 제품 요구사항
└── 키체인_설정_가이드.md # 보안 설정

supabase/
└── migrations/         # DB 스키마
```

## 🏠 첫 매물 등록해보기

1. **로그인**: @the-realty.co.kr 계정으로 로그인
2. **매물 등록**: 사이드바 > "매물 등록" 클릭
3. **정보 입력**: 필수 필드 입력 (매물명, 위치, 가격 등)
4. **저장**: "등록" 버튼 클릭

## ❓ 문제 해결

### 로그인이 안 돼요
- @the-realty.co.kr 도메인 확인
- Google OAuth 설정 점검

### 데이터가 안 보여요  
- Supabase 연결 상태 확인
- 브라우저 개발자 도구에서 네트워크 오류 확인

### 이미지 업로드가 안 돼요
- Google Drive API 키 설정 확인: `npm run keychain status`
- Supabase Storage 버킷 생성 확인

## 📞 도움이 필요하면

- **Slack**: #the-realty-dev 채널
- **GitHub Issues**: 버그 신고
- **문서**: [전체 문서 목록](docs/)

---

**💡 팁**: 개발 시작 전에 [팀 매물장 PRD](docs/팀_매물장_PRD.md)를 읽어보세요!