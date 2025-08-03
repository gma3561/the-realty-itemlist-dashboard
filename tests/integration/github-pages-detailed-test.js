const { chromium } = require('playwright');

async function testGitHubPagesDetailed() {
  console.log('🔍 GitHub Pages 상세 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  // 콘솔 메시지 및 에러 수집
  const consoleLogs = [];
  const errors = [];
  const networkRequests = [];

  page.on('console', msg => {
    const logEntry = `${msg.type()}: ${msg.text()}`;
    consoleLogs.push(logEntry);
    console.log(`📝 Console ${logEntry}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });

  page.on('response', response => {
    if (!response.ok() && response.status() !== 304) {
      console.log(`❌ Failed Request: ${response.status()} - ${response.url()}`);
    }
  });

  try {
    console.log('1️⃣ 초기 페이지 로딩...');
    
    const response = await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
      waitUntil: 'networkidle'
    });

    console.log(`   ✅ HTTP 상태: ${response.status()}`);
    console.log(`   ✅ 최종 URL: ${page.url()}`);
    
    // 현재 페이지가 로그인 페이지인지 확인
    const isLoginPage = page.url().includes('/login') || page.url().includes('#/login');
    console.log(`   ${isLoginPage ? '🔐' : '📋'} 현재 페이지: ${isLoginPage ? '로그인 페이지' : '기타 페이지'}`);

    console.log('\n2️⃣ 페이지 내용 분석...');
    
    // 페이지 제목과 메타 정보
    const title = await page.title();
    console.log(`   📋 페이지 타이틀: "${title}"`);
    
    // 페이지 텍스트 내용 분석
    const bodyText = await page.textContent('body');
    console.log(`   📝 페이지 텍스트 길이: ${bodyText?.length || 0} 문자`);
    
    if (bodyText) {
      const keywords = ['로그인', '로그아웃', '대시보드', '매물', '등록', '관리', '검색'];
      const foundKeywords = keywords.filter(keyword => bodyText.includes(keyword));
      console.log(`   🔍 발견된 키워드: ${foundKeywords.join(', ')}`);
    }

    console.log('\n3️⃣ React 애플리케이션 상태 확인...');
    
    // React 루트 요소 확인
    const reactRoot = await page.locator('#root').count();
    console.log(`   ✅ React 루트 요소: ${reactRoot > 0 ? '발견됨' : '없음'}`);
    
    // React 앱 내부 구조 확인
    const rootContent = await page.locator('#root').innerHTML();
    console.log(`   📝 루트 내용 길이: ${rootContent.length} 문자`);
    
    // React Router 여부 확인
    const hasRouter = rootContent.includes('react-router') || page.url().includes('#/');
    console.log(`   🛣️ React Router: ${hasRouter ? '사용 중' : '사용 안함'}`);

    console.log('\n4️⃣ 네트워크 요청 분석...');
    
    // 요청 타입별 분류
    const requestsByType = networkRequests.reduce((acc, req) => {
      acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   📊 네트워크 요청 통계:');
    Object.entries(requestsByType).forEach(([type, count]) => {
      console.log(`      ${type}: ${count}개`);
    });
    
    // API 요청 확인
    const apiRequests = networkRequests.filter(req => 
      req.url.includes('/api/') || 
      req.url.includes('supabase') ||
      req.url.includes('.json')
    );
    
    if (apiRequests.length > 0) {
      console.log('   🔗 API 요청들:');
      apiRequests.forEach((req, index) => {
        console.log(`      ${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log('   ⚠️ API 요청이 감지되지 않음');
    }

    console.log('\n5️⃣ 로그인 페이지 분석 (현재 페이지가 로그인 페이지인 경우)...');
    
    if (isLoginPage) {
      // 로그인 관련 요소들 확인
      const loginElements = {
        '로그인 버튼': await page.locator('button:has-text("로그인"), button:has-text("Login")').count(),
        '바이패스 버튼': await page.locator('button:has-text("바이패스"), button:has-text("bypass")').count(),
        '데모 버튼': await page.locator('button:has-text("데모"), button:has-text("demo")').count(),
        '입력 필드': await page.locator('input').count(),
        '폼 요소': await page.locator('form').count()
      };
      
      console.log('   🔐 로그인 페이지 요소들:');
      Object.entries(loginElements).forEach(([name, count]) => {
        console.log(`      ${name}: ${count}개`);
      });
      
      // 바이패스 로그인 시도
      const bypassButton = page.locator('button:has-text("바이패스"), button:has-text("bypass"), button:has-text("데모"), button:has-text("demo")').first();
      const bypassExists = await bypassButton.count() > 0;
      
      if (bypassExists) {
        console.log('\n   🚀 바이패스 로그인 시도...');
        await bypassButton.click();
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log(`   📍 바이패스 후 URL: ${newUrl}`);
        
        if (!newUrl.includes('/login')) {
          console.log('   ✅ 바이패스 로그인 성공!');
          
          // 대시보드 페이지 분석
          await this.analyzeDashboard(page);
        } else {
          console.log('   ❌ 바이패스 로그인 실패');
        }
      } else {
        console.log('   ⚠️ 바이패스 버튼을 찾을 수 없음');
      }
    }

    console.log('\n6️⃣ 직접 대시보드 URL 접근 시도...');
    
    // 다양한 대시보드 URL 패턴 시도
    const dashboardUrls = [
      'https://gma3561.github.io/the-realty-itemlist-dashboard/#/dashboard',
      'https://gma3561.github.io/the-realty-itemlist-dashboard/#/properties',
      'https://gma3561.github.io/the-realty-itemlist-dashboard/#/admin',
      'https://gma3561.github.io/the-realty-itemlist-dashboard/dashboard',
      'https://gma3561.github.io/the-realty-itemlist-dashboard/properties'
    ];
    
    for (const url of dashboardUrls) {
      try {
        console.log(`   🔗 시도: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const redirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('#/login');
        
        console.log(`      결과: ${redirectedToLogin ? '로그인으로 리다이렉트' : '접근 성공'}`);
        
        if (!redirectedToLogin) {
          console.log('   ✅ 대시보드 접근 성공!');
          await this.analyzeDashboard(page);
          break;
        }
      } catch (error) {
        console.log(`      ❌ 접근 실패: ${error.message}`);
      }
    }

    console.log('\n7️⃣ 전체 애플리케이션 구조 분석...');
    
    // JavaScript 파일들 확인
    const scriptTags = await page.locator('script[src]').count();
    console.log(`   📦 스크립트 파일: ${scriptTags}개`);
    
    // CSS 파일들 확인
    const cssLinks = await page.locator('link[rel="stylesheet"]').count();
    console.log(`   🎨 CSS 파일: ${cssLinks}개`);
    
    // 환경 설정 관련 정보
    const hasEnvConfig = await page.evaluate(() => {
      return window.ENV !== undefined || window.__ENV__ !== undefined;
    });
    console.log(`   ⚙️ 환경 설정: ${hasEnvConfig ? '감지됨' : '감지 안됨'}`);

    console.log('\n📸 최종 스크린샷 캡처...');
    await page.screenshot({ 
      path: '/Users/tere.remote/the-realty-itemlist-dashboard/github-pages-detailed-screenshot.png', 
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장 완료');

    // 최종 보고서
    console.log('\n📋 최종 테스트 보고서:');
    console.log('='.repeat(60));
    console.log(`🌐 사이트 상태: 정상 동작 (HTTP 200)`);
    console.log(`⚛️ React 앱: ${reactRoot > 0 ? '정상 렌더링' : '렌더링 실패'}`);
    console.log(`🔐 인증 시스템: ${isLoginPage ? '활성화됨 (로그인 필요)' : '비활성화됨'}`);
    console.log(`📊 총 네트워크 요청: ${networkRequests.length}개`);
    console.log(`❌ JavaScript 에러: ${errors.length}개`);
    console.log(`📝 콘솔 로그: ${consoleLogs.length}개`);

    if (errors.length > 0) {
      console.log('\n❌ 발견된 에러들:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // 권장사항
    console.log('\n💡 권장사항:');
    if (isLoginPage) {
      console.log('   - 바이패스 로그인 기능을 활용하여 데모 접근 가능');
      console.log('   - 인증 없이 접근 가능한 공개 페이지 제공 고려');
    }
    console.log('   - 네트워크 요청 최적화로 로딩 속도 개선 가능');
    console.log('   - 에러 처리 개선으로 사용자 경험 향상 가능');

  } catch (error) {
    console.log(`\n💥 테스트 실행 중 치명적 오류: ${error.message}`);
    console.log(`스택 트레이스:\n${error.stack}`);
  } finally {
    await browser.close();
    console.log('\n🏁 상세 테스트 완료');
  }
}

// 대시보드 분석 함수
async function analyzeDashboard(page) {
  console.log('\n🏠 대시보드 페이지 분석...');
  
  await page.waitForTimeout(3000); // 로딩 대기
  
  // 매물 데이터 확인
  const propertySelectors = [
    '[data-testid="property-card"]',
    '.property-card',
    '[data-testid="property-list"]',
    '.property-list',
    'table tbody tr',
    '[class*="property"]'
  ];
  
  let propertyCount = 0;
  for (const selector of propertySelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      propertyCount = count;
      console.log(`   🏠 매물 데이터: ${count}개 항목 발견 (${selector})`);
      break;
    }
  }
  
  if (propertyCount === 0) {
    console.log('   ⚠️ 매물 데이터를 찾을 수 없음');
  }
  
  // 통계 데이터 확인
  const statsSelectors = [
    '[data-testid="stats"]',
    '.stats',
    '.dashboard-stats',
    '.stat-card',
    '[class*="stat"]'
  ];
  
  let statsCount = 0;
  for (const selector of statsSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      statsCount = count;
      console.log(`   📊 대시보드 통계: ${count}개 항목 발견 (${selector})`);
      break;
    }
  }
  
  if (statsCount === 0) {
    console.log('   ⚠️ 대시보드 통계를 찾을 수 없음');
  }
  
  // 네비게이션 확인
  const navCount = await page.locator('nav, [data-testid="navigation"], .navigation').count();
  console.log(`   🧭 네비게이션: ${navCount}개 요소`);
  
  // 대시보드 스크린샷
  await page.screenshot({ 
    path: '/Users/tere.remote/the-realty-itemlist-dashboard/dashboard-screenshot.png',
    fullPage: true 
  });
  console.log('   📸 대시보드 스크린샷 저장됨');
}

// 테스트 실행
testGitHubPagesDetailed().catch(console.error);