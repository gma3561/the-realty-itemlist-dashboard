const { chromium } = require('playwright');

async function runVisualDemo() {
  console.log('🎭 MCP Playwright로 더부동산 시스템 시각적 테스트 시작!');
  console.log('👀 브라우저가 열리고 자동으로 테스트가 진행됩니다.');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ 
    headless: false,  // 브라우저를 보이게 설정
    slowMo: 2000      // 2초씩 천천히 실행
  });

  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 }
  });

  const page = await context.newPage();

  try {
    console.log('📱 1. 더부동산 매물 관리 시스템에 접속 중...');
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', {
      waitUntil: 'networkidle'
    });
    
    console.log('📸 2. 초기 페이지 스크린샷 촬영...');
    await page.screenshot({ 
      path: './test-results/01-homepage.png', 
      fullPage: true 
    });
    
    console.log('🔍 3. 페이지 제목 확인...');
    const title = await page.title();
    console.log(`   제목: "${title}"`);
    
    console.log('⏱️ 4. 5초 대기하여 페이지 완전 로딩...');
    await page.waitForTimeout(5000);
    
    console.log('🔐 5. 로그인 폼 찾기...');
    
    // 이메일 입력 필드 찾기
    const emailField = page.locator('input[type="email"], input[name="email"], input[type="text"]').first();
    
    if (await emailField.isVisible({ timeout: 10000 })) {
      console.log('✅ 로그인 폼 발견! 테스트 계정으로 로그인 시도...');
      
      // 로그인 정보 입력
      await emailField.fill('jenny@the-realty.co.kr');
      console.log('   ✅ 이메일 입력: jenny@the-realty.co.kr');
      
      const passwordField = page.locator('input[type="password"]').first();
      await passwordField.fill('admin123!');
      console.log('   ✅ 비밀번호 입력: admin123!');
      
      // 로그인 버튼 클릭
      const loginButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
      
      console.log('📸 6. 로그인 폼 작성 후 스크린샷...');
      await page.screenshot({ 
        path: './test-results/02-login-form.png', 
        fullPage: true 
      });
      
      await loginButton.click();
      console.log('   🖱️ 로그인 버튼 클릭!');
      
      console.log('⏱️ 7. 로그인 처리 대기...');
      await page.waitForTimeout(3000);
      
      console.log('📸 8. 로그인 후 페이지 스크린샷...');
      await page.screenshot({ 
        path: './test-results/03-after-login.png', 
        fullPage: true 
      });
      
      console.log('🏠 9. 매물 관리 메뉴 찾기...');
      const propertyMenu = page.locator('a:has-text("매물"), nav a:has-text("Property")').first();
      
      if (await propertyMenu.isVisible({ timeout: 5000 })) {
        console.log('   🖱️ 매물 메뉴 클릭!');
        await propertyMenu.click();
        await page.waitForTimeout(2000);
        
        console.log('📸 10. 매물 관리 페이지 스크린샷...');
        await page.screenshot({ 
          path: './test-results/04-property-management.png', 
          fullPage: true 
        });
      } else {
        console.log('   ⚠️ 매물 메뉴를 찾을 수 없습니다.');
      }
      
    } else {
      console.log('⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인된 상태이거나 다른 인터페이스일 수 있습니다.');
      
      console.log('📸 현재 페이지 상태 캡처...');
      await page.screenshot({ 
        path: './test-results/05-current-state.png', 
        fullPage: true 
      });
    }
    
    console.log('📱 11. 반응형 테스트 - 모바일 화면으로 변경...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    console.log('📸 12. 모바일 반응형 스크린샷...');
    await page.screenshot({ 
      path: './test-results/06-mobile-responsive.png', 
      fullPage: true 
    });
    
    console.log('📱 13. 태블릿 화면으로 변경...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    
    console.log('📸 14. 태블릿 반응형 스크린샷...');
    await page.screenshot({ 
      path: './test-results/07-tablet-responsive.png', 
      fullPage: true 
    });
    
    console.log('🔍 15. 페이지 성능 정보 수집...');
    const performanceEntries = await page.evaluate(() => {
      return JSON.stringify({
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      });
    });
    
    console.log('⚡ 성능 정보:', JSON.parse(performanceEntries));
    
    console.log('⏱️ 16. 최종 확인을 위해 10초 대기...');
    console.log('   👀 이 시간 동안 브라우저에서 직접 확인해보세요!');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    
    console.log('📸 오류 발생 시점 스크린샷 촬영...');
    await page.screenshot({ 
      path: './test-results/error-screenshot.png', 
      fullPage: true 
    });
  } finally {
    console.log('🎯 테스트 완료! 브라우저를 닫습니다...');
    console.log('📁 생성된 스크린샷들을 확인해보세요:');
    console.log('   - ./test-results/ 폴더에 저장됨');
    
    await browser.close();
    
    console.log('✅ 시각적 테스트 완료!');
    console.log('=' .repeat(60));
  }
}

runVisualDemo().catch(console.error);