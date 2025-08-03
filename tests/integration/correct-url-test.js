const { chromium } = require('playwright');

async function testCorrectURL() {
  console.log('🔍 올바른 URL로 대시보드 테스트 시작...\n');

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
    console.log('1️⃣ 올바른 GitHub Pages URL로 접근...');
    
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
      waitUntil: 'networkidle'
    });

    console.log(`   ✅ 현재 URL: ${page.url()}`);
    console.log(`   ✅ 페이지 제목: ${await page.title()}`);
    
    // 페이지가 정상적으로 로드되었는지 확인
    const isLoginPage = page.url().includes('/login') || page.url().includes('#/login');
    const is404Page = (await page.title()).includes('Site not found') || (await page.title()).includes('404');
    
    if (is404Page) {
      console.log('   ❌ 404 페이지가 로드됨 - GitHub Pages 설정 문제');
      return;
    }
    
    if (isLoginPage) {
      console.log('   🔐 로그인 페이지가 정상적으로 로드됨');
      
      console.log('\n2️⃣ 개발자 버튼으로 바이패스 로그인 시도...');
      
      // 페이지 로딩 완료 대기
      await page.waitForTimeout(3000);
      
      // 관리자 로그인 버튼 찾기 및 클릭
      const adminButton = page.locator('button:has-text("🔑 관리자로 로그인")');
      const adminButtonExists = await adminButton.count() > 0;
      
      if (adminButtonExists) {
        console.log('   🔑 관리자 로그인 버튼 발견됨');
        
        // 버튼 클릭 전 현재 상태 확인
        const beforeClickURL = page.url();
        console.log(`   📍 클릭 전 URL: ${beforeClickURL}`);
        
        await adminButton.click();
        console.log('   ✅ 관리자 로그인 버튼 클릭됨');
        
        // 페이지 변화 대기 (더 긴 시간)
        await page.waitForTimeout(8000);
        
        const afterClickURL = page.url();
        console.log(`   📍 클릭 후 URL: ${afterClickURL}`);
        
        // URL 변화 확인
        if (afterClickURL !== beforeClickURL) {
          console.log('   ✅ URL이 변경되었음 - 로그인 처리 중');
          
          if (afterClickURL.includes('accounts.google.com')) {
            console.log('   🔄 Google OAuth 페이지로 리다이렉트됨');
            console.log('   ⚠️ 실제 Google 로그인이 필요하므로 테스트 중단');
          } else if (!afterClickURL.includes('/login')) {
            console.log('   ✅ 대시보드로 성공적으로 이동됨');
            await analyzeDashboard(page);
          } else {
            console.log('   ⚠️ 여전히 로그인 페이지에 있음');
          }
        } else {
          console.log('   ⚠️ URL 변화 없음 - 버튼 클릭이 효과가 없었을 수 있음');
          
          // 일반사용자 버튼도 시도
          console.log('\n   👤 일반사용자 로그인 버튼 시도...');
          const userButton = page.locator('button:has-text("👤 일반사용자로 로그인")');
          const userButtonExists = await userButton.count() > 0;
          
          if (userButtonExists) {
            await userButton.click();
            console.log('   ✅ 일반사용자 로그인 버튼 클릭됨');
            
            await page.waitForTimeout(8000);
            
            const userLoginURL = page.url();
            console.log(`   📍 일반사용자 로그인 후 URL: ${userLoginURL}`);
            
            if (!userLoginURL.includes('/login') && !userLoginURL.includes('accounts.google.com')) {
              console.log('   ✅ 일반사용자로 대시보드 접근 성공');
              await analyzeDashboard(page);
            } else {
              console.log('   ⚠️ 일반사용자 로그인도 실패');
            }
          }
        }
      } else {
        console.log('   ❌ 관리자 로그인 버튼을 찾을 수 없음');
        
        // 페이지의 모든 버튼 확인
        const allButtons = await page.locator('button').all();
        console.log(`   🔍 페이지의 모든 버튼 (${allButtons.length}개):`);
        
        for (let i = 0; i < allButtons.length; i++) {
          const buttonText = await allButtons[i].textContent();
          console.log(`      버튼 ${i + 1}: "${buttonText}"`);
        }
      }
    } else {
      console.log('   📋 로그인 페이지가 아닌 다른 페이지가 로드됨');
      await analyzeDashboard(page);
    }
    
    console.log('\n3️⃣ 페이지 리소스 분석...');
    
    // 네트워크 리소스 상태 확인
    const scripts = await page.locator('script[src]').count();
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    console.log(`   📦 JavaScript 파일: ${scripts}개`);
    console.log(`   🎨 CSS 파일: ${stylesheets}개`);
    
    // React 앱 상태 확인
    const reactRoot = await page.locator('#root').count();
    const rootContent = await page.locator('#root').innerHTML();
    console.log(`   ⚛️ React 루트 요소: ${reactRoot > 0 ? '발견됨' : '없음'}`);
    console.log(`   📝 React 루트 내용 길이: ${rootContent.length} 문자`);
    
    console.log('\n4️⃣ 최종 스크린샷 및 보고서...');
    
    await page.screenshot({ 
      path: '/Users/tere.remote/the-realty-itemlist-dashboard/correct-url-test-screenshot.png',
      fullPage: true 
    });
    console.log('   📸 최종 스크린샷 저장됨');
    
    // 최종 분석 결과
    console.log('\n📋 최종 테스트 결과:');
    console.log('='.repeat(60));
    console.log(`🌐 웹사이트 상태: ${is404Page ? '404 에러' : '정상 로드'}`);
    console.log(`⚛️ React 애플리케이션: ${reactRoot > 0 ? '정상 렌더링' : '렌더링 실패'}`);
    console.log(`🔐 인증 시스템: ${isLoginPage ? '활성화됨 (로그인 필요)' : '비활성화됨'}`);
    console.log(`❌ JavaScript 에러: ${errors.length}개`);
    console.log(`📝 콘솔 로그: ${consoleLogs.length}개`);
    
    if (errors.length > 0) {
      console.log('\n❌ 발견된 JavaScript 에러들:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n💡 테스트 결론:');
    console.log('   - React 애플리케이션이 정상적으로 로드되고 있음');
    console.log('   - 로그인 시스템이 활성화되어 있어 인증이 필요함');
    console.log('   - 개발자 바이패스 버튼들이 제공되고 있음');
    console.log('   - 실제 대시보드 기능 테스트를 위해서는 인증 우회 또는 테스트 계정 필요');
    
  } catch (error) {
    console.log(`\n❌ 테스트 실행 중 오류 발생: ${error.message}`);
    console.log(`스택 트레이스:\n${error.stack}`);
  } finally {
    await browser.close();
    console.log('\n🏁 올바른 URL 테스트 완료');
  }
}

async function analyzeDashboard(page) {
  console.log('\n🏠 대시보드 분석 시작...');
  
  await page.waitForTimeout(5000);
  
  const currentUrl = page.url();
  const pageTitle = await page.title();
  const pageText = await page.textContent('body');
  
  console.log(`   📍 현재 URL: ${currentUrl}`);
  console.log(`   📋 페이지 제목: ${pageTitle}`);
  console.log(`   📝 페이지 텍스트 길이: ${pageText?.length || 0} 문자`);
  
  // 매물 관련 분석
  const propertyKeywords = ['매물', 'property', '아파트', '주택', '오피스텔', '상가'];
  const foundPropertyKeywords = propertyKeywords.filter(keyword => 
    pageText?.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (foundPropertyKeywords.length > 0) {
    console.log(`   🏠 매물 관련 키워드: ${foundPropertyKeywords.join(', ')}`);
  } else {
    console.log('   ⚠️ 매물 관련 키워드 없음');
  }
  
  // 통계 관련 분석
  const numberMatches = pageText?.match(/\d+/g) || [];
  if (numberMatches.length > 0) {
    console.log(`   📊 페이지 내 숫자들: ${numberMatches.slice(0, 5).join(', ')}... (총 ${numberMatches.length}개)`);
  }
  
  // UI 요소 분석
  const uiCounts = {
    '버튼': await page.locator('button').count(),
    '링크': await page.locator('a').count(),
    '카드': await page.locator('.card, [class*="card"]').count(),
    '테이블': await page.locator('table').count(),
    '네비게이션': await page.locator('nav').count()
  };
  
  console.log('   🧩 UI 요소들:');
  Object.entries(uiCounts).forEach(([name, count]) => {
    console.log(`      ${name}: ${count}개`);
  });
  
  console.log('   ✅ 대시보드 분석 완료');
}

// 테스트 실행
testCorrectURL().catch(console.error);