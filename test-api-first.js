const API_KEY_ENCODED = 'DaOcFjXVfRLbVEKIMinVRm7U7TplWb3BlYPCH%2BLKjX95ccKsA6g%2BomTkMw0mc7N6YGLgLq4Ro2FmiOobGsSjLw%3D%3D';
const API_KEY_DECODED = 'DaOcFjXVfRLbVEKIMinVRm7U7TplWb3BlYPCH+LKjX95ccKsA6g+omTkMw0mc7N6YGLgLq4Ro2FmiOobGsSjLw==';

async function testRealEstateAPI() {
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

        const testUrl = `${url}?${params}`;
        console.log('📡 API URL:', testUrl);
        
        console.log('⏳ API 호출 중...');
        const response = await fetch(testUrl);
        
        console.log('📊 응답 상태:', response.status);
        console.log('📊 응답 헤더:', Object.fromEntries(response.headers.entries()));
        
        const result = await response.text();
        console.log('📋 응답 내용 (처음 500자):', result.substring(0, 500));
        
        // JSON 파싱 시도
        try {
            const jsonResult = JSON.parse(result);
            console.log('✅ JSON 파싱 성공');
            console.log('📄 응답 구조:', Object.keys(jsonResult));
            
            if (jsonResult.response) {
                console.log('📄 response 구조:', Object.keys(jsonResult.response));
                if (jsonResult.response.body) {
                    console.log('📄 body 구조:', Object.keys(jsonResult.response.body));
                    if (jsonResult.response.body.items) {
                        console.log('📊 items 타입:', typeof jsonResult.response.body.items);
                        console.log('📊 items 내용:', jsonResult.response.body.items);
                    }
                }
            }
            
            return {
                success: true,
                status: response.status,
                data: jsonResult
            };
        } catch (parseError) {
            console.log('❌ JSON 파싱 실패:', parseError.message);
            console.log('📋 원본 응답:', result);
            
            return {
                success: false,
                status: response.status,
                error: 'JSON 파싱 실패',
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