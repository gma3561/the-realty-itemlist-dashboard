import { test, expect } from '@playwright/test';

test.describe('매물 관리 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 관리자로 로그인
    await page.goto('/login');
    await page.click('button:has-text("관리자로 로그인 (모든 권한)")');
    await expect(page).toHaveURL('/');
  });

  test('매물 목록 페이지 접근 및 기본 UI', async ({ page }) => {
    await page.goto('/properties');
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('매물 목록');
    
    // 매물 등록 버튼 확인
    await expect(page.locator('a[href="/properties/new"]')).toBeVisible();
    
    // 검색 바 확인
    await expect(page.locator('input[placeholder*="검색"]')).toBeVisible();
    
    // 필터 옵션 확인
    await expect(page.locator('[data-testid="filter-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-type"]')).toBeVisible();
  });

  test('매물 등록 폼 접근 및 유효성 검사', async ({ page }) => {
    await page.goto('/properties/new');
    
    // 폼 제목 확인
    await expect(page.locator('h1')).toContainText('매물 등록');
    
    // 필수 필드들 확인
    const requiredFields = [
      'input[name="name"]',           // 매물명
      'input[name="address"]',        // 주소
      'select[name="property_type_id"]', // 매물 유형
      'select[name="transaction_type_id"]', // 거래 유형
      'input[name="price"]'           // 가격
    ];
    
    for (const field of requiredFields) {
      await expect(page.locator(field)).toBeVisible();
    }
    
    // 빈 폼 제출 시 유효성 검사 확인
    await page.click('button[type="submit"]');
    
    // 에러 메시지 표시 확인 (HTML5 validation 또는 커스텀 validation)
    const hasValidationErrors = await page.evaluate(() => {
      const form = document.querySelector('form');
      return !form.checkValidity();
    });
    
    expect(hasValidationErrors).toBeTruthy();
  });

  test('매물 등록 완전한 플로우', async ({ page }) => {
    await page.goto('/properties/new');
    
    // 매물 정보 입력
    await page.fill('input[name="name"]', '테스트 아파트');
    await page.fill('input[name="address"]', '서울시 강남구 테스트동 123');
    await page.fill('input[name="dong"]', '101');
    await page.fill('input[name="ho"]', '1001');
    
    // 드롭다운 선택
    await page.selectOption('select[name="property_type_id"]', { index: 1 });
    await page.selectOption('select[name="transaction_type_id"]', { index: 1 });
    
    // 가격 정보
    await page.fill('input[name="price"]', '500000000');
    await page.fill('input[name="area_supply"]', '84.5');
    await page.fill('input[name="area_exclusive"]', '75.2');
    
    // 층 정보
    await page.fill('input[name="floor_current"]', '10');
    await page.fill('input[name="floor_total"]', '15');
    
    // 방 정보
    await page.fill('input[name="rooms"]', '3');
    await page.fill('input[name="bathrooms"]', '2');
    
    // 소유주 정보
    await page.fill('input[name="owner"]', '김소유');
    await page.fill('input[name="owner_contact"]', '010-1234-5678');
    await page.selectOption('select[name="contact_relation"]', '직접');
    
    // 폼 제출
    await page.click('button[type="submit"]');
    
    // 성공 시 목록 페이지로 리디렉션 또는 성공 메시지 확인
    await page.waitForURL(/\/properties.*/, { timeout: 5000 });
    
    // 등록된 매물이 목록에 나타나는지 확인
    await expect(page.locator('text=테스트 아파트')).toBeVisible();
  });

  test('매물 검색 기능', async ({ page }) => {
    await page.goto('/properties');
    
    // 검색어 입력
    const searchInput = page.locator('input[placeholder*="검색"]');
    await searchInput.fill('강남구');
    await searchInput.press('Enter');
    
    // 검색 결과 확인 (로딩 후)
    await page.waitForTimeout(1000);
    
    // 검색 결과에 검색어가 포함된 매물만 표시되는지 확인
    const propertyCards = page.locator('[data-testid="property-card"]');
    const count = await propertyCards.count();
    
    if (count > 0) {
      // 첫 번째 결과에 검색어 포함 확인
      const firstCard = propertyCards.first();
      await expect(firstCard).toContainText('강남구');
    }
  });

  test('매물 필터링 기능', async ({ page }) => {
    await page.goto('/properties');
    
    // 상태 필터 적용
    await page.selectOption('[data-testid="filter-status"]', 'available');
    
    // 필터 적용 버튼 클릭 (있는 경우)
    const applyButton = page.locator('button:has-text("적용")');
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // 필터된 결과 확인
    const propertyCards = page.locator('[data-testid="property-card"]');
    const count = await propertyCards.count();
    
    // 최소한 필터가 적용되었는지 확인 (URL 파라미터 등)
    const url = page.url();
    expect(url).toContain('available');
  });

  test('매물 상세 정보 조회', async ({ page }) => {
    await page.goto('/properties');
    
    // 첫 번째 매물 카드 클릭
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      
      // 상세 페이지로 이동 확인
      await expect(page).toHaveURL(/\/properties\/\d+/);
      
      // 상세 정보 요소들 확인
      await expect(page.locator('[data-testid="property-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="property-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="property-details"]')).toBeVisible();
      
      // 관리자는 연락처 정보 볼 수 있음
      await expect(page.locator('[data-testid="contact-info"]')).toBeVisible();
      
      // 수정 버튼 확인 (관리자)
      await expect(page.locator('a:has-text("수정")')).toBeVisible();
    }
  });

  test('매물 수정 기능', async ({ page }) => {
    await page.goto('/properties');
    
    // 첫 번째 매물의 상세 페이지로 이동
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      
      // 수정 버튼 클릭
      await page.click('a:has-text("수정")');
      
      // 수정 폼 페이지 확인
      await expect(page).toHaveURL(/\/properties\/\d+\/edit/);
      await expect(page.locator('h1')).toContainText('매물 수정');
      
      // 기존 데이터가 폼에 로드되었는지 확인
      const nameInput = page.locator('input[name="name"]');
      const nameValue = await nameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
      
      // 매물명 수정
      await nameInput.fill('수정된 매물명');
      
      // 저장
      await page.click('button[type="submit"]');
      
      // 상세 페이지로 리디렉션 확인
      await page.waitForURL(/\/properties\/\d+$/, { timeout: 5000 });
      
      // 수정된 내용 확인
      await expect(page.locator('text=수정된 매물명')).toBeVisible();
    }
  });

  test('권한 기반 연락처 정보 표시', async ({ page }) => {
    // 먼저 일반사용자로 로그아웃 후 재로그인
    await page.goto('/login');
    await page.click('button:has-text("로그아웃")');
    await page.click('button:has-text("일반사용자로 로그인 (제한된 권한)")');
    
    await page.goto('/properties');
    
    // 첫 번째 매물 상세 페이지 접근
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    
    if (await firstProperty.isVisible()) {
      await firstProperty.click();
      
      // 일반사용자는 연락처 정보에 제한이 있어야 함
      const contactInfo = page.locator('[data-testid="contact-info"]');
      
      // 권한 없음 메시지 또는 숨겨진 연락처 확인
      const hasPermissionDenied = await page.locator('text=권한 없음').isVisible();
      const hasHiddenContact = await page.locator('text=***-****-****').isVisible();
      
      expect(hasPermissionDenied || hasHiddenContact).toBeTruthy();
    }
  });

  test('이미지 업로드 기능', async ({ page }) => {
    await page.goto('/properties/new');
    
    // 이미지 업로드 섹션 확인
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // 파일 선택 (테스트용 이미지)
    // 실제 파일이 있다면 업로드 테스트 가능
    // await fileInput.setInputFiles('./tests/fixtures/test-image.jpg');
    
    // 이미지 프리뷰 기능 확인
    // await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
  });

  test('매물 목록 페이지네이션', async ({ page }) => {
    await page.goto('/properties');
    
    // 페이지네이션 요소 확인
    const pagination = page.locator('[data-testid="pagination"]');
    
    if (await pagination.isVisible()) {
      // 다음 페이지 버튼 확인
      const nextButton = page.locator('button:has-text("다음")');
      
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        
        // URL 파라미터 변경 확인
        await expect(page).toHaveURL(/page=2/);
        
        // 새로운 매물 목록 로드 확인
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="property-card"]').first()).toBeVisible();
      }
    }
  });
});