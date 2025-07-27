const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://mtgicixejxtidvskoyqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Z2ljaXhlanh0aWR2c2tveXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDgwMTMsImV4cCI6MjA0NzkyNDAxM30.9oeq9-VzGCKHyXv2c6LnpPTyqIFdFAp9Cd-U8uXQ7hQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeLookupTables() {
  try {
    console.log('룩업 테이블 초기화 시작...');
    
    // 매물 종류 초기화
    const propertyTypes = [
      { id: 'apt', name: '아파트', order: 1 },
      { id: 'officetel', name: '오피스텔', order: 2 },
      { id: 'villa', name: '빌라/연립', order: 3 },
      { id: 'house', name: '단독주택', order: 4 },
      { id: 'commercial', name: '상가', order: 5 }
    ];

    // 거래 유형 초기화
    const transactionTypes = [
      { id: 'sale', name: '매매', order: 1 },
      { id: 'lease', name: '전세', order: 2 },
      { id: 'rent', name: '월세', order: 3 }
    ];

    // 매물 상태 초기화
    const propertyStatuses = [
      { id: 'available', name: '거래가능', order: 1 },
      { id: 'reserved', name: '거래보류', order: 2 },
      { id: 'completed', name: '거래완료', order: 3 }
    ];

    // 각 테이블에 데이터 삽입
    const results = await Promise.allSettled([
      supabase.from('property_types').upsert(propertyTypes, { onConflict: 'id' }),
      supabase.from('transaction_types').upsert(transactionTypes, { onConflict: 'id' }),
      supabase.from('property_statuses').upsert(propertyStatuses, { onConflict: 'id' })
    ]);

    console.log('룩업 테이블 초기화 결과:');
    results.forEach((result, index) => {
      const tableName = ['property_types', 'transaction_types', 'property_statuses'][index];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${tableName}: 성공`);
      } else {
        console.log(`❌ ${tableName}: ${result.reason.message}`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('룩업 테이블 초기화 실패:', error);
    return false;
  }
}

async function testUpload() {
  try {
    // 룩업 테이블 먼저 초기화
    await initializeLookupTables();
    
    // 처리된 데이터 로드
    const processedData = JSON.parse(fs.readFileSync('./public/processed_properties.json', 'utf8'));
    console.log(`${processedData.length}개의 처리된 데이터를 로드했습니다`);
    
    // 작은 배치로 테스트
    const testBatch = processedData.slice(0, 5);
    
    // manager_id 추가
    const batchWithManagerId = testBatch.map(property => ({
      ...property,
      manager_id: 'admin'
    }));
    
    console.log('테스트 데이터 업로드 시작...');
    const { data, error } = await supabase
      .from('properties')
      .insert(batchWithManagerId)
      .select();
      
    if (error) {
      console.error('업로드 실패:', error);
    } else {
      console.log('✅ 업로드 성공!', data.length, '개 레코드 추가');
    }
    
  } catch (error) {
    console.error('테스트 실패:', error);
  }
}

testUpload();