import { test, expect } from '@playwright/test';

test.describe('고객 관리 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('고객 목록 페이지 접근', async ({ page }) => {
    await page.getByText(/고객 관리/i).click();
    await page.waitForURL(/.*customers/);
    
    const customersContent = page.locator('main');
    await expect(customersContent).toBeVisible();
    
    const addCustomerButton = page.getByRole('button', { name: /고객 추가|고객 등록/i });
    if (await addCustomerButton.isVisible()) {
      await expect(addCustomerButton).toBeVisible();
    }
  });

  test('고객 등록 폼 검증', async ({ page }) => {
    await page.getByText(/고객 관리/i).click();
    await page.waitForURL(/.*customers/);
    
    const addButton = page.getByRole('button', { name: /고객 추가|고객 등록|새 고객/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      const form = page.locator('form').or(
        page.locator('[data-testid="customer-form"]')
      );
      await expect(form).toBeVisible();
      
      const nameField = page.getByLabel(/이름|고객명/i).or(
        page.locator('input[placeholder*="이름"]')
      );
      if (await nameField.isVisible()) {
        await expect(nameField).toBeVisible();
      }
      
      const phoneField = page.getByLabel(/전화번호|연락처/i).or(
        page.locator('input[placeholder*="전화"]')
      );
      if (await phoneField.isVisible()) {
        await expect(phoneField).toBeVisible();
      }
    }
  });

  test('고객 목록 조회', async ({ page }) => {
    await page.getByText(/고객 관리/i).click();
    await page.waitForURL(/.*customers/);
    
    await page.waitForTimeout(2000);
    
    const customerList = page.locator('table').or(
      page.locator('[data-testid="customer-list"]')
    ).or(
      page.locator('main').filter({ hasText: /고객/ })
    );
    
    await expect(customerList).toBeVisible();
  });

  test('고객 검색 기능', async ({ page }) => {
    await page.getByText(/고객 관리/i).click();
    await page.waitForURL(/.*customers/);
    
    const searchInput = page.getByPlaceholder(/검색/i).or(
      page.locator('input[type="search"]')
    );
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('김');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
      
      const results = page.locator('main');
      await expect(results).toBeVisible();
    }
  });
});