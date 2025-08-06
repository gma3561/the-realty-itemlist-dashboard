# 🧪 QA Manager 온보딩 가이드

## 환영합니다! 👋
팀 매물장 프로젝트의 QA Manager로 오신 것을 환영합니다. 이 가이드를 통해 품질 관리 프로세스를 빠르게 파악하고 효과적인 테스트를 수행할 수 있습니다.

## 🎯 역할 개요

### 주요 책임
- **테스트 계획 수립** 및 테스트 시나리오 작성
- **자동화 테스트** (Unit, Integration, E2E) 관리
- **품질 보증** 및 배포 프로세스 관리
- **보안 테스트** 및 성능 테스트
- **버그 추적** 및 해결 프로세스 관리

### 현재 진행 중인 주요 작업
1. 고객 관리 기능 테스트 (우선순위 1)
2. 성능 테스트 자동화 (우선순위 2)
3. 보안 테스트 강화

## 🏗️ 테스트 환경 아키텍처

### 테스트 스택
```
Testing Infrastructure
├── Vitest (단위 테스트)
├── @testing-library/react (컴포넌트 테스트)
├── Playwright (E2E 테스트)
├── GitHub Actions (CI/CD)
└── QA 바이패스 시스템 (개발/테스트용)
```

### 환경 구성
```
Development Environment
├── localhost:5173 (개발 서버)
├── QA Bypass System (테스트 계정)
├── Supabase Test Data
└── Mock Services

Production Environment  
├── GitHub Pages (운영 배포)
├── Supabase Production DB
├── Real User Data
└── Performance Monitoring
```

## 🔧 테스트 환경 설정

### 1. 로컬 테스트 환경
```bash
# 프로젝트 클론 및 설정
git clone https://github.com/gma3561/the-realty-itemlist-dashboard.git
cd the-realty-itemlist-dashboard
npm install

# 테스트 실행
npm run test          # 단위 테스트
npm run test:watch    # Watch 모드
npm run test:e2e      # E2E 테스트
npm run test:all      # 모든 테스트
```

### 2. QA 바이패스 시스템 활용
```javascript
// 브라우저 콘솔에서 테스트 계정 설정
// 관리자 권한 테스트
window.QABypass.setUser('admin');

// 일반사용자 권한 테스트  
window.QABypass.setUser('user');

// 매니저 권한 테스트
window.QABypass.setUser('manager');

// 현재 상태 확인
window.QABypass.getStatus();

// 로그아웃
window.QABypass.clearUser();
```

### 3. 테스트 데이터 관리
```bash
# 테스트 데이터 생성 스크립트
node create-sample-properties.js

# 테스트 사용자 설정
node setup-real-users.js

# 데이터베이스 초기화 (개발용)
node reset-database-clean.js
```

## 📋 현재 테스트 현황

### ✅ 완료된 테스트 영역

#### 단위 테스트 (Vitest)
- 서비스 함수 테스트 (80% 커버리지)
- 유틸리티 함수 테스트 (90% 커버리지)
- 컴포넌트 단위 테스트 (60% 커버리지)

#### 통합 테스트
- API 연동 테스트 (완료)
- 인증 시스템 테스트 (완료)
- 매물 관리 플로우 테스트 (완료)

#### E2E 테스트 (Playwright)
- 로그인/로그아웃 플로우
- 매물 등록/수정/삭제 플로우
- 대시보드 렌더링 테스트
- 권한 기반 접근 제어 테스트

### 🔄 진행 중인 테스트 작업

#### 1. 고객 관리 테스트 (우선순위 1)
```javascript
// 테스트 시나리오 (작성 완료)
✅ 고객 등록 플로우
✅ 고객 정보 수정 플로우  
✅ 고객 중복 체크 검증
📋 고객 삭제 플로우 (대기)
📋 고객-매물 연결 테스트 (대기)

// 현재 상태: 시나리오 작성 완료, 구현 대기 중
```

#### 2. 성능 테스트 (우선순위 2)
```javascript
// 성능 기준
- 페이지 로딩: 2초 이하
- API 응답: 1초 이하  
- 이미지 로딩: 3초 이하
- 대량 데이터 렌더링: 매끄러운 스크롤

// 현재 진행: 자동화 스크립트 작성 중
```

### 🚧 개선이 필요한 영역

#### 1. 테스트 커버리지 향상
```javascript
// 현재 커버리지
- 전체: 75%
- 컴포넌트: 60%
- 서비스: 80%
- 유틸리티: 90%

// 목표: 80% 이상
```

#### 2. 보안 테스트 강화
```javascript
// 보안 테스트 체크리스트
- [ ] SQL Injection 방지
- [ ] XSS 공격 방지
- [ ] CSRF 토큰 검증
- [ ] 권한 우회 시도 테스트
- [ ] 민감 정보 노출 검사
```

## 🛠️ 테스트 가이드

### 1. 단위 테스트 작성

#### 컴포넌트 테스트
```javascript
// CustomerForm.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import CustomerForm from './CustomerForm';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CustomerForm', () => {
  test('고객 정보를 올바르게 입력할 수 있다', async () => {
    const mockOnSuccess = jest.fn();
    
    renderWithProviders(
      <CustomerForm onSuccess={mockOnSuccess} />
    );

    // 폼 입력
    fireEvent.change(screen.getByLabelText('고객명'), {
      target: { value: '홍길동' }
    });
    fireEvent.change(screen.getByLabelText('전화번호'), {
      target: { value: '010-1234-5678' }
    });

    // 저장 버튼 클릭
    fireEvent.click(screen.getByText('저장'));

    // 성공 콜백 호출 확인
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('필수 항목 누락 시 에러 메시지를 표시한다', async () => {
    renderWithProviders(<CustomerForm />);

    // 빈 폼으로 저장 시도
    fireEvent.click(screen.getByText('저장'));

    // 에러 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('고객명은 필수입니다')).toBeInTheDocument();
    });
  });
});
```

#### 서비스 테스트
```javascript
// customerService.test.js
import { customerService } from './customerService';

// Mock Supabase
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      insert: jest.fn(() => Promise.resolve({ data: [{}], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [{}], error: null })),
      delete: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('customerService', () => {
  test('고객을 성공적으로 생성한다', async () => {
    const customerData = {
      name: '홍길동',
      phone: '010-1234-5678',
      email: 'hong@example.com',
    };

    const result = await customerService.createCustomer(customerData);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('중복 전화번호 검증이 작동한다', async () => {
    // 기존 고객 Mock
    const existingCustomer = { id: 1, phone: '010-1234-5678' };
    
    const result = await customerService.createCustomer({
      name: '김철수',
      phone: '010-1234-5678', // 중복 번호
      email: 'kim@example.com',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('이미 등록된 전화번호');
  });
});
```

### 2. E2E 테스트 작성

#### 고객 관리 플로우 테스트
```javascript
// tests/customer-management.spec.js
import { test, expect } from '@playwright/test';

test.describe('고객 관리', () => {
  test.beforeEach(async ({ page }) => {
    // QA 바이패스로 관리자 로그인
    await page.goto('/');
    await page.evaluate(() => {
      window.QABypass.setUser('admin');
    });
    await page.reload();
  });

  test('고객 등록 플로우', async ({ page }) => {
    // 고객 관리 페이지로 이동
    await page.goto('/customers');
    
    // 고객 등록 버튼 클릭
    await page.click('text=고객 등록');
    
    // 폼 작성
    await page.fill('[name="name"]', '테스트 고객');
    await page.fill('[name="phone"]', '010-9999-8888');
    await page.fill('[name="email"]', 'test@example.com');
    
    // 저장
    await page.click('button[type="submit"]');
    
    // 성공 메시지 또는 목록 페이지 확인
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('고객 목록 조회 및 검색', async ({ page }) => {
    await page.goto('/customers');
    
    // 목록이 로드되는지 확인
    await expect(page.locator('.customer-list')).toBeVisible();
    
    // 검색 기능 테스트
    await page.fill('[placeholder="고객 검색"]', '홍길동');
    await page.keyboard.press('Enter');
    
    // 검색 결과 확인
    await expect(page.locator('text=홍길동')).toBeVisible();
  });

  test('권한 기반 접근 제어', async ({ page }) => {
    // 일반 사용자로 변경
    await page.evaluate(() => {
      window.QABypass.setUser('user');
    });
    await page.reload();
    
    await page.goto('/customers');
    
    // 일반 사용자는 고객 정보 제한 확인
    const adminButton = page.locator('text=고객 삭제');
    await expect(adminButton).not.toBeVisible();
  });
});
```

#### 성능 테스트
```javascript
// tests/performance.spec.js
import { test, expect } from '@playwright/test';

test.describe('성능 테스트', () => {
  test('페이지 로딩 속도 측정', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/properties');
    
    // 메인 콘텐츠가 로드될 때까지 대기
    await page.waitForSelector('.property-list');
    
    const loadTime = Date.now() - startTime;
    
    // 2초 이하 로딩 기준
    expect(loadTime).toBeLessThan(2000);
  });

  test('대량 데이터 렌더링 성능', async ({ page }) => {
    await page.goto('/properties');
    
    // 많은 매물이 있는 상태에서 스크롤 테스트
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(100);
    }
    
    // 스크롤이 매끄러운지 확인 (프레임 드롭 없이)
    const isSmooth = await page.evaluate(() => {
      return !document.querySelector('.lag-indicator');
    });
    
    expect(isSmooth).toBe(true);
  });
});
```

### 3. 보안 테스트

#### 권한 우회 시도 테스트
```javascript
// tests/security.spec.js
import { test, expect } from '@playwright/test';

test.describe('보안 테스트', () => {
  test('권한 없는 사용자의 관리자 기능 접근 차단', async ({ page }) => {
    // 일반 사용자로 로그인
    await page.goto('/');
    await page.evaluate(() => {
      window.QABypass.setUser('user');
    });
    
    // 관리자 전용 페이지 직접 접근 시도
    await page.goto('/admin/users');
    
    // 접근 거부 메시지 또는 리다이렉트 확인
    await expect(page.locator('text=접근 권한이 없습니다')).toBeVisible();
  });

  test('고객 정보 보안 검증', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.QABypass.setUser('user');
    });
    
    await page.goto('/properties');
    
    // 다른 담당자 매물의 고객 정보가 숨겨져 있는지 확인
    const customerInfo = page.locator('[data-testid="customer-contact"]');
    const hiddenText = await customerInfo.textContent();
    
    expect(hiddenText).toContain('권한 없음');
  });

  test('XSS 공격 방지 테스트', async ({ page }) => {
    await page.goto('/properties/new');
    
    // 악성 스크립트 입력 시도
    const maliciousScript = '<script>alert("XSS")</script>';
    await page.fill('[name="name"]', maliciousScript);
    await page.fill('[name="description"]', maliciousScript);
    
    await page.click('button[type="submit"]');
    
    // 스크립트가 실행되지 않고 텍스트로 처리되는지 확인
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });
});
```

## 📊 테스트 리포팅

### 1. 자동화된 테스트 보고서
```bash
# 테스트 커버리지 보고서 생성
npm run test:coverage

# E2E 테스트 결과 보고서
npm run test:e2e:report

# 성능 테스트 결과
npm run test:performance
```

### 2. 수동 테스트 체크리스트
```markdown
## 주요 기능 테스트 체크리스트

### 인증 시스템
- [ ] Google OAuth 로그인 정상 작동
- [ ] 권한별 메뉴 표시/숨김 확인
- [ ] 세션 만료 시 자동 로그아웃
- [ ] QA 바이패스 기능 정상 작동

### 매물 관리
- [ ] 매물 등록 폼 검증 정상 작동
- [ ] 이미지 업로드 및 썸네일 생성
- [ ] 매물 검색 및 필터링 정확성
- [ ] 상태 변경 시 권한 체크

### 고객 관리 (신규)
- [ ] 고객 등록/수정 폼 동작
- [ ] 중복 고객 체크 기능
- [ ] 고객-매물 연결 기능
- [ ] 권한 기반 정보 표시

### 성능 및 사용성
- [ ] 페이지 로딩 속도 (2초 이하)
- [ ] 모바일 반응형 동작
- [ ] 에러 메시지 적절성
- [ ] 로딩 인디케이터 표시
```

### 3. 버그 추적 프로세스
```markdown
## 버그 보고 템플릿

### 기본 정보
- **발견일**: YYYY-MM-DD
- **심각도**: Critical/High/Medium/Low
- **환경**: Development/Production
- **브라우저**: Chrome/Firefox/Safari

### 재현 단계
1. 단계별 재현 방법
2. 예상 결과
3. 실제 결과

### 추가 정보
- 스크린샷/동영상
- 콘솔 에러 메시지
- 네트워크 요청 정보

### 해결 우선순위
- [ ] 즉시 수정 (Critical)
- [ ] 이번 스프린트 (High)
- [ ] 다음 스프린트 (Medium)
- [ ] 백로그 (Low)
```

## 📚 참고 문서

### 필수 읽기
- [ ] `docs/QA_바이패스_시스템_구현_완료보고서.md` - QA 시스템 이해
- [ ] `docs/테스트_인프라_구축_완료보고서.md` - 테스트 환경
- [ ] `playwright.config.js` - E2E 테스트 설정
- [ ] `vitest.config.js` - 단위 테스트 설정

### 테스트 도구 문서
- [Playwright 공식 문서](https://playwright.dev/)
- [Vitest 가이드](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

## 🎯 이번 스프린트 목표

### Week 1 (8/3-8/9)
- [ ] 고객 관리 테스트 시나리오 완성
- [ ] 고객 중복 체크 테스트 구현
- [ ] 성능 테스트 자동화 스크립트 작성

### Week 2 (8/10-8/17)
- [ ] 보안 테스트 시나리오 강화
- [ ] CI/CD 파이프라인 테스트 개선
- [ ] 테스트 커버리지 80% 달성

## 🚨 현재 알려진 이슈

### 긴급 수정 필요
1. **manager_history 필드 불일치** - E2E 테스트에서 발견
2. **Storage 버킷 설정** - 이미지 업로드 테스트 실패

### 개선 필요
1. **테스트 데이터 관리** - 더 나은 Mock 데이터 필요
2. **병렬 테스트 실행** - CI/CD 속도 개선
3. **시각적 회귀 테스트** - UI 변경 감지

## 💡 QA 팁

### 1. 효율적인 테스트 전략
```javascript
// 우선순위 기반 테스트
1. 크리티컬 패스 (로그인, 매물 등록)
2. 새로운 기능 (고객 관리)
3. 회귀 테스트 (기존 기능)
4. 엣지 케이스
```

### 2. 버그 재현 기법
```javascript
// 재현 가능한 환경 설정
- 특정 브라우저/OS 조합
- 동일한 테스트 데이터
- 네트워크 상태 시뮬레이션
- 타이밍 이슈 고려
```

### 3. 자동화 vs 수동 테스트 균형
```javascript
// 자동화 우선 영역
- 회귀 테스트
- 반복적인 기능 테스트
- 성능 테스트
- 기본적인 보안 검사

// 수동 테스트 영역  
- 사용자 경험 테스트
- 복잡한 워크플로우
- 시각적 디자인 검증
- 탐색적 테스트
```

---

**지원 채널**: `.ai-team/qa/` 디렉토리의 추가 문서들  
**테스트 환경**: https://gma3561.github.io/the-realty-itemlist-dashboard/  
**다음 체크인**: 매주 금요일 오후 (테스트 결과 리뷰) 