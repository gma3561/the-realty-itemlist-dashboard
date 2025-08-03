import { test, expect } from '@playwright/test';

test.describe('반응형 디자인 테스트', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test.describe(`${name} 뷰포트 (${width}x${height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/login');
        await page.click('button:has-text("관리자로 로그인 (모든 권한)")');
      });

      test(`${name} - 대시보드 레이아웃`, async ({ page }) => {
        await page.goto('/');
        
        if (width <= 768) {
          // 모바일: 햄버거 메뉴 확인
          await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
          
          // 사이드바가 숨겨져 있는지 확인
          const sidebar = page.locator('[data-testid="sidebar"]');
          const isHidden = await sidebar.evaluate(el => 
            window.getComputedStyle(el).transform.includes('translateX(-100%)')
          );
          expect(isHidden).toBeTruthy();
          
          // 햄버거 메뉴 클릭 시 사이드바 표시
          await page.click('[data-testid="mobile-menu-button"]');
          await expect(sidebar).toHaveClass(/open/);
          
        } else {
          // 데스크톱/태블릿: 사이드바 항상 표시
          await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
          
          // 햄버거 메뉴 버튼 숨김
          await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();
        }
        
        // 메인 콘텐츠 영역 확인
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        // 통계 카드들이 적절히 배치되는지 확인
        const statsCards = page.locator('[data-testid="stats-card"]');
        const cardCount = await statsCards.count();
        
        if (cardCount > 0) {
          // 카드들이 화면에 맞게 배치되는지 확인
          for (let i = 0; i < Math.min(cardCount, 3); i++) {
            await expect(statsCards.nth(i)).toBeVisible();
          }
        }
      });

      test(`${name} - 매물 목록 레이아웃`, async ({ page }) => {
        await page.goto('/properties');
        
        // 페이지 제목 확인
        await expect(page.locator('h1')).toContainText('매물 목록');
        
        if (width <= 768) {
          // 모바일: 세로 카드 레이아웃
          const propertyCards = page.locator('[data-testid="property-card"]');
          const firstCard = propertyCards.first();
          
          if (await firstCard.isVisible()) {
            const cardWidth = await firstCard.evaluate(el => el.offsetWidth);
            const viewportWidth = width - 32; // 패딩 고려
            
            // 카드가 거의 전체 너비를 차지하는지 확인 (90% 이상)
            expect(cardWidth / viewportWidth).toBeGreaterThan(0.9);
          }
          
        } else {
          // 데스크톱/태블릿: 그리드 레이아웃
          const propertyCards = page.locator('[data-testid="property-card"]');
          const cardCount = await propertyCards.count();
          
          if (cardCount >= 2) {
            const firstCard = propertyCards.first();
            const secondCard = propertyCards.nth(1);
            
            const firstCardRect = await firstCard.boundingBox();
            const secondCardRect = await secondCard.boundingBox();
            
            if (firstCardRect && secondCardRect) {
              // 두 카드가 같은 행에 있는지 확인 (y 좌표 유사)
              const yDiff = Math.abs(firstCardRect.y - secondCardRect.y);
              expect(yDiff).toBeLessThan(50);
            }
          }
        }
        
        // 검색바가 적절한 크기로 표시되는지 확인
        const searchInput = page.locator('input[placeholder*="검색"]');
        await expect(searchInput).toBeVisible();
        
        const searchWidth = await searchInput.evaluate(el => el.offsetWidth);
        expect(searchWidth).toBeGreaterThan(200);
      });

      test(`${name} - 매물 등록 폼`, async ({ page }) => {
        await page.goto('/properties/new');
        
        // 폼 제목 확인
        await expect(page.locator('h1')).toContainText('매물 등록');
        
        // 입력 필드들이 적절한 크기로 표시되는지 확인
        const formInputs = page.locator('input, select, textarea');
        const inputCount = await formInputs.count();
        
        for (let i = 0; i < Math.min(inputCount, 5); i++) {
          const input = formInputs.nth(i);
          await expect(input).toBeVisible();
          
          const inputWidth = await input.evaluate(el => el.offsetWidth);
          
          if (width <= 768) {
            // 모바일: 입력 필드가 거의 전체 너비
            expect(inputWidth).toBeGreaterThan(width * 0.8);
          } else {
            // 데스크톱: 적절한 너비
            expect(inputWidth).toBeGreaterThan(200);
          }
        }
        
        // 버튼이 적절한 크기인지 확인
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
        
        const buttonRect = await submitButton.boundingBox();
        if (buttonRect) {
          // 최소 터치 영역 44px 확인
          expect(buttonRect.height).toBeGreaterThanOrEqual(44);
        }
      });

      test(`${name} - 네비게이션 메뉴`, async ({ page }) => {
        await page.goto('/');
        
        if (width <= 768) {
          // 모바일: 드로어 네비게이션
          
          // 햄버거 메뉴 클릭
          await page.click('[data-testid="mobile-menu-button"]');
          
          // 네비게이션 메뉴 항목들 확인
          const navItems = [
            'a[href="/"]',
            'a[href="/properties"]',
            'a[href="/my-properties"]'
          ];
          
          for (const item of navItems) {
            await expect(page.locator(item)).toBeVisible();
            
            // 메뉴 항목이 충분한 터치 영역을 가지는지 확인
            const itemRect = await page.locator(item).boundingBox();
            if (itemRect) {
              expect(itemRect.height).toBeGreaterThanOrEqual(44);
            }
          }
          
          // 오버레이 클릭으로 메뉴 닫기
          await page.click('[data-testid="sidebar-overlay"]');
          
          // 메뉴가 닫혔는지 확인
          await expect(page.locator('[data-testid="sidebar"]')).not.toHaveClass(/open/);
          
        } else {
          // 데스크톱: 사이드바 네비게이션
          const sidebar = page.locator('[data-testid="sidebar"]');
          await expect(sidebar).toBeVisible();
          
          // 네비게이션 항목들이 보이는지 확인
          await expect(page.locator('a[href="/"]')).toBeVisible();
          await expect(page.locator('a[href="/properties"]')).toBeVisible();
        }
      });

      test(`${name} - 타이포그래피 및 간격`, async ({ page }) => {
        await page.goto('/');
        
        // 제목의 폰트 크기 확인
        const heading = page.locator('h1').first();
        
        if (await heading.isVisible()) {
          const fontSize = await heading.evaluate(el => 
            window.getComputedStyle(el).fontSize
          );
          
          const fontSizeNum = parseInt(fontSize);
          
          if (width <= 768) {
            // 모바일: 작은 폰트 크기
            expect(fontSizeNum).toBeLessThanOrEqual(32);
          } else {
            // 데스크톱: 큰 폰트 크기
            expect(fontSizeNum).toBeGreaterThanOrEqual(24);
          }
        }
        
        // 버튼의 패딩과 크기 확인
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          const button = buttons.first();
          const buttonRect = await button.boundingBox();
          
          if (buttonRect) {
            // 모든 뷰포트에서 최소 터치 영역
            expect(buttonRect.height).toBeGreaterThanOrEqual(40);
            expect(buttonRect.width).toBeGreaterThanOrEqual(60);
          }
        }
      });

      test(`${name} - 이미지 및 미디어`, async ({ page }) => {
        await page.goto('/properties');
        
        // 매물 이미지가 적절히 표시되는지 확인
        const propertyImages = page.locator('[data-testid="property-image"]');
        const imageCount = await propertyImages.count();
        
        if (imageCount > 0) {
          const image = propertyImages.first();
          await expect(image).toBeVisible();
          
          const imageRect = await image.boundingBox();
          
          if (imageRect) {
            // 이미지가 컨테이너에 맞게 조정되는지 확인
            expect(imageRect.width).toBeGreaterThan(0);
            expect(imageRect.height).toBeGreaterThan(0);
            
            // 종횡비가 적절한지 확인
            const aspectRatio = imageRect.width / imageRect.height;
            expect(aspectRatio).toBeGreaterThan(0.5);
            expect(aspectRatio).toBeLessThan(3);
          }
        }
      });
    });
  });

  test('브라우저 크기 변경 시 동적 적응', async ({ page }) => {
    // 데스크톱으로 시작
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');
    await page.click('button:has-text("관리자로 로그인")');
    await page.goto('/');
    
    // 사이드바가 보이는지 확인
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();
    
    // 모바일 크기로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 햄버거 메뉴가 나타나는지 확인
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // 다시 데스크톱 크기로 변경
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 사이드바가 다시 보이는지 확인
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();
  });
});