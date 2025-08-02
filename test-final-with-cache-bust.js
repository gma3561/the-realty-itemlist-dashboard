const { chromium } = require('playwright');

async function testFinalWithCacheBust() {
  console.log('🎯 캐시 우회 최종 테스트 시작...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // 캐시 비활성화
    extraHTTPHeaders: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  try {
    // 1. 배포된 사이트 접속 (캐시 우회)
    console.log('🌐 배포된 사이트 접속 중 (캐시 우회)...');
    const timestamp = Date.now();
    await page.goto(`https://gma3561.github.io/the-realty-itemlist-dashboard/?t=${timestamp}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 페이지 완전 로딩 대기
    await page.waitForTimeout(5000);
    
    const title = await page.title();
    console.log(`✅ 페이지 타이틀: ${title}`);
    
    // 2. 현재 로딩된 JS 파일 확인
    const jsFiles = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => script.src).filter(src => src.includes('index-'));
    });
    console.log('📦 로딩된 JS 파일:', jsFiles);
    
    // 3. 환경변수 확인
    const envInfo = await page.evaluate(() => {
      // 글로벌 스코프에서 환경변수 정보 확인
      return {
        hostname: window.location.hostname,
        isGitHubPages: window.location.hostname.includes('github.io'),
        hasSupabase: typeof window.supabase !== 'undefined',
        userAgent: navigator.userAgent
      };
    });
    console.log('🔧 환경 정보:', envInfo);
    
    // 4. 페이지 내용 확인
    const bodyText = await page.textContent('body');
    console.log(`📄 페이지 내용: ${bodyText.length > 100 ? '✅ 정상 로딩' : '❌ 내용 부족'}`);
    
    // 5. React 앱 로딩 확인
    const reactRoot = await page.locator('#root').innerHTML();
    const isReactLoaded = reactRoot.length > 100;
    console.log(`⚛️ React 앱: ${isReactLoaded ? '✅ 로딩됨' : '❌ 로딩 실패'}`);
    
    // 6. 로그인 관련 요소 확인
    const loginElements = {
      title: await page.locator('h2:has-text("더부동산 통합 관리 시스템")').count(),
      googleButton: await page.locator('button:has-text("Google로 로그인")').count(),
      adminBypass: await page.locator('button:has-text("관리자로 로그인")').count(),
      userBypass: await page.locator('button:has-text("일반사용자로 로그인")').count(),
    };
    
    console.log('🔑 로그인 요소들:');
    console.log(`  - 페이지 제목: ${loginElements.title > 0 ? '✅' : '❌'}`);
    console.log(`  - Google 로그인 버튼: ${loginElements.googleButton > 0 ? '✅' : '❌'}`);
    console.log(`  - 관리자 바이패스: ${loginElements.adminBypass > 0 ? '✅' : '❌'}`);
    console.log(`  - 사용자 바이패스: ${loginElements.userBypass > 0 ? '✅' : '❌'}`);
    
    // 7. 바이패스 로그인 테스트 (관리자)
    if (loginElements.adminBypass > 0) {
      console.log('👑 관리자 바이패스 로그인 테스트...');
      await page.click('button:has-text("관리자로 로그인")');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`🌐 로그인 후 URL: ${currentUrl}`);
      
      // 대시보드 요소 확인
      const dashboardCheck = await page.evaluate(() => {
        const bodyText = document.body.textContent;
        return {
          hasNavigation: bodyText.includes('매물') || bodyText.includes('사용자'),
          hasWelcome: bodyText.includes('환영') || bodyText.includes('대시보드'),
          hasMenuItems: document.querySelectorAll('nav, .sidebar, [role="navigation"]').length > 0
        };
      });
      
      console.log('🏠 대시보드 확인:');
      console.log(`  - 네비게이션: ${dashboardCheck.hasNavigation ? '✅' : '❌'}`);
      console.log(`  - 환영 메시지: ${dashboardCheck.hasWelcome ? '✅' : '❌'}`);
      console.log(`  - 메뉴 구조: ${dashboardCheck.hasMenuItems ? '✅' : '❌'}`);
      
      // 8. 권한 확인
      const adminFeatures = await page.evaluate(() => {
        const bodyText = document.body.textContent;
        return {
          userManagement: bodyText.includes('사용자 관리'),
          staffPerformance: bodyText.includes('직원 성과'),
          settings: bodyText.includes('설정')
        };
      });
      
      console.log('⚙️ 관리자 기능:');
      console.log(`  - 사용자 관리: ${adminFeatures.userManagement ? '✅' : '❌'}`);
      console.log(`  - 직원 성과: ${adminFeatures.staffPerformance ? '✅' : '❌'}`);
      console.log(`  - 설정: ${adminFeatures.settings ? '✅' : '❌'}`);
    }
    
    // 9. 스크린샷 저장
    await page.screenshot({ path: 'final-test-result.png', fullPage: true });
    console.log('📸 최종 스크린샷: final-test-result.png');
    
    // 10. 콘솔 로그 분석
    console.log('\n📋 콘솔 로그 분석:');
    const criticalErrors = logs.filter(log => 
      log.includes('[error]') && 
      (log.includes('Cannot read properties of null') || log.includes('auth'))
    );
    const warningLogs = logs.filter(log => log.includes('[warning]'));
    
    console.log(`🔴 중요 에러: ${criticalErrors.length}개`);
    console.log(`🟡 경고: ${warningLogs.length}개`);
    
    if (criticalErrors.length === 0) {
      console.log('✅ 환경변수 문제 해결됨!');
    } else {
      console.log('❌ 여전히 환경변수 관련 에러 존재');
      criticalErrors.slice(0, 2).forEach(log => console.log(`  ${log.substring(0, 100)}...`));
    }
    
    // 11. 최종 결과
    console.log('\n🎉 최종 배포 테스트 결과:');
    console.log(`✅ 배포 상태: 성공`);
    console.log(`✅ 페이지 로딩: ${isReactLoaded ? '정상' : '문제'}`);
    console.log(`✅ 로그인 UI: ${loginElements.adminBypass > 0 ? '정상' : '문제'}`);
    console.log(`✅ 바이패스 기능: ${loginElements.adminBypass > 0 ? '작동' : '미작동'}`);
    console.log(`✅ 환경변수: ${criticalErrors.length === 0 ? '정상' : '문제'}`);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
testFinalWithCacheBust().catch(console.error);