#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

async function checkForeignKeyConstraints() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    console.log('🔍 Foreign Key 제약 조건 확인...');
    
    // property_type 값들 확인
    console.log('\n1️⃣ property_type 허용 값들:');
    const { data: propertyTypes, error: typeError } = await supabase
      .from('property_types')
      .select('*');
      
    if (typeError) {
      console.log('⚠️ property_types 테이블이 없거나 접근할 수 없습니다:', typeError.message);
      console.log('기존 properties 테이블에서 사용 중인 property_type 값들을 확인합니다...');
      
      const { data: existingTypes, error: existingError } = await supabase
        .from('properties')
        .select('property_type')
        .not('property_type', 'is', null);
        
      if (!existingError && existingTypes) {
        const uniqueTypes = [...new Set(existingTypes.map(p => p.property_type))];
        console.log('✅ 현재 사용 중인 property_type 값들:', uniqueTypes);
      }
    } else {
      console.log('✅ property_types 테이블 값들:', propertyTypes.map(t => t.id || t.value || t.type));
    }
    
    // property_status 값들 확인
    console.log('\n2️⃣ property_status 허용 값들:');
    const { data: propertyStatuses, error: statusError } = await supabase
      .from('property_statuses')
      .select('*');
      
    if (statusError) {
      console.log('⚠️ property_statuses 테이블이 없거나 접근할 수 없습니다:', statusError.message);
      console.log('기존 properties 테이블에서 사용 중인 property_status 값들을 확인합니다...');
      
      const { data: existingStatuses, error: existingStatusError } = await supabase
        .from('properties')
        .select('property_status')
        .not('property_status', 'is', null);
        
      if (!existingStatusError && existingStatuses) {
        const uniqueStatuses = [...new Set(existingStatuses.map(p => p.property_status))];
        console.log('✅ 현재 사용 중인 property_status 값들:', uniqueStatuses);
      }
    } else {
      console.log('✅ property_statuses 테이블 값들:', propertyStatuses.map(s => s.id || s.value || s.status));
    }
    
    // transaction_type 값들 확인
    console.log('\n3️⃣ transaction_type 허용 값들:');
    const { data: existingTransactionTypes, error: transactionError } = await supabase
      .from('properties')
      .select('transaction_type')
      .not('transaction_type', 'is', null);
      
    if (!transactionError && existingTransactionTypes) {
      const uniqueTransactionTypes = [...new Set(existingTransactionTypes.map(p => p.transaction_type))];
      console.log('✅ 현재 사용 중인 transaction_type 값들:', uniqueTransactionTypes);
    }
    
  } catch (error) {
    console.error('💥 Foreign Key 확인 실패:', error);
  }
}

checkForeignKeyConstraints();