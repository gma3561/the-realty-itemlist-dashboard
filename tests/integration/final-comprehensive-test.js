const { chromium } = require('playwright');

async function comprehensiveGitHubPagesTest() {
  console.log('🔍 GitHub Pages 종합 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  // 테스트 결과 저장
  const testResults = {
    pageLoading: false,
    reactRendering: false,
    consoleErrors: [],
    networkErrors: [],
    propertyData: false,
    dashboardStats: false,
    authSystem: false,
    uiElements: {}
  };

  // 콘솔 메시지 및 에러 수집
  page.on('console', msg => {
    const logEntry = `${msg.type()}: ${msg.text()}`;
    testResults.consoleErrors.push(logEntry);
    console.log(`📝 Console ${logEntry}`);
  });

  page.on('pageerror', error => {
    testResults.consoleErrors.push(`Error: ${error.message}`);
    console.log(`❌ Page Error: ${error.message}`);
  });

  page.on('response', response => {
    if (!response.ok() && response.status() !== 304) {
      testResults.networkErrors.push(`${response.status()} - ${response.url()}`);
      console.log(`❌ Network Error: ${response.status()} - ${response.url()}`);
    }
  });

  try {
    console.log('📋 테스트 항목별 검증 시작');
    console.log('='.repeat(50));

    // 1. 페이지 로딩 상태 확인
    console.log('\n1️⃣ 페이지 로딩 상태 확인');
    console.log('-'.repeat(30));
    
    const response = await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const statusCode = response.status();
    const finalUrl = page.url();
    const pageTitle = await page.title();
    
    testResults.pageLoading = statusCode === 200;
    
    console.log(`   ✅ HTTP 상태 코드: ${statusCode}`);
    console.log(`   ✅ 최종 URL: ${finalUrl}`);
    console.log(`   ✅ 페이지 제목: "${pageTitle}"`);
    console.log(`   ${testResults.pageLoading ? '✅' : '❌'} 페이지 로딩: ${testResults.pageLoading ? '성공' : '실패'}`);

    // 2. React 애플리케이션 렌더링 확인
    console.log('\n2️⃣ React 애플리케이션 렌더링 확인');
    console.log('-'.repeat(35));
    
    await page.waitForTimeout(3000); // 초기 로딩 대기
    
    const reactRootExists = await page.locator('#root').count() > 0;
    testResults.reactRendering = reactRootExists;
    
    if (reactRootExists) {
      console.log('   ✅ React 루트 요소 (#root) 발견됨');
      
      try {
        // React 컴포넌트가 렌더링될 때까지 대기
        await page.waitForFunction(() => {
          const root = document.querySelector('#root');
          return root && root.children.length > 0;
        }, { timeout: 10000 });
        
        const rootHTML = await page.locator('#root').innerHTML();
        console.log(`   ✅ React 컴포넌트 렌더링됨 (HTML 길이: ${rootHTML.length} 문자)`);
        testResults.reactRendering = true;
      } catch (e) {
        console.log('   ⚠️ React 컴포넌트 렌더링 타임아웃');
        testResults.reactRendering = false;
      }
    } else {
      console.log('   ❌ React 루트 요소를 찾을 수 없음');
    }
    
    console.log(`   ${testResults.reactRendering ? '✅' : '❌'} React 렌더링: ${testResults.reactRendering ? '성공' : '실패'}`);

    // 3. 콘솔 에러 메시지 확인
    console.log('\n3️⃣ 콘솔 에러 메시지 확인');
    console.log('-'.repeat(25));
    
    await page.waitForTimeout(2000); // 추가 로그 수집 대기
    
    const jsErrors = testResults.consoleErrors.filter(log => log.includes('Error:'));
    const warnings = testResults.consoleErrors.filter(log => log.includes('warn:'));
    
    console.log(`   📊 총 콘솔 메시지: ${testResults.consoleErrors.length}개`);
    console.log(`   ❌ JavaScript 에러: ${jsErrors.length}개`);
    console.log(`   ⚠️ 경고 메시지: ${warnings.length}개`);
    console.log(`   🌐 네트워크 에러: ${testResults.networkErrors.length}개`);
    
    if (jsErrors.length > 0) {
      console.log('\n   JavaScript 에러 상세:');
      jsErrors.slice(0, 5).forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    }
    
    if (testResults.networkErrors.length > 0) {
      console.log('\n   네트워크 에러 상세:');
      testResults.networkErrors.slice(0, 5).forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    }

    // 4. 인증 시스템 확인 및 바이패스 시도
    console.log('\n4️⃣ 인증 시스템 및 바이패스 확인');
    console.log('-'.repeat(30));
    
    const isLoginPage = finalUrl.includes('/login') || finalUrl.includes('#/login');
    testResults.authSystem = isLoginPage;
    
    console.log(`   🔐 로그인 페이지 여부: ${isLoginPage ? '예' : '아니오'}`);
    
    if (isLoginPage) {
      // 개발자 바이패스 버튼 확인
      const adminButton = page.locator('button:has-text("관리자로 로그인")');
      const userButton = page.locator('button:has-text("일반사용자로 로그인")');
      
      const adminButtonExists = await adminButton.count() > 0;
      const userButtonExists = await userButton.count() > 0;
      
      console.log(`   🔑 관리자 바이패스 버튼: ${adminButtonExists ? '있음' : '없음'}`);
      console.log(`   👤 일반사용자 바이패스 버튼: ${userButtonExists ? '있음' : '없음'}`);
      
      // 바이패스 로그인 시도
      if (adminButtonExists) {
        console.log('\n   🚀 관리자 바이패스 로그인 시도...');
        
        const beforeURL = page.url();
        await adminButton.click();
        await page.waitForTimeout(5000);
        const afterURL = page.url();
        
        console.log(`   📍 클릭 전 URL: ${beforeURL}`);
        console.log(`   📍 클릭 후 URL: ${afterURL}`);
        
        if (afterURL !== beforeURL && !afterURL.includes('accounts.google.com')) {
          console.log('   ✅ 바이패스 로그인 성공!');
          
          // 대시보드 분석 진행
          await analyzeDashboardDetails(page, testResults);
        } else if (afterURL.includes('accounts.google.com')) {
          console.log('   🔄 Google OAuth로 리다이렉트됨 (실제 로그인 필요)');
        } else {
          console.log('   ❌ 바이패스 로그인 실패');
        }
      }
    } else {
      console.log('   📋 이미 대시보드에 접근됨');
      await analyzeDashboardDetails(page, testResults);
    }

    // 최종 스크린샷
    console.log('\n📸 최종 스크린샷 캡처...');
    await page.screenshot({ 
      path: '/Users/tere.remote/the-realty-itemlist-dashboard/comprehensive-test-final.png',
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장 완료');

  } catch (error) {
    console.log(`\n❌ 테스트 실행 중 오류: ${error.message}`);
    testResults.error = error.message;
  } finally {
    await browser.close();
    
    // 최종 테스트 결과 보고서
    generateFinalReport(testResults);
  }
}

async function analyzeDashboardDetails(page, testResults) {
  console.log('\n5️⃣ 매물 데이터 표시 확인');
  console.log('-'.repeat(22));
  
  await page.waitForTimeout(3000);
  
  // 매물 데이터 확인
  const propertySelectors = [
    '[data-testid="property-card"]',
    '.property-card',
    '[data-testid="property-list"]',
    '.property-list',
    'table tbody tr',
    '[class*="property"]',
    '[class*="Property"]'
  ];
  
  let propertyElementsFound = 0;
  for (const selector of propertySelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        propertyElementsFound = count;
        console.log(`   🏠 매물 요소 발견: ${selector} (${count}개)`);
        testResults.propertyData = true;
        break;
      }
    } catch (e) {
      // 선택자 오류 무시
    }
  }
  
  if (propertyElementsFound === 0) {
    // 키워드로 매물 데이터 확인
    const pageText = await page.textContent('body');
    const propertyKeywords = ['매물', 'property', '아파트', '주택', '오피스텔'];
    const foundKeywords = propertyKeywords.filter(keyword => 
      pageText?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      console.log(`   ✅ 매물 관련 키워드 발견: ${foundKeywords.join(', ')}`);
      testResults.propertyData = true;
    } else {
      console.log('   ❌ 매물 데이터 또는 키워드를 찾을 수 없음');
      testResults.propertyData = false;
    }
  }
  
  console.log('\n6️⃣ 대시보드 통계 확인');
  console.log('-'.repeat(20));
  
  // 대시보드 통계 확인
  const statsSelectors = [
    '[data-testid="stats"]',
    '.stats',
    '.dashboard-stats',
    '.stat-card',
    '[class*="stat"]'
  ];
  
  let statsElementsFound = 0;
  for (const selector of statsSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        statsElementsFound = count;
        console.log(`   📊 통계 요소 발견: ${selector} (${count}개)`);
        testResults.dashboardStats = true;
        break;
      }
    } catch (e) {
      // 선택자 오류 무시
    }
  }
  
  if (statsElementsFound === 0) {
    // 숫자 패턴으로 통계 데이터 추정
    const pageText = await page.textContent('body');
    const numberMatches = pageText?.match(/\d+/g) || [];
    
    if (numberMatches.length > 3) { // 최소한의 숫자 데이터가 있다면
      console.log(`   📊 페이지 내 숫자 데이터: ${numberMatches.length}개 (통계 가능성 있음)`);
      testResults.dashboardStats = true;
    } else {
      console.log('   ❌ 대시보드 통계 데이터를 찾을 수 없음');
      testResults.dashboardStats = false;
    }
  }
  
  // UI 구성요소 분석
  console.log('\n   🧩 UI 구성요소 분석:');
  testResults.uiElements = {
    buttons: await page.locator('button').count(),
    links: await page.locator('a').count(),
    navigation: await page.locator('nav').count(),
    tables: await page.locator('table').count(),
    cards: await page.locator('.card, [class*="card"]').count(),
    forms: await page.locator('form').count()
  };
  
  Object.entries(testResults.uiElements).forEach(([name, count]) => {
    console.log(`      ${name}: ${count}개`);
  });
}

function generateFinalReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 최종 테스트 보고서');
  console.log('='.repeat(60));
  
  console.log('\n🔍 테스트 항목별 결과:');
  console.log(`   1. 페이지 로딩: ${results.pageLoading ? '✅ 성공' : '❌ 실패'}`);
  console.log(`   2. React 렌더링: ${results.reactRendering ? '✅ 성공' : '❌ 실패'}`);
  console.log(`   3. JavaScript 에러: ${results.consoleErrors.filter(log => log.includes('Error:')).length}개 ${results.consoleErrors.filter(log => log.includes('Error:')).length === 0 ? '✅' : '⚠️'}`);
  console.log(`   4. 네트워크 에러: ${results.networkErrors.length}개 ${results.networkErrors.length === 0 ? '✅' : '⚠️'}`);
  console.log(`   5. 매물 데이터: ${results.propertyData ? '✅ 발견됨' : '❌ 없음'}`);
  console.log(`   6. 대시보드 통계: ${results.dashboardStats ? '✅ 발견됨' : '❌ 없음'}`);
  console.log(`   7. 인증 시스템: ${results.authSystem ? '🔐 활성화됨' : '📂 비활성화됨'}`);
  
  console.log('\n📊 종합 평가:');
  const passedTests = [
    results.pageLoading,
    results.reactRendering,
    results.consoleErrors.filter(log => log.includes('Error:')).length === 0,
    results.networkErrors.length === 0
  ].filter(Boolean).length;
  
  const totalCriticalTests = 4;
  const successRate = (passedTests / totalCriticalTests * 100).toFixed(1);
  
  console.log(`   🎯 핵심 기능 성공률: ${successRate}% (${passedTests}/${totalCriticalTests})`);
  
  if (results.uiElements && Object.keys(results.uiElements).length > 0) {
    console.log('\n🧩 UI 구성요소 요약:');
    Object.entries(results.uiElements).forEach(([name, count]) => {
      console.log(`   ${name}: ${count}개`);
    });
  }
  
  console.log('\n💡 결론 및 권장사항:');
  
  if (results.pageLoading && results.reactRendering) {
    console.log('   ✅ 웹사이트가 정상적으로 작동하고 있습니다');
    console.log('   ✅ React 애플리케이션이 올바르게 렌더링되고 있습니다');
  } else {
    console.log('   ❌ 기본적인 페이지 로딩 또는 React 렌더링에 문제가 있습니다');
  }
  
  if (results.authSystem) {
    console.log('   🔐 인증 시스템이 활성화되어 있어 로그인이 필요합니다');
    console.log('   💡 개발자 바이패스 기능을 활용하여 테스트 접근이 가능합니다');
  }
  
  if (!results.propertyData || !results.dashboardStats) {
    console.log('   ⚠️ 매물 데이터나 대시보드 통계가 명확하게 표시되지 않습니다');
    console.log('   💡 인증 후 데이터 로딩이 필요하거나 API 연결 문제일 수 있습니다');
  }
  
  if (results.consoleErrors.length > 0) {
    console.log('   ⚠️ 콘솔 에러나 경고가 있어 최적화가 필요할 수 있습니다');
  }
  
  console.log('\n🏁 테스트 완료');
  console.log('='.repeat(60));
}

// 테스트 실행
comprehensiveGitHubPagesTest().catch(console.error);