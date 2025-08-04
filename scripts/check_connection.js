// 더부동산 통합 관리 시스템 연결 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  console.error('다음 환경 변수가 필요합니다: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 5) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  try {
    console.log('Supabase 연결 테스트 시작...');
    
    // 1. 기본 연결 테스트
    const { data: pong, error: pingError } = await supabase.rpc('pg_ping');
    
    if (pingError) {
      console.error('기본 연결 테스트 실패:', pingError);
      throw pingError;
    }
    
    console.log('기본 연결 테스트 성공!');
    
    // 2. 테이블 접근 테스트
    const tables = [
      'roles',
      'users',
      'customers',
      'properties',
      'property_types',
      'property_statuses',
      'transaction_types',
      'funnel_stages',
      'funnel_events',
      'performance_metrics',
      'performance_goals'
    ];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error(`'${table}' 테이블 접근 실패:`, error);
      } else {
        console.log(`'${table}' 테이블 접근 성공! 레코드 수: ${count || 'N/A'}`);
      }
    }
    
    // 3. 인증 테스트
    console.log('인증 테스트 중...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('인증 테스트 실패:', authError);
    } else {
      const sessionStatus = authData.session ? '활성화' : '없음';
      console.log(`인증 테스트 성공! 세션 상태: ${sessionStatus}`);
    }
    
    console.log('모든 테스트 완료!');
    console.log('====================================');
    console.log('✅ Supabase 연결이 정상적으로 동작합니다.');
    console.log('====================================');
    
  } catch (error) {
    console.error('연결 테스트 중 예상치 못한 오류 발생:', error);
    console.log('====================================');
    console.log('❌ Supabase 연결이 실패했습니다.');
    console.log('====================================');
    process.exit(1);
  }
}

checkConnection();