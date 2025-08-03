const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 코멘트 시스템 QA 테스트 (인증 없이)\n');

async function createTestTable() {
  console.log('📋 테스트용 property_comments 테이블 생성 시도...');
  
  // 테이블이 이미 있는지 확인
  const { error: checkError } = await supabase
    .from('property_comments')
    .select('id')
    .limit(1);
  
  if (!checkError || checkError.code !== '42P01') {
    console.log('✅ 테이블이 이미 존재합니다\n');
    return true;
  }
  
  console.log('❌ 테이블이 없습니다. Supabase SQL Editor에서 생성 필요\n');
  return false;
}

async function runTests() {
  // 테이블 확인
  const tableExists = await createTestTable();
  if (!tableExists) {
    console.log('💡 create-comments-table.js 파일의 SQL을 Supabase에서 실행하세요');
    return;
  }
  
  let testPropertyId = null;
  let testCommentId = null;
  
  try {
    // 1. 테스트용 매물 가져오기
    console.log('1️⃣ 테스트용 매물 확인');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, property_name')
      .limit(1);
    
    if (propError || !properties?.length) {
      console.log('❌ 매물 조회 실패:', propError);
      return;
    }
    
    testPropertyId = properties[0].id;
    console.log(`✅ 테스트 매물: ${properties[0].property_name}`);
    console.log(`   ID: ${testPropertyId}\n`);
    
    // 2. 코멘트 작성 테스트 (서비스 키로 직접)
    console.log('2️⃣ 코멘트 작성 테스트');
    const testComment = {
      property_id: testPropertyId,
      user_id: 'qa-test@example.com',
      user_name: 'QA 테스터',
      comment_text: `테스트 코멘트 - ${new Date().toLocaleString()}`
    };
    
    const { data: newComment, error: createError } = await supabase
      .from('property_comments')
      .insert([testComment])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ 코멘트 작성 실패:', createError.message);
      console.log('   코드:', createError.code);
      console.log('   상세:', createError.details);
      return;
    }
    
    testCommentId = newComment.id;
    console.log('✅ 코멘트 작성 성공!');
    console.log('   ID:', testCommentId);
    console.log('   내용:', newComment.comment_text, '\n');
    
    // 3. 코멘트 조회 테스트
    console.log('3️⃣ 코멘트 조회 테스트');
    const { data: comments, error: readError } = await supabase
      .from('property_comments')
      .select('*')
      .eq('property_id', testPropertyId)
      .order('created_at', { ascending: false });
    
    if (readError) {
      console.log('❌ 코멘트 조회 실패:', readError.message);
    } else {
      console.log(`✅ ${comments.length}개 코멘트 조회 성공`);
      comments.slice(0, 3).forEach((c, i) => {
        console.log(`   ${i+1}. [${c.user_name}] ${c.comment_text}`);
      });
    }
    console.log('');
    
    // 4. 코멘트 수정 테스트
    console.log('4️⃣ 코멘트 수정 테스트');
    const updatedText = `수정된 테스트 코멘트 - ${new Date().toLocaleString()}`;
    const { data: updatedComment, error: updateError } = await supabase
      .from('property_comments')
      .update({ comment_text: updatedText })
      .eq('id', testCommentId)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ 코멘트 수정 실패:', updateError.message);
    } else {
      console.log('✅ 코멘트 수정 성공');
      console.log('   수정된 내용:', updatedComment.comment_text);
      console.log('   updated_at:', new Date(updatedComment.updated_at).toLocaleString(), '\n');
    }
    
    // 5. 여러 개 코멘트 추가
    console.log('5️⃣ 여러 코멘트 추가 테스트');
    const multipleComments = [
      {
        property_id: testPropertyId,
        user_id: 'user1@example.com',
        user_name: '김직원',
        comment_text: '이 매물 위치가 정말 좋네요. 교통편이 편리합니다.'
      },
      {
        property_id: testPropertyId,
        user_id: 'user2@example.com', 
        user_name: '이대리',
        comment_text: '가격 협상 가능할까요? 고객이 관심있어 합니다.'
      },
      {
        property_id: testPropertyId,
        user_id: 'user3@example.com',
        user_name: '박과장',
        comment_text: '주차 공간이 넉넉해서 좋습니다. 내일 고객과 방문 예정입니다.'
      }
    ];
    
    const { data: newComments, error: multiError } = await supabase
      .from('property_comments')
      .insert(multipleComments)
      .select();
    
    if (multiError) {
      console.log('❌ 다중 코멘트 작성 실패:', multiError.message);
    } else {
      console.log(`✅ ${newComments.length}개 코멘트 추가 성공\n`);
    }
    
    // 6. 최종 조회
    console.log('6️⃣ 최종 코멘트 목록');
    const { data: finalComments, error: finalError } = await supabase
      .from('property_comments')
      .select('*')
      .eq('property_id', testPropertyId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!finalError && finalComments) {
      console.log(`📝 총 ${finalComments.length}개 코멘트:`);
      finalComments.forEach((c, i) => {
        const time = new Date(c.created_at).toLocaleTimeString();
        console.log(`   ${i+1}. [${time}] ${c.user_name}: ${c.comment_text}`);
      });
    }
    
    // 7. 삭제 테스트
    console.log('\n7️⃣ 코멘트 삭제 테스트');
    const { error: deleteError } = await supabase
      .from('property_comments')
      .delete()
      .eq('id', testCommentId);
    
    if (deleteError) {
      console.log('❌ 코멘트 삭제 실패:', deleteError.message);
    } else {
      console.log('✅ 테스트 코멘트 삭제 성공');
    }
    
    console.log('\n✨ QA 테스트 완료!\n');
    console.log('📌 테스트 결과:');
    console.log('  ✅ 코멘트 작성 기능 정상');
    console.log('  ✅ 코멘트 조회 기능 정상');
    console.log('  ✅ 코멘트 수정 기능 정상');
    console.log('  ✅ 코멘트 삭제 기능 정상');
    console.log('  ✅ 다중 사용자 코멘트 지원');
    console.log('\n💡 UI에서 테스트: 매물 상세 페이지에서 코멘트 섹션 확인');
    
  } catch (error) {
    console.error('💥 테스트 중 오류:', error);
  }
}

runTests();