// 사용자 생성 오류 디버깅
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 사용자 생성 오류 디버깅');
console.log('=========================');

// Service Role Key로 클라이언트 생성
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Anon Key로 클라이언트 생성 (프론트엔드와 동일)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function debugUserCreation() {
  try {
    console.log('🔑 키 정보 확인');
    console.log('---------------');
    console.log('URL:', supabaseUrl);
    console.log('Service Key 존재:', !!supabaseServiceKey);
    console.log('Anon Key 존재:', !!supabaseAnonKey);
    console.log('Service Key 시작:', supabaseServiceKey?.substring(0, 20) + '...');
    console.log('Anon Key 시작:', supabaseAnonKey?.substring(0, 20) + '...');

    console.log('\n🧪 Service Role Key로 사용자 생성 테스트');
    console.log('------------------------------------------');
    
    const testEmail = `testuser${Date.now()}@the-realty.co.kr`;
    
    const { data: serviceResult, error: serviceError } = await supabaseService.auth.admin.createUser({
      email: testEmail,
      password: 'defaultPassword123!',
      email_confirm: true,
      user_metadata: {
        name: '테스트 사용자',
        role: 'user'
      }
    });

    if (serviceError) {
      console.log('❌ Service Key 사용자 생성 실패:', serviceError.message);
      console.log('상세 오류:', serviceError);
    } else {
      console.log('✅ Service Key 사용자 생성 성공');
      console.log('생성된 사용자 ID:', serviceResult.user.id);
      
      // 생성된 사용자 정리
      await supabaseService.auth.admin.deleteUser(serviceResult.user.id);
      console.log('🗑️ 테스트 사용자 정리 완료');
    }

    console.log('\n🧪 Anon Key로 사용자 생성 테스트 (실제 프론트엔드 상황)');
    console.log('--------------------------------------------------------');
    
    const testEmail2 = `testuser${Date.now() + 1}@the-realty.co.kr`;
    
    // 프론트엔드에서 사용하는 것과 동일한 방식
    const { data: anonResult, error: anonError } = await supabaseAnon.auth.admin.createUser({
      email: testEmail2,
      password: 'defaultPassword123!',
      email_confirm: true,
      user_metadata: {
        name: '테스트 사용자 2',
        role: 'user'
      }
    });

    if (anonError) {
      console.log('❌ Anon Key 사용자 생성 실패 (예상됨):', anonError.message);
      console.log('이것이 프론트엔드에서 발생하는 오류입니다!');
    } else {
      console.log('✅ Anon Key 사용자 생성 성공 (예상치 못함)');
      await supabaseService.auth.admin.deleteUser(anonResult.user.id);
    }

    console.log('\n🔧 해결책 확인');
    console.log('--------------');
    console.log('1. 프론트엔드는 anon key만 사용할 수 있음');
    console.log('2. admin.createUser는 service role key가 필요함');
    console.log('3. 해결 방법:');
    console.log('   - 서버리스 함수(Edge Function) 사용');
    console.log('   - 또는 일반 회원가입 API 사용');
    console.log('   - 또는 관리자가 수동으로 초대 링크 생성');

    console.log('\n💡 일반 회원가입 API 테스트');
    console.log('---------------------------');
    
    const testEmail3 = `testuser${Date.now() + 2}@the-realty.co.kr`;
    
    const { data: signupResult, error: signupError } = await supabaseAnon.auth.signUp({
      email: testEmail3,
      password: 'defaultPassword123!',
      options: {
        data: {
          name: '테스트 사용자 3',
          role: 'user'
        }
      }
    });

    if (signupError) {
      console.log('❌ 일반 회원가입 실패:', signupError.message);
    } else {
      console.log('✅ 일반 회원가입 성공');
      console.log('사용자 ID:', signupResult.user?.id);
      console.log('이메일 확인 필요:', !signupResult.user?.email_confirmed_at);
      
      // 정리
      if (signupResult.user?.id) {
        await supabaseService.auth.admin.deleteUser(signupResult.user.id);
        console.log('🗑️ 테스트 사용자 정리 완료');
      }
    }

  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  }
}

debugUserCreation();