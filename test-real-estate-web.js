const { chromium } = require('playwright');

async function testRealEstateWeb() {
  console.log('🏘️ 부동산 데이터 웹사이트 테스트 시작');
  
  let browser;
  let page;
  
  try {
    browser = await chromium.launch({ 
      headless: false,
      devtools: true
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
    
    console.log('📱 부동산 웹사이트 접속 중...');
    
    // 로컬 파일 열기
    const filePath = `file:///Users/tere.remote/the-realty-itemlist-dashboard/real-estate-data-web/index.html`;
    await page.goto(filePath, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ 페이지 로드 완료');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 페이지 제목: "${title}"`);
    
    // 주요 요소들 확인
    await page.waitForTimeout(3000);
    
    const headerText = await page.textContent('h1');
    console.log(`📋 헤더: "${headerText}"`);
    
    // 지역 선택 확인
    const regionSelect = await page.$('select');
    const regionValue = await regionSelect?.getAttribute('value');
    console.log(`🗺️ 기본 선택 지역: ${regionValue}`);
    
    // 조회 버튼 확인
    const button = await page.$('button');
    const buttonText = await button?.textContent();
    console.log(`🔍 조회 버튼: "${buttonText}"`);
    
    // API 호출 테스트 (버튼 클릭)
    console.log('🔄 API 호출 테스트...');
    await button?.click();
    
    // 로딩 상태 대기
    await page.waitForTimeout(5000);
    
    // 테이블 확인
    const table = await page.$('table');
    if (table) {
      const rows = await page.$$('tbody tr');
      console.log(`📊 데이터 행 수: ${rows.length}`);
    } else {
      console.log('📊 테이블 없음 (데이터 없거나 로딩 중)');
    }
    
    // 에러 체크
    if (errors.length > 0) {
      console.log('❌ 페이지 에러:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    } else {
      console.log('✅ 페이지 에러 없음');
    }
    
    // 콘솔 로그 체크 (마지막 10개만)
    console.log('📊 최근 콘솔 로그:');
    consoleLogs.slice(-10).forEach((log, i) => {
      console.log(`   ${i + 1}. ${log}`);
    });
    
    // 스크린샷
    await page.screenshot({ 
      path: 'real-estate-web-screenshot.png',
      fullPage: true 
    });
    console.log('📸 스크린샷 저장: real-estate-web-screenshot.png');
    
    const success = errors.length === 0;
    console.log(`\n🎯 테스트 결과: ${success ? '✅ 성공' : '❌ 실패'}`);
    
    return { success, title, errors, consoleLogs };
    
  } catch (error) {
    console.error('❌ 테스트 실행 오류:', error.message);
    return { success: false, error: error.message };
  } finally {
    setTimeout(async () => {
      if (browser) {
        await browser.close();
        console.log('🔒 브라우저 종료됨');
      }
    }, 8000);
  }
}

testRealEstateWeb();