# 부동산 대시보드 QA 테스트 문서

## 📋 개요

이 문서는 부동산 대시보드 애플리케이션의 종합적인 QA 테스트 시스템에 대해 설명합니다. 이 시스템은 Playwright를 기반으로 구축되었으며, 자동화된 테스트를 통해 애플리케이션의 품질을 보장합니다.

## 🏗️ 테스트 아키텍처

### 테스트 구성 요소

1. **종합 QA 테스트 (`comprehensive-qa-suite.spec.js`)**
   - 성능 및 로딩 테스트
   - 인증 및 접근 제어 테스트
   - UI 컴포넌트 및 레이아웃 테스트
   - 네비게이션 및 라우팅 테스트
   - 데이터 및 기능 테스트
   - 에러 처리 및 안정성 테스트
   - 접근성 테스트
   - 보안 테스트

2. **시각적 회귀 테스트 (`visual-regression.spec.js`)**
   - 모든 페이지의 스크린샷 비교
   - 다양한 뷰포트 (Desktop, Laptop, Tablet, Mobile)
   - 컴포넌트 수준 시각적 테스트
   - 인터랙션 상태 테스트

3. **기능 테스트 (`functional-tests.spec.js`)**
   - 대시보드 기능
   - 매물 관리 기능
   - 사용자 관리 기능
   - 고객 관리 기능
   - 네비게이션 기능
   - 검색 기능
   - 반응형 동작
   - 데이터 입출력
   - 에러 처리
   - 성능 최적화

## 🚀 시작하기

### 사전 요구사항

- Node.js 14.0 이상
- npm 또는 yarn

### 설치

1. 프로젝트 의존성 설치:
```bash
npm install
```

2. Playwright 브라우저 설치:
```bash
npm run playwright:install
```

## 🧪 테스트 실행

### 모든 QA 테스트 실행

```bash
npm run test:qa
```

이 명령어는 모든 테스트 스위트를 순차적으로 실행하고 통합 리포트를 생성합니다.

### 개별 테스트 스위트 실행

```bash
# 종합 QA 테스트만 실행
npm run test:qa:comprehensive

# 시각적 회귀 테스트만 실행
npm run test:qa:visual

# 기능 테스트만 실행
npm run test:qa:functional
```

### 대화형 UI 모드로 실행

```bash
npm run test:qa:ui
```

### 디버그 모드로 실행

```bash
npm run test:qa:debug
```

## 📊 테스트 리포트

테스트 실행 후 다음 위치에서 리포트를 확인할 수 있습니다:

- **통합 리포트**: `test-results/index.html`
- **종합 QA 리포트**: `test-results/comprehensive-qa-report.html`
- **시각적 회귀 리포트**: `test-results/visual-regression/report.html`
- **기능 테스트 리포트**: `test-results/functional/functional-test-report.html`

### 리포트 내용

1. **통합 리포트**
   - 전체 테스트 요약
   - 각 테스트 스위트별 성공률
   - 상세 리포트 링크

2. **종합 QA 리포트**
   - 성능 메트릭 (로딩 시간, LCP, FCP 등)
   - UI 요소 검증 결과
   - 접근성 검사 결과
   - 보안 검사 결과

3. **시각적 회귀 리포트**
   - 베이스라인과 현재 스크린샷 비교
   - 시각적 차이 하이라이트
   - 새로운 베이스라인 표시

4. **기능 테스트 리포트**
   - 각 기능별 테스트 결과
   - 통과/실패/건너뜀 상태
   - 상세 오류 메시지

## 🎯 테스트 범위

### 페이지별 테스트 범위

| 페이지 | 테스트 항목 |
|--------|------------|
| 대시보드 | 통계 표시, 차트 렌더링, 빠른 작업 링크 |
| 매물 관리 | 목록 조회, 필터링, 상세 보기, 등록 폼 |
| 사용자 관리 | 목록 조회, 권한 관리 |
| 고객 관리 | 목록 조회, 등록 폼 |
| 설정 | 설정 항목 표시 및 변경 |

### 크로스 브라우저 테스트

- Chrome/Chromium
- Firefox
- Safari (WebKit)
- Edge
- Mobile Chrome
- Mobile Safari

### 반응형 테스트

| 디바이스 | 해상도 |
|----------|--------|
| Desktop | 1920x1080 |
| Laptop | 1366x768 |
| Tablet | 768x1024 |
| Mobile | 375x812 |

## 🔧 테스트 구성

### playwright.config.js

주요 설정:
- `baseURL`: 테스트 대상 URL
- `timeout`: 테스트 타임아웃 설정
- `retries`: 실패 시 재시도 횟수
- `workers`: 병렬 실행 워커 수

### 환경 변수

```bash
# 테스트 사용자 정보
TEST_USER_EMAIL=jenny@the-realty.co.kr
TEST_USER_PASSWORD=admin123!

# 테스트 환경
NODE_ENV=test
```

## 🐛 문제 해결

### 일반적인 문제

1. **브라우저 설치 오류**
   ```bash
   npx playwright install --with-deps
   ```

2. **타임아웃 오류**
   - `playwright.config.js`에서 타임아웃 값 증가
   - 네트워크 연결 확인

3. **시각적 회귀 테스트 실패**
   - UI 변경이 의도적인 경우, 베이스라인 업데이트 필요
   - `test-results/visual-regression/baseline` 디렉토리의 이미지 확인

## 📈 CI/CD 통합

### GitHub Actions 예시

```yaml
name: QA Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright browsers
      run: npm run playwright:install
      
    - name: Run QA tests
      run: npm run test:qa
      
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test-results/
```

## 🎯 베스트 프랙티스

1. **테스트 작성**
   - 명확하고 설명적인 테스트 이름 사용
   - 각 테스트는 독립적으로 실행 가능해야 함
   - 적절한 대기 조건 사용 (명시적 대기 선호)

2. **테스트 데이터**
   - 테스트용 더미 데이터 사용
   - 프로덕션 데이터 사용 금지
   - 테스트 후 데이터 정리

3. **디버깅**
   - `page.screenshot()` 활용
   - `page.pause()` 로 실행 일시정지
   - 브라우저 개발자 도구 활용

## 📝 추가 리소스

- [Playwright 공식 문서](https://playwright.dev/)
- [Playwright 베스트 프랙티스](https://playwright.dev/docs/best-practices)
- [시각적 회귀 테스트 가이드](https://playwright.dev/docs/test-snapshots)

## 🤝 기여 가이드

1. 새로운 테스트 추가 시:
   - 적절한 테스트 스위트에 추가
   - 테스트 설명 명확히 작성
   - 성공/실패 조건 명시

2. 버그 리포트:
   - 재현 가능한 단계 제공
   - 스크린샷 첨부
   - 환경 정보 포함

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:
- Issue 트래커 사용
- 테스트 로그 첨부
- 환경 정보 제공