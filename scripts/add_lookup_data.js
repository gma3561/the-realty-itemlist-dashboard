// 룩업 테이블에 기본 데이터 추가
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addLookupData() {
  try {
    console.log('룩업 테이블에 기본 데이터 추가 시작...');

    // 매물 종류 데이터
    const propertyTypes = [
      { name: '원룸' },
      { name: '투룸' },
      { name: '쓰리룸' },
      { name: '오피스텔' },
      { name: '아파트' },
      { name: '빌라' },
      { name: '단독주택' },
      { name: '상가' }
    ];

    const { data: insertedPropertyTypes, error: propertyTypeError } = await supabase
      .from('property_types')
      .upsert(propertyTypes, { onConflict: 'name' })
      .select();

    if (propertyTypeError) {
      console.error('매물 종류 데이터 추가 실패:', propertyTypeError);
    } else {
      console.log('매물 종류 데이터 추가 성공:', insertedPropertyTypes.length);
    }

    // 진행 상태 데이터
    const propertyStatuses = [
      { name: '매물확보' },
      { name: '광고진행' },
      { name: '계약진행' },
      { name: '거래완료' },
      { name: '매물취소' }
    ];

    const { data: insertedStatuses, error: statusError } = await supabase
      .from('property_statuses')
      .upsert(propertyStatuses, { onConflict: 'name' })
      .select();

    if (statusError) {
      console.error('진행 상태 데이터 추가 실패:', statusError);
    } else {
      console.log('진행 상태 데이터 추가 성공:', insertedStatuses.length);
    }

    // 거래 유형 데이터
    const transactionTypes = [
      { name: '매매' },
      { name: '전세' },
      { name: '월세' },
      { name: '단기임대' }
    ];

    const { data: insertedTransactionTypes, error: transactionError } = await supabase
      .from('transaction_types')
      .upsert(transactionTypes, { onConflict: 'name' })
      .select();

    if (transactionError) {
      console.error('거래 유형 데이터 추가 실패:', transactionError);
    } else {
      console.log('거래 유형 데이터 추가 성공:', insertedTransactionTypes.length);
    }

    console.log('모든 룩업 데이터 추가 완료!');

  } catch (error) {
    console.error('룩업 데이터 추가 중 오류:', error);
  }
}

addLookupData();