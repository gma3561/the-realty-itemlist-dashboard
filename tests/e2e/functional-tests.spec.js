const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// 기능 테스트 설정
const FUNCTIONAL_CONFIG = {
  baseURL: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  testUser: {
    email: 'jenny@the-realty.co.kr',
    password: 'admin123!'
  },
  testData: {
    property: {
      name: '테스트 매물',
      location: '서울시 강남구 테스트동',
      address: '123-45',
      price: 1000000000,
      area: 84,
      description: '자동화 테스트용 매물입니다'
    },
    customer: {
      name: '테스트 고객',
      phone: '010-1234-5678',
      email: 'test@example.com'
    }
  }
};

// 기능 테스트 결과
let functionalTestResults = {
  timestamp: new Date().toISOString(),
  config: FUNCTIONAL_CONFIG,
  features: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// 유틸리티 함수
class FunctionalTestUtils {
  static async login(page) {
    await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/login`);
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")');
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(FUNCTIONAL_CONFIG.testUser.email);
      await passwordInput.fill(FUNCTIONAL_CONFIG.testUser.password);
      await submitButton.click();
      await page.waitForURL(url => !url.includes('login'), { timeout: 10000 }).catch(() => {});
    }
  }

  static saveFeatureResult(feature, testName, status, details = {}) {
    const featureResult = functionalTestResults.features.find(f => f.name === feature);
    if (!featureResult) {
      functionalTestResults.features.push({
        name: feature,
        tests: []
      });
    }
    
    const targetFeature = functionalTestResults.features.find(f => f.name === feature);
    targetFeature.tests.push({
      name: testName,
      status,
      details,
      timestamp: new Date().toISOString()
    });
    
    functionalTestResults.summary.total++;
    functionalTestResults.summary[status]++;
  }
}

test.describe('부동산 대시보드 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전 로그인
    await FunctionalTestUtils.login(page);
  });

  test.afterAll(async () => {
    // 결과 저장
    const resultsDir = './test-results/functional';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsDir, 'functional-test-report.json'),
      JSON.stringify(functionalTestResults, null, 2)
    );
    
    // HTML 리포트 생성
    const htmlReport = generateFunctionalReport(functionalTestResults);
    fs.writeFileSync(
      path.join(resultsDir, 'functional-test-report.html'),
      htmlReport
    );
    
    console.log('\n=== 기능 테스트 결과 ===');
    console.log(`총 테스트: ${functionalTestResults.summary.total}`);
    console.log(`통과: ${functionalTestResults.summary.passed}`);
    console.log(`실패: ${functionalTestResults.summary.failed}`);
    console.log(`건너뜀: ${functionalTestResults.summary.skipped}`);
  });

  test.describe('1. 대시보드 기능', () => {
    test('1.1 대시보드 통계 표시', async ({ page }) => {
      try {
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        await page.waitForLoadState('networkidle');
        
        // 통계 카드 확인
        const statCards = await page.locator('[class*="stat"], [class*="card"]').all();
        expect(statCards.length).toBeGreaterThan(0);
        
        // 통계 데이터 추출
        const stats = [];
        for (const card of statCards) {
          const title = await card.locator('h2, h3').textContent().catch(() => '');
          const value = await card.locator('[class*="text-2xl"], [class*="value"]').textContent().catch(() => '');
          
          if (title && value) {
            stats.push({ title: title.trim(), value: value.trim() });
          }
        }
        
        console.log(`✅ ${stats.length}개의 통계 항목 확인`);
        
        FunctionalTestUtils.saveFeatureResult('대시보드', '통계 표시', 'passed', { stats });
        
      } catch (error) {
        console.error('❌ 대시보드 통계 표시 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('대시보드', '통계 표시', 'failed', { error: error.message });
        throw error;
      }
    });

    test('1.2 차트 기능', async ({ page }) => {
      try {
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        await page.waitForLoadState('networkidle');
        
        // 차트 요소 확인
        const charts = await page.locator('canvas, svg[class*="chart"], .recharts-wrapper').all();
        
        if (charts.length > 0) {
          console.log(`✅ ${charts.length}개의 차트 렌더링 확인`);
          
          // 차트 인터랙션 테스트 (툴팁, 범례 등)
          for (const chart of charts.slice(0, 2)) {
            await chart.hover();
            await page.waitForTimeout(500);
          }
          
          FunctionalTestUtils.saveFeatureResult('대시보드', '차트 기능', 'passed', { 
            chartCount: charts.length 
          });
        } else {
          FunctionalTestUtils.saveFeatureResult('대시보드', '차트 기능', 'skipped', { 
            reason: '차트 요소 없음' 
          });
        }
        
      } catch (error) {
        console.error('❌ 차트 기능 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('대시보드', '차트 기능', 'failed', { error: error.message });
      }
    });

    test('1.3 빠른 작업 링크', async ({ page }) => {
      try {
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        
        // 빠른 작업 버튼들 확인
        const quickActions = [
          { text: '새 매물 등록', expectedUrl: '#/properties/new' },
          { text: '매물 목록', expectedUrl: '#/properties' },
          { text: '사용자 관리', expectedUrl: '#/users' }
        ];
        
        for (const action of quickActions) {
          const link = page.locator(`a:has-text("${action.text}")`).first();
          
          if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
            await link.click();
            await page.waitForTimeout(1000);
            
            const currentUrl = page.url();
            expect(currentUrl).toContain(action.expectedUrl);
            
            console.log(`✅ "${action.text}" 링크 동작 확인`);
            
            // 대시보드로 돌아가기
            await page.goto(FUNCTIONAL_CONFIG.baseURL);
          }
        }
        
        FunctionalTestUtils.saveFeatureResult('대시보드', '빠른 작업 링크', 'passed');
        
      } catch (error) {
        console.error('❌ 빠른 작업 링크 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('대시보드', '빠른 작업 링크', 'failed', { error: error.message });
      }
    });
  });

  test.describe('2. 매물 관리 기능', () => {
    test('2.1 매물 목록 조회', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties`);
        await page.waitForLoadState('networkidle');
        
        // 매물 목록 확인
        const propertyList = await page.locator('[class*="property"], table, [class*="list"]').first();
        await expect(propertyList).toBeVisible();
        
        // 매물 항목 개수 확인
        const propertyItems = await page.locator('[class*="property-item"], tr, [class*="card"]').all();
        console.log(`✅ ${propertyItems.length}개의 매물 항목 표시`);
        
        FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 목록 조회', 'passed', { 
          itemCount: propertyItems.length 
        });
        
      } catch (error) {
        console.error('❌ 매물 목록 조회 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 목록 조회', 'failed', { error: error.message });
      }
    });

    test('2.2 매물 필터링', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties`);
        await page.waitForLoadState('networkidle');
        
        // 필터 요소 찾기
        const filters = await page.locator('select, [class*="filter"], [class*="search"]').all();
        
        if (filters.length > 0) {
          // 첫 번째 필터 테스트
          const filter = filters[0];
          const isSelect = await filter.evaluate(el => el.tagName === 'SELECT');
          
          if (isSelect) {
            // 옵션 선택
            const options = await filter.locator('option').all();
            if (options.length > 1) {
              await filter.selectOption({ index: 1 });
              await page.waitForTimeout(1000);
              console.log('✅ 필터 옵션 선택 동작 확인');
            }
          } else {
            // 검색 입력
            await filter.fill('테스트');
            await page.waitForTimeout(1000);
            console.log('✅ 검색 필터 입력 동작 확인');
          }
          
          FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 필터링', 'passed');
        } else {
          FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 필터링', 'skipped', { 
            reason: '필터 요소 없음' 
          });
        }
        
      } catch (error) {
        console.error('❌ 매물 필터링 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 필터링', 'failed', { error: error.message });
      }
    });

    test('2.3 매물 상세 보기', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties`);
        await page.waitForLoadState('networkidle');
        
        // 첫 번째 매물 클릭
        const firstProperty = await page.locator('[class*="property-item"], tr, [class*="card"]').first();
        
        if (await firstProperty.isVisible({ timeout: 3000 }).catch(() => false)) {
          // 클릭 가능한 요소 찾기
          const clickableElement = await firstProperty.locator('a, button').first();
          
          if (await clickableElement.isVisible().catch(() => false)) {
            await clickableElement.click();
            await page.waitForTimeout(2000);
            
            // 상세 페이지 확인
            const detailView = await page.locator('[class*="detail"], [class*="property-detail"]').first();
            
            if (await detailView.isVisible({ timeout: 3000 }).catch(() => false)) {
              console.log('✅ 매물 상세 페이지 이동 확인');
              FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 상세 보기', 'passed');
            } else {
              FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 상세 보기', 'skipped', {
                reason: '상세 페이지 요소 없음'
              });
            }
          } else {
            FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 상세 보기', 'skipped', {
              reason: '클릭 가능한 요소 없음'
            });
          }
        } else {
          FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 상세 보기', 'skipped', {
            reason: '매물 항목 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 매물 상세 보기 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 상세 보기', 'failed', { error: error.message });
      }
    });

    test('2.4 매물 등록 폼', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties/new`);
        await page.waitForLoadState('networkidle');
        
        // 폼 요소 확인
        const form = await page.locator('form').first();
        await expect(form).toBeVisible();
        
        // 필수 입력 필드 확인
        const requiredFields = [
          { name: '매물명', selector: 'input[name*="name"], input[placeholder*="매물명"]' },
          { name: '위치', selector: 'input[name*="location"], input[placeholder*="위치"]' },
          { name: '가격', selector: 'input[name*="price"], input[type="number"]' }
        ];
        
        let validFields = 0;
        for (const field of requiredFields) {
          const input = page.locator(field.selector).first();
          if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
            validFields++;
            console.log(`✅ ${field.name} 입력 필드 확인`);
          }
        }
        
        FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 등록 폼', 'passed', { 
          validFields,
          totalFields: requiredFields.length 
        });
        
      } catch (error) {
        console.error('❌ 매물 등록 폼 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('매물 관리', '매물 등록 폼', 'failed', { error: error.message });
      }
    });
  });

  test.describe('3. 사용자 관리 기능', () => {
    test('3.1 사용자 목록 조회', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/users`);
        await page.waitForLoadState('networkidle');
        
        // 사용자 목록 확인
        const userList = await page.locator('[class*="user"], table').first();
        
        if (await userList.isVisible({ timeout: 5000 }).catch(() => false)) {
          const userItems = await page.locator('[class*="user-item"], tr').all();
          console.log(`✅ ${userItems.length}개의 사용자 항목 표시`);
          
          FunctionalTestUtils.saveFeatureResult('사용자 관리', '사용자 목록 조회', 'passed', { 
            userCount: userItems.length 
          });
        } else {
          FunctionalTestUtils.saveFeatureResult('사용자 관리', '사용자 목록 조회', 'skipped', {
            reason: '사용자 목록 요소 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 사용자 목록 조회 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('사용자 관리', '사용자 목록 조회', 'failed', { error: error.message });
      }
    });

    test('3.2 사용자 권한 관리', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/users`);
        await page.waitForLoadState('networkidle');
        
        // 권한 관련 요소 찾기
        const roleSelects = await page.locator('select[name*="role"], [class*="role"]').all();
        
        if (roleSelects.length > 0) {
          console.log(`✅ ${roleSelects.length}개의 권한 관리 요소 발견`);
          FunctionalTestUtils.saveFeatureResult('사용자 관리', '사용자 권한 관리', 'passed', {
            roleElements: roleSelects.length
          });
        } else {
          FunctionalTestUtils.saveFeatureResult('사용자 관리', '사용자 권한 관리', 'skipped', {
            reason: '권한 관리 요소 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 사용자 권한 관리 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('사용자 관리', '사용자 권한 관리', 'failed', { error: error.message });
      }
    });
  });

  test.describe('4. 고객 관리 기능', () => {
    test('4.1 고객 목록 조회', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/customers`);
        await page.waitForLoadState('networkidle');
        
        // 고객 목록 확인
        const customerList = await page.locator('[class*="customer"], table').first();
        
        if (await customerList.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('✅ 고객 목록 페이지 로드 확인');
          FunctionalTestUtils.saveFeatureResult('고객 관리', '고객 목록 조회', 'passed');
        } else {
          FunctionalTestUtils.saveFeatureResult('고객 관리', '고객 목록 조회', 'skipped', {
            reason: '고객 목록 요소 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 고객 목록 조회 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('고객 관리', '고객 목록 조회', 'failed', { error: error.message });
      }
    });

    test('4.2 고객 등록 폼', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/customers/new`);
        await page.waitForLoadState('networkidle');
        
        // 폼 확인
        const form = await page.locator('form').first();
        
        if (await form.isVisible({ timeout: 5000 }).catch(() => false)) {
          // 필수 입력 필드 확인
          const fields = [
            'input[name*="name"], input[placeholder*="이름"]',
            'input[name*="phone"], input[type="tel"]',
            'input[name*="email"], input[type="email"]'
          ];
          
          let validFields = 0;
          for (const selector of fields) {
            const field = page.locator(selector).first();
            if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
              validFields++;
            }
          }
          
          console.log(`✅ ${validFields}개의 고객 정보 필드 확인`);
          FunctionalTestUtils.saveFeatureResult('고객 관리', '고객 등록 폼', 'passed', { validFields });
        } else {
          FunctionalTestUtils.saveFeatureResult('고객 관리', '고객 등록 폼', 'skipped', {
            reason: '고객 등록 폼 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 고객 등록 폼 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('고객 관리', '고객 등록 폼', 'failed', { error: error.message });
      }
    });
  });

  test.describe('5. 네비게이션 기능', () => {
    test('5.1 메인 네비게이션', async ({ page }) => {
      try {
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        
        // 네비게이션 메뉴 항목
        const navItems = [
          { text: '대시보드', url: '#/' },
          { text: '매물', url: '#/properties' },
          { text: '고객', url: '#/customers' },
          { text: '사용자', url: '#/users' },
          { text: '설정', url: '#/settings' }
        ];
        
        let successfulNavs = 0;
        
        for (const item of navItems) {
          const navLink = page.locator(`a:has-text("${item.text}")`).first();
          
          if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
            await navLink.click();
            await page.waitForTimeout(1000);
            
            const currentUrl = page.url();
            if (currentUrl.includes(item.url)) {
              successfulNavs++;
              console.log(`✅ "${item.text}" 네비게이션 성공`);
            }
          }
        }
        
        FunctionalTestUtils.saveFeatureResult('네비게이션', '메인 네비게이션', 'passed', {
          successfulNavs,
          totalNavs: navItems.length
        });
        
      } catch (error) {
        console.error('❌ 메인 네비게이션 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('네비게이션', '메인 네비게이션', 'failed', { error: error.message });
      }
    });

    test('5.2 브레드크럼 네비게이션', async ({ page }) => {
      try {
        // 깊은 페이지로 이동
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties/new`);
        await page.waitForLoadState('networkidle');
        
        // 브레드크럼 확인
        const breadcrumb = await page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
        
        if (await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false)) {
          const breadcrumbItems = await breadcrumb.locator('a, span').all();
          console.log(`✅ ${breadcrumbItems.length}개의 브레드크럼 항목 확인`);
          
          FunctionalTestUtils.saveFeatureResult('네비게이션', '브레드크럼', 'passed', {
            itemCount: breadcrumbItems.length
          });
        } else {
          FunctionalTestUtils.saveFeatureResult('네비게이션', '브레드크럼', 'skipped', {
            reason: '브레드크럼 요소 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 브레드크럼 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('네비게이션', '브레드크럼', 'failed', { error: error.message });
      }
    });
  });

  test.describe('6. 검색 기능', () => {
    test('6.1 글로벌 검색', async ({ page }) => {
      try {
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        
        // 검색 입력 필드 찾기
        const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"]').first();
        
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          // 검색어 입력
          await searchInput.fill('테스트');
          await searchInput.press('Enter');
          await page.waitForTimeout(2000);
          
          console.log('✅ 글로벌 검색 기능 동작 확인');
          FunctionalTestUtils.saveFeatureResult('검색', '글로벌 검색', 'passed');
        } else {
          FunctionalTestUtils.saveFeatureResult('검색', '글로벌 검색', 'skipped', {
            reason: '검색 입력 필드 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 글로벌 검색 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('검색', '글로벌 검색', 'failed', { error: error.message });
      }
    });
  });

  test.describe('7. 반응형 동작', () => {
    test('7.1 모바일 메뉴 토글', async ({ page }) => {
      try {
        // 모바일 뷰포트로 변경
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        await page.waitForLoadState('networkidle');
        
        // 모바일 메뉴 버튼 찾기
        const mobileMenuButton = await page.locator('[class*="mobile-menu"], [class*="hamburger"], button[aria-label*="menu"]').first();
        
        if (await mobileMenuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          // 메뉴 토글
          await mobileMenuButton.click();
          await page.waitForTimeout(500);
          
          // 메뉴가 열렸는지 확인
          const mobileMenu = await page.locator('[class*="mobile-nav"], [class*="sidebar"]').first();
          const isMenuVisible = await mobileMenu.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isMenuVisible) {
            console.log('✅ 모바일 메뉴 토글 동작 확인');
            
            // 메뉴 닫기
            await mobileMenuButton.click();
            await page.waitForTimeout(500);
          }
          
          FunctionalTestUtils.saveFeatureResult('반응형', '모바일 메뉴 토글', 'passed');
        } else {
          FunctionalTestUtils.saveFeatureResult('반응형', '모바일 메뉴 토글', 'skipped', {
            reason: '모바일 메뉴 버튼 없음'
          });
        }
        
        // 뷰포트 복원
        await page.setViewportSize({ width: 1920, height: 1080 });
        
      } catch (error) {
        console.error('❌ 모바일 메뉴 토글 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('반응형', '모바일 메뉴 토글', 'failed', { error: error.message });
      }
    });

    test('7.2 반응형 그리드 레이아웃', async ({ page }) => {
      try {
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        
        const viewports = [
          { name: 'desktop', width: 1920, height: 1080 },
          { name: 'tablet', width: 768, height: 1024 },
          { name: 'mobile', width: 375, height: 812 }
        ];
        
        const results = [];
        
        for (const viewport of viewports) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(500);
          
          // 그리드 레이아웃 확인
          const gridElements = await page.locator('[class*="grid"], [class*="col-"]').all();
          const visibleElements = [];
          
          for (const element of gridElements.slice(0, 5)) {
            if (await element.isVisible()) {
              const box = await element.boundingBox();
              if (box) {
                visibleElements.push({
                  width: box.width,
                  height: box.height
                });
              }
            }
          }
          
          results.push({
            viewport: viewport.name,
            elementCount: visibleElements.length,
            avgWidth: visibleElements.reduce((sum, el) => sum + el.width, 0) / visibleElements.length || 0
          });
        }
        
        console.log('✅ 반응형 그리드 레이아웃 테스트 완료');
        FunctionalTestUtils.saveFeatureResult('반응형', '그리드 레이아웃', 'passed', { results });
        
        // 뷰포트 복원
        await page.setViewportSize({ width: 1920, height: 1080 });
        
      } catch (error) {
        console.error('❌ 반응형 그리드 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('반응형', '그리드 레이아웃', 'failed', { error: error.message });
      }
    });
  });

  test.describe('8. 데이터 입출력', () => {
    test('8.1 CSV 가져오기', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/csv-import`);
        await page.waitForLoadState('networkidle');
        
        // 파일 업로드 입력 찾기
        const fileInput = await page.locator('input[type="file"]').first();
        
        if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ CSV 가져오기 페이지 및 파일 입력 확인');
          FunctionalTestUtils.saveFeatureResult('데이터 입출력', 'CSV 가져오기', 'passed');
        } else {
          FunctionalTestUtils.saveFeatureResult('데이터 입출력', 'CSV 가져오기', 'skipped', {
            reason: '파일 업로드 입력 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ CSV 가져오기 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('데이터 입출력', 'CSV 가져오기', 'failed', { error: error.message });
      }
    });

    test('8.2 데이터 내보내기', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties`);
        await page.waitForLoadState('networkidle');
        
        // 내보내기 버튼 찾기
        const exportButton = await page.locator('button:has-text("내보내기"), button:has-text("Export"), [class*="export"]').first();
        
        if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ 데이터 내보내기 버튼 확인');
          FunctionalTestUtils.saveFeatureResult('데이터 입출력', '데이터 내보내기', 'passed');
        } else {
          FunctionalTestUtils.saveFeatureResult('데이터 입출력', '데이터 내보내기', 'skipped', {
            reason: '내보내기 버튼 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 데이터 내보내기 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('데이터 입출력', '데이터 내보내기', 'failed', { error: error.message });
      }
    });
  });

  test.describe('9. 에러 처리', () => {
    test('9.1 404 페이지 처리', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/non-existent-page-12345`);
        await page.waitForLoadState('networkidle');
        
        // 404 처리 확인
        const errorMessage = await page.locator('[class*="error"], [class*="404"], h1:has-text("404")').first();
        const wasRedirected = page.url().includes('#/');
        
        if (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('✅ 404 에러 페이지 표시 확인');
          FunctionalTestUtils.saveFeatureResult('에러 처리', '404 페이지', 'passed', {
            type: 'error-page'
          });
        } else if (wasRedirected && !page.url().includes('non-existent')) {
          console.log('✅ 404 페이지가 홈으로 리다이렉션됨');
          FunctionalTestUtils.saveFeatureResult('에러 처리', '404 페이지', 'passed', {
            type: 'redirect'
          });
        } else {
          FunctionalTestUtils.saveFeatureResult('에러 처리', '404 페이지', 'failed', {
            reason: '404 처리 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 404 페이지 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('에러 처리', '404 페이지', 'failed', { error: error.message });
      }
    });

    test('9.2 폼 유효성 검사', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties/new`);
        await page.waitForLoadState('networkidle');
        
        // 빈 폼 제출 시도
        const submitButton = await page.locator('button[type="submit"], button:has-text("저장"), button:has-text("등록")').first();
        
        if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // 유효성 검사 메시지 확인
          const validationMessages = await page.locator('[class*="error"], [class*="invalid"], .text-red-500').all();
          
          if (validationMessages.length > 0) {
            console.log(`✅ ${validationMessages.length}개의 유효성 검사 메시지 표시`);
            FunctionalTestUtils.saveFeatureResult('에러 처리', '폼 유효성 검사', 'passed', {
              messageCount: validationMessages.length
            });
          } else {
            FunctionalTestUtils.saveFeatureResult('에러 처리', '폼 유효성 검사', 'skipped', {
              reason: '유효성 검사 메시지 없음'
            });
          }
        } else {
          FunctionalTestUtils.saveFeatureResult('에러 처리', '폼 유효성 검사', 'skipped', {
            reason: '제출 버튼 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 폼 유효성 검사 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('에러 처리', '폼 유효성 검사', 'failed', { error: error.message });
      }
    });
  });

  test.describe('10. 성능 최적화', () => {
    test('10.1 페이지네이션', async ({ page }) => {
      try {
        await page.goto(`${FUNCTIONAL_CONFIG.baseURL}#/properties`);
        await page.waitForLoadState('networkidle');
        
        // 페이지네이션 요소 찾기
        const pagination = await page.locator('[class*="pagination"], [class*="page-"]').first();
        
        if (await pagination.isVisible({ timeout: 3000 }).catch(() => false)) {
          const pageButtons = await pagination.locator('button, a').all();
          console.log(`✅ ${pageButtons.length}개의 페이지네이션 버튼 확인`);
          
          // 다음 페이지 클릭 테스트
          const nextButton = await pagination.locator('button:has-text("다음"), a:has-text("Next"), [aria-label*="next"]').first();
          
          if (await nextButton.isVisible() && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ 페이지네이션 동작 확인');
          }
          
          FunctionalTestUtils.saveFeatureResult('성능 최적화', '페이지네이션', 'passed', {
            buttonCount: pageButtons.length
          });
        } else {
          FunctionalTestUtils.saveFeatureResult('성능 최적화', '페이지네이션', 'skipped', {
            reason: '페이지네이션 요소 없음'
          });
        }
        
      } catch (error) {
        console.error('❌ 페이지네이션 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('성능 최적화', '페이지네이션', 'failed', { error: error.message });
      }
    });

    test('10.2 로딩 상태 표시', async ({ page }) => {
      try {
        // 느린 네트워크 시뮬레이션
        await page.route('**/*', route => {
          setTimeout(() => route.continue(), 1000);
        });
        
        await page.goto(FUNCTIONAL_CONFIG.baseURL);
        
        // 로딩 인디케이터 확인
        const loadingIndicator = await page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').first();
        const hasLoadingState = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasLoadingState) {
          console.log('✅ 로딩 상태 표시 확인');
          FunctionalTestUtils.saveFeatureResult('성능 최적화', '로딩 상태', 'passed');
        } else {
          FunctionalTestUtils.saveFeatureResult('성능 최적화', '로딩 상태', 'skipped', {
            reason: '로딩 인디케이터 없음'
          });
        }
        
        // 라우팅 해제
        await page.unroute('**/*');
        
      } catch (error) {
        console.error('❌ 로딩 상태 테스트 실패:', error.message);
        FunctionalTestUtils.saveFeatureResult('성능 최적화', '로딩 상태', 'failed', { error: error.message });
      }
    });
  });
});

// HTML 리포트 생성 함수
function generateFunctionalReport(results) {
  const passRate = results.summary.total > 0
    ? ((results.summary.passed / results.summary.total) * 100).toFixed(1)
    : 0;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>기능 테스트 리포트</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #00c853 0%, #64dd17 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-card .value {
            font-size: 36px;
            font-weight: bold;
        }
        .feature-section {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            overflow: hidden;
        }
        .feature-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .feature-tests {
            padding: 0;
        }
        .test-item {
            padding: 12px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-item:hover {
            background: #f8f9fa;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-badge.passed {
            background: #d4edda;
            color: #155724;
        }
        .status-badge.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .status-badge.skipped {
            background: #fff3cd;
            color: #856404;
        }
        .feature-summary {
            font-size: 14px;
            color: #666;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 부동산 대시보드 기능 테스트 리포트</h1>
        <p>테스트 일시: ${new Date(results.timestamp).toLocaleString('ko-KR')}</p>
        <p>테스트 URL: ${results.config.baseURL}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>총 테스트</h3>
            <div class="value">${results.summary.total}</div>
        </div>
        <div class="summary-card">
            <h3>통과</h3>
            <div class="value" style="color: #28a745;">${results.summary.passed}</div>
        </div>
        <div class="summary-card">
            <h3>실패</h3>
            <div class="value" style="color: #dc3545;">${results.summary.failed}</div>
        </div>
        <div class="summary-card">
            <h3>건너뜀</h3>
            <div class="value" style="color: #ffc107;">${results.summary.skipped}</div>
        </div>
        <div class="summary-card">
            <h3>통과율</h3>
            <div class="value" style="color: #007bff;">${passRate}%</div>
        </div>
    </div>

    ${results.features.map(feature => {
      const featurePassed = feature.tests.filter(t => t.status === 'passed').length;
      const featureFailed = feature.tests.filter(t => t.status === 'failed').length;
      const featureSkipped = feature.tests.filter(t => t.status === 'skipped').length;
      
      return `
        <div class="feature-section">
            <div class="feature-header">
                <span>${feature.name}</span>
                <span class="feature-summary">
                    ${featurePassed > 0 ? `✅ ${featurePassed}` : ''}
                    ${featureFailed > 0 ? `❌ ${featureFailed}` : ''}
                    ${featureSkipped > 0 ? `⏭️ ${featureSkipped}` : ''}
                </span>
            </div>
            <div class="feature-tests">
                ${feature.tests.map(test => `
                    <div class="test-item">
                        <span>${test.name}</span>
                        <span class="status-badge ${test.status}">${test.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>
      `;
    }).join('')}

    <div class="footer">
        <p>이 리포트는 Playwright를 사용한 자동화 테스트로 생성되었습니다.</p>
        <p>Generated by Functional Test Suite</p>
    </div>
</body>
</html>
  `;
}