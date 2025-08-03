const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditAndFixData() {
  console.log('🔍 Supabase 데이터 Audit 및 수정 시작...\n');
  
  try {
    // 1. Properties 테이블 문제 확인
    console.log('📊 Properties 테이블 분석...');
    
    // 컬럼 확인
    const { data: sample, error } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log('\n현재 Properties 테이블 컬럼:');
      console.log(Object.keys(sample[0]));
    }
    
    // 누락된 데이터 통계
    const { data: stats } = await supabase
      .from('properties')
      .select('id, property_name, area_pyeong, area_m2, price');
    
    let nullAreaCount = 0;
    let abnormalAreaCount = 0;
    let noNameCount = 0;
    
    stats?.forEach(prop => {
      if (!prop.area_pyeong) nullAreaCount++;
      if (prop.area_pyeong > 1000) abnormalAreaCount++;
      if (!prop.property_name || prop.property_name === 'undefined') noNameCount++;
    });
    
    console.log(`\n📈 데이터 품질 문제:`);
    console.log(`- 면적 누락: ${nullAreaCount}개`);
    console.log(`- 비정상 면적 (1000평 초과): ${abnormalAreaCount}개`);
    console.log(`- 이름 누락: ${noNameCount}개`);
    
    // 2. 비정상 면적 데이터 수정
    console.log('\n🔧 비정상 데이터 수정 중...');
    
    // 16,588,365평 같은 비정상 데이터 찾기
    const { data: abnormalProps } = await supabase
      .from('properties')
      .select('id, area_pyeong, area_m2')
      .gt('area_pyeong', 10000);
    
    for (const prop of abnormalProps || []) {
      // 10000으로 나누어 정상화 (아마 단위 변환 오류)
      const correctedPyeong = Math.round(prop.area_pyeong / 10000);
      const correctedM2 = prop.area_m2 > 10000 ? Math.round(prop.area_m2 / 10000) : prop.area_m2;
      
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          area_pyeong: correctedPyeong,
          area_m2: correctedM2
        })
        .eq('id', prop.id);
      
      if (!updateError) {
        console.log(`✅ 수정됨: ${prop.area_pyeong}평 → ${correctedPyeong}평`);
      }
    }
    
    // 3. price_per_pyeong 계산 및 업데이트
    console.log('\n💰 평당 가격 계산 중...');
    
    const { data: propsForPriceCalc } = await supabase
      .from('properties')
      .select('id, price, area_pyeong')
      .not('price', 'is', null)
      .not('area_pyeong', 'is', null)
      .gt('area_pyeong', 0);
    
    let priceUpdateCount = 0;
    for (const prop of propsForPriceCalc || []) {
      const pricePerPyeong = Math.round(prop.price / prop.area_pyeong);
      
      const { error: priceError } = await supabase
        .from('properties')
        .update({ price_per_pyeong: pricePerPyeong })
        .eq('id', prop.id);
      
      if (!priceError) priceUpdateCount++;
    }
    
    console.log(`✅ ${priceUpdateCount}개 매물의 평당 가격 계산 완료`);
    
    // 4. region 정보 추출 (location에서)
    console.log('\n🗺️ 지역 정보 추출 중...');
    
    const { data: propsForRegion } = await supabase
      .from('properties')
      .select('id, location');
    
    let regionUpdateCount = 0;
    for (const prop of propsForRegion || []) {
      if (prop.location) {
        // 첫 번째 공백 전까지를 지역으로 간주
        const region = prop.location.split(' ')[0].replace('동', '');
        
        const { error: regionError } = await supabase
          .from('properties')
          .update({ region: region })
          .eq('id', prop.id);
        
        if (!regionError) regionUpdateCount++;
      }
    }
    
    console.log(`✅ ${regionUpdateCount}개 매물의 지역 정보 추출 완료`);
    
    // 5. Users 테이블 확인
    console.log('\n👥 Users 테이블 확인...');
    
    try {
      // auth.users에서 사용자 목록 가져오기
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authUsers) {
        console.log(`Auth.users 사용자 수: ${authUsers.users.length}명`);
        
        // public.users 테이블과 동기화
        for (const authUser of authUsers.users) {
          const { error: syncError } = await supabase
            .from('users')
            .upsert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || authUser.email.split('@')[0],
              role: authUser.user_metadata?.role || 'user',
              created_at: authUser.created_at,
              updated_at: new Date().toISOString()
            });
          
          if (syncError) {
            console.error(`사용자 동기화 실패 (${authUser.email}):`, syncError.message);
          }
        }
        
        console.log('✅ Users 테이블 동기화 완료');
      }
    } catch (userError) {
      console.error('❌ Users 테이블 처리 중 오류:', userError);
    }
    
    // 6. 최종 통계
    console.log('\n📊 최종 데이터 품질 보고서:');
    
    const { count: totalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    const { count: nullAreaFinal } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .is('area_pyeong', null);
    
    const { count: hasRegion } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .not('region', 'is', null);
    
    const { count: hasPricePerPyeong } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .not('price_per_pyeong', 'is', null);
    
    console.log(`- 총 매물 수: ${totalCount}개`);
    console.log(`- 면적 정보 있음: ${totalCount - nullAreaFinal}개 (${Math.round((totalCount - nullAreaFinal) / totalCount * 100)}%)`);
    console.log(`- 지역 정보 있음: ${hasRegion}개 (${Math.round(hasRegion / totalCount * 100)}%)`);
    console.log(`- 평당가격 계산됨: ${hasPricePerPyeong}개 (${Math.round(hasPricePerPyeong / totalCount * 100)}%)`);
    
  } catch (error) {
    console.error('❌ Audit 중 오류:', error);
  }
}

// 실행
auditAndFixData();