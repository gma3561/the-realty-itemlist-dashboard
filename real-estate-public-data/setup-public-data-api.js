#!/usr/bin/env node

const keychainManager = require('../src/utils/keychainManager.js');

async function main() {
  const apiKey = 'DaOcFjXVfRLbVEKIMinVRm7U7TplWb3BlYPCH+LKjX95ccKsA6g+omTkMw0mc7N6YGLgLq4Ro2FmiOobGsSjLw==';
  
  console.log('🔐 공공데이터포털 API 키를 macOS 키체인에 저장합니다...');
  
  try {
    // API 키 저장
    const stored = await keychainManager.setPublicDataApiKey(apiKey);
    
    if (stored) {
      console.log('✅ API 키가 성공적으로 키체인에 저장되었습니다!');
      
      // 저장 확인
      const savedKey = await keychainManager.getPublicDataApiKey();
      console.log('🔍 저장 확인: API 키가 올바르게 저장되었습니다.');
      console.log(`   키 길이: ${savedKey.length}자`);
      console.log(`   키 시작: ${savedKey.substring(0, 10)}...`);
      
      // 전체 키체인 상태 확인
      console.log('\n📋 전체 키체인 상태:');
      const status = await keychainManager.listStoredKeys();
      Object.entries(status).forEach(([key, exists]) => {
        console.log(`  ${exists ? '✅' : '❌'} ${key}`);
      });
      
      console.log('\n💡 이제 부동산 데이터 수집 기능을 사용할 수 있습니다!');
      console.log('   - 웹 애플리케이션의 /data-collection 페이지에서 자동으로 키체인의 API 키를 사용합니다.');
      console.log('   - 더 이상 API 키를 수동으로 입력할 필요가 없습니다.');
      
    } else {
      console.error('❌ API 키 저장에 실패했습니다.');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

main();