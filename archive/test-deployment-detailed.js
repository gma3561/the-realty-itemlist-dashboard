const { chromium } = require('playwright');

async function testDeploymentDetailed() {
  console.log('🔍 상세 배포 테스트 시작...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 메시지 캡처
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // 네트워크 요청 모니터링
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push(request.url());
  });
  
  try {
    // 1. 배포된 사이트 접속
    console.log('📱 배포된 사이트 접속 중...');
    await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/', { waitUntil: 'networkidle' });
    
    // 페이지 완전 로딩 대기
    await page.waitForTimeout(3000);
    
    // 페이지 타이틀 확인
    const title = await page.title();
    console.log(`✅ 페이지 타이틀: ${title}`);
    
    // 2. 페이지 내용 확인
    const bodyContent = await page.textContent('body');
    console.log(`📄 페이지 내용 길이: ${bodyContent.length}자`);
    
    // 3. React 앱이 마운트되었는지 확인
    const rootElement = await page.locator('#root').innerHTML();
    console.log(`⚛️ React 루트 요소 내용 길이: ${rootElement.length}자`);
    
    // 4. 모든 버튼 요소 찾기
    const allButtons = await page.locator('button').allTextContents();
    console.log('🔘 페이지의 모든 버튼들:', allButtons);
    
    // 5. 입력 필드 확인
    const inputFields = await page.locator('input').count();
    console.log(`📝 입력 필드 개수: ${inputFields}`);
    
    // 6. 특정 텍스트 찾기
    const loginTexts = await page.locator('text=/로그인|Login|바이패스|bypass/i').allTextContents();
    console.log('🔑 로그인 관련 텍스트:', loginTexts);
    
    // 7. 클래스명이나 ID로 찾기
    const bypassElements = await page.locator('[class*="bypass"], [id*="bypass"], [data-testid*="bypass"]').count();
    console.log(`🎯 바이패스 관련 요소 개수: ${bypassElements}`);
    
    // 8. 개발 환경 관련 요소 찾기
    const devElements = await page.locator('text=/개발|dev|demo|test/i').allTextContents();
    console.log('🛠️ 개발 관련 텍스트:', devElements);
    
    // 9. 페이지 스크린샷 저장
    await page.screenshot({ path: 'deployment-test-screenshot.png', fullPage: true });
    console.log('📸 스크린샷 저장: deployment-test-screenshot.png');
    
    // 10. 네트워크 요청 분석
    console.log('🌐 네트워크 요청 샘플:');
    networkRequests.slice(0, 10).forEach(url => console.log(`  - ${url}`));
    
    // 11. 콘솔 로그 확인
    console.log('📋 콘솔 메시지:');
    logs.forEach(log => console.log(`  ${log}`));
    
    // 12. 환경변수 확인
    const envVars = await page.evaluate(() => {
      const viteEnvs = {};
      for (const key in window) {
        if (key.startsWith('VITE_') || key.includes('SUPABASE')) {
          viteEnvs[key] = window[key];
        }
      }
      return {
        href: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        viteEnvs: viteEnvs
      };
    });
    console.log('🔧 환경변수 정보:', JSON.stringify(envVars, null, 2));
    
    console.log('🎉 상세 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
testDeploymentDetailed().catch(console.error);