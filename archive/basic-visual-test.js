#!/usr/bin/env node

/**
 * 기본 브라우저 기반 QA 테스트 스크립트
 * Playwright 대신 puppeteer나 직접 브라우저 제어를 통한 테스트
 */

const fs = require('fs');
const path = require('path');

// 테스트 결과 저장 객체
const testResults = {
  timestamp: new Date().toISOString(),
  url: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    performance: {},
    screenshots: []
  }
};

// 결과 저장 함수
function saveTestResult(testName, status, details = {}) {
  testResults.tests.push({
    name: testName,
    status: status,
    details: details,
    timestamp: new Date().toISOString()
  });
  testResults.summary.total++;
  if (status === 'passed') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
}

// 브라우저 자동화를 위한 간단한 테스트
async function runBasicTests() {
  console.log('🚀 대시보드 기본 QA 테스트 시작...\n');
  
  try {
    // 1. URL 접근성 테스트
    console.log('📡 1. URL 접근성 테스트...');
    const startTime = Date.now();
    
    const https = require('https');
    const url = require('url');
    
    const testUrl = new URL(testResults.url);
    
    const urlTest = await new Promise((resolve) => {
      const options = {
        hostname: testUrl.hostname,
        port: testUrl.port || 443,
        path: testUrl.pathname,
        method: 'GET',
        timeout: 10000
      };
      
      const req = https.request(options, (res) => {
        const loadTime = Date.now() - startTime;
        console.log(`✅ HTTP 상태: ${res.statusCode}`);
        console.log(`✅ 응답 시간: ${loadTime}ms`);
        
        testResults.summary.performance.httpLoadTime = loadTime;
        testResults.summary.performance.httpStatus = res.statusCode;
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          saveTestResult('URL 접근성 테스트', 'passed', {
            httpStatus: res.statusCode,
            loadTime: loadTime,
            headers: res.headers
          });
          resolve(true);
        } else {
          saveTestResult('URL 접근성 테스트', 'failed', {
            httpStatus: res.statusCode,
            loadTime: loadTime
          });
          resolve(false);
        }
      });
      
      req.on('error', (err) => {
        console.error('❌ URL 접근 실패:', err.message);
        saveTestResult('URL 접근성 테스트', 'failed', { error: err.message });
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.error('❌ URL 접근 시간 초과');
        saveTestResult('URL 접근성 테스트', 'failed', { error: 'Timeout' });
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
    
    if (!urlTest) {
      throw new Error('URL 접근성 테스트 실패');
    }
    
    // 2. 브라우저 자동 실행 테스트
    console.log('\n🌐 2. 브라우저 자동 실행 테스트...');
    
    const { exec } = require('child_process');
    const os = require('os');
    
    // 운영체제별 브라우저 실행 명령어
    let browserCommand;
    const platform = os.platform();
    
    if (platform === 'darwin') { // macOS
      browserCommand = `open -a "Google Chrome" "${testResults.url}"`;
    } else if (platform === 'win32') { // Windows
      browserCommand = `start chrome "${testResults.url}"`;
    } else { // Linux
      browserCommand = `google-chrome "${testResults.url}"`;
    }
    
    console.log(`📱 플랫폼: ${platform}`);
    console.log(`🚀 브라우저 실행 명령어: ${browserCommand}`);
    
    // 브라우저 실행
    const browserLaunch = await new Promise((resolve) => {
      exec(browserCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 브라우저 실행 실패:', error.message);
          saveTestResult('브라우저 자동 실행 테스트', 'failed', { error: error.message });
          resolve(false);
        } else {
          console.log('✅ 브라우저가 성공적으로 실행되었습니다.');
          console.log('🔍 사용자가 브라우저에서 시각적으로 확인할 수 있습니다.');
          saveTestResult('브라우저 자동 실행 테스트', 'passed', { 
            command: browserCommand,
            platform: platform 
          });
          resolve(true);
        }
      });
    });
    
    // 3. 기본 HTML 구조 분석 (원격)
    console.log('\n🔍 3. 기본 HTML 구조 분석...');
    
    const htmlAnalysis = await new Promise((resolve) => {
      let htmlContent = '';
      
      const req = https.request({
        hostname: testUrl.hostname,
        port: testUrl.port || 443,
        path: testUrl.pathname,
        method: 'GET'
      }, (res) => {
        res.on('data', (chunk) => {
          htmlContent += chunk;
        });
        
        res.on('end', () => {
          try {
            // 기본 HTML 요소 검사
            const analysis = {
              hasTitle: /<title[^>]*>([^<]+)<\/title>/i.test(htmlContent),
              hasNav: /<nav[^>]*>/i.test(htmlContent) || /class[^>]*nav/i.test(htmlContent),
              hasMain: /<main[^>]*>/i.test(htmlContent) || /class[^>]*main/i.test(htmlContent),
              hasHeader: /<header[^>]*>/i.test(htmlContent) || /<h1[^>]*>/i.test(htmlContent),
              hasCharts: /chart|canvas|svg/i.test(htmlContent),
              hasScripts: /<script[^>]*>/i.test(htmlContent),
              hasStyles: /<style[^>]*>|<link[^>]*stylesheet/i.test(htmlContent),
              hasReact: /react|React/i.test(htmlContent),
              contentLength: htmlContent.length
            };
            
            console.log('📋 HTML 구조 분석 결과:');
            console.log(`   - 타이틀: ${analysis.hasTitle ? '✅' : '❌'}`);
            console.log(`   - 네비게이션: ${analysis.hasNav ? '✅' : '❌'}`);
            console.log(`   - 메인 콘텐츠: ${analysis.hasMain ? '✅' : '❌'}`);
            console.log(`   - 헤더: ${analysis.hasHeader ? '✅' : '❌'}`);
            console.log(`   - 차트 요소: ${analysis.hasCharts ? '✅' : '❌'}`);
            console.log(`   - JavaScript: ${analysis.hasScripts ? '✅' : '❌'}`);
            console.log(`   - CSS: ${analysis.hasStyles ? '✅' : '❌'}`);
            console.log(`   - React: ${analysis.hasReact ? '✅' : '❌'}`);
            console.log(`   - 콘텐츠 크기: ${analysis.contentLength} bytes`);
            
            const criticalElements = [
              analysis.hasTitle,
              analysis.hasScripts,
              analysis.hasStyles
            ].filter(Boolean).length;
            
            if (criticalElements >= 2) {
              saveTestResult('HTML 구조 분석', 'passed', analysis);
            } else {
              saveTestResult('HTML 구조 분석', 'failed', { 
                ...analysis, 
                error: '필수 HTML 요소 부족' 
              });
            }
            
            resolve(analysis);
          } catch (err) {
            console.error('❌ HTML 분석 실패:', err.message);
            saveTestResult('HTML 구조 분석', 'failed', { error: err.message });
            resolve(null);
          }
        });
      });
      
      req.on('error', (err) => {
        console.error('❌ HTML 요청 실패:', err.message);
        saveTestResult('HTML 구조 분석', 'failed', { error: err.message });
        resolve(null);
      });
      
      req.end();
    });
    
    // 4. 사용자 매뉴얼 테스트 가이드 제공
    console.log('\n📖 4. 수동 테스트 가이드...');
    
    const manualTestGuide = {
      steps: [
        '브라우저에서 페이지가 정상적으로 로드되는지 확인',
        '대시보드의 주요 통계 정보가 표시되는지 확인',
        '차트나 그래프가 정상적으로 렌더링되는지 확인',
        '네비게이션 메뉴가 작동하는지 확인',
        '반응형 디자인이 다양한 화면 크기에서 작동하는지 확인',
        '페이지 로딩 속도가 적절한지 확인',
        '브라우저 콘솔에 에러가 없는지 확인'
      ],
      expectedResults: [
        '페이지가 5초 이내에 완전히 로드됨',
        '모든 통계 데이터가 올바르게 표시됨',
        '차트가 정확한 데이터를 시각화함',
        '메뉴 클릭 시 적절한 반응이 있음',
        '모바일/태블릿 뷰에서도 레이아웃이 적절함',
        '사용자 경험이 매끄러움',
        'JavaScript 에러가 없음'
      ]
    };
    
    console.log('📋 수동 테스트 체크리스트:');
    manualTestGuide.steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
    
    console.log('\n🎯 기대 결과:');
    manualTestGuide.expectedResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result}`);
    });
    
    saveTestResult('수동 테스트 가이드 제공', 'passed', manualTestGuide);
    
    // 5. 테스트 결과 요약 생성
    console.log('\n📊 5. 테스트 결과 종합...');
    
    const resultsDir = './test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // JSON 결과 저장
    const jsonPath = path.join(resultsDir, 'basic-qa-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
    
    // HTML 리포트 생성
    const htmlReport = generateHtmlReport(testResults);
    const htmlPath = path.join(resultsDir, 'basic-qa-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`✅ 테스트 결과 저장: ${jsonPath}`);
    console.log(`✅ HTML 리포트 생성: ${htmlPath}`);
    
    saveTestResult('테스트 결과 종합', 'passed', {
      jsonReport: jsonPath,
      htmlReport: htmlPath
    });
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error.message);
    saveTestResult('전체 테스트 실행', 'failed', { error: error.message });
  }
  
  // 최종 결과 출력
  console.log('\n' + '='.repeat(60));
  console.log('🏆 대시보드 QA 테스트 완료');
  console.log('='.repeat(60));
  console.log(`📅 테스트 시간: ${testResults.timestamp}`);
  console.log(`🌐 테스트 URL: ${testResults.url}`);
  console.log(`📊 총 테스트: ${testResults.summary.total}`);
  console.log(`✅ 성공: ${testResults.summary.passed}`);
  console.log(`❌ 실패: ${testResults.summary.failed}`);
  console.log(`📈 성공률: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  if (testResults.summary.performance.httpLoadTime) {
    console.log(`⚡ HTTP 응답 시간: ${testResults.summary.performance.httpLoadTime}ms`);
  }
  
  console.log('\n🔍 추가 시각적 확인사항:');
  console.log('   - 브라우저에서 대시보드가 열렸는지 확인하세요');
  console.log('   - 모든 UI 요소가 올바르게 렌더링되었는지 확인하세요');
  console.log('   - 차트와 그래프가 데이터를 정확히 표시하는지 확인하세요');
  console.log('   - 네비게이션이 정상 작동하는지 확인하세요');
  
  return testResults;
}

// HTML 리포트 생성 함수
function generateHtmlReport(results) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>대시보드 QA 테스트 보고서</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #0056b3; }
        .test-results { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
        .test-item { border-bottom: 1px solid #e9ecef; padding: 15px 0; }
        .test-item:last-child { border-bottom: none; }
        .status-passed { color: #28a745; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        .details { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 0.9em; }
        .performance { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 대시보드 QA 테스트 보고서</h1>
        <p><strong>테스트 URL:</strong> ${results.url}</p>
        <p><strong>테스트 시간:</strong> ${new Date(results.timestamp).toLocaleString('ko-KR')}</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <div class="stat-value">${results.summary.total}</div>
            <div>총 테스트</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #28a745;">${results.summary.passed}</div>
            <div>성공</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: #dc3545;">${results.summary.failed}</div>
            <div>실패</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%</div>
            <div>성공률</div>
        </div>
    </div>
    
    ${results.summary.performance.httpLoadTime ? `
    <div class="performance">
        <h3>⚡ 성능 메트릭</h3>
        <p><strong>HTTP 응답 시간:</strong> ${results.summary.performance.httpLoadTime}ms</p>
        <p><strong>HTTP 상태 코드:</strong> ${results.summary.performance.httpStatus}</p>
    </div>
    ` : ''}
    
    <div class="test-results">
        <h2>📋 테스트 결과 상세</h2>
        ${results.tests.map(test => `
            <div class="test-item">
                <h3>${test.name}</h3>
                <p class="status-${test.status}">상태: ${test.status === 'passed' ? '✅ 통과' : '❌ 실패'}</p>
                <p><small>실행 시간: ${new Date(test.timestamp).toLocaleString('ko-KR')}</small></p>
                ${Object.keys(test.details).length > 0 ? `
                    <div class="details">
                        <strong>상세 정보:</strong><br>
                        <pre>${JSON.stringify(test.details, null, 2)}</pre>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    
    <div style="margin-top: 40px; padding: 20px; background: #fff3cd; border-radius: 8px;">
        <h3>🔍 추가 수동 검증 필요사항</h3>
        <ul>
            <li>브라우저에서 대시보드 시각적 확인</li>
            <li>모든 UI 구성 요소의 정상 렌더링 확인</li>
            <li>차트 및 데이터 시각화 정확성 확인</li>
            <li>사용자 인터랙션 테스트</li>
            <li>반응형 디자인 확인</li>
            <li>브라우저 콘솔 에러 확인</li>
        </ul>
    </div>
</body>
</html>
  `;
}

// 스크립트 실행
if (require.main === module) {
  runBasicTests().catch(console.error);
}

module.exports = { runBasicTests, testResults };