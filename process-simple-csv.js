/**
 * 간단한 CSV 포맷을 처리하여 Supabase에 업로드하기 위한 스크립트
 * 
 * 사용 방법:
 * 1. npm install csv-parser fs node-fetch
 * 2. node process-simple-csv.js
 */

const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const path = require('path');

// Supabase 설정
const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';
const BATCH_SIZE = 20;

// 매핑 테이블 정의
const propertyTypeMap = {
    '아파트': 'apt',
    '오피스텔': 'officetel',
    '빌라': 'villa',
    '빌라/연립': 'villa',
    '단독': 'house',
    '단독주택': 'house',
    '상가': 'commercial',
    '공동주택': 'villa',
    '사무실': 'commercial',
    '사무실/상가': 'commercial'
};

const transactionTypeMap = {
    '매매': 'sale',
    '전세': 'lease',
    '월세': 'rent',
    '월세/렌트': 'rent',
    '렌트': 'rent',
    '급매': 'sale'
};

// CSV 파일 경로
const csvFilePath = '/tmp/simple-data.csv';

// 결과 데이터 배열
const results = [];

// 간단한 CSV 데이터 생성 (테스트용)
const sampleData = 
`no,의뢰날짜,담당자,문의 경로,지정 담당자,의뢰인 연락처,지역,타입,금액
1,2025-07-20,장민아,방문,장민아,010-1234-5678,강남구 논현동,아파트,12억
2,2025-07-21,정이든,전화,정이든,010-2345-6789,강남구 삼성동,오피스텔,3억5천
3,2025-07-22,장승환,웹사이트,장승환,010-3456-7890,서초구 서초동,빌라,5억2천
4,2025-07-23,장민아,소개,장민아,010-4567-8901,용산구 한남동,단독주택,25억
5,2025-07-24,정이든,온라인,정이든,010-5678-9012,송파구 잠실동,상가,18억
6,2025-07-25,장승환,방문,장승환,010-6789-0123,강남구 청담동,아파트,15억
7,2025-07-26,장민아,전화,장민아,010-7890-1234,마포구 합정동,오피스텔,2억8천
8,2025-07-27,정이든,웹사이트,정이든,010-8901-2345,용산구 이태원동,빌라,6억5천
9,2025-07-28,장승환,소개,장승환,010-9012-3456,강남구 대치동,아파트,9억8천
10,2025-07-29,장민아,온라인,장민아,010-0123-4567,서초구 반포동,단독주택,22억`;

// 샘플 데이터 저장
fs.writeFileSync(csvFilePath, sampleData);
console.log(`샘플 데이터를 ${csvFilePath}에 저장했습니다.`);

// CSV 파일 읽기
fs.createReadStream(csvFilePath, { encoding: 'utf8' })
    .pipe(csv())
    .on('data', (data) => {
        results.push(data);
    })
    .on('end', async () => {
        console.log(`CSV 파일 로드 완료. ${results.length}개의 행이 로드되었습니다.`);
        await processData();
    });

// 데이터 처리 및 업로드 함수
async function processData() {
    try {
        // 데이터 변환
        const convertedData = results.map((row, index) => {
            // 가격 처리
            let salePrice = 0;
            let leasePrice = 0;
            let price = 0;
            
            // 타입에 따른 거래 유형 추정
            let transactionType = 'sale'; // 기본값은 매매
            
            // 금액 처리
            if (row['금액']) {
                const priceStr = row['금액'].trim();
                
                // 매매 가격 (기본값)
                if (priceStr.includes('억')) {
                    const match = priceStr.match(/(\d+)억(?:(\d+)천)?/);
                    if (match) {
                        const billions = parseInt(match[1]) || 0;
                        const millions = match[2] ? parseInt(match[2]) * 1000 : 0;
                        salePrice = billions * 100000000 + millions * 10000;
                    }
                } else {
                    // 숫자만 추출
                    const numericPrice = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
                    salePrice = numericPrice;
                }
            }
            
            // 매물 타입 처리
            let propertyType = 'apt'; // 기본값은 아파트
            if (row['타입']) {
                const typeStr = row['타입'].trim();
                propertyType = propertyTypeMap[typeStr] || 'apt';
            }
            
            // 매물명 및 위치 생성
            let propertyName = '';
            let location = '';
            
            if (row['지역']) {
                location = row['지역'].trim();
                propertyName = `${location} 매물 ${index + 1}`;
            } else {
                location = '정보 없음';
                propertyName = `매물 ${index + 1}`;
            }
            
            return {
                property_name: propertyName,
                location: location,
                building: '',
                unit: '',
                property_type_id: propertyType,
                property_status_id: 'available', // 기본값: 거래가능
                transaction_type_id: transactionType,
                property_type: row['타입'] ? row['타입'].trim() : '아파트',
                property_status: '거래가능',
                transaction_type: '매매',
                sale_price: salePrice,
                lease_price: leasePrice,
                price: price,
                supply_area_sqm: 0,
                private_area_sqm: 0,
                floor_info: '',
                rooms_bathrooms: '',
                direction: '',
                maintenance_fee: '',
                parking: '',
                move_in_date: '',
                approval_date: '',
                special_notes: `의뢰날짜: ${row['의뢰날짜'] || '정보 없음'}, 문의 경로: ${row['문의 경로'] || '정보 없음'}`,
                manager_memo: `의뢰인 연락처: ${row['의뢰인 연락처'] || '정보 없음'}`,
                manager_id: row['담당자'] ? row['담당자'].trim() : 'admin'
            };
        });

        console.log('데이터 변환 완료');
        console.log(`첫 번째 항목 샘플: ${JSON.stringify(convertedData[0], null, 2)}`);

        // 결과 파일 저장
        fs.writeFileSync('simple-converted-data.json', JSON.stringify(convertedData, null, 2));
        console.log('변환된 데이터를 simple-converted-data.json 파일에 저장했습니다.');

        // 배치로 업로드
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < convertedData.length; i += BATCH_SIZE) {
            const batch = convertedData.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            
            try {
                console.log(`배치 ${batchNumber} 업로드 중... (${batch.length}개 매물)`);
                
                const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(batch)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API 오류: ${response.status} - ${errorText}`);
                }
                
                successCount += batch.length;
                console.log(`배치 ${batchNumber} 업로드 성공 (${batch.length}개 매물)`);
            } catch (error) {
                errorCount += batch.length;
                console.error(`배치 ${batchNumber} 업로드 실패:`, error.message);
            }
            
            // 배치 사이에 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`업로드 완료: ${successCount}개 성공, ${errorCount}개 실패`);
    } catch (error) {
        console.error('데이터 처리 중 오류 발생:', error);
    }
}