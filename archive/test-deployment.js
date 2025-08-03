const { chromium } = require('playwright');

async function testDeployment() {
  console.log('🚀 GitHub Pages 배포 테스트 시작...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 배포된 사이트 접속
    console.log('📱 배포된 사이트 접속 중...');
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
    await page.waitForLoadState('networkidle');
    
    // 페이지 타이틀 확인
    const title = await page.title();
    console.log(`✅ 페이지 타이틀: ${title}`);
    
    // 2. 로그인 페이지 확인
    const loginTitle = await page.textContent('h1').catch(() => null);
    console.log(`📋 로그인 페이지 제목: ${loginTitle}`);
    
    // 3. 로그인 바이패스 버튼 확인
    const bypassButton = await page.locator('button:has-text("개발용 바이패스 로그인")').first();
    const bypassExists = await bypassButton.count() > 0;
    console.log(`🔑 바이패스 로그인 버튼 존재: ${bypassExists ? '✅' : '❌'}`);
    
    if (bypassExists) {
      // 4. 바이패스 로그인 테스트
      console.log('🧪 바이패스 로그인 테스트 중...');
      await bypassButton.click();
      await page.waitForLoadState('networkidle');
      
      // 대시보드로 이동했는지 확인
      const currentUrl = page.url();
      console.log(`🌐 현재 URL: ${currentUrl}`);
      
      // 사이드바나 헤더 확인
      const sidebar = await page.locator('[data-testid="sidebar"], .sidebar, nav').first().count();
      const header = await page.locator('[data-testid="header"], .header, header').first().count();
      console.log(`🧭 네비게이션 요소: 사이드바(${sidebar > 0 ? '✅' : '❌'}), 헤더(${header > 0 ? '✅' : '❌'})`);
      
      // 5. 권한별 테스트 (관리자)
      console.log('👑 관리자 권한 테스트 중...');
      const adminMenus = await page.locator('text="사용자 관리", text="직원 성과", text="설정"').count();
      console.log(`⚙️ 관리자 메뉴 요소 수: ${adminMenus}`);
      
      // 6. 매물 관련 기능 확인
      console.log('🏠 매물 관련 기능 확인 중...');
      const propertyMenu = await page.locator('text="매물 목록", text="매물 등록", text="내 매물"').count();
      console.log(`🏘️ 매물 메뉴 요소 수: ${propertyMenu}`);
      
      // 7. 콘솔 에러 확인
      const logs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      // 8. 추가 페이지 네비게이션 테스트
      try {
        await page.click('text="매물 목록"', { timeout: 5000 });
        await page.waitForLoadState('networkidle');
        console.log('✅ 매물 목록 페이지 이동 성공');
      } catch (e) {
        console.log('❌ 매물 목록 페이지 이동 실패:', e.message);
      }
      
      if (logs.length > 0) {
        console.log('⚠️ 콘솔 에러 발견:');
        logs.forEach(log => console.log(`  - ${log}`));
      } else {
        console.log('✅ 콘솔 에러 없음');
      }
    }
    
    // 9. 환경변수 로딩 확인 (개발자 도구에서)
    const envCheck = await page.evaluate(() => {
      return {
        supabaseUrl: window.location.origin.includes('github.io'),
        hasDOM: typeof document !== 'undefined',
        hasWindow: typeof window !== 'undefined'
      };
    });
    console.log('🔧 환경 확인:', envCheck);
    
    console.log('🎉 배포 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
testDeployment().catch(console.error);