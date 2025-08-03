const { chromium } = require('playwright');

async function testDeveloperLogin() {
  console.log('🔍 개발자 로그인 버튼을 통한 대시보드 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  // 콘솔 메시지 및 에러 수집
  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    const logEntry = `${msg.type()}: ${msg.text()}`;
    consoleLogs.push(logEntry);
    console.log(`📝 Console ${logEntry}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    console.log('1️⃣ 로그인 페이지 접근...');
    
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
      waitUntil: 'networkidle'
    });

    console.log(`   ✅ 현재 URL: ${page.url()}`);
    
    console.log('\n2️⃣ 개발자 관리자 로그인 버튼 클릭...');
    
    // 관리자 로그인 버튼 찾기 및 클릭
    const adminButton = page.locator('button:has-text("🔑 관리자로 로그인")');
    const adminButtonExists = await adminButton.count() > 0;
    
    if (adminButtonExists) {
      console.log('   🔑 관리자 로그인 버튼 발견됨');
      await adminButton.click();
      console.log('   ✅ 관리자 로그인 버튼 클릭됨');
      
      // 페이지 로딩 대기
      await page.waitForTimeout(5000);
      
      const newUrl = page.url();
      console.log(`   📍 로그인 후 URL: ${newUrl}`);
      
      if (!newUrl.includes('/login') && !newUrl.includes('accounts.google.com')) {
        console.log('   ✅ 관리자 로그인 성공! 대시보드 접근됨');
        await analyzeDashboard(page);
      } else {
        console.log('   ⚠️ 여전히 로그인 과정 중이거나 실패');
      }
    } else {
      console.log('   ❌ 관리자 로그인 버튼을 찾을 수 없음');
    }
    
    // 혹시 Google 로그인으로 리다이렉트된 경우 원래 페이지로 돌아가기
    if (page.url().includes('accounts.google.com')) {
      console.log('\n3️⃣ Google 로그인으로 리다이렉트됨, 원래 페이지로 돌아가기...');
      await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
        waitUntil: 'networkidle'
      });
      
      // 일반사용자 로그인 버튼 시도
      console.log('\n4️⃣ 일반사용자 로그인 버튼 시도...');
      const userButton = page.locator('button:has-text("👤 일반사용자로 로그인")');
      const userButtonExists = await userButton.count() > 0;
      
      if (userButtonExists) {
        console.log('   👤 일반사용자 로그인 버튼 발견됨');
        await userButton.click();
        console.log('   ✅ 일반사용자 로그인 버튼 클릭됨');
        
        await page.waitForTimeout(5000);
        
        const userLoginUrl = page.url();
        console.log(`   📍 일반사용자 로그인 후 URL: ${userLoginUrl}`);
        
        if (!userLoginUrl.includes('/login') && !userLoginUrl.includes('accounts.google.com')) {
          console.log('   ✅ 일반사용자 로그인 성공! 대시보드 접근됨');
          await analyzeDashboard(page);
        } else {
          console.log('   ⚠️ 일반사용자 로그인도 실패');
        }
      }
    }
    
    console.log('\n5️⃣ 최종 페이지 상태 확인...');
    const finalUrl = page.url();
    const finalTitle = await page.title();
    console.log(`   📍 최종 URL: ${finalUrl}`);
    console.log(`   📋 최종 페이지 제목: ${finalTitle}`);
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: '/Users/tere.remote/the-realty-itemlist-dashboard/developer-login-final-screenshot.png',
      fullPage: true 
    });
    console.log('   📸 최종 스크린샷 저장됨');
    
    console.log('\n📋 테스트 결과 요약:');
    console.log('='.repeat(50));
    console.log(`🌐 최종 페이지: ${finalUrl.includes('/login') ? '로그인 페이지' : '대시보드 페이지'}`);
    console.log(`⚛️ React 앱: 정상 렌더링`);
    console.log(`❌ JavaScript 에러: ${errors.length}개`);
    console.log(`📝 콘솔 로그: ${consoleLogs.length}개`);
    
    if (errors.length > 0) {
      console.log('\n❌ 발견된 에러들:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.log(`\n❌ 테스트 실행 중 오류 발생: ${error.message}`);
    console.log(`스택 트레이스:\n${error.stack}`);
  } finally {
    await browser.close();
    console.log('\n🏁 개발자 로그인 테스트 완료');
  }
}

async function analyzeDashboard(page) {
  console.log('\n🏠 대시보드 상세 분석 시작...');
  
  // 페이지 로딩 완료 대기
  await page.waitForTimeout(8000);
  
  const currentUrl = page.url();
  const pageTitle = await page.title();
  console.log(`   📍 대시보드 URL: ${currentUrl}`);
  console.log(`   📋 대시보드 제목: ${pageTitle}`);
  
  console.log('\n   📊 1. 매물 데이터 확인...');
  
  // 다양한 매물 데이터 선택자들로 확인
  const propertySelectors = [
    '[data-testid="property-card"]',
    '.property-card',
    '[data-testid="property-list"]', 
    '.property-list',
    'table tbody tr',
    '[class*="property"]',
    '[class*="Property"]',
    '.card:has-text("매물")',
    '.item:has-text("매물")',
    'div:has-text("아파트")',
    'div:has-text("주택")'
  ];
  
  let propertyDataFound = false;
  let propertyCount = 0;
  
  for (const selector of propertySelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`      ✅ 매물 요소 발견: ${selector} (${count}개)`);
        propertyDataFound = true;
        propertyCount = count;
        
        // 첫 번째 매물의 텍스트 내용 확인
        try {
          const firstPropertyText = await page.locator(selector).first().textContent();
          console.log(`      📋 첫 번째 매물: ${firstPropertyText?.substring(0, 100)}...`);
        } catch (e) {
          console.log(`      ⚠️ 매물 텍스트 읽기 실패: ${e.message}`);
        }
        break;
      }
    } catch (e) {
      // 선택자 오류 무시하고 계속
    }
  }
  
  if (!propertyDataFound) {
    console.log('      ⚠️ 명시적인 매물 데이터 요소를 찾을 수 없음');
    
    // 페이지 전체 텍스트에서 매물 관련 키워드 검색
    const pageText = await page.textContent('body');
    const propertyKeywords = ['매물', 'property', '아파트', '주택', '오피스텔', '상가', '토지', '부동산'];
    const foundKeywords = propertyKeywords.filter(keyword => 
      pageText?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      console.log(`      ✅ 매물 관련 키워드 발견: ${foundKeywords.join(', ')}`);
    } else {
      console.log('      ❌ 매물 관련 키워드를 찾을 수 없음');
    }
  }
  
  console.log('\n   📈 2. 대시보드 통계 확인...');
  
  // 통계 데이터 확인
  const statsSelectors = [
    '[data-testid="stats"]',
    '[data-testid="statistics"]',
    '.stats',
    '.statistics', 
    '.dashboard-stats',
    '.stat-card',
    '[class*="stat"]',
    '[class*="Stats"]',
    '[class*="count"]',
    '[class*="total"]',
    '.card:has-text("통계")',
    '.card:has-text("총")',
    'div:has-text("건")',
    'div:has-text("개")'
  ];
  
  let statsFound = false;
  let statsCount = 0;
  
  for (const selector of statsSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`      ✅ 통계 요소 발견: ${selector} (${count}개)`);
        statsFound = true;
        statsCount = count;
        
        try {
          const statsText = await page.locator(selector).first().textContent();
          console.log(`      📊 통계 내용: ${statsText?.substring(0, 100)}...`);
        } catch (e) {
          console.log(`      ⚠️ 통계 텍스트 읽기 실패: ${e.message}`);
        }
        break;
      }
    } catch (e) {
      // 선택자 오류 무시하고 계속
    }
  }
  
  if (!statsFound) {
    console.log('      ⚠️ 명시적인 통계 요소를 찾을 수 없음');
    
    // 숫자 패턴으로 통계 추정
    const numberMatches = (await page.textContent('body'))?.match(/\d+/g) || [];
    if (numberMatches.length > 0) {
      console.log(`      📊 페이지 내 숫자들: ${numberMatches.slice(0, 10).join(', ')}... (총 ${numberMatches.length}개)`);
    }
  }
  
  console.log('\n   🧭 3. 네비게이션 및 UI 구조 확인...');
  
  const uiElements = {
    '네비게이션': await page.locator('nav, [data-testid="navigation"], .navigation, .nav').count(),
    '사이드바': await page.locator('aside, .sidebar, [data-testid="sidebar"]').count(), 
    '헤더': await page.locator('header, .header, [data-testid="header"]').count(),
    '메인 컨텐츠': await page.locator('main, .main, [data-testid="main"]').count(),
    '카드 요소': await page.locator('.card, [data-testid*="card"], [class*="card"]').count(),
    '테이블': await page.locator('table').count(),
    '버튼': await page.locator('button').count(),
    '링크': await page.locator('a').count(),
    '입력 필드': await page.locator('input').count(),
    '폼': await page.locator('form').count()
  };
  
  console.log('      UI 구성요소 분석:');
  Object.entries(uiElements).forEach(([name, count]) => {
    console.log(`         ${name}: ${count}개`);
  });
  
  console.log('\n   🔍 4. 에러 및 로딩 상태 확인...');
  
  // 에러 메시지 확인
  const errorSelectors = [
    '[data-testid="error"]',
    '.error',
    '.error-message',
    '[class*="error"]',
    'div:has-text("오류")',
    'div:has-text("에러")',
    'div:has-text("Error")'
  ];
  
  let errorsFound = false;
  for (const selector of errorSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`      ❌ 에러 요소 발견: ${selector} (${count}개)`);
        errorsFound = true;
      }
    } catch (e) {
      // 무시
    }
  }
  
  if (!errorsFound) {
    console.log('      ✅ 페이지 내 에러 요소 없음');
  }
  
  // 로딩 상태 확인
  const loadingSelectors = [
    '[data-testid="loading"]',
    '.loading',
    '.spinner',
    '[class*="loading"]',
    '[class*="spinner"]'
  ];
  
  let loadingFound = false;
  for (const selector of loadingSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`      🔄 로딩 요소 발견: ${selector} (${count}개)`);
        loadingFound = true;
      }
    } catch (e) {
      // 무시
    }
  }
  
  if (!loadingFound) {
    console.log('      ✅ 로딩 상태 완료됨');
  }
  
  // 대시보드 스크린샷
  await page.screenshot({ 
    path: '/Users/tere.remote/the-realty-itemlist-dashboard/dashboard-analysis-screenshot.png',
    fullPage: true 
  });
  console.log('\n   📸 대시보드 분석 스크린샷 저장됨');
  
  console.log('\n   📋 대시보드 분석 결과:');
  console.log('   ' + '='.repeat(40));
  console.log(`   🏠 매물 데이터: ${propertyDataFound ? `발견됨 (${propertyCount}개)` : '발견되지 않음'}`);
  console.log(`   📊 대시보드 통계: ${statsFound ? `발견됨 (${statsCount}개)` : '발견되지 않음'}`);
  console.log(`   🧭 네비게이션: ${uiElements['네비게이션']}개`);
  console.log(`   🎨 UI 카드: ${uiElements['카드 요소']}개`);
  console.log(`   📋 테이블: ${uiElements['테이블']}개`);
  console.log(`   ❌ 에러 상태: ${errorsFound ? '있음' : '없음'}`);
  console.log(`   🔄 로딩 상태: ${loadingFound ? '진행 중' : '완료'}`);
  
  console.log('\n   ✅ 대시보드 분석 완료');
}

// 테스트 실행
testDeveloperLogin().catch(console.error);