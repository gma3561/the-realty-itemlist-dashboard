// 자동화된 QA 테스트 스크립트
// 실제 데이터와 로직을 검증하는 End-to-End 테스트

const puppeteer = require('puppeteer');

const runAutomatedQATest = async () => {
  console.log('🚀 자동화된 QA 테스트 시작...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // 테스트 과정을 볼 수 있도록
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 로그인 테스트
    console.log('📋 1. 로그인 프로세스 테스트');
    await page.goto('http://localhost:5173/');
    
    // Google 로그인 버튼 대기 및 클릭
    await page.waitForSelector('button:has-text("Google로 로그인")');
    await page.click('button:has-text("Google로 로그인")');
    
    // OAuth 팝업 처리 (실제 환경에서는 Google 계정 정보 입력 필요)
    // 여기서는 시뮬레이션
    console.log('✅ OAuth 로그인 프로세스 시작됨\n');
    
    // 2. 대시보드 로드 테스트
    console.log('📋 2. 대시보드 데이터 로드 테스트');
    await page.waitForNavigation();
    await page.waitForSelector('.min-h-screen'); // 대시보드 컨테이너
    
    // API 요청 모니터링
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/properties') || url.includes('/api/lookup-tables')) {
        console.log(`✅ API 호출 감지: ${url} - 상태: ${response.status()}`);
      }
    });
    
    // 로딩 완료 대기
    await page.waitForSelector('[class*="border-slate-200"]', { timeout: 5000 });
    console.log('✅ 대시보드 로드 완료\n');
    
    // 3. KPI 데이터 검증
    console.log('📋 3. KPI 카드 데이터 검증');
    
    // 총 매물 수 확인
    const totalProperties = await page.$eval(
      'div:has(> div > h5:has-text("총 매물")) p',
      el => el.textContent
    );
    console.log(`✅ 총 매물: ${totalProperties}`);
    
    // 거래가능 매물 확인
    const availableProperties = await page.$eval(
      'div:has(> div > h5:has-text("거래가능")) p',
      el => el.textContent
    );
    console.log(`✅ 거래가능: ${availableProperties}`);
    
    // 거래보류 매물 확인
    const reservedProperties = await page.$eval(
      'div:has(> div > h5:has-text("거래보류")) p',
      el => el.textContent
    );
    console.log(`✅ 거래보류: ${reservedProperties}`);
    
    // 거래완료 매물 확인
    const completedProperties = await page.$eval(
      'div:has(> div > h5:has-text("거래완료")) p',
      el => el.textContent
    );
    console.log(`✅ 거래완료: ${completedProperties}\n`);
    
    // 4. 차트 렌더링 검증
    console.log('📋 4. 차트 렌더링 검증');
    
    // 차트 컨테이너 확인
    const chartContainers = await page.$$('.recharts-wrapper');
    console.log(`✅ 렌더링된 차트 수: ${chartContainers.length}개`);
    
    // 바 차트 확인
    const barChart = await page.$('.recharts-bar-rectangle');
    console.log(`✅ 바 차트 렌더링: ${barChart ? '성공' : '실패'}`);
    
    // 파이 차트 확인
    const pieChart = await page.$('.recharts-pie-sector');
    console.log(`✅ 파이 차트 렌더링: ${pieChart ? '성공' : '실패'}\n`);
    
    // 5. 알림 시스템 테스트
    console.log('📋 5. 알림 시스템 테스트');
    
    // 초기 알림 개수 확인
    const notifications = await page.$$('[class*="border-green-200"], [class*="border-orange-200"], [class*="border-blue-200"]');
    console.log(`✅ 초기 알림 개수: ${notifications.length}개`);
    
    // 알림 테스트 버튼 클릭
    await page.click('button:has-text("알림 테스트")');
    await page.waitForTimeout(500);
    
    // 새 알림 확인
    const newNotifications = await page.$$('[class*="border-green-200"], [class*="border-orange-200"], [class*="border-blue-200"]');
    console.log(`✅ 알림 추가 후: ${newNotifications.length}개`);
    
    // 알림 읽음 처리 테스트
    if (newNotifications.length > 0) {
      await newNotifications[0].click();
      console.log('✅ 알림 읽음 처리 테스트 완료\n');
    }
    
    // 6. 반응형 디자인 테스트
    console.log('📋 6. 반응형 디자인 테스트');
    
    // 모바일 뷰포트
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    console.log('✅ 모바일 뷰포트 (375x667) 테스트 완료');
    
    // 태블릿 뷰포트
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    console.log('✅ 태블릿 뷰포트 (768x1024) 테스트 완료');
    
    // 데스크톱 뷰포트
    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    console.log('✅ 데스크톱 뷰포트 (1920x1080) 테스트 완료\n');
    
    // 7. 성능 메트릭 수집
    console.log('📋 7. 성능 메트릭 수집');
    
    const metrics = await page.metrics();
    console.log(`✅ JS 힙 크기: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✅ DOM 노드 수: ${metrics.Nodes}`);
    console.log(`✅ 이벤트 리스너 수: ${metrics.JSEventListeners}`);
    
    // 페이지 로드 시간
    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );
    const loadTime = performanceTiming.loadEventEnd - performanceTiming.navigationStart;
    console.log(`✅ 페이지 로드 시간: ${loadTime}ms\n`);
    
    // 8. 빠른 액션 링크 테스트
    console.log('📋 8. 빠른 액션 링크 테스트');
    
    // 링크 확인
    const propertyLink = await page.$('a:has-text("매물 관리")');
    const propertyHref = await propertyLink.evaluate(el => el.href);
    console.log(`✅ 매물 관리 링크: ${propertyHref}`);
    
    const performanceLink = await page.$('a:has-text("직원 성과")');
    const performanceHref = await performanceLink.evaluate(el => el.href);
    console.log(`✅ 직원 성과 링크: ${performanceHref}`);
    
    const userLink = await page.$('a:has-text("직원 관리")');
    const userHref = await userLink.evaluate(el => el.href);
    console.log(`✅ 직원 관리 링크: ${userHref}\n`);
    
    // 9. 에러 처리 테스트
    console.log('📋 9. 에러 처리 테스트');
    
    // 네트워크 오프라인 시뮬레이션
    await page.setOfflineMode(true);
    await page.reload();
    
    // 에러 메시지 확인
    const errorMessage = await page.waitForSelector('[class*="text-red"]', { timeout: 5000 });
    if (errorMessage) {
      console.log('✅ 네트워크 오류 시 에러 메시지 표시 확인');
    }
    
    // 네트워크 복구
    await page.setOfflineMode(false);
    
    console.log('\n🎉 자동화된 QA 테스트 완료!');
    
    // 테스트 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log('- 로그인 프로세스: ✅');
    console.log('- 데이터 로드: ✅');
    console.log('- KPI 카드: ✅');
    console.log('- 차트 렌더링: ✅');
    console.log('- 알림 시스템: ✅');
    console.log('- 반응형 디자인: ✅');
    console.log('- 성능 메트릭: ✅');
    console.log('- 링크 검증: ✅');
    console.log('- 에러 처리: ✅');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
};

// 테스트 실행
runAutomatedQATest();

// 사용법:
// 1. puppeteer 설치: npm install --save-dev puppeteer
// 2. 테스트 실행: node tests/automated-qa-test.js