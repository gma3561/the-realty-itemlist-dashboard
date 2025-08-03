const { chromium } = require('playwright');

async function directQATest() {
  console.log('🎯 Playwright 직접 QA 테스트 시작');
  
  let browser;
  let page;
  
  try {
    // 브라우저 시작
    browser = await chromium.launch({ 
      headless: false, // 브라우저 창을 보여줌
      devtools: true   // 개발자 도구 열기
    });
    
    page = await browser.newPage();
    
    // 콘솔 로그 수집
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // 에러 수집
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    console.log('📱 페이지 접속 중: http://localhost:6014/');
    
    // 페이지 접속
    const response = await page.goto('http://localhost:6014/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`✅ HTTP 응답: ${response.status()}`);
    
    // 페이지 로드 완료 대기
    await page.waitForTimeout(3000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: "${title}"`);
    
    // HTML 내용 확인
    const bodyText = await page.textContent('body');
    console.log(`📝 페이지 내용 (처음 200자): "${bodyText.substring(0, 200)}..."`);
    
    // React 앱이 로드되었는지 확인
    const rootElement = await page.$('#root');
    const rootContent = await rootElement?.textContent();
    console.log(`⚛️ React Root 내용: "${rootContent?.substring(0, 100)}..."`);
    
    // 에러 체크
    if (errors.length > 0) {
      console.log('❌ 페이지 에러 발견:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ 페이지 에러 없음');
    }
    
    // 콘솔 로그 체크
    console.log('📊 콘솔 로그:');
    consoleLogs.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log}`);
    });
    
    // 스크린샷 촬영
    await page.screenshot({ 
      path: 'qa-test-screenshot.png',
      fullPage: true 
    });
    console.log('📸 스크린샷 저장: qa-test-screenshot.png');
    
    // 성공 여부 판단
    const isSuccess = errors.length === 0 && rootContent && rootContent.length > 0;
    
    console.log('\n🎯 QA 테스트 결과:');
    console.log(`   HTTP 상태: ${response.status()}`);
    console.log(`   페이지 제목: ${title}`);
    console.log(`   React 로드: ${rootContent ? '성공' : '실패'}`);
    console.log(`   에러 개수: ${errors.length}`);
    console.log(`   전체 성공: ${isSuccess ? '✅ 성공' : '❌ 실패'}`);
    
    return {
      success: isSuccess,
      httpStatus: response.status(),
      title,
      rootContent: rootContent?.substring(0, 200),
      errors,
      consoleLogs
    };
    
  } catch (error) {
    console.error('❌ QA 테스트 실행 오류:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // 5초 후 브라우저 닫기
    setTimeout(async () => {
      if (browser) {
        await browser.close();
        console.log('🔒 브라우저 종료됨');
      }
    }, 5000);
  }
}

// 테스트 실행
directQATest();