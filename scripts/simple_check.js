// 간단한 Supabase 연결 테스트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Supabase 연결 테스트 시작...');
  
  try {
    // 테이블이 있는지 확인
    const tables = ['properties', 'property_types', 'transaction_types', 'users', 'roles'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`${table} 테이블:`, error.message);
      } else {
        console.log(`${table} 테이블: 연결 성공, 레코드 ${data.length}개`);
      }
    }
    
    console.log('연결 테스트 완료');
  } catch (error) {
    console.error('오류 발생:', error.message);
  }
}

testConnection();