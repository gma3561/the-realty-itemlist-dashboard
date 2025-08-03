const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSupabaseDataStatus() {
  console.log('🔍 수파베이스 데이터 상태 확인 시작...\n');

  try {
    // 1. 연결 상태 확인
    console.log('1️⃣ 수파베이스 연결 상태 확인');
    const { data: healthCheck, error: healthError } = await supabase
      .from('properties')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ 연결 실패:', healthError.message);
      return;
    }
    console.log('✅ 연결 성공\n');

    // 2. properties 테이블 데이터 확인
    console.log('2️⃣ Properties 테이블 상태');
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   총 레코드 수: ${propertiesCount}`);

    // 최근 5개 데이터 샘플
    const { data: sampleProperties } = await supabase
      .from('properties')
      .select('id, name, price_per_pyeong, completion_year, area_pyeong, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('   최근 추가된 데이터 (5개):');
    sampleProperties?.forEach(prop => {
      console.log(`   - ${prop.name} | ${prop.price_per_pyeong}만원/평 | ${prop.area_pyeong}평 | ${prop.completion_year}년`);
    });

    // 3. users 테이블 데이터 확인
    console.log('\n3️⃣ Users 테이블 상태');
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   총 사용자 수: ${usersCount}`);

    // 역할별 사용자 수
    const { data: roleStats } = await supabase
      .from('users')
      .select('role');
    
    const roleCounts = roleStats?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('   역할별 사용자 수:');
    Object.entries(roleCounts || {}).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count}명`);
    });

    // 4. 데이터 정합성 검증
    console.log('\n4️⃣ 데이터 정합성 검증');
    
    // NULL 값 체크
    const { count: nullPriceCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .is('price_per_pyeong', null);
    
    const { count: nullAreaCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .is('area_pyeong', null);

    console.log(`   - price_per_pyeong NULL 레코드: ${nullPriceCount}개`);
    console.log(`   - area_pyeong NULL 레코드: ${nullAreaCount}개`);

    // 최신 데이터 확인
    const { data: latestProperty } = await supabase
      .from('properties')
      .select('created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestProperty) {
      console.log(`   - 최신 데이터 생성일: ${new Date(latestProperty.created_at).toLocaleString('ko-KR')}`);
      console.log(`   - 최신 데이터 수정일: ${new Date(latestProperty.updated_at).toLocaleString('ko-KR')}`);
    }

    console.log('\n✅ 데이터 상태 확인 완료!');

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
  }
}

checkSupabaseDataStatus();