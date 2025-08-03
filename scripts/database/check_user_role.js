// 현재 사용자 권한 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('👤 사용자 권한 확인');
console.log('==================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole() {
  try {
    // 모든 사용자 조회
    console.log('📋 전체 사용자 목록');
    console.log('------------------');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log('❌ 사용자 조회 실패:', usersError.message);
      return;
    }

    console.log(`총 ${users.length}명의 사용자:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} (${user.name || '이름없음'})`);
    });

    // admin@the-realty.co.kr 사용자 상세 확인
    console.log('\n🔍 관리자 계정 상세 확인');
    console.log('-------------------------');
    
    const adminUser = users.find(u => u.email === 'admin@the-realty.co.kr');
    
    if (adminUser) {
      console.log('✅ 관리자 계정 존재');
      console.log('상세 정보:', JSON.stringify(adminUser, null, 2));
      
      // 권한 체크
      const isAdmin = adminUser.role === 'admin';
      console.log(`\n권한 상태: ${isAdmin ? '✅ 관리자' : '❌ 일반사용자'}`);
      
      if (!isAdmin) {
        console.log('\n🔧 관리자 권한 업데이트 중...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', adminUser.id);
          
        if (updateError) {
          console.log('❌ 권한 업데이트 실패:', updateError.message);
        } else {
          console.log('✅ 관리자 권한 업데이트 완료');
        }
      }
    } else {
      console.log('❌ 관리자 계정이 없습니다.');
    }

    // auth.users 테이블도 확인
    console.log('\n🔐 인증 테이블 확인');
    console.log('-------------------');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ 인증 사용자 조회 실패:', authError.message);
    } else {
      console.log(`인증된 사용자 수: ${authUsers.users.length}명`);
      
      const adminAuthUser = authUsers.users.find(u => u.email === 'admin@the-realty.co.kr');
      if (adminAuthUser) {
        console.log('✅ 관리자 인증 계정 존재');
        console.log(`   이메일: ${adminAuthUser.email}`);
        console.log(`   확인된 이메일: ${adminAuthUser.email_confirmed_at ? '✅' : '❌'}`);
        console.log(`   생성일: ${adminAuthUser.created_at}`);
        console.log(`   메타데이터:`, adminAuthUser.user_metadata);
      } else {
        console.log('❌ 관리자 인증 계정이 없습니다.');
      }
    }

  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

checkUserRole();