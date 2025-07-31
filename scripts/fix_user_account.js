// 사용자 계정 문제 해결
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 사용자 계정 문제 해결');
console.log('=======================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserAccount() {
  try {
    console.log('\n1️⃣ 이메일 확인 처리');
    console.log('--------------------');
    
    // 사용자 목록 조회
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ 사용자 목록 조회 실패:', usersError.message);
      return;
    }
    
    const adminUser = users.users.find(user => user.email === 'admin@the-realty.co.kr');
    
    if (!adminUser) {
      console.log('❌ admin@the-realty.co.kr 사용자를 찾을 수 없습니다');
      return;
    }
    
    console.log(`📋 사용자 ID: ${adminUser.id}`);
    console.log(`📋 이메일 확인 상태: ${adminUser.email_confirmed_at ? '확인됨' : '미확인'}`);
    
    // 이메일 확인 처리
    if (!adminUser.email_confirmed_at) {
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.log('❌ 이메일 확인 처리 실패:', updateError.message);
      } else {
        console.log('✅ 이메일 확인 처리 완료');
      }
    }
    
    console.log('\n2️⃣ public.users 테이블에 사용자 추가');
    console.log('--------------------------------------');
    
    // public.users 테이블에 관리자 추가
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .upsert([{
        id: adminUser.id,
        email: adminUser.email,
        name: '관리자',
        role: 'admin'
      }], { onConflict: 'id' });
    
    if (insertError) {
      console.log('❌ public.users 테이블 추가 실패:', insertError.message);
    } else {
      console.log('✅ public.users 테이블에 관리자 추가 완료');
    }
    
    console.log('\n3️⃣ 로그인 테스트');
    console.log('------------------');
    
    // anon 키로 로그인 테스트
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@the-realty.co.kr',
      password: 'password123'
    });
    
    if (signInError) {
      console.log('❌ 로그인 테스트 실패:', signInError.message);
      
      if (signInError.message.includes('Email not confirmed')) {
        console.log('💡 이메일 확인이 필요합니다. 다시 시도해보겠습니다...');
        
        // 강제로 이메일 확인
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          adminUser.id,
          { 
            email_confirm: true,
            email_confirmed_at: new Date().toISOString()
          }
        );
        
        if (confirmError) {
          console.log('❌ 강제 이메일 확인 실패:', confirmError.message);
        } else {
          console.log('✅ 강제 이메일 확인 완료. 다시 로그인 시도...');
          
          // 다시 로그인 시도
          const { data: retrySignIn, error: retryError } = await anonSupabase.auth.signInWithPassword({
            email: 'admin@the-realty.co.kr',
            password: 'password123'
          });
          
          if (retryError) {
            console.log('❌ 재시도 로그인 실패:', retryError.message);
          } else {
            console.log('✅ 재시도 로그인 성공!');
          }
        }
      }
    } else {
      console.log('✅ 로그인 테스트 성공!');
      console.log(`   사용자: ${signInData.user.email}`);
    }
    
    console.log('\n4️⃣ 매물 조회 테스트 (로그인 후)');
    console.log('--------------------------------');
    
    // 로그인 후 매물 조회 테스트
    const { data: properties, error: propertiesError } = await anonSupabase
      .from('properties')
      .select(`
        *,
        property_types(id, name),
        property_statuses(id, name),
        transaction_types(id, name)
      `);
    
    if (propertiesError) {
      console.log('❌ 매물 조회 실패:', propertiesError.message);
      
      if (propertiesError.message.includes('RLS') || propertiesError.code === 'PGRST116') {
        console.log('🔍 RLS 정책으로 인한 문제입니다.');
        console.log('💡 해결 방법: Supabase 대시보드에서 properties 테이블의 RLS 정책을 확인하거나 임시로 비활성화');
      }
    } else {
      console.log(`✅ 매물 조회 성공: ${properties?.length || 0}개`);
      
      if (properties && properties.length > 0) {
        properties.forEach((property, index) => {
          console.log(`   ${index + 1}. ${property.property_name}`);
        });
      }
    }
    
    console.log('\n📋 최종 결과');
    console.log('=============');
    console.log('✅ 사용자 계정 수정 완료');
    console.log('✅ public.users 테이블 동기화 완료');
    console.log('🌐 웹사이트에서 로그인 시도: https://gma3561.github.io/the-realty-itemlist-dashboard/');
    console.log('🔑 로그인 정보: admin@the-realty.co.kr / password123');
    
  } catch (error) {
    console.error('❌ 수정 중 오류:', error);
  }
}

fixUserAccount();