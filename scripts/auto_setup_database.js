// Supabase API로 테이블 자동 구성
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

// 서비스 역할 키 시도 (있으면 사용, 없으면 anon 키 사용)
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = serviceRoleKey || supabaseAnonKey;

console.log('사용 중인 키 타입:', serviceRoleKey ? 'Service Role' : 'Anon');

const supabase = createClient(supabaseUrl, supabaseKey);

async function autoSetupDatabase() {
  try {
    console.log('🚀 Supabase 데이터베이스 자동 구성 시작...');
    console.log(`📡 서버: ${supabaseUrl}`);
    
    // 1. 기존 데이터 확인
    console.log('\n1️⃣ 기존 데이터 확인...');
    
    const tableChecks = await Promise.allSettled([
      supabase.from('property_types').select('count', { count: 'exact', head: true }),
      supabase.from('property_statuses').select('count', { count: 'exact', head: true }),
      supabase.from('transaction_types').select('count', { count: 'exact', head: true }),
      supabase.from('owners').select('count', { count: 'exact', head: true })
    ]);

    const [propertyTypesCheck, statusesCheck, transactionTypesCheck, ownersCheck] = tableChecks;

    console.log('매물 종류 테이블:', propertyTypesCheck.status === 'fulfilled' ? `${propertyTypesCheck.value.count || 0}개 레코드` : '테이블 없음 또는 오류');
    console.log('진행 상태 테이블:', statusesCheck.status === 'fulfilled' ? `${statusesCheck.value.count || 0}개 레코드` : '테이블 없음 또는 오류');
    console.log('거래 유형 테이블:', transactionTypesCheck.status === 'fulfilled' ? `${transactionTypesCheck.value.count || 0}개 레코드` : '테이블 없음 또는 오류');
    console.log('소유주 테이블:', ownersCheck.status === 'fulfilled' ? `${ownersCheck.value.count || 0}개 레코드` : '테이블 없음 또는 오류');

    // 2. SQL을 통한 직접 실행 (RPC 함수 사용)
    console.log('\n2️⃣ SQL 실행을 통한 데이터 삽입...');
    
    // 룩업 데이터 삽입 SQL
    const setupSQL = `
      -- 매물 종류 데이터
      INSERT INTO public.property_types (name) VALUES 
        ('원룸'),
        ('투룸'),
        ('쓰리룸'),
        ('오피스텔'),
        ('아파트'),
        ('빌라'),
        ('단독주택'),
        ('상가')
      ON CONFLICT (name) DO NOTHING;

      -- 진행 상태 데이터
      INSERT INTO public.property_statuses (name) VALUES 
        ('매물확보'),
        ('광고진행'),
        ('계약진행'),
        ('거래완료'),
        ('매물취소')
      ON CONFLICT (name) DO NOTHING;

      -- 거래 유형 데이터
      INSERT INTO public.transaction_types (name) VALUES 
        ('매매'),
        ('전세'),
        ('월세'),
        ('단기임대')
      ON CONFLICT (name) DO NOTHING;

      -- 테스트용 소유주 데이터
      INSERT INTO public.owners (name, phone, contact_relation) VALUES 
        ('김소유자', '010-1234-5678', '본인'),
        ('박소유자', '010-2345-6789', '본인'),
        ('이소유자', '010-3456-7890', '대리인')
      ON CONFLICT (phone) DO NOTHING;
    `;

    // 3. RPC를 통한 SQL 실행 시도
    try {
      console.log('RPC를 통한 SQL 실행 시도...');
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', { 
        sql_query: setupSQL 
      });
      
      if (rpcError) {
        console.log('RPC 실행 실패 (예상됨):', rpcError.message);
        console.log('직접 INSERT 방식으로 시도합니다...');
      } else {
        console.log('✅ RPC를 통한 SQL 실행 성공!');
      }
    } catch (rpcErr) {
      console.log('RPC 함수가 없습니다. 직접 INSERT를 시도합니다...');
    }

    // 4. 직접 INSERT 방식
    console.log('\n3️⃣ 직접 INSERT 방식으로 데이터 삽입...');
    
    const insertResults = [];

    // 매물 종류 삽입
    console.log('매물 종류 데이터 삽입...');
    const propertyTypes = [
      { name: '원룸' }, { name: '투룸' }, { name: '쓰리룸' }, { name: '오피스텔' },
      { name: '아파트' }, { name: '빌라' }, { name: '단독주택' }, { name: '상가' }
    ];
    
    const { data: ptData, error: ptError } = await supabase
      .from('property_types')
      .upsert(propertyTypes, { onConflict: 'name' })
      .select();
    
    if (ptError) {
      console.log('❌ 매물 종류 삽입 실패:', ptError.message);
      insertResults.push({ table: 'property_types', success: false, error: ptError.message });
    } else {
      console.log(`✅ 매물 종류 ${ptData.length}개 삽입 완료`);
      insertResults.push({ table: 'property_types', success: true, count: ptData.length });
    }

    // 진행 상태 삽입
    console.log('진행 상태 데이터 삽입...');
    const propertyStatuses = [
      { name: '매물확보' }, { name: '광고진행' }, { name: '계약진행' }, 
      { name: '거래완료' }, { name: '매물취소' }
    ];
    
    const { data: psData, error: psError } = await supabase
      .from('property_statuses')
      .upsert(propertyStatuses, { onConflict: 'name' })
      .select();
    
    if (psError) {
      console.log('❌ 진행 상태 삽입 실패:', psError.message);
      insertResults.push({ table: 'property_statuses', success: false, error: psError.message });
    } else {
      console.log(`✅ 진행 상태 ${psData.length}개 삽입 완료`);
      insertResults.push({ table: 'property_statuses', success: true, count: psData.length });
    }

    // 거래 유형 삽입
    console.log('거래 유형 데이터 삽입...');
    const transactionTypes = [
      { name: '매매' }, { name: '전세' }, { name: '월세' }, { name: '단기임대' }
    ];
    
    const { data: ttData, error: ttError } = await supabase
      .from('transaction_types')
      .upsert(transactionTypes, { onConflict: 'name' })
      .select();
    
    if (ttError) {
      console.log('❌ 거래 유형 삽입 실패:', ttError.message);
      insertResults.push({ table: 'transaction_types', success: false, error: ttError.message });
    } else {
      console.log(`✅ 거래 유형 ${ttData.length}개 삽입 완료`);
      insertResults.push({ table: 'transaction_types', success: true, count: ttData.length });
    }

    // 소유주 삽입
    console.log('소유주 데이터 삽입...');
    const owners = [
      { name: '김소유자', phone: '010-1234-5678', contact_relation: '본인' },
      { name: '박소유자', phone: '010-2345-6789', contact_relation: '본인' },
      { name: '이소유자', phone: '010-3456-7890', contact_relation: '대리인' }
    ];
    
    const { data: ownerData, error: ownerError } = await supabase
      .from('owners')
      .upsert(owners, { onConflict: 'phone' })
      .select();
    
    if (ownerError) {
      console.log('❌ 소유주 삽입 실패:', ownerError.message);
      insertResults.push({ table: 'owners', success: false, error: ownerError.message });
    } else {
      console.log(`✅ 소유주 ${ownerData.length}개 삽입 완료`);
      insertResults.push({ table: 'owners', success: true, count: ownerData.length });
    }

    // 5. 결과 요약
    console.log('\n📊 삽입 결과 요약:');
    const successful = insertResults.filter(r => r.success);
    const failed = insertResults.filter(r => !r.success);
    
    console.log(`✅ 성공: ${successful.length}개 테이블`);
    console.log(`❌ 실패: ${failed.length}개 테이블`);
    
    if (failed.length > 0) {
      console.log('\n❌ 실패한 테이블들:');
      failed.forEach(f => {
        console.log(`  - ${f.table}: ${f.error}`);
      });
      
      if (failed.some(f => f.error.includes('row-level security'))) {
        console.log('\n💡 RLS 정책으로 인한 실패입니다. 다음 중 하나를 시도하세요:');
        console.log('1. Supabase 대시보드에서 수동으로 SQL 실행');
        console.log('2. 서비스 역할 키를 환경변수 VITE_SUPABASE_SERVICE_ROLE_KEY에 설정');
        console.log('3. 임시로 RLS 정책을 비활성화하고 다시 실행');
      }
    }

    // 6. 최종 검증
    if (successful.length > 0) {
      console.log('\n4️⃣ 최종 데이터 검증...');
      
      const finalChecks = await Promise.allSettled([
        supabase.from('property_types').select('*'),
        supabase.from('property_statuses').select('*'),
        supabase.from('transaction_types').select('*'),
        supabase.from('owners').select('*')
      ]);

      finalChecks.forEach((check, index) => {
        const tableName = ['property_types', 'property_statuses', 'transaction_types', 'owners'][index];
        if (check.status === 'fulfilled' && check.value.data) {
          console.log(`${tableName}: ${check.value.data.length}개 레코드 확인됨`);
        }
      });
    }

    console.log('\n🎉 데이터베이스 자동 구성 완료!');
    
    return {
      success: successful.length > 0,
      results: insertResults,
      canTestPropertyInsert: successful.length >= 3 // 최소 3개 테이블 성공 시 매물 등록 테스트 가능
    };

  } catch (error) {
    console.error('❌ 데이터베이스 자동 구성 실패:', error);
    return { success: false, error: error.message };
  }
}

// 매물 등록 테스트 함수
async function testPropertyInsert() {
  try {
    console.log('\n🔍 매물 등록 테스트 시작...');
    
    // 룩업 데이터 조회
    const [ptResult, psResult, ttResult, ownerResult] = await Promise.all([
      supabase.from('property_types').select('*').limit(1),
      supabase.from('property_statuses').select('*').limit(1),
      supabase.from('transaction_types').select('*').limit(1),
      supabase.from('owners').select('*').limit(1)
    ]);

    if (ptResult.error || psResult.error || ttResult.error || ownerResult.error) {
      throw new Error('룩업 데이터 조회 실패');
    }

    const propertyType = ptResult.data[0];
    const propertyStatus = psResult.data[0];
    const transactionType = ttResult.data[0];
    const owner = ownerResult.data[0];

    if (!propertyType || !propertyStatus || !transactionType) {
      throw new Error('필수 룩업 데이터가 없습니다');
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
      special_notes: 'API 테스트용 매물입니다'
    };

    console.log('매물 등록 시도...');
    const { data: insertedProperty, error: insertError } = await supabase
      .from('properties')
      .insert([testProperty])
      .select();

    if (insertError) {
      console.log('❌ 매물 등록 실패:', insertError.message);
      return { success: false, error: insertError.message };
    }

    console.log('✅ 매물 등록 성공!');
    console.log('등록된 매물 ID:', insertedProperty[0].id);
    
    return { success: true, propertyId: insertedProperty[0].id };

  } catch (error) {
    console.log('❌ 매물 등록 테스트 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 실행
async function main() {
  const setupResult = await autoSetupDatabase();
  
  if (setupResult.canTestPropertyInsert) {
    await testPropertyInsert();
  } else {
    console.log('\n⚠️ 룩업 테이블 설정이 불완전하여 매물 등록 테스트를 건너뜁니다.');
  }
}

main();