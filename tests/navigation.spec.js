import { test, expect } from '@playwright/test';

test.describe('내비게이션 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('사이드바 메뉴 항목 확인', async ({ page }) => {
    const sidebar = page.locator('aside, nav').first();
    
    await expect(sidebar.getByText(/대시보드/i)).toBeVisible();
    await expect(sidebar.getByText(/매물 목록/i)).toBeVisible();
    await expect(sidebar.getByText(/매물 등록/i)).toBeVisible();
    await expect(sidebar.getByText(/내 매물/i)).toBeVisible();
    await expect(sidebar.getByText(/고객 관리/i)).toBeVisible();
  });

  test('매물 목록 페이지 이동', async ({ page }) => {
    await page.getByText(/매물 목록/i).click();
    await expect(page).toHaveURL(/.*properties/);
    
    const propertyTable = page.locator('table, [data-testid="property-list"]');
    await expect(propertyTable).toBeVisible();
  });

  test('매물 등록 페이지 이동', async ({ page }) => {
    await page.getByText(/매물 등록/i).click();
    await expect(page).toHaveURL(/.*property\/new/);
    
    const propertyForm = page.locator('form');
    await expect(propertyForm).toBeVisible();
  });

  test('고객 관리 페이지 이동', async ({ page }) => {
    await page.getByText(/고객 관리/i).click();
    await expect(page).toHaveURL(/.*customers/);
    
    const customersContent = page.locator('main');
    await expect(customersContent).toBeVisible();
  });
});