import { createClient } from '@supabase/supabase-js';

// 환경변수 대신 직접 값 사용 (GitHub Pages에서 환경변수 문제 해결)
const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjI0MTgsImV4cCI6MjA1MzMzODQxOH0.z7C6bXL0Y6kCJEPIu6AlKLGi1vgfwdD9QQ0rtjcqe5g';

console.log('🔗 Supabase 연결 설정:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // GitHub Pages에서 세션 지속성 문제 방지
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  }
});

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    console.log('🔄 Supabase 연결 테스트 시작...');
    
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ 연결 테스트 실패:', error);
      throw error;
    }
    
    console.log('✅ Supabase 연결 성공!');
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error.message);
    return false;
  }
};

export default supabase;