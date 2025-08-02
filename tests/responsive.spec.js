import { test, expect } from '@playwright/test';

test.describe('반응형 디자인 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('모바일 뷰 - 로그인 페이지', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loginButton = page.getByRole('button', { name: /로그인/i });
    await expect(loginButton).toBeVisible();
    
    const bypassButton = page.getByRole('button', { name: /개발용 바이패스 로그인/i });
    await expect(bypassButton).toBeVisible();
  });

  test('태블릿 뷰 - 대시보드', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toBeVisible();
    
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('데스크톱 뷰 - 매물 목록', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    await page.getByText(/매물 목록/i).click();
    await page.waitForURL(/.*properties/);
    
    const propertyList = page.locator('main');
    await expect(propertyList).toBeVisible();
    
    const sidebar = page.locator('aside, nav').first();
    await expect(sidebar).toBeVisible();
  });

  test('모바일 뷰 - 네비게이션 메뉴', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    const mobileMenuButton = page.getByRole('button', { name: /메뉴/i }).or(
      page.locator('button').filter({ hasText: /☰|≡/ })
    );
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      
      const mobileMenu = page.locator('nav').or(
        page.locator('[data-testid="mobile-menu"]')
      );
      await expect(mobileMenu).toBeVisible();
    }
  });
});