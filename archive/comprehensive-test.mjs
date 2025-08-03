import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// 테스트 결과를 저장할 객체
const testResults = {
  timestamp: new Date().toISOString(),
  url: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  testCredentials: {
    email: 'jenny@the-realty.co.kr',
    password: 'admin123!'
  },
  results: [],
  screenshots: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    issues: []
  }
};

// 테스트 결과 저장 함수
function logTestResult(testName, status, details = '', duration = 0) {
  const result = {
    testName,
    status,
    details,
    duration,
    timestamp: new Date().toISOString()
  };
  testResults.results.push(result);
  testResults.summary.total++;
  if (status === 'PASS') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
    testResults.summary.issues.push(`${testName}: ${details}`);
  }
  console.log(`[${status}] ${testName} - ${details} (${duration}ms)`);
}

// 스크린샷 저장 함수
async function takeScreenshot(page, name, viewport = null) {
  try {
    const screenshotPath = `./test-results/${name}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    testResults.screenshots.push({
      name,
      path: screenshotPath,
      viewport: viewport || await page.viewportSize(),
      timestamp: new Date().toISOString()
    });
    console.log(`📸 스크린샷 저장: ${screenshotPath}`);
  } catch (error) {
    console.error(`스크린샷 저장 실패: ${error.message}`);
  }
}

// 메인 테스트 함수
async function runComprehensiveTests() {
  console.log('🚀 더부동산 매물 관리 시스템 자동화 테스트 시작');
  console.log(`🎯 테스트 대상: ${testResults.url}`);
  console.log(`👤 테스트 계정: ${testResults.testCredentials.email}`);
  console.log('=' .repeat(80));

  // test-results 디렉토리 생성
  if (!fs.existsSync('./test-results')) {
    fs.mkdirSync('./test-results', { recursive: true });
  }

  const browser = await chromium.launch({ 
    headless: false, // 시각적으로 테스트 과정을 보여주기 위해
    slowMo: 1000 // 1초 딜레이로 천천히 실행
  });

  try {
    // 1. 페이지 접근성 테스트 (데스크톱)
    await testPageAccessibility(browser);
    
    // 2. 로그인 기능 테스트
    await testLoginFunctionality(browser);
    
    // 3. 매물 관리 기능 테스트
    await testPropertyManagement(browser);
    
    // 4. 대시보드 기능 테스트
    await testDashboardFunctionality(browser);
    
    // 5. 반응형 디자인 테스트
    await testResponsiveDesign(browser);

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    logTestResult('전체 테스트 실행', 'FAIL', error.message);
  } finally {
    await browser.close();
    
    // 테스트 결과 리포트 생성
    await generateTestReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 테스트 완료 요약');
    console.log(`✅ 통과: ${testResults.summary.passed}/${testResults.summary.total}`);
    console.log(`❌ 실패: ${testResults.summary.failed}/${testResults.summary.total}`);
    if (testResults.summary.issues.length > 0) {
      console.log('\n🚨 발견된 이슈:');
      testResults.summary.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log('='.repeat(80));
  }
}

// 1. 페이지 접근성 테스트
async function testPageAccessibility(browser) {
  console.log('\n📝 1. 페이지 접근성 테스트 시작');
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // 홈페이지 로딩 테스트
    const startTime = Date.now();
    const response = await page.goto(testResults.url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;
    
    if (response && response.ok()) {
      logTestResult('홈페이지 로딩', 'PASS', `응답시간: ${loadTime}ms`, loadTime);
    } else {
      logTestResult('홈페이지 로딩', 'FAIL', `HTTP 상태: ${response?.status() || 'No response'}`);
    }
    
    // 페이지 타이틀 확인
    const title = await page.title();
    if (title && title.trim().length > 0) {
      logTestResult('페이지 타이틀 존재', 'PASS', `타이틀: "${title}"`);
    } else {
      logTestResult('페이지 타이틀 존재', 'FAIL', '타이틀이 비어있거나 존재하지 않음');
    }
    
    // 기본 UI 요소 존재 확인
    await testUIElements(page);
    
    // 첫 번째 스크린샷 (홈페이지)
    await takeScreenshot(page, 'homepage-desktop', { width: 1920, height: 1080 });
    
  } catch (error) {
    logTestResult('페이지 접근성 테스트', 'FAIL', error.message);
  } finally {
    await context.close();
  }
}

// UI 요소 존재 확인
async function testUIElements(page) {
  const elements = [
    { selector: 'body', name: 'Body 요소' },
    { selector: 'header, nav, .navbar', name: '네비게이션' },
    { selector: 'main, .main-content, .container', name: '메인 컨텐츠' },
    { selector: 'footer', name: '푸터' }
  ];
  
  for (const element of elements) {
    try {
      const exists = await page.locator(element.selector).first().isVisible({ timeout: 5000 });
      if (exists) {
        logTestResult(`UI 요소: ${element.name}`, 'PASS', `선택자: ${element.selector}`);
      } else {
        logTestResult(`UI 요소: ${element.name}`, 'FAIL', `요소를 찾을 수 없음: ${element.selector}`);
      }
    } catch (error) {
      logTestResult(`UI 요소: ${element.name}`, 'FAIL', `오류: ${error.message}`);
    }
  }
}

// 2. 로그인 기능 테스트
async function testLoginFunctionality(browser) {
  console.log('\n🔐 2. 로그인 기능 테스트 시작');
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    await page.goto(testResults.url, { waitUntil: 'networkidle' });
    
    // 로그인 폼 찾기
    const loginSelectors = [
      'form[data-testid="login-form"]',
      '.login-form',
      'form:has(input[type="email"])',
      'form:has(input[type="password"])'
    ];
    
    let loginForm = null;
    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        loginForm = selector;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (loginForm) {
      logTestResult('로그인 폼 표시', 'PASS', `선택자: ${loginForm}`);
      
      // 로그인 시도
      await attemptLogin(page);
      
    } else {
      // 로그인 버튼 찾기
      const loginButtons = [
        'button:has-text("로그인")',
        'button:has-text("Login")',
        'a:has-text("로그인")',
        '.login-btn',
        '[data-testid="login-button"]'
      ];
      
      let loginButton = null;
      for (const selector of loginButtons) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            loginButton = selector;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (loginButton) {
        logTestResult('로그인 버튼 발견', 'PASS', `선택자: ${loginButton}`);
        await page.locator(loginButton).first().click();
        await page.waitForTimeout(2000);
        
        // 로그인 페이지로 이동 후 다시 시도
        await attemptLogin(page);
      } else {
        logTestResult('로그인 폼/버튼 표시', 'FAIL', '로그인 관련 요소를 찾을 수 없음');
      }
    }
    
    await takeScreenshot(page, 'login-page-desktop');
    
  } catch (error) {
    logTestResult('로그인 기능 테스트', 'FAIL', error.message);
  } finally {
    await context.close();
  }
}

// 로그인 시도 함수
async function attemptLogin(page) {
  try {
    // 이메일 입력 필드 찾기
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="이메일"]',
      'input[placeholder*="email"]'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
          emailInput = selector;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 비밀번호 입력 필드 찾기
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="비밀번호"]',
      'input[placeholder*="password"]'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
          passwordInput = selector;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (emailInput && passwordInput) {
      // 로그인 정보 입력
      await page.fill(emailInput, testResults.testCredentials.email);
      await page.fill(passwordInput, testResults.testCredentials.password);
      
      logTestResult('로그인 정보 입력', 'PASS', `이메일: ${testResults.testCredentials.email}`);
      
      // 로그인 버튼 클릭
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("로그인")',
        'button:has-text("Login")'
      ];
      
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await button.click();
            submitted = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (submitted) {
        await page.waitForTimeout(3000);
        
        // 로그인 성공 확인
        const currentUrl = page.url();
        const hasSuccessIndicator = await checkLoginSuccess(page);
        
        if (hasSuccessIndicator || currentUrl !== testResults.url) {
          logTestResult('로그인 시도', 'PASS', '로그인 성공으로 추정됨');
        } else {
          logTestResult('로그인 시도', 'FAIL', '로그인 실패 또는 피드백 없음');
        }
      } else {
        logTestResult('로그인 버튼 클릭', 'FAIL', '로그인 버튼을 찾을 수 없음');
      }
    } else {
      logTestResult('로그인 입력 필드', 'FAIL', `이메일 필드: ${!!emailInput}, 비밀번호 필드: ${!!passwordInput}`);
    }
  } catch (error) {
    logTestResult('로그인 시도', 'FAIL', error.message);
  }
}

// 로그인 성공 확인
async function checkLoginSuccess(page) {
  const successIndicators = [
    '.dashboard',
    '.user-menu',
    '.logout-btn',
    'button:has-text("로그아웃")',
    'button:has-text("Logout")',
    '.welcome',
    '[data-testid="user-avatar"]'
  ];
  
  for (const selector of successIndicators) {
    try {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 })) {
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  return false;
}

// 3. 매물 관리 기능 테스트
async function testPropertyManagement(browser) {
  console.log('\n🏠 3. 매물 관리 기능 테스트 시작');
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    await page.goto(testResults.url, { waitUntil: 'networkidle' });
    
    // 매물 관련 메뉴 찾기
    const propertyMenuSelectors = [
      'a:has-text("매물")',
      'a:has-text("Property")',
      'a:has-text("매물관리")',
      'a:has-text("매물 목록")',
      '.nav-item:has-text("매물")'
    ];
    
    let propertyMenuFound = false;
    for (const selector of propertyMenuSelectors) {
      try {
        const menu = page.locator(selector).first();
        if (await menu.isVisible({ timeout: 3000 })) {
          await menu.click();
          await page.waitForTimeout(2000);
          propertyMenuFound = true;
          logTestResult('매물 메뉴 접근', 'PASS', `선택자: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!propertyMenuFound) {
      logTestResult('매물 메뉴 접근', 'FAIL', '매물 관련 메뉴를 찾을 수 없음');
    }
    
    // 매물 등록 버튼 찾기
    const addButtonSelectors = [
      'button:has-text("매물 등록")',
      'button:has-text("등록")',
      'button:has-text("추가")',
      'button:has-text("Add")',
      '.add-btn',
      '.create-btn'
    ];
    
    let addButtonFound = false;
    for (const selector of addButtonSelectors) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 3000 })) {
          logTestResult('매물 등록 버튼 존재', 'PASS', `선택자: ${selector}`);
          addButtonFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!addButtonFound) {
      logTestResult('매물 등록 버튼 존재', 'FAIL', '등록 버튼을 찾을 수 없음');
    }
    
    // 검색/필터 기능 확인
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="검색"]',
      'input[placeholder*="Search"]',
      '.search-input',
      '.filter-input'
    ];
    
    let searchFound = false;
    for (const selector of searchSelectors) {
      try {
        if (await page.locator(selector).first().isVisible({ timeout: 3000 })) {
          logTestResult('검색/필터 기능', 'PASS', `선택자: ${selector}`);
          searchFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!searchFound) {
      logTestResult('검색/필터 기능', 'FAIL', '검색 기능을 찾을 수 없음');
    }
    
    await takeScreenshot(page, 'property-management-desktop');
    
  } catch (error) {
    logTestResult('매물 관리 기능 테스트', 'FAIL', error.message);
  } finally {
    await context.close();
  }
}

// 4. 대시보드 기능 테스트
async function testDashboardFunctionality(browser) {
  console.log('\n📊 4. 대시보드 기능 테스트 시작');
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    await page.goto(testResults.url, { waitUntil: 'networkidle' });
    
    // 대시보드 메뉴 찾기
    const dashboardSelectors = [
      'a:has-text("대시보드")',
      'a:has-text("Dashboard")',
      'a:has-text("홈")',
      'a:has-text("Home")',
      '.nav-item:has-text("대시보드")'
    ];
    
    let dashboardFound = false;
    for (const selector of dashboardSelectors) {
      try {
        const menu = page.locator(selector).first();
        if (await menu.isVisible({ timeout: 3000 })) {
          await menu.click();
          await page.waitForTimeout(2000);
          dashboardFound = true;
          logTestResult('대시보드 페이지 접근', 'PASS', `선택자: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!dashboardFound) {
      logTestResult('대시보드 페이지 접근', 'FAIL', '대시보드 메뉴를 찾을 수 없음');
    }
    
    // 통계 데이터 확인
    const statsSelectors = [
      '.stats-card',
      '.statistic',
      '.metric',
      '.count',
      '.number',
      '[class*="stat"]'
    ];
    
    let statsFound = false;
    for (const selector of statsSelectors) {
      try {
        const stats = await page.locator(selector).count();
        if (stats > 0) {
          logTestResult('통계 데이터 표시', 'PASS', `${stats}개의 통계 요소 발견`);
          statsFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!statsFound) {
      logTestResult('통계 데이터 표시', 'FAIL', '통계 데이터를 찾을 수 없음');
    }
    
    // 차트 렌더링 확인
    const chartSelectors = [
      'canvas',
      '.chart',
      '.graph',
      'svg',
      '[class*="chart"]'
    ];
    
    let chartsFound = false;
    for (const selector of chartSelectors) {
      try {
        const charts = await page.locator(selector).count();
        if (charts > 0) {
          logTestResult('차트 렌더링', 'PASS', `${charts}개의 차트 요소 발견`);
          chartsFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!chartsFound) {
      logTestResult('차트 렌더링', 'FAIL', '차트 요소를 찾을 수 없음');
    }
    
    await takeScreenshot(page, 'dashboard-desktop');
    
  } catch (error) {
    logTestResult('대시보드 기능 테스트', 'FAIL', error.message);
  } finally {
    await context.close();
  }
}

// 5. 반응형 디자인 테스트
async function testResponsiveDesign(browser) {
  console.log('\n📱 5. 반응형 디자인 테스트 시작');
  
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];
  
  for (const viewport of viewports) {
    console.log(`\n  📏 ${viewport.name} 테스트 (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();
    
    try {
      const startTime = Date.now();
      await page.goto(testResults.url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      logTestResult(`${viewport.name} 페이지 로딩`, 'PASS', `응답시간: ${loadTime}ms`, loadTime);
      
      // 뷰포트별 레이아웃 확인
      await testViewportLayout(page, viewport.name);
      
      // 스크린샷 촬영
      await takeScreenshot(page, `${viewport.name.toLowerCase()}-responsive`, viewport);
      
    } catch (error) {
      logTestResult(`${viewport.name} 반응형 테스트`, 'FAIL', error.message);
    } finally {
      await context.close();
    }
  }
}

// 뷰포트별 레이아웃 테스트
async function testViewportLayout(page, viewportName) {
  try {
    // 기본 요소들이 표시되는지 확인
    const elements = [
      { selector: 'body', name: '페이지 본문' },
      { selector: 'header, nav, .navbar', name: '네비게이션' },
      { selector: 'main, .main-content', name: '메인 컨텐츠' }
    ];
    
    for (const element of elements) {
      try {
        const isVisible = await page.locator(element.selector).first().isVisible({ timeout: 5000 });
        if (isVisible) {
          logTestResult(`${viewportName} - ${element.name}`, 'PASS', '요소가 정상적으로 표시됨');
        } else {
          logTestResult(`${viewportName} - ${element.name}`, 'FAIL', '요소가 표시되지 않음');
        }
      } catch (error) {
        logTestResult(`${viewportName} - ${element.name}`, 'FAIL', error.message);
      }
    }
    
    // 모바일에서 햄버거 메뉴 확인
    if (viewportName === 'Mobile') {
      const mobileMenuSelectors = [
        '.hamburger',
        '.menu-toggle',
        'button[aria-label*="menu"]',
        '.mobile-menu-btn'
      ];
      
      let mobileMenuFound = false;
      for (const selector of mobileMenuSelectors) {
        try {
          if (await page.locator(selector).first().isVisible({ timeout: 3000 })) {
            logTestResult('모바일 메뉴 버튼', 'PASS', `선택자: ${selector}`);
            mobileMenuFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!mobileMenuFound) {
        logTestResult('모바일 메뉴 버튼', 'FAIL', '모바일 메뉴 버튼을 찾을 수 없음');
      }
    }
    
  } catch (error) {
    logTestResult(`${viewportName} 레이아웃 테스트`, 'FAIL', error.message);
  }
}

// 테스트 결과 리포트 생성
async function generateTestReport() {
  const reportPath = './test-results/test-report.json';
  const htmlReportPath = './test-results/test-report.html';
  
  // JSON 리포트 저장
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // HTML 리포트 생성
  const htmlReport = generateHTMLReport();
  fs.writeFileSync(htmlReportPath, htmlReport);
  
  console.log(`\n📄 테스트 리포트 생성 완료:`);
  console.log(`  - JSON: ${reportPath}`);
  console.log(`  - HTML: ${htmlReportPath}`);
}

// HTML 리포트 생성 함수
function generateHTMLReport() {
  const passRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1);
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>더부동산 자동화 테스트 리포트</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .test-result { margin-bottom: 10px; padding: 10px; border-radius: 4px; }
        .test-result.PASS { background: #d4edda; border-left: 4px solid #28a745; }
        .test-result.FAIL { background: #f8d7da; border-left: 4px solid #dc3545; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .screenshot { border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
        .screenshot img { width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>더부동산 매물 관리 시스템 자동화 테스트 리포트</h1>
        <p><strong>테스트 URL:</strong> ${testResults.url}</p>
        <p><strong>실행 시간:</strong> ${testResults.timestamp}</p>
        <p><strong>테스트 계정:</strong> ${testResults.testCredentials.email}</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <h3>전체 테스트</h3>
            <div style="font-size: 2em; font-weight: bold;">${testResults.summary.total}</div>
        </div>
        <div class="stat-card">
            <h3 class="pass">통과</h3>
            <div style="font-size: 2em; font-weight: bold;" class="pass">${testResults.summary.passed}</div>
        </div>
        <div class="stat-card">
            <h3 class="fail">실패</h3>
            <div style="font-size: 2em; font-weight: bold;" class="fail">${testResults.summary.failed}</div>
        </div>
        <div class="stat-card">
            <h3>성공률</h3>
            <div style="font-size: 2em; font-weight: bold;">${passRate}%</div>
        </div>
    </div>
    
    <h2>테스트 결과 상세</h2>
    ${testResults.results.map(result => `
        <div class="test-result ${result.status}">
            <strong>[${result.status}] ${result.testName}</strong><br>
            <small>${result.details} ${result.duration > 0 ? `(${result.duration}ms)` : ''}</small><br>
            <small>${result.timestamp}</small>
        </div>
    `).join('')}
    
    ${testResults.summary.issues.length > 0 ? `
        <h2>발견된 이슈</h2>
        <ul>
            ${testResults.summary.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
    ` : ''}
    
    <h2>스크린샷</h2>
    <div class="screenshots">
        ${testResults.screenshots.map(screenshot => `
            <div class="screenshot">
                <h4>${screenshot.name}</h4>
                <p><small>${screenshot.viewport.width}x${screenshot.viewport.height} - ${screenshot.timestamp}</small></p>
                <img src="${path.basename(screenshot.path)}" alt="${screenshot.name}">
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

// 테스트 실행
await runComprehensiveTests();