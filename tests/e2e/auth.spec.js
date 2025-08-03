import { test, expect } from '@playwright/test';

test.describe('인증 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 쿠키와 로컬스토리지 클리어
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('로그인 페이지 접근 및 UI 확인', async ({ page }) => {
    // 로그인 페이지로 리디렉션 확인
    await expect(page).toHaveURL(/.*\/login/);
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/팀 매물장/);
    
    // 시스템 이름 표시 확인
    await expect(page.locator('h2')).toContainText('더부동산 통합 관리 시스템');
    
    // Google 로그인 버튼 확인
    const googleButton = page.locator('button:has-text("Google로 로그인")');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    
    // 개발자 전용 버튼들 확인 (QA 모드)
    const adminBypassButton = page.locator('button:has-text("관리자로 로그인")');
    const userBypassButton = page.locator('button:has-text("일반사용자로 로그인")');
    
    await expect(adminBypassButton).toBeVisible();
    await expect(userBypassButton).toBeVisible();
    
    // 안내사항 확인
    await expect(page.locator('text=Google 계정으로만 로그인이 가능합니다')).toBeVisible();
  });

  test('바이패스 로그인 - 관리자 권한', async ({ page }) => {
    await page.goto('/login');
    
    // 관리자 바이패스 로그인
    await page.click('button:has-text("관리자로 로그인 (모든 권한)")');
    
    // 대시보드로 리디렉션 확인
    await expect(page).toHaveURL('/');
    
    // 사용자 정보 확인
    const userInfo = page.locator('[data-testid="user-info"]').first();
    await expect(userInfo).toContainText('관리자');
    
    // 관리자 메뉴 접근 가능 확인
    await expect(page.locator('a[href="/users"]')).toBeVisible(); // 사용자 관리
    await expect(page.locator('a[href="/performance"]')).toBeVisible(); // 성과 관리
  });

  test('바이패스 로그인 - 일반사용자 권한', async ({ page }) => {
    await page.goto('/login');
    
    // 일반사용자 바이패스 로그인
    await page.click('button:has-text("일반사용자로 로그인 (제한된 권한)")');
    
    // 대시보드로 리디렉션 확인
    await expect(page).toHaveURL('/');
    
    // 사용자 정보 확인
    const userInfo = page.locator('[data-testid="user-info"]').first();
    await expect(userInfo).toContainText('사용자');
    
    // 일반사용자는 관리자 메뉴 미표시 확인
    await expect(page.locator('a[href="/users"]')).not.toBeVisible();
  });

  test('로그인 후 대시보드 접근', async ({ page }) => {
    // 바이패스 로그인
    await page.goto('/login');
    await page.click('button:has-text("관리자로 로그인")');
    
    // 대시보드 주요 요소 확인
    await expect(page.locator('h1')).toContainText('대시보드');
    
    // 통계 카드들 확인
    await expect(page.locator('[data-testid="stats-card"]').first()).toBeVisible();
    
    // 사이드바 네비게이션 확인
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('a[href="/properties"]')).toBeVisible();
    await expect(page.locator('a[href="/my-properties"]')).toBeVisible();
  });

  test('로그아웃 기능', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.click('button:has-text("관리자로 로그인")');
    await expect(page).toHaveURL('/');
    
    // 로그아웃 버튼 클릭
    const logoutButton = page.locator('button:has-text("로그아웃")');
    await logoutButton.click();
    
    // 로그인 페이지로 리디렉션 확인
    await expect(page).toHaveURL(/.*\/login/);
    
    // 로컬스토리지에서 사용자 정보 제거 확인
    const bypassUser = await page.evaluate(() => 
      localStorage.getItem('temp-bypass-user')
    );
    expect(bypassUser).toBeNull();
  });

  test('미인증 사용자 보호된 페이지 접근 차단', async ({ page }) => {
    // 직접 보호된 페이지 접근 시도
    await page.goto('/properties');
    
    // 로그인 페이지로 리디렉션 확인
    await expect(page).toHaveURL(/.*\/login/);
    
    // 다른 보호된 페이지들도 테스트
    const protectedPaths = ['/users', '/performance', '/settings'];
    
    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/.*\/login/);
    }
  });

  test('세션 유지 확인', async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.click('button:has-text("관리자로 로그인")');
    
    // 페이지 새로고침
    await page.reload();
    
    // 여전히 로그인 상태 확인
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
  });

  test('권한 기반 UI 렌더링', async ({ page }) => {
    // 일반사용자로 로그인
    await page.goto('/login');
    await page.click('button:has-text("일반사용자로 로그인")');
    
    // 매물 목록 페이지 이동
    await page.goto('/properties');
    
    // 일반사용자는 다른 사용자의 연락처 정보 볼 수 없음
    const propertyCards = page.locator('[data-testid="property-card"]');
    const firstCard = propertyCards.first();
    
    if (await firstCard.isVisible()) {
      // 권한 없음 메시지 확인
      await expect(firstCard.locator('text=권한 없음')).toBeVisible();
    }
  });
});