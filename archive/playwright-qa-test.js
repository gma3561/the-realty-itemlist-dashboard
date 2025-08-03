const { chromium } = require('@playwright/test');

async function runQATest() {
  console.log('🎭 부동산 대시보드 자동 QA 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 각 동작을 천천히 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1. 홈페이지 접속 테스트
    console.log('📍 Step 1: 홈페이지 접속');
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
    await page.waitForLoadState('networkidle');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'qa-screenshots/01-homepage.png', fullPage: true });
    console.log('✅ 홈페이지 로드 완료\n');
    
    // 2. 로그인 페이지 확인
    console.log('📍 Step 2: 로그인 페이지 확인');
    const loginForm = await page.locator('form').first();
    if (await loginForm.isVisible()) {
      console.log('✅ 로그인 폼 발견');
      
      // 로그인 시도
      await page.fill('input[type="email"]', 'jenny@the-realty.co.kr');
      await page.fill('input[type="password"]', 'admin123!');
      await page.screenshot({ path: 'qa-screenshots/02-login-filled.png' });
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      console.log('⏳ 로그인 시도 중...');
      
      // 로그인 후 대기
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'qa-screenshots/03-after-login.png', fullPage: true });
    }
    
    // 3. 대시보드 요소 확인
    console.log('\n📍 Step 3: 대시보드 요소 확인');
    const dashboardElements = {
      '통계 카드': '[class*="card"], [class*="stat"]',
      '차트': 'canvas, svg[class*="chart"], [class*="recharts"]',
      '네비게이션': 'nav, [class*="navigation"], [class*="sidebar"]',
      '헤더': 'header, [class*="header"]'
    };
    
    for (const [name, selector] of Object.entries(dashboardElements)) {
      const element = await page.locator(selector).first();
      if (await element.isVisible()) {
        console.log(`✅ ${name} 확인됨`);
      } else {
        console.log(`❌ ${name} 없음`);
      }
    }
    
    // 4. 매물 페이지 테스트
    console.log('\n📍 Step 4: 매물 페이지 테스트');
    const propertyLink = await page.locator('a:has-text("매물"), a[href*="properties"]').first();
    if (await propertyLink.isVisible()) {
      await propertyLink.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'qa-screenshots/04-properties-page.png', fullPage: true });
      console.log('✅ 매물 페이지 접속 완료');
      
      // 매물 목록 확인
      const propertyList = await page.locator('[class*="property"], [class*="item"], table').first();
      if (await propertyList.isVisible()) {
        console.log('✅ 매물 목록 표시됨');
      }
    }
    
    // 5. 반응형 디자인 테스트
    console.log('\n📍 Step 5: 반응형 디자인 테스트');
    const viewports = [
      { name: '모바일', width: 375, height: 812 },
      { name: '태블릿', width: 768, height: 1024 },
      { name: '데스크톱', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: `qa-screenshots/05-responsive-${viewport.name}.png`,
        fullPage: true 
      });
      console.log(`✅ ${viewport.name} 뷰 (${viewport.width}x${viewport.height}) 테스트 완료`);
    }
    
    // 6. 에러 확인
    console.log('\n📍 Step 6: 에러 메시지 확인');
    const errors = await page.locator('.error, [class*="error"], .alert-danger').all();
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length}개의 에러 요소 발견`);
      for (const error of errors) {
        const text = await error.textContent();
        console.log(`   - ${text}`);
      }
    } else {
      console.log('✅ 에러 메시지 없음');
    }
    
    console.log('\n✨ QA 테스트 완료!');
    console.log('📸 스크린샷은 qa-screenshots 폴더에 저장되었습니다.');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'qa-screenshots/error-screenshot.png', fullPage: true });
  } finally {
    // 브라우저 10초 동안 열어두기
    console.log('\n⏰ 브라우저를 10초 동안 열어둡니다...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// 스크린샷 폴더 생성
const fs = require('fs');
if (!fs.existsSync('qa-screenshots')) {
  fs.mkdirSync('qa-screenshots');
}

// 테스트 실행
runQATest().catch(console.error);