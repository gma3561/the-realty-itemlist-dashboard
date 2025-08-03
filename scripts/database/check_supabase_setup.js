// Supabase 설정 및 사용자 계정 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase 설정 및 사용자 계정 확인');
console.log('====================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseSetup() {
  try {
    console.log('\n1️⃣ 사용자 계정 확인');
    console.log('-------------------');
    
    // auth.users 테이블에서 사용자 확인
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ 사용자 목록 조회 실패:', usersError.message);
      return;
    }
    
    console.log(`📋 총 사용자 수: ${users.users?.length || 0}명`);
    
    if (users.users && users.users.length > 0) {
      users.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      생성일: ${user.created_at}`);
        console.log(`      확인됨: ${user.email_confirmed_at ? '✅' : '❌'}`);
      });
    } else {
      console.log('⚠️ 등록된 사용자가 없습니다!');
      console.log('💡 해결 방법: admin@the-realty.co.kr 사용자를 생성해야 합니다.');
    }
    
    console.log('\n2️⃣ public.users 테이블 확인');
    console.log('---------------------------');
    
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (publicUsersError) {
      console.log('❌ public.users 조회 실패:', publicUsersError.message);
    } else {
      console.log(`📋 public.users 레코드 수: ${publicUsers?.length || 0}개`);
      if (publicUsers && publicUsers.length > 0) {
        publicUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email}`);
          console.log(`      역할: ${user.role}`);
        });
      }
    }
    
    console.log('\n3️⃣ RLS 정책 확인');
    console.log('------------------');
    
    // properties 테이블 RLS 상태 확인
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_table_rls_status', { table_name: 'properties' })
      .single();
    
    if (rlsError) {
      console.log('❌ RLS 상태 확인 실패 (함수 없음)');
      console.log('💡 수동으로 Supabase 대시보드에서 확인 필요');
    } else {
      console.log(`📋 properties 테이블 RLS: ${rlsStatus ? '활성화' : '비활성화'}`);
    }
    
    console.log('\n4️⃣ 관리자 계정 생성 (없는 경우)');
    console.log('-------------------------------');
    
    const adminExists = users.users?.some(user => user.email === 'admin@the-realty.co.kr');
    
    if (!adminExists) {
      console.log('⚠️ admin@the-realty.co.kr 계정이 없습니다. 생성을 시도합니다...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@the-realty.co.kr',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          role: 'admin'
        }
      });
      
      if (createError) {
        console.log('❌ 관리자 계정 생성 실패:', createError.message);
        console.log('💡 Supabase 대시보드 → Authentication → Users에서 수동으로 생성해주세요.');
      } else {
        console.log('✅ 관리자 계정 생성 성공!');
        console.log(`   이메일: ${newUser.user.email}`);
        console.log(`   ID: ${newUser.user.id}`);
        
        // public.users 테이블에도 추가
        const { error: publicUserError } = await supabase
          .from('users')
          .upsert([{
            id: newUser.user.id,
            email: newUser.user.email,
            name: '관리자',
            role: 'admin'
          }]);
        
        if (publicUserError) {
          console.log('⚠️ public.users 테이블 추가 실패:', publicUserError.message);
        } else {
          console.log('✅ public.users 테이블에도 추가 완료');
        }
      }
    } else {
      console.log('✅ admin@the-realty.co.kr 계정이 존재합니다.');
    }
    
    console.log('\n5️⃣ 해결 방안 제시');
    console.log('-------------------');
    
    if (!adminExists) {
      console.log('🚨 주요 문제: 관리자 계정이 없음');
      console.log('📋 해결 방법:');
      console.log('   1. 위에서 계정 생성이 성공했다면 웹사이트에서 로그인 시도');
      console.log('   2. 생성 실패 시 Supabase 대시보드에서 수동 생성');
      console.log('   3. 이메일: admin@the-realty.co.kr');
      console.log('   4. 비밀번호: password123');
    }
    
    if (users.users?.length === 0) {
      console.log('🚨 인증 시스템 문제: 사용자 테이블이 비어있음');
    }
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

checkSupabaseSetup();