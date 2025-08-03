# 팀 매물장 관리 시스템 v2.0

> 부동산 중개사무소를 위한 Google Drive 하이브리드 매물 관리 플랫폼

## 🎯 프로젝트 개요

**The Realty Dashboard**는 부동산 중개사무소의 팀 매물 공유를 위한 통합 관리 시스템입니다.

### 주요 특징
- 🔐 **@the-realty.co.kr 도메인 전용** Google OAuth 로그인
- 📱 **반응형 PWA** - 모바일/데스크톱 지원  
- 🏠 **매물 관리** - 등록, 수정, 검색, 필터링
- 👥 **고객 관리** - 문의 이력 및 상담 관리
- 📊 **실시간 대시보드** - 팀 성과 및 통계
- 🖼️ **Google Drive 하이브리드 이미지 관리** - 5TB 활용
- 🔗 **보안 외부 공유** - 고객용 링크 생성

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 저장소 클론
git clone [repository-url]
cd the-realty-itemlist-dashboard

# 의존성 설치  
npm install

# 환경변수 설정
cp .env.example .env.local
```

### 2. 데이터베이스 설정
```bash
# Supabase 마이그레이션 실행
supabase db push
```

### 3. Google Drive API 설정
```bash
# 키체인에 API 키 저장 (보안)
npm run keychain setup

# 설정 확인
npm run keychain status
```

### 4. 개발 서버 시작
```bash
npm run dev
```

## 📁 프로젝트 구조

```
the-realty-itemlist-dashboard/
├── 📋 docs/                    # 기획 및 설계 문서
│   ├── 팀_매물장_PRD.md         # 제품 요구사항 문서
│   ├── Google_Drive_하이브리드_시스템_설계.md
│   └── 키체인_설정_가이드.md
│
├── 🔧 src/                     # 소스 코드
│   ├── components/             # React 컴포넌트
│   │   ├── property/          # 매물 관련 컴포넌트
│   │   ├── customer/          # 고객 관리 컴포넌트
│   │   └── auth/              # 인증 컴포넌트
│   ├── services/              # API 서비스
│   │   ├── googleDriveService.js    # Google Drive 연동
│   │   ├── imageUploadService.js    # 하이브리드 이미지 업로드
│   │   └── shareService.js          # 외부 공유 기능
│   ├── pages/                 # 페이지 컴포넌트
│   └── utils/                 # 유틸리티
│       └── keychainManager.js # 키체인 보안 관리
│
├── 🗄️ supabase/               # 데이터베이스
│   └── migrations/            # DB 스키마 마이그레이션
│
├── 📝 scripts/                # 유틸리티 스크립트
│   └── setup-keychain.js      # 키체인 설정 도구
│
└── 🎨 public/                 # 정적 파일
```

## 🔑 보안 설정

### Google Drive API 키 관리 (키체인)
```bash
# 대화형 키 설정
npm run keychain setup

# 키 상태 확인  
npm run keychain status

# 연결 테스트
npm run keychain test

# 키 삭제
npm run keychain clear
```

### 필요한 Google Cloud 설정
1. Google Cloud Console에서 프로젝트 생성
2. Google Drive API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. Google Drive 폴더 구조 생성 및 권한 부여

상세 가이드: [키체인 설정 가이드](docs/키체인_설정_가이드.md)

## 🛠️ 주요 기능

### 매물 관리
- ✅ 매물 등록/수정/삭제
- ✅ 거래유형별 가격 필드 (매매/전세/월세)
- ✅ 실시간 검색 및 필터링
- ✅ 매물 상태 관리 (광고중/거래완료 등)
- 🔄 **NEW**: Google Drive 하이브리드 이미지 관리

### 고객 관리  
- ✅ 고객 등록 및 문의 이력 관리
- ✅ 상담 상태 추적 (관심→상담중→계약진행→거래완료)
- ✅ 중복 고객 자동 감지
- ✅ 담당자별 고객 관리

### 보안 및 권한
- ✅ Google OAuth (@the-realty.co.kr 도메인 제한)
- ✅ Row Level Security (RLS) 적용
- ✅ 담당자별 매물/고객 접근 제어
- 🔄 **NEW**: 키체인 기반 API 키 관리

### 외부 공유
- 🆕 보안 공유 링크 생성
- 🆕 권한별 정보 제어 (연락처/가격 숨김 가능)
- 🆕 만료일 및 조회수 제한
- 🆕 고화질 이미지 포함 옵션

## 📊 기술 스택

### Frontend
- **React 18** + **Vite** - 모던 개발 환경
- **TailwindCSS** - 유틸리티 기반 스타일링
- **React Query** - 서버 상태 관리
- **PWA** - 모바일 앱 경험

### Backend & Database  
- **Supabase** - PostgreSQL + 실시간 업데이트
- **Row Level Security (RLS)** - 데이터 보안
- **Google Drive API** - 하이브리드 이미지 저장

### 개발 도구
- **Playwright** - E2E 테스트
- **ESLint** - 코드 품질 관리
- **GitHub Actions** - CI/CD

## 🔄 하이브리드 이미지 저장 시스템

```
사용자 업로드
    ↓
┌─ 썸네일(400x300) → Supabase Storage (빠른 로딩용)
└─ 원본 이미지 → Google Drive (무제한 저장)
    ↓
DB에 양쪽 URL 저장
```

- **썸네일 (400x300)** → Supabase Storage (빠른 로딩)
- **원본 이미지** → Google Drive (5TB 활용)
- **메타데이터** → PostgreSQL (검색 및 관리)

## 📱 배포 및 운영

### 개발 환경
```bash
npm run dev          # 개발 서버
npm run test         # 테스트 실행
npm run lint         # 코드 검사
```

### 프로덕션 배포
```bash
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 미리보기
npm run deploy       # GitHub Pages 배포
```

### 모니터링
- **실시간 에러 추적** - Supabase 로그
- **성능 모니터링** - Lighthouse CI
- **접근 로그** - 공유 링크 통계

## 🆘 문제 해결

### 자주 발생하는 문제

**1. Google Drive 연결 오류**
```bash
npm run keychain test  # 키 설정 확인
```

**2. Supabase 연결 문제**  
- `.env.local` 파일의 SUPABASE_URL 확인
- RLS 정책 적용 상태 점검

**3. 이미지 업로드 실패**
- Supabase Storage 버킷 생성 확인
- Google Drive 폴더 권한 점검

## 🤝 기여 가이드

### 개발 프로세스
1. 기능 브랜치 생성 (`feature/새기능명`)
2. 코드 작성 및 테스트
3. Pull Request 생성
4. 코드 리뷰 후 머지

### 코드 스타일
- ESLint 규칙 준수
- 컴포넌트명은 PascalCase
- 파일명은 camelCase 또는 kebab-case

## 📞 지원

- **프로젝트 관리자**: [이름]
- **기술 문의**: [이메일]
- **버그 리포트**: GitHub Issues

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

---

**© 2024 The Realty Dashboard. 부동산 중개사무소 전용 팀 매물장 관리 시스템.**