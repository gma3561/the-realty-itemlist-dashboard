const { chromium } = require('playwright');

async function analyzeLoginPage() {
  console.log('🔍 로그인 페이지 심층 분석 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  try {
    console.log('1️⃣ 로그인 페이지 접근...');
    
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
      waitUntil: 'networkidle'
    });

    console.log(`   ✅ 현재 URL: ${page.url()}`);
    
    console.log('\n2️⃣ 로그인 페이지 HTML 구조 분석...');
    
    // 전체 페이지 구조
    const bodyHTML = await page.locator('body').innerHTML();
    console.log(`   📝 Body HTML 길이: ${bodyHTML.length} 문자`);
    
    // React 루트 내용
    const rootHTML = await page.locator('#root').innerHTML();
    console.log(`   📝 React Root HTML 길이: ${rootHTML.length} 문자`);
    
    // 로그인 관련 텍스트 확인
    const pageText = await page.textContent('body');
    console.log(`   📄 페이지 전체 텍스트:\n"${pageText}"`);
    
    console.log('\n3️⃣ 버튼 요소들 상세 분석...');
    
    // 모든 버튼 요소 찾기
    const buttons = await page.locator('button').all();
    console.log(`   🔘 총 버튼 개수: ${buttons.length}개`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      const className = await button.getAttribute('class');
      
      console.log(`   버튼 ${i + 1}:`);
      console.log(`      텍스트: "${text}"`);
      console.log(`      가시성: ${isVisible}`);
      console.log(`      활성화: ${isEnabled}`);
      console.log(`      클래스: ${className}`);
    }
    
    console.log('\n4️⃣ 클릭 가능한 모든 요소 찾기...');
    
    // 클릭 가능한 요소들 (버튼, 링크, 기타)
    const clickableElements = await page.locator('button, a, [onclick], [role="button"], .btn, .button').all();
    console.log(`   👆 클릭 가능한 요소: ${clickableElements.length}개`);
    
    for (let i = 0; i < clickableElements.length; i++) {
      const element = clickableElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const text = await element.textContent();
      const isVisible = await element.isVisible();
      
      console.log(`   요소 ${i + 1}: ${tagName} - "${text}" (가시성: ${isVisible})`);
    }
    
    console.log('\n5️⃣ 특정 키워드로 요소 검색...');
    
    // 바이패스, 데모, 건너뛰기 등의 키워드로 검색
    const bypassKeywords = ['바이패스', 'bypass', '건너뛰기', 'skip', '데모', 'demo', '임시', 'temp', '게스트', 'guest'];
    
    for (const keyword of bypassKeywords) {
      const elements = await page.locator(`text=${keyword}`).all();
      if (elements.length > 0) {
        console.log(`   🔍 "${keyword}" 키워드 발견: ${elements.length}개`);
        for (const element of elements) {
          const text = await element.textContent();
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`      ${tagName}: "${text}"`);
        }
      }
    }
    
    console.log('\n6️⃣ 로그인 방법 시도...');
    
    // 첫 번째 버튼 클릭 시도
    if (buttons.length > 0) {
      console.log('   🖱️ 첫 번째 버튼 클릭 시도...');
      const firstButton = buttons[0];
      const buttonText = await firstButton.textContent();
      console.log(`   클릭할 버튼: "${buttonText}"`);
      
      try {
        await firstButton.click();
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log(`   결과 URL: ${newUrl}`);
        
        if (!newUrl.includes('/login')) {
          console.log('   ✅ 로그인 성공! 대시보드로 이동됨');
          
          // 대시보드 내용 확인
          await analyzeDashboardContent(page);
        } else {
          console.log('   ⚠️ 여전히 로그인 페이지에 있음');
        }
      } catch (error) {
        console.log(`   ❌ 버튼 클릭 실패: ${error.message}`);
      }
    }
    
    // 두 번째 버튼이 있다면 시도
    if (buttons.length > 1) {
      console.log('\n   🖱️ 두 번째 버튼 클릭 시도...');
      const secondButton = buttons[1];
      const buttonText = await secondButton.textContent();
      console.log(`   클릭할 버튼: "${buttonText}"`);
      
      try {
        await secondButton.click();
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log(`   결과 URL: ${newUrl}`);
        
        if (!newUrl.includes('/login')) {
          console.log('   ✅ 로그인 성공! 대시보드로 이동됨');
          await analyzeDashboardContent(page);
        } else {
          console.log('   ⚠️ 여전히 로그인 페이지에 있음');
        }
      } catch (error) {
        console.log(`   ❌ 버튼 클릭 실패: ${error.message}`);
      }
    }

    // 세 번째 버튼이 있다면 시도
    if (buttons.length > 2) {
      console.log('\n   🖱️ 세 번째 버튼 클릭 시도...');
      const thirdButton = buttons[2];
      const buttonText = await thirdButton.textContent();
      console.log(`   클릭할 버튼: "${buttonText}"`);
      
      try {
        await thirdButton.click();
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log(`   결과 URL: ${newUrl}`);
        
        if (!newUrl.includes('/login')) {
          console.log('   ✅ 로그인 성공! 대시보드로 이동됨');
          await analyzeDashboardContent(page);
        } else {
          console.log('   ⚠️ 여전히 로그인 페이지에 있음');
        }
      } catch (error) {
        console.log(`   ❌ 버튼 클릭 실패: ${error.message}`);
      }
    }
    
    console.log('\n7️⃣ 최종 스크린샷...');
    await page.screenshot({ 
      path: '/Users/tere.remote/the-realty-itemlist-dashboard/login-analysis-screenshot.png',
      fullPage: true 
    });
    console.log('   📸 스크린샷 저장됨');
    
  } catch (error) {
    console.log(`\n❌ 분석 중 오류 발생: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n🏁 로그인 페이지 분석 완료');
  }
}

async function analyzeDashboardContent(page) {
  console.log('\n🏠 대시보드 내용 분석...');
  
  await page.waitForTimeout(5000); // 로딩 완료 대기
  
  // 현재 페이지 정보
  const currentUrl = page.url();
  const pageTitle = await page.title();
  console.log(`   📍 현재 URL: ${currentUrl}`);
  console.log(`   📋 페이지 제목: ${pageTitle}`);
  
  // 페이지 텍스트 내용
  const pageText = await page.textContent('body');
  console.log(`   📝 페이지 텍스트 길이: ${pageText?.length || 0} 문자`);
  
  // 매물 관련 키워드 검색
  const propertyKeywords = ['매물', '아파트', '주택', '오피스텔', '상가', '토지', 'property'];
  const foundPropertyKeywords = propertyKeywords.filter(keyword => 
    pageText?.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (foundPropertyKeywords.length > 0) {
    console.log(`   🏠 매물 관련 키워드 발견: ${foundPropertyKeywords.join(', ')}`);
  } else {
    console.log('   ⚠️ 매물 관련 키워드를 찾을 수 없음');
  }
  
  // 통계 관련 숫자 확인
  const numberMatches = pageText?.match(/\d+/g) || [];
  if (numberMatches.length > 0) {
    console.log(`   📊 페이지 내 숫자들: ${numberMatches.slice(0, 10).join(', ')}... (총 ${numberMatches.length}개)`);
  }
  
  // 주요 UI 구성요소 확인
  const uiElements = {
    '네비게이션': await page.locator('nav, [data-testid="navigation"], .navigation').count(),
    '사이드바': await page.locator('aside, .sidebar, [data-testid="sidebar"]').count(),
    '헤더': await page.locator('header, .header, [data-testid="header"]').count(),
    '메인 컨텐츠': await page.locator('main, .main, [data-testid="main"]').count(),
    '카드 요소': await page.locator('.card, [data-testid*="card"]').count(),
    '테이블': await page.locator('table').count(),
    '버튼': await page.locator('button').count(),
    '링크': await page.locator('a').count()
  };
  
  console.log('   🧩 UI 구성요소:');
  Object.entries(uiElements).forEach(([name, count]) => {
    console.log(`      ${name}: ${count}개`);
  });
  
  // 대시보드 스크린샷
  await page.screenshot({ 
    path: '/Users/tere.remote/the-realty-itemlist-dashboard/successful-dashboard-screenshot.png',
    fullPage: true 
  });
  console.log('   📸 대시보드 스크린샷 저장됨');
  
  console.log('\n   ✅ 대시보드 분석 완료');
}

// 테스트 실행
analyzeLoginPage().catch(console.error);