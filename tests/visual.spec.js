import { test, expect } from '@playwright/test';

test.describe('시각적 회귀 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('로그인 페이지 스크린샷', async ({ page }) => {
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('대시보드 페이지 스크린샷', async ({ page }) => {
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('매물 목록 페이지 스크린샷', async ({ page }) => {
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    await page.getByText(/매물 목록/i).click();
    await page.waitForURL(/.*properties/);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('property-list-page.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('매물 등록 페이지 스크린샷', async ({ page }) => {
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    await page.getByText(/매물 등록/i).click();
    await page.waitForURL(/.*property\/new/);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('property-form-page.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('모바일 뷰 스크린샷', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page).toHaveScreenshot('mobile-login-page.png', {
      fullPage: true,
      threshold: 0.3
    });
    
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('mobile-dashboard-page.png', {
      fullPage: true,
      threshold: 0.3
    });
  });
});