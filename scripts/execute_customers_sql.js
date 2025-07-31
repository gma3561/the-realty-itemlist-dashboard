// Customers 테이블 생성 스크립트 실행
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function executeSQL() {
  try {
    console.log('🏗️ Customers 테이블 생성 중...');
    
    // 단계별 SQL 실행
    const steps = [
      {
        name: 'customers 테이블 생성',
        sql: `CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('남성', '여성', '기타')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
)`
      },
      {
        name: 'properties 테이블에 customer_id 컬럼 추가',
        sql: `ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id)`
      }
    ];
    
    for (const step of steps) {
      console.log(`실행 중: ${step.name}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: step.sql });
      if (error) {
        console.log(`⚠️ ${step.name} 실패:`, error.message);
      } else {
        console.log(`✅ ${step.name} 성공`);
      }
    }
    
    // 더미 데이터 삽입
    console.log('더미 고객 데이터 생성 중...');
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (adminUser) {
      const dummyCustomers = [
        {
          name: '김철수',
          phone: '010-1234-5678',
          email: 'kimcs@example.com',
          address: '서울시 강남구 테헤란로 123',
          notes: '분양 문의 고객',
          created_by: adminUser.id
        },
        {
          name: '이영희',
          phone: '010-9876-5432',
          email: 'leeyh@example.com',
          address: '서울시 서초구 반포대로 456',
          notes: '전세 문의 고객',
          created_by: adminUser.id
        },
        {
          name: '박민수',
          phone: '010-5555-1234',
          email: 'parkms@example.com',
          address: '경기도 성남시 분당구 정자로 789',
          notes: '매매 문의 고객',
          created_by: adminUser.id
        }
      ];
      
      for (const customer of dummyCustomers) {
        const { error } = await supabase.from('customers').insert(customer);
        if (error && !error.message.includes('duplicate key')) {
          console.log(`⚠️ 고객 ${customer.name} 추가 실패:`, error.message);
        }
      }
    }
    
    console.log('✅ Customers 테이블 설정 완료!');
    
    // 생성된 테이블 확인
    const { data, error } = await supabase.from('customers').select('*').limit(5);
    if (error) {
      console.log('❌ 테이블 확인 실패:', error.message);
    } else {
      console.log(`✅ Customers 테이블 확인: ${data.length}개 레코드`);
      data.forEach(customer => {
        console.log(`  - ${customer.name} (${customer.phone})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

executeSQL();