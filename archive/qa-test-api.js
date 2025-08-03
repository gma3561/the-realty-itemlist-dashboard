// QA API 테스트 스크립트
const SUPABASE_URL = 'https://aekgsysvipnwxhwixglg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjI0MTgsImV4cCI6MjA1MzMzODQxOH0.z7C6bXL0Y6kCJEPIu6AlKLGi1vgfwdD9QQ0rtjcqe5g';

async function testSupabaseAPI() {
  console.log('🚀 Supabase API 테스트 시작...\n');
  
  const results = {
    connection: false,
    propertyRead: false,
    propertyCreate: false,
    propertyUpdate: false,
    propertyDelete: false,
    userRead: false,
    realtime: false
  };

  // 1. 연결 테스트
  console.log('1️⃣ 연결 테스트...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      }
    });
    results.connection = response.ok;
    console.log(results.connection ? '✅ 연결 성공' : '❌ 연결 실패');
  } catch (error) {
    console.log('❌ 연결 실패:', error.message);
  }

  // 2. 매물 조회 테스트
  console.log('\n2️⃣ 매물 조회 테스트...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=*&limit=5`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await response.json();
    results.propertyRead = response.ok;
    console.log(results.propertyRead ? `✅ 조회 성공 (${data.length}개 매물)` : '❌ 조회 실패');
    if (data.length > 0) {
      console.log('   첫 번째 매물:', data[0].property_name || data[0].title);
    }
  } catch (error) {
    console.log('❌ 조회 실패:', error.message);
  }

  // 3. 매물 생성 테스트 (RLS 정책에 따라 실패할 수 있음)
  console.log('\n3️⃣ 매물 생성 테스트...');
  const testProperty = {
    property_name: `QA테스트매물_${Date.now()}`,
    location: '서울시 강남구',
    property_type_id: 1,
    transaction_type_id: 1,
    status_id: 1,
    price: 500000000,
    supply_area_sqm: 84,
    exclusive_area_sqm: 59
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testProperty)
    });
    
    if (response.ok) {
      const data = await response.json();
      results.propertyCreate = true;
      console.log('✅ 생성 성공, ID:', data[0]?.id);
      
      // 생성된 매물로 업데이트 테스트
      if (data[0]?.id) {
        console.log('\n4️⃣ 매물 업데이트 테스트...');
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${data[0].id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ property_name: testProperty.property_name + '_수정됨' })
        });
        results.propertyUpdate = updateResponse.ok;
        console.log(results.propertyUpdate ? '✅ 업데이트 성공' : '❌ 업데이트 실패');
        
        // 삭제 테스트
        console.log('\n5️⃣ 매물 삭제 테스트...');
        const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${data[0].id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        results.propertyDelete = deleteResponse.ok;
        console.log(results.propertyDelete ? '✅ 삭제 성공' : '❌ 삭제 실패');
      }
    } else {
      const error = await response.text();
      console.log('❌ 생성 실패 (RLS 정책으로 인한 실패일 수 있음):', error);
    }
  } catch (error) {
    console.log('❌ 생성 실패:', error.message);
  }

  // 6. 사용자 조회 테스트
  console.log('\n6️⃣ 사용자 조회 테스트...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await response.json();
    results.userRead = response.ok;
    console.log(results.userRead ? `✅ 조회 성공 (${data.length}명 사용자)` : '❌ 조회 실패');
  } catch (error) {
    console.log('❌ 조회 실패:', error.message);
  }

  // 결과 요약
  console.log('\n📊 테스트 결과 요약:');
  console.log('===================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  console.log(`\n총 ${totalCount}개 중 ${passedCount}개 통과 (${Math.round(passedCount/totalCount*100)}%)`);
}

// 테스트 실행
testSupabaseAPI().catch(console.error);