// Supabase 연결 확인 및 데이터 검증 스크립트
const SUPABASE_URL = 'https://mtgicixejxtidvskoyqy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Z2ljaXhlanh0aWR2c2tveXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1Mzk5MTAsImV4cCI6MjA1MzExNTkxMH0.hQy3fPt-YWYZXOWOAjGlFGNkP2NnmSDUhHvjEHo9BZg';

async function checkSupabaseData() {
    try {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        console.log('🔍 Supabase 데이터 확인 중...');
        
        // 전체 레코드 수 확인
        const { data: allData, error: countError } = await supabase
            .from('properties')
            .select('id', { count: 'exact' });
            
        if (countError) {
            console.error('❌ 데이터 조회 실패:', countError);
            return;
        }
        
        console.log(`📊 총 등록된 매물 수: ${allData.length}개`);
        
        // 거래유형별 통계
        const { data: salesData } = await supabase
            .from('properties')
            .select('id')
            .eq('transaction_type', 'sale');
            
        const { data: leaseData } = await supabase
            .from('properties')
            .select('id')
            .eq('transaction_type', 'lease');
            
        const { data: rentData } = await supabase
            .from('properties')
            .select('id')
            .eq('transaction_type', 'rent');
        
        console.log('📈 거래유형별 통계:');
        console.log(`- 매매: ${salesData?.length || 0}개`);
        console.log(`- 전세: ${leaseData?.length || 0}개`);
        console.log(`- 월세: ${rentData?.length || 0}개`);
        
        // 최근 등록된 매물 5개 조회
        const { data: recentData } = await supabase
            .from('properties')
            .select('property_name, location, transaction_type, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
            
        console.log('🏠 최근 등록된 매물 5개:');
        recentData?.forEach((prop, idx) => {
            console.log(`${idx + 1}. ${prop.property_name} - ${prop.location} (${prop.transaction_type})`);
        });
        
        // 업로드 완료 여부 확인
        if (allData.length >= 763) {
            console.log('🎉 모든 매물 데이터 업로드 완료!');
        } else {
            console.log(`⏳ 업로드 진행 중... (${allData.length}/763)`);
        }
        
        return {
            total: allData.length,
            sale: salesData?.length || 0,
            lease: leaseData?.length || 0,
            rent: rentData?.length || 0,
            recent: recentData
        };
        
    } catch (error) {
        console.error('💥 확인 중 오류 발생:', error);
        return null;
    }
}

// 자동 실행
checkSupabaseData();

console.log('📝 사용법: checkSupabaseData() 함수를 다시 호출하여 업데이트된 상태를 확인하세요');