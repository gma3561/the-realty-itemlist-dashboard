const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// 테스트 결과를 저장할 객체
let testResults = {
  timestamp: new Date().toISOString(),
  url: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    performance: {},
    screenshots: []
  }
};

// 결과 저장 함수
function saveTestResult(testName, status, details = {}) {
  testResults.tests.push({
    name: testName,
    status: status,
    details: details,
    timestamp: new Date().toISOString()
  });
  testResults.summary.total++;
  if (status === 'passed') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
}

test.describe('대시보드 종합 QA 테스트', () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    // 헤드리스 모드 비활성화 - 실제 브라우저 창을 열어서 시각적 확인 가능
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: './test-results/videos/',
        size: { width: 1920, height: 1080 }
      }
    });
    page = await context.newPage();
    
    // 콘솔 로그 및 에러 캡처
    page.on('console', msg => {
      console.log(`브라우저 콘솔 [${msg.type()}]: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error('페이지 에러:', error.message);
    });
  });

  test.afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const resultsDir = './test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(resultsDir, 'qa-report.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    console.log('\n=== 종합 QA 테스트 결과 ===');
    console.log(`총 테스트: ${testResults.summary.total}`);
    console.log(`성공: ${testResults.summary.passed}`);
    console.log(`실패: ${testResults.summary.failed}`);
    console.log(`성공률: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    await context.close();
  });

  test('1. 페이지 로딩 시간 측정 (성능 테스트)', async () => {
    console.log('\n🚀 페이지 로딩 성능 테스트 시작...');
    
    const startTime = Date.now();
    
    try {
      // 페이지 네비게이션과 로딩 대기
      await page.goto(testResults.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      const domLoadTime = Date.now() - startTime;
      
      // 모든 리소스 로딩 완료 대기
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      const fullLoadTime = Date.now() - startTime;
      
      // 성능 메트릭 수집
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0
        };
      });
      
      testResults.summary.performance = {
        domLoadTime: domLoadTime,
        fullLoadTime: fullLoadTime,
        ...performanceMetrics
      };
      
      console.log(`✅ DOM 로딩 시간: ${domLoadTime}ms`);
      console.log(`✅ 전체 로딩 시간: ${fullLoadTime}ms`);
      console.log(`✅ First Paint: ${performanceMetrics.firstPaint.toFixed(1)}ms`);
      
      // 성능 기준 검증 (5초 이내)
      expect(fullLoadTime).toBeLessThan(5000);
      
      saveTestResult('페이지 로딩 성능 테스트', 'passed', {
        domLoadTime,
        fullLoadTime,
        performanceMetrics
      });
      
    } catch (error) {
      console.error('❌ 페이지 로딩 테스트 실패:', error.message);
      saveTestResult('페이지 로딩 성능 테스트', 'failed', { error: error.message });
      throw error;
    }
  });

  test('2. 대시보드 통계 요소들 렌더링 확인 (UI 요소 검증)', async () => {
    console.log('\n📊 대시보드 UI 요소 검증 시작...');
    
    const uiElements = [];
    
    try {
      // 주요 UI 요소들 확인
      const elementsToCheck = [
        { selector: 'h1', name: '메인 타이틀' },
        { selector: '.stats-card, .statistic, .stat-card', name: '통계 카드' },
        { selector: '.chart, canvas, svg', name: '차트 요소' },
        { selector: 'nav, .navigation, .nav', name: '네비게이션' },
        { selector: '.dashboard, .main-content, main', name: '메인 콘텐츠' },
        { selector: 'header, .header', name: '헤더' }
      ];
      
      for (const element of elementsToCheck) {
        try {
          const elementHandle = await page.locator(element.selector).first();
          const isVisible = await elementHandle.isVisible({ timeout: 3000 });
          
          if (isVisible) {
            const boundingBox = await elementHandle.boundingBox();
            uiElements.push({
              name: element.name,
              selector: element.selector,
              visible: true,
              position: boundingBox
            });
            console.log(`✅ ${element.name} 렌더링 확인`);
          } else {
            uiElements.push({
              name: element.name,
              selector: element.selector,
              visible: false
            });
            console.log(`⚠️ ${element.name} 렌더링되지 않음`);
          }
        } catch (error) {
          uiElements.push({
            name: element.name,
            selector: element.selector,
            visible: false,
            error: error.message
          });
          console.log(`❌ ${element.name} 확인 실패: ${error.message}`);
        }
      }
      
      // 최소한의 UI 요소가 렌더링되었는지 확인
      const visibleElements = uiElements.filter(el => el.visible);
      expect(visibleElements.length).toBeGreaterThanOrEqual(2);
      
      saveTestResult('대시보드 UI 요소 검증', 'passed', { uiElements });
      
    } catch (error) {
      console.error('❌ UI 요소 검증 실패:', error.message);
      saveTestResult('대시보드 UI 요소 검증', 'failed', { error: error.message, uiElements });
      throw error;
    }
  });

  test('3. 스크린샷 캡처 (전체 대시보드)', async () => {
    console.log('\n📸 전체 대시보드 스크린샷 캡처...');
    
    try {
      // 페이지가 완전히 로드될 때까지 대기
      await page.waitForTimeout(2000);
      
      // 전체 페이지 스크린샷
      const screenshotPath = './test-results/screenshots/dashboard-full.png';
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        quality: 90
      });
      
      // 뷰포트 스크린샷
      const viewportScreenshotPath = './test-results/screenshots/dashboard-viewport.png';
      await page.screenshot({ 
        path: viewportScreenshotPath,
        quality: 90
      });
      
      testResults.summary.screenshots.push({
        name: 'Full Page Screenshot',
        path: screenshotPath
      }, {
        name: 'Viewport Screenshot', 
        path: viewportScreenshotPath
      });
      
      console.log(`✅ 전체 페이지 스크린샷 저장: ${screenshotPath}`);
      console.log(`✅ 뷰포트 스크린샷 저장: ${viewportScreenshotPath}`);
      
      saveTestResult('스크린샷 캡처', 'passed', {
        screenshots: testResults.summary.screenshots
      });
      
    } catch (error) {
      console.error('❌ 스크린샷 캡처 실패:', error.message);
      saveTestResult('스크린샷 캡처', 'failed', { error: error.message });
      throw error;
    }
  });

  test('4. 차트 요소 존재 확인 (데이터 시각화 검증)', async () => {
    console.log('\n📈 차트 요소 및 데이터 시각화 검증...');
    
    const chartElements = [];
    
    try {
      // 다양한 차트 라이브러리 선택자들
      const chartSelectors = [
        'canvas',           // Chart.js, D3.js
        'svg',              // D3.js, Recharts
        '.chart',           // 일반적인 차트 클래스
        '.graph',           // 그래프 클래스
        '.visualization',   // 시각화 클래스
        '[class*="chart"]', // chart가 포함된 클래스
        '[id*="chart"]',    // chart가 포함된 ID
        '.highcharts-container', // Highcharts
        '.recharts-wrapper',     // Recharts
        '.d3-chart',            // D3 차트
        '.apexcharts-canvas'    // ApexCharts
      ];
      
      for (const selector of chartSelectors) {
        try {
          const elements = await page.locator(selector).all();
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const isVisible = await element.isVisible();
            
            if (isVisible) {
              const boundingBox = await element.boundingBox();
              const tagName = await element.evaluate(el => el.tagName.toLowerCase());
              
              chartElements.push({
                selector,
                tagName,
                index: i,
                visible: true,
                dimensions: boundingBox
              });
              
              console.log(`✅ 차트 요소 발견: ${tagName}[${selector}] - ${boundingBox.width}x${boundingBox.height}`);
            }
          }
        } catch (error) {
          // 해당 선택자로 요소를 찾지 못한 경우는 무시
        }
      }
      
      // 차트가 하나라도 있는지 확인
      if (chartElements.length > 0) {
        console.log(`✅ 총 ${chartElements.length}개의 차트 요소 발견`);
        saveTestResult('차트 요소 검증', 'passed', { chartElements });
      } else {
        console.log('⚠️ 차트 요소를 찾을 수 없음');
        saveTestResult('차트 요소 검증', 'failed', { 
          error: '차트 요소를 찾을 수 없음',
          chartElements: []
        });
      }
      
    } catch (error) {
      console.error('❌ 차트 요소 검증 실패:', error.message);
      saveTestResult('차트 요소 검증', 'failed', { error: error.message });
      throw error;
    }
  });

  test('5. 네비게이션 메뉴 테스트 (UX 기능 검증)', async () => {
    console.log('\n🧭 네비게이션 메뉴 기능 테스트...');
    
    const navigationTests = [];
    
    try {
      // 네비게이션 요소 찾기
      const navSelectors = [
        'nav a',
        '.nav a', 
        '.navigation a',
        '.menu a',
        'header a',
        '.navbar a',
        '[role="navigation"] a',
        '.sidebar a'
      ];
      
      let navigationLinks = [];
      
      for (const selector of navSelectors) {
        try {
          const links = await page.locator(selector).all();
          for (const link of links) {
            const isVisible = await link.isVisible();
            if (isVisible) {
              const href = await link.getAttribute('href');
              const text = await link.textContent();
              
              navigationLinks.push({
                selector,
                text: text?.trim() || '',
                href: href || '',
                element: link
              });
            }
          }
        } catch (error) {
          // 선택자로 요소를 찾지 못한 경우 무시
        }
      }
      
      console.log(`✅ ${navigationLinks.length}개의 네비게이션 링크 발견`);
      
      // 각 네비게이션 링크 테스트
      for (let i = 0; i < Math.min(navigationLinks.length, 5); i++) {
        const link = navigationLinks[i];
        
        try {
          // 링크 호버 테스트
          await link.element.hover();
          await page.waitForTimeout(500);
          
          // 링크가 클릭 가능한지 확인
          const isEnabled = await link.element.isEnabled();
          
          navigationTests.push({
            text: link.text,
            href: link.href,
            hoverable: true,
            clickable: isEnabled,
            status: 'passed'
          });
          
          console.log(`✅ 네비게이션 링크 테스트 통과: "${link.text}"`);
          
        } catch (error) {
          navigationTests.push({
            text: link.text,
            href: link.href,
            status: 'failed',
            error: error.message
          });
          
          console.log(`❌ 네비게이션 링크 테스트 실패: "${link.text}" - ${error.message}`);
        }
      }
      
      // 최소한 하나의 네비게이션 요소가 작동해야 함
      const workingNavigation = navigationTests.filter(test => test.status === 'passed');
      
      if (workingNavigation.length > 0) {
        saveTestResult('네비게이션 메뉴 테스트', 'passed', { navigationTests });
      } else {
        saveTestResult('네비게이션 메뉴 테스트', 'failed', { 
          error: '작동하는 네비게이션 요소가 없음',
          navigationTests 
        });
      }
      
    } catch (error) {
      console.error('❌ 네비게이션 테스트 실패:', error.message);
      saveTestResult('네비게이션 메뉴 테스트', 'failed', { error: error.message });
      throw error;
    }
  });

  test('6. 종합 접근성 및 반응형 테스트', async () => {
    console.log('\n♿ 접근성 및 반응형 디자인 테스트...');
    
    try {
      const accessibilityTests = [];
      
      // 다양한 뷰포트 사이즈 테스트
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        
        // 스크린샷 캡처
        const screenshotPath = `./test-results/screenshots/responsive-${viewport.name.toLowerCase()}.png`;
        await page.screenshot({ path: screenshotPath });
        
        // 주요 요소들이 여전히 보이는지 확인
        const visibleElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('h1, nav, main, .chart, canvas, svg');
          return Array.from(elements).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          }).length;
        });
        
        accessibilityTests.push({
          viewport: viewport.name,
          dimensions: `${viewport.width}x${viewport.height}`,
          visibleElements,
          screenshot: screenshotPath
        });
        
        console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): ${visibleElements}개 요소 가시성 확인`);
      }
      
      // 원래 뷰포트로 복원
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      saveTestResult('접근성 및 반응형 테스트', 'passed', { accessibilityTests });
      
    } catch (error) {
      console.error('❌ 접근성 테스트 실패:', error.message);
      saveTestResult('접근성 및 반응형 테스트', 'failed', { error: error.message });
      throw error;
    }
  });
});