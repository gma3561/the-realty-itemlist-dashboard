# 🚀 AI 팀 시작 가이드

## 환영합니다! 👋
팀 매물장 프로젝트에 오신 것을 환영합니다. 이 가이드를 통해 빠르게 프로젝트를 이해하고 기여할 수 있습니다.

## 🔧 개발 환경 설정

### 1. 필수 도구 설치
```bash
# Node.js 18+ 설치 확인
node --version
npm --version

# Git 설정 확인
git --version
```

### 2. 프로젝트 클론 및 설정
```bash
# 프로젝트 클론
git clone https://github.com/gma3561/the-realty-itemlist-dashboard.git
cd the-realty-itemlist-dashboard

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 실제 값 입력
```

### 3. 로컬 개발 서버 실행
```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:5173/the-realty-itemlist-dashboard/
```

## 🎭 역할별 빠른 시작

### 📋 Product Owner
```bash
# PRD 문서 확인
cat docs/팀_매물장_PRD_v2.md

# 작업 보드 확인  
ls .ai-team/PO/
```

### 💻 Backend Developer
```bash
# 서비스 파일 확인
ls src/services/

# 데이터베이스 스키마 확인
cat docs/DATABASE_SCHEMA_REFERENCE.md
```

### 🎨 Frontend Developer  
```bash
# 컴포넌트 구조 확인
ls src/components/

# 페이지 구조 확인
ls src/pages/
```

### 🏗️ Service Planner
```bash
# 아키텍처 문서 확인
cat docs/API_SERVICE_REFERENCE.md

# 설정 파일 확인
ls src/config/
```

### 🎨 UI/UX Designer
```bash
# 디자인 시스템 확인
cat docs/COMPONENT_USAGE_GUIDE.md

# 스타일 파일 확인
ls src/styles/
```

### 🧪 QA Manager
```bash
# 테스트 실행
npm run test

# E2E 테스트 실행
npm run test:e2e
```

## 🔑 주요 명령어

### 개발
```bash
npm run dev          # 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 미리보기
```

### 테스트
```bash
npm run test         # 유닛 테스트
npm run test:watch   # 테스트 Watch 모드
npm run test:e2e     # E2E 테스트
npm run test:all     # 모든 테스트 실행
```

### 배포
```bash
npm run deploy       # GitHub Pages 배포
```

## 📖 필수 문서 읽기

### 1순위 (모든 역할)
- [ ] `docs/팀_매물장_PRD_v2.md` - 제품 요구사항
- [ ] `.ai-team/shared/project-overview.md` - 프로젝트 개요
- [ ] `README.md` - 기본 프로젝트 정보

### 2순위 (기술 역할)
- [ ] `docs/DATABASE_SCHEMA_REFERENCE.md` - DB 스키마
- [ ] `docs/API_SERVICE_REFERENCE.md` - API 문서
- [ ] `docs/COMPONENT_USAGE_GUIDE.md` - 컴포넌트 가이드

### 3순위 (역할별 특화)
- [ ] `docs/AUTH_SYSTEM_REFERENCE.md` - 인증 시스템
- [ ] `docs/QA_바이패스_시스템_구현_완료보고서.md` - QA 시스템

## 🚨 QA 테스트 바이패스

개발 환경에서는 간편한 테스트를 위해 QA 바이패스 기능을 제공합니다:

```javascript
// 브라우저 콘솔에서 실행
// 관리자로 로그인
window.QABypass.setUser('admin');

// 일반사용자로 로그인  
window.QABypass.setUser('user');

// 상태 확인
window.QABypass.getStatus();

// 로그아웃
window.QABypass.clearUser();
```

## 🔗 중요 링크

- **Live Demo**: https://gma3561.github.io/the-realty-itemlist-dashboard/
- **GitHub Repo**: https://github.com/gma3561/the-realty-itemlist-dashboard
- **Supabase Dashboard**: [환경변수에서 확인]
- **AI Team Workspace**: `.ai-team/` 디렉토리

## 🆘 도움이 필요하다면

### 1. 문서 검색
```bash
# 키워드로 문서 검색
grep -r "검색어" docs/
```

### 2. 코드 검색  
```bash
# 함수나 컴포넌트 찾기
grep -r "함수명" src/
```

### 3. 이슈 확인
- GitHub Issues에서 기존 문제점 확인
- `.ai-team/` 디렉토리의 역할별 가이드 참조

## ✅ 체크리스트

첫 기여 전 확인사항:
- [ ] 개발 환경 설정 완료
- [ ] 로컬에서 앱 정상 실행 확인
- [ ] 역할별 온보딩 가이드 읽기
- [ ] 테스트 실행 성공
- [ ] QA 바이패스 기능 테스트

## 🎉 성공! 

환경 설정이 완료되었다면 역할별 워크스페이스(`.ai-team/{역할}/`)로 이동하여 구체적인 작업을 시작하세요!

---

**문서 버전**: 1.0  
**최종 수정**: 2025-08-03 