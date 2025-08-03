/**
 * 부동산원 R-ONE API 키 테스트 및 데이터 수집 확인
 */

const axios = require('axios');
const API_KEY = '7c89f463dd39450188bd645b78e1e6d5';
const BASE_URL = 'https://www.reb.or.kr/r-one/openapi';

// 현재 년월 가져오기
function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

// XML 파싱 함수
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
      '월', '일', '전용면적', '지번', '지역코드', '층'
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

// API 테스트 함수
async function testApi() {
  console.log('🔍 부동산원 R-ONE API 연결 테스트 시작...');
  console.log(`📅 테스트 년도: 2024`);
  console.log('📊 테스트 서비스: 부동산 통계 데이터');
  console.log('');

  // R-ONE API 일반적인 구조 테스트
  const url = `${BASE_URL}/SttsApiTblData.do`;
  const params = new URLSearchParams({
    KEY: API_KEY,
    Type: 'json',
    pIndex: '1',
    pSize: '10',
    STATBL_ID: 'A_2024_00900', // 예시 테이블 ID
    DTACYCLE_CD: 'YY',
    WRTTIME_IDTFR_ID: '2022'
  });

  try {
    console.log('🌐 API 호출 중...');
    const response = await axios.get(`${url}?${params}`);
    
    console.log(`📊 응답 상태: ${response.status}`);
    
    const responseData = response.data;
    console.log('📄 응답 데이터 타입:', typeof responseData);
    
    if (typeof responseData === 'object') {
      console.log('✅ JSON 응답 수신됨');
      console.log('📊 응답 구조:', Object.keys(responseData));
      
      // 응답 내용 출력
      if (responseData.SttsApiTblData) {
        const data = responseData.SttsApiTblData;
        console.log('');
        console.log('📋 R-ONE API 응답 데이터:');
        console.log('========================');
        
        if (data.list_total_count) {
          console.log(`총 건수: ${data.list_total_count}`);
        }
        
        if (data.row && Array.isArray(data.row)) {
          console.log(`조회된 데이터: ${data.row.length}건`);
          
          if (data.row.length > 0) {
            console.log('');
            console.log('첫 번째 데이터 샘플:');
            const firstRow = data.row[0];
            Object.keys(firstRow).forEach(key => {
              console.log(`   ${key}: ${firstRow[key]}`);
            });
          }
        }
      } else {
        console.log('전체 응답:', JSON.stringify(responseData, null, 2));
      }
    } else {
      console.log('📄 텍스트 응답 길이:', responseData.length, '문자');
      console.log('응답 내용 미리보기:', responseData.substring(0, 500));
    }
    
    console.log('');
    console.log('🎉 API 연결 테스트 성공!');
    console.log('   이제 자동 수집 시스템을 시작할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ API 테스트 실패:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('💡 해결 방법:');
      console.log('   - 인터넷 연결을 확인하세요');
      console.log('   - 방화벽 설정을 확인하세요');
    } else if (error.message.includes('HTTP 오류')) {
      console.log('💡 해결 방법:');
      console.log('   - API 키가 올바른지 확인하세요');
      console.log('   - 공공데이터포털에서 API 사용 승인 상태를 확인하세요');
    }
  }
}

// 테스트 실행
testApi();