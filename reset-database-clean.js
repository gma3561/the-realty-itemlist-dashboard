import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service Role Key 필요

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ 환경변수 설정이 필요합니다.');
  console.log('   .env.local 파일에 다음을 추가하세요:');
  console.log('   SUPABASE_SERVICE_KEY=your-service-role-key');
  process.exit(1);
}

// Service Role로 연결 (관리자 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDatabase() {
  console.log('🧹 데이터베이스 정리 시작...\n');

  try {
    // 1. 기존 더미 매물 데이터 삭제
    console.log('1️⃣ 기존 더미 매물 데이터 삭제 중...');
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 매물 삭제
    
    if (deleteError) {
      console.log('❌ 매물 삭제 실패:', deleteError.message);
    } else {
      console.log('✅ 기존 더미 매물 데이터 삭제 완료');
    }

    // 2. 기존 코멘트 삭제
    console.log('\n2️⃣ 기존 코멘트 삭제 중...');
    const { error: commentError } = await supabase
      .from('property_comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (commentError) {
      console.log('❌ 코멘트 삭제 실패:', commentError.message);
    } else {
      console.log('✅ 기존 코멘트 삭제 완료');
    }

    // 3. 상태 이력 삭제
    console.log('\n3️⃣ 매물 상태 이력 삭제 중...');
    const { error: historyError } = await supabase
      .from('property_status_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (historyError) {
      console.log('❌ 상태 이력 삭제 실패:', historyError.message);
    } else {
      console.log('✅ 기존 상태 이력 삭제 완료');
    }

    // 4. 현재 데이터베이스 상태 확인
    console.log('\n📊 정리 후 데이터베이스 상태:');
    
    const tables = ['properties', 'users', 'property_comments', 'property_status_history'];
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`   - ${table}: ${count || 0}개`);
    }

    console.log('\n✅ 데이터베이스 정리 완료! 이제 실제 데이터로 새롭게 시작할 수 있습니다.');
    
  } catch (error) {
    console.error('❌ 정리 과정에서 오류 발생:', error);
  }
}

cleanDatabase();