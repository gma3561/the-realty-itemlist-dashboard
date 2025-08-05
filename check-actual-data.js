const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjI0MTgsImV4cCI6MjA1MzMzODQxOH0.z7C6bXL0Y6kCJEPIu6AlKLGi1vgfwdD9QQ0rtjcqe5g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActualData() {
  try {
    console.log('🔍 실제 데이터베이스 조회 중...\n');
    
    // 1. 전체 매물 개수 확인 (count only)
    const { count: totalCount, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 개수 조회 실패:', countError);
      return;
    }
    
    console.log(`📊 총 매물 개수: ${totalCount}개`);
    
    // 2. 최근 5개 매물 정보만 가져오기
    const { data: recentProperties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, property_name, location, created_at, manager_id')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (propertiesError) {
      console.error('❌ 매물 조회 실패:', propertiesError);
      return;
    }
    
    console.log('\n📋 최근 등록된 매물 5개:');
    recentProperties.forEach((property, index) => {
      console.log(`${index + 1}. ${property.property_name || '이름없음'}`);
      console.log(`   📍 위치: ${property.location || '위치미상'}`);
      console.log(`   👤 담당자: ${property.manager_id || '없음'}`);
      console.log(`   📅 등록일: ${property.created_at?.substring(0, 10) || '미상'}`);
      console.log('');
    });
    
    // 3. 담당자별 매물 개수
    const { data: managerStats, error: statsError } = await supabase
      .from('properties')
      .select('manager_id')
      .not('manager_id', 'is', null);
    
    if (!statsError && managerStats) {
      const managerCounts = {};
      managerStats.forEach(prop => {
        const managerId = prop.manager_id || 'unknown';
        managerCounts[managerId] = (managerCounts[managerId] || 0) + 1;
      });
      
      console.log('👥 담당자별 매물 현황:');
      Object.entries(managerCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([manager, count]) => {
          console.log(`   ${manager}: ${count}건`);
        });
    }
    
  } catch (error) {
    console.error('💥 확인 중 오류:', error);
  }
}

checkActualData();