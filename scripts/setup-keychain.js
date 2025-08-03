#!/usr/bin/env node

import keychainManager from '../src/utils/keychainManager.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'setup':
        console.log('🔐 Google Drive API 키 설정을 시작합니다...');
        await keychainManager.setupInitialKeys();
        break;

      case 'status':
        console.log('🔍 키체인 상태 확인 중...');
        const status = await keychainManager.listStoredKeys();
        console.log('\n📋 저장된 키 현황:');
        Object.entries(status).forEach(([key, exists]) => {
          console.log(`  ${exists ? '✅' : '❌'} ${key}`);
        });
        break;

      case 'clear':
        console.log('🗑️  모든 키를 삭제합니다...');
        const cleared = await keychainManager.clearAllKeys();
        console.log('삭제 결과:', cleared);
        break;

      case 'test':
        console.log('🧪 Google Drive 연결 테스트...');
        const config = await keychainManager.getGoogleDriveConfig();
        console.log('✅ 키체인에서 설정을 성공적으로 불러왔습니다');
        console.log('📧 클라이언트 이메일:', config.client_email);
        console.log('🆔 프로젝트 ID:', config.project_id);
        console.log('📁 루트 폴더 ID:', config.root_folder_id || '설정되지 않음');
        console.log('🔗 공유 폴더 ID:', config.share_folder_id || '설정되지 않음');
        break;

      default:
        console.log(`
🔑 The Realty Dashboard - 키체인 관리 도구

사용법:
  npm run keychain setup   - 새로운 API 키 설정
  npm run keychain status  - 현재 저장된 키 확인  
  npm run keychain test    - Google Drive 연결 테스트
  npm run keychain clear   - 모든 키 삭제

예시:
  npm run keychain setup
  npm run keychain status
        `);
        break;
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

main();