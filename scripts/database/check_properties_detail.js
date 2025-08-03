const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkPropertiesDetail() {
  console.log('🏢 Properties 테이블 상세 분석...\n');

  try {
    // 1. 전체 데이터 개수
    const { count: totalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 전체 property 수: ${totalCount}개\n`);

    // 2. 지역별 분포
    console.log('📍 지역별 분포:');
    const { data: properties } = await supabase
      .from('properties')
      .select('region');
    
    const regionCounts = properties?.reduce((acc, prop) => {
      const region = prop.region || '미분류';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    Object.entries(regionCounts || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([region, count]) => {
        console.log(`   ${region}: ${count}개`);
      });

    // 3. 가격대별 분포
    console.log('\n💰 평당 가격 분포:');
    const { data: priceData } = await supabase
      .from('properties')
      .select('price_per_pyeong')
      .not('price_per_pyeong', 'is', null);

    if (priceData?.length > 0) {
      const prices = priceData.map(p => p.price_per_pyeong).sort((a, b) => a - b);
      console.log(`   최저가: ${prices[0].toLocaleString()}만원/평`);
      console.log(`   최고가: ${prices[prices.length - 1].toLocaleString()}만원/평`);
      console.log(`   평균가: ${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString()}만원/평`);
    }

    // 4. 면적 분포
    console.log('\n📏 면적 분포:');
    const { data: areaData } = await supabase
      .from('properties')
      .select('area_pyeong')
      .not('area_pyeong', 'is', null);

    if (areaData?.length > 0) {
      const areas = areaData.map(a => a.area_pyeong).sort((a, b) => a - b);
      console.log(`   최소 면적: ${areas[0]}평`);
      console.log(`   최대 면적: ${areas[areas.length - 1]}평`);
      console.log(`   평균 면적: ${Math.round(areas.reduce((a, b) => a + b, 0) / areas.length)}평`);
    }

    // 5. NULL 데이터 체크
    console.log('\n⚠️  데이터 품질 체크:');
    const { count: nullAreaCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .is('area_pyeong', null);

    console.log(`   area_pyeong NULL: ${nullAreaCount}개 (${((nullAreaCount/totalCount)*100).toFixed(1)}%)`);

    // 6. 샘플 데이터 출력
    console.log('\n📝 최근 추가된 데이터 샘플 (3개):');
    const { data: samples } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    samples?.forEach((prop, idx) => {
      console.log(`\n   [${idx + 1}] ${prop.name}`);
      console.log(`       지역: ${prop.region || '미분류'}`);
      console.log(`       가격: ${prop.price_per_pyeong ? prop.price_per_pyeong.toLocaleString() + '만원/평' : 'N/A'}`);
      console.log(`       면적: ${prop.area_pyeong ? prop.area_pyeong + '평' : 'N/A'}`);
      console.log(`       준공년도: ${prop.completion_year || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

checkPropertiesDetail();