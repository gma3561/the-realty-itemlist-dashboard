const { chromium } = require('playwright');

async function testDataCollection() {
  console.log('🚀 부동산 데이터 수집 페이지 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300 
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:5173');
    console.log('✅ 로그인 페이지 접속');
    
    // 2. 개발용 바이패스 로그인 찾기
    await page.waitForLoadState('networkidle');
    const bypassButton = page.locator('button:has-text("개발용 바이패스 로그인")');
    
    if (await bypassButton.count() > 0) {
      await bypassButton.click();
      console.log('✅ 개발용 로그인 클릭');
      
      // 대시보드 로드 대기
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ 대시보드 접속 성공');
    } else {
      console.log('⚠️ 개발용 바이패스 로그인 버튼을 찾을 수 없습니다.');
      const pageContent = await page.content();
      if (pageContent.includes('Google로 로그인')) {
        console.log('❌ 구글 로그인만 가능합니다. 개발 모드를 활성화하세요.');
      }
      return;
    }
    
    // 3. 사이드바 확인
    await page.waitForSelector('[data-testid="sidebar"], nav, aside', { timeout: 5000 }).catch(() => {
      console.log('⚠️ 사이드바를 찾지 못했습니다.');
    });
    
    // 4. 데이터 수집 메뉴 찾기 및 클릭
    const dataCollectionLink = page.locator('a[href*="data-collection"], a:has-text("데이터 수집"), button:has-text("데이터 수집")').first();
    
    if (await dataCollectionLink.count() > 0) {
      await dataCollectionLink.click();
      console.log('✅ 데이터 수집 메뉴 클릭');
      
      // 페이지 로드 대기
      await page.waitForURL('**/data-collection', { timeout: 10000 });
      console.log('✅ 데이터 수집 페이지 접속');
    } else {
      console.log('❌ 데이터 수집 메뉴를 찾을 수 없습니다.');
      
      // 사이드바 내용 출력
      const sidebarText = await page.locator('nav, aside').first().textContent();
      console.log('사이드바 메뉴:', sidebarText);
      return;
    }
    
    // 5. 데이터 수집 페이지 확인
    await page.waitForSelector('h1:has-text("부동산 실거래가 데이터 수집")', { timeout: 5000 });
    console.log('✅ 데이터 수집 페이지 로드 완료\n');
    
    // 6. API 키 상태 확인
    const apiKeyStatusElement = await page.locator('text=상태:').locator('..');
    const apiKeyStatus = await apiKeyStatusElement.textContent();
    console.log('📋 API 키 상태:', apiKeyStatus);
    
    if (apiKeyStatus.includes('✅ 설정됨')) {
      console.log('🎉 키체인에서 API 키가 자동으로 로드되었습니다!\n');
      
      // 수집 상태 정보 가져오기
      const statusInfo = await page.locator('.bg-blue-50').textContent();
      console.log('📊 수집 상태 정보:');
      const lines = statusInfo.split('\n').filter(line => line.trim());
      lines.forEach(line => console.log('  ', line.trim()));
      
      // 컨트롤 버튼 확인
      console.log('\n🎮 사용 가능한 기능:');
      
      const manualButton = page.locator('button:has-text("수동 수집")');
      if (await manualButton.isEnabled()) {
        console.log('   ✅ 수동 수집 - 즉시 데이터 수집 가능');
      }
      
      const autoStartButton = page.locator('button:has-text("자동 수집 시작")');
      if (await autoStartButton.count() > 0 && await autoStartButton.isEnabled()) {
        console.log('   ✅ 자동 수집 시작 - 3시간마다 자동 수집');
      }
      
      const autoStopButton = page.locator('button:has-text("자동 수집 중지")');
      if (await autoStopButton.count() > 0) {
        console.log('   ⏸️ 자동 수집 실행 중');
      }
      
    } else {
      console.log('⚠️ API 키가 설정되지 않았습니다.');
      console.log('💡 터미널에서 다음 명령어 실행: npm run setup-api-key');
    }
    
    // 7. 스크린샷 저장
    await page.screenshot({ 
      path: 'data-collection-test-result.png',
      fullPage: true 
    });
    console.log('\n📸 스크린샷 저장: data-collection-test-result.png');
    
    console.log('\n🎯 테스트 완료!');
    console.log('💡 브라우저가 열려 있습니다. 수동으로 테스트해보세요.');
    console.log('   - 수동 수집 버튼을 클릭하여 데이터 수집');
    console.log('   - 실시간 데이터 조회 기능 테스트');
    console.log('   종료하려면 Ctrl+C를 누르세요.\n');
    
    // 브라우저 열어두기
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    // Ctrl+C로 종료 시 브라우저 닫기
    process.on('SIGINT', async () => {
      await browser.close();
      process.exit(0);
    });
  }
}

// 테스트 실행
testDataCollection();