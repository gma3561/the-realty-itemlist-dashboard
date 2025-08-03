const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0ODI2MTQsImV4cCI6MjA1MTA1ODYxNH0.gCsX7a7s17MwSQvlFpOcjVo6p49Y8QgwQNa52LZ9ZL4';

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV 파일 경로
const CSV_FILE_PATH = '/Users/tere.remote/Desktop/더부동산 고객연락처.csv';

// 담당자 이름과 이메일 매핑
const MANAGER_EMAIL_MAP = {
  '서지혜': 'pjh@the-realty.co.kr',
  '서을선': 'ses@the-realty.co.kr',
  '김효석': 'khs@the-realty.co.kr',
  '정선혜': 'jsh@the-realty.co.kr'
};

// 룩업 테이블 데이터 캐시
let lookupCache = {
  propertyTypes: {},
  propertyStatuses: {},
  transactionTypes: {},
  users: {}
};

// 룩업 데이터 로드
async function loadLookupData() {
  try {
    // 매물종류
    const { data: propertyTypes } = await supabase
      .from('property_types')
      .select('id, name');
    propertyTypes?.forEach(type => {
      lookupCache.propertyTypes[type.name] = type.id;
    });

    // 진행상태
    const { data: propertyStatuses } = await supabase
      .from('property_statuses')
      .select('id, name');
    propertyStatuses?.forEach(status => {
      lookupCache.propertyStatuses[status.name] = status.id;
    });

    // 거래유형
    const { data: transactionTypes } = await supabase
      .from('transaction_types')
      .select('id, name');
    transactionTypes?.forEach(type => {
      lookupCache.transactionTypes[type.name] = type.id;
    });

    // 사용자
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name');
    users?.forEach(user => {
      lookupCache.users[user.email] = user.id;
    });

    console.log('✅ 룩업 데이터 로드 완료');
  } catch (error) {
    console.error('❌ 룩업 데이터 로드 실패:', error);
  }
}

// 가격 파싱 함수
function parsePrice(priceStr) {
  if (!priceStr || priceStr === '-') return null;
  
  // "60억 (미정)", "28억 (26억가능)" 형태 처리
  const cleanPrice = priceStr.replace(/\(.*?\)/g, '').trim();
  
  let totalPrice = 0;
  
  // 억 단위 파싱
  const eokMatch = cleanPrice.match(/(\d+)\s*억/);
  if (eokMatch) {
    totalPrice += parseInt(eokMatch[1]) * 100000000;
  }
  
  // 만원 단위 파싱
  const manMatch = cleanPrice.match(/(\d+)\s*만/);
  if (manMatch) {
    totalPrice += parseInt(manMatch[1]) * 10000;
  }
  
  return totalPrice || null;
}

// 면적 파싱 함수
function parseArea(areaStr, isPyeong = false) {
  if (!areaStr || areaStr === '-') return { supply: null, private: null };
  
  // "184.03㎡ / 171.7㎡" 또는 "55.66평 / 51.93평" 형태 처리
  const parts = areaStr.split('/').map(s => s.trim());
  if (parts.length !== 2) return { supply: null, private: null };
  
  const supplyMatch = parts[0].match(/(\d+\.?\d*)/);
  const privateMatch = parts[1].match(/(\d+\.?\d*)/);
  
  return {
    supply: supplyMatch ? parseFloat(supplyMatch[1]) : null,
    private: privateMatch ? parseFloat(privateMatch[1]) : null
  };
}

// 날짜 파싱 함수
function parseDate(dateStr) {
  if (!dateStr || dateStr === '-') return null;
  
  // "2025-08-02" 형태는 그대로 사용
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // "2025.08.02" 형태 처리
  if (dateStr.match(/^\d{4}\.\d{2}\.\d{2}$/)) {
    return dateStr.replace(/\./g, '-');
  }
  
  return null;
}

// CSV 행 변환 함수
async function transformRow(row) {
  const propertyData = {
    // 담당자
    manager_id: lookupCache.users[MANAGER_EMAIL_MAP[row['담당자']]] || null,
    
    // 광고 정보
    ad_status: row['광고상태'] === 'O' ? 'active' : 'inactive',
    temp_property_number: row['임시매물번호'] || null,
    registered_number: row['등록완료번호'] || null,
    registration_date: parseDate(row['등록일']),
    transaction_completed_date: parseDate(row['거래완료날짜']),
    
    // 매물 상태
    property_status_id: lookupCache.propertyStatuses[row['매물상태']] || null,
    
    // 위치 정보
    location: row['소재지'] || '',
    property_name: row['매물명'] || '',
    building: row['동'] || null,
    unit: row['호'] || null,
    
    // 매물 유형
    property_type_id: lookupCache.propertyTypes[row['매물종류']] || null,
    is_commercial: row['상가여부'] === 'O',
    transaction_type_id: lookupCache.transactionTypes[row['거래유형']] || null,
    
    // 가격 정보
    price: parsePrice(row['금액']),
    lease_price: parsePrice(row['임차금액']),
    
    // 면적 정보 (㎡)
    ...(() => {
      const sqmArea = parseArea(row['공급/전용(㎡)']);
      return {
        supply_area_sqm: sqmArea.supply,
        private_area_sqm: sqmArea.private
      };
    })(),
    
    // 면적 정보 (평)
    ...(() => {
      const pyeongArea = parseArea(row['공급/전용(평)'], true);
      return {
        supply_area_pyeong: pyeongArea.supply,
        private_area_pyeong: pyeongArea.private
      };
    })(),
    
    // 기타 정보
    floor_info: row['해당층/총층'] || null,
    rooms_bathrooms: row['룸/욕실'] || null,
    direction: row['방향'] || null,
    maintenance_fee: row['관리비'] || null,
    parking: row['주차'] || null,
    move_in_date: row['입주가능일'] || null,
    approval_date: parseDate(row['사용승인']),
    special_notes: row['특이사항'] || null,
    manager_memo: row['담당자MEMO'] || null,
    
    // 임차 정보
    resident: row['거주자'] || null,
    lease_type: row['임차유형'] || null
  };
  
  // 소유주 데이터
  const ownerData = null; // 소유주 정보가 비어있으면 null
  if (row['소유주(담당)']) {
    ownerData = {
      name: row['소유주(담당)'],
      id_number: row['주민(법인)등록번호'] || null,
      phone: row['소유주 연락처'] || null,
      contact_relation: row['연락처 관계'] || null
    };
  }
  
  // 공동중개 데이터
  const coBrokerData = null; // 공동중개 정보가 비어있으면 null
  if (row['공동중개']) {
    coBrokerData = {
      broker_name: row['공동중개'],
      broker_contact: row['공동연락처'] || null
    };
  }
  
  return { propertyData, ownerData, coBrokerData };
}

// 메인 import 함수
async function importCsvData() {
  console.log('🚀 CSV 데이터 import 시작...');
  
  // 룩업 데이터 로드
  await loadLookupData();
  
  const results = [];
  let rowCount = 0;
  let successCount = 0;
  let errorCount = 0;
  
  // CSV 파일 읽기
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      results.push(row);
    })
    .on('end', async () => {
      console.log(`📄 총 ${results.length}개의 행을 읽었습니다.`);
      
      for (const row of results) {
        rowCount++;
        
        try {
          const { propertyData, ownerData, coBrokerData } = await transformRow(row);
          
          // 소유주 저장 (있는 경우)
          let ownerId = null;
          if (ownerData) {
            const { data: owner, error: ownerError } = await supabase
              .from('owners')
              .insert(ownerData)
              .select()
              .single();
            
            if (ownerError) {
              console.error(`❌ 소유주 저장 실패 (행 ${rowCount}):`, ownerError);
            } else {
              ownerId = owner.id;
            }
          }
          
          // 매물 저장
          if (ownerId) {
            propertyData.owner_id = ownerId;
          }
          
          const { data: property, error: propertyError } = await supabase
            .from('properties')
            .insert(propertyData)
            .select()
            .single();
          
          if (propertyError) {
            console.error(`❌ 매물 저장 실패 (행 ${rowCount}):`, propertyError);
            errorCount++;
          } else {
            console.log(`✅ 매물 저장 성공: ${propertyData.property_name}`);
            successCount++;
            
            // 공동중개 저장 (있는 경우)
            if (coBrokerData && property) {
              coBrokerData.property_id = property.id;
              const { error: coBrokerError } = await supabase
                .from('co_brokers')
                .insert(coBrokerData);
              
              if (coBrokerError) {
                console.error(`❌ 공동중개 저장 실패:`, coBrokerError);
              }
            }
          }
          
        } catch (error) {
          console.error(`❌ 행 ${rowCount} 처리 중 오류:`, error);
          errorCount++;
        }
      }
      
      console.log('\n📊 Import 완료!');
      console.log(`✅ 성공: ${successCount}개`);
      console.log(`❌ 실패: ${errorCount}개`);
      console.log(`📄 전체: ${rowCount}개`);
    })
    .on('error', (error) => {
      console.error('❌ CSV 파일 읽기 오류:', error);
    });
}

// 스크립트 실행
if (require.main === module) {
  importCsvData().catch(console.error);
}

module.exports = { importCsvData };