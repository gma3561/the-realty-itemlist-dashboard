import { test as base } from '@playwright/test';

/**
 * Custom fixture for authenticated tests
 * This fixture handles the bypass login for different user roles
 */
export const test = base.extend({
  // Admin authenticated page
  adminPage: async ({ page }, use) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Use bypass login via JavaScript evaluation
    await page.evaluate(() => {
      // Set bypass user in localStorage
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
    
    // Navigate to trigger auth check
    await page.goto('/');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    await use(page);
  },

  // Regular user authenticated page
  userPage: async ({ page }, use) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Use bypass login via JavaScript evaluation
    await page.evaluate(() => {
      // Set bypass user in localStorage
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
    
    // Navigate to trigger auth check
    await page.goto('/');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    await use(page);
  },

  // Manager authenticated page
  managerPage: async ({ page }, use) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Use bypass login via JavaScript evaluation
    await page.evaluate(() => {
      // Set bypass user in localStorage
      const managerUser = {
        id: 'qa-manager-001',
        email: 'qa-manager@test.local',
        name: 'QA 매니저',
        role: 'user',
        isAdmin: false,
        avatar_url: null,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        isQAUser: true,
        testUserType: 'manager'
      };
      
      localStorage.setItem('temp-bypass-user', JSON.stringify(managerUser));
    });
    
    // Navigate to trigger auth check
    await page.goto('/');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    
    await use(page);
  },
});

export { expect } from '@playwright/test';