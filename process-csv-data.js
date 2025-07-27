/**
 * CSV 파일을 처리하여 Supabase에 업로드하기 위한 스크립트
 * 
 * 사용 방법:
 * 1. npm install csv-parser fs node-fetch
 * 2. node process-csv-data.js
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
    '빌라/연립': 'villa',
    '단독주택': 'house',
    '상가': 'commercial',
    '공동주택': 'villa' // 공동주택은 빌라/연립으로 매핑
};

const transactionTypeMap = {
    '매매': 'sale',
    '전세': 'lease',
    '월세': 'rent',
    '월세/렌트': 'rent',
    '렌트': 'rent',
    '급매': 'sale'
};

const propertyStatusMap = {
    '거래가능': 'available',
    '거래완료': 'completed',
    '거래보류': 'reserved'
};

// CSV 파일 경로
const csvFilePath = '/tmp/sample.csv';

// 결과 데이터 배열
const results = [];

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
        const convertedData = results.map((row) => {
            // 가격 처리 (매매/전세/월세 가격 분리)
            let salePrice = 0;
            let leasePrice = 0;
            let price = 0;
            
            if (row['거래유형']) {
                const transactionType = row['거래유형'].trim();
                const priceStr = row['금액'] ? row['금액'].trim() : '';
                
                if (transactionType === '매매' || transactionType === '급매') {
                    // 매매가 처리 (예: 25억, 45억(42억까지 가능))
                    const match = priceStr.match(/(\d+)억/);
                    if (match) {
                        salePrice = parseFloat(match[1]) * 100000000;
                    }
                } else if (transactionType === '전세') {
                    // 전세가 처리 (예: 14억)
                    const match = priceStr.match(/(\d+)억/);
                    if (match) {
                        leasePrice = parseFloat(match[1]) * 100000000;
                    }
                } else if (transactionType === '월세' || transactionType === '월세/렌트' || transactionType === '렌트') {
                    // 월세가 처리 (예: 1억/900, 3억/680)
                    const parts = priceStr.split('/');
                    if (parts.length === 2) {
                        // 보증금 처리
                        if (parts[0].includes('억')) {
                            const match = parts[0].match(/(\d+)억/);
                            if (match) {
                                leasePrice = parseFloat(match[1]) * 100000000;
                            }
                        } else {
                            leasePrice = parseFloat(parts[0].replace(/[^\d]/g, '')) || 0;
                        }
                        
                        // 월세 처리
                        price = parseFloat(parts[1].replace(/[^\d]/g, '')) * 10000; // 만원 단위를 원 단위로 변환
                    }
                }
            }
            
            // 면적 처리
            let supplyArea = 0;
            let privateArea = 0;
            
            if (row['공급/전용(㎡)']) {
                const areaParts = row['공급/전용(㎡)'].split('/');
                if (areaParts.length === 2) {
                    supplyArea = parseFloat(areaParts[0].trim()) || 0;
                    privateArea = parseFloat(areaParts[1].trim()) || 0;
                }
            }
            
            // 매물 상태 처리
            let propertyStatus = 'available';
            if (row['매물상태']) {
                propertyStatus = propertyStatusMap[row['매물상태'].trim()] || 'available';
            }
            
            // 매물 타입 처리
            let propertyType = 'apt';
            if (row['매물종류']) {
                propertyType = propertyTypeMap[row['매물종류'].trim()] || 'apt';
            }
            
            // 거래 타입 처리
            let transactionType = 'sale';
            if (row['거래유형']) {
                transactionType = transactionTypeMap[row['거래유형'].trim()] || 'sale';
            }
            
            // 층수 처리
            let floorInfo = '';
            if (row['해당층/총층']) {
                floorInfo = row['해당층/총층'].trim();
            }
            
            // 매물명 처리
            let propertyName = '';
            if (row['매물명']) {
                propertyName = row['매물명'].trim();
            } else if (row['소재지']) {
                propertyName = row['소재지'].trim(); // 매물명이 없으면 소재지를 사용
            }
            
            // 동/호 처리하여 매물명에 추가
            if (row['동'] && row['동'].trim() !== '-') {
                propertyName += ` ${row['동'].trim()}동`;
            }
            if (row['호'] && row['호'].trim() !== '-') {
                propertyName += ` ${row['호'].trim()}호`;
            }
            
            return {
                property_name: propertyName,
                location: row['소재지'] ? row['소재지'].trim() : '',
                building: row['동'] ? row['동'].trim() : '',
                unit: row['호'] ? row['호'].trim() : '',
                property_type_id: propertyType,
                property_status_id: propertyStatus,
                transaction_type_id: transactionType,
                property_type: row['매물종류'] ? row['매물종류'].trim() : '',
                property_status: row['매물상태'] ? row['매물상태'].trim() : '',
                transaction_type: row['거래유형'] ? row['거래유형'].trim() : '',
                sale_price: salePrice,
                lease_price: leasePrice,
                price: price,
                supply_area_sqm: supplyArea,
                private_area_sqm: privateArea,
                floor_info: floorInfo,
                rooms_bathrooms: row['룸/욕실'] ? row['룸/욕실'].trim() : '',
                direction: row['방향'] ? row['방향'].trim() : '',
                maintenance_fee: row['관리비'] ? row['관리비'].trim() : '',
                parking: row['주차'] ? row['주차'].trim() : '',
                move_in_date: row['입주가능일'] ? row['입주가능일'].trim() : '',
                approval_date: row['사용승인'] ? row['사용승인'].trim() : '',
                special_notes: row['특이사항'] ? row['특이사항'].trim() : '',
                manager_memo: row['담당자MEMO'] ? row['담당자MEMO'].trim() : '',
                manager_id: row['담당자'] ? row['담당자'].trim() : 'admin'
            };
        });

        console.log('데이터 변환 완료');
        console.log(`첫 번째 항목 샘플: ${JSON.stringify(convertedData[0], null, 2)}`);

        // 결과 파일 저장
        fs.writeFileSync('converted-data.json', JSON.stringify(convertedData, null, 2));
        console.log('변환된 데이터를 converted-data.json 파일에 저장했습니다.');

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