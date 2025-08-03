#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function backupAndCleanDatabase() {
  console.log('🔄 데이터베이스 백업 및 정리 시작...');

  try {
    // 1. 현재 데이터 백업
    console.log('📦 기존 데이터 백업 중...');
    
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*');
    
    if (propError) {
      console.warn('⚠️ 매물 데이터 백업 실패:', propError.message);
    } else {
      await fs.writeFile(
        `backup_properties_${new Date().toISOString().split('T')[0]}.json`,
        JSON.stringify(properties, null, 2)
      );
      console.log(`✅ 매물 데이터 백업 완료: ${properties?.length || 0}개`);
    }

    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('*');
    
    if (custError) {
      console.warn('⚠️ 고객 데이터 백업 실패:', custError.message);
    } else if (customers) {
      await fs.writeFile(
        `backup_customers_${new Date().toISOString().split('T')[0]}.json`,
        JSON.stringify(customers, null, 2)
      );
      console.log(`✅ 고객 데이터 백업 완료: ${customers.length}개`);
    }

    // 2. 기존 데이터 삭제
    console.log('🗑️ 기존 데이터 삭제 중...');
    
    // 순서 중요: 참조 관계 고려하여 역순으로 삭제
    const tablesToClean = [
      'property_images',
      'property_shares', 
      'share_access_logs',
      'property_matches',
      'match_activities',
      'customers',
      'properties'
    ];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

        if (error && !error.message.includes('does not exist')) {
          console.warn(`⚠️ ${table} 테이블 정리 실패:`, error.message);
        } else {
          console.log(`✅ ${table} 테이블 정리 완료`);
        }
      } catch (err) {
        console.warn(`⚠️ ${table} 테이블 정리 중 오류:`, err.message);
      }
    }

    // 3. 데이터베이스 상태 확인
    console.log('📊 정리 후 상태 확인...');
    
    const { count: propCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    
    const { count: custCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📋 정리 완료 상태:`);
    console.log(`   매물: ${propCount || 0}개`);
    console.log(`   고객: ${custCount || 0}개`);

    if (propCount === 0 && custCount === 0) {
      console.log('✅ 데이터베이스 정리 성공! 마이그레이션 준비 완료');
    } else {
      console.warn('⚠️ 일부 데이터가 남아있습니다. 확인이 필요합니다.');
    }

    return {
      success: true,
      backupFiles: [
        `backup_properties_${new Date().toISOString().split('T')[0]}.json`,
        `backup_customers_${new Date().toISOString().split('T')[0]}.json`
      ]
    };

  } catch (error) {
    console.error('❌ 데이터베이스 정리 실패:', error);
    throw error;
  }
}

// 스크립트 직접 실행 시
if (process.argv[1].includes('backup_and_clean_database.js')) {
  backupAndCleanDatabase()
    .then(result => {
      console.log('\n🎉 작업 완료!');
      console.log('백업 파일:', result.backupFiles);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 작업 실패:', error.message);
      process.exit(1);
    });
}

export default backupAndCleanDatabase;