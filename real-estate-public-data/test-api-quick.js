#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');

const execAsync = promisify(exec);

// 키체인에서 API 키 가져오기
async function getApiKey() {
  try {
    const { stdout } = await execAsync('security find-generic-password -a "PUBLIC_DATA_API_KEY" -s "the-realty-dashboard" -w');
    return stdout.trim();
  } catch (error) {
    console.error('❌ 키체인에서 API 키를 찾을 수 없습니다.');
    return null;
  }
}

// 간단한 API 테스트
async function quickApiTest() {
  console.log('🔍 공공데이터포털 API 빠른 테스트');
  console.log('=====================================\n');

  // API 키 로드
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.log('💡 API 키 설정: npm run setup-api-key');
    return;
  }

  console.log('✅ 키체인에서 API 키를 로드했습니다.');
  console.log(`   키 길이: ${apiKey.length}자\n`);

  // API 테스트
  const url = 'https://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev';
  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: '1',
    numOfRows: '10',
    LAWD_CD: '11680', // 강남구
    DEAL_YMD: '202412' // 2024년 12월
  });

  console.log('📡 API 호출 중...');
  console.log(`   지역: 강남구 (11680)`);
  console.log(`   기간: 2024년 12월\n`);

  try {
    const response = await axios.get(`${url}?${params}`);
    const data = response.data;

    // XML 간단 파싱
    if (data.includes('<resultCode>00</resultCode>')) {
      console.log('✅ API 호출 성공!');
      
      // 아이템 수 계산
      const itemCount = (data.match(/<item>/g) || []).length;
      console.log(`   조회 결과: ${itemCount}건`);

      // 첫 번째 아이템 정보 추출
      const firstItem = data.match(/<item>([\s\S]*?)<\/item>/);
      if (firstItem) {
        const aptName = firstItem[1].match(/<아파트>(.*?)<\/아파트>/)?.[1] || '알 수 없음';
        const price = firstItem[1].match(/<거래금액>(.*?)<\/거래금액>/)?.[1] || '0';
        const area = firstItem[1].match(/<전용면적>(.*?)<\/전용면적>/)?.[1] || '0';
        
        console.log('\n📋 샘플 데이터:');
        console.log(`   아파트명: ${aptName}`);
        console.log(`   거래금액: ${price.trim()}만원`);
        console.log(`   전용면적: ${area}㎡`);
      }

      console.log('\n🎉 부동산 데이터 수집 시스템을 사용할 준비가 되었습니다!');
      console.log('   웹 애플리케이션의 /data-collection 페이지로 이동하세요.');
      
    } else if (data.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR')) {
      console.log('❌ API 키 오류: 등록되지 않은 키입니다.');
    } else {
      console.log('❌ API 호출 실패');
      console.log('응답:', data.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

// 테스트 실행
quickApiTest();