// 클라이언트 사이드에서 데이터베이스 셋업 (로그인 후 실행)
import { supabase } from '../services/supabase';

export const setupDatabase = async () => {
  try {
    console.log('🚀 데이터베이스 셋업 시작...');
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('로그인이 필요합니다');
    }
    
    console.log('✅ 사용자 인증됨:', user.email);
    
    const results = [];
    
    // 1. 매물 종류 데이터
    console.log('매물 종류 데이터 삽입...');
    const propertyTypes = [
      { name: '원룸' }, { name: '투룸' }, { name: '쓰리룸' }, 
      { name: '오피스텔' }, { name: '아파트' }, { name: '빌라' }, 
      { name: '단독주택' }, { name: '상가' }
    ];
    
    try {
      const { data: ptData, error: ptError } = await supabase
        .from('property_types')
        .upsert(propertyTypes, { onConflict: 'name' })
        .select();
      
      if (ptError) throw ptError;
      console.log(`✅ 매물 종류 ${ptData.length}개 삽입 완료`);
      results.push({ table: 'property_types', success: true, count: ptData.length });
    } catch (error) {
      console.log(`❌ 매물 종류 삽입 실패: ${error.message}`);
      results.push({ table: 'property_types', success: false, error: error.message });
    }
    
    // 2. 진행 상태 데이터
    console.log('진행 상태 데이터 삽입...');
    const propertyStatuses = [
      { name: '매물확보' }, { name: '광고진행' }, { name: '계약진행' }, 
      { name: '거래완료' }, { name: '매물취소' }
    ];
    
    try {
      const { data: psData, error: psError } = await supabase
        .from('property_statuses')
        .upsert(propertyStatuses, { onConflict: 'name' })
        .select();
      
      if (psError) throw psError;
      console.log(`✅ 진행 상태 ${psData.length}개 삽입 완료`);
      results.push({ table: 'property_statuses', success: true, count: psData.length });
    } catch (error) {
      console.log(`❌ 진행 상태 삽입 실패: ${error.message}`);
      results.push({ table: 'property_statuses', success: false, error: error.message });
    }
    
    // 3. 거래 유형 데이터
    console.log('거래 유형 데이터 삽입...');
    const transactionTypes = [
      { name: '매매' }, { name: '전세' }, { name: '월세' }, { name: '단기임대' }
    ];
    
    try {
      const { data: ttData, error: ttError } = await supabase
        .from('transaction_types')
        .upsert(transactionTypes, { onConflict: 'name' })
        .select();
      
      if (ttError) throw ttError;
      console.log(`✅ 거래 유형 ${ttData.length}개 삽입 완료`);
      results.push({ table: 'transaction_types', success: true, count: ttData.length });
    } catch (error) {
      console.log(`❌ 거래 유형 삽입 실패: ${error.message}`);
      results.push({ table: 'transaction_types', success: false, error: error.message });
    }
    
    // 4. 소유주 데이터
    console.log('소유주 데이터 삽입...');
    const owners = [
      { name: '김소유자', phone: '010-1234-5678', contact_relation: '본인' },
      { name: '박소유자', phone: '010-2345-6789', contact_relation: '본인' },
      { name: '이소유자', phone: '010-3456-7890', contact_relation: '대리인' }
    ];
    
    // 소유주는 하나씩 삽입 (phone unique constraint 문제 해결)
    let ownerCount = 0;
    for (const owner of owners) {
      try {
        const { data: existingOwner } = await supabase
          .from('owners')
          .select('id')
          .eq('phone', owner.phone)
          .single();
        
        if (!existingOwner) {
          const { data: ownerData, error: ownerError } = await supabase
            .from('owners')
            .insert([owner])
            .select();
          
          if (ownerError) throw ownerError;
          ownerCount++;
        }
      } catch (error) {
        console.log(`❌ 소유주 '${owner.name}' 삽입 실패: ${error.message}`);
      }
    }
    
    if (ownerCount > 0) {
      console.log(`✅ 소유주 ${ownerCount}개 삽입 완료`);
      results.push({ table: 'owners', success: true, count: ownerCount });
    } else {
      results.push({ table: 'owners', success: false, error: '소유주 데이터 삽입 실패' });
    }
    
    // 결과 요약
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n📊 결과: 성공 ${successful.length}개, 실패 ${failed.length}개`);
    
    if (failed.length > 0) {
      console.log('실패한 테이블:', failed.map(f => f.table).join(', '));
    }
    
    return {
      success: successful.length > 0,
      results,
      canTestPropertyInsert: successful.length >= 3
    };
    
  } catch (error) {
    console.error('❌ 데이터베이스 셋업 실패:', error);
    return { success: false, error: error.message };
  }
};

export const testPropertyInsert = async () => {
  try {
    console.log('🔍 매물 등록 테스트 시작...');
    
    // 룩업 데이터 조회
    const [ptResult, psResult, ttResult, ownerResult] = await Promise.all([
      supabase.from('property_types').select('*').limit(1),
      supabase.from('property_statuses').select('*').limit(1),
      supabase.from('transaction_types').select('*').limit(1),
      supabase.from('owners').select('*').limit(1)
    ]);

    const propertyType = ptResult.data?.[0];
    const propertyStatus = psResult.data?.[0];
    const transactionType = ttResult.data?.[0];
    const owner = ownerResult.data?.[0];

    if (!propertyType || !propertyStatus || !transactionType) {
      throw new Error('필수 룩업 데이터가 없습니다. 먼저 setupDatabase()를 실행하세요.');
    }

    // 테스트 매물 데이터
    const testProperty = {
      property_name: `테스트 매물 ${new Date().getTime()}`,
      location: '서울시 강남구 삼성동',
      property_type_id: propertyType.id,
      property_status_id: propertyStatus.id,
      transaction_type_id: transactionType.id,
      owner_id: owner?.id || null,
      price: 500000000,
      supply_area_sqm: 84.5,
      private_area_sqm: 59.8,
      floor_info: '15층/25층',
      rooms_bathrooms: '3개/2개',
      direction: '남향',
      maintenance_fee: '15만원',
      parking: '2대',
      move_in_date: '즉시입주',
      special_notes: '클라이언트 테스트용 매물입니다'
    };

    console.log('매물 등록 시도...');
    const { data: insertedProperty, error: insertError } = await supabase
      .from('properties')
      .insert([testProperty])
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ 매물 등록 성공!');
    console.log('등록된 매물:', insertedProperty[0]);
    
    return { success: true, property: insertedProperty[0] };

  } catch (error) {
    console.error('❌ 매물 등록 테스트 실패:', error);
    return { success: false, error: error.message };
  }
};

// 전체 셋업 및 테스트 실행
export const runFullSetupAndTest = async () => {
  const setupResult = await setupDatabase();
  
  if (setupResult.canTestPropertyInsert) {
    const testResult = await testPropertyInsert();
    return { setupResult, testResult };
  } else {
    console.log('⚠️ 룩업 테이블 설정이 불완전하여 매물 등록 테스트를 건너뜁니다.');
    return { setupResult, testResult: { success: false, error: '셋업 불완전' } };
  }
};