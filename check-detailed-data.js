import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDetailedData() {
  console.log('🏠 매물 세부 정보 확인\n');

  // 매물 정보 상세 조회
  const { data: properties } = await supabase
    .from('properties')
    .select('id, address, location_area, property_type, property_status, price, deposit, monthly_rent, manager_id, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  properties?.forEach((prop, idx) => {
    console.log(`${idx + 1}. 매물 ID: ${prop.id}`);
    console.log(`   - 주소: ${prop.address || '정보 없음'}`);  
    console.log(`   - 지역: ${prop.location_area || '정보 없음'}`);
    console.log(`   - 유형: ${prop.property_type || '정보 없음'}`);
    console.log(`   - 상태: ${prop.property_status}`);
    console.log(`   - 가격: ${prop.price || 0}만원`);
    console.log(`   - 보증금: ${prop.deposit || 0}만원`);
    console.log(`   - 월세: ${prop.monthly_rent || 0}만원`);
    console.log(`   - 담당자 ID: ${prop.manager_id}`);
    console.log(`   - 생성일: ${new Date(prop.created_at).toLocaleString('ko-KR')}\n`);
  });

  // 사용자 테이블 확인
  const { data: users } = await supabase
    .from('users')  
    .select('*');

  console.log('👤 사용자 테이블 상세:');
  if (!users || users.length === 0) {
    console.log('사용자 데이터가 비어있습니다.');
    
    // 현재 세션 확인
    console.log('\n🔐 인증 상태 확인...');
    const { data: authData, error } = await supabase.auth.getSession();
    console.log('현재 세션 존재:', !!authData?.session);
    
    if (error) {
      console.log('세션 확인 오류:', error.message);
    }
  } else {
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });
  }

  // 매물의 실제 데이터 컬럼 확인
  console.log('\n📋 매물 데이터 구조 확인:');
  const { data: sampleProp } = await supabase
    .from('properties')
    .select('*')
    .limit(1);

  if (sampleProp && sampleProp.length > 0) {
    const columns = Object.keys(sampleProp[0]);
    console.log('사용 가능한 컬럼들:');
    columns.forEach(col => {
      const value = sampleProp[0][col];
      const hasValue = value !== null && value !== undefined && value !== '';
      console.log(`  - ${col}: ${hasValue ? '✅' : '❌'} (${typeof value})`);
    });
  }

  // 코멘트 확인
  console.log('\n💬 매물 코멘트 확인:');
  const { data: comments } = await supabase
    .from('property_comments')
    .select('*')
    .limit(3);

  if (comments && comments.length > 0) {
    comments.forEach((comment, idx) => {
      console.log(`${idx + 1}. ${comment.comment_text}`);
      console.log(`   - 작성자: ${comment.user_id}`);
      console.log(`   - 매물 ID: ${comment.property_id}`);
      console.log(`   - 작성일: ${new Date(comment.created_at).toLocaleString('ko-KR')}\n`);
    });
  } else {
    console.log('코멘트 데이터가 없습니다.');
  }
}

checkDetailedData().catch(console.error);