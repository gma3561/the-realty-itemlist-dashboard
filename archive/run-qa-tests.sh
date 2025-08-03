#!/bin/bash

# 부동산 대시보드 QA 테스트 실행 스크립트
# 이 스크립트는 모든 QA 테스트를 순차적으로 실행하고 결과를 수집합니다.

echo "🚀 부동산 대시보드 종합 QA 테스트 시작..."
echo "================================================"

# 테스트 결과 디렉토리 생성
mkdir -p test-results/{screenshots,videos,functional,visual-regression}

# 환경 설정
export NODE_ENV=test
export PLAYWRIGHT_BROWSERS_PATH=ms-playwright

# Playwright 브라우저 설치 확인
echo "📦 Playwright 브라우저 확인 중..."
npx playwright install chromium --with-deps || {
    echo "❌ Playwright 브라우저 설치 실패"
    exit 1
}

# 1. 종합 QA 테스트 실행
echo ""
echo "1️⃣ 종합 QA 테스트 실행 중..."
echo "--------------------------------"
npx playwright test tests/e2e/comprehensive-qa-suite.spec.js --reporter=list || {
    echo "⚠️ 종합 QA 테스트에서 일부 실패가 있었습니다."
}

# 2. 시각적 회귀 테스트 실행
echo ""
echo "2️⃣ 시각적 회귀 테스트 실행 중..."
echo "--------------------------------"
npx playwright test tests/e2e/visual-regression.spec.js --reporter=list || {
    echo "⚠️ 시각적 회귀 테스트에서 일부 차이가 발견되었습니다."
}

# 3. 기능 테스트 실행
echo ""
echo "3️⃣ 기능 테스트 실행 중..."
echo "--------------------------------"
npx playwright test tests/e2e/functional-tests.spec.js --reporter=list || {
    echo "⚠️ 기능 테스트에서 일부 실패가 있었습니다."
}

# 4. 테스트 결과 요약
echo ""
echo "📊 테스트 결과 요약"
echo "================================================"

# JSON 리포트 파일 확인
if [ -f "test-results/comprehensive-qa-report.json" ]; then
    echo "✅ 종합 QA 리포트: test-results/comprehensive-qa-report.html"
fi

if [ -f "test-results/visual-regression/report.json" ]; then
    echo "✅ 시각적 회귀 리포트: test-results/visual-regression/report.html"
fi

if [ -f "test-results/functional/functional-test-report.json" ]; then
    echo "✅ 기능 테스트 리포트: test-results/functional/functional-test-report.html"
fi

# 스크린샷 개수 확인
SCREENSHOT_COUNT=$(find test-results/screenshots -name "*.png" 2>/dev/null | wc -l)
echo ""
echo "📸 캡처된 스크린샷: ${SCREENSHOT_COUNT}개"

# 5. 통합 리포트 생성
echo ""
echo "📝 통합 리포트 생성 중..."
node -e "
const fs = require('fs');
const path = require('path');

// 모든 리포트 수집
const reports = {
    comprehensive: null,
    visual: null,
    functional: null
};

try {
    if (fs.existsSync('test-results/comprehensive-qa-report.json')) {
        reports.comprehensive = JSON.parse(fs.readFileSync('test-results/comprehensive-qa-report.json', 'utf8'));
    }
    if (fs.existsSync('test-results/visual-regression/report.json')) {
        reports.visual = JSON.parse(fs.readFileSync('test-results/visual-regression/report.json', 'utf8'));
    }
    if (fs.existsSync('test-results/functional/functional-test-report.json')) {
        reports.functional = JSON.parse(fs.readFileSync('test-results/functional/functional-test-report.json', 'utf8'));
    }

    // 통합 요약 생성
    const summary = {
        timestamp: new Date().toISOString(),
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        suites: []
    };

    if (reports.comprehensive) {
        summary.totalTests += reports.comprehensive.summary.total;
        summary.totalPassed += reports.comprehensive.summary.passed;
        summary.totalFailed += reports.comprehensive.summary.failed;
        summary.suites.push({
            name: '종합 QA 테스트',
            total: reports.comprehensive.summary.total,
            passed: reports.comprehensive.summary.passed,
            failed: reports.comprehensive.summary.failed
        });
    }

    if (reports.visual) {
        summary.totalTests += reports.visual.summary.total;
        summary.totalPassed += reports.visual.summary.passed;
        summary.totalFailed += reports.visual.summary.failed;
        summary.suites.push({
            name: '시각적 회귀 테스트',
            total: reports.visual.summary.total,
            passed: reports.visual.summary.passed,
            failed: reports.visual.summary.failed,
            newBaselines: reports.visual.summary.newBaselines
        });
    }

    if (reports.functional) {
        summary.totalTests += reports.functional.summary.total;
        summary.totalPassed += reports.functional.summary.passed;
        summary.totalFailed += reports.functional.summary.failed;
        summary.totalSkipped += reports.functional.summary.skipped;
        summary.suites.push({
            name: '기능 테스트',
            total: reports.functional.summary.total,
            passed: reports.functional.summary.passed,
            failed: reports.functional.summary.failed,
            skipped: reports.functional.summary.skipped
        });
    }

    // 통합 리포트 HTML 생성
    const htmlReport = \`
<!DOCTYPE html>
<html lang='ko'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>부동산 대시보드 QA 통합 리포트</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #5e72e4 0%, #825ee4 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .overall-summary {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .overall-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .stat-card {
            padding: 20px;
            border-radius: 8px;
            background: #f8f9fa;
        }
        .stat-value {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
        }
        .suite-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .suite-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .suite-header {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #5e72e4;
        }
        .suite-stats {
            display: flex;
            justify-content: space-around;
            margin-top: 15px;
        }
        .suite-stat {
            text-align: center;
        }
        .links {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        .link-item {
            display: block;
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 5px;
            text-decoration: none;
            color: #5e72e4;
            transition: background 0.3s;
        }
        .link-item:hover {
            background: #e9ecef;
        }
        .success-rate {
            font-size: 64px;
            font-weight: bold;
            color: \${summary.totalTests > 0 ? (summary.totalPassed / summary.totalTests * 100) >= 90 ? '#28a745' : (summary.totalPassed / summary.totalTests * 100) >= 70 ? '#ffc107' : '#dc3545' : '#6c757d'};
        }
    </style>
</head>
<body>
    <div class='header'>
        <h1>🏢 부동산 대시보드 QA 통합 리포트</h1>
        <p>테스트 일시: \${new Date(summary.timestamp).toLocaleString('ko-KR')}</p>
    </div>

    <div class='overall-summary'>
        <h2>전체 테스트 결과</h2>
        <div class='success-rate'>
            \${summary.totalTests > 0 ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(1) : 0}%
        </div>
        <p>전체 성공률</p>
        
        <div class='overall-stats'>
            <div class='stat-card'>
                <div>총 테스트</div>
                <div class='stat-value'>\${summary.totalTests}</div>
            </div>
            <div class='stat-card' style='background: #d4edda;'>
                <div>성공</div>
                <div class='stat-value' style='color: #155724;'>\${summary.totalPassed}</div>
            </div>
            <div class='stat-card' style='background: #f8d7da;'>
                <div>실패</div>
                <div class='stat-value' style='color: #721c24;'>\${summary.totalFailed}</div>
            </div>
            <div class='stat-card' style='background: #fff3cd;'>
                <div>건너뜀</div>
                <div class='stat-value' style='color: #856404;'>\${summary.totalSkipped}</div>
            </div>
        </div>
    </div>

    <div class='suite-grid'>
        \${summary.suites.map(suite => \`
            <div class='suite-card'>
                <div class='suite-header'>\${suite.name}</div>
                <div>총 \${suite.total}개 테스트 실행</div>
                <div class='suite-stats'>
                    <div class='suite-stat'>
                        <div style='color: #28a745; font-size: 24px; font-weight: bold;'>\${suite.passed}</div>
                        <div>성공</div>
                    </div>
                    <div class='suite-stat'>
                        <div style='color: #dc3545; font-size: 24px; font-weight: bold;'>\${suite.failed}</div>
                        <div>실패</div>
                    </div>
                    \${suite.skipped ? \`
                        <div class='suite-stat'>
                            <div style='color: #ffc107; font-size: 24px; font-weight: bold;'>\${suite.skipped}</div>
                            <div>건너뜀</div>
                        </div>
                    \` : ''}
                    \${suite.newBaselines ? \`
                        <div class='suite-stat'>
                            <div style='color: #17a2b8; font-size: 24px; font-weight: bold;'>\${suite.newBaselines}</div>
                            <div>신규</div>
                        </div>
                    \` : ''}
                </div>
            </div>
        \`).join('')}
    </div>

    <div class='links'>
        <h3>상세 리포트</h3>
        <a href='comprehensive-qa-report.html' class='link-item'>📊 종합 QA 테스트 상세 리포트</a>
        <a href='visual-regression/report.html' class='link-item'>🎨 시각적 회귀 테스트 상세 리포트</a>
        <a href='functional/functional-test-report.html' class='link-item'>⚙️ 기능 테스트 상세 리포트</a>
    </div>
</body>
</html>
\`;

    fs.writeFileSync('test-results/index.html', htmlReport);
    console.log('✅ 통합 리포트 생성 완료: test-results/index.html');

} catch (error) {
    console.error('❌ 통합 리포트 생성 실패:', error.message);
}
"

echo ""
echo "✅ 모든 QA 테스트 완료!"
echo ""
echo "📊 테스트 리포트 확인:"
echo "   - 통합 리포트: test-results/index.html"
echo "   - 종합 QA: test-results/comprehensive-qa-report.html"
echo "   - 시각적 회귀: test-results/visual-regression/report.html"
echo "   - 기능 테스트: test-results/functional/functional-test-report.html"
echo ""
echo "💡 팁: 브라우저에서 HTML 리포트를 열어 상세 결과를 확인하세요."