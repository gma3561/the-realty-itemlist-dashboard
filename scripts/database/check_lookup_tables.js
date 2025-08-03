const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLookupTables() {
  console.log('📋 룩업 테이블 확인 중...\n');
  
  try {
    // property_type이 별도 테이블인지 확인
    const tables = [
      'property_types',
      'transaction_types', 
      'property_statuses'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*');
        
        if (!error && data) {
          console.log(`✅ ${table} 테이블:`, data);
        } else {
          console.log(`❌ ${table} 테이블 없음 또는 오류`);
        }
      } catch (e) {
        console.log(`❌ ${table} 확인 실패`);
      }
    }
    
    // properties 테이블의 실제 데이터 확인
    console.log('\n📊 기존 properties 데이터 샘플:');
    const { data: sample } = await supabase
      .from('properties')
      .select('property_type, transaction_type, property_status')
      .limit(10);
    
    if (sample) {
      console.log('property_type 값들:', [...new Set(sample.map(s => s.property_type))]);
      console.log('transaction_type 값들:', [...new Set(sample.map(s => s.transaction_type))]);
      console.log('property_status 값들:', [...new Set(sample.map(s => s.property_status))]);
    }
    
  } catch (error) {
    console.error('오류:', error);
  }
}

checkLookupTables();