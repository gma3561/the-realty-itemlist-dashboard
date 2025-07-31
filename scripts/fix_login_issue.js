// 로그인 문제 완전 해결
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 로그인 문제 완전 해결');
console.log('========================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLoginIssue() {
  try {
    console.log('\n1️⃣ 기존 사용자 확인 및 삭제');
    console.log('-----------------------------');
    
    // 모든 사용자 목록 조회
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ 사용자 목록 조회 실패:', listError.message);
      return;
    }
    
    console.log(`📋 현재 사용자 수: ${users.users.length}명`);
    
    // admin@the-realty.co.kr 찾기
    const existingAdmin = users.users.find(user => user.email === 'admin@the-realty.co.kr');
    
    if (existingAdmin) {
      console.log(`✅ 기존 관리자 발견: ${existingAdmin.id}`);
      
      // 기존 사용자 삭제
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAdmin.id);
      
      if (deleteError) {
        console.log('❌ 기존 사용자 삭제 실패:', deleteError.message);
      } else {
        console.log('✅ 기존 사용자 삭제 완료');
      }
      
      // public.users에서도 삭제
      const { error: publicDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', existingAdmin.id);
        
      if (!publicDeleteError) {
        console.log('✅ public.users에서도 삭제 완료');
      }
    }
    
    console.log('\n2️⃣ 새 관리자 계정 생성');
    console.log('------------------------');
    
    // 약간의 대기 시간
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 새 관리자 계정 생성
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@the-realty.co.kr',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: '관리자',
        role: 'admin'
      }
    });
    
    if (createError) {
      console.log('❌ 새 계정 생성 실패:', createError.message);
      return;
    }
    
    console.log('✅ 새 관리자 계정 생성 성공');
    console.log(`   ID: ${newUser.user.id}`);
    console.log(`   이메일: ${newUser.user.email}`);
    
    console.log('\n3️⃣ public.users 테이블 동기화');
    console.log('--------------------------------');
    
    // public.users 테이블에 추가
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: newUser.user.id,
        email: newUser.user.email,
        name: '관리자',
        role: 'admin'
      }]);
    
    if (insertError) {
      console.log('❌ public.users 추가 실패:', insertError.message);
    } else {
      console.log('✅ public.users 테이블 동기화 완료');
    }
    
    console.log('\n4️⃣ 로그인 테스트 (3초 대기 후)');
    console.log('----------------------------------');
    
    // 계정 생성 후 안정화를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // anon 키로 로그인 테스트
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });
    
    if (signInError) {
      console.log('❌ 로그인 테스트 실패:', signInError.message);
      
      // 한 번 더 시도
      console.log('🔄 5초 후 재시도...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const { data: retryData, error: retryError } = await anonSupabase.auth.signInWithPassword({
        email: 'admin@the-realty.co.kr',
        password: 'password123'
      });
      
      if (retryError) {
        console.log('❌ 재시도도 실패:', retryError.message);
        console.log('\n💡 수동 해결 방법:');
        console.log('1. Supabase 대시보드 접속');
        console.log('2. Authentication → Users');
        console.log('3. "Invite user" 버튼 클릭');
        console.log('4. 이메일: admin@the-realty.co.kr');
        console.log('5. 초대 메일에서 비밀번호를 password123으로 설정');
      } else {
        console.log('✅ 재시도 로그인 성공!');
      }
    } else {
      console.log('✅ 로그인 테스트 성공!');
      console.log(`   사용자: ${signInData.user.email}`);
      console.log(`   ID: ${signInData.user.id}`);
    }
    
    console.log('\n📋 최종 확인 사항');
    console.log('==================');
    
    // 최종 사용자 목록 확인
    const { data: finalUsers } = await supabase.auth.admin.listUsers();
    const finalAdmin = finalUsers.users.find(u => u.email === 'admin@the-realty.co.kr');
    
    if (finalAdmin) {
      console.log('✅ 관리자 계정 확인됨');
      console.log(`   이메일 확인: ${finalAdmin.email_confirmed_at ? '✅' : '❌'}`);
      console.log(`   생성 시간: ${finalAdmin.created_at}`);
    }
    
    console.log('\n🌐 웹사이트에서 테스트하세요');
    console.log('=============================');
    console.log('URL: https://gma3561.github.io/the-realty-itemlist-dashboard/');
    console.log('이메일: admin@the-realty.co.kr');
    console.log('비밀번호: password123');
    console.log('\n⚠️ 계정이 활성화되는데 1-2분 정도 걸릴 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 수정 중 오류:', error);
  }
}

fixLoginIssue();