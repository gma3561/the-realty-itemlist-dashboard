const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSchemaIssues() {
  console.log('🔧 스키마 문제 해결 시작...\n');
  
  try {
    // 1. 현재 스키마 컬럼 확인
    console.log('📊 현재 테이블 구조 확인 중...');
    
    // properties 테이블에 누락된 컬럼 확인
    const { data: propSample } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    const existingColumns = propSample ? Object.keys(propSample[0]) : [];
    console.log('\nProperties 테이블 컬럼:', existingColumns.length + '개');
    
    // price_per_pyeong, region 컬럼이 없는 것으로 보임
    const hasPerPyeong = existingColumns.includes('price_per_pyeong');
    const hasRegion = existingColumns.includes('region');
    const hasName = existingColumns.includes('name');
    
    console.log(`- price_per_pyeong 컬럼: ${hasPerPyeong ? '있음' : '없음'}`);
    console.log(`- region 컬럼: ${hasRegion ? '있음' : '없음'}`);
    console.log(`- name 컬럼: ${hasName ? '있음' : '없음'}`);
    
    // 2. Users 테이블 role 문제 해결
    console.log('\n👥 Users 테이블 role 체크 제약 확인...');
    
    // 먼저 현재 role 값들 확인
    const validRoles = ['admin', 'user', 'staff']; // 가능한 role 값들
    
    // auth.users에서 사용자 목록 가져오기
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (authUsers) {
      console.log(`\nAuth 사용자 수: ${authUsers.users.length}명`);
      
      for (const authUser of authUsers.users) {
        // role 값 정리 (staff는 user로 변경)
        const userRole = authUser.user_metadata?.role === 'staff' ? 'user' : 
                        (authUser.user_metadata?.role || 'user');
        
        try {
          // users 테이블에 삽입/업데이트
          const { error } = await supabase
            .from('users')
            .upsert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || authUser.email.split('@')[0],
              role: userRole === 'admin' ? 'admin' : 'user', // admin 또는 user만
              created_at: authUser.created_at,
              updated_at: new Date().toISOString()
            });
          
          if (!error) {
            console.log(`✅ ${authUser.email} - role: ${userRole}`);
          } else {
            console.error(`❌ ${authUser.email} 실패:`, error.message);
          }
        } catch (e) {
          console.error(`❌ ${authUser.email} 오류:`, e);
        }
      }
    }
    
    // 3. 지역 정보 추출 개선
    if (!hasRegion) {
      console.log('\n⚠️  region 컬럼이 없습니다. 다른 방법으로 지역 정보를 처리합니다.');
      
      // location에서 지역 추출하여 별도로 관리
      const { data: locations } = await supabase
        .from('properties')
        .select('id, location')
        .limit(10);
      
      console.log('\n지역 정보 샘플:');
      locations?.forEach(loc => {
        const region = loc.location?.split(' ')[0] || '미지정';
        console.log(`- ${loc.location} → ${region}`);
      });
    }
    
    // 4. 평당가격 계산 (컬럼이 없으면 건너뛰기)
    if (!hasPerPyeong) {
      console.log('\n⚠️  price_per_pyeong 컬럼이 없습니다.');
      console.log('필요시 ALTER TABLE로 컬럼 추가 후 계산하세요.');
    }
    
    // 5. 최종 데이터 검증
    console.log('\n📊 최종 데이터 상태:');
    
    const { count: totalProps } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log(`- Properties: ${totalProps}개`);
    console.log(`- Users: ${totalUsers}명`);
    
    // 비정상 면적 재확인
    const { data: stillAbnormal } = await supabase
      .from('properties')
      .select('id, area_pyeong')
      .gt('area_pyeong', 1000);
    
    if (stillAbnormal && stillAbnormal.length > 0) {
      console.log(`\n⚠️  아직도 비정상 면적 데이터가 ${stillAbnormal.length}개 있습니다.`);
    } else {
      console.log('\n✅ 모든 면적 데이터가 정상 범위입니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

// 실행
fixSchemaIssues();