#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

async function testSimpleUpload() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // 매우 간단한 테스트 데이터
  const testProperty = {
    property_name: 'CSV 업로드 테스트',
    location: '서울특별시 강남구',
    property_type: 'apt',
    transaction_type: 'sale',
    property_status: 'available',
    price: 100000000, // 1억 (안전한 값)
    area_pyeong: 25,
    area_m2: 82.5,
    floor_current: 5,
    floor_total: 15,
    room_count: 3,
    bath_count: 2,
    manager_name: 'CSV 마이그레이션',
    view_count: 0
  };
  
  try {
    console.log('🧪 간단한 테스트 업로드 시작...');
    
    const { data, error } = await supabase
      .from('properties')
      .insert([testProperty])
      .select();
      
    if (error) {
      console.error('❌ 테스트 업로드 실패:', error.message);
      
      if (error.message.includes('row-level security')) {
        console.log('\n🔐 RLS(Row Level Security) 정책 때문에 업로드가 차단됩니다.');
        console.log('해결 방법:');
        console.log('1. Supabase 대시보드에서 RLS 정책 확인');
        console.log('2. properties 테이블의 INSERT 정책 수정');
        console.log('3. 또는 service_role 키 사용');
      }
      
      return false;
    }
    
    console.log('✅ 테스트 업로드 성공!');
    console.log('📋 업로드된 데이터:', data[0]);
    
    return true;
    
  } catch (error) {
    console.error('💥 테스트 업로드 중 오류:', error);
    return false;
  }
}

// RLS 정책 확인
async function checkRLSPolicies() {
  console.log('\n🔍 RLS 정책 확인을 위한 정보:');
  console.log('');
  console.log('Supabase 대시보드에서 확인해야 할 항목들:');
  console.log('1. Authentication > Users - 현재 로그인된 사용자');
  console.log('2. Database > properties 테이블 > RLS policies');
  console.log('3. SQL Editor에서 다음 쿼리 실행:');
  console.log('   SELECT * FROM pg_policies WHERE tablename = \'properties\';');
  console.log('');
  console.log('💡 임시 해결책:');
  console.log('SQL Editor에서 다음 명령 실행으로 RLS 비활성화 (개발 중에만):');
  console.log('   ALTER TABLE properties DISABLE ROW LEVEL SECURITY;');
  console.log('⚠️ 프로덕션에서는 적절한 RLS 정책을 설정해야 합니다.');
}

async function main() {
  const success = await testSimpleUpload();
  
  if (!success) {
    await checkRLSPolicies();
  } else {
    console.log('\n🎉 테스트 성공! CSV 데이터 업로드 준비 완료');
  }
}

main();