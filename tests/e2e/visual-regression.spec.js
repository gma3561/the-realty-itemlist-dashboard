const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// 시각적 회귀 테스트 설정
const VISUAL_CONFIG = {
  baseURL: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  screenshotOptions: {
    fullPage: true,
    animations: 'disabled',
    mask: [], // 동적 콘텐츠 마스킹용
  },
  viewports: {
    desktop: { width: 1920, height: 1080 },
    laptop: { width: 1366, height: 768 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 }
  },
  pages: [
    { name: '대시보드', path: '#/', waitFor: '[class*="dashboard"]' },
    { name: '로그인', path: '#/login', waitFor: 'form' },
    { name: '매물목록', path: '#/properties', waitFor: '[class*="property"]' },
    { name: '매물등록', path: '#/properties/new', waitFor: 'form' },
    { name: '사용자관리', path: '#/users', waitFor: '[class*="user"]' },
    { name: '고객관리', path: '#/customers', waitFor: '[class*="customer"]' },
    { name: '설정', path: '#/settings', waitFor: '[class*="settings"]' },
    { name: '업데이트내역', path: '#/updates', waitFor: '[class*="update"]' }
  ]
};

// 시각적 회귀 테스트 결과 저장
let visualTestResults = {
  timestamp: new Date().toISOString(),
  config: VISUAL_CONFIG,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    newBaselines: 0
  }
};

test.describe('시각적 회귀 테스트', () => {
  test.beforeAll(async () => {
    // 베이스라인 디렉토리 생성
    const dirs = [
      './test-results/visual-regression/baseline',
      './test-results/visual-regression/current',
      './test-results/visual-regression/diff'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });

  test.afterAll(async () => {
    // 테스트 결과 저장
    const reportPath = './test-results/visual-regression/report.json';
    fs.writeFileSync(reportPath, JSON.stringify(visualTestResults, null, 2));
    
    // HTML 리포트 생성
    const htmlReport = generateVisualReport(visualTestResults);
    fs.writeFileSync('./test-results/visual-regression/report.html', htmlReport);
    
    console.log('\n=== 시각적 회귀 테스트 결과 ===');
    console.log(`총 테스트: ${visualTestResults.summary.total}`);
    console.log(`통과: ${visualTestResults.summary.passed}`);
    console.log(`실패: ${visualTestResults.summary.failed}`);
    console.log(`새 베이스라인: ${visualTestResults.summary.newBaselines}`);
  });

  // 각 페이지와 뷰포트 조합에 대한 테스트 생성
  for (const page of VISUAL_CONFIG.pages) {
    test.describe(`${page.name} 페이지`, () => {
      for (const [deviceName, viewport] of Object.entries(VISUAL_CONFIG.viewports)) {
        test(`${deviceName} 뷰포트 (${viewport.width}x${viewport.height})`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: viewport,
            deviceScaleFactor: deviceName === 'mobile' ? 2 : 1
          });
          
          const browserPage = await context.newPage();
          
          try {
            // 페이지 로드
            await browserPage.goto(`${VISUAL_CONFIG.baseURL}${page.path}`);
            
            // 대기 조건
            if (page.waitFor) {
              await browserPage.waitForSelector(page.waitFor, { timeout: 10000 }).catch(() => {});
            }
            
            // 애니메이션 완료 대기
            await browserPage.waitForTimeout(1000);
            
            // 동적 콘텐츠 마스킹 (날짜, 시간 등)
            await browserPage.evaluate(() => {
              // 날짜/시간 요소 마스킹
              const dateElements = document.querySelectorAll('[class*="date"], [class*="time"], time');
              dateElements.forEach(el => {
                el.style.visibility = 'hidden';
              });
              
              // 로딩 스피너 제거
              const spinners = document.querySelectorAll('[class*="spinner"], [class*="loading"]');
              spinners.forEach(el => el.remove());
            });
            
            // 스크린샷 파일명
            const screenshotName = `${page.name}-${deviceName}`.replace(/\s+/g, '-').toLowerCase();
            const baselinePath = `./test-results/visual-regression/baseline/${screenshotName}.png`;
            const currentPath = `./test-results/visual-regression/current/${screenshotName}.png`;
            const diffPath = `./test-results/visual-regression/diff/${screenshotName}.png`;
            
            // 현재 스크린샷 캡처
            await browserPage.screenshot({
              path: currentPath,
              ...VISUAL_CONFIG.screenshotOptions
            });
            
            // 베이스라인과 비교
            if (fs.existsSync(baselinePath)) {
              // Playwright의 toHaveScreenshot 사용
              try {
                await expect(browserPage).toHaveScreenshot(screenshotName + '.png', {
                  maxDiffPixels: 100,
                  threshold: 0.2,
                  ...VISUAL_CONFIG.screenshotOptions
                });
                
                console.log(`✅ ${page.name} - ${deviceName}: 시각적 일치`);
                
                visualTestResults.tests.push({
                  page: page.name,
                  device: deviceName,
                  status: 'passed',
                  baseline: baselinePath,
                  current: currentPath
                });
                visualTestResults.summary.passed++;
                
              } catch (error) {
                console.error(`❌ ${page.name} - ${deviceName}: 시각적 차이 발견`);
                
                visualTestResults.tests.push({
                  page: page.name,
                  device: deviceName,
                  status: 'failed',
                  baseline: baselinePath,
                  current: currentPath,
                  diff: diffPath,
                  error: '시각적 차이가 임계값을 초과했습니다'
                });
                visualTestResults.summary.failed++;
              }
            } else {
              // 베이스라인이 없으면 생성
              fs.copyFileSync(currentPath, baselinePath);
              console.log(`📸 ${page.name} - ${deviceName}: 새 베이스라인 생성`);
              
              visualTestResults.tests.push({
                page: page.name,
                device: deviceName,
                status: 'new',
                baseline: baselinePath,
                current: currentPath
              });
              visualTestResults.summary.newBaselines++;
            }
            
            visualTestResults.summary.total++;
            
          } catch (error) {
            console.error(`❌ ${page.name} - ${deviceName}: 테스트 실패 - ${error.message}`);
            
            visualTestResults.tests.push({
              page: page.name,
              device: deviceName,
              status: 'error',
              error: error.message
            });
            visualTestResults.summary.failed++;
            visualTestResults.summary.total++;
            
          } finally {
            await context.close();
          }
        });
      }
    });
  }

  test.describe('컴포넌트 수준 시각적 테스트', () => {
    test('주요 UI 컴포넌트', async ({ page }) => {
      await page.goto(VISUAL_CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      const components = [
        { name: '헤더', selector: 'header, .header' },
        { name: '네비게이션', selector: 'nav, .navigation' },
        { name: '통계카드', selector: '[class*="stat"], [class*="card"]' },
        { name: '차트', selector: 'canvas, svg[class*="chart"]' },
        { name: '버튼', selector: 'button' },
        { name: '폼', selector: 'form' }
      ];
      
      for (const component of components) {
        try {
          const element = page.locator(component.selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            const screenshotName = `component-${component.name}`.replace(/\s+/g, '-').toLowerCase();
            await element.screenshot({
              path: `./test-results/visual-regression/current/${screenshotName}.png`
            });
            
            console.log(`✅ 컴포넌트 캡처: ${component.name}`);
          }
        } catch (error) {
          console.log(`⚠️ 컴포넌트 캡처 실패: ${component.name}`);
        }
      }
    });
  });

  test.describe('인터랙션 상태 시각적 테스트', () => {
    test('호버 및 포커스 상태', async ({ page }) => {
      await page.goto(VISUAL_CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      
      // 버튼 호버 상태
      const buttons = await page.locator('button').all();
      if (buttons.length > 0) {
        await buttons[0].hover();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: './test-results/visual-regression/current/interaction-button-hover.png'
        });
      }
      
      // 입력 필드 포커스 상태
      const inputs = await page.locator('input').all();
      if (inputs.length > 0) {
        await inputs[0].focus();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: './test-results/visual-regression/current/interaction-input-focus.png'
        });
      }
      
      console.log('✅ 인터랙션 상태 캡처 완료');
    });
  });

  test.describe('다크모드 시각적 테스트', () => {
    test.skip('다크모드 토글', async ({ page }) => {
      // 다크모드가 구현된 경우 활성화
      await page.goto(VISUAL_CONFIG.baseURL);
      
      // 다크모드 토글 찾기
      const darkModeToggle = page.locator('[aria-label*="dark"], [class*="dark-mode"], [class*="theme"]');
      
      if (await darkModeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await darkModeToggle.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({
          path: './test-results/visual-regression/current/dark-mode.png',
          fullPage: true
        });
        
        console.log('✅ 다크모드 스크린샷 캡처');
      }
    });
  });
});

// HTML 리포트 생성 함수
function generateVisualReport(results) {
  const passRate = results.summary.total > 0 
    ? ((results.summary.passed / results.summary.total) * 100).toFixed(1)
    : 0;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>시각적 회귀 테스트 리포트</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
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
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
        }
        .summary-card .value {
            font-size: 36px;
            font-weight: bold;
        }
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .test-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .test-card-header {
            padding: 15px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
        }
        .test-card-header.passed {
            background: #d4edda;
            color: #155724;
        }
        .test-card-header.failed {
            background: #f8d7da;
            color: #721c24;
        }
        .test-card-header.new {
            background: #d1ecf1;
            color: #0c5460;
        }
        .test-card-body {
            padding: 15px;
        }
        .screenshot-preview {
            width: 100%;
            height: 150px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .device-info {
            font-size: 14px;
            color: #666;
        }
        .legend {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .legend-item {
            display: inline-flex;
            align-items: center;
            margin-right: 20px;
            margin-bottom: 10px;
        }
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>시각적 회귀 테스트 리포트</h1>
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
            <h3>새 베이스라인</h3>
            <div class="value" style="color: #17a2b8;">${results.summary.newBaselines}</div>
        </div>
        <div class="summary-card">
            <h3>통과율</h3>
            <div class="value" style="color: #007bff;">${passRate}%</div>
        </div>
    </div>

    <div class="legend">
        <h3>범례</h3>
        <div class="legend-item">
            <div class="legend-color" style="background: #d4edda;"></div>
            <span>통과 - 베이스라인과 일치</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #f8d7da;"></div>
            <span>실패 - 시각적 차이 발견</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #d1ecf1;"></div>
            <span>새 베이스라인 - 첫 실행</span>
        </div>
    </div>

    <div class="test-grid">
        ${results.tests.map(test => `
            <div class="test-card">
                <div class="test-card-header ${test.status}">
                    ${test.page} - ${test.device}
                </div>
                <div class="test-card-body">
                    <div class="screenshot-preview">
                        스크린샷: ${test.page}-${test.device}
                    </div>
                    <div class="device-info">
                        상태: ${test.status === 'passed' ? '통과' : 
                              test.status === 'failed' ? '실패' :
                              test.status === 'new' ? '새 베이스라인' : '오류'}
                        ${test.error ? `<br>오류: ${test.error}` : ''}
                    </div>
                </div>
            </div>
        `).join('')}
    </div>

    <div style="margin-top: 40px; text-align: center; color: #666;">
        <p>테스트된 뷰포트: Desktop (1920x1080), Laptop (1366x768), Tablet (768x1024), Mobile (375x812)</p>
        <p>Generated by Visual Regression Test Suite</p>
    </div>
</body>
</html>
  `;
}