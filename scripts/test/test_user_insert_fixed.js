// 수정된 사용자 추가 테스트
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('👥 수정된 사용자 추가 테스트');
console.log('===========================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserInsert() {
  try {
    console.log('🧪 UUID 생성하여 사용자 추가 테스트');
    console.log('-----------------------------------');
    
    // 수정된 사용자 데이터 (실제 컴포넌트와 동일)
    const userData = {
      id: uuidv4(),
      email: 'newuser@company.com', // 실제 도메인 사용
      name: '신규 사용자',
      phone: '010-9999-8888',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('테스트 데이터:', JSON.stringify(userData, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ 사용자 추가 실패:', insertError.message);
      console.log('상세 오류:', insertError);
    } else {
      console.log('✅ 사용자 추가 성공!');
      console.log('추가된 데이터:', JSON.stringify(insertData, null, 2));
      
      // 테스트 데이터 삭제
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', insertData.id);
        
      if (!deleteError) {
        console.log('🗑️ 테스트 데이터 삭제 완료');
      }
    }

    // 이메일 제약조건 확인
    console.log('\n🔍 이메일 제약조건 확인');
    console.log('---------------------');
    
    const invalidEmails = [
      'invalid-email',
      'test@',
      '@domain.com',
      'test..test@domain.com'
    ];

    for (const email of invalidEmails) {
      const testData = {
        id: uuidv4(),
        email: email,
        name: '테스트',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.log(`❌ ${email}: ${error.message.substring(0, 50)}...`);
      } else {
        console.log(`✅ ${email}: 삽입 성공 (예상치 못함)`);
        // 성공했다면 삭제
        await supabase.from('users').delete().eq('email', email);
      }
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testUserInsert();