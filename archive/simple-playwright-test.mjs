import { chromium } from 'playwright';

console.log('🎭 Playwright MCP 데모 시작!');

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 2000 
});

const page = await browser.newPage();

console.log('📱 매물 관리 시스템 접속 중...');
await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');

console.log('📸 스크린샷 촬영...');
await page.screenshot({ path: 'app-demo.png', fullPage: true });

console.log('✅ 완료! app-demo.png 파일을 확인해보세요.');
console.log('⏱️  5초 후 브라우저가 닫힙니다...');

await page.waitForTimeout(5000);
await browser.close();