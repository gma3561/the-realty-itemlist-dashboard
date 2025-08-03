const { chromium } = require('playwright');

async function runVisualTest() {
    console.log('🎭 MCP Playwright 시각적 테스트 시작!');
    
    // 헤드풀 모드로 브라우저 실행 (실제 창이 보임)
    const browser = await chromium.launch({
        headless: false,  // 브라우저 창을 실제로 보여줌
        slowMo: 2000,     // 2초마다 천천히 실행
        args: ['--start-maximized'] // 전체화면으로 시작
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    try {
        console.log('📱 더부동산 매물 관리 시스템 접속 중...');
        await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
        
        console.log('⏱️  페이지 로딩 완료 - 3초 대기');
        await page.waitForTimeout(3000);
        
        console.log('📸 홈페이지 스크린샷 촬영');
        await page.screenshot({ path: 'homepage.png', fullPage: true });
        
        console.log('🔍 로그인 폼 찾는 중...');
        const emailInput = await page.locator('input[type="email"]').first();
        const passwordInput = await page.locator('input[type="password"]').first();
        
        if (await emailInput.isVisible()) {
            console.log('✍️ 테스트 계정으로 로그인 시도...');
            
            await emailInput.fill('jenny@the-realty.co.kr');
            await page.waitForTimeout(1000);
            
            await passwordInput.fill('admin123!');
            await page.waitForTimeout(1000);
            
            console.log('🔐 로그인 버튼 클릭');
            const loginButton = await page.locator('button[type="submit"]').first();
            await loginButton.click();
            
            await page.waitForTimeout(3000);
            console.log('📸 로그인 후 스크린샷 촬영');
            await page.screenshot({ path: 'after-login.png', fullPage: true });
        }
        
        console.log('🏠 매물 관리 페이지 접근 시도...');
        const propertyLink = await page.locator('a').filter({ hasText: '매물' }).first();
        if (await propertyLink.isVisible()) {
            await propertyLink.click();
            await page.waitForTimeout(2000);
            console.log('📸 매물 목록 스크린샷 촬영');
            await page.screenshot({ path: 'property-list.png', fullPage: true });
        }
        
        console.log('📊 대시보드 페이지 접근...');
        const dashboardLink = await page.locator('a').filter({ hasText: '대시보드' }).first();
        if (await dashboardLink.isVisible()) {
            await dashboardLink.click();
            await page.waitForTimeout(2000);
            console.log('📸 대시보드 스크린샷 촬영');
            await page.screenshot({ path: 'dashboard.png', fullPage: true });
        }
        
        console.log('📱 모바일 뷰 테스트 시작...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        console.log('📸 모바일 뷰 스크린샷 촬영');
        await page.screenshot({ path: 'mobile-view.png', fullPage: true });
        
        console.log('⏳ 10초 동안 브라우저를 열어둡니다. 직접 확인해보세요!');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ 테스트 중 에러 발생:', error.message);
        await page.screenshot({ path: 'error-screenshot.png' });
    }
    
    await browser.close();
    console.log('✅ 시각적 테스트 완료!');
    console.log('📁 생성된 스크린샷 파일들을 확인해보세요:');
    console.log('   - homepage.png');
    console.log('   - after-login.png');
    console.log('   - property-list.png');
    console.log('   - dashboard.png');
    console.log('   - mobile-view.png');
}

runVisualTest();