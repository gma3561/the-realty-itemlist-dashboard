// 데이터베이스 구조 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseStructure() {
  try {
    console.log('=== 데이터베이스 구조 확인 ===');
    
    // 1. Properties 테이블 구조 확인
    console.log('\n1. Properties 테이블:');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);
    
    if (properties && properties.length > 0) {
      console.log('Properties 테이블 컬럼:');
      Object.keys(properties[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof properties[0][key]} (${properties[0][key]})`);
      });
    } else {
      console.log('Properties 테이블 데이터 없음');
    }

    // 2. Users 테이블 구조 확인
    console.log('\n2. Users 테이블:');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (users && users.length > 0) {
      console.log('Users 테이블 컬럼:');
      Object.keys(users[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof users[0][key]} (${users[0][key]})`);
      });
    } else {
      console.log('Users 테이블 데이터 없음');
    }

    // 3. Contacts/Customers 테이블 확인
    console.log('\n3. Contacts 테이블:');
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
    
    if (contacts && contacts.length > 0) {
      console.log('Contacts 테이블 컬럼:');
      Object.keys(contacts[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof contacts[0][key]} (${contacts[0][key]})`);
      });
    } else if (contactError) {
      console.log('Contacts 테이블 존재하지 않음');
      
      // Customers 테이블 확인
      console.log('\n3-1. Customers 테이블 확인:');
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('*')
        .limit(1);
      
      if (customers && customers.length > 0) {
        console.log('Customers 테이블 컬럼:');
        Object.keys(customers[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof customers[0][key]} (${customers[0][key]})`);
        });
      } else {
        console.log('Customers 테이블도 존재하지 않음');
      }
    }

    // 4. 테이블 목록 확인
    console.log('\n4. 전체 테이블 목록:');
    
    // 각 테이블 직접 확인
    const tablesToCheck = ['properties', 'users', 'contacts', 'customers', 'property_types', 'property_statuses', 'transaction_types'];
    
    for (const table of tablesToCheck) {
      const { data, error } = await supabase.from(table).select('*').limit(0);
      if (!error) {
        console.log(`  ✅ ${table} 테이블 존재`);
      } else {
        console.log(`  ❌ ${table} 테이블 없음`);
      }
    }
    
  } catch (error) {
    console.error('오류:', error.message);
  }
}

checkDatabaseStructure();