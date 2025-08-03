require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWrongProperties() {
  console.log('🔍 잘못된 상태값 가진 매물 확인 중...\n');

  // 1. contract 상태인 매물 찾기
  const { data: contractProperties, error: contractError } = await supabase
    .from('properties')
    .select('id, property_name, property_status')
    .eq('property_status', 'contract');

  if (contractError) {
    console.error('조회 오류:', contractError);
    return;
  }

  console.log(`📋 'contract' (계약중) 상태 매물: ${contractProperties.length}개`);
  contractProperties.forEach(p => {
    console.log(`  - ${p.property_name} (${p.id.substring(0, 8)})`);
  });

  if (contractProperties.length > 0) {
    console.log('\n✏️ contract → hold (거래보류)로 변경 중...');
    
    const { error: updateError } = await supabase
      .from('properties')
      .update({ property_status: 'hold' })
      .eq('property_status', 'contract');

    if (updateError) {
      console.error('❌ 업데이트 오류:', updateError);
    } else {
      console.log('✅ 상태 변경 완료!');
    }
  }

  // 2. 모든 상태값 분포 확인
  console.log('\n📊 전체 매물 상태 분포:');
  const { data: statusCount, error: countError } = await supabase
    .from('properties')
    .select('property_status');

  if (!countError) {
    const counts = {};
    statusCount.forEach(p => {
      counts[p.property_status] = (counts[p.property_status] || 0) + 1;
    });

    Object.entries(counts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}개`);
    });
  }

  // 3. 수정이 필요한 다른 상태값 확인
  const validStatuses = ['available', 'completed', 'hold', 'cancelled', 'inspection_available', 'inspection_progress'];
  const { data: invalidProperties, error: invalidError } = await supabase
    .from('properties')
    .select('id, property_name, property_status')
    .not('property_status', 'in', `(${validStatuses.join(',')})`);

  if (!invalidError && invalidProperties.length > 0) {
    console.log(`\n⚠️ 유효하지 않은 상태값 가진 매물: ${invalidProperties.length}개`);
    invalidProperties.forEach(p => {
      console.log(`  - ${p.property_name}: '${p.property_status}'`);
    });
  } else {
    console.log('\n✅ 모든 매물이 유효한 상태값을 가지고 있습니다.');
  }
}

fixWrongProperties();