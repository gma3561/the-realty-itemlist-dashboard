import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase 설정
const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzc2MjQxOCwiZXhwIjoyMDUzMzM4NDE4fQ.Ay9ksUHlxE2-PdVaQrqRAIdOqSTGHlNpE-Zp6PRHM8w';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV 파일과 관련 데이터를 정리하기 위한 매핑 함수들
const cleanPrice = (priceStr) => {
  if (!priceStr || priceStr === '-' || priceStr === '') return null;
  
  // "25억", "1억/900", "14억" 형태 처리
  const cleaned = priceStr.replace(/[,\s]/g, '');
  
  if (cleaned.includes('/')) {
    // 월세 형태: "1억/900" -> lease_price: 100000000, price: 9000000
    const [deposit, monthly] = cleaned.split('/');
    return {
      lease_price: parseKoreanAmount(deposit),
      price: parseKoreanAmount(monthly)
    };
  } else {
    // 단일 가격: "25억" -> price: 2500000000
    return {
      price: parseKoreanAmount(cleaned)
    };
  }
};

const parseKoreanAmount = (amountStr) => {
  if (!amountStr || amountStr === '-') return null;
  
  let amount = 0;
  const str = amountStr.toString();
  
  if (str.includes('억')) {
    const billions = parseFloat(str.replace(/억.*/, ''));
    amount += billions * 100000000;
  }
  
  if (str.includes('만')) {
    const start = str.includes('억') ? str.indexOf('억') + 1 : 0;
    const millions = parseFloat(str.substring(start).replace(/만.*/, ''));
    if (!isNaN(millions)) {
      amount += millions * 10000;
    }
  }
  
  // 숫자만 있는 경우 (만원 단위로 가정)
  if (!str.includes('억') && !str.includes('만') && !isNaN(parseFloat(str))) {
    amount = parseFloat(str) * 10000;
  }
  
  return amount || null;
};

const cleanArea = (areaStr) => {
  if (!areaStr || areaStr === '-') return null;
  
  // "137.46 / 122.97" 형태에서 공급면적 추출
  if (areaStr.includes('/')) {
    const supply = areaStr.split('/')[0].trim();
    return parseFloat(supply) || null;
  }
  
  return parseFloat(areaStr) || null;
};

const mapTransactionType = (거래유형) => {
  const mapping = {
    '매매': 1,
    '전세': 2,
    '월세': 3,
    '월세/렌트': 3,
    '분양': 4,
    '단기임대': 5
  };
  
  return mapping[거래유형] || 1; // 기본값: 매매
};

const mapPropertyType = (매물종류) => {
  const mapping = {
    '아파트': 1,
    '오피스텔': 2,
    '빌라/연립': 3,
    '빌라': 3,
    '연립': 3,
    '단독주택': 4,
    '상가': 5,
    '사무실': 6,
    '기타': 7
  };
  
  return mapping[매물종류] || 7; // 기본값: 기타
};

const mapPropertyStatus = (광고상태, 매물상태) => {
  // 광고상태나 매물상태를 기반으로 매핑
  if (매물상태 === '거래완료') return 3; // 거래완료
  if (광고상태 && 광고상태.includes('광고')) return 2; // 광고진행
  return 1; // 매물확보 (기본값)
};

// 더미 사용자 ID들 (하드코딩된 관리자들)
const managerIds = [
  'cec8266a-7bb4-4b4f-8b91-7c8a5c4d3e2f', // admin1
  'd9f4e6b3-2a8c-4f7e-9b5a-8c7d6e5f4g3h', // admin2  
  'e8a7b5c9-3d1f-4e6a-8c9b-7d6e5f4g3h2i'  // admin3
];

const getRandomManagerId = () => {
  return managerIds[Math.floor(Math.random() * managerIds.length)];
};

async function importCSVData() {
  console.log('CSV 데이터 임포트를 시작합니다...');
  
  const csvPath = '/System/Volumes/Data/Users/hasanghyeon/Downloads/고객연락처_표준화 - 장민아 정이든 장승환.csv';
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`총 ${results.length}개의 레코드를 읽었습니다.`);
        
        let successCount = 0;
        let errorCount = 0;
        
        // 처음 50개 레코드만 처리 (테스트용)
        const recordsToProcess = results.slice(0, 50);
        
        for (const row of recordsToProcess) {
          try {
            // 필수 필드 체크
            if (!row['소재지'] || !row['매물명']) {
              console.log('필수 필드 누락, 건너뜀:', row);
              continue;
            }
            
            // 가격 정보 처리
            const priceInfo = cleanPrice(row['금액']);
            const supplyArea = cleanArea(row['공급/전용(㎡)']);
            
            // 매물 데이터 구성
            const propertyData = {
              property_name: row['매물명'] || '매물명 미지정',
              location: row['소재지'] || '',
              property_type_id: mapPropertyType(row['매물종류']),
              transaction_type_id: mapTransactionType(row['거래유형']),
              property_status_id: mapPropertyStatus(row['광고상태'], row['매물상태']),
              price: priceInfo?.price || null,
              lease_price: priceInfo?.lease_price || null,
              supply_area_sqm: supplyArea,
              floor_info: row['해당층/총층'] || null,
              rooms_bathrooms: row['룸/욕실'] || null,
              direction: row['방향'] || null,
              maintenance_fee: row['관리비'] || null,
              parking: row['주차'] || null,
              move_in_date: row['입주가능일'] || null,
              building_approval_date: row['사용승인'] || null,
              special_notes: row['특이사항'] || null,
              manager_memo: row['담당자MEMO'] || null,
              manager_id: getRandomManagerId(),
              created_at: new Date().toISOString()
            };
            
            // 고객 정보가 있는 경우 JSON으로 저장
            if (row['거주자'] || row['소유주 연락처']) {
              propertyData.resident = JSON.stringify({
                customer_name: row['거주자'] || row['소유주(담당)'] || '',
                customer_phone: row['소유주 연락처'] || row['공동연락처'] || '',
                customer_notes: row['연락처관계'] || '',
                lease_type: row['임차유형'] || '',
                lease_amount: row['임차금액'] || '',
                contract_period: row['계약기간'] || ''
              });
            }
            
            // 데이터베이스에 삽입
            const { data, error } = await supabase
              .from('properties')
              .insert([propertyData])
              .select();
            
            if (error) {
              console.error('삽입 오류:', error);
              errorCount++;
            } else {
              console.log(`매물 삽입 성공: ${propertyData.property_name}`);
              successCount++;
            }
            
          } catch (err) {
            console.error('행 처리 오류:', err);
            errorCount++;
          }
        }
        
        console.log(`\n임포트 완료:`);
        console.log(`- 성공: ${successCount}개`);
        console.log(`- 실패: ${errorCount}개`);
        
        resolve({ success: successCount, errors: errorCount });
      })
      .on('error', reject);
  });
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  importCSVData()
    .then(() => {
      console.log('CSV 임포트가 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('CSV 임포트 중 오류 발생:', error);
      process.exit(1);
    });
}

export default importCSVData;