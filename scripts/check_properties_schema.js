// properties 테이블 스키마 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Properties 테이블 스키마 확인');
console.log('================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPropertiesSchema() {
  try {
    console.log('📋 현재 properties 테이블 구조 확인');
    console.log('--------------------------------------');
    
    // 테이블 정보 조회
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', {
        table_name: 'properties'
      })
      .catch(async () => {
        // RPC가 없으면 직접 쿼리
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'properties')
          .eq('table_schema', 'public');
        
        if (error) throw error;
        return { data };
      });

    if (schemaError) {
      console.log('❌ 스키마 조회 실패:', schemaError.message);
      return;
    }

    console.log('✅ 현재 컬럼 목록:');
    if (columns) {
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL 허용' : 'NOT NULL'}`);
      });
    }

    // 샘플 데이터 조회 (첫 번째 레코드)
    console.log('\n📝 샘플 데이터 확인');
    console.log('--------------------');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ 샘플 데이터 조회 실패:', sampleError.message);
    } else if (sampleData && sampleData.length > 0) {
      console.log('✅ 샘플 데이터 구조:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('📄 테이블이 비어있습니다.');
    }

    // 필수 컬럼 확인
    console.log('\n🔍 필수 컬럼 존재 여부 확인');
    console.log('------------------------------');
    
    const requiredColumns = [
      'id', 'title', 'address', 'price', 'sale_price', 'rental_price',
      'property_type_id', 'property_status_id', 'transaction_type_id',
      'area_pyeong', 'area_sqft', 'description', 'created_at', 'updated_at'
    ];

    const existingColumns = columns ? columns.map(col => col.column_name) : [];
    
    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`   ${exists ? '✅' : '❌'} ${col} ${exists ? '존재' : '누락'}`);
    });

    // 누락된 컬럼이 있으면 추가 쿼리 제안
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n🔧 누락된 컬럼 추가 SQL');
      console.log('=====================');
      
      missingColumns.forEach(col => {
        let columnDef = '';
        switch (col) {
          case 'sale_price':
          case 'rental_price':
          case 'price':
            columnDef = 'DECIMAL(15,2)';
            break;
          case 'area_pyeong':
          case 'area_sqft':
            columnDef = 'DECIMAL(10,2)';
            break;
          case 'property_type_id':
          case 'property_status_id':
          case 'transaction_type_id':
            columnDef = 'UUID REFERENCES';
            break;
          case 'created_at':
          case 'updated_at':
            columnDef = 'TIMESTAMP DEFAULT NOW()';
            break;
          default:
            columnDef = 'TEXT';
        }
        
        console.log(`ALTER TABLE properties ADD COLUMN ${col} ${columnDef};`);
      });
    }

  } catch (error) {
    console.error('❌ 스키마 확인 중 오류:', error);
  }
}

checkPropertiesSchema();