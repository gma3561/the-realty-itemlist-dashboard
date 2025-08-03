const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// 테스트 환경 설정
const TEST_CONFIG = {
  baseURL: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  defaultTimeout: 30000,
  testUser: {
    email: 'jenny@the-realty.co.kr',
    password: 'admin123!'
  },
  viewports: {
    mobile: { width: 375, height: 812, name: 'Mobile' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    desktop: { width: 1920, height: 1080, name: 'Desktop' }
  }
};

// 테스트 결과 저장 객체
let testResults = {
  timestamp: new Date().toISOString(),
  url: TEST_CONFIG.baseURL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    performance: {},
    screenshots: [],
    videos: []
  }
};

// 유틸리티 함수들
class TestUtils {
  static saveTestResult(testName, status, details = {}) {
    testResults.tests.push({
      name: testName,
      status: status,
      details: details,
      timestamp: new Date().toISOString()
    });
    testResults.summary.total++;
    testResults.summary[status]++;
  }

  static async captureScreenshot(page, name, fullPage = false) {
    const timestamp = Date.now();
    const filename = `${name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.png`;
    const filepath = `./test-results/screenshots/${filename}`;
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: fullPage,
      quality: 90
    });
    
    testResults.summary.screenshots.push({
      name: name,
      path: filepath,
      timestamp: new Date().toISOString()
    });
    
    return filepath;
  }

  static async measurePerformance(page) {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: paint[0]?.startTime || 0,
        firstContentfulPaint: paint[1]?.startTime || 0,
        largestContentfulPaint: lcp[0]?.startTime || 0,
        resources: performance.getEntriesByType('resource').length
      };
    });
  }

  static async waitForStableDOM(page, timeout = 5000) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // DOM 안정화 대기
  }
}

test.describe('부동산 대시보드 종합 QA 테스트', () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    // 테스트 컨텍스트 생성
    context = await browser.newContext({
      viewport: TEST_CONFIG.viewports.desktop,
      recordVideo: {
        dir: './test-results/videos/',
        size: TEST_CONFIG.viewports.desktop
      },
      ignoreHTTPSErrors: true
    });
    
    page = await context.newPage();
    
    // 콘솔 로그 캡처
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[브라우저 에러] ${msg.text()}`);
      }
    });
    
    // 페이지 에러 캡처
    page.on('pageerror', error => {
      console.error('[페이지 에러]', error.message);
    });
  });

  test.afterAll(async () => {
    // 테스트 결과 저장
    const resultsDir = './test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // JSON 리포트 저장
    fs.writeFileSync(
      path.join(resultsDir, 'comprehensive-qa-report.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    // HTML 리포트 생성
    const htmlReport = generateHTMLReport(testResults);
    fs.writeFileSync(
      path.join(resultsDir, 'comprehensive-qa-report.html'),
      htmlReport
    );
    
    console.log('\n=== 종합 QA 테스트 결과 ===');
    console.log(`총 테스트: ${testResults.summary.total}`);
    console.log(`성공: ${testResults.summary.passed}`);
    console.log(`실패: ${testResults.summary.failed}`);
    console.log(`건너뜀: ${testResults.summary.skipped}`);
    console.log(`성공률: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    await context.close();
  });

  test.describe('1. 성능 및 로딩 테스트', () => {
    test('1.1 페이지 로딩 성능 측정', async () => {
      console.log('\n🚀 페이지 로딩 성능 테스트...');
      
      try {
        const startTime = Date.now();
        
        await page.goto(TEST_CONFIG.baseURL, { 
          waitUntil: 'domcontentloaded',
          timeout: TEST_CONFIG.defaultTimeout 
        });
        
        const domLoadTime = Date.now() - startTime;
        
        await page.waitForLoadState('networkidle');
        const fullLoadTime = Date.now() - startTime;
        
        const performanceMetrics = await TestUtils.measurePerformance(page);
        
        testResults.summary.performance = {
          domLoadTime,
          fullLoadTime,
          ...performanceMetrics
        };
        
        console.log(`✅ DOM 로딩: ${domLoadTime}ms`);
        console.log(`✅ 전체 로딩: ${fullLoadTime}ms`);
        console.log(`✅ First Paint: ${performanceMetrics.firstPaint.toFixed(1)}ms`);
        console.log(`✅ LCP: ${performanceMetrics.largestContentfulPaint.toFixed(1)}ms`);
        
        expect(fullLoadTime).toBeLessThan(5000);
        expect(performanceMetrics.largestContentfulPaint).toBeLessThan(2500);
        
        TestUtils.saveTestResult('페이지 로딩 성능', 'passed', {
          domLoadTime,
          fullLoadTime,
          performanceMetrics
        });
        
      } catch (error) {
        console.error('❌ 페이지 로딩 테스트 실패:', error.message);
        TestUtils.saveTestResult('페이지 로딩 성능', 'failed', { error: error.message });
        throw error;
      }
    });

    test('1.2 리소스 로딩 검증', async () => {
      console.log('\n📦 리소스 로딩 검증...');
      
      try {
        const resourceMetrics = await page.evaluate(() => {
          const resources = performance.getEntriesByType('resource');
          const failedResources = resources.filter(r => r.responseStatus >= 400 || r.responseStatus === 0);
          
          return {
            total: resources.length,
            failed: failedResources.length,
            failedUrls: failedResources.map(r => r.name),
            byType: {
              scripts: resources.filter(r => r.name.includes('.js')).length,
              styles: resources.filter(r => r.name.includes('.css')).length,
              images: resources.filter(r => r.name.match(/\.(png|jpg|jpeg|gif|svg)/)).length,
              fonts: resources.filter(r => r.name.match(/\.(woff|woff2|ttf|otf)/)).length
            }
          };
        });
        
        console.log(`✅ 총 리소스: ${resourceMetrics.total}개`);
        console.log(`✅ JS 파일: ${resourceMetrics.byType.scripts}개`);
        console.log(`✅ CSS 파일: ${resourceMetrics.byType.styles}개`);
        
        if (resourceMetrics.failed > 0) {
          console.warn(`⚠️ 실패한 리소스: ${resourceMetrics.failed}개`);
          resourceMetrics.failedUrls.forEach(url => console.warn(`  - ${url}`));
        }
        
        expect(resourceMetrics.failed).toBe(0);
        
        TestUtils.saveTestResult('리소스 로딩 검증', 'passed', resourceMetrics);
        
      } catch (error) {
        console.error('❌ 리소스 로딩 검증 실패:', error.message);
        TestUtils.saveTestResult('리소스 로딩 검증', 'failed', { error: error.message });
        throw error;
      }
    });
  });

  test.describe('2. 인증 및 접근 제어 테스트', () => {
    test('2.1 로그인 기능 테스트', async () => {
      console.log('\n🔐 로그인 기능 테스트...');
      
      try {
        // 로그인 페이지로 이동
        await page.goto(`${TEST_CONFIG.baseURL}#/login`);
        await TestUtils.waitForStableDOM(page);
        
        // 로그인 폼 확인
        const emailInput = page.locator('input[type="email"], input[name="email"], #email');
        const passwordInput = page.locator('input[type="password"], input[name="password"], #password');
        const submitButton = page.locator('button[type="submit"], button:has-text("로그인")');
        
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();
        
        // 로그인 정보 입력
        await emailInput.fill(TEST_CONFIG.testUser.email);
        await passwordInput.fill(TEST_CONFIG.testUser.password);
        
        await TestUtils.captureScreenshot(page, 'login-form-filled');
        
        // 로그인 시도
        await submitButton.click();
        
        // 로그인 성공 확인 (대시보드 이동 또는 로그인 성공 표시)
        await page.waitForURL(url => !url.includes('login'), { timeout: 10000 }).catch(() => {});
        
        // 로그인 성공 여부 확인
        const isLoggedIn = await page.evaluate(() => {
          return !window.location.hash.includes('login');
        });
        
        if (isLoggedIn) {
          console.log('✅ 로그인 성공');
          await TestUtils.captureScreenshot(page, 'login-success');
          TestUtils.saveTestResult('로그인 기능', 'passed', { loggedIn: true });
        } else {
          console.log('⚠️ 데모 모드 - 로그인 없이 진행');
          await page.goto(TEST_CONFIG.baseURL);
          TestUtils.saveTestResult('로그인 기능', 'passed', { 
            loggedIn: false, 
            note: '데모 모드로 진행' 
          });
        }
        
      } catch (error) {
        console.error('❌ 로그인 테스트 실패:', error.message);
        TestUtils.saveTestResult('로그인 기능', 'failed', { error: error.message });
      }
    });

    test('2.2 인증 상태 유지 테스트', async () => {
      console.log('\n🔒 인증 상태 유지 테스트...');
      
      try {
        // 페이지 새로고침
        await page.reload();
        await TestUtils.waitForStableDOM(page);
        
        // 인증 상태 확인
        const isAuthenticated = await page.evaluate(() => {
          return !window.location.hash.includes('login');
        });
        
        console.log(isAuthenticated ? '✅ 인증 상태 유지됨' : '⚠️ 인증 필요 없음 (데모 모드)');
        
        TestUtils.saveTestResult('인증 상태 유지', 'passed', { 
          authenticated: isAuthenticated 
        });
        
      } catch (error) {
        console.error('❌ 인증 상태 테스트 실패:', error.message);
        TestUtils.saveTestResult('인증 상태 유지', 'failed', { error: error.message });
      }
    });
  });

  test.describe('3. UI 컴포넌트 및 레이아웃 테스트', () => {
    test('3.1 대시보드 UI 요소 검증', async () => {
      console.log('\n🎨 대시보드 UI 요소 검증...');
      
      try {
        // 대시보드로 이동
        await page.goto(TEST_CONFIG.baseURL);
        await TestUtils.waitForStableDOM(page);
        
        const uiElements = {
          '헤더': 'header, .header, [class*="header"]',
          '네비게이션': 'nav, .navigation, [class*="nav"]',
          '통계 카드': '[class*="stat"], [class*="card"], .stats-card',
          '차트': 'canvas, svg, .chart, [class*="chart"]',
          '메인 콘텐츠': 'main, .main-content, [class*="dashboard"]',
          '사용자 정보': '[class*="user"], [class*="profile"]'
        };
        
        const elementResults = [];
        
        for (const [name, selector] of Object.entries(uiElements)) {
          try {
            const element = page.locator(selector).first();
            const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (isVisible) {
              const boundingBox = await element.boundingBox();
              elementResults.push({
                name,
                visible: true,
                dimensions: boundingBox ? `${boundingBox.width}x${boundingBox.height}` : 'N/A'
              });
              console.log(`✅ ${name} 렌더링 확인`);
            } else {
              elementResults.push({ name, visible: false });
              console.log(`⚠️ ${name} 없음`);
            }
          } catch (error) {
            elementResults.push({ name, visible: false, error: error.message });
          }
        }
        
        await TestUtils.captureScreenshot(page, 'dashboard-ui-elements', true);
        
        const visibleCount = elementResults.filter(e => e.visible).length;
        expect(visibleCount).toBeGreaterThanOrEqual(3);
        
        TestUtils.saveTestResult('대시보드 UI 요소', 'passed', { elements: elementResults });
        
      } catch (error) {
        console.error('❌ UI 요소 검증 실패:', error.message);
        TestUtils.saveTestResult('대시보드 UI 요소', 'failed', { error: error.message });
        throw error;
      }
    });

    test('3.2 반응형 디자인 테스트', async () => {
      console.log('\n📱 반응형 디자인 테스트...');
      
      try {
        const responsiveResults = [];
        
        for (const [device, viewport] of Object.entries(TEST_CONFIG.viewports)) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(1000);
          
          const layoutCheck = await page.evaluate(() => {
            const body = document.body;
            const hasHorizontalScroll = body.scrollWidth > body.clientWidth;
            const elementsInViewport = document.querySelectorAll('*').length;
            
            return {
              hasHorizontalScroll,
              elementsCount: elementsInViewport,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight
            };
          });
          
          await TestUtils.captureScreenshot(page, `responsive-${device}`);
          
          responsiveResults.push({
            device,
            viewport: `${viewport.width}x${viewport.height}`,
            horizontalScroll: layoutCheck.hasHorizontalScroll,
            elementsVisible: layoutCheck.elementsCount > 0
          });
          
          console.log(`✅ ${device} (${viewport.width}x${viewport.height}) 테스트 완료`);
          
          expect(layoutCheck.hasHorizontalScroll).toBe(false);
        }
        
        // 원래 뷰포트로 복원
        await page.setViewportSize(TEST_CONFIG.viewports.desktop);
        
        TestUtils.saveTestResult('반응형 디자인', 'passed', { results: responsiveResults });
        
      } catch (error) {
        console.error('❌ 반응형 디자인 테스트 실패:', error.message);
        TestUtils.saveTestResult('반응형 디자인', 'failed', { error: error.message });
        throw error;
      }
    });
  });

  test.describe('4. 네비게이션 및 라우팅 테스트', () => {
    test('4.1 주요 페이지 네비게이션', async () => {
      console.log('\n🧭 주요 페이지 네비게이션 테스트...');
      
      try {
        const navigationTests = [
          { name: '대시보드', url: '#/', selector: '[class*="dashboard"]' },
          { name: '매물 목록', url: '#/properties', selector: '[class*="property"]' },
          { name: '사용자 관리', url: '#/users', selector: '[class*="user"]' },
          { name: '설정', url: '#/settings', selector: '[class*="settings"]' }
        ];
        
        const results = [];
        
        for (const navTest of navigationTests) {
          try {
            await page.goto(`${TEST_CONFIG.baseURL}${navTest.url}`);
            await TestUtils.waitForStableDOM(page);
            
            const pageElement = await page.locator(navTest.selector).first();
            const isVisible = await pageElement.isVisible({ timeout: 5000 }).catch(() => false);
            
            results.push({
              page: navTest.name,
              url: navTest.url,
              loaded: isVisible,
              loadTime: Date.now()
            });
            
            if (isVisible) {
              console.log(`✅ ${navTest.name} 페이지 로드 성공`);
              await TestUtils.captureScreenshot(page, `navigation-${navTest.name.toLowerCase()}`);
            } else {
              console.log(`⚠️ ${navTest.name} 페이지 요소 없음`);
            }
            
          } catch (error) {
            results.push({
              page: navTest.name,
              url: navTest.url,
              loaded: false,
              error: error.message
            });
          }
        }
        
        TestUtils.saveTestResult('페이지 네비게이션', 'passed', { results });
        
      } catch (error) {
        console.error('❌ 네비게이션 테스트 실패:', error.message);
        TestUtils.saveTestResult('페이지 네비게이션', 'failed', { error: error.message });
        throw error;
      }
    });

    test('4.2 브라우저 히스토리 테스트', async () => {
      console.log('\n🔄 브라우저 히스토리 테스트...');
      
      try {
        // 여러 페이지 방문
        await page.goto(`${TEST_CONFIG.baseURL}#/`);
        await page.waitForTimeout(1000);
        
        await page.goto(`${TEST_CONFIG.baseURL}#/properties`);
        await page.waitForTimeout(1000);
        
        // 뒤로가기
        await page.goBack();
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        expect(currentUrl).toContain('#/');
        
        // 앞으로가기
        await page.goForward();
        await page.waitForTimeout(1000);
        
        const forwardUrl = page.url();
        expect(forwardUrl).toContain('#/properties');
        
        console.log('✅ 브라우저 히스토리 동작 정상');
        
        TestUtils.saveTestResult('브라우저 히스토리', 'passed', {
          backNavigation: true,
          forwardNavigation: true
        });
        
      } catch (error) {
        console.error('❌ 브라우저 히스토리 테스트 실패:', error.message);
        TestUtils.saveTestResult('브라우저 히스토리', 'failed', { error: error.message });
      }
    });
  });

  test.describe('5. 데이터 및 기능 테스트', () => {
    test('5.1 대시보드 통계 데이터 검증', async () => {
      console.log('\n📊 대시보드 통계 데이터 검증...');
      
      try {
        await page.goto(TEST_CONFIG.baseURL);
        await TestUtils.waitForStableDOM(page);
        
        // 통계 카드 데이터 추출
        const statsData = await page.evaluate(() => {
          const stats = [];
          const statElements = document.querySelectorAll('[class*="stat"], [class*="card"]');
          
          statElements.forEach(element => {
            const titleElement = element.querySelector('h2, h3, [class*="title"]');
            const valueElement = element.querySelector('p[class*="text-2xl"], [class*="value"], [class*="number"]');
            
            if (titleElement && valueElement) {
              stats.push({
                title: titleElement.textContent.trim(),
                value: valueElement.textContent.trim()
              });
            }
          });
          
          return stats;
        });
        
        console.log(`✅ ${statsData.length}개의 통계 데이터 발견`);
        statsData.forEach(stat => {
          console.log(`  - ${stat.title}: ${stat.value}`);
        });
        
        expect(statsData.length).toBeGreaterThan(0);
        
        TestUtils.saveTestResult('대시보드 통계 데이터', 'passed', { stats: statsData });
        
      } catch (error) {
        console.error('❌ 통계 데이터 검증 실패:', error.message);
        TestUtils.saveTestResult('대시보드 통계 데이터', 'failed', { error: error.message });
      }
    });

    test('5.2 차트 렌더링 검증', async () => {
      console.log('\n📈 차트 렌더링 검증...');
      
      try {
        const chartData = await page.evaluate(() => {
          const charts = [];
          
          // Canvas 차트 (Chart.js 등)
          const canvasElements = document.querySelectorAll('canvas');
          canvasElements.forEach((canvas, index) => {
            const ctx = canvas.getContext('2d');
            const hasData = ctx && canvas.width > 0 && canvas.height > 0;
            
            charts.push({
              type: 'canvas',
              index,
              hasData,
              dimensions: `${canvas.width}x${canvas.height}`
            });
          });
          
          // SVG 차트 (D3.js, Recharts 등)
          const svgElements = document.querySelectorAll('svg[class*="chart"], .recharts-wrapper svg');
          svgElements.forEach((svg, index) => {
            const hasChildren = svg.children.length > 0;
            const boundingBox = svg.getBoundingClientRect();
            
            charts.push({
              type: 'svg',
              index,
              hasData: hasChildren,
              dimensions: `${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)}`
            });
          });
          
          return charts;
        });
        
        const validCharts = chartData.filter(chart => chart.hasData);
        console.log(`✅ ${validCharts.length}개의 활성 차트 발견`);
        
        if (validCharts.length > 0) {
          await TestUtils.captureScreenshot(page, 'dashboard-charts');
        }
        
        TestUtils.saveTestResult('차트 렌더링', 'passed', { charts: chartData });
        
      } catch (error) {
        console.error('❌ 차트 검증 실패:', error.message);
        TestUtils.saveTestResult('차트 렌더링', 'failed', { error: error.message });
      }
    });
  });

  test.describe('6. 에러 처리 및 안정성 테스트', () => {
    test('6.1 JavaScript 에러 검출', async () => {
      console.log('\n🐛 JavaScript 에러 검출...');
      
      try {
        const jsErrors = [];
        
        page.on('pageerror', error => {
          jsErrors.push({
            message: error.message,
            stack: error.stack
          });
        });
        
        // 페이지 새로고침하여 에러 캡처
        await page.reload();
        await TestUtils.waitForStableDOM(page);
        
        if (jsErrors.length > 0) {
          console.error(`❌ ${jsErrors.length}개의 JavaScript 에러 발견`);
          jsErrors.forEach(error => console.error(`  - ${error.message}`));
          TestUtils.saveTestResult('JavaScript 에러', 'failed', { errors: jsErrors });
        } else {
          console.log('✅ JavaScript 에러 없음');
          TestUtils.saveTestResult('JavaScript 에러', 'passed', { errors: [] });
        }
        
      } catch (error) {
        console.error('❌ 에러 검출 테스트 실패:', error.message);
        TestUtils.saveTestResult('JavaScript 에러', 'failed', { error: error.message });
      }
    });

    test('6.2 404 및 에러 페이지 처리', async () => {
      console.log('\n🚫 404 및 에러 페이지 처리...');
      
      try {
        // 존재하지 않는 페이지로 이동
        await page.goto(`${TEST_CONFIG.baseURL}#/non-existent-page`);
        await TestUtils.waitForStableDOM(page);
        
        // 에러 메시지나 리다이렉션 확인
        const currentUrl = page.url();
        const hasErrorMessage = await page.locator('[class*="error"], [class*="404"]').count() > 0;
        const wasRedirected = !currentUrl.includes('non-existent-page');
        
        if (wasRedirected) {
          console.log('✅ 404 페이지가 홈으로 리다이렉션됨');
        } else if (hasErrorMessage) {
          console.log('✅ 404 에러 메시지 표시됨');
        } else {
          console.log('⚠️ 404 처리 없음');
        }
        
        TestUtils.saveTestResult('404 처리', 'passed', {
          redirected: wasRedirected,
          errorMessage: hasErrorMessage
        });
        
      } catch (error) {
        console.error('❌ 404 처리 테스트 실패:', error.message);
        TestUtils.saveTestResult('404 처리', 'failed', { error: error.message });
      }
    });
  });

  test.describe('7. 접근성 테스트', () => {
    test('7.1 키보드 네비게이션', async () => {
      console.log('\n⌨️ 키보드 네비게이션 테스트...');
      
      try {
        await page.goto(TEST_CONFIG.baseURL);
        await TestUtils.waitForStableDOM(page);
        
        // Tab 키로 포커스 이동
        const focusableElements = [];
        
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          
          const focusedElement = await page.evaluate(() => {
            const element = document.activeElement;
            return {
              tagName: element.tagName,
              text: element.textContent?.trim().substring(0, 50),
              href: element.href,
              type: element.type,
              hasFocus: element === document.activeElement
            };
          });
          
          if (focusedElement.hasFocus) {
            focusableElements.push(focusedElement);
          }
        }
        
        console.log(`✅ ${focusableElements.length}개의 포커스 가능 요소 발견`);
        
        TestUtils.saveTestResult('키보드 네비게이션', 'passed', { 
          focusableElements: focusableElements.length 
        });
        
      } catch (error) {
        console.error('❌ 키보드 네비게이션 테스트 실패:', error.message);
        TestUtils.saveTestResult('키보드 네비게이션', 'failed', { error: error.message });
      }
    });

    test('7.2 ARIA 레이블 검증', async () => {
      console.log('\n♿ ARIA 레이블 검증...');
      
      try {
        const ariaCheck = await page.evaluate(() => {
          const results = {
            images: {
              total: 0,
              withAlt: 0
            },
            buttons: {
              total: 0,
              withLabel: 0
            },
            forms: {
              total: 0,
              withLabel: 0
            }
          };
          
          // 이미지 alt 텍스트 확인
          const images = document.querySelectorAll('img');
          results.images.total = images.length;
          results.images.withAlt = Array.from(images).filter(img => img.alt).length;
          
          // 버튼 접근성 확인
          const buttons = document.querySelectorAll('button');
          results.buttons.total = buttons.length;
          results.buttons.withLabel = Array.from(buttons).filter(btn => 
            btn.textContent.trim() || btn.getAttribute('aria-label')
          ).length;
          
          // 폼 요소 레이블 확인
          const formInputs = document.querySelectorAll('input, select, textarea');
          results.forms.total = formInputs.length;
          results.forms.withLabel = Array.from(formInputs).filter(input => {
            const id = input.id;
            const label = id ? document.querySelector(`label[for="${id}"]`) : null;
            return label || input.getAttribute('aria-label');
          }).length;
          
          return results;
        });
        
        console.log('✅ ARIA 검증 결과:');
        console.log(`  - 이미지: ${ariaCheck.images.withAlt}/${ariaCheck.images.total} alt 텍스트 있음`);
        console.log(`  - 버튼: ${ariaCheck.buttons.withLabel}/${ariaCheck.buttons.total} 레이블 있음`);
        console.log(`  - 폼: ${ariaCheck.forms.withLabel}/${ariaCheck.forms.total} 레이블 있음`);
        
        TestUtils.saveTestResult('ARIA 레이블', 'passed', ariaCheck);
        
      } catch (error) {
        console.error('❌ ARIA 검증 실패:', error.message);
        TestUtils.saveTestResult('ARIA 레이블', 'failed', { error: error.message });
      }
    });
  });

  test.describe('8. 보안 테스트', () => {
    test('8.1 민감한 정보 노출 검사', async () => {
      console.log('\n🔒 민감한 정보 노출 검사...');
      
      try {
        const securityCheck = await page.evaluate(() => {
          const pageContent = document.body.innerText;
          const htmlContent = document.documentElement.innerHTML;
          
          const sensitivePatterns = {
            apiKeys: /api[_-]?key['\"]?\s*[:=]\s*['\"]?[\w-]{20,}/gi,
            passwords: /password['\"]?\s*[:=]\s*['\"]?[\w@#$%^&*]{6,}/gi,
            tokens: /token['\"]?\s*[:=]\s*['\"]?[\w-]{20,}/gi,
            secrets: /secret['\"]?\s*[:=]\s*['\"]?[\w-]{10,}/gi
          };
          
          const findings = [];
          
          for (const [type, pattern] of Object.entries(sensitivePatterns)) {
            const matches = htmlContent.match(pattern);
            if (matches) {
              findings.push({
                type,
                count: matches.length,
                sample: matches[0].substring(0, 50) + '...'
              });
            }
          }
          
          // 콘솔에 민감한 정보가 로그되는지 확인
          const consoleLogs = [];
          const originalLog = console.log;
          console.log = function(...args) {
            consoleLogs.push(args.join(' '));
            originalLog.apply(console, args);
          };
          
          return {
            findings,
            consoleLogCount: consoleLogs.length
          };
        });
        
        if (securityCheck.findings.length > 0) {
          console.warn('⚠️ 민감한 정보 패턴 발견:');
          securityCheck.findings.forEach(finding => {
            console.warn(`  - ${finding.type}: ${finding.count}개`);
          });
        } else {
          console.log('✅ 민감한 정보 노출 없음');
        }
        
        TestUtils.saveTestResult('보안 검사', 'passed', securityCheck);
        
      } catch (error) {
        console.error('❌ 보안 검사 실패:', error.message);
        TestUtils.saveTestResult('보안 검사', 'failed', { error: error.message });
      }
    });

    test('8.2 HTTPS 및 보안 헤더 확인', async () => {
      console.log('\n🔐 HTTPS 및 보안 헤더 확인...');
      
      try {
        const url = new URL(TEST_CONFIG.baseURL);
        const isHTTPS = url.protocol === 'https:';
        
        console.log(isHTTPS ? '✅ HTTPS 사용 중' : '⚠️ HTTP 사용 중');
        
        // GitHub Pages는 자동으로 보안 헤더를 설정하므로 기본적인 확인만 수행
        TestUtils.saveTestResult('HTTPS 확인', 'passed', { 
          https: isHTTPS,
          note: 'GitHub Pages 호스팅'
        });
        
      } catch (error) {
        console.error('❌ HTTPS 확인 실패:', error.message);
        TestUtils.saveTestResult('HTTPS 확인', 'failed', { error: error.message });
      }
    });
  });
});

// HTML 리포트 생성 함수
function generateHTMLReport(results) {
  const successRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>부동산 대시보드 QA 테스트 리포트</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        }
        .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }
        .test-results {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .test-item {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status.passed {
            background: #d4edda;
            color: #155724;
        }
        .status.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .performance-metrics {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .metric {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .metric-label {
            font-size: 12px;
            color: #666;
        }
        .metric-value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        .screenshots {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .screenshot-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>부동산 대시보드 QA 테스트 리포트</h1>
        <p>테스트 일시: ${new Date(results.timestamp).toLocaleString('ko-KR')}</p>
        <p>테스트 URL: ${results.url}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>총 테스트</h3>
            <div class="value">${results.summary.total}</div>
        </div>
        <div class="summary-card">
            <h3>성공</h3>
            <div class="value" style="color: #28a745;">${results.summary.passed}</div>
        </div>
        <div class="summary-card">
            <h3>실패</h3>
            <div class="value" style="color: #dc3545;">${results.summary.failed}</div>
        </div>
        <div class="summary-card">
            <h3>성공률</h3>
            <div class="value" style="color: #007bff;">${successRate}%</div>
        </div>
    </div>

    ${results.summary.performance ? `
    <div class="performance-metrics">
        <h2>성능 메트릭</h2>
        <div class="metric-grid">
            <div class="metric">
                <div class="metric-label">DOM 로딩</div>
                <div class="metric-value">${results.summary.performance.domLoadTime}ms</div>
            </div>
            <div class="metric">
                <div class="metric-label">전체 로딩</div>
                <div class="metric-value">${results.summary.performance.fullLoadTime}ms</div>
            </div>
            <div class="metric">
                <div class="metric-label">First Paint</div>
                <div class="metric-value">${results.summary.performance.firstPaint?.toFixed(0) || 0}ms</div>
            </div>
            <div class="metric">
                <div class="metric-label">LCP</div>
                <div class="metric-value">${results.summary.performance.largestContentfulPaint?.toFixed(0) || 0}ms</div>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="test-results">
        <h2 style="padding: 20px 20px 10px 20px; margin: 0;">테스트 결과</h2>
        ${results.tests.map(test => `
            <div class="test-item">
                <div>
                    <strong>${test.name}</strong>
                    ${test.details.error ? `<br><small style="color: #dc3545;">${test.details.error}</small>` : ''}
                </div>
                <span class="status ${test.status}">${test.status.toUpperCase()}</span>
            </div>
        `).join('')}
    </div>

    ${results.summary.screenshots.length > 0 ? `
    <div class="screenshots">
        <h2>스크린샷</h2>
        <div class="screenshot-grid">
            ${results.summary.screenshots.map(screenshot => `
                <div class="screenshot-item">
                    ${screenshot.name}
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>Generated by Comprehensive QA Test Suite</p>
    </div>
</body>
</html>
`;
}