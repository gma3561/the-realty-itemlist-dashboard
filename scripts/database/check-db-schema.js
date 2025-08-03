#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

async function checkDatabaseSchema() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    console.log('🔍 데이터베이스 스키마 확인 중...');
    
    // 기존 데이터 하나 조회해서 실제 스키마 확인
    const { data: sampleData, error } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ 스키마 조회 실패:', error);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('✅ 현재 데이터베이스 스키마 (컬럼 목록):');
      const columns = Object.keys(sampleData[0]);
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });
      
      console.log('\n📋 샘플 데이터:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('⚠️ 데이터베이스에 데이터가 없어서 스키마를 확인할 수 없습니다.');
    }
    
  } catch (error) {
    console.error('💥 스키마 확인 실패:', error);
  }
}

checkDatabaseSchema();