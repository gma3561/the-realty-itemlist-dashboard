import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🔗 Supabase 연결 테스트');
console.log('====================');

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL 존재:', !!url);
console.log('Key 존재:', !!key);
console.log('URL:', url);
console.log('Key 앞 10자:', key?.substring(0, 10) + '...');

if (url && key) {
  const supabase = createClient(url, key);
  
  try {
    console.log('\n📊 테이블 접근 테스트:');
    
    // Properties 테이블 테스트
    const { data: props, count: propCount, error: propError } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (propError) {
      console.log('❌ Properties 오류:', propError.message);
    } else {
      console.log('✅ Properties 접근 성공, 총', propCount, '개');
    }
    
    // Users 테이블 테스트  
    const { data: users, count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (userError) {
      console.log('❌ Users 오류:', userError.message);
    } else {
      console.log('✅ Users 접근 성공, 총', userCount, '개');
      if (users && users.length > 0) {
        console.log('   첫 번째 사용자:', users[0].name, users[0].email);
      }
    }
    
    // Auth 상태 확인
    const { data: session } = await supabase.auth.getSession();
    console.log('🔐 현재 세션:', !!session?.session);
    
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message);
  }
} else {
  console.log('❌ 환경변수가 설정되지 않음');
}