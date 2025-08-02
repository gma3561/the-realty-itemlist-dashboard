import { test, expect } from '@playwright/test';

test.describe('인증 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('로그인 페이지 접근 및 UI 확인', async ({ page }) => {
    await expect(page).toHaveTitle(/매물장 관리/);
    
    const loginButton = page.getByRole('button', { name: /로그인/i });
    await expect(loginButton).toBeVisible();
    
    const googleLoginButton = page.getByRole('button', { name: /Google/i });
    await expect(googleLoginButton).toBeVisible();
  });

  test('바이패스 로그인 버튼 확인', async ({ page }) => {
    const bypassButton = page.getByRole('button', { name: /개발용 바이패스 로그인/i });
    await expect(bypassButton).toBeVisible();
    
    await bypassButton.click();
    
    await expect(page.url()).toMatch(/dashboard/);
  });

  test('로그인 후 대시보드 접근', async ({ page }) => {
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const sidebar = page.locator('aside, nav');
    await expect(sidebar).toBeVisible();
  });
});