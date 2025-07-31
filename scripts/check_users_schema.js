// users 테이블 스키마 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('👥 Users 테이블 스키마 확인');
console.log('============================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersSchema() {
  try {
    console.log('📝 users 테이블 샘플 데이터 확인');
    console.log('--------------------------------');
    
    // 샘플 데이터 조회
    const { data: sampleData, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ 샘플 데이터 조회 실패:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ 현재 테이블 구조 (샘플 데이터 기준):');
      console.log('컬럼 목록:', Object.keys(sampleData[0]));
      console.log('\n샘플 데이터:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('📄 테이블이 비어있습니다.');
    }

    console.log('\n🧪 사용자 추가 테스트');
    console.log('---------------------');
    
    // 테스트 데이터로 삽입 시도 (ID 없이)
    const testDataWithoutId = {
      email: 'test@example.com',
      name: '테스트 사용자',
      phone: '010-1234-5678',
      role: 'user',
      status: 'active'
    };

    console.log('테스트 데이터 (ID 없음):', testDataWithoutId);

    const { data: insertData1, error: insertError1 } = await supabase
      .from('users')
      .insert(testDataWithoutId)
      .select();

    if (insertError1) {
      console.log('❌ ID 없는 삽입 실패:', insertError1.message);
    } else {
      console.log('✅ ID 없는 삽입 성공:', insertData1);
      
      // 테스트 데이터 삭제
      if (insertData1 && insertData1[0]) {
        await supabase
          .from('users')
          .delete()
          .eq('id', insertData1[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }

    // UUID 생성해서 테스트
    console.log('\n🔑 UUID 생성하여 삽입 테스트');
    console.log('-------------------------------');
    
    const { v4: uuidv4 } = require('uuid');
    const testDataWithId = {
      id: uuidv4(),
      email: 'test2@example.com',
      name: '테스트 사용자 2',
      phone: '010-5678-9012',
      role: 'user',
      status: 'active'
    };

    console.log('테스트 데이터 (UUID 포함):', testDataWithId);

    const { data: insertData2, error: insertError2 } = await supabase
      .from('users')
      .insert(testDataWithId)
      .select();

    if (insertError2) {
      console.log('❌ UUID 포함 삽입 실패:', insertError2.message);
    } else {
      console.log('✅ UUID 포함 삽입 성공:', insertData2);
      
      // 테스트 데이터 삭제
      if (insertData2 && insertData2[0]) {
        await supabase
          .from('users')
          .delete()
          .eq('id', insertData2[0].id);
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }

  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error);
  }
}

// UUID 패키지 설치 필요 시 알림
try {
  require('uuid');
  checkUsersSchema();
} catch (err) {
  console.log('❌ uuid 패키지가 필요합니다. npm install uuid 실행 후 다시 시도하세요.');
}