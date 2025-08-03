// 실제 매물 데이터 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperties() {
  try {
    console.log('매물 데이터 확인 중...');
    
    // 1. 매물 개수 확인
    const { data: properties, error: propertiesError, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' });
    
    if (propertiesError) {
      console.error('매물 조회 실패:', propertiesError);
      return;
    }
    
    console.log(`총 매물 개수: ${count}개`);
    
    if (properties && properties.length > 0) {
      console.log('\n등록된 매물들:');
      properties.forEach((property, index) => {
        console.log(`${index + 1}. ${property.property_name} (${property.location})`);
        console.log(`   ID: ${property.id}`);
        console.log(`   매물종류 ID: ${property.property_type_id}`);
        console.log(`   진행상태 ID: ${property.property_status_id}`);
        console.log(`   거래유형 ID: ${property.transaction_type_id}`);
        console.log(`   등록일: ${property.created_at}`);
        console.log('---');
      });
    } else {
      console.log('등록된 매물이 없습니다.');
    }
    
    // 2. 룩업 테이블 확인
    console.log('\n룩업 테이블 상태:');
    
    const [ptResult, psResult, ttResult] = await Promise.all([
      supabase.from('property_types').select('*'),
      supabase.from('property_statuses').select('*'), 
      supabase.from('transaction_types').select('*')
    ]);
    
    console.log(`매물종류: ${ptResult.data?.length || 0}개`);
    console.log(`진행상태: ${psResult.data?.length || 0}개`);
    console.log(`거래유형: ${ttResult.data?.length || 0}개`);
    
    if (ptResult.data?.length > 0) {
      console.log('\n매물종류 목록:');
      ptResult.data.forEach(type => {
        console.log(`- ${type.name} (${type.id})`);
      });
    }
    
    // 3. 조인된 매물 데이터 확인
    if (count > 0) {
      console.log('\n조인된 매물 데이터 확인:');
      const { data: joinedProperties, error: joinError } = await supabase
        .from('properties')
        .select(`
          *,
          property_types(name),
          property_statuses(name),
          transaction_types(name)
        `);
      
      if (joinError) {
        console.error('조인 조회 실패:', joinError);
      } else if (joinedProperties) {
        joinedProperties.forEach((property, index) => {
          console.log(`${index + 1}. ${property.property_name}`);
          console.log(`   매물종류: ${property.property_types?.name || '없음'}`);
          console.log(`   진행상태: ${property.property_statuses?.name || '없음'}`);
          console.log(`   거래유형: ${property.transaction_types?.name || '없음'}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('확인 중 오류:', error);
  }
}

checkProperties();