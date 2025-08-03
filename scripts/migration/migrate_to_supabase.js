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

// 매물 유형 매핑
const propertyTypeMap = {
  'APARTMENT': '550e8400-e29b-41d4-a716-446655440001',
  'OFFICETEL': '550e8400-e29b-41d4-a716-446655440002',
  'VILLA': '550e8400-e29b-41d4-a716-446655440003',
  'HOUSE': '550e8400-e29b-41d4-a716-446655440004',
  'COMMERCIAL': '550e8400-e29b-41d4-a716-446655440005',
  'MIXED_USE': '550e8400-e29b-41d4-a716-446655440005'
};

// 거래 유형 매핑
const transactionTypeMap = {
  'SALE': '650e8400-e29b-41d4-a716-446655440001',
  'LEASE': '650e8400-e29b-41d4-a716-446655440002',
  'JEONSE': '650e8400-e29b-41d4-a716-446655440002',
  'RENT': '650e8400-e29b-41d4-a716-446655440003'
};

// 매물 상태 매핑
const propertyStatusMap = {
  'ACTIVE': '750e8400-e29b-41d4-a716-446655440001', // 거래가능
  'HOLD': '750e8400-e29b-41d4-a716-446655440002',   // 거래보류
  'COMPLETED': '750e8400-e29b-41d4-a716-446655440003' // 거래완료
};

async function createUsers() {
  console.log('📌 Step 1: 사용자 계정 생성 중...');
  const userIds = {};
  
  for (const [name, info] of Object.entries(realtorMapping)) {
    try {
      // auth.users에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: info.email,
        password: 'TheRealty2025!', // 임시 비밀번호
        email_confirm: true,
        user_metadata: {
          name: name,
          role: info.role
        }
      });

      if (authError) {
        // 이미 존재하는 사용자인 경우 조회
        if (authError.message.includes('already exists')) {
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === info.email);
          if (existingUser) {
            userIds[name] = existingUser.id;
            console.log(`✅ 기존 사용자 확인: ${name} (${info.email})`);
          }
        } else {
          console.error(`❌ ${name} 계정 생성 실패:`, authError.message);
        }
      } else if (authData && authData.user) {
        userIds[name] = authData.user.id;
        console.log(`✅ 새 사용자 생성: ${name} (${info.email})`);
      }
    } catch (error) {
      console.error(`❌ ${name} 처리 중 오류:`, error);
    }
  }
  
  return userIds;
}

async function migrateProperties(userIds) {
  console.log('\n📌 Step 2: 매물 데이터 마이그레이션 중...');
  
  // 정제된 데이터 읽기
  const cleanedDataPath = path.join(__dirname, '..', 'cleaned_properties_2025-08-03.json');
  const cleanedProperties = JSON.parse(fs.readFileSync(cleanedDataPath, 'utf-8'));
  
  let successCount = 0;
  let failCount = 0;
  const batchSize = 50; // 배치 크기
  
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
      
      // 가격 정보 처리
      let price = null;
      let leasePrice = null; 
      let monthlyRent = null;
      
      if (property.transaction_type === 'SALE') {
        price = property.sale_price;
      } else if (property.transaction_type === 'LEASE' || property.transaction_type === 'JEONSE') {
        leasePrice = property.jeonse_deposit;
      } else if (property.transaction_type === 'RENT') {
        leasePrice = property.monthly_deposit || 0;
        monthlyRent = property.monthly_rent;
      }
      
      // 거주자 정보
      const resident = {
        name: property.owner_name || "",
        phone: property.owner_phone || "",
        email: "",
        address: "",
        notes: ""
      };
      
      // 층 정보 생성
      let floorInfo = '';
      if (property.floor && property.total_floors) {
        floorInfo = `${property.floor}층/${property.total_floors}층`;
      } else if (property.floor) {
        floorInfo = `${property.floor}층`;
      }
      
      // 방/욕실 정보
      let roomBathroom = '';
      if (property.rooms && property.bathrooms) {
        roomBathroom = `${property.rooms}/${property.bathrooms}개`;
      } else if (property.bathrooms) {
        roomBathroom = `방${property.bathrooms}개`;
      }
      
      propertiesToInsert.push({
        id: property.id,
        property_name: property.property_name || `${property.building_name || property.location} ${property.unit_number || ''}`.trim(),
        location: property.location || '',
        property_type_id: propertyTypeMap[property.property_type] || propertyTypeMap['APARTMENT'],
        transaction_type_id: transactionTypeMap[property.transaction_type] || transactionTypeMap['SALE'],
        property_status_id: propertyStatusMap[property.property_status || 'ACTIVE'],
        price: price,
        lease_price: leasePrice,
        monthly_rent: monthlyRent,
        supply_area_pyeong: property.area_pyeong || null,
        private_area_pyeong: property.area_pyeong ? Math.round(property.area_pyeong * 0.85) : null,
        supply_area_sqm: property.area_m2 || null,
        private_area_sqm: property.area_m2 ? Math.round(property.area_m2 * 0.85) : null,
        floor_info: floorInfo,
        room_bathroom: roomBathroom,
        direction: property.direction || '',
        maintenance_fee_text: property.maintenance_fee ? `${Math.round(property.maintenance_fee / 10000)}만원` : '',
        parking: property.parking || '',
        description: property.special_notes || property.manager_memo || '',
        resident: JSON.stringify(resident),
        manager_id: managerId,
        created_at: property.created_at || new Date().toISOString(),
        updated_at: property.updated_at || new Date().toISOString()
      });
    }
    
    // 배치 삽입
    const { data, error } = await supabase
      .from('properties')
      .insert(propertiesToInsert);
    
    if (error) {
      console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 실패:`, error.message);
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
    console.log('🚀 Supabase 마이그레이션 시작...\n');
    
    // Step 1: 사용자 생성
    const userIds = await createUsers();
    
    if (Object.keys(userIds).length === 0) {
      console.error('❌ 사용자 생성에 실패했습니다. 마이그레이션을 중단합니다.');
      return;
    }
    
    // Step 2: 매물 데이터 마이그레이션
    await migrateProperties(userIds);
    
    console.log('\n✅ 마이그레이션이 완료되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. Supabase 대시보드에서 데이터를 확인하세요.');
    console.log('2. 사용자들에게 임시 비밀번호(TheRealty2025!)를 전달하고 변경하도록 안내하세요.');
    console.log('3. 애플리케이션에서 Supabase 연동을 테스트하세요.');
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
main();