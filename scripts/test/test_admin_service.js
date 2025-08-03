// 관리자 서비스 테스트
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('👑 관리자 서비스 테스트');
console.log('=====================');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 관리자 권한으로 사용자 추가 (프론트엔드 서비스와 동일)
const addUserAsAdmin = async (userData) => {
  try {
    // 1. 임시 Auth 사용자 생성
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: 'tempPassword123!',
      email_confirm: false,
      user_metadata: {
        name: userData.name,
        role: userData.role,
        created_by_admin: true,
        awaiting_google_login: true
      }
    });

    if (authError) {
      throw new Error(`임시 인증 사용자 생성 실패: ${authError.message}`);
    }

    // 2. public.users에 사용자 정보 저장
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        google_id: null,
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

    if (error) {
      // public.users 생성 실패 시 auth 사용자 정리
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`사용자 프로필 생성 실패: ${error.message}`);
    }

    return {
      ...data,
      isGoogleLoginPending: true,
      tempAuthCreated: true
    };
  } catch (error) {
    console.error('Admin service error:', error);
    throw error;
  }
};

async function testAdminService() {
  try {
    const testUserData = {
      email: `testuser${Date.now()}@the-realty.co.kr`,
      name: '테스트 사용자',
      phone: '010-1234-5678',
      role: 'user'
    };

    console.log('🧪 관리자 서비스로 사용자 추가 테스트');
    console.log('--------------------------------------');
    console.log('테스트 데이터:', testUserData);

    const result = await addUserAsAdmin(testUserData);
    
    console.log('✅ 사용자 추가 성공!');
    console.log('결과:', JSON.stringify(result, null, 2));

    console.log('\n📋 사용자 목록에서 확인');
    console.log('---------------------');

    const { data: users, error: listError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testUserData.email);

    if (listError) {
      console.log('❌ 사용자 목록 조회 실패:', listError.message);
    } else {
      console.log(`✅ 사용자 목록에서 확인됨 (${users.length}명)`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.status}`);
      });
    }

    console.log('\n🗑️ 테스트 사용자 정리');
    console.log('--------------------');

    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', result.id);

    if (deleteError) {
      console.log('❌ 정리 실패:', deleteError.message);
    } else {
      console.log('✅ 테스트 사용자 정리 완료');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testAdminService();