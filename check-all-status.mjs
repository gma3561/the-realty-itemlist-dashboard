import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjI0MTgsImV4cCI6MjA1MzMzODQxOH0.z7C6bXL0Y6kCJEPIu6AlKLGi1vgfwdD9QQ0rtjcqe5g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllStatus() {
  try {
    // 1. 전체 매물 개수
    const { count: totalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log('전체 매물 개수:', totalCount);
    
    // 2. 샘플 데이터로 실제 상태값 확인
    const { data: sampleData } = await supabase
      .from('properties')
      .select('id, property_name, property_status')
      .limit(20);
    
    console.log('\n샘플 데이터 (20개):');
    const statusCount = {};
    
    sampleData?.forEach((prop, index) => {
      const status = prop.property_status || 'null';
      statusCount[status] = (statusCount[status] || 0) + 1;
      
      if (index < 5) {
        console.log(`- ${prop.property_name}: "${prop.property_status}"`);
      }
    });
    
    console.log('\n샘플 데이터의 상태 분포:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`- "${status}": ${count}개`);
    });
    
    // 3. property_status가 null인 경우 확인
    const { count: nullCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .is('property_status', null);
    
    console.log('\nproperty_status가 null인 매물:', nullCount, '개');
    
    // 4. distinct property_status 값들 확인
    const { data: distinctStatus } = await supabase
      .from('properties')
      .select('property_status')
      .limit(1000);
    
    const uniqueStatuses = [...new Set(distinctStatus?.map(p => p.property_status))];
    console.log('\n데이터베이스에 있는 고유한 상태값들:');
    uniqueStatuses.forEach(status => {
      console.log(`- "${status}"`);
    });
    
  } catch (error) {
    console.error('오류:', error);
  }
}

checkAllStatus();