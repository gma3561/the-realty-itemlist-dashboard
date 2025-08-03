// Supabase 로컬 연동 테스트 스크립트
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 로드
dotenv.config({ path: join(__dirname, '.env.local') });

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🚀 Supabase 로컬 연동 테스트 시작...\n');

// 테스트 함수들
async function testConnection() {
  console.log('1️⃣ 연결 테스트');
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase 연결 성공!\n');
    return true;
  } catch (error) {
    console.error('❌ 연결 실패:', error.message);
    return false;
  }
}

async function testDataRead() {
  console.log('2️⃣ 데이터 읽기 테스트');
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    console.log(`✅ 매물 데이터 ${data.length}개 조회 성공`);
    console.log('샘플:', data[0]?.title || '데이터 없음');
    console.log('');
    return data;
  } catch (error) {
    console.error('❌ 데이터 읽기 실패:', error.message);
    return null;
  }
}

async function testDataWrite() {
  console.log('3️⃣ 데이터 쓰기 테스트');
  const testProperty = {
    title: `테스트 매물 ${new Date().toISOString()}`,
    property_type_id: 1,
    transaction_type_id: 1,
    status_id: 1,
    address_si: '서울시',
    address_gu: '강남구',
    trade_price: 1000000000,
    deposit: 0,
    monthly_rent: 0,
    management_fee: 200000,
    area_m2: 100,
    area_pyeong: 30.25
  };

  try {
    const { data, error } = await supabase
      .from('properties')
      .insert([testProperty])
      .select();
    
    if (error) throw error;
    console.log('✅ 데이터 생성 성공!');
    console.log('생성된 ID:', data[0].id);
    console.log('');
    return data[0];
  } catch (error) {
    console.error('❌ 데이터 쓰기 실패:', error.message);
    return null;
  }
}

async function testDataUpdate(propertyId) {
  console.log('4️⃣ 데이터 수정 테스트');
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ status_id: 2 })
      .eq('id', propertyId)
      .select();
    
    if (error) throw error;
    console.log('✅ 데이터 수정 성공!');
    console.log('수정된 상태:', data[0].status_id);
    console.log('');
    return data[0];
  } catch (error) {
    console.error('❌ 데이터 수정 실패:', error.message);
    return null;
  }
}

async function testDataDelete(propertyId) {
  console.log('5️⃣ 데이터 삭제 테스트');
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
    
    if (error) throw error;
    console.log('✅ 데이터 삭제 성공!');
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ 데이터 삭제 실패:', error.message);
    return false;
  }
}

async function testRealtimeSubscription() {
  console.log('6️⃣ 실시간 구독 테스트');
  
  const channel = supabase
    .channel('properties-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'properties'
      },
      (payload) => {
        console.log('🔔 실시간 변경 감지:', payload.eventType);
        console.log('데이터:', payload.new || payload.old);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ 실시간 구독 성공!');
        console.log('💡 다른 브라우저나 Supabase 대시보드에서 데이터를 변경해보세요.\n');
      }
    });

  return channel;
}

// 메인 실행 함수
async function runTests() {
  console.log('환경:', process.env.VITE_ENVIRONMENT || 'production');
  console.log('URL:', process.env.VITE_SUPABASE_URL);
  console.log('');

  // 연결 테스트
  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠️  연결 실패로 테스트 중단');
    process.exit(1);
  }

  // CRUD 테스트
  await testDataRead();
  
  const newProperty = await testDataWrite();
  if (newProperty) {
    await testDataUpdate(newProperty.id);
    await testDataDelete(newProperty.id);
  }

  // 실시간 구독 테스트
  const subscription = await testRealtimeSubscription();

  // 10초 후 구독 해제
  setTimeout(() => {
    subscription.unsubscribe();
    console.log('\n✅ 모든 테스트 완료!');
    process.exit(0);
  }, 10000);
}

// 테스트 실행
runTests().catch(console.error);