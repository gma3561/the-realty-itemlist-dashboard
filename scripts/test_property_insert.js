// 실제 매물 등록 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPropertyInsert() {
  try {
    console.log('매물 등록 테스트 시작...');

    // 1. 먼저 룩업 테이블 데이터 조회
    console.log('1. 룩업 테이블 데이터 조회...');
    
    const [propertyTypesResult, statusesResult, transactionTypesResult, ownersResult] = await Promise.all([
      supabase.from('property_types').select('*'),
      supabase.from('property_statuses').select('*'),
      supabase.from('transaction_types').select('*'),
      supabase.from('owners').select('*').limit(1)
    ]);

    if (propertyTypesResult.error) throw new Error('매물 종류 조회 실패: ' + propertyTypesResult.error.message);
    if (statusesResult.error) throw new Error('진행 상태 조회 실패: ' + statusesResult.error.message);
    if (transactionTypesResult.error) throw new Error('거래 유형 조회 실패: ' + transactionTypesResult.error.message);
    if (ownersResult.error) throw new Error('소유주 조회 실패: ' + ownersResult.error.message);

    const propertyTypes = propertyTypesResult.data;
    const statuses = statusesResult.data;
    const transactionTypes = transactionTypesResult.data;
    const owners = ownersResult.data;

    console.log(`매물 종류: ${propertyTypes.length}개`);
    console.log(`진행 상태: ${statuses.length}개`);
    console.log(`거래 유형: ${transactionTypes.length}개`);
    console.log(`소유주: ${owners.length}개`);

    if (propertyTypes.length === 0 || statuses.length === 0 || transactionTypes.length === 0) {
      throw new Error('룩업 테이블에 필요한 데이터가 없습니다. seed_lookup_data.sql을 실행해주세요.');
    }

    // 2. 테스트용 매물 데이터 준비
    const testProperty = {
      property_name: '테스트 매물 ' + new Date().getTime(),
      location: '서울시 강남구 삼성동',
      property_type_id: propertyTypes[0].id,
      property_status_id: statuses[0].id,  
      transaction_type_id: transactionTypes[0].id,
      owner_id: owners.length > 0 ? owners[0].id : null,
      price: 500000000,
      supply_area_sqm: 84.5,
      private_area_sqm: 59.8,
      floor_info: '15층/25층',
      rooms_bathrooms: '3개/2개',
      direction: '남향',
      maintenance_fee: '15만원',
      parking: '2대',
      move_in_date: '즉시입주',
      special_notes: '테스트용 매물입니다'
    };

    console.log('2. 테스트 매물 등록 시도...');
    console.log('매물 데이터:', JSON.stringify(testProperty, null, 2));

    // 3. 매물 등록 시도
    const { data: insertedProperty, error: insertError } = await supabase
      .from('properties')
      .insert([testProperty])
      .select();

    if (insertError) {
      throw new Error('매물 등록 실패: ' + insertError.message);
    }

    console.log('✅ 매물 등록 성공!');
    console.log('등록된 매물:', JSON.stringify(insertedProperty[0], null, 2));

    // 4. 등록된 매물 조회 테스트
    console.log('3. 등록된 매물 조회 테스트...');
    const { data: retrievedProperty, error: selectError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', insertedProperty[0].id)
      .single();

    if (selectError) {
      throw new Error('매물 조회 실패: ' + selectError.message);
    }

    console.log('✅ 매물 조회 성공!');
    console.log('조회된 매물:', JSON.stringify(retrievedProperty, null, 2));

    console.log('✅ 모든 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.details) console.error('상세 정보:', error.details);
    if (error.hint) console.error('힌트:', error.hint);
  }
}

testPropertyInsert();