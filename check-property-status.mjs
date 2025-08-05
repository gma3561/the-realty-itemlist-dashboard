import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjI0MTgsImV4cCI6MjA1MzMzODQxOH0.z7C6bXL0Y6kCJEPIu6AlKLGi1vgfwdD9QQ0rtjcqe5g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPropertyStatus() {
  try {
    console.log('🔍 매물 상태별 통계 조회 중...\n');
    
    // 1. 상태별 매물 개수 조회
    const statuses = ['available', 'contract', 'completed', 'hold', 'cancelled', 'inspection_available'];
    
    for (const status of statuses) {
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('property_status', status);
      
      if (!error) {
        console.log(`${status}: ${count || 0}개`);
      }
    }
    
    // 2. 전체 매물 수 (거래완료/거래철회 제외)
    const { count: activeCount, error: activeError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .not('property_status', 'in', '(completed,cancelled)');
    
    if (!activeError) {
      console.log(`\n✅ 활성 매물 수 (거래완료/거래철회 제외): ${activeCount}개`);
    }
    
    // 3. 전체 매물 수
    const { count: totalCount, error: totalError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    if (!totalError) {
      console.log(`📊 전체 매물 수: ${totalCount}개`);
    }
    
    // 4. 실제 데이터 10개 샘플링하여 상태 확인
    const { data: sampleData, error: sampleError } = await supabase
      .from('properties')
      .select('id, property_name, property_status')
      .limit(10);
    
    if (!sampleError && sampleData) {
      console.log('\n📋 샘플 데이터 (10개):');
      sampleData.forEach((prop, index) => {
        console.log(`${index + 1}. ${prop.property_name} - 상태: ${prop.property_status}`);
      });
    }
    
  } catch (error) {
    console.error('💥 확인 중 오류:', error);
  }
}

checkPropertyStatus();