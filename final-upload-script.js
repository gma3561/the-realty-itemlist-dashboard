// 🚀 최종 매물 데이터 업로드 스크립트
// 메인 사이트 (https://gma3561.github.io/the-realty-itemlist-dashboard/)에서
// 로그인 후 개발자 도구 콘솔에서 실행하세요

async function uploadAllProperties() {
    console.log('🚀 매물 데이터 업로드 시작');
    
    try {
        // 1. 데이터 로드
        console.log('📊 데이터 로드 중...');
        const response = await fetch('https://gma3561.github.io/the-realty-itemlist-dashboard/processed_properties.json');
        if (!response.ok) throw new Error('데이터 로드 실패');
        
        const allProperties = await response.json();
        console.log(`✅ ${allProperties.length}개 매물 데이터 로드 완료`);
        
        // 2. Supabase 연결 확인 (전역 supabase 객체 사용)
        if (typeof supabase === 'undefined') {
            throw new Error('❌ Supabase 연결이 필요합니다. 먼저 로그인해주세요.');
        }
        console.log('✅ Supabase 연결 확인');
        
        // 3. 배치 업로드
        const BATCH_SIZE = 25;
        let uploadedCount = 0;
        let failedCount = 0;
        const errors = [];
        
        console.log('📤 배치 업로드 시작...');
        
        for (let i = 0; i < allProperties.length; i += BATCH_SIZE) {
            const batch = allProperties.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(allProperties.length / BATCH_SIZE);
            
            try {
                console.log(`📦 배치 ${batchNumber}/${totalBatches} 업로드 중... (${batch.length}개)`);
                
                const { data, error } = await supabase
                    .from('properties')
                    .insert(batch)
                    .select();
                    
                if (error) throw error;
                
                uploadedCount += batch.length;
                console.log(`✅ 배치 ${batchNumber} 성공: ${batch.length}개 (총 ${uploadedCount}개)`);
                
                // 진행률 표시
                const progress = Math.round((uploadedCount / allProperties.length) * 100);
                console.log(`📈 진행률: ${progress}%`);
                
                // 배치 간 잠시 대기 (API 제한 방지)
                if (i + BATCH_SIZE < allProperties.length) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
            } catch (batchError) {
                failedCount += batch.length;
                const errorMsg = `배치 ${batchNumber}: ${batchError.message}`;
                errors.push(errorMsg);
                console.error(`❌ 배치 ${batchNumber} 실패:`, batchError.message);
            }
        }
        
        // 4. 최종 결과
        console.log('\\n🎉 업로드 완료!');
        console.log(`✅ 성공: ${uploadedCount}개`);
        console.log(`❌ 실패: ${failedCount}개`);
        console.log(`📊 전체: ${allProperties.length}개`);
        
        if (errors.length > 0) {
            console.log('❌ 오류 목록:');
            errors.forEach(error => console.log(`  - ${error}`));
        }
        
        // 5. 거래유형별 통계
        const stats = {
            sale: allProperties.filter(p => p.transaction_type === 'sale').length,
            lease: allProperties.filter(p => p.transaction_type === 'lease').length,
            rent: allProperties.filter(p => p.transaction_type === 'rent').length
        };
        
        console.log('\\n📈 업로드된 매물 통계:');
        console.log(`💰 매매: ${stats.sale}개`);
        console.log(`🏠 전세: ${stats.lease}개`);
        console.log(`📅 월세: ${stats.rent}개`);
        
        // 6. 성공적으로 업로드된 경우 확인
        if (uploadedCount > 0) {
            console.log('\\n🔍 업로드 확인 중...');
            const { data: verifyData } = await supabase
                .from('properties')
                .select('id', { count: 'exact' });
            console.log(`✅ 데이터베이스 총 매물 수: ${verifyData.length}개`);
        }
        
        return {
            total: allProperties.length,
            uploaded: uploadedCount,
            failed: failedCount,
            errors: errors,
            stats: stats
        };
        
    } catch (error) {
        console.error('💥 업로드 실패:', error.message);
        throw error;
    }
}

// 실행 함수 - 바로 실행하거나 수동으로 호출
console.log('📝 사용법:');
console.log('1. 메인 사이트에 로그인 (admin/12345)');
console.log('2. 개발자 도구 콘솔에서 uploadAllProperties() 함수 호출');
console.log('\\n💡 자동 실행을 원하면 아래 주석을 해제하세요:');
console.log('// uploadAllProperties();');

// 자동 실행 (필요시 주석 해제)
// uploadAllProperties();