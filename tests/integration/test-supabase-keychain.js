#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔑 키체인 자격 증명으로 Supabase 연결 테스트...');
  
  const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 1. 연결 테스트
    console.log('📡 기본 연결 테스트...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('properties')
      .select('count', { count: 'exact', head: true });
      
    if (healthError) {
      console.error('❌ 연결 실패:', healthError.message);
      return false;
    }
    
    console.log('✅ Supabase 연결 성공!');
    console.log(`📊 현재 properties 테이블 레코드 수: ${healthCheck || 0}`);
    
    // 2. 테이블 구조 확인
    console.log('\n🏗️ 테이블 구조 확인...');
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'properties' });
      
    if (columnError) {
      console.warn('⚠️ 테이블 구조 조회 실패 (하지만 연결은 성공):', columnError.message);
    } else {
      console.log('✅ 테이블 구조 조회 성공');
    }
    
    // 3. 샘플 데이터 조회
    console.log('\n🔍 샘플 데이터 조회...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('properties')
      .select('id, property_name, location')
      .limit(3);
      
    if (sampleError) {
      console.warn('⚠️ 샘플 데이터 조회 실패:', sampleError.message);
    } else {
      console.log('✅ 샘플 데이터 조회 성공');
      console.log('📋 샘플 데이터:', sampleData);
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 연결 테스트 실패:', error.message);
    return false;
  }
}

// 실행
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Supabase 연결 성공! 이제 CSV 데이터를 업로드할 수 있습니다.');
    } else {
      console.log('\n❌ Supabase 연결 실패. 자격 증명을 다시 확인해주세요.');
    }
  })
  .catch(error => {
    console.error('💥 스크립트 실행 실패:', error);
  });