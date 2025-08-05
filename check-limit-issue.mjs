import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aekgsysvipnwxhwixglg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla2dzeXN2aXBud3hod2l4Z2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjI0MTgsImV4cCI6MjA1MzMzODQxOH0.z7C6bXL0Y6kCJEPIu6AlKLGi1vgfwdD9QQ0rtjcqe5g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLimit() {
  try {
    // 1. 기본 조회 (limit 없음)
    const { data: defaultData, error: defaultError } = await supabase
      .from('properties')
      .select('id')
      .eq('property_status', 'available');
    
    console.log('기본 조회 (limit 없음):', defaultData?.length || 0, '개');
    
    // 2. limit 10000으로 조회
    const { data: limitData, error: limitError } = await supabase
      .from('properties')
      .select('id')
      .eq('property_status', 'available')
      .limit(10000);
    
    console.log('limit 10000 조회:', limitData?.length || 0, '개');
    
    // 3. count만 조회
    const { count, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('property_status', 'available');
    
    console.log('count 조회:', count || 0, '개');
    
    // 4. 페이지네이션으로 조회
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore && page < 5) { // 최대 5페이지까지만
      const { data: pageData, error: pageError } = await supabase
        .from('properties')
        .select('id')
        .eq('property_status', 'available')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (pageData && pageData.length > 0) {
        allData = [...allData, ...pageData];
        console.log(`페이지 ${page + 1}: ${pageData.length}개 추가 (누적: ${allData.length}개)`);
        hasMore = pageData.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }
    
    console.log('\n최종 결과:');
    console.log('- 실제 available 매물 수:', count || 0, '개');
    console.log('- 페이지네이션으로 가져온 수:', allData.length, '개');
    
  } catch (error) {
    console.error('오류:', error);
  }
}

checkLimit();