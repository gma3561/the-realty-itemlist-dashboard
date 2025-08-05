import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL 또는 Service Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteDummyData() {
  console.log('🧹 더미 데이터 삭제 시작...');

  try {
    // 1. recent_activities 테이블에서 더미 데이터 삭제
    console.log('\n📌 recent_activities 테이블 정리 중...');
    const { data: activities, error: activitiesError } = await supabase
      .from('recent_activities')
      .delete()
      .or('changed_by.eq.system,changed_by.ilike.%test%,changed_by.ilike.%dummy%')
      .select();
    
    if (activitiesError) {
      console.error('❌ recent_activities 삭제 실패:', activitiesError);
    } else {
      console.log(`✅ recent_activities에서 ${activities?.length || 0}개 더미 데이터 삭제`);
    }

    // 2. property_status_history 테이블에서 더미 데이터 삭제
    console.log('\n📌 property_status_history 테이블 정리 중...');
    const { data: history, error: historyError } = await supabase
      .from('property_status_history')
      .delete()
      .or('changed_by.eq.system,changed_by.ilike.%test%,changed_by.ilike.%dummy%')
      .select();
    
    if (historyError) {
      console.error('❌ property_status_history 삭제 실패:', historyError);
    } else {
      console.log(`✅ property_status_history에서 ${history?.length || 0}개 더미 데이터 삭제`);
    }

    // 3. properties 테이블에서 테스트 매물 삭제
    console.log('\n📌 properties 테이블 정리 중...');
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .delete()
      .or('property_name.ilike.%테스트%,property_name.ilike.%test%,property_name.ilike.%dummy%,property_name.ilike.%샘플%,property_name.ilike.%sample%,manager_id.eq.system')
      .select();
    
    if (propertiesError) {
      console.error('❌ properties 삭제 실패:', propertiesError);
    } else {
      console.log(`✅ properties에서 ${properties?.length || 0}개 더미 매물 삭제`);
    }

    // 4. 남은 데이터 확인
    console.log('\n📊 남은 데이터 확인 중...');
    
    const { count: activityCount } = await supabase
      .from('recent_activities')
      .select('*', { count: 'exact', head: true });
    
    const { count: propertyCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n✅ 정리 완료!`);
    console.log(`   - recent_activities: ${activityCount || 0}개 남음`);
    console.log(`   - properties: ${propertyCount || 0}개 남음`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
deleteDummyData();