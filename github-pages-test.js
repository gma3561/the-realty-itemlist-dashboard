const { chromium } = require('playwright');

async function testGitHubPagesDeployment() {
  console.log('🔍 GitHub Pages 배포 사이트 테스트 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  // 콘솔 메시지 및 에러 수집
  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`📝 Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    console.log('1️⃣ 페이지 로딩 상태 확인 중...');
    
    // 페이지 로딩
    const response = await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
      waitUntil: 'networkidle'
    });

    console.log(`   ✅ HTTP 상태: ${response.status()}`);
    console.log(`   ✅ 최종 URL: ${page.url()}`);

    // 페이지 타이틀 확인
    const title = await page.title();
    console.log(`   ✅ 페이지 타이틀: "${title}"`);

    console.log('\n2️⃣ React 애플리케이션 렌더링 확인 중...');
    
    // React 앱 루트 요소 확인
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('   ✅ React 루트 요소 (#root) 발견');

    // React 컴포넌트 로딩 대기
    try {
      await page.waitForFunction(() => {
        const root = document.querySelector('#root');
        return root && root.children.length > 0;
      }, { timeout: 15000 });
      console.log('   ✅ React 컴포넌트가 렌더링됨');
    } catch (e) {
      console.log('   ⚠️ React 컴포넌트 렌더링 시간 초과');
    }

    console.log('\n3️⃣ 콘솔 에러 메시지 분석...');
    if (errors.length > 0) {
      console.log('   ❌ 발견된 JavaScript 에러:');
      errors.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
    } else {
      console.log('   ✅ JavaScript 에러 없음');
    }

    // 네트워크 요청 실패 확인
    const failedRequests = [];
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    await page.waitForTimeout(3000); // 추가 네트워크 요청 대기

    if (failedRequests.length > 0) {
      console.log('   ❌ 실패한 네트워크 요청:');
      failedRequests.forEach((req, index) => {
        console.log(`      ${index + 1}. ${req}`);
      });
    } else {
      console.log('   ✅ 모든 네트워크 요청 성공');
    }

    console.log('\n4️⃣ 매물 데이터 표시 확인 중...');
    
    // 로딩 화면이 있는지 확인
    const hasLoading = await page.locator('[data-testid="loading"], .loading, .spinner').count() > 0;
    if (hasLoading) {
      console.log('   🔄 로딩 상태 감지됨, 대기 중...');
      await page.waitForTimeout(5000);
    }

    // 매물 데이터 관련 요소들 확인
    const propertySelectors = [
      '[data-testid="property-card"]',
      '.property-card',
      '[data-testid="property-list"]',
      '.property-list',
      'table tbody tr',
      '[class*="property"]',
      '[class*="Property"]'
    ];

    let propertyDataFound = false;
    for (const selector of propertySelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`   ✅ 매물 데이터 발견: ${selector} (${count}개 항목)`);
        propertyDataFound = true;
        
        // 첫 번째 매물의 텍스트 내용 확인
        const firstPropertyText = await page.locator(selector).first().textContent();
        console.log(`   📋 첫 번째 매물 정보: ${firstPropertyText?.substring(0, 100)}...`);
        break;
      }
    }

    if (!propertyDataFound) {
      console.log('   ⚠️ 명시적인 매물 데이터 요소를 찾을 수 없음');
      
      // 페이지 전체 텍스트에서 매물 관련 키워드 검색
      const pageText = await page.textContent('body');
      const propertyKeywords = ['매물', 'property', '아파트', '주택', '오피스텔', '상가', '부동산'];
      const foundKeywords = propertyKeywords.filter(keyword => 
        pageText?.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundKeywords.length > 0) {
        console.log(`   ✅ 매물 관련 키워드 발견: ${foundKeywords.join(', ')}`);
      } else {
        console.log('   ❌ 매물 관련 데이터를 찾을 수 없음');
      }
    }

    console.log('\n5️⃣ 대시보드 통계 확인 중...');
    
    // 대시보드 통계 관련 요소들 확인
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
      '[class*="total"]'
    ];

    let statsFound = false;
    for (const selector of statsSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`   ✅ 대시보드 통계 발견: ${selector} (${count}개 항목)`);
        statsFound = true;
        
        // 통계 내용 확인
        const statsText = await page.locator(selector).first().textContent();
        console.log(`   📊 통계 내용: ${statsText?.substring(0, 100)}...`);
        break;
      }
    }

    if (!statsFound) {
      console.log('   ⚠️ 명시적인 대시보드 통계 요소를 찾을 수 없음');
      
      // 숫자가 포함된 요소들 검색 (통계일 가능성)
      const numberElements = await page.locator('text=/\\d+/').count();
      if (numberElements > 0) {
        console.log(`   ✅ 숫자가 포함된 요소 ${numberElements}개 발견 (통계 가능성 있음)`);
      }
    }

    console.log('\n6️⃣ 페이지 구조 분석...');
    
    // 주요 네비게이션 요소들 확인
    const navElements = await page.locator('nav, [data-testid="navigation"], .navigation, .nav').count();
    console.log(`   📋 네비게이션 요소: ${navElements}개`);

    // 버튼 요소들 확인
    const buttons = await page.locator('button').count();
    console.log(`   🔘 버튼 요소: ${buttons}개`);

    // 폼 요소들 확인
    const forms = await page.locator('form').count();
    console.log(`   📝 폼 요소: ${forms}개`);

    // 링크 요소들 확인
    const links = await page.locator('a').count();
    console.log(`   🔗 링크 요소: ${links}개`);

    console.log('\n7️⃣ 스크린샷 캡처...');
    await page.screenshot({ 
      path: '/Users/tere.remote/the-realty-itemlist-dashboard/github-pages-test-screenshot.png', 
      fullPage: true 
    });
    console.log('   📸 전체 페이지 스크린샷 저장됨');

    console.log('\n📋 테스트 결과 요약:');
    console.log('='.repeat(50));
    console.log(`✅ 페이지 로딩: 성공 (HTTP ${response.status()})`);
    console.log(`✅ React 앱 렌더링: ${await page.locator('#root').count() > 0 ? '성공' : '실패'}`);
    console.log(`${errors.length === 0 ? '✅' : '❌'} JavaScript 에러: ${errors.length}개`);
    console.log(`${failedRequests.length === 0 ? '✅' : '❌'} 네트워크 요청: ${failedRequests.length}개 실패`);
    console.log(`${propertyDataFound ? '✅' : '⚠️'} 매물 데이터: ${propertyDataFound ? '발견됨' : '명확하지 않음'}`);
    console.log(`${statsFound ? '✅' : '⚠️'} 대시보드 통계: ${statsFound ? '발견됨' : '명확하지 않음'}`);

    if (errors.length > 0 || failedRequests.length > 0) {
      console.log('\n🔍 상세 문제점 분석:');
      if (errors.length > 0) {
        console.log('\n❌ JavaScript 에러들:');
        errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      if (failedRequests.length > 0) {
        console.log('\n❌ 실패한 요청들:');
        failedRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. ${req}`);
        });
      }
    }

    // 추가 디버깅 정보
    console.log('\n🔍 추가 디버깅 정보:');
    const bodyHTML = await page.locator('body').innerHTML();
    if (bodyHTML.includes('error') || bodyHTML.includes('Error')) {
      console.log('   ⚠️ 페이지 내용에 에러 관련 텍스트 발견됨');
    }
    
    const hasReactDevTools = await page.evaluate(() => {
      return window.React !== undefined || window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
    });
    console.log(`   ${hasReactDevTools ? '✅' : '❌'} React 감지: ${hasReactDevTools ? 'React 환경 확인됨' : 'React 환경 불명확'}`);

  } catch (error) {
    console.log(`\n❌ 테스트 실행 중 오류 발생: ${error.message}`);
    console.log(`스택 트레이스: ${error.stack}`);
  } finally {
    await browser.close();
    console.log('\n🏁 테스트 완료');
  }
}

// 테스트 실행
testGitHubPagesDeployment().catch(console.error);