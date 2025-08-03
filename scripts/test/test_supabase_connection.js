#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Supabase 연결 테스트');
console.log('URL:', supabaseUrl);
console.log('Key 길이:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 환경변수 누락');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // 간단한 테이블 확인
    console.log('📊 테이블 목록 조회 시도...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ 연결 실패:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Supabase 연결 성공!');
      console.log('테스트 데이터:', data);
    }

    // 다른 테이블들도 확인
    const tables = ['properties', 'customers', 'users', 'property_types'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0}개`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('💥 예상치 못한 오류:', error);
  }
}

testConnection();