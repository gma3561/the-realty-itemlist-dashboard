import { test, expect } from './fixtures/auth';

test.describe('Dashboard Tests', () => {
  test('admin should see all dashboard sections', async ({ adminPage }) => {
    // Check main dashboard elements
    await expect(adminPage.locator('h1')).toContainText('대시보드');
    
    // Admin should see statistics cards
    await expect(adminPage.locator('text=총 매물 수')).toBeVisible();
    await expect(adminPage.locator('text=활성 매물')).toBeVisible();
    await expect(adminPage.locator('text=이번 달 등록')).toBeVisible();
    await expect(adminPage.locator('text=전체 직원 수')).toBeVisible();
    
    // Admin should see charts
    await expect(adminPage.locator('[data-testid="property-trend-chart"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="property-type-chart"]')).toBeVisible();
  });

  test('regular user should see limited dashboard', async ({ userPage }) => {
    // Check main dashboard elements
    await expect(userPage.locator('h1')).toContainText('대시보드');
    
    // User should see their own statistics
    await expect(userPage.locator('text=내 매물 수')).toBeVisible();
    await expect(userPage.locator('text=활성 매물')).toBeVisible();
    
    // User should not see admin-only sections
    await expect(userPage.locator('text=전체 직원 수')).not.toBeVisible();
  });

  test('should navigate to property list', async ({ adminPage }) => {
    // Click on property list menu
    await adminPage.locator('a:has-text("매물 목록")').click();
    
    // Should be on property list page
    await expect(adminPage).toHaveURL(/\/properties/);
    await expect(adminPage.locator('h1')).toContainText('매물 목록');
    
    // Should show property table or list
    await expect(adminPage.locator('[data-testid="property-list"]')).toBeVisible();
  });

  test('should navigate to my properties', async ({ userPage }) => {
    // Click on my properties menu
    await userPage.locator('a:has-text("내 매물")').click();
    
    // Should be on my properties page
    await expect(userPage).toHaveURL(/\/my-properties/);
    await expect(userPage.locator('h1')).toContainText('내 매물');
  });

  test('should show recent activities', async ({ adminPage }) => {
    // Check if recent activities section exists
    const activitiesSection = adminPage.locator('[data-testid="recent-activities"]');
    
    if (await activitiesSection.isVisible()) {
      // Should show activity items
      await expect(activitiesSection.locator('.activity-item')).toHaveCount(5);
    }
  });

  test('should handle responsive menu on mobile', async ({ adminPage }) => {
    // Set viewport to mobile size
    await adminPage.setViewportSize({ width: 375, height: 667 });
    
    // Mobile menu button should be visible
    const menuButton = adminPage.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();
    
    // Click menu button
    await menuButton.click();
    
    // Mobile menu should be visible
    await expect(adminPage.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Click a menu item
    await adminPage.locator('[data-testid="mobile-menu"] a:has-text("매물 목록")').click();
    
    // Should navigate and close menu
    await expect(adminPage).toHaveURL(/\/properties/);
    await expect(adminPage.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
  });
});