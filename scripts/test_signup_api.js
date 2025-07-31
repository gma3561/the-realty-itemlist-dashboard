// 일반 회원가입 API 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('📝 일반 회원가입 API 테스트');
console.log('=========================');

// 프론트엔드와 동일한 설정
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testSignupApi() {
  try {
    const testEmail = `newuser${Date.now()}@the-realty.co.kr`;
    const userData = {
      email: testEmail,
      name: '신규 테스트 사용자',
      phone: '010-1234-5678',
      role: 'user'
    };

    console.log('🧪 프론트엔드와 동일한 방식으로 사용자 생성');
    console.log('------------------------------------------');
    console.log('테스트 데이터:', userData);

    // 1. 일반 회원가입 API 사용
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: 'defaultPassword123!',
      options: {
        data: {
          name: userData.name,
          role: userData.role
        }
      }
    });

    if (authError) {
      console.log('❌ Auth 사용자 생성 실패:', authError.message);
      return;
    }

    console.log('✅ Auth 사용자 생성 성공');
    console.log(`   ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Email Confirmed: ${!!authData.user.email_confirmed_at}`);

    // 2. public.users에 추가
    console.log('\n📝 Public.users에 프로필 추가');
    console.log('------------------------------');

    const { data: publicData, error: publicError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (publicError) {
      console.log('❌ Public users 추가 실패:', publicError.message);
      console.log('하지만 Auth 계정은 생성되었으므로 로그인은 가능합니다.');
    } else {
      console.log('✅ Public users 추가 성공');
      console.log('완전한 사용자 생성 프로세스 완료!');
    }

    // 3. 사용자 목록에서 확인
    console.log('\n📋 사용자 목록에서 확인');
    console.log('---------------------');

    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, name, role, status')
      .eq('email', testEmail);

    if (listError) {
      console.log('❌ 사용자 목록 조회 실패:', listError.message);
    } else if (allUsers.length > 0) {
      console.log('✅ 사용자 목록에서 확인됨:', allUsers[0]);
    } else {
      console.log('❌ 사용자 목록에서 찾을 수 없음');
    }

    // 4. 정리
    console.log('\n🗑️ 테스트 사용자 정리');
    console.log('--------------------');

    // Public users에서 삭제
    await supabase.from('users').delete().eq('id', authData.user.id);
    
    // Auth users에서 삭제 (service key 필요)
    await supabaseService.auth.admin.deleteUser(authData.user.id);
    
    console.log('✅ 테스트 사용자 정리 완료');

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testSignupApi();