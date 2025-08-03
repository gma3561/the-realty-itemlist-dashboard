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

// 매물 유형 매핑 (한글로)
const propertyTypeMap = {
  'APARTMENT': '아파트',
  'OFFICETEL': '오피스텔',
  'VILLA': '빌라',
  'HOUSE': '단독주택',
  'COMMERCIAL': '상가',
  'MIXED_USE': '주상복합'
};

// 거래 유형 매핑 (한글로)
const transactionTypeMap = {
  'SALE': '매매',
  'LEASE': '전세',
  'JEONSE': '전세',
  'RENT': '월세'
};

// 매물 상태 매핑 (한글로)
const propertyStatusMap = {
  'ACTIVE': '거래가능',
  'HOLD': '거래보류',
  'COMPLETED': '거래완료'
};

async function migrateData() {
  console.log('🚀 실제 스키마 기반 마이그레이션 시작...\n');
  
  try {
    // 1. 기존 사용자 조회
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, name');
    
    if (userError) {
      console.error('❌ 사용자 조회 실패:', userError);
      return;
    }
    
    console.log(`✅ ${users?.length || 0}명의 사용자 확인됨`);
    
    // 이메일로 사용자 ID 매핑
    const emailToId = {};
    users?.forEach(user => {
      emailToId[user.email] = user.id;
    });
    
    // 2. 정제된 데이터 읽기
    const cleanedDataPath = path.join(__dirname, '..', 'cleaned_properties_2025-08-03.json');
    const cleanedProperties = JSON.parse(fs.readFileSync(cleanedDataPath, 'utf-8'));
    
    console.log(`📋 총 ${cleanedProperties.length}개의 매물 데이터 처리 중...\n`);
    
    let successCount = 0;
    let failCount = 0;
    const batchSize = 50;
    
    // 3. 배치 단위로 데이터 삽입
    for (let i = 0; i < cleanedProperties.length; i += batchSize) {
      const batch = cleanedProperties.slice(i, i + batchSize);
      const propertiesToInsert = [];
      
      for (const property of batch) {
        // 담당자 찾기
        let managerId = null;
        let managerName = property.manager_name || '정연서';
        
        if (realtorMapping[managerName]) {
          managerId = emailToId[realtorMapping[managerName]];
        }
        
        // 실제 스키마에 맞춘 데이터 변환
        const mappedProperty = {
          // 기본 정보
          property_name: property.property_name || property.location || '미지정 매물',
          location: property.location || '',
          building_name: property.building_name || '',
          room_number: property.unit_number || '',
          
          // 매물 타입 (한글)
          property_type: propertyTypeMap[property.property_type] || '아파트',
          transaction_type: transactionTypeMap[property.transaction_type] || '매매',
          property_status: propertyStatusMap[property.property_status || 'ACTIVE'],
          
          // 면적 정보
          area_pyeong: property.area_pyeong || null,
          area_m2: property.area_m2 || null,
          
          // 층 정보
          floor_current: property.floor || null,
          floor_total: property.total_floors || null,
          
          // 방/욕실 정보
          room_count: property.rooms || null,
          bath_count: property.bathrooms || null,
          
          // 가격 정보
          price: property.sale_price || property.jeonse_deposit || property.monthly_rent || null,
          lease_price: property.jeonse_deposit || property.monthly_deposit || null,
          monthly_fee: property.monthly_rent || null,
          
          // 설명
          description: property.special_notes || '',
          special_notes: property.manager_memo || '',
          
          // 입주 가능일
          available_date: property.move_in_date || null,
          
          // 담당자 정보
          manager_id: managerId,
          manager_name: managerName,
          
          // 소유자 정보
          owner_name: property.owner_name || '',
          owner_phone: property.owner_phone || '',
          
          // 기타 정보
          view_count: 0,
          created_at: property.created_at || new Date().toISOString(),
          updated_at: property.updated_at || new Date().toISOString()
        };
        
        // null이 아닌 값만 포함
        const cleanedProperty = {};
        for (const [key, value] of Object.entries(mappedProperty)) {
          if (value !== null && value !== '') {
            cleanedProperty[key] = value;
          }
        }
        
        propertiesToInsert.push(cleanedProperty);
      }
      
      // 배치 삽입
      const { data, error } = await supabase
        .from('properties')
        .insert(propertiesToInsert);
      
      if (error) {
        console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 실패:`, error.message);
        failCount += batch.length;
        
        // 첫 번째 실패 시 상세 정보 출력
        if (failCount === batch.length) {
          console.log('실패한 데이터 예시:', JSON.stringify(propertiesToInsert[0], null, 2));
        }
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
    
    // 4. 마이그레이션 결과 확인
    const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n🏢 현재 총 매물 수: ${count}개`);
    
    // 5. 담당자별 매물 수 확인
    const { data: managerStats } = await supabase
      .from('properties')
      .select('manager_name')
      .order('manager_name');
    
    if (managerStats) {
      const stats = {};
      managerStats.forEach(item => {
        stats[item.manager_name] = (stats[item.manager_name] || 0) + 1;
      });
      
      console.log('\n👥 담당자별 매물 현황:');
      Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
        console.log(`- ${name}: ${count}개`);
      });
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류:', error);
  }
}

// 실행
migrateData();