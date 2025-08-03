/**
 * 공공데이터포털 국토교통부 아파트 실거래가 API 테스트
 */

const axios = require('axios');

// 공공데이터포털 API 키 (URL 디코딩됨)
const API_KEY = 'DaOcFjXVfRLbVEKIMinVRm7U7TplWb3BlYPCH+LKjX95ccKsA6g+omTkMw0mc7N6YGLgLq4Ro2FmiOobGsSjLw==';

// API 엔드포인트들
const API_ENDPOINTS = {
  apartment_sale: 'getRTMSDataSvcAptTradeDev',      // 아파트 매매 실거래가 상세 자료
  apartment_rent: 'getRTMSDataSvcAptRent',          // 아파트 전월세 실거래가 자료
  townhouse_sale: 'getRTMSDataSvcRHTradeDev',       // 연립다세대 매매 실거래가 자료
  detached_sale: 'getRTMSDataSvcSHTradeDev'         // 단독/다가구 매매 실거래가 자료
};

const BASE_URL = 'https://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc';

// 현재 년월 가져오기 (YYYYMM 형식)
function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

// 지난 달 년월 가져오기
function getLastMonth() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = lastMonth.getFullYear();
  const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

// XML 응답 파싱 함수
function parseXmlResponse(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const item = {};

    // 주요 필드 추출
    const fields = [
      '거래금액', '건축년도', '년', '법정동', '아파트',
      '월', '일', '전용면적', '지번', '지역코드', '층',
      '해제사유발생일', '해제여부', '거래유형'
    ];

    fields.forEach(field => {
      const regex = new RegExp(`<${field}>(.*?)</${field}>`);
      const fieldMatch = regex.exec(itemXml);
      if (fieldMatch) {
        item[field] = fieldMatch[1].trim();
      }
    });

    if (Object.keys(item).length > 0) {
      items.push(item);
    }
  }

  return items;
}

// API 호출 함수
async function callApi(endpoint, areaCode, dealYmd) {
  const url = `${BASE_URL}/${endpoint}`;
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    pageNo: '1',
    numOfRows: '100',
    LAWD_CD: areaCode,
    DEAL_YMD: dealYmd
  });

  try {
    const response = await axios.get(`${url}?${params}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 전체 API 테스트 함수
async function testAllApis() {
  console.log('🏢 공공데이터포털 국토교통부 부동산 실거래가 API 테스트');
  console.log('=======================================================');
  console.log('');
  
  const testAreaCode = '11680'; // 강남구
  const testMonth = getLastMonth(); // 지난 달 데이터 (더 안정적)
  
  console.log(`📍 테스트 지역: 강남구 (${testAreaCode})`);
  console.log(`📅 테스트 기간: ${testMonth}`);
  console.log('');

  const testResults = {};

  for (const [apiName, endpoint] of Object.entries(API_ENDPOINTS)) {
    console.log(`🔍 ${apiName} API 테스트 중...`);
    
    const result = await callApi(endpoint, testAreaCode, testMonth);
    
    if (result.success) {
      // XML 파싱
      const items = parseXmlResponse(result.data);
      
      console.log(`✅ 성공 - ${items.length}건 조회`);
      
      if (items.length > 0) {
        const firstItem = items[0];
        console.log('   📋 첫 번째 데이터:');
        Object.keys(firstItem).slice(0, 5).forEach(key => {
          console.log(`      ${key}: ${firstItem[key]}`);
        });
        
        // 거래금액 통계
        const amounts = items
          .map(item => parseInt((item['거래금액'] || '0').replace(/,/g, '')))
          .filter(amount => amount > 0);
        
        if (amounts.length > 0) {
          const avgAmount = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
          const minAmount = Math.min(...amounts);
          const maxAmount = Math.max(...amounts);
          
          console.log(`   💰 거래금액: 평균 ${avgAmount.toLocaleString()}만원 (${minAmount.toLocaleString()}~${maxAmount.toLocaleString()})`);
        }
      }
      
      testResults[apiName] = { success: true, count: items.length };
    } else {
      console.log(`❌ 실패 - ${result.error}`);
      testResults[apiName] = { success: false, error: result.error };
    }
    
    console.log('');
    
    // API 호출 간격 (초당 10회 제한 준수)
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 결과 요약
  console.log('📊 테스트 결과 요약:');
  console.log('===================');
  
  for (const [apiName, result] of Object.entries(testResults)) {
    if (result.success) {
      console.log(`✅ ${apiName}: ${result.count}건`);
    } else {
      console.log(`❌ ${apiName}: 실패`);
    }
  }
  
  const successCount = Object.values(testResults).filter(r => r.success).length;
  console.log('');
  console.log(`🎯 성공률: ${successCount}/${Object.keys(testResults).length} (${Math.round(successCount / Object.keys(testResults).length * 100)}%)`);
  
  if (successCount > 0) {
    console.log('');
    console.log('🚀 API 연결 성공! 자동 수집 시스템을 시작할 수 있습니다.');
    console.log('');
    console.log('📋 다음 단계:');
    console.log('   1. Supabase 테이블 설정 (supabase_realestatedata_setup.sql 실행)');
    console.log('   2. 웹 애플리케이션에서 RealEstateCollector 컴포넌트 사용');
    console.log('   3. API 키 입력 후 자동 수집 시작');
  }
}

// 테스트 실행
testAllApis();