// Supabase 직접 업로드 스크립트
// GitHub Pages 사이트에서 개발자 도구 콘솔에서 실행

async function uploadAllPropertiesToSupabase() {
  console.log('🚀 Supabase 매물 데이터 업로드 시작...');
  
  try {
    // processed_properties.json 데이터 로드
    const response = await fetch('/the-realty-itemlist-dashboard/processed_properties.json');
    if (!response.ok) {
      throw new Error('데이터 파일을 찾을 수 없습니다');
    }
    
    const allProperties = await response.json();
    console.log(`📊 총 ${allProperties.length}개 매물 데이터 로드 완료`);
    
    // Supabase 클라이언트 초기화 (전역 supabase 객체 사용)
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 로그인 후 시도해주세요.');
    }
    
    // 배치 단위로 업로드
    const BATCH_SIZE = 50;
    let uploadedCount = 0;
    let failedCount = 0;
    const errors = [];
    
    for (let i = 0; i < allProperties.length; i += BATCH_SIZE) {
      const batch = allProperties.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      try {
        console.log(`📤 배치 ${batchNumber} 업로드 중... (${batch.length}개 매물)`);
        
        const { data, error } = await supabase
          .from('properties')
          .insert(batch)
          .select();
          
        if (error) throw error;
        
        uploadedCount += batch.length;
        console.log(`✅ 배치 ${batchNumber} 완료: ${batch.length}개 업로드 (총 ${uploadedCount}개)`);
        
        // 배치 간 잠시 대기 (API 제한 방지)
        if (i + BATCH_SIZE < allProperties.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (batchError) {
        console.error(`❌ 배치 ${batchNumber} 실패:`, batchError);
        failedCount += batch.length;
        errors.push(`배치 ${batchNumber}: ${batchError.message}`);
      }
    }
    
    // 업로드 결과 출력
    console.log('\n🎉 업로드 완료!');
    console.log(`✅ 성공: ${uploadedCount}개`);
    console.log(`❌ 실패: ${failedCount}개`);
    
    if (errors.length > 0) {
      console.log('❌ 오류 목록:', errors);
    }
    
    // 거래유형별 통계
    const stats = {
      sale: allProperties.filter(p => p.transaction_type === 'sale').length,
      lease: allProperties.filter(p => p.transaction_type === 'lease').length,
      rent: allProperties.filter(p => p.transaction_type === 'rent').length
    };
    
    console.log('\n📈 업로드된 매물 통계:');
    console.log(`- 매매: ${stats.sale}개`);
    console.log(`- 전세: ${stats.lease}개`);
    console.log(`- 월세: ${stats.rent}개`);
    
    return {
      total: allProperties.length,
      uploaded: uploadedCount,
      failed: failedCount,
      errors: errors
    };
    
  } catch (error) {
    console.error('💥 업로드 실패:', error);
    throw error;
  }
}

// 실행 함수
console.log('🔧 매물 데이터 업로드 스크립트 로드 완료');
console.log('📝 사용법: uploadAllPropertiesToSupabase() 함수를 호출하세요');
console.log('🌐 GitHub Pages 사이트: https://gma3561.github.io/the-realty-itemlist-dashboard/');
console.log('🔑 로그인: admin / 12345');