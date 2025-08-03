const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickMigration() {
  console.log('🚀 빠른 마이그레이션 시작...\n');
  
  // 정제된 데이터 읽기
  const cleanedDataPath = path.join(__dirname, '..', 'cleaned_properties_2025-08-03.json');
  const cleanedProperties = JSON.parse(fs.readFileSync(cleanedDataPath, 'utf-8'));
  
  // 기존 사용자 조회
  const { data: users } = await supabase
    .from('users')
    .select('id, email, name');
  
  // 이메일로 사용자 ID 매핑
  const emailToId = {};
  users?.forEach(user => {
    emailToId[user.email] = user.id;
  });
  
  console.log(`✅ ${users?.length || 0}명의 사용자 확인됨\n`);
  
  // 간단한 매물 데이터만 삽입 (ad_status 제외)
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < cleanedProperties.length; i += 50) {
    const batch = cleanedProperties.slice(i, i + 50);
    const propertiesToInsert = batch.map(property => ({
      property_name: property.property_name || property.location,
      location: property.location || '',
      building: property.building_name || '',
      unit: property.unit_number || '',
      property_type_id: '550e8400-e29b-41d4-a716-446655440001', // 아파트로 통일
      transaction_type_id: '650e8400-e29b-41d4-a716-446655440001', // 매매로 통일
      property_status_id: '750e8400-e29b-41d4-a716-446655440001', // 거래가능
      price: property.sale_price || property.jeonse_deposit || property.monthly_rent || 0,
      supply_area_pyeong: property.area_pyeong || null,
      supply_area_sqm: property.area_m2 || null,
      floor_info: property.floor ? `${property.floor}층` : null,
      parking: property.parking || null,
      special_notes: property.special_notes || property.manager_memo || null,
      manager_id: users?.[0]?.id || null, // 첫 번째 사용자에게 일단 배정
      registration_date: new Date().toISOString().split('T')[0]
    }));
    
    const { error } = await supabase
      .from('properties')
      .insert(propertiesToInsert);
    
    if (error) {
      console.error(`❌ 배치 ${Math.floor(i/50) + 1} 실패:`, error.message);
      failCount += batch.length;
    } else {
      successCount += batch.length;
      console.log(`✅ 배치 ${Math.floor(i/50) + 1} 완료 (${i + batch.length}/${cleanedProperties.length})`);
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

quickMigration();