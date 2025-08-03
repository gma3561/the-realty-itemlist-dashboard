const { chromium } = require('playwright');

console.log('🎭 MCP Playwright 시각적 QA 시작!');
console.log('브라우저 창이 열립니다. 모든 액션을 직접 보실 수 있습니다!\n');

(async () => {
    // 브라우저를 시각적으로 실행 (headless: false)
    const browser = await chromium.launch({
        headless: false,  // 실제 브라우저 창 표시
        slowMo: 1500,     // 각 동작마다 1.5초 대기 (시각적 확인 가능)
        args: ['--start-maximized']
    });

    const context = await browser.newContext({
        viewport: null,  // 전체화면 사용
        recordVideo: {
            dir: './test-videos/'  // 비디오 녹화
        }
    });

    const page = await context.newPage();

    console.log('📍 Step 1: 홈페이지 접속');
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
    await page.waitForTimeout(2000);

    console.log('📸 홈페이지 스크린샷 촬영');
    await page.screenshot({ path: 'qa-1-homepage.png', fullPage: true });

    console.log('\n📍 Step 2: 로그인 테스트');
    console.log('이메일 입력: jenny@the-realty.co.kr');
    const emailInput = await page.locator('input[type="email"]');
    await emailInput.fill('jenny@the-realty.co.kr');
    await page.waitForTimeout(1000);

    console.log('비밀번호 입력: admin123!');
    const passwordInput = await page.locator('input[type="password"]');
    await passwordInput.fill('admin123!');
    await page.waitForTimeout(1000);

    console.log('로그인 버튼 클릭');
    const loginButton = await page.locator('button[type="submit"]');
    await loginButton.click();
    await page.waitForTimeout(3000);

    console.log('📸 로그인 후 대시보드 스크린샷');
    await page.screenshot({ path: 'qa-2-dashboard.png', fullPage: true });

    console.log('\n📍 Step 3: 대시보드 통계 확인');
    const stats = await page.locator('.bg-white.rounded-lg.shadow').all();
    console.log(`통계 카드 개수: ${stats.length}개`);
    await page.waitForTimeout(2000);

    console.log('\n📍 Step 4: 매물 관리 페이지 이동');
    const propertyMenu = await page.locator('a').filter({ hasText: '매물' }).first();
    await propertyMenu.click();
    await page.waitForTimeout(2000);

    console.log('📸 매물 목록 페이지 스크린샷');
    await page.screenshot({ path: 'qa-3-property-list.png', fullPage: true });

    console.log('\n📍 Step 5: 매물 검색 테스트');
    const searchInput = await page.locator('input[placeholder*="검색"]').first();
    if (await searchInput.isVisible()) {
        console.log('검색어 입력: "아파트"');
        await searchInput.fill('아파트');
        await page.waitForTimeout(2000);
    }

    console.log('\n📍 Step 6: 매물 등록 버튼 확인');
    const addButton = await page.locator('button').filter({ hasText: '매물 등록' }).first();
    if (await addButton.isVisible()) {
        console.log('매물 등록 버튼 클릭');
        await addButton.click();
        await page.waitForTimeout(2000);
        console.log('📸 매물 등록 폼 스크린샷');
        await page.screenshot({ path: 'qa-4-property-form.png', fullPage: true });
    }

    console.log('\n📍 Step 7: 반응형 디자인 테스트');
    console.log('모바일 뷰로 전환 (375x667)');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    console.log('📸 모바일 뷰 스크린샷');
    await page.screenshot({ path: 'qa-5-mobile-view.png', fullPage: true });

    console.log('태블릿 뷰로 전환 (768x1024)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(2000);
    console.log('📸 태블릿 뷰 스크린샷');
    await page.screenshot({ path: 'qa-6-tablet-view.png', fullPage: true });

    console.log('\n✅ 시각적 QA 완료!');
    console.log('📁 생성된 스크린샷:');
    console.log('  - qa-1-homepage.png');
    console.log('  - qa-2-dashboard.png');
    console.log('  - qa-3-property-list.png');
    console.log('  - qa-4-property-form.png');
    console.log('  - qa-5-mobile-view.png');
    console.log('  - qa-6-tablet-view.png');
    
    console.log('\n⏳ 10초 후 브라우저가 닫힙니다. 계속 테스트하려면 브라우저를 사용하세요!');
    await page.waitForTimeout(10000);

    await browser.close();
    console.log('🔚 테스트 종료');
})();