// Supabase 연결 테스트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjI0MTgsImV4cCI6MjA1MzMzODQxOH0.z7C6bXL0Y6kCJEPIu6AlKLGi1vgfwdD9QQ0rtjcqe5g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Supabase 연결 테스트 시작...');
    
    const { data, error } = await supabase
      .from('properties')  
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ Supabase 연결 실패:', error.message);
      return false;
    }
    
    console.log('✅ Supabase 연결 성공!');
    return true;
  } catch (err) {
    console.error('❌ 연결 테스트 중 오류:', err.message);
    return false;
  }
}

testConnection();