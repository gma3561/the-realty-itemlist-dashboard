import { test, expect } from './fixtures/auth';

test.describe('Property Management Tests', () => {
  test('admin should see all properties', async ({ adminPage }) => {
    // Navigate to properties page
    await adminPage.goto('/properties');
    
    // Should see property list header
    await expect(adminPage.locator('h1')).toContainText('매물 목록');
    
    // Should have search and filter options
    await expect(adminPage.locator('[placeholder*="검색"]')).toBeVisible();
    await expect(adminPage.locator('select[name="propertyType"]')).toBeVisible();
    await expect(adminPage.locator('select[name="status"]')).toBeVisible();
    
    // Should see property cards or table
    const propertyItems = adminPage.locator('[data-testid="property-item"]');
    const itemCount = await propertyItems.count();
    
    // Should have at least some properties
    expect(itemCount).toBeGreaterThan(0);
  });

  test('should filter properties by type', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    
    // Select apartment type
    await adminPage.selectOption('select[name="propertyType"]', 'apartment');
    
    // Wait for filter to apply
    await adminPage.waitForTimeout(500);
    
    // All visible properties should be apartments
    const propertyTypes = await adminPage.locator('[data-testid="property-type"]').allTextContents();
    propertyTypes.forEach(type => {
      expect(type).toContain('아파트');
    });
  });

  test('should search properties', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    
    // Type in search box
    await adminPage.fill('[placeholder*="검색"]', '강남');
    
    // Wait for search results
    await adminPage.waitForTimeout(500);
    
    // Results should contain search term
    const propertyTitles = await adminPage.locator('[data-testid="property-title"]').allTextContents();
    propertyTitles.forEach(title => {
      expect(title.toLowerCase()).toContain('강남');
    });
  });

  test('should open property detail modal', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    
    // Click on first property card
    await adminPage.locator('[data-testid="property-item"]').first().click();
    
    // Modal should be visible
    await expect(adminPage.locator('[data-testid="property-detail-modal"]')).toBeVisible();
    
    // Should show property details
    await expect(adminPage.locator('[data-testid="property-detail-title"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="property-detail-price"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="property-detail-description"]')).toBeVisible();
    
    // Close modal
    await adminPage.locator('[data-testid="modal-close"]').click();
    await expect(adminPage.locator('[data-testid="property-detail-modal"]')).not.toBeVisible();
  });

  test('user should only see their properties', async ({ userPage }) => {
    await userPage.goto('/my-properties');
    
    // Should see my properties header
    await expect(userPage.locator('h1')).toContainText('내 매물');
    
    // All properties should belong to the user
    const propertyManagers = await userPage.locator('[data-testid="property-manager"]').allTextContents();
    propertyManagers.forEach(manager => {
      expect(manager).toContain('박소현');
    });
  });

  test('should add new property as admin', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    
    // Click add property button
    await adminPage.locator('button:has-text("매물 등록")').click();
    
    // Fill property form
    await adminPage.fill('input[name="title"]', 'E2E 테스트 아파트');
    await adminPage.selectOption('select[name="propertyType"]', 'apartment');
    await adminPage.fill('input[name="price"]', '50000');
    await adminPage.fill('textarea[name="description"]', 'Playwright E2E 테스트용 매물입니다.');
    await adminPage.fill('input[name="address"]', '서울시 강남구 테스트동 123');
    await adminPage.fill('input[name="area"]', '100');
    
    // Submit form
    await adminPage.locator('button[type="submit"]').click();
    
    // Should show success message
    await expect(adminPage.locator('[data-testid="success-message"]')).toBeVisible();
    
    // New property should appear in list
    await expect(adminPage.locator('text=E2E 테스트 아파트')).toBeVisible();
  });

  test('should edit property status', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    
    // Find first active property
    const firstProperty = adminPage.locator('[data-testid="property-item"]').first();
    
    // Click edit button
    await firstProperty.locator('[data-testid="edit-property"]').click();
    
    // Change status to sold
    await adminPage.selectOption('select[name="status"]', 'sold');
    
    // Save changes
    await adminPage.locator('button:has-text("저장")').click();
    
    // Should show success message
    await expect(adminPage.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Status should be updated
    await expect(firstProperty.locator('[data-testid="property-status"]')).toContainText('거래완료');
  });

  test('should handle property image upload', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    
    // Click add property button
    await adminPage.locator('button:has-text("매물 등록")').click();
    
    // Upload image
    const fileInput = adminPage.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-content')
    });
    
    // Should show image preview
    await expect(adminPage.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // Remove image
    await adminPage.locator('[data-testid="remove-image"]').click();
    
    // Preview should be gone
    await expect(adminPage.locator('[data-testid="image-preview"]')).not.toBeVisible();
  });
});