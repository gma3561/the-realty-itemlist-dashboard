const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 .env 파일에 설정되어 있어야 합니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 직원 이메일-이름 매핑
const realtorMapping = {
  '김규민': { email: 'gyum@the-realty.co.kr', role: 'staff' },
  '하상현': { email: 'lucas@the-realty.co.kr', role: 'staff' },
  '정서연': { email: 'yool@the-realty.co.kr', role: 'staff' },
  '정선혜': { email: 'grace@the-realty.co.kr', role: 'staff' },
  '박소현': { email: 'sso@the-realty.co.kr', role: 'staff' },
  '정연서': { email: 'jenny@the-realty.co.kr', role: 'admin' }, // 대표
  '송영주': { email: 'joo@the-realty.co.kr', role: 'staff' },
  '정윤식': { email: 'yun@the-realty.co.kr', role: 'staff' },
  '성은미': { email: 'mimi@the-realty.co.kr', role: 'staff' },
  '서을선': { email: 'sun@the-realty.co.kr', role: 'staff' },
  '서지혜': { email: 'kylie@the-realty.co.kr', role: 'staff' },
  '이혜만': { email: 'hmlee@the-realty.co.kr', role: 'staff' },
  '김효석': { email: 'seok@the-realty.co.kr', role: 'staff' }
};

async function getLookupIds() {
  console.log('📌 룩업 테이블 ID 조회 중...');
  
  // 매물 유형 조회
  const { data: propertyTypes } = await supabase
    .from('property_types')
    .select('id, name');
  
  const propertyTypeMap = {};
  propertyTypes?.forEach(pt => {
    switch(pt.name) {
      case '아파트': propertyTypeMap['APARTMENT'] = pt.id; break;
      case '오피스텔': propertyTypeMap['OFFICETEL'] = pt.id; break;
      case '빌라/연립': propertyTypeMap['VILLA'] = pt.id; break;
      case '단독주택': propertyTypeMap['HOUSE'] = pt.id; break;
      case '상가': propertyTypeMap['COMMERCIAL'] = pt.id; break;
      case '주상복합': propertyTypeMap['MIXED_USE'] = pt.id; break;
    }
  });

  // 거래 유형 조회
  const { data: transactionTypes } = await supabase
    .from('transaction_types')
    .select('id, name');
  
  const transactionTypeMap = {};
  transactionTypes?.forEach(tt => {
    switch(tt.name) {
      case '매매': transactionTypeMap['SALE'] = tt.id; break;
      case '전세': 
        transactionTypeMap['LEASE'] = tt.id; 
        transactionTypeMap['JEONSE'] = tt.id; 
        break;
      case '월세': transactionTypeMap['RENT'] = tt.id; break;
    }
  });

  // 매물 상태 조회
  const { data: propertyStatuses } = await supabase
    .from('property_statuses')
    .select('id, name');
  
  const propertyStatusMap = {};
  propertyStatuses?.forEach(ps => {
    switch(ps.name) {
      case '거래가능': propertyStatusMap['ACTIVE'] = ps.id; break;
      case '거래보류': propertyStatusMap['HOLD'] = ps.id; break;
      case '거래완료': propertyStatusMap['COMPLETED'] = ps.id; break;
    }
  });

  return { propertyTypeMap, transactionTypeMap, propertyStatusMap };
}

async function createOrGetUsers() {
  console.log('📌 Step 1: 사용자 계정 확인 및 생성 중...');
  const userIds = {};
  
  // 먼저 기존 사용자 조회
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, email, name');
  
  // 이메일로 매핑 생성
  const emailToId = {};
  existingUsers?.forEach(user => {
    emailToId[user.email] = user.id;
    // 이름으로도 매핑
    Object.entries(realtorMapping).forEach(([name, info]) => {
      if (info.email === user.email) {
        userIds[name] = user.id;
      }
    });
  });
  
  // 없는 사용자만 생성
  for (const [name, info] of Object.entries(realtorMapping)) {
    if (!userIds[name]) {
      try {
        // auth.users에 사용자 생성
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: info.email,
          password: 'TheRealty2025!',
          email_confirm: true,
          user_metadata: {
            name: name,
            role: info.role
          }
        });

        if (authError) {
          console.error(`❌ ${name} 계정 생성 실패:`, authError.message);
        } else if (authData && authData.user) {
          userIds[name] = authData.user.id;
          console.log(`✅ 새 사용자 생성: ${name} (${info.email})`);
        }
      } catch (error) {
        console.error(`❌ ${name} 처리 중 오류:`, error);
      }
    } else {
      console.log(`✅ 기존 사용자 확인: ${name} (${info.email})`);
    }
  }
  
  return userIds;
}

async function migrateProperties(userIds, lookupIds) {
  console.log('\n📌 Step 2: 매물 데이터 마이그레이션 중...');
  
  // 정제된 데이터 읽기
  const cleanedDataPath = path.join(__dirname, '..', 'cleaned_properties_2025-08-03.json');
  const cleanedProperties = JSON.parse(fs.readFileSync(cleanedDataPath, 'utf-8'));
  
  let successCount = 0;
  let failCount = 0;
  const batchSize = 50;
  
  // 기존 매물 삭제 옵션 (주의!)
  console.log('\n⚠️  기존 매물 데이터를 삭제하시겠습니까? (위험!)');
  // 실제로는 사용자 확인이 필요하지만, 여기서는 건너뜁니다.
  
  for (let i = 0; i < cleanedProperties.length; i += batchSize) {
    const batch = cleanedProperties.slice(i, i + batchSize);
    const propertiesToInsert = [];
    
    for (const property of batch) {
      // 담당자 UUID 찾기
      let managerId = null;
      if (property.manager_name && userIds[property.manager_name]) {
        managerId = userIds[property.manager_name];
      } else {
        // 담당자가 없거나 찾을 수 없으면 정연서(대표)에게 배정
        managerId = userIds['정연서'];
      }
      
      // 거래 유형에 따른 가격 처리
      let transactionTypeId = lookupIds.transactionTypeMap[property.transaction_type];
      let price = null;
      let leasePrice = null;
      
      if (property.transaction_type === 'SALE') {
        price = property.sale_price;
      } else if (property.transaction_type === 'LEASE' || property.transaction_type === 'JEONSE') {
        // 전세는 lease_price 필드에 저장
        leasePrice = property.jeonse_deposit;
        price = property.jeonse_deposit; // price 필드에도 저장
      } else if (property.transaction_type === 'RENT') {
        // 월세는 보증금과 월세 분리
        leasePrice = property.monthly_deposit || 0;
        price = property.monthly_rent;
      }
      
      // 방/욕실 정보
      let roomsBathrooms = '';
      if (property.rooms && property.bathrooms) {
        roomsBathrooms = `방${property.rooms}개/욕실${property.bathrooms}개`;
      } else if (property.bathrooms) {
        roomsBathrooms = `방${property.bathrooms}개`;
      }
      
      // 층 정보
      let floorInfo = '';
      if (property.floor && property.total_floors) {
        floorInfo = `${property.floor}/${property.total_floors}`;
      } else if (property.floor) {
        floorInfo = `${property.floor}`;
      }
      
      const propertyData = {
        property_name: property.property_name || `${property.building_name || property.location}`.trim(),
        location: property.location || '',
        building: property.building_name || '',
        unit: property.unit_number || '',
        property_type_id: lookupIds.propertyTypeMap[property.property_type] || lookupIds.propertyTypeMap['APARTMENT'],
        transaction_type_id: transactionTypeId,
        property_status_id: lookupIds.propertyStatusMap[property.property_status || 'ACTIVE'],
        price: price,
        lease_price: leasePrice,
        supply_area_pyeong: property.area_pyeong || null,
        private_area_pyeong: property.area_pyeong ? Math.round(property.area_pyeong * 0.85) : null,
        supply_area_sqm: property.area_m2 || null,
        private_area_sqm: property.area_m2 ? Math.round(property.area_m2 * 0.85) : null,
        floor_info: floorInfo,
        rooms_bathrooms: roomsBathrooms,
        direction: property.direction || null,
        maintenance_fee: property.maintenance_fee ? `${Math.round(property.maintenance_fee / 10000)}만원` : null,
        parking: property.parking || null,
        special_notes: property.special_notes || property.manager_memo || null,
        manager_id: managerId,
        ad_status: 'active',
        registration_date: property.registration_date || new Date().toISOString().split('T')[0],
        is_commercial: property.property_type === 'COMMERCIAL'
      };
      
      // 거주자 정보가 있으면 추가
      if (property.owner_name || property.owner_phone) {
        propertyData.resident = JSON.stringify({
          name: property.owner_name || "",
          phone: property.owner_phone || "",
          email: "",
          address: "",
          notes: ""
        });
      }
      
      propertiesToInsert.push(propertyData);
    }
    
    // 배치 삽입
    const { data, error } = await supabase
      .from('properties')
      .insert(propertiesToInsert);
    
    if (error) {
      console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 실패:`, error.message);
      console.error('실패한 데이터 예시:', propertiesToInsert[0]);
      failCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✅ 배치 ${Math.floor(i/batchSize) + 1} 완료 (${i + batch.length}/${cleanedProperties.length})`);
    }
  }
  
  console.log(`
📊 마이그레이션 완료
====================================
✅ 성공: ${successCount}개
❌ 실패: ${failCount}개
📌 총계: ${cleanedProperties.length}개
`);
}

async function main() {
  try {
    console.log('🚀 Supabase 마이그레이션 시작 (수정 버전)...\n');
    
    // Step 0: 룩업 테이블 ID 조회
    const lookupIds = await getLookupIds();
    
    // Step 1: 사용자 생성/확인
    const userIds = await createOrGetUsers();
    
    if (Object.keys(userIds).length === 0) {
      console.error('❌ 사용자 확인에 실패했습니다. 마이그레이션을 중단합니다.');
      return;
    }
    
    // Step 2: 매물 데이터 마이그레이션
    await migrateProperties(userIds, lookupIds);
    
    console.log('\n✅ 마이그레이션이 완료되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. Supabase 대시보드에서 데이터를 확인하세요.');
    console.log('2. 새로 생성된 사용자들에게 임시 비밀번호(TheRealty2025!)를 전달하세요.');
    console.log('3. 애플리케이션에서 Supabase 연동을 테스트하세요.');
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
main();