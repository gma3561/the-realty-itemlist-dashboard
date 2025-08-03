const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('📊 Supabase 스키마 확인 중...\n');

  try {
    // 1. properties 테이블 구조 확인
    const { data: columns, error } = await supabase
      .from('properties')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ properties 테이블 조회 실패:', error.message);
      
      // 테이블이 없는 경우 생성 필요
      console.log('\n⚠️  properties 테이블이 존재하지 않습니다.');
      console.log('📝 다음 순서로 마이그레이션을 실행하세요:');
      console.log('1. supabase/migrations/20250727000000_initial_schema.sql');
      console.log('2. supabase/migrations/20250727000001_initial_data.sql');
      return;
    }

    // 2. 사용자 확인
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('created_at', { ascending: true });

    if (!userError && users) {
      console.log(`✅ 등록된 사용자: ${users.length}명`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
      });
    }

    // 3. 룩업 테이블 확인
    const lookupTables = [
      'property_types',
      'property_statuses', 
      'transaction_types'
    ];

    console.log('\n📋 룩업 테이블 상태:');
    for (const table of lookupTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (!error && data) {
        console.log(`✅ ${table}: ${data.length}개 레코드`);
      } else {
        console.log(`❌ ${table}: 조회 실패 또는 없음`);
      }
    }

    // 4. 기존 매물 확인
    const { count, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n📊 기존 매물 수: ${count}개`);
    }

    // 5. 컬럼 확인을 위한 쿼리
    const { data: schemaInfo, error: schemaError } = await supabase.rpc('get_table_columns', {
      table_name: 'properties'
    }).single();

    if (schemaError) {
      // RPC 함수가 없는 경우 대체 방법
      console.log('\n📝 properties 테이블 컬럼 확인을 위해 다음 SQL을 실행하세요:');
      console.log(`
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'properties'
ORDER BY ordinal_position;
      `);
    }

  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error);
  }
}

checkSchema();