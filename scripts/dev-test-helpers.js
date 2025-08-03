#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 개발 중 테스트 헬퍼 스크립트
 * 특정 파일이나 패턴에 따른 테스트 실행 지원
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      resolve(code);
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function watchTests() {
  log('👀 테스트 Watch 모드 시작...', colors.cyan);
  await runCommand('npm', ['run', 'test:watch']);
}

async function runTestsForFile(filePath) {
  log(`📁 ${filePath} 관련 테스트 실행...`, colors.yellow);
  
  // 파일 경로에서 테스트 파일 찾기
  const testPatterns = [
    filePath.replace(/\.jsx?$/, '.test.js'),
    filePath.replace(/\.jsx?$/, '.test.jsx'),
    filePath.replace(/src\//, 'tests/unit/').replace(/\.jsx?$/, '.test.js'),
    filePath.replace(/src\//, 'tests/unit/').replace /\.jsx?$/, '.test.jsx')
  ];

  for (const pattern of testPatterns) {
    if (fs.existsSync(pattern)) {
      await runCommand('npx', ['vitest', 'run', pattern]);
      return;
    }
  }

  log('⚠️  관련 테스트 파일을 찾을 수 없습니다.', colors.yellow);
  log('전체 테스트를 실행합니다...', colors.blue);
  await runCommand('npm', ['run', 'test']);
}

async function runComponentTests() {
  log('🧩 컴포넌트 테스트 실행...', colors.cyan);
  await runCommand('npx', ['vitest', 'run', 'src/components/**/*.test.{js,jsx}']);
}

async function runServiceTests() {
  log('⚙️  서비스 테스트 실행...', colors.cyan);
  await runCommand('npx', ['vitest', 'run', 'src/services/**/*.test.{js,jsx}']);
}

async function runUtilTests() {
  log('🔧 유틸리티 테스트 실행...', colors.cyan);
  await runCommand('npx', ['vitest', 'run', 'src/utils/**/*.test.{js,jsx}']);
}

async function runE2ETestsForPage(page) {
  log(`🌐 ${page} 페이지 E2E 테스트 실행...`, colors.cyan);
  
  const testFile = `tests/e2e/${page}.spec.js`;
  if (fs.existsSync(testFile)) {
    await runCommand('npx', ['playwright', 'test', testFile]);
  } else {
    log(`⚠️  ${testFile} 파일을 찾을 수 없습니다.`, colors.yellow);
    log('사용 가능한 E2E 테스트:', colors.blue);
    
    const e2eDir = 'tests/e2e';
    if (fs.existsSync(e2eDir)) {
      const files = fs.readdirSync(e2eDir).filter(f => f.endsWith('.spec.js'));
      files.forEach(file => log(`  - ${file.replace('.spec.js', '')}`, colors.green));
    }
  }
}

async function generateTestReport() {
  log('📊 테스트 보고서 생성 중...', colors.cyan);
  
  // 단위 테스트 커버리지
  await runCommand('npm', ['run', 'test:coverage']);
  
  // E2E 테스트 보고서
  await runCommand('npm', ['run', 'test:e2e:report']);
  
  log('✅ 테스트 보고서가 생성되었습니다:', colors.green);
  log('  - 커버리지: coverage/index.html', colors.blue);
  log('  - E2E 보고서: playwright-report/index.html', colors.blue);
}

async function setupTestEnvironment() {
  log('🔧 테스트 환경 설정 중...', colors.cyan);
  
  // Playwright 브라우저 설치
  log('Playwright 브라우저 설치...', colors.yellow);
  await runCommand('npx', ['playwright', 'install']);
  
  // 테스트 데이터베이스 설정 (필요한 경우)
  log('테스트 환경 변수 확인...', colors.yellow);
  
  const envFile = '.env.test';
  if (!fs.existsSync(envFile)) {
    const testEnv = `# 테스트 환경 변수
VITE_ENABLE_BYPASS=true
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=test-anon-key
`;
    fs.writeFileSync(envFile, testEnv);
    log(`✅ ${envFile} 파일이 생성되었습니다.`, colors.green);
  }
  
  log('✅ 테스트 환경 설정 완료!', colors.green);
}

// CLI 인터페이스
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'watch':
    watchTests();
    break;
  case 'file':
    if (!arg) {
      log('❌ 파일 경로를 제공해주세요.', colors.red);
      log('사용법: node scripts/dev-test-helpers.js file <파일경로>', colors.yellow);
      process.exit(1);
    }
    runTestsForFile(arg);
    break;
  case 'components':
    runComponentTests();
    break;
  case 'services':
    runServiceTests();
    break;
  case 'utils':
    runUtilTests();
    break;
  case 'e2e':
    if (arg) {
      runE2ETestsForPage(arg);
    } else {
      runCommand('npm', ['run', 'test:e2e']);
    }
    break;
  case 'report':
    generateTestReport();
    break;
  case 'setup':
    setupTestEnvironment();
    break;
  default:
    log('🧪 개발용 테스트 헬퍼', colors.cyan);
    log('======================', colors.cyan);
    log('');
    log('사용법:', colors.yellow);
    log('  node scripts/dev-test-helpers.js <command> [args]', colors.blue);
    log('');
    log('Commands:', colors.green);
    log('  watch              - 테스트 watch 모드 실행', colors.white);
    log('  file <path>        - 특정 파일 관련 테스트 실행', colors.white);
    log('  components         - 컴포넌트 테스트만 실행', colors.white);
    log('  services           - 서비스 테스트만 실행', colors.white);
    log('  utils              - 유틸리티 테스트만 실행', colors.white);
    log('  e2e [page]         - E2E 테스트 실행 (페이지 지정 가능)', colors.white);
    log('  report             - 테스트 보고서 생성', colors.white);
    log('  setup              - 테스트 환경 설정', colors.white);
    break;
}