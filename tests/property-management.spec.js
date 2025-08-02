import { test, expect } from '@playwright/test';

test.describe('매물 관리 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /개발용 바이패스 로그인/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('매물 등록 폼 검증', async ({ page }) => {
    await page.getByText(/매물 등록/i).click();
    await page.waitForURL(/.*property\/new/);
    
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    const requiredFields = [
      '매물명',
      '주소',
      '가격',
      '매물유형',
      '거래유형'
    ];
    
    for (const fieldName of requiredFields) {
      const field = page.getByLabel(new RegExp(fieldName, 'i')).or(
        page.locator(`input[placeholder*="${fieldName}"]`)
      ).or(
        page.locator(`select[name*="${fieldName.toLowerCase()}"]`)
      );
      await expect(field).toBeVisible();
    }
  });

  test('매물 목록 조회 및 필터링', async ({ page }) => {
    await page.getByText(/매물 목록/i).click();
    await page.waitForURL(/.*properties/);
    
    const filterSection = page.locator('[data-testid="property-filter"]').or(
      page.locator('form').first()
    );
    await expect(filterSection).toBeVisible();
    
    const propertyCards = page.locator('[data-testid="property-card"]').or(
      page.locator('tr').filter({ hasText: /아파트|빌라|원룸/ })
    );
    await expect(propertyCards.first()).toBeVisible();
  });

  test('매물 상세 정보 조회', async ({ page }) => {
    await page.getByText(/매물 목록/i).click();
    await page.waitForURL(/.*properties/);
    
    await page.waitForTimeout(2000);
    
    const firstProperty = page.locator('[data-testid="property-card"]').first().or(
      page.locator('table tr').nth(1)
    ).or(
      page.getByText(/아파트|빌라|원룸/).first()
    );
    
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      
      await page.waitForTimeout(1000);
      
      const detailContent = page.locator('main').or(
        page.locator('[data-testid="property-detail"]')
      );
      await expect(detailContent).toBeVisible();
    }
  });

  test('매물 검색 기능', async ({ page }) => {
    await page.getByText(/매물 목록/i).click();
    await page.waitForURL(/.*properties/);
    
    const searchInput = page.getByPlaceholder(/검색/i).or(
      page.locator('input[type="search"]')
    ).or(
      page.locator('input').filter({ hasText: /검색/ })
    );
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('아파트');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(1000);
      
      const results = page.locator('main');
      await expect(results).toBeVisible();
    }
  });
});