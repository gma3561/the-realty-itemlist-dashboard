import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 테스트 설정
const TEST_CONFIG = {
  baseURL: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  testAccount: {
    email: 'jenny@the-realty.co.kr',
    password: 'admin123!'
  },
  delays: {
    short: 2000,
    medium: 3000,
    long: 5000
  },
  viewports: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
};

// 테스트 결과 저장 디렉토리
const RESULTS_DIR = join(__dirname, 'test-results', 'visual-automation');
const SCREENSHOTS_DIR = join(RESULTS_DIR, 'screenshots');

// 디렉토리 생성
function ensureDirectories() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

// 테스트 결과 객체
let testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  scenarios: [],
  performanceMetrics: {},
  issues: [],
  screenshots: []
};

// 로그 함수
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

// 스크린샷 촬영 함수
async function takeScreenshot(page, name, description = '') {
  try {
    const filename = `${name}_${Date.now()}.png`;
    const filepath = join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    
    testResults.screenshots.push({
      name,
      description,
      filename,
      filepath,
      timestamp: new Date().toISOString()
    });
    
    log(`스크린샷 촬영 완료: ${filename}`);
    return filepath;
  } catch (error) {
    log(`스크린샷 촬영 실패: ${error.message}`, 'ERROR');
    return null;
  }
}

// 테스트 시나리오 실행 함수
async function runTestScenario(name, testFunc, page) {
  const scenario = {
    name,
    startTime: new Date().toISOString(),
    endTime: null,
    status: 'PENDING',
    steps: [],
    issues: [],
    screenshots: []
  };
  
  testResults.scenarios.push(scenario);
  testResults.totalTests++;
  
  log(`테스트 시나리오 시작: ${name}`, 'TEST');
  
  try {
    await testFunc(page, scenario);
    scenario.status = 'PASSED';
    testResults.passedTests++;
    log(`테스트 시나리오 통과: ${name}`, 'PASS');
  } catch (error) {
    scenario.status = 'FAILED';
    scenario.issues.push({
      type: 'ERROR',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    testResults.failedTests++;
    testResults.issues.push({
      scenario: name,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    log(`테스트 시나리오 실패: ${name} - ${error.message}`, 'FAIL');
  } finally {
    scenario.endTime = new Date().toISOString();
  }
}

// 성능 메트릭 수집 함수
async function collectPerformanceMetrics(page) {
  try {
    const performanceEntries = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      return {
        navigation: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          serverResponse: navigation.responseEnd - navigation.requestStart
        },
        resources: resources.map(resource => ({
          name: resource.name,
          duration: resource.duration,
          size: resource.transferSize || 0,
          type: resource.initiatorType
        }))
      };
    });
    
    testResults.performanceMetrics = performanceEntries;
    log('성능 메트릭 수집 완료');
    return performanceEntries;
  } catch (error) {
    log(`성능 메트릭 수집 실패: ${error.message}`, 'ERROR');
    return null;
  }
}

// 1. 초기 페이지 테스트
async function testInitialPage(page, scenario) {
  scenario.steps.push('사이트 접속 시작');
  
  // 페이지 로딩 시작
  await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(TEST_CONFIG.delays.medium);
  
  scenario.steps.push('페이지 로딩 완료');
  
  // 페이지 제목 확인
  const title = await page.title();
  if (!title || title.trim() === '') {
    throw new Error('페이지 제목이 비어있습니다');
  }
  scenario.steps.push(`페이지 제목 확인: ${title}`);
  
  // 핵심 요소 존재 확인
  const bodyExists = await page.locator('body').isVisible();
  if (!bodyExists) {
    throw new Error('페이지 body 요소를 찾을 수 없습니다');
  }
  scenario.steps.push('페이지 body 요소 확인 완료');
  
  // 로그인 폼 또는 대시보드 확인
  const hasLoginForm = await page.locator('form').first().isVisible().catch(() => false);
  const hasMainContent = await page.locator('main, [role="main"], .main-content').first().isVisible().catch(() => false);
  
  if (!hasLoginForm && !hasMainContent) {
    throw new Error('로그인 폼이나 메인 컨텐츠를 찾을 수 없습니다');
  }
  
  scenario.steps.push('핵심 요소 존재 확인 완료');
  
  // 스크린샷 촬영
  await takeScreenshot(page, 'initial_page', '초기 페이지 로딩 완료');
  
  // 성능 메트릭 수집
  await collectPerformanceMetrics(page);
}

// 2. 로그인 기능 테스트
async function testLogin(page, scenario) {
  scenario.steps.push('로그인 기능 테스트 시작');
  
  // 로그인 폼 찾기
  let loginFormExists = await page.locator('form').first().isVisible().catch(() => false);
  
  if (!loginFormExists) {
    // 로그인 버튼이나 링크 찾기
    const loginButton = page.locator('button, a').filter({ hasText: /로그인|login/i }).first();
    const loginButtonExists = await loginButton.isVisible().catch(() => false);
    
    if (loginButtonExists) {
      await loginButton.click();
      await page.waitForTimeout(TEST_CONFIG.delays.short);
      scenario.steps.push('로그인 버튼 클릭');
    }
  }
  
  // 이메일 입력 필드 찾기
  const emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email"], input[id*="email"]').first();
  const emailExists = await emailInput.isVisible().catch(() => false);
  
  if (!emailExists) {
    throw new Error('이메일 입력 필드를 찾을 수 없습니다');
  }
  
  // 비밀번호 입력 필드 찾기
  const passwordInput = page.locator('input[type="password"], input[name*="password"], input[placeholder*="password"], input[id*="password"]').first();
  const passwordExists = await passwordInput.isVisible().catch(() => false);
  
  if (!passwordExists) {
    throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
  }
  
  scenario.steps.push('로그인 폼 요소 확인 완료');
  
  // 로그인 정보 입력
  await emailInput.fill(TEST_CONFIG.testAccount.email);
  await page.waitForTimeout(1000);
  await passwordInput.fill(TEST_CONFIG.testAccount.password);
  await page.waitForTimeout(1000);
  
  scenario.steps.push('로그인 정보 입력 완료');
  
  // 로그인 버튼 클릭
  const submitButton = page.locator('button[type="submit"], input[type="submit"], button').filter({ hasText: /로그인|login|submit/i }).first();
  const submitExists = await submitButton.isVisible().catch(() => false);
  
  if (!submitExists) {
    throw new Error('로그인 제출 버튼을 찾을 수 없습니다');
  }
  
  await submitButton.click();
  await page.waitForTimeout(TEST_CONFIG.delays.long);
  
  scenario.steps.push('로그인 시도 완료');
  
  // 로그인 성공 확인 (URL 변경 또는 페이지 내용 변경)
  const currentUrl = page.url();
  const hasLogoutButton = await page.locator('button, a').filter({ hasText: /로그아웃|logout/i }).first().isVisible().catch(() => false);
  const hasDashboard = await page.locator('[data-testid="dashboard"], .dashboard, main').first().isVisible().catch(() => false);
  
  if (!hasLogoutButton && !hasDashboard && currentUrl === TEST_CONFIG.baseURL) {
    // 로그인 실패 메시지 확인
    const errorMessage = await page.locator('.error, .alert, [role="alert"]').first().textContent().catch(() => '');
    throw new Error(`로그인 실패: ${errorMessage || '알 수 없는 오류'}`);
  }
  
  scenario.steps.push('로그인 성공 확인 완료');
  
  // 스크린샷 촬영
  await takeScreenshot(page, 'login_success', '로그인 성공 후 페이지');
}

// 3. 대시보드 기능 테스트
async function testDashboard(page, scenario) {
  scenario.steps.push('대시보드 기능 테스트 시작');
  
  // 대시보드 페이지 확인
  const hasDashboard = await page.locator('main, .dashboard, [data-testid="dashboard"]').first().isVisible().catch(() => false);
  
  if (!hasDashboard) {
    // 대시보드 링크 찾아서 클릭
    const dashboardLink = page.locator('a, button').filter({ hasText: /대시보드|dashboard|홈|home/i }).first();
    const linkExists = await dashboardLink.isVisible().catch(() => false);
    
    if (linkExists) {
      await dashboardLink.click();
      await page.waitForTimeout(TEST_CONFIG.delays.medium);
      scenario.steps.push('대시보드 링크 클릭');
    }
  }
  
  // 네비게이션 요소 확인
  const navElements = await page.locator('nav, .nav, .navigation, .sidebar, .menu').count();
  if (navElements === 0) {
    scenario.issues.push({
      type: 'WARNING',
      message: '네비게이션 요소를 찾을 수 없습니다',
      timestamp: new Date().toISOString()
    });
  } else {
    scenario.steps.push(`네비게이션 요소 ${navElements}개 확인`);
  }
  
  // 메인 컨텐츠 영역 확인
  const mainContent = await page.locator('main, .main-content, .content, .dashboard-content').first().isVisible().catch(() => false);
  if (!mainContent) {
    throw new Error('메인 컨텐츠 영역을 찾을 수 없습니다');
  }
  
  scenario.steps.push('메인 컨텐츠 영역 확인 완료');
  
  // 헤더 확인
  const header = await page.locator('header, .header, .top-bar').first().isVisible().catch(() => false);
  if (header) {
    scenario.steps.push('헤더 영역 확인 완료');
  }
  
  // 스크린샷 촬영
  await takeScreenshot(page, 'dashboard', '대시보드 페이지');
  
  await page.waitForTimeout(TEST_CONFIG.delays.short);
}

// 4. 매물 관리 페이지 테스트
async function testPropertyManagement(page, scenario) {
  scenario.steps.push('매물 관리 페이지 테스트 시작');
  
  // 매물 관리 메뉴 찾기
  const propertyMenu = page.locator('a, button').filter({ hasText: /매물|property|부동산/i }).first();
  const menuExists = await propertyMenu.isVisible().catch(() => false);
  
  if (menuExists) {
    await propertyMenu.click();
    await page.waitForTimeout(TEST_CONFIG.delays.medium);
    scenario.steps.push('매물 관리 메뉴 클릭');
  } else {
    // URL 직접 접근 시도
    try {
      await page.goto(`${TEST_CONFIG.baseURL}#/properties`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(TEST_CONFIG.delays.medium);
      scenario.steps.push('매물 페이지 직접 접근');
    } catch (error) {
      scenario.issues.push({
        type: 'WARNING',
        message: '매물 관리 페이지에 접근할 수 없습니다',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // 매물 목록 확인
  const propertyList = await page.locator('.property-list, .properties, table, .list').first().isVisible().catch(() => false);
  if (propertyList) {
    scenario.steps.push('매물 목록 확인 완료');
    
    // 매물 항목 개수 확인
    const propertyItems = await page.locator('.property-item, .property-card, tr, .list-item').count();
    scenario.steps.push(`매물 항목 ${propertyItems}개 발견`);
  }
  
  // 매물 추가 버튼 확인
  const addButton = await page.locator('button, a').filter({ hasText: /추가|add|등록|new/i }).first().isVisible().catch(() => false);
  if (addButton) {
    scenario.steps.push('매물 추가 버튼 확인 완료');
  }
  
  // 검색/필터 기능 확인
  const searchInput = await page.locator('input[type="search"], input[placeholder*="검색"], .search-input').first().isVisible().catch(() => false);
  if (searchInput) {
    scenario.steps.push('검색 기능 확인 완료');
  }
  
  // 스크린샷 촬영
  await takeScreenshot(page, 'property_management', '매물 관리 페이지');
  
  await page.waitForTimeout(TEST_CONFIG.delays.short);
}

// 5. 반응형 디자인 테스트
async function testResponsiveDesign(page, scenario) {
  scenario.steps.push('반응형 디자인 테스트 시작');
  
  for (const [deviceName, viewport] of Object.entries(TEST_CONFIG.viewports)) {
    scenario.steps.push(`${deviceName} 뷰포트 테스트 시작 (${viewport.width}x${viewport.height})`);
    
    // 뷰포트 설정
    await page.setViewportSize(viewport);
    await page.waitForTimeout(TEST_CONFIG.delays.short);
    
    // 레이아웃 확인
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    const bodyHeight = await page.evaluate(() => document.body.offsetHeight);
    
    scenario.steps.push(`실제 body 크기: ${bodyWidth}x${bodyHeight}`);
    
    // 스크롤 가능 여부 확인
    const isScrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });
    
    if (isScrollable) {
      scenario.steps.push(`${deviceName}: 세로 스크롤 가능`);
    }
    
    // 가로 스크롤바 확인 (좋지 않은 상황)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll) {
      scenario.issues.push({
        type: 'WARNING',
        message: `${deviceName}에서 가로 스크롤바가 나타납니다`,
        timestamp: new Date().toISOString()
      });
    }
    
    // 네비게이션 메뉴 확인
    const navVisible = await page.locator('nav, .nav, .navigation').first().isVisible().catch(() => false);
    if (navVisible) {
      scenario.steps.push(`${deviceName}: 네비게이션 메뉴 표시됨`);
    }
    
    // 모바일에서 햄버거 메뉴 확인
    if (deviceName === 'mobile') {
      const hamburgerMenu = await page.locator('.hamburger, .menu-toggle, .mobile-menu-btn').first().isVisible().catch(() => false);
      if (hamburgerMenu) {
        scenario.steps.push('모바일: 햄버거 메뉴 확인');
      }
    }
    
    // 스크린샷 촬영
    await takeScreenshot(page, `responsive_${deviceName}`, `${deviceName} 뷰포트 (${viewport.width}x${viewport.height})`);
    
    await page.waitForTimeout(TEST_CONFIG.delays.short);
  }
  
  // 데스크톱 뷰포트로 복원
  await page.setViewportSize(TEST_CONFIG.viewports.desktop);
  scenario.steps.push('데스크톱 뷰포트로 복원');
}

// 메인 테스트 실행 함수
async function runComprehensiveTest() {
  ensureDirectories();
  
  log('===== 더부동산 매물 관리 시스템 포괄적 시각적 자동화 테스트 시작 =====');
  log(`테스트 대상: ${TEST_CONFIG.baseURL}`);
  log(`테스트 계정: ${TEST_CONFIG.testAccount.email}`);
  
  // 브라우저 실행 (headless: false로 시각적 확인 가능)
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 느린 실행으로 시각적 확인 가능
  });
  
  const context = await browser.newContext({
    viewport: TEST_CONFIG.viewports.desktop,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // 콘솔 에러 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.issues.push({
        type: 'CONSOLE_ERROR',
        message: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // 네트워크 실패 수집
  page.on('requestfailed', request => {
    testResults.issues.push({
      type: 'NETWORK_ERROR',
      message: `Failed to load: ${request.url()}`,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    // 테스트 시나리오 실행
    await runTestScenario('1. 초기 페이지 테스트', testInitialPage, page);
    await runTestScenario('2. 로그인 기능 테스트', testLogin, page);
    await runTestScenario('3. 대시보드 기능 테스트', testDashboard, page);
    await runTestScenario('4. 매물 관리 페이지 테스트', testPropertyManagement, page);
    await runTestScenario('5. 반응형 디자인 테스트', testResponsiveDesign, page);
    
  } catch (error) {
    log(`전체 테스트 실행 중 오류 발생: ${error.message}`, 'ERROR');
  } finally {
    await browser.close();
  }
  
  // 테스트 결과 완료
  testResults.endTime = new Date().toISOString();
  
  // 결과 저장
  const resultFile = join(RESULTS_DIR, `test-result-${Date.now()}.json`);
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  
  // 테스트 요약 출력
  log('===== 테스트 실행 완료 =====');
  log(`총 테스트: ${testResults.totalTests}`);
  log(`통과: ${testResults.passedTests}`);
  log(`실패: ${testResults.failedTests}`);
  log(`이슈: ${testResults.issues.length}`);
  log(`스크린샷: ${testResults.screenshots.length}`);
  log(`결과 파일: ${resultFile}`);
  
  // 상세 결과 출력
  console.log('\n===== 테스트 시나리오 상세 결과 =====');
  testResults.scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name} - ${scenario.status}`);
    scenario.steps.forEach((step, stepIndex) => {
      console.log(`   ${stepIndex + 1}. ${step}`);
    });
    
    if (scenario.issues.length > 0) {
      console.log('   이슈:');
      scenario.issues.forEach((issue, issueIndex) => {
        console.log(`   - ${issue.type}: ${issue.message}`);
      });
    }
  });
  
  // 성능 메트릭 출력
  if (testResults.performanceMetrics && testResults.performanceMetrics.navigation) {
    console.log('\n===== 성능 메트릭 =====');
    const nav = testResults.performanceMetrics.navigation;
    console.log(`DOM 컨텐츠 로딩: ${nav.domContentLoaded.toFixed(2)}ms`);
    console.log(`페이지 로딩 완료: ${nav.loadComplete.toFixed(2)}ms`);
    console.log(`총 로딩 시간: ${nav.totalTime.toFixed(2)}ms`);
    console.log(`DNS 조회: ${nav.dnsLookup.toFixed(2)}ms`);
    console.log(`TCP 연결: ${nav.tcpConnect.toFixed(2)}ms`);
    console.log(`서버 응답: ${nav.serverResponse.toFixed(2)}ms`);
  }
  
  // 전체 이슈 출력
  if (testResults.issues.length > 0) {
    console.log('\n===== 발견된 이슈 =====');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type}] ${issue.message}`);
      if (issue.scenario) {
        console.log(`   시나리오: ${issue.scenario}`);
      }
    });
  }
  
  // 개선사항 제안
  console.log('\n===== 개선사항 제안 =====');
  if (testResults.failedTests > 0) {
    console.log('- 실패한 테스트 시나리오들을 검토하고 수정이 필요합니다.');
  }
  
  if (testResults.issues.some(issue => issue.type === 'CONSOLE_ERROR')) {
    console.log('- 브라우저 콘솔 에러를 확인하고 JavaScript 오류를 수정해주세요.');
  }
  
  if (testResults.issues.some(issue => issue.type === 'NETWORK_ERROR')) {
    console.log('- 네트워크 요청 실패를 확인하고 리소스 로딩 문제를 해결해주세요.');
  }
  
  if (testResults.issues.some(issue => issue.message.includes('가로 스크롤'))) {
    console.log('- 모바일 환경에서 가로 스크롤이 발생하므로 반응형 디자인을 개선해주세요.');
  }
  
  if (testResults.performanceMetrics && testResults.performanceMetrics.navigation.totalTime > 3000) {
    console.log('- 페이지 로딩 시간이 3초를 초과하므로 성능 최적화가 필요합니다.');
  }
  
  console.log('- 정기적인 자동화 테스트 실행을 통해 지속적인 품질 관리를 권장합니다.');
  console.log(`- 스크린샷 이미지들을 확인하여 UI/UX 개선점을 파악해주세요: ${SCREENSHOTS_DIR}`);
  
  return testResults;
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTest()
    .then(results => {
      log('모든 테스트가 완료되었습니다.');
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      log(`테스트 실행 중 치명적 오류 발생: ${error.message}`, 'FATAL');
      process.exit(1);
    });
}

export { runComprehensiveTest, TEST_CONFIG, testResults };