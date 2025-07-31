// 이메일 제약조건 확인
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('📧 이메일 제약조건 분석');
console.log('=====================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmailConstraint() {
  try {
    // 기존 사용자 이메일 패턴 분석
    console.log('📋 기존 사용자 이메일 패턴');
    console.log('---------------------------');
    
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('email');

    if (error) {
      console.log('❌ 기존 사용자 조회 실패:', error.message);
      return;
    }

    console.log('기존 이메일들:');
    existingUsers.forEach(user => {
      console.log(`  - ${user.email}`);
    });

    // 관리자 이메일과 동일한 도메인으로 테스트
    console.log('\n🧪 관리자와 동일한 도메인으로 테스트');
    console.log('------------------------------------');
    
    const testEmails = [
      'user@the-realty.co.kr',
      'test@the-realty.co.kr',
      'newuser@the-realty.co.kr'
    ];

    for (const email of testEmails) {
      const testData = {
        id: uuidv4(),
        email: email,
        name: '테스트 사용자',
        phone: '010-1234-5678',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        console.log(`❌ ${email}: ${insertError.message}`);
      } else {
        console.log(`✅ ${email}: 삽입 성공!`);
        
        // 성공한 테스트 데이터 삭제
        await supabase
          .from('users')
          .delete()
          .eq('id', insertData.id);
        console.log(`🗑️ ${email}: 테스트 데이터 삭제 완료`);
      }
    }

    // 데이터베이스 제약조건 확인
    console.log('\n🔍 데이터베이스 제약조건 확인');
    console.log('-------------------------------');
    
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'users' })
      .catch(async () => {
        // RPC가 없으면 직접 쿼리
        return await supabase
          .from('information_schema.check_constraints')
          .select('*')
          .like('constraint_name', '%users_email%');
      });

    if (constraintError) {
      console.log('제약조건 정보를 가져올 수 없습니다.');
    } else if (constraints && constraints.data) {
      console.log('이메일 관련 제약조건:', constraints.data);
    }

  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

checkEmailConstraint();