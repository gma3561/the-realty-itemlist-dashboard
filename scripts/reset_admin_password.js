// 관리자 비밀번호 재설정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 관리자 비밀번호 재설정');
console.log('=========================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  try {
    console.log('\n1️⃣ 관리자 계정 찾기');
    console.log('--------------------');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ 사용자 목록 조회 실패:', usersError.message);
      return;
    }
    
    const adminUser = users.users.find(user => user.email === 'admin@the-realty.co.kr');
    
    if (!adminUser) {
      console.log('❌ admin@the-realty.co.kr 계정을 찾을 수 없습니다');
      
      console.log('\n2️⃣ 새 관리자 계정 생성');
      console.log('------------------------');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@the-realty.co.kr',
        password: 'password123',
        email_confirm: true
      });
      
      if (createError) {
        console.log('❌ 계정 생성 실패:', createError.message);
        return;
      }
      
      console.log('✅ 새 관리자 계정 생성 성공');
      console.log(`   ID: ${newUser.user.id}`);
      
      // public.users 테이블에 추가
      const { error: publicUserError } = await supabase
        .from('users')
        .upsert([{
          id: newUser.user.id,
          email: newUser.user.email,
          name: '관리자',
          role: 'admin'
        }]);
      
      if (publicUserError) {
        console.log('⚠️ public.users 추가 실패:', publicUserError.message);
      } else {
        console.log('✅ public.users 테이블에도 추가됨');
      }
      
    } else {
      console.log(`✅ 관리자 계정 발견: ${adminUser.id}`);
      
      console.log('\n2️⃣ 비밀번호 재설정');
      console.log('--------------------');
      
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        { 
          password: 'password123',
          email_confirm: true
        }
      );
      
      if (updateError) {
        console.log('❌ 비밀번호 재설정 실패:', updateError.message);
        return;
      }
      
      console.log('✅ 비밀번호 재설정 성공');
      
      // public.users 테이블 동기화
      const { error: syncError } = await supabase
        .from('users')
        .upsert([{
          id: adminUser.id,
          email: adminUser.email,
          name: '관리자',
          role: 'admin'
        }], { onConflict: 'id' });
      
      if (syncError) {
        console.log('⚠️ public.users 동기화 실패:', syncError.message);
      } else {
        console.log('✅ public.users 테이블 동기화 완료');
      }
    }
    
    console.log('\n3️⃣ 로그인 테스트');
    console.log('------------------');
    
    // 약간의 지연 후 로그인 테스트
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });
    
    if (signInError) {
      console.log('❌ 로그인 테스트 여전히 실패:', signInError.message);
      console.log('💡 Supabase 대시보드에서 수동으로 확인이 필요할 수 있습니다');
      console.log('   1. Authentication → Users → admin@the-realty.co.kr 확인');
      console.log('   2. Email confirmed 상태 확인');
      console.log('   3. 비밀번호 재설정');
    } else {
      console.log('✅ 로그인 테스트 성공!');
      console.log(`   사용자 ID: ${signInData.user.id}`);
      console.log(`   이메일: ${signInData.user.email}`);
      
      // 로그인 후 매물 조회
      const { data: properties, error: propertiesError } = await anonSupabase
        .from('properties')
        .select('id, property_name')
        .limit(5);
      
      if (propertiesError) {
        console.log(`⚠️ 매물 조회 실패: ${propertiesError.message}`);
        if (propertiesError.code === 'PGRST116') {
          console.log('🔍 RLS 정책으로 인한 제한입니다');
        }
      } else {
        console.log(`✅ 매물 조회 성공: ${properties?.length || 0}개`);
      }
    }
    
    console.log('\n📋 다음 단계');
    console.log('=============');
    console.log('1. 웹사이트 접속: https://gma3561.github.io/the-realty-itemlist-dashboard/');
    console.log('2. 로그인 시도: admin@the-realty.co.kr / password123');
    console.log('3. 매물 목록 페이지에서 데이터 확인');
    
  } catch (error) {
    console.error('❌ 재설정 중 오류:', error);
  }
}

resetAdminPassword();