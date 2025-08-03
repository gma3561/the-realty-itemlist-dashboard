const { chromium } = require('playwright');

(async () => {
  // 브라우저를 헤드풀 모드로 실행 (실제 창이 열림)
  const browser = await chromium.launch({ 
    headless: false,  // 브라우저 창을 실제로 보여줌
    slowMo: 1000      // 액션들을 천천히 실행해서 볼 수 있게 함
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🚀 Playwright 브라우저가 시작되었습니다!');
  console.log('📱 매물 관리 시스템을 테스트합니다...');
  
  try {
    // GitHub Pages에 호스팅된 앱으로 이동
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
    
    console.log('✅ 페이지 로드 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: ${title}`);
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'homepage-screenshot.png' });
    console.log('📸 스크린샷 저장: homepage-screenshot.png');
    
    // 로그인 버튼 찾기 및 클릭
    const loginButton = await page.locator('button').filter({ hasText: '로그인' }).first();
    if (await loginButton.isVisible()) {
      console.log('🔍 로그인 버튼 발견!');
      await loginButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 매물 목록 링크 찾기
    const propertyLink = await page.locator('a').filter({ hasText: '매물' }).first();
    if (await propertyLink.isVisible()) {
      console.log('🏠 매물 링크 발견!');
      await propertyLink.click();
      await page.waitForTimeout(2000);
    }
    
    console.log('⏳ 10초 동안 브라우저를 열어둡니다. 직접 확인해보세요!');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
  }
  
  await browser.close();
  console.log('🔚 테스트 완료');
})();