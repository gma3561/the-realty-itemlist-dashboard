import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.log('   .env.local 파일에 다음 변수들이 필요합니다:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Key 존재:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('\n🔍 Supabase 데이터 확인 중...\n');

  // 1. Properties 테이블 확인
  console.log('📦 Properties 테이블:');
  const { data: properties, error: propError, count: propCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (propError) {
    console.log('❌ Properties 조회 실패:', propError.message);
  } else {
    console.log('- 전체 매물 수:', propCount);
    console.log('- 최근 매물 5개:');
    if (properties && properties.length > 0) {
      properties.forEach((prop, idx) => {
        console.log(`  ${idx + 1}. ${prop.address || '주소 없음'}`);
        console.log(`     - 상태: ${prop.property_status}`);
        console.log(`     - 담당자: ${prop.manager_id || '없음'}`);
        console.log(`     - 생성일: ${new Date(prop.created_at).toLocaleDateString('ko-KR')}`);
      });
    } else {
      console.log('  매물 데이터가 없습니다.');
    }
  }

  // 2. Users 테이블 확인
  console.log('\n👥 Users 테이블:');
  const { data: users, error: userError, count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (userError) {
    console.log('❌ Users 조회 실패:', userError.message);
  } else {
    console.log('- 전체 사용자 수:', userCount);
    if (users && users.length > 0) {
      console.log('- 사용자 목록:');
      users.forEach(user => {
        console.log(`  - ${user.name || '이름 없음'} (${user.email}) - ${user.role || 'user'}`);
      });
    } else {
      console.log('  사용자 데이터가 없습니다.');
    }
  }

  // 3. 상태별 매물 통계
  console.log('\n📊 매물 상태별 통계:');
  const { data: statusStats, error: statsError } = await supabase
    .from('properties')
    .select('property_status');
  
  if (!statsError && statusStats) {
    const statusCount = statusStats.reduce((acc, prop) => {
      const status = prop.property_status || '상태 없음';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}개`);
      });
  }

  // 4. Customer Contacts 테이블 확인
  console.log('\n📞 Customer Contacts 테이블:');
  const { count: contactCount } = await supabase
    .from('customer_contacts')
    .select('*', { count: 'exact', head: true });
  
  console.log('- 전체 고객 연락처 수:', contactCount || 0);

  // 5. Property Comments 테이블 확인
  console.log('\n💬 Property Comments 테이블:');
  const { count: commentCount } = await supabase
    .from('property_comments')
    .select('*', { count: 'exact', head: true });
  
  console.log('- 전체 코멘트 수:', commentCount || 0);

  // 6. 최근 활동 확인
  console.log('\n📈 최근 활동:');
  const { data: recentProps } = await supabase
    .from('properties')
    .select('created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (recentProps && recentProps.length > 0) {
    const lastUpdate = new Date(recentProps[0].updated_at);
    console.log('- 마지막 매물 업데이트:', lastUpdate.toLocaleString('ko-KR'));
  }
}

checkData()
  .then(() => console.log('\n✅ 데이터 확인 완료'))
  .catch(error => console.error('\n❌ 오류 발생:', error));