const fs = require('fs');
const path = require('path');

console.log('🔍 console.log 제거 작업 시작...\n');

// console.log를 찾아서 제거하는 함수
function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // console.log, console.error, console.warn 등을 주석 처리
    // 단, 중요한 에러 로깅은 유지
    content = content.replace(
      /console\.(log|warn|info)\([^)]*\);?/g, 
      '// $&'
    );
    
    // console.error는 프로덕션 로거로 교체 제안
    if (content.includes('console.error')) {
      console.log(`⚠️  ${filePath}: console.error 발견 - 프로덕션 로거 사용 권장`);
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath}: console.log 제거됨`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ ${filePath} 처리 실패:`, error.message);
    return false;
  }
}

// src 폴더의 모든 JS/JSX 파일 찾기
function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      findJSFiles(filePath, fileList);
    } else if (file.match(/\.(js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 실행
const srcPath = path.join(__dirname, 'src');
const files = findJSFiles(srcPath);

console.log(`📁 총 ${files.length}개 파일 검사 중...\n`);

let modifiedCount = 0;
files.forEach(file => {
  if (removeConsoleLogs(file)) {
    modifiedCount++;
  }
});

console.log(`\n✨ 작업 완료!`);
console.log(`📊 수정된 파일: ${modifiedCount}개`);
console.log('\n⚠️  주의사항:');
console.log('1. console.error는 수동으로 프로덕션 로거로 교체 필요');
console.log('2. 디버깅 목적의 중요한 로그는 환경변수로 제어');
console.log('3. 예: if (process.env.NODE_ENV === "development") console.log(...)');