import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should show login UI elements
    await expect(page.locator('h2')).toContainText('더부동산 통합 관리 시스템');
    await expect(page.locator('text=구글 계정으로 로그인')).toBeVisible();
  });

  test('should login with bypass admin user', async ({ page }) => {
    await page.goto('/login');
    
    // Check if bypass is enabled
    const bypassEnabled = await page.evaluate(() => {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';
    });
    
    if (!bypassEnabled) {
      test.skip();
      return;
    }

    // Use bypass login via JavaScript
    await page.evaluate(() => {
      const adminUser = {
        id: 'qa-admin-user-001',
        email: 'Lucas@the-realty.co.kr',
        name: '하상현',
        role: 'admin',
        isAdmin: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        isQAUser: true,
        testUserType: 'admin'
      };
      
      localStorage.setItem('temp-bypass-user', JSON.stringify(adminUser));
    });
    
    // Navigate to dashboard
    await page.goto('/');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\//);
    
    // Should show user info
    await expect(page.locator('text=하상현')).toBeVisible();
  });

  test('should login with bypass regular user', async ({ page }) => {
    await page.goto('/login');
    
    // Check if bypass is enabled
    const bypassEnabled = await page.evaluate(() => {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';
    });
    
    if (!bypassEnabled) {
      test.skip();
      return;
    }

    // Use bypass login via JavaScript
    await page.evaluate(() => {
      const regularUser = {
        id: 'qa-user-001',
        email: 'sso@the-realty.co.kr',
        name: '박소현',
        role: 'user',
        isAdmin: false,
        avatar_url: null,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        isQAUser: true,
        testUserType: 'user'
      };
      
      localStorage.setItem('temp-bypass-user', JSON.stringify(regularUser));
    });
    
    // Navigate to dashboard
    await page.goto('/');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\//);
    
    // Should show user info
    await expect(page.locator('text=박소현')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login with bypass
    await page.goto('/login');
    
    const bypassEnabled = await page.evaluate(() => {
      return window.location.hostname === 'localhost' || 
             window.location.hostname === '127.0.0.1';
    });
    
    if (!bypassEnabled) {
      test.skip();
      return;
    }

    // Login as admin
    await page.evaluate(() => {
      const adminUser = {
        id: 'qa-admin-user-001',
        email: 'Lucas@the-realty.co.kr',
        name: '하상현',
        role: 'admin',
        isAdmin: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        isQAUser: true,
        testUserType: 'admin'
      };
      
      localStorage.setItem('temp-bypass-user', JSON.stringify(adminUser));
    });
    
    await page.goto('/');
    
    // Find and click logout button
    await page.locator('button:has-text("로그아웃")').click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // localStorage should be cleared
    const bypassUser = await page.evaluate(() => {
      return localStorage.getItem('temp-bypass-user');
    });
    expect(bypassUser).toBeNull();
  });
});