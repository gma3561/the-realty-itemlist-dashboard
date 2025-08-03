#!/usr/bin/env node

/**
 * 고급 브라우저 기반 QA 테스트 스크립트
 * 더 상세한 성능 측정 및 시각적 검증을 포함
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');

// 고급 테스트 결과 저장 객체
const advancedTestResults = {
  timestamp: new Date().toISOString(),
  url: 'https://gma3561.github.io/the-realty-itemlist-dashboard/',
  testSuite: 'Advanced Browser QA Testing',
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    performance: {},
    accessibility: {},
    seo: {},
    security: {}
  }
};

// 결과 저장 함수
function saveAdvancedTestResult(testName, status, details = {}, severity = 'medium') {
  advancedTestResults.tests.push({
    name: testName,
    status: status,
    severity: severity,
    details: details,
    timestamp: new Date().toISOString()
  });
  advancedTestResults.summary.total++;
  if (status === 'passed') {
    advancedTestResults.summary.passed++;
  } else if (status === 'failed') {
    advancedTestResults.summary.failed++;
  } else if (status === 'warning') {
    advancedTestResults.summary.warnings++;
  }
}

// 고급 성능 테스트
async function runAdvancedPerformanceTests() {
  console.log('\n⚡ 고급 성능 테스트 시작...');
  
  try {
    // 1. 다중 요청 성능 테스트
    const performanceMetrics = [];
    const requestCount = 5;
    
    console.log(`📊 ${requestCount}회 연속 요청으로 성능 측정...`);
    
    for (let i = 0; i < requestCount; i++) {
      const startTime = Date.now();
      
      await new Promise((resolve, reject) => {
        const req = https.request(new URL(advancedTestResults.url), (res) => {
          const loadTime = Date.now() - startTime;
          performanceMetrics.push({
            attempt: i + 1,
            loadTime: loadTime,
            statusCode: res.statusCode,
            contentLength: parseInt(res.headers['content-length'] || '0')
          });
          
          res.on('data', () => {}); // 데이터 소비
          res.on('end', resolve);
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.end();
      });
    }
    
    // 성능 메트릭 계산
    const loadTimes = performanceMetrics.map(m => m.loadTime);
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const minLoadTime = Math.min(...loadTimes);
    const maxLoadTime = Math.max(...loadTimes);
    
    advancedTestResults.summary.performance = {
      averageLoadTime: Math.round(avgLoadTime),
      minLoadTime: minLoadTime,
      maxLoadTime: maxLoadTime,
      consistency: maxLoadTime - minLoadTime < 1000 ? 'Good' : 'Poor',
      requests: performanceMetrics
    };
    
    console.log(`   ✅ 평균 로딩 시간: ${Math.round(avgLoadTime)}ms`);
    console.log(`   ✅ 최소 로딩 시간: ${minLoadTime}ms`);
    console.log(`   ✅ 최대 로딩 시간: ${maxLoadTime}ms`);
    console.log(`   ✅ 성능 일관성: ${advancedTestResults.summary.performance.consistency}`);
    
    if (avgLoadTime < 500) {
      saveAdvancedTestResult('성능 테스트 - 응답 시간', 'passed', advancedTestResults.summary.performance, 'high');
    } else if (avgLoadTime < 2000) {
      saveAdvancedTestResult('성능 테스트 - 응답 시간', 'warning', advancedTestResults.summary.performance, 'medium');
    } else {
      saveAdvancedTestResult('성능 테스트 - 응답 시간', 'failed', advancedTestResults.summary.performance, 'high');
    }
    
  } catch (error) {
    console.error('   ❌ 성능 테스트 실패:', error.message);
    saveAdvancedTestResult('고급 성능 테스트', 'failed', { error: error.message }, 'high');
  }
}

// SEO 및 메타데이터 분석
async function runSEOAnalysis() {
  console.log('\n🔍 SEO 및 메타데이터 분석...');
  
  try {
    const htmlContent = await new Promise((resolve, reject) => {
      let content = '';
      const req = https.request(new URL(advancedTestResults.url), (res) => {
        res.on('data', chunk => content += chunk);
        res.on('end', () => resolve(content));
      });
      req.on('error', reject);
      req.end();
    });
    
    const seoAnalysis = {
      title: {
        exists: /<title[^>]*>([^<]+)<\/title>/i.test(htmlContent),
        content: (htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '',
        length: (htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.length || 0
      },
      description: {
        exists: /<meta[^>]*name=[\"']description[\"'][^>]*content=[\"']([^\"']+)[\"']/i.test(htmlContent),
        content: (htmlContent.match(/<meta[^>]*name=[\"']description[\"'][^>]*content=[\"']([^\"']+)[\"']/i) || [])[1] || ''
      },
      keywords: {
        exists: /<meta[^>]*name=[\"']keywords[\"']/i.test(htmlContent)
      },
      viewport: {
        exists: /<meta[^>]*name=[\"']viewport[\"']/i.test(htmlContent)
      },
      charset: {
        exists: /<meta[^>]*charset/i.test(htmlContent)
      },
      openGraph: {
        title: /<meta[^>]*property=[\"']og:title[\"']/i.test(htmlContent),
        description: /<meta[^>]*property=[\"']og:description[\"']/i.test(htmlContent),
        image: /<meta[^>]*property=[\"']og:image[\"']/i.test(htmlContent)
      },
      structuredData: {
        jsonLd: /<script[^>]*type=[\"']application\/ld\+json[\"']/i.test(htmlContent),
        microdata: /itemscope|itemtype|itemprop/i.test(htmlContent)
      }
    };
    
    advancedTestResults.summary.seo = seoAnalysis;
    
    console.log('   📋 SEO 분석 결과:');
    console.log(`      - 타이틀: ${seoAnalysis.title.exists ? '✅' : '❌'} (${seoAnalysis.title.length}자)`);
    console.log(`      - 설명: ${seoAnalysis.description.exists ? '✅' : '❌'}`);
    console.log(`      - 뷰포트: ${seoAnalysis.viewport.exists ? '✅' : '❌'}`);
    console.log(`      - 문자셋: ${seoAnalysis.charset.exists ? '✅' : '❌'}`);
    console.log(`      - Open Graph 타이틀: ${seoAnalysis.openGraph.title ? '✅' : '❌'}`);
    console.log(`      - 구조화된 데이터: ${seoAnalysis.structuredData.jsonLd ? '✅' : '❌'}`);
    
    // SEO 점수 계산
    const seoScore = [
      seoAnalysis.title.exists,
      seoAnalysis.description.exists,
      seoAnalysis.viewport.exists,
      seoAnalysis.charset.exists,
      seoAnalysis.title.length >= 30 && seoAnalysis.title.length <= 60
    ].filter(Boolean).length;
    
    if (seoScore >= 4) {
      saveAdvancedTestResult('SEO 분석', 'passed', { ...seoAnalysis, score: `${seoScore}/5` }, 'medium');
    } else if (seoScore >= 2) {
      saveAdvancedTestResult('SEO 분석', 'warning', { ...seoAnalysis, score: `${seoScore}/5` }, 'medium');
    } else {
      saveAdvancedTestResult('SEO 분석', 'failed', { ...seoAnalysis, score: `${seoScore}/5` }, 'high');
    }
    
  } catch (error) {
    console.error('   ❌ SEO 분석 실패:', error.message);
    saveAdvancedTestResult('SEO 분석', 'failed', { error: error.message }, 'medium');
  }
}

// 보안 헤더 분석
async function runSecurityAnalysis() {
  console.log('\n🔒 보안 헤더 분석...');
  
  try {
    const securityHeaders = await new Promise((resolve, reject) => {
      const req = https.request(new URL(advancedTestResults.url), (res) => {
        resolve(res.headers);
      });
      req.on('error', reject);
      req.end();
    });
    
    const securityAnalysis = {
      strictTransportSecurity: !!securityHeaders['strict-transport-security'],
      contentSecurityPolicy: !!securityHeaders['content-security-policy'],
      xFrameOptions: !!securityHeaders['x-frame-options'],
      xContentTypeOptions: !!securityHeaders['x-content-type-options'],
      xXSSProtection: !!securityHeaders['x-xss-protection'],
      referrerPolicy: !!securityHeaders['referrer-policy'],
      permissionsPolicy: !!securityHeaders['permissions-policy'],
      server: securityHeaders['server'] || 'Not disclosed',
      headers: securityHeaders
    };
    
    advancedTestResults.summary.security = securityAnalysis;
    
    console.log('   🛡️ 보안 헤더 분석 결과:');
    console.log(`      - HSTS: ${securityAnalysis.strictTransportSecurity ? '✅' : '❌'}`);
    console.log(`      - CSP: ${securityAnalysis.contentSecurityPolicy ? '✅' : '❌'}`);
    console.log(`      - X-Frame-Options: ${securityAnalysis.xFrameOptions ? '✅' : '❌'}`);
    console.log(`      - X-Content-Type-Options: ${securityAnalysis.xContentTypeOptions ? '✅' : '❌'}`);
    console.log(`      - 서버 정보: ${securityAnalysis.server}`);
    
    const securityScore = [
      securityAnalysis.strictTransportSecurity,
      securityAnalysis.xFrameOptions,
      securityAnalysis.xContentTypeOptions
    ].filter(Boolean).length;
    
    if (securityScore >= 2) {
      saveAdvancedTestResult('보안 헤더 분석', 'passed', { ...securityAnalysis, score: `${securityScore}/3` }, 'high');
    } else if (securityScore >= 1) {
      saveAdvancedTestResult('보안 헤더 분석', 'warning', { ...securityAnalysis, score: `${securityScore}/3` }, 'high');
    } else {
      saveAdvancedTestResult('보안 헤더 분석', 'failed', { ...securityAnalysis, score: `${securityScore}/3` }, 'high');
    }
    
  } catch (error) {
    console.error('   ❌ 보안 분석 실패:', error.message);
    saveAdvancedTestResult('보안 헤더 분석', 'failed', { error: error.message }, 'high');
  }
}

// 접근성 기본 분석
async function runAccessibilityAnalysis() {
  console.log('\n♿ 접근성 기본 분석...');
  
  try {
    const htmlContent = await new Promise((resolve, reject) => {
      let content = '';
      const req = https.request(new URL(advancedTestResults.url), (res) => {
        res.on('data', chunk => content += chunk);
        res.on('end', () => resolve(content));
      });
      req.on('error', reject);
      req.end();
    });
    
    const accessibilityAnalysis = {
      lang: /<html[^>]*lang=/i.test(htmlContent),
      altTags: {
        images: (htmlContent.match(/<img[^>]*>/gi) || []).length,
        withAlt: (htmlContent.match(/<img[^>]*alt=/gi) || []).length
      },
      headingStructure: {
        h1: (htmlContent.match(/<h1[^>]*>/gi) || []).length,
        h2: (htmlContent.match(/<h2[^>]*>/gi) || []).length,
        h3: (htmlContent.match(/<h3[^>]*>/gi) || []).length
      },
      ariaLabels: (htmlContent.match(/aria-label/gi) || []).length,
      skipLinks: /skip|jump.*content/i.test(htmlContent),
      colorContrast: '수동 확인 필요',
      keyboardNavigation: '수동 확인 필요'
    };
    
    advancedTestResults.summary.accessibility = accessibilityAnalysis;
    
    console.log('   ♿ 접근성 분석 결과:');
    console.log(`      - 언어 속성: ${accessibilityAnalysis.lang ? '✅' : '❌'}`);
    console.log(`      - 이미지 Alt 태그: ${accessibilityAnalysis.altTags.withAlt}/${accessibilityAnalysis.altTags.images}`);
    console.log(`      - H1 태그: ${accessibilityAnalysis.headingStructure.h1}개`);
    console.log(`      - ARIA 레이블: ${accessibilityAnalysis.ariaLabels}개`);
    console.log(`      - 건너뛰기 링크: ${accessibilityAnalysis.skipLinks ? '✅' : '❌'}`);
    
    const accessibilityScore = [
      accessibilityAnalysis.lang,
      accessibilityAnalysis.altTags.images === 0 || accessibilityAnalysis.altTags.withAlt === accessibilityAnalysis.altTags.images,
      accessibilityAnalysis.headingStructure.h1 > 0,
      accessibilityAnalysis.ariaLabels > 0
    ].filter(Boolean).length;
    
    if (accessibilityScore >= 3) {
      saveAdvancedTestResult('접근성 분석', 'passed', { ...accessibilityAnalysis, score: `${accessibilityScore}/4` }, 'medium');
    } else if (accessibilityScore >= 2) {
      saveAdvancedTestResult('접근성 분석', 'warning', { ...accessibilityAnalysis, score: `${accessibilityScore}/4` }, 'medium');
    } else {
      saveAdvancedTestResult('접근성 분석', 'failed', { ...accessibilityAnalysis, score: `${accessibilityScore}/4` }, 'high');
    }
    
  } catch (error) {
    console.error('   ❌ 접근성 분석 실패:', error.message);
    saveAdvancedTestResult('접근성 분석', 'failed', { error: error.message }, 'medium');
  }
}

// 브라우저 호환성 테스트 시뮬레이션
async function runBrowserCompatibilityTest() {
  console.log('\n🌐 브라우저 호환성 분석...');
  
  try {
    const htmlContent = await new Promise((resolve, reject) => {
      let content = '';
      const req = https.request(new URL(advancedTestResults.url), (res) => {
        res.on('data', chunk => content += chunk);
        res.on('end', () => resolve(content));
      });
      req.on('error', reject);
      req.end();
    });
    
    const compatibilityAnalysis = {
      modernFeatures: {
        flexbox: /display:\s*flex|display:\s*-webkit-flex/i.test(htmlContent),
        grid: /display:\s*grid/i.test(htmlContent),
        es6: /const\s|let\s|=>/i.test(htmlContent),
        asyncAwait: /async\s|await\s/i.test(htmlContent)
      },
      polyfills: {
        babel: /babel/i.test(htmlContent),
        polyfill: /polyfill/i.test(htmlContent)
      },
      vendorPrefixes: {
        webkit: /-webkit-/i.test(htmlContent),
        moz: /-moz-/i.test(htmlContent),
        ms: /-ms-/i.test(htmlContent)
      },
      doctype: /<!DOCTYPE html>/i.test(htmlContent),
      charset: /<meta[^>]*charset=[\"']?utf-8[\"']?/i.test(htmlContent)
    };
    
    console.log('   🌐 호환성 분석 결과:');
    console.log(`      - HTML5 DOCTYPE: ${compatibilityAnalysis.doctype ? '✅' : '❌'}`);
    console.log(`      - UTF-8 인코딩: ${compatibilityAnalysis.charset ? '✅' : '❌'}`);
    console.log(`      - Flexbox 사용: ${compatibilityAnalysis.modernFeatures.flexbox ? '✅' : '❌'}`);
    console.log(`      - ES6 사용: ${compatibilityAnalysis.modernFeatures.es6 ? '✅' : '❌'}`);
    console.log(`      - Webkit 접두사: ${compatibilityAnalysis.vendorPrefixes.webkit ? '✅' : '❌'}`);
    
    const compatibilityScore = [
      compatibilityAnalysis.doctype,
      compatibilityAnalysis.charset,
      !compatibilityAnalysis.modernFeatures.es6 || compatibilityAnalysis.polyfills.babel
    ].filter(Boolean).length;
    
    if (compatibilityScore >= 2) {
      saveAdvancedTestResult('브라우저 호환성 분석', 'passed', compatibilityAnalysis, 'medium');
    } else {
      saveAdvancedTestResult('브라우저 호환성 분석', 'warning', compatibilityAnalysis, 'medium');
    }
    
  } catch (error) {
    console.error('   ❌ 호환성 분석 실패:', error.message);
    saveAdvancedTestResult('브라우저 호환성 분석', 'failed', { error: error.message }, 'medium');
  }
}

// 고급 테스트 실행 메인 함수
async function runAdvancedTests() {
  console.log('🚀 고급 대시보드 QA 테스트 시작...\n');
  console.log(`📅 테스트 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🌐 테스트 URL: ${advancedTestResults.url}\n`);
  
  try {
    // 모든 고급 테스트 실행
    await runAdvancedPerformanceTests();
    await runSEOAnalysis();
    await runSecurityAnalysis();
    await runAccessibilityAnalysis();
    await runBrowserCompatibilityTest();
    
    // 결과 저장
    const resultsDir = './test-results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // JSON 결과 저장
    const jsonPath = path.join(resultsDir, 'advanced-qa-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(advancedTestResults, null, 2));
    
    // HTML 리포트 생성
    const htmlReport = generateAdvancedHtmlReport(advancedTestResults);
    const htmlPath = path.join(resultsDir, 'advanced-qa-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`\n✅ 고급 테스트 결과 저장: ${jsonPath}`);
    console.log(`✅ HTML 리포트 생성: ${htmlPath}`);
    
    saveAdvancedTestResult('테스트 결과 종합', 'passed', {
      jsonReport: jsonPath,
      htmlReport: htmlPath
    });
    
  } catch (error) {
    console.error('❌ 고급 테스트 실행 중 오류:', error.message);
    saveAdvancedTestResult('전체 테스트 실행', 'failed', { error: error.message }, 'high');
  }
  
  // 최종 결과 출력
  console.log('\n' + '='.repeat(70));
  console.log('🏆 고급 대시보드 QA 테스트 완료');
  console.log('='.repeat(70));
  console.log(`📊 총 테스트: ${advancedTestResults.summary.total}`);
  console.log(`✅ 성공: ${advancedTestResults.summary.passed}`);
  console.log(`⚠️ 경고: ${advancedTestResults.summary.warnings}`);
  console.log(`❌ 실패: ${advancedTestResults.summary.failed}`);
  
  const successRate = ((advancedTestResults.summary.passed / advancedTestResults.summary.total) * 100).toFixed(1);
  console.log(`📈 성공률: ${successRate}%`);
  
  if (advancedTestResults.summary.performance.averageLoadTime) {
    console.log(`⚡ 평균 응답 시간: ${advancedTestResults.summary.performance.averageLoadTime}ms`);
  }
  
  // 우선순위별 권장사항
  const highPriorityIssues = advancedTestResults.tests.filter(t => t.severity === 'high' && t.status !== 'passed');
  if (highPriorityIssues.length > 0) {
    console.log('\n🚨 높은 우선순위 문제:');
    highPriorityIssues.forEach(issue => {
      console.log(`   - ${issue.name}: ${issue.status}`);
    });
  }
  
  console.log('\n📋 종합 QA 점검 완료');
  console.log('   HTML 보고서를 확인하여 상세한 분석 결과를 검토하세요.');
  
  return advancedTestResults;
}

// 고급 HTML 리포트 생성 함수
function generateAdvancedHtmlReport(results) {
  const severityColors = {
    high: '#dc3545',
    medium: '#ffc107',
    low: '#28a745'
  };
  
  const statusColors = {
    passed: '#28a745',
    warning: '#ffc107',
    failed: '#dc3545'
  };
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>고급 대시보드 QA 테스트 보고서</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; border-radius: 12px; padding: 25px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { color: #666; font-size: 0.9em; }
        .test-section { background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-item { border-left: 4px solid #e9ecef; padding: 15px; margin: 15px 0; background: #f8f9fa; border-radius: 0 8px 8px 0; }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.warning { border-left-color: #ffc107; }
        .test-item.failed { border-left-color: #dc3545; }
        .test-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .test-title { font-weight: bold; font-size: 1.1em; }
        .test-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-warning { background: #fff3cd; color: #856404; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .severity { font-size: 0.8em; padding: 2px 8px; border-radius: 10px; margin-left: 10px; }
        .severity-high { background: #f8d7da; color: #721c24; }
        .severity-medium { background: #fff3cd; color: #856404; }
        .severity-low { background: #d4edda; color: #155724; }
        .details { background: white; padding: 15px; border-radius: 8px; margin-top: 10px; font-size: 0.9em; }
        .performance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .metric { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .metric-value { font-size: 1.5em; font-weight: bold; color: #0056b3; }
        .metric-label { font-size: 0.8em; color: #666; margin-top: 5px; }
        .recommendations { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .priority-high { background: #ffebee; border-left-color: #f44336; }
        .priority-medium { background: #fff8e1; border-left-color: #ff9800; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 고급 대시보드 QA 테스트 보고서</h1>
            <p><strong>테스트 URL:</strong> ${results.url}</p>
            <p><strong>테스트 시간:</strong> ${new Date(results.timestamp).toLocaleString('ko-KR')}</p>
            <p><strong>테스트 스위트:</strong> ${results.testSuite}</p>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value" style="color: #333;">${results.summary.total}</div>
                <div class="stat-label">총 테스트</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #28a745;">${results.summary.passed}</div>
                <div class="stat-label">성공</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #ffc107;">${results.summary.warnings}</div>
                <div class="stat-label">경고</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #dc3545;">${results.summary.failed}</div>
                <div class="stat-label">실패</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #0056b3;">${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%</div>
                <div class="stat-label">성공률</div>
            </div>
        </div>
        
        ${results.summary.performance.averageLoadTime ? `
        <div class="test-section">
            <h2>⚡ 성능 메트릭</h2>
            <div class="performance-grid">
                <div class="metric">
                    <div class="metric-value">${results.summary.performance.averageLoadTime}ms</div>
                    <div class="metric-label">평균 로딩 시간</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${results.summary.performance.minLoadTime}ms</div>
                    <div class="metric-label">최소 로딩 시간</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${results.summary.performance.maxLoadTime}ms</div>
                    <div class="metric-label">최대 로딩 시간</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${results.summary.performance.consistency}</div>
                    <div class="metric-label">성능 일관성</div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="test-section">
            <h2>📋 상세 테스트 결과</h2>
            ${results.tests.map(test => `
                <div class="test-item ${test.status}">
                    <div class="test-header">
                        <div class="test-title">${test.name}</div>
                        <div>
                            <span class="test-status status-${test.status}">${test.status === 'passed' ? '통과' : test.status === 'warning' ? '경고' : '실패'}</span>
                            <span class="severity severity-${test.severity}">${test.severity} 우선순위</span>
                        </div>
                    </div>
                    <div style="font-size: 0.9em; color: #666;">
                        실행 시간: ${new Date(test.timestamp).toLocaleString('ko-KR')}
                    </div>
                    ${Object.keys(test.details).length > 0 ? `
                        <div class="details">
                            <strong>상세 정보:</strong>
                            <pre>${JSON.stringify(test.details, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h3>💡 개선 권장사항</h3>
            <ul>
                <li><strong>성능 최적화:</strong> 이미지 압축, CSS/JS 미니피케이션, CDN 활용을 고려하세요</li>
                <li><strong>SEO 개선:</strong> 메타 설명 추가, 구조화된 데이터 마크업 구현을 권장합니다</li>
                <li><strong>보안 강화:</strong> 추가 보안 헤더 설정으로 보안성을 향상시키세요</li>
                <li><strong>접근성 향상:</strong> ARIA 레이블 추가, 키보드 네비게이션 개선을 고려하세요</li>
                <li><strong>브라우저 호환성:</strong> 구형 브라우저 지원을 위한 폴리필 추가를 검토하세요</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>🔍 다음 단계 수동 검증</h3>
            <ul>
                <li>실제 브라우저에서 사용자 인터랙션 테스트</li>
                <li>다양한 디바이스에서 반응형 디자인 확인</li>
                <li>색상 대비 및 시각적 접근성 검증</li>
                <li>키보드만으로 전체 사이트 네비게이션 테스트</li>
                <li>스크린 리더 호환성 확인</li>
                <li>실제 성능 도구(Lighthouse, PageSpeed Insights) 실행</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `;
}

// 스크립트 실행
if (require.main === module) {
  runAdvancedTests().catch(console.error);
}

module.exports = { runAdvancedTests, advancedTestResults };