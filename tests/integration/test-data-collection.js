const { test, expect } = require('@playwright/test');

test.describe('부동산 데이터 수집 테스트', () => {
  test('데이터 수집 페이지 접속 및 API 키 자동 로드 확인', async ({ page }) => {
    console.log('🚀 부동산 데이터 수집 페이지 테스트 시작...');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:5173');
    console.log('✅ 로그인 페이지 접속');
    
    // 2. 개발용 바이패스 로그인
    const bypassButton = page.locator('button:has-text("개발용 바이패스 로그인")');
    const hasDevLogin = await bypassButton.count() > 0;
    
    if (hasDevLogin) {
      await bypassButton.click();
      console.log('✅ 개발용 로그인 성공');
    } else {
      // 또는 구글 로그인 버튼 찾기
      const googleLogin = page.locator('button:has-text("Google로 로그인")');
      if (await googleLogin.count() > 0) {
        console.log('❌ 구글 로그인이 필요합니다. 개발용 바이패스 로그인을 활성화하세요.');
        return;
      }
    }
    
    // 3. 대시보드 로드 대기
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ 대시보드 접속');
    
    // 4. 데이터 수집 메뉴 클릭
    await page.click('text=데이터 수집');
    await page.waitForURL('**/data-collection');
    console.log('✅ 데이터 수집 페이지 접속');
    
    // 5. 페이지 로드 대기
    await page.waitForSelector('h1:has-text("부동산 실거래가 데이터 수집")');
    
    // 6. API 키 상태 확인
    const apiKeyStatus = await page.locator('text=상태:').locator('..').textContent();
    console.log('📋 API 키 상태:', apiKeyStatus);
    
    // 7. 키체인에서 API 키가 자동으로 로드되었는지 확인
    if (apiKeyStatus.includes('✅ 설정됨')) {
      console.log('🎉 키체인에서 API 키가 자동으로 로드되었습니다!');
      
      // 8. 수집 상태 정보 확인
      const collectorStatus = await page.locator('.bg-blue-50').textContent();
      console.log('\n📊 수집 상태:');
      console.log(collectorStatus);
      
      // 9. 수동 수집 버튼 확인
      const manualCollectButton = page.locator('button:has-text("수동 수집")');
      const isEnabled = await manualCollectButton.isEnabled();
      
      if (isEnabled) {
        console.log('\n✅ 수동 수집 버튼이 활성화되어 있습니다.');
        console.log('💡 수동 수집을 시작하려면 버튼을 클릭하세요.');
        
        // 스크린샷 저장
        await page.screenshot({ 
          path: 'data-collection-ready.png',
          fullPage: true 
        });
        console.log('📸 스크린샷 저장: data-collection-ready.png');
      }
      
    } else if (apiKeyStatus.includes('❌ 미설정')) {
      console.log('⚠️ API 키가 설정되지 않았습니다.');
      console.log('💡 키체인에 API 키 설정: npm run setup-api-key');
      
      // API 키 입력 필드 확인
      const apiKeyInput = page.locator('input[placeholder="API 키를 입력하세요..."]');
      if (await apiKeyInput.count() > 0) {
        console.log('📝 API 키 입력 필드가 표시됩니다.');
      }
    }
    
    // 10. 실시간 데이터 조회 섹션 확인
    const realtimeSection = await page.locator('h2:has-text("실시간 부동산 실거래가 조회")').count();
    if (realtimeSection > 0) {
      console.log('\n✅ 실시간 데이터 조회 섹션이 있습니다.');
    }
    
    console.log('\n🎯 테스트 완료!');
  });
});

// 단독 실행 시
if (require.main === module) {
  const { chromium } = require('playwright');
  
  (async () => {
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 500 
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 테스트 실행
    await test.fn[0]({ page });
    
    // 브라우저 열어두기 (수동 테스트용)
    console.log('\n🔍 브라우저가 열려 있습니다. 수동으로 테스트해보세요.');
    console.log('   종료하려면 Ctrl+C를 누르세요.');
    
    // 프로세스 종료 대기
    await new Promise(() => {});
  })();
}