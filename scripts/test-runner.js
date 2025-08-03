#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

/**
 * 테스트 실행 스크립트
 * 다양한 테스트 시나리오를 순차적으로 또는 병렬로 실행
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
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests(type = 'all') {
  const startTime = Date.now();
  
  try {
    log('\n🧪 테스트 실행 시작', colors.cyan);
    log('=====================================', colors.cyan);

    switch (type) {
      case 'unit':
        await runUnitTests();
        break;
      case 'e2e':
        await runE2ETests();
        break;
      case 'coverage':
        await runCoverageTests();
        break;
      case 'ci':
        await runCITests();
        break;
      case 'all':
      default:
        await runAllTests();
        break;
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log('\n✅ 모든 테스트 완료!', colors.green);
    log(`⏱️  총 소요 시간: ${duration}초`, colors.blue);
    
  } catch (error) {
    log('\n❌ 테스트 실패!', colors.red);
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

async function runUnitTests() {
  log('\n📋 단위 테스트 실행 중...', colors.yellow);
  await runCommand('npm', ['run', 'test']);
}

async function runE2ETests() {
  log('\n🌐 E2E 테스트 실행 중...', colors.yellow);
  await runCommand('npm', ['run', 'test:e2e']);
}

async function runCoverageTests() {
  log('\n📊 커버리지 테스트 실행 중...', colors.yellow);
  await runCommand('npm', ['run', 'test:coverage']);
}

async function runCITests() {
  log('\n🔄 CI 테스트 실행 중...', colors.yellow);
  await runCommand('npm', ['run', 'test:ci']);
}

async function runAllTests() {
  log('\n🚀 전체 테스트 스위트 실행 중...', colors.yellow);
  
  // 1. Lint 검사
  log('\n1️⃣ ESLint 검사...', colors.blue);
  await runCommand('npm', ['run', 'lint']);
  
  // 2. 단위 테스트 (커버리지 포함)
  log('\n2️⃣ 단위 테스트 (커버리지 포함)...', colors.blue);
  await runCommand('npm', ['run', 'test:coverage']);
  
  // 3. E2E 테스트
  log('\n3️⃣ E2E 테스트...', colors.blue);
  await runCommand('npm', ['run', 'test:e2e']);
  
  log('\n📈 테스트 결과 요약:', colors.magenta);
  log('- Lint: ✅ 통과', colors.green);
  log('- 단위 테스트: ✅ 통과', colors.green);
  log('- E2E 테스트: ✅ 통과', colors.green);
}

// CLI 인터페이스
const testType = process.argv[2] || 'all';
const validTypes = ['unit', 'e2e', 'coverage', 'ci', 'all'];

if (!validTypes.includes(testType)) {
  log(`❌ 잘못된 테스트 타입: ${testType}`, colors.red);
  log(`사용 가능한 타입: ${validTypes.join(', ')}`, colors.yellow);
  process.exit(1);
}

runTests(testType);