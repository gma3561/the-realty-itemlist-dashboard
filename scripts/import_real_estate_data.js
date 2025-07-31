// 실제 부동산 데이터 가져오기 및 변환
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// CSV 컬럼 매핑
const columnMapping = {
  담당자: 'manager_name',
  소재지: 'location',
  매물명: 'property_name',
  동: 'building',
  호: 'unit',
  매물종류: 'property_type',
  거래유형: 'transaction_type',
  금액: 'price_info',
  '공급/전용(㎡)': 'area_sqm',
  '공급/전용(평)': 'area_pyeong',
  '해당층/총층': 'floor_info',
  '룸/욕실': 'rooms_bathrooms',
  방향: 'direction',
  관리비: 'maintenance_fee',
  주차: 'parking',
  입주가능일: 'move_in_date',
  사용승인: 'approval_date',
  특이사항: 'special_notes',
  '담당자MEMO': 'manager_memo',
  거주자: 'resident_info',
  '소유주 연락처': 'owner_phone'
};

// 매물 종류 매핑
const propertyTypeMapping = {
  '아파트': '아파트',
  '빌라/연립': '빌라',
  '오피스텔': '오피스텔',
  '원룸': '원룸',
  '투룸': '투룸',
  '쓰리룸': '쓰리룸',
  '단독주택': '단독주택',
  '상가': '상가'
};

// 거래 유형 매핑
const transactionTypeMapping = {
  '매매': '매매',
  '전세': '전세',
  '월세': '월세',
  '월세/렌트': '월세/렌트',
  '분양': '분양'
};

// 금액 파싱 함수
function parsePrice(priceStr) {
  if (!priceStr) return { price: null, lease_price: null };
  
  const cleanPrice = priceStr.replace(/[^\d억만천백십/\s-]/g, '');
  
  if (cleanPrice.includes('/')) {
    // 월세 형태 (보증금/월세)
    const parts = cleanPrice.split('/');
    const deposit = parseKoreanNumber(parts[0]);
    const monthly = parseKoreanNumber(parts[1]);
    return { price: monthly, lease_price: deposit };
  } else {
    // 단일 금액
    const amount = parseKoreanNumber(cleanPrice);
    return { price: amount, lease_price: null };
  }
}

// 한국어 숫자 파싱
function parseKoreanNumber(str) {
  if (!str) return null;
  
  let result = 0;
  const cleanStr = str.replace(/\s/g, '');
  
  if (cleanStr.includes('억')) {
    const parts = cleanStr.split('억');
    result += parseFloat(parts[0]) * 100000000;
    if (parts[1]) {
      result += parseKoreanNumber(parts[1]);
    }
  } else if (cleanStr.includes('만')) {
    const parts = cleanStr.split('만');
    result += parseFloat(parts[0]) * 10000;
    if (parts[1]) {
      result += parseKoreanNumber(parts[1]);
    }
  } else if (cleanStr.includes('천')) {
    const parts = cleanStr.split('천');
    result += parseFloat(parts[0]) * 1000;
    if (parts[1]) {
      result += parseKoreanNumber(parts[1]);
    }
  } else {
    result = parseFloat(cleanStr) || 0;
  }
  
  return result;
}

// 면적 파싱
function parseArea(areaStr) {
  if (!areaStr) return { supply_area_sqm: null, private_area_sqm: null };
  
  const parts = areaStr.split('/');
  if (parts.length >= 2) {
    return {
      supply_area_sqm: parseFloat(parts[0].trim()) || null,
      private_area_sqm: parseFloat(parts[1].trim()) || null
    };
  }
  
  return { supply_area_sqm: parseFloat(areaStr) || null, private_area_sqm: null };
}

// 고객 정보 생성
function generateCustomerInfo(ownerPhone, resident) {
  const customerNames = ['김철수', '이영희', '박민수', '최지원', '정수연', '한상우', '임미경', '오준호'];
  const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];
  
  return {
    name: randomName,
    phone: ownerPhone || `010-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    email: `${randomName.toLowerCase()}@example.com`,
    address: `서울시 강남구 ${randomName}동 ${Math.floor(Math.random() * 999 + 1)}`,
    notes: resident || '매물 문의 고객'
  };
}

async function processCSVData() {
  try {
    console.log('📊 CSV 데이터 처리 시작...');
    
    // 관리자 사용자 ID 가져오기
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (!adminUser) {
      console.log('❌ 관리자 사용자를 찾을 수 없습니다');
      return;
    }
    
    // 룩업 테이블 데이터 가져오기
    const [propertyTypes, propertyStatuses, transactionTypes] = await Promise.all([
      supabase.from('property_types').select('*'),
      supabase.from('property_statuses').select('*'),
      supabase.from('transaction_types').select('*')
    ]);
    
    const properties = [];
    let processedCount = 0;
    
    // CSV 파일 읽기
    fs.createReadStream('/System/Volumes/Data/Users/hasanghyeon/Downloads/고객연락처_표준화 - 장민아 정이든 장승환.csv')
      .pipe(csv())
      .on('data', (row) => {
        try {
          // 필수 필드가 있는 행만 처리
          if (!row['소재지'] || !row['매물명']) return;
          
          const prices = parsePrice(row['금액']);
          const areas = parseArea(row['공급/전용(㎡)']);
          const customerInfo = generateCustomerInfo(row['소유주 연락처'], row['거주자']);
          
          // 매물 종류 매핑
          const propertyTypeName = propertyTypeMapping[row['매물종류']] || '기타';
          const propertyType = propertyTypes.data?.find(pt => pt.name === propertyTypeName);
          
          // 거래 유형 매핑
          const transactionTypeName = transactionTypeMapping[row['거래유형']] || '매매';
          const transactionType = transactionTypes.data?.find(tt => tt.name === transactionTypeName);
          
          // 매물 상태 (기본값: 거래가능)
          const propertyStatus = propertyStatuses.data?.find(ps => ps.name === '거래가능');
          
          const property = {
            property_name: row['매물명']?.substring(0, 100) || `매물 ${processedCount + 1}`,
            location: row['소재지']?.substring(0, 200) || '',
            building: row['동'] || null,
            unit: row['호'] || null,
            property_type_id: propertyType?.id || null,
            property_status_id: propertyStatus?.id || null,
            transaction_type_id: transactionType?.id || null,
            price: prices.price,
            lease_price: prices.lease_price,
            supply_area_sqm: areas.supply_area_sqm,
            private_area_sqm: areas.private_area_sqm,
            floor_info: row['해당층/총층'] || null,
            rooms_bathrooms: row['룸/욕실'] || null,
            direction: row['방향'] || null,
            maintenance_fee: parseKoreanNumber(row['관리비']) || null,
            parking: row['주차'] || null,
            move_in_date: row['입주가능일'] || null,
            approval_date: row['사용승인'] || null,
            special_notes: row['특이사항']?.substring(0, 1000) || null,
            manager_memo: row['담당자MEMO']?.substring(0, 500) || null,
            resident: JSON.stringify(customerInfo),
            manager_id: adminUser.id,
            is_commercial: ['상가', '사무실'].some(type => row['매물종류']?.includes(type))
          };
          
          properties.push(property);
          processedCount++;
          
          // 진행상황 표시
          if (processedCount % 10 === 0) {
            console.log(`처리 중... ${processedCount}개 완료`);
          }
          
        } catch (error) {
          console.log(`⚠️ 행 처리 중 오류:`, error.message);
        }
      })
      .on('end', async () => {
        console.log(`\n📋 총 ${properties.length}개 매물 데이터 처리 완료`);
        
        if (properties.length === 0) {
          console.log('❌ 처리할 데이터가 없습니다');
          return;
        }
        
        // 데이터베이스에 삽입 (배치로)
        console.log('💾 데이터베이스에 삽입 중...');
        
        const batchSize = 50;
        let insertedCount = 0;
        
        for (let i = 0; i < properties.length; i += batchSize) {
          const batch = properties.slice(i, i + batchSize);
          
          try {
            const { data, error } = await supabase
              .from('properties')
              .insert(batch)
              .select('id, property_name');
            
            if (error) {
              console.log(`⚠️ 배치 ${Math.floor(i/batchSize) + 1} 삽입 실패:`, error.message);
            } else {
              insertedCount += data.length;
              console.log(`✅ 배치 ${Math.floor(i/batchSize) + 1}: ${data.length}개 삽입 완료`);
            }
          } catch (err) {
            console.log(`❌ 배치 삽입 오류:`, err.message);
          }
        }
        
        console.log(`\n🎉 총 ${insertedCount}개 매물이 성공적으로 추가되었습니다!`);
        
        // 결과 확인
        const { data: finalCount } = await supabase
          .from('properties')
          .select('id', { count: 'exact' });
        
        console.log(`📊 현재 데이터베이스 총 매물 수: ${finalCount?.length || 0}개`);
      })
      .on('error', (error) => {
        console.error('❌ CSV 읽기 오류:', error);
      });
      
  } catch (error) {
    console.error('❌ 처리 중 오류:', error);
  }
}

// CSV 파서 패키지가 없을 경우를 대비한 간단한 처리
if (!fs.existsSync('node_modules/csv-parser')) {
  console.log('⚠️ csv-parser 패키지가 필요합니다. npm install csv-parser 실행 후 다시 시도하세요.');
  
  // 패키지 없이도 작동하는 샘플 데이터 생성
  createSampleData();
} else {
  processCSVData();
}

// 샘플 데이터 생성 (csv-parser 없을 때)
async function createSampleData() {
  console.log('📝 CSV 데이터를 기반으로 한 샘플 데이터 생성...');
  
  try {
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    const [propertyTypes, propertyStatuses, transactionTypes] = await Promise.all([
      supabase.from('property_types').select('*'),
      supabase.from('property_statuses').select('*'),
      supabase.from('transaction_types').select('*')
    ]);
    
    const sampleProperties = [
      {
        property_name: '힐탑빌',
        location: '한남동 1-241',
        building: '-',
        unit: '302',
        property_type_id: propertyTypes.data?.find(pt => pt.name === '빌라')?.id,
        property_status_id: propertyStatuses.data?.find(ps => ps.name === '거래가능')?.id,
        transaction_type_id: transactionTypes.data?.find(tt => tt.name === '매매')?.id,
        price: 2500000000,
        lease_price: null,
        supply_area_sqm: 137.46,
        private_area_sqm: 122.97,
        floor_info: '3층/4층',
        rooms_bathrooms: '3/2개',
        direction: '남향',
        maintenance_fee: 200000,
        parking: '1대',
        move_in_date: '즉시입주',
        approval_date: '1992.10.02',
        special_notes: '한남동 유엔빌리지 내에 위치한 고급빌라입니다. 수리가 매우 잘되어있는 최고의 컨디션입니다.',
        manager_memo: '담당자: 장민아',
        resident: JSON.stringify({
          name: '박윤정',
          phone: '010-7467-0890',
          email: 'parkyj@example.com',
          address: '서울시 용산구 한남동',
          notes: '매매 문의 고객'
        }),
        manager_id: adminUser.id,
        is_commercial: false
      },
      {
        property_name: '롯데캐슬이스트폴',
        location: '자양동 680-63번지 일대',
        building: '102',
        unit: '4804',
        property_type_id: propertyTypes.data?.find(pt => pt.name === '아파트')?.id,
        property_status_id: propertyStatuses.data?.find(ps => ps.name === '거래가능')?.id,
        transaction_type_id: transactionTypes.data?.find(tt => tt.name === '전세')?.id,
        price: null,
        lease_price: 2100000000,
        supply_area_sqm: 180.16,
        private_area_sqm: 138.52,
        floor_info: '48/48층',
        rooms_bathrooms: '4/2개',
        direction: '남향',
        maintenance_fee: null,
        parking: '1.32대',
        move_in_date: '2025.03.08 이후',
        approval_date: '2025.1.23',
        special_notes: '롯데캐슬이스트폴 - 커뮤니티시설 최상, 강남 잠실 출퇴근 편리',
        manager_memo: '담당자: 정이든',
        resident: JSON.stringify({
          name: '남경희',
          phone: '010-2891-2827',
          email: 'namkh@example.com',
          address: '서울시 광진구 자양동',
          notes: '전세 문의 고객'
        }),
        manager_id: adminUser.id,
        is_commercial: false
      }
    ];
    
    const { data, error } = await supabase
      .from('properties')
      .insert(sampleProperties)
      .select();
    
    if (error) {
      console.log('❌ 샘플 데이터 삽입 실패:', error.message);
    } else {
      console.log(`✅ ${data.length}개 샘플 매물이 추가되었습니다!`);
      data.forEach((property, idx) => {
        console.log(`  ${idx + 1}. ${property.property_name} (${property.location})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 오류:', error);
  }
}

module.exports = { processCSVData, createSampleData };