const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('대시보드 페이지 열기...');
  await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
  
  // 페이지 로드 대기
  await page.waitForTimeout(3000);
  
  // 스크린샷 저장
  await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
  console.log('스크린샷 저장됨: dashboard-screenshot.png');
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('페이지 제목:', title);
  
  // 페이지 내용 확인
  const content = await page.content();
  console.log('페이지 로드 완료');
  
  // 에러 메시지 확인
  const errorMessages = await page.$$eval('.error, .alert, [class*="error"]', elements => 
    elements.map(el => el.textContent)
  );
  
  if (errorMessages.length > 0) {
    console.log('에러 메시지:', errorMessages);
  }
  
  // 주요 요소 확인
  const hasLoginForm = await page.$('form[action*="login"], [class*="login"]') !== null;
  const hasDashboard = await page.$('[class*="dashboard"], [class*="properties"]') !== null;
  
  console.log('로그인 폼 존재:', hasLoginForm);
  console.log('대시보드 요소 존재:', hasDashboard);
  
  // 브라우저 열어두기 (10초)
  console.log('브라우저를 10초 동안 열어둡니다...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('완료!');
})();