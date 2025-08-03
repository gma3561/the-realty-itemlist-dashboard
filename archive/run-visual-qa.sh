#!/bin/bash

echo "🎭 MCP Playwright 시각적 QA 시작!"
echo "브라우저에서 자동화된 테스트가 진행됩니다."
echo ""

# Playwright 스크립트 실행
cat << 'EOF' | npx -y playwright@latest test --headed --reporter=list --timeout=60000 -
import { test, expect } from '@playwright/test';

test('더부동산 매물 관리 시스템 시각적 QA', async ({ page }) => {
  // 느린 속도로 진행 (시각적 확인 가능)
  test.setTimeout(60000);
  
  console.log('📍 1단계: 홈페이지 접속');
  await page.goto('https://gma3561.github.io/the-realty-itemlist-dashboard/');
  await page.waitForTimeout(3000);
  
  console.log('📍 2단계: 로그인 시도');
  await page.fill('input[type="email"]', 'jenny@the-realty.co.kr');
  await page.waitForTimeout(1000);
  await page.fill('input[type="password"]', 'admin123!');
  await page.waitForTimeout(1000);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('📍 3단계: 대시보드 확인');
  await expect(page.locator('h1')).toContainText('대시보드');
  await page.waitForTimeout(2000);
  
  console.log('📍 4단계: 매물 관리 페이지 이동');
  await page.click('text=매물');
  await page.waitForTimeout(2000);
  
  console.log('📍 5단계: 매물 검색 테스트');
  const searchInput = page.locator('input[placeholder*="검색"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('아파트');
    await page.waitForTimeout(2000);
  }
  
  console.log('✅ 시각적 QA 완료!');
});
EOF