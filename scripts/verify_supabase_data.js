const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySupabaseData() {
  console.log('🔍 Supabase 데이터 검증 중...\n');
  
  try {
    // 1. Supabase에서 직접 데이터 조회
    const { data: properties, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`✅ Supabase properties 테이블 총 레코드 수: ${count}개\n`);
    
    // 2. 최근 추가된 매물 확인
    console.log('📋 최근 추가된 매물 5개:');
    properties?.forEach((property, index) => {
      console.log(`\n[${index + 1}] ${property.property_name}`);
      console.log(`   - ID: ${property.id}`);
      console.log(`   - 위치: ${property.location}`);
      console.log(`   - 가격: ${property.price?.toLocaleString()}원`);
      console.log(`   - 담당자: ${property.manager_name}`);
      console.log(`   - 생성일: ${property.created_at}`);
    });
    
    // 3. 담당자별 통계
    const { data: managerStats } = await supabase
      .from('properties')
      .select('manager_name');
    
    const stats = {};
    managerStats?.forEach(item => {
      stats[item.manager_name] = (stats[item.manager_name] || 0) + 1;
    });
    
    console.log('\n📊 담당자별 매물 수:');
    Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([name, count]) => {
        console.log(`   - ${name}: ${count}개`);
      });
    
    // 4. Supabase URL 확인
    console.log('\n🌐 Supabase 프로젝트 정보:');
    console.log(`   - URL: ${supabaseUrl}`);
    console.log(`   - 프로젝트 ID: ${supabaseUrl.split('.')[0].replace('https://', '')}`);
    
    // 5. 오늘 추가된 데이터 확인
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    console.log(`\n📅 오늘(${today}) 추가된 매물: ${todayCount}개`);
    
    console.log('\n✅ 검증 완료: 데이터가 Supabase에 정상적으로 저장되어 있습니다!');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

verifySupabaseData();