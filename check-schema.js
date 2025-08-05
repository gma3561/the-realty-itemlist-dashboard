import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 스키마 관계 확인\n');

  try {
    // 1. Properties 테이블 구조 확인
    console.log('📋 Properties 테이블 샘플 데이터:');
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, property_name, manager_id')
      .limit(5);
    
    if (propError) {
      console.error('Properties 조회 오류:', propError);
    } else {
      console.table(properties);
    }

    // 2. Users 테이블 구조 확인  
    console.log('\n👥 Users 테이블 샘플 데이터:');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);
    
    if (userError) {
      console.error('Users 조회 오류:', userError);
    } else {
      console.table(users);
    }

    // 3. 관계 테스트 - JOIN 없이
    console.log('\n🔗 관계 없는 단순 조회 테스트:');
    const { data: simpleProps, error: simpleError } = await supabase
      .from('properties')
      .select('*')
      .limit(3);
    
    if (simpleError) {
      console.error('단순 조회 오류:', simpleError);
    } else {
      console.log(`✅ 단순 조회 성공: ${simpleProps.length}개 매물`);
    }

    // 4. Foreign Key 관계 확인
    console.log('\n🔑 Foreign Key 관계 테스트:');
    const { data: joinData, error: joinError } = await supabase
      .from('properties')
      .select(`
        id,
        property_name,
        manager_id,
        users!properties_manager_id_fkey(id, name, email)
      `)
      .limit(3);
    
    if (joinError) {
      console.error('❌ FK 관계 조회 오류:', joinError);
      
      // 대안: 수동 JOIN
      console.log('\n🔄 수동 JOIN 시도:');
      const { data: manualJoin } = await supabase
        .from('properties')
        .select('id, property_name, manager_id')
        .limit(3);
      
      for (const prop of manualJoin || []) {
        const { data: manager } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', prop.manager_id)
          .single();
        
        console.log(`매물: ${prop.property_name}, 담당자: ${manager?.name || 'Unknown'}`);
      }
    } else {
      console.log('✅ FK 관계 조회 성공');
      console.table(joinData);
    }

  } catch (err) {
    console.error('🚨 전체 오류:', err);
  }
}

checkSchema();