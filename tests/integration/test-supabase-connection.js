const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase 연결 테스트 시작...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('1️⃣ 데이터 조회 테스트 (READ)');
  try {
    const { data, error, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .limit(3);
    
    if (error) throw error;
    console.log(`✅ 조회 성공: 총 ${count}개 매물 중 3개 샘플`);
    console.log('샘플 데이터:', data.map(p => ({ 
      id: p.id.substring(0, 8), 
      name: p.property_name,
      status: p.property_status 
    })));
  } catch (error) {
    console.log('❌ 조회 실패:', error.message);
  }

  console.log('\n2️⃣ 데이터 생성 테스트 (CREATE)');
  try {
    const testProperty = {
      property_name: '테스트 매물 ' + new Date().toISOString(),
      location: '서울시 강남구',
      property_type: 'apt',
      transaction_type: 'sale',
      property_status: 'available',
      price: 1000000000,
      area_pyeong: 30,
      area_m2: 99,
      manager_id: 'test@example.com'
    };

    const { data, error } = await supabase
      .from('properties')
      .insert([testProperty])
      .select();
    
    if (error) throw error;
    console.log('✅ 생성 성공:', data[0].id.substring(0, 8));
    return data[0].id;
  } catch (error) {
    console.log('❌ 생성 실패:', error.message);
    return null;
  }
}

async function testPropertyUpdate(propertyId) {
  console.log('\n3️⃣ 데이터 수정 테스트 (UPDATE)');
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ 
        property_status: 'reserved',
        special_notes: '테스트 수정 완료 ' + new Date().toLocaleTimeString()
      })
      .eq('id', propertyId)
      .select();
    
    if (error) throw error;
    console.log('✅ 수정 성공:', data[0].property_status);
  } catch (error) {
    console.log('❌ 수정 실패:', error.message);
  }
}

async function testPropertyDelete(propertyId) {
  console.log('\n4️⃣ 데이터 삭제 테스트 (DELETE)');
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
    
    if (error) throw error;
    console.log('✅ 삭제 성공');
  } catch (error) {
    console.log('❌ 삭제 실패:', error.message);
  }
}

async function testRealtimeSubscription() {
  console.log('\n5️⃣ 실시간 구독 테스트 (REALTIME)');
  
  const channel = supabase
    .channel('properties-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'properties' }, 
      (payload) => {
        console.log('🔔 실시간 변경 감지:', payload.eventType);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ 실시간 구독 성공');
      } else {
        console.log('❌ 실시간 구독 상태:', status);
      }
    });

  // 5초 후 구독 해제
  setTimeout(() => {
    channel.unsubscribe();
    console.log('🔌 실시간 구독 해제');
  }, 5000);
}

async function testLookupTables() {
  console.log('\n6️⃣ 룩업 테이블 테스트');
  try {
    const tables = ['property_types', 'transaction_types', 'property_statuses'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('order');
      
      if (error) throw error;
      console.log(`✅ ${table}: ${data.length}개 항목`);
    }
  } catch (error) {
    console.log('❌ 룩업 테이블 조회 실패:', error.message);
  }
}

// 전체 테스트 실행
async function runAllTests() {
  const propertyId = await testSupabaseConnection();
  
  if (propertyId) {
    await testPropertyUpdate(propertyId);
    await testPropertyDelete(propertyId);
  }
  
  await testLookupTables();
  await testRealtimeSubscription();
  
  console.log('\n✨ 모든 테스트 완료!');
  
  // 실시간 테스트를 위해 5초 대기
  setTimeout(() => {
    process.exit(0);
  }, 6000);
}

runAllTests();