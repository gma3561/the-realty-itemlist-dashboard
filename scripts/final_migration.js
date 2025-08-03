const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 직원 이름-이메일 매핑
const realtorMapping = {
  '김규민': 'gyum@the-realty.co.kr',
  '하상현': 'lucas@the-realty.co.kr',
  '정서연': 'yool@the-realty.co.kr',
  '정선혜': 'grace@the-realty.co.kr',
  '박소현': 'sso@the-realty.co.kr',
  '정연서': 'jenny@the-realty.co.kr',
  '송영주': 'joo@the-realty.co.kr',
  '정윤식': 'yun@the-realty.co.kr',
  '성은미': 'mimi@the-realty.co.kr',
  '서을선': 'sun@the-realty.co.kr',
  '서지혜': 'kylie@the-realty.co.kr',
  '이혜만': 'hmlee@the-realty.co.kr',
  '김효석': 'seok@the-realty.co.kr'
};

// 매물 유형 매핑 (ID로)
const propertyTypeMap = {
  'APARTMENT': 'apt',
  'OFFICETEL': 'officetel',
  'VILLA': 'villa',
  'HOUSE': 'house',
  'COMMERCIAL': 'store',
  'MIXED_USE': 'etc'
};

// 거래 유형 매핑 (ID로)
const transactionTypeMap = {
  'SALE': 'sale',
  'LEASE': 'lease',
  'JEONSE': 'lease',
  'RENT': 'monthly'
};

// 매물 상태 매핑 (ID로)
const propertyStatusMap = {
  'ACTIVE': 'available',
  'HOLD': 'hold',
  'COMPLETED': 'completed'
};

async function finalMigration() {
  console.log('🚀 최종 마이그레이션 시작...\n');
  
  try {
    // 1. 기존 매물 삭제 확인
    console.log('⚠️  기존 매물을 삭제하시겠습니까? (위험!)');
    console.log('건너뛰고 새 데이터만 추가합니다...\n');
    
    // 2. 사용자 조회
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name');
    
    console.log(`✅ ${users?.length || 0}명의 사용자 확인됨`);
    
    const emailToId = {};
    users?.forEach(user => {
      emailToId[user.email] = user.id;
    });
    
    // 3. 정제된 데이터 읽기
    const cleanedDataPath = path.join(__dirname, '..', 'cleaned_properties_2025-08-03.json');
    const cleanedProperties = JSON.parse(fs.readFileSync(cleanedDataPath, 'utf-8'));
    
    console.log(`📋 총 ${cleanedProperties.length}개의 매물 데이터 처리 중...\n`);
    
    let successCount = 0;
    let failCount = 0;
    const batchSize = 20; // 배치 크기 줄임
    
    // 4. 배치 단위로 데이터 삽입
    for (let i = 0; i < cleanedProperties.length; i += batchSize) {
      const batch = cleanedProperties.slice(i, i + batchSize);
      const propertiesToInsert = [];
      
      for (const property of batch) {
        try {
          // 담당자 찾기
          let managerId = null;
          let managerName = property.manager_name || '정연서';
          
          if (realtorMapping[managerName]) {
            managerId = emailToId[realtorMapping[managerName]];
          }
          
          // 큰 숫자 처리 (numeric overflow 방지)
          const safePrice = (num) => {
            if (!num) return null;
            const maxSafeInt = 9223372036854775807; // PostgreSQL bigint 최대값
            return Math.min(num, maxSafeInt);
          };
          
          const safeArea = (num) => {
            if (!num) return null;
            // 비정상적으로 큰 면적 값 필터링
            return num > 10000 ? Math.round(num / 10000) : num;
          };
          
          // 실제 스키마에 맞춘 데이터 변환
          const mappedProperty = {
            // 기본 정보
            property_name: property.property_name || property.location || '미지정 매물',
            location: property.location || '',
            building_name: property.building_name || '',
            room_number: property.unit_number || '',
            
            // 매물 타입 (ID로)
            property_type: propertyTypeMap[property.property_type] || 'apt',
            transaction_type: transactionTypeMap[property.transaction_type] || 'sale',
            property_status: propertyStatusMap[property.property_status || 'ACTIVE'],
            
            // 면적 정보 (안전한 값으로)
            area_pyeong: safeArea(property.area_pyeong),
            area_m2: safeArea(property.area_m2),
            
            // 층 정보
            floor_current: property.floor || null,
            floor_total: property.total_floors || null,
            
            // 방/욕실 정보
            room_count: property.rooms || null,
            bath_count: property.bathrooms || null,
            
            // 가격 정보 (안전한 값으로)
            price: safePrice(property.sale_price || property.jeonse_deposit || property.monthly_rent),
            lease_price: safePrice(property.jeonse_deposit || property.monthly_deposit),
            monthly_fee: property.monthly_rent ? Math.min(property.monthly_rent, 99999999) : null,
            
            // 설명
            description: (property.special_notes || '').substring(0, 1000),
            special_notes: (property.manager_memo || '').substring(0, 500),
            
            // 입주 가능일
            available_date: property.move_in_date || null,
            
            // 담당자 정보
            manager_id: managerId,
            manager_name: managerName,
            
            // 소유자 정보
            owner_name: (property.owner_name || '').substring(0, 100),
            owner_phone: (property.owner_phone || '').substring(0, 50),
            
            // 기타 정보
            view_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // null이 아닌 값만 포함
          const cleanedProperty = {};
          for (const [key, value] of Object.entries(mappedProperty)) {
            if (value !== null && value !== '') {
              cleanedProperty[key] = value;
            }
          }
          
          propertiesToInsert.push(cleanedProperty);
        } catch (err) {
          console.error('데이터 변환 오류:', err);
        }
      }
      
      // 배치 삽입
      if (propertiesToInsert.length > 0) {
        const { data, error } = await supabase
          .from('properties')
          .insert(propertiesToInsert);
        
        if (error) {
          console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 실패:`, error.message);
          failCount += propertiesToInsert.length;
          
          // 첫 번째 실패 시 상세 정보
          if (failCount === propertiesToInsert.length) {
            console.log('실패한 데이터:', JSON.stringify(propertiesToInsert[0], null, 2));
          }
        } else {
          successCount += propertiesToInsert.length;
          console.log(`✅ 배치 ${Math.floor(i/batchSize) + 1} 완료 (${successCount}/${cleanedProperties.length})`);
        }
      }
    }
    
    console.log(`
📊 마이그레이션 완료
====================================
✅ 성공: ${successCount}개
❌ 실패: ${failCount}개
📌 총계: ${cleanedProperties.length}개
`);
    
    // 5. 결과 확인
    const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n🏢 현재 총 매물 수: ${count}개`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류:', error);
  }
}

// 실행
finalMigration();