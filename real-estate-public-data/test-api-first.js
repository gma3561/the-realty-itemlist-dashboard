// API 키는 이제 macOS 키체인에서 안전하게 관리됩니다.
// 키체인에 저장하려면: node scripts/setup-public-data-api.js
const keychainManager = require('./src/utils/keychainManager.js');

let API_KEY_ENCODED;
let API_KEY_DECODED;

// 키체인에서 API 키 로드
async function loadApiKey() {
  try {
    const apiKey = await keychainManager.getPublicDataApiKey();
    API_KEY_DECODED = apiKey;
    API_KEY_ENCODED = encodeURIComponent(apiKey);
    console.log('✅ 키체인에서 API 키를 로드했습니다.');
    return true;
  } catch (error) {
    console.error('❌ 키체인에서 API 키를 찾을 수 없습니다.');
    console.log('💡 다음 명령어로 API 키를 설정하세요: node scripts/setup-public-data-api.js');
    return false;
  }
}

async function testRealEstateAPI() {
    // 먼저 API 키 로드
    const keyLoaded = await loadApiKey();
    if (!keyLoaded) {
        console.log('❌ API 키가 없어 테스트를 중단합니다.');
        return { success: false, error: 'API 키가 설정되지 않았습니다.' };
    }
    
    console.log('🔍 공공데이터포털 단독/다가구 매매 실거래가 API 테스트 시작');
    
    try {
        // 단독/다가구 매매 실거래가 API 테스트
        const url = 'https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade';
        
        // 먼저 Encoded 키로 시도
        console.log('🔑 Encoded 키로 테스트...');
        const params1 = new URLSearchParams({
            serviceKey: API_KEY_ENCODED,
            LAWD_CD: '11110', // 종로구
            DEAL_YMD: '202412', // 2024년 12월
            pageNo: '1',
            numOfRows: '10'
        });

        const testUrl1 = `${url}?${params1}`;
        console.log('📡 API URL (Encoded):', testUrl1);
        
        console.log('⏳ API 호출 중...');
        let response = await fetch(testUrl1);
        
        console.log('📊 응답 상태:', response.status);
        console.log('📊 응답 헤더:', Object.fromEntries(response.headers.entries()));
        
        let result = await response.text();
        console.log('📋 응답 내용 (처음 500자):', result.substring(0, 500));
        
        // Encoded 키 실패시 Decoded 키로 재시도
        if (result.includes('SERVICE_KEY_IS_NOT_REGISTERED_ERROR') || result.includes('SERVICE ERROR')) {
            console.log('\n🔑 Decoded 키로 재시도...');
            const params2 = new URLSearchParams({
                serviceKey: API_KEY_DECODED,
                LAWD_CD: '11110', // 종로구
                DEAL_YMD: '202412', // 2024년 12월
                pageNo: '1',
                numOfRows: '10'
            });
            
            const testUrl2 = `${url}?${params2}`;
            console.log('📡 API URL (Decoded):', testUrl2);
            
            response = await fetch(testUrl2);
            console.log('📊 응답 상태:', response.status);
            result = await response.text();
            console.log('📋 응답 내용 (처음 500자):', result.substring(0, 500));
        }
        
        // XML 파싱 시도 (JSON이 아니므로)
        if (result.includes('<?xml') || result.includes('<response>')) {
            console.log('✅ XML 응답 수신');
            
            // 간단한 XML 파싱으로 성공 여부 확인
            if (result.includes('<resultCode>000</resultCode>')) {
                console.log('✅ API 호출 성공');
                
                // items 태그 찾기
                const itemsMatch = result.match(/<items>(.*?)<\/items>/s);
                if (itemsMatch) {
                    console.log('📊 데이터 항목 발견');
                } else {
                    console.log('📊 데이터 없음 (해당 기간/지역에 거래 없음)');
                }
                
                return {
                    success: true,
                    status: response.status,
                    data: result
                };
            } else {
                console.log('❌ API 오류 응답');
                return {
                    success: false,
                    status: response.status,
                    error: 'API 오류',
                    rawResponse: result
                };
            }
        } else {
            console.log('❌ 예상치 못한 응답 형식');
            return {
                success: false,
                status: response.status,
                error: '예상치 못한 응답 형식',
                rawResponse: result
            };
        }
        
    } catch (error) {
        console.error('❌ API 호출 오류:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Node.js 환경에서 fetch 사용
if (typeof fetch === 'undefined') {
    console.log('🔧 Node.js 환경에서 fetch 설정 중...');
    global.fetch = require('node-fetch');
}

testRealEstateAPI().then(result => {
    console.log('\n🎯 최종 결과:', result.success ? '✅ 성공' : '❌ 실패');
});