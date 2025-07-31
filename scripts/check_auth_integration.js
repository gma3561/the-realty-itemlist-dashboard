// Auth 시스템 연동 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔐 Auth 시스템 연동 확인');
console.log('======================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthIntegration() {
  try {
    // auth.users 테이블 확인
    console.log('👤 auth.users 테이블 확인');
    console.log('-------------------------');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ auth 사용자 조회 실패:', authError.message);
    } else {
      console.log(`✅ auth 사용자 수: ${authUsers.users.length}명`);
      authUsers.users.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('   ---');
      });
    }

    // public.users와 auth.users ID 비교
    console.log('\n🔗 public.users와 auth.users ID 연결 확인');
    console.log('------------------------------------------');
    
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email');

    if (publicError) {
      console.log('❌ public.users 조회 실패:', publicError.message);
    } else {
      console.log('Public users:');
      publicUsers.forEach(user => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        
        // auth.users에서 동일한 ID 찾기
        const matchingAuthUser = authUsers.users.find(authUser => authUser.id === user.id);
        if (matchingAuthUser) {
          console.log(`   ✅ Auth 연결됨: ${matchingAuthUser.email}`);
        } else {
          console.log(`   ❌ Auth 연결 안됨`);
        }
        console.log('   ---');
      });
    }

    // 해결책: auth.users에 먼저 사용자 생성
    console.log('\n💡 해결책: Auth 사용자 생성 후 Public 사용자 추가');
    console.log('-----------------------------------------------');
    
    console.log('1. auth.users에 먼저 사용자 생성');
    const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email: 'testuser@the-realty.co.kr',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: '테스트 사용자',
        role: 'user'
      }
    });

    if (createAuthError) {
      console.log('❌ Auth 사용자 생성 실패:', createAuthError.message);
    } else {
      console.log('✅ Auth 사용자 생성 성공');
      console.log(`   ID: ${newAuthUser.user.id}`);
      console.log(`   Email: ${newAuthUser.user.email}`);
      
      console.log('\n2. Public.users에 연결된 사용자 추가');
      const { data: newPublicUser, error: createPublicError } = await supabase
        .from('users')
        .insert({
          id: newAuthUser.user.id, // auth.users의 ID 사용
          email: newAuthUser.user.email,
          name: '테스트 사용자',
          phone: '010-1234-5678',
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createPublicError) {
        console.log('❌ Public 사용자 생성 실패:', createPublicError.message);
        
        // Auth 사용자 정리
        await supabase.auth.admin.deleteUser(newAuthUser.user.id);
        console.log('🗑️ Auth 사용자 정리 완료');
      } else {
        console.log('✅ Public 사용자 생성 성공');
        console.log('✅ 완전한 사용자 생성 프로세스 검증 완료');
        
        // 테스트 사용자 정리
        await supabase.from('users').delete().eq('id', newAuthUser.user.id);
        await supabase.auth.admin.deleteUser(newAuthUser.user.id);
        console.log('🗑️ 테스트 사용자 정리 완료');
      }
    }

  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

checkAuthIntegration();