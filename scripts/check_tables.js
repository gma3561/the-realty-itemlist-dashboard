// 더부동산 통합 관리 시스템 테이블 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 테이블 목록과 각 테이블의 레코드 수 확인
async function checkTables() {
  try {
    console.log('Supabase 테이블 확인 시작...');
    console.log(`서버 URL: ${supabaseUrl}`);
    console.log('------------------------------------');
    
    // 테이블 목록
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
      try {
        // 각 테이블의 레코드 수 조회
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`${table} 테이블 확인 실패:`, error.message);
        } else {
          console.log(`${table} 테이블: ${count || 0}개 레코드`);
          
          // 테이블에 데이터가 있으면 샘플 데이터 조회
          if (count > 0) {
            const { data: sampleData, error: sampleError } = await supabase
              .from(table)
              .select('*')
              .limit(3);
            
            if (!sampleError && sampleData && sampleData.length > 0) {
              console.log(`  - 샘플 데이터: ${JSON.stringify(sampleData[0], null, 2).substring(0, 150)}...`);
            }
          }
        }
      } catch (err) {
        console.error(`${table} 테이블 확인 중 오류:`, err.message);
      }
    }
    
    console.log('------------------------------------');
    console.log('테이블 확인 완료!');
    
  } catch (error) {
    console.error('테이블 확인 중 오류 발생:', error);
  }
}

// 스크립트 실행
checkTables();