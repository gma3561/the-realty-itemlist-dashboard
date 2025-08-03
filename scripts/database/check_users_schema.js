const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUsersSchema() {
  console.log('🔍 Users 테이블 스키마 확인...
');

  try {
    // 간단한 쿼리로 컬럼 확인
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 테이블 조회 오류:', error.message);
      
      // 테이블 존재 여부 확인
      console.log('
📊 테이블 존재 여부 확인 중...');
      const { data: tables, error: tableError } = await supabase
        .rpc('get_tables', { schema_name: 'public' })
        .catch(() => ({ data: null, error: 'RPC not available' }));

      if (tableError) {
        console.log('RPC를 통한 테이블 조회 불가');
      } else if (tables) {
        console.log('public 스키마의 테이블:', tables);
      }
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Users 테이블 존재 확인');
      console.log('
📋 컬럼 목록:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log('   - ' + col);
      });
    } else {
      console.log('⚠️  Users 테이블은 존재하지만 데이터가 없습니다.');
      
      // 빈 데이터로 스키마 추측 시도
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: 'test' })
        .select();
      
      if (insertError) {
        console.log('
오류 메시지를 통한 스키마 정보:');
        console.log(insertError.message);
      }
    }

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

checkUsersSchema();
