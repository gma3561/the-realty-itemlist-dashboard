#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

async function checkRLSStatus() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    console.log('🔍 properties 테이블 RLS 상태 확인...');
    
    // RLS 상태 확인
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status');
    
    if (rlsError) {
      console.log('⚠️ RLS 상태 확인 함수가 없습니다. 직접 SQL로 확인합니다.');
      
      // 테이블 정보 확인
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_name', 'properties');
        
      if (!tableError && tableInfo) {
        console.log('✅ properties 테이블 존재 확인');
      }
    }
    
    console.log('\n🔧 RLS 해결 방법:');
    console.log('1. 임시 해결 (개발용): RLS 비활성화');
    console.log('2. 권장 해결: 적절한 RLS 정책 생성');
    console.log('');
    
    return true;
    
  } catch (error) {
    console.error('💥 RLS 확인 실패:', error);
    return false;
  }
}

async function disableRLS() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    console.log('🔓 RLS 비활성화 시도...');
    
    const { data, error } = await supabase.rpc('disable_rls_for_properties');
    
    if (error) {
      console.log('❌ RLS 비활성화 실패:', error.message);
      console.log('\n📋 수동으로 Supabase 대시보드에서 실행해야 할 SQL:');
      console.log('```sql');
      console.log('ALTER TABLE properties DISABLE ROW LEVEL SECURITY;');
      console.log('```');
      return false;
    }
    
    console.log('✅ RLS 비활성화 성공!');
    return true;
    
  } catch (error) {
    console.error('💥 RLS 비활성화 실패:', error);
    return false;
  }
}

async function createPermissivePolicy() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('🛡️ 허용적인 RLS 정책 생성 시도...');
  console.log('\n📋 Supabase 대시보드 SQL Editor에서 실행할 정책:');
  console.log('```sql');
  console.log('-- 기존 정책 삭제 (있다면)');
  console.log('DROP POLICY IF EXISTS "Allow all for authenticated users" ON properties;');
  console.log('DROP POLICY IF EXISTS "Allow all operations" ON properties;');
  console.log('');
  console.log('-- 모든 작업 허용 정책 생성');
  console.log('CREATE POLICY "Allow all operations" ON properties');
  console.log('FOR ALL');
  console.log('USING (true)');
  console.log('WITH CHECK (true);');
  console.log('');
  console.log('-- 또는 완전히 비활성화');
  console.log('ALTER TABLE properties DISABLE ROW LEVEL SECURITY;');
  console.log('```');
}

async function main() {
  console.log('🔐 RLS 정책 분석 및 해결 방안 제시\n');
  
  await checkRLSStatus();
  
  console.log('\n🎯 추천 해결 순서:');
  console.log('');
  console.log('1️⃣ 즉시 해결 (개발용):');
  console.log('   Supabase 대시보드 > SQL Editor에서 실행:');
  console.log('   ALTER TABLE properties DISABLE ROW LEVEL SECURITY;');
  console.log('');
  console.log('2️⃣ 장기 해결 (프로덕션 준비):');
  console.log('   적절한 RLS 정책 설정');
  console.log('');
  console.log('3️⃣ 업로드 재시도:');
  console.log('   node upload-to-current-schema.js');
  
  await createPermissivePolicy();
}

main();