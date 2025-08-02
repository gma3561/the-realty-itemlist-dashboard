import { test, expect } from '@playwright/test';

test.describe('성능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지 로딩 성능 - 홈페이지', async ({ page }) => {
    const startTime = Date.now();
    
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`홈페이지 로딩 시간: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('페이지 로딩 성능 - 대시보드', async ({ page }) => {
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    
    const startTime = Date.now();
    await page.waitForURL(/.*dashboard/);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`대시보드 로딩 시간: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
    
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('페이지 로딩 성능 - 매물 목록', async ({ page }) => {
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    const startTime = Date.now();
    await page.getByText(/매물 목록/i).click();
    await page.waitForURL(/.*properties/);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`매물 목록 로딩 시간: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(4000);
  });

  test('네트워크 요청 최적화 확인', async ({ page }) => {
    const requests = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.waitForLoadState('networkidle');
    
    console.log(`총 네트워크 요청 수: ${requests.length}`);
    
    const duplicateRequests = requests.filter((item, index) => requests.indexOf(item) !== index);
    console.log(`중복 요청 수: ${duplicateRequests.length}`);
    
    expect(duplicateRequests.length).toBeLessThan(5);
  });

  test('메모리 사용량 모니터링', async ({ page }) => {
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    const metrics = await page.evaluate(() => {
      return {
        heapUsed: performance.memory?.usedJSHeapSize || 0,
        heapTotal: performance.memory?.totalJSHeapSize || 0,
        heapLimit: performance.memory?.jsHeapSizeLimit || 0
      };
    });
    
    console.log('메모리 사용량:', metrics);
    
    if (metrics.heapUsed > 0) {
      expect(metrics.heapUsed).toBeLessThan(50 * 1024 * 1024);
    }
  });
});