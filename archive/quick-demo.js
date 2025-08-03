// npx로 Playwright 실행하는 간단한 데모
const { spawn } = require('child_process');

console.log('🎭 MCP Playwright 시각적 데모 시작!');
console.log('📱 더부동산 매물 관리 시스템 테스트');
console.log('=' .repeat(50));

// npx playwright를 사용해서 직접 실행
const script = `
const { chromium } = require('playwright');

(async () => {
  console.log('🚀 브라우저 실행 중...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 3000,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('📱 더부동산 사이트 접속...');
  await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
  
  console.log('📸 스크린샷 촬영...');
  await page.screenshot({ path: 'demo-screenshot.png', fullPage: true });
  
  console.log('⏱️ 15초 동안 브라우저 확인 가능...');
  await page.waitForTimeout(15000);
  
  console.log('✅ 테스트 완료!');
  await browser.close();
})();
`;

const fs = require('fs');
fs.writeFileSync('temp-playwright-script.js', script);

const child = spawn('npx', ['playwright-core', 'test', 'temp-playwright-script.js'], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`\n🎯 프로세스 종료 코드: ${code}`);
  
  // 임시 파일 정리
  try {
    fs.unlinkSync('temp-playwright-script.js');
  } catch (e) {
    // 파일이 없어도 괜찮음
  }
});

child.on('error', (error) => {
  console.error('❌ 실행 오류:', error.message);
  
  // 대체 방법: 기본 브라우저에서 사이트 열기
  console.log('🔄 대체 방법: 기본 브라우저에서 사이트 열기...');
  const { exec } = require('child_process');
  exec('open https://gma3561.github.io/the-realty-itemlist-dashboard/', (err) => {
    if (err) {
      console.log('수동으로 다음 URL을 방문하세요:');
      console.log('🔗 https://gma3561.github.io/the-realty-itemlist-dashboard/');
      console.log('👤 테스트 계정: jenny@the-realty.co.kr / admin123!');
    } else {
      console.log('✅ 브라우저에서 사이트가 열렸습니다!');
      console.log('👤 테스트 계정: jenny@the-realty.co.kr / admin123!');
    }
  });
});