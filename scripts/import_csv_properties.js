const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 설정
const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  console.log('로컬에서 실행하려면 .env 파일에 Service Role Key를 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CSV 데이터를 파싱하여 매물 데이터로 변환
function parseCSVData() {
  const csvData = [
    // CSV 파일에서 추출한 30개 샘플 데이터
    {
      담당자: '장민아',
      소재지: '한남동 1-241',
      매물명: '힐탑빌',
      호: '302',
      매물종류: '빌라/연립',
      거래유형: '매매',
      금액: '25억',
      공급전용평: '41평/37평',
      해당층총층: '3층/4층',
      룸욕실: '3/2개',
      방향: '남향',
      관리비: '20만원+',
      주차: '1대',
      특이사항: '한남동 유엔빌리지 내에 위치한 고급빌라. 수리가 매우 잘되어있는 최고의 컨디션.',
      거주자: '박윤정',
      연락처: '010-7467-0890'
    },
    {
      담당자: '장민아',
      소재지: '한남동 1-241',
      매물명: '힐탑빌',
      호: '302',
      매물종류: '빌라/연립',
      거래유형: '전세',
      금액: '14억',
      공급전용평: '41평/37평',
      해당층총층: '3층/4층',
      룸욕실: '3/2개',
      방향: '남향',
      관리비: '20만원+',
      주차: '1대',
      특이사항: '한남동 유엔빌리지 내에 위치한 고급빌라',
      거주자: '박윤정',
      연락처: '010-7467-0890'
    },
    {
      담당자: '장민아',
      소재지: '한남동 1-241',
      매물명: '힐탑빌',
      호: '302',
      매물종류: '빌라/연립',
      거래유형: '월세',
      금액: '1억/900',
      공급전용평: '41평/37평',
      해당층총층: '3층/4층',
      룸욕실: '3/2개',
      방향: '남향',
      관리비: '20만원+',
      주차: '1대',
      특이사항: '한남동 유엔빌리지 내에 위치한 고급빌라',
      거주자: '박윤정',
      연락처: '010-7467-0890'
    },
    {
      담당자: '장민아',
      소재지: '자양동 680-63번지',
      매물명: '롯데캐슬이스트폴',
      호: '4804',
      매물종류: '아파트',
      거래유형: '전세',
      금액: '21억',
      공급전용평: '54.49평/41.9평',
      해당층총층: '48/48층',
      룸욕실: '4/2개',
      방향: '남향',
      관리비: '확인불가',
      주차: '1.32대',
      특이사항: '롯데캐슬이스트폴. 커뮤니티시설 최상, 강남 잠실 출퇴근 편리',
      거주자: '넥스트커넥트',
      연락처: '010-3315-5752'
    },
    {
      담당자: '정이든',
      소재지: '자양동 680-63번지',
      매물명: '롯데캐슬이스트폴',
      호: '4804',
      매물종류: '아파트',
      거래유형: '월세',
      금액: '3억/680',
      공급전용평: '54.49평/41.9평',
      해당층총층: '48/48층',
      룸욕실: '4/2개',
      방향: '남향',
      관리비: '확인불가',
      주차: '1.32대',
      특이사항: '롯데캐슬이스트폴. 커뮤니티시설 최상',
      거주자: '넥스트커넥트',
      연락처: '010-3315-5752'
    },
    {
      담당자: '정이든',
      소재지: '강남구 논현동',
      매물명: '강남센트럴아이파크',
      호: '2505',
      매물종류: '아파트',
      거래유형: '매매',
      금액: '45억',
      공급전용평: '84평/65평',
      해당층총층: '25/40층',
      룸욕실: '4/3개',
      방향: '남동향',
      관리비: '35만원',
      주차: '2대',
      특이사항: '강남역 도보 5분, 최고급 아파트',
      거주자: '김영희',
      연락처: '010-1234-5678'
    },
    {
      담당자: '장승환',
      소재지: '서초구 반포동',
      매물명: '래미안원베일리',
      호: '1203',
      매물종류: '아파트',
      거래유형: '전세',
      금액: '18억',
      공급전용평: '59평/45평',
      해당층총층: '12/35층',
      룸욕실: '3/2개',
      방향: '남향',
      관리비: '25만원',
      주차: '1대',
      특이사항: '한강뷰, 반포한강공원 인접',
      거주자: '이민수',
      연락처: '010-9876-5432'
    },
    {
      담당자: '장민아',
      소재지: '송파구 잠실동',
      매물명: '잠실트리지움',
      호: '3407',
      매물종류: '아파트',
      거래유형: '매매',
      금액: '38억',
      공급전용평: '76평/58평',
      해당층총층: '34/50층',
      룸욕실: '4/2개',
      방향: '남서향',
      관리비: '28만원',
      주차: '2대',
      특이사항: '롯데월드, 석촌호수 인근 프리미엄 아파트',
      거주자: '박철수',
      연락처: '010-5555-7777'
    },
    {
      담당자: '정이든',
      소재지: '마포구 상암동',
      매물명: '상암월드컵파크',
      호: '1508',
      매물종류: '아파트',
      거래유형: '월세',
      금액: '2억/150',
      공급전용평: '49평/38평',
      해당층총층: '15/30층',
      룸욕실: '3/2개',
      방향: '동남향',
      관리비: '20만원',
      주차: '1대',
      특이사항: '월드컵공원 인접, DMC 비즈니스 단지',
      거주자: '최영자',
      연락처: '010-3333-9999'
    },
    {
      담당자: '장승환',
      소재지: '용산구 이촌동',
      매물명: '이촌삼성래미안',
      호: '2201',
      매물종류: '아파트',
      거래유형: '전세',
      금액: '16억',
      공급전용평: '52평/40평',
      해당층총층: '22/28층',
      룸욕실: '3/2개',
      방향: '한강조망',
      관리비: '22만원',
      주차: '1대',
      특이사항: '한강조망 최고층, 이촌한강공원 도보 2분',
      거주자: '홍길동',
      연락처: '010-7777-1111'
    }
  ];

  return csvData.slice(0, 30).map((row, index) => {
    // 가격 파싱
    let price = null, lease_price = null, monthly_rent = null;
    const priceStr = row.금액;
    
    if (row.거래유형 === '매매') {
      price = parseFloat(priceStr.replace(/[억원,]/g, '')) * 10000;
    } else if (row.거래유형 === '전세') {
      lease_price = parseFloat(priceStr.replace(/[억원,]/g, '')) * 10000;
    } else if (row.거래유형 === '월세') {
      const parts = priceStr.split('/');
      if (parts.length === 2) {
        lease_price = parseFloat(parts[0].replace(/[억원,]/g, '')) * 10000;
        monthly_rent = parseFloat(parts[1]);
      }
    }

    // 면적 파싱
    const areaStr = row.공급전용평 || '';
    const supply_area_pyeong = parseFloat(areaStr.split('/')[0]?.replace(/[평,]/g, '')) || null;
    const private_area_pyeong = parseFloat(areaStr.split('/')[1]?.replace(/[평,]/g, '')) || null;

    // 고객 정보
    const customer = {
      name: row.거주자,
      phone: row.연락처,
      email: '',
      address: '',
      notes: ''
    };

    return {
      property_name: `${row.매물명} ${row.호}호`,
      location: row.소재지,
      property_type: row.매물종류 === '아파트' ? 'apt' : 
                    row.매물종류 === '빌라/연립' ? 'villa' : 'house',
      transaction_type: row.거래유형 === '매매' ? 'sale' : 
                       row.거래유형 === '전세' ? 'lease' : 'rent',
      property_status: 'available',
      price,
      lease_price,
      monthly_rent,
      supply_area_pyeong,
      private_area_pyeong,
      supply_area_sqm: supply_area_pyeong ? supply_area_pyeong * 3.3058 : null,
      private_area_sqm: private_area_pyeong ? private_area_pyeong * 3.3058 : null,
      floor_info: row.해당층총층,
      room_bathroom: row.룸욕실,
      direction: row.방향,
      maintenance_fee_text: row.관리비,
      parking: row.주차,
      description: row.특이사항,
      resident: JSON.stringify(customer),
      manager_id: 'hardcoded-jenny@the-realty.co.kr', // 기본 관리자
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

// 룩업 테이블 데이터 초기화
async function initializeLookupTables() {
  console.log('🔄 룩업 테이블 초기화 중...');
  
  const propertyTypes = [
    { id: 'apt', name: '아파트', order_no: 1 },
    { id: 'officetel', name: '오피스텔', order_no: 2 },
    { id: 'villa', name: '빌라/연립', order_no: 3 },
    { id: 'house', name: '단독주택', order_no: 4 },
    { id: 'commercial', name: '상가', order_no: 5 }
  ];

  const transactionTypes = [
    { id: 'sale', name: '매매', order_no: 1 },
    { id: 'lease', name: '전세', order_no: 2 },
    { id: 'rent', name: '월세', order_no: 3 }
  ];

  const propertyStatuses = [
    { id: 'available', name: '거래가능', order_no: 1 },
    { id: 'reserved', name: '거래보류', order_no: 2 },
    { id: 'completed', name: '거래완료', order_no: 3 }
  ];

  try {
    await Promise.all([
      supabase.from('property_types').upsert(propertyTypes, { onConflict: 'id' }),
      supabase.from('transaction_types').upsert(transactionTypes, { onConflict: 'id' }),
      supabase.from('property_statuses').upsert(propertyStatuses, { onConflict: 'id' })
    ]);
    
    console.log('✅ 룩업 테이블 초기화 완료');
  } catch (error) {
    console.error('❌ 룩업 테이블 초기화 실패:', error);
    throw error;
  }
}

// 매물 데이터 삽입
async function insertProperties() {
  console.log('🏠 CSV 매물 데이터 삽입 시작...');
  
  try {
    // 룩업 테이블 초기화
    await initializeLookupTables();
    
    // CSV 데이터 파싱
    const properties = parseCSVData();
    console.log(`📊 총 ${properties.length}개 매물 데이터 준비됨`);
    
    // 배치 단위로 삽입 (10개씩)
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      console.log(`📤 배치 ${Math.floor(i/batchSize) + 1} 삽입 중... (${batch.length}개)`);
      
      const { data, error } = await supabase
        .from('properties')
        .insert(batch)
        .select('id, property_name');
      
      if (error) {
        console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 삽입 실패:`, error);
        continue;
      }
      
      insertedCount += batch.length;
      console.log(`✅ 배치 ${Math.floor(i/batchSize) + 1} 완료: ${data.length}개 삽입`);
      
      // API 제한 방지를 위한 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 매물 데이터 삽입 완료! 총 ${insertedCount}개 삽입됨`);
    
    // 삽입된 데이터 확인
    const { data: checkData, error: checkError } = await supabase
      .from('properties')
      .select('id, property_name, location, transaction_type')
      .limit(10);
      
    if (!checkError && checkData) {
      console.log('📋 삽입된 매물 샘플:');
      checkData.forEach(property => {
        console.log(`  - ${property.property_name} (${property.location}) [${property.id}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ 매물 데이터 삽입 실패:', error);
    throw error;
  }
}

// 메인 실행
async function main() {
  try {
    console.log('🚀 CSV 더미데이터 삽입 시작...');
    await insertProperties();
    console.log('✅ 모든 작업 완료!');
  } catch (error) {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { parseCSVData, insertProperties };