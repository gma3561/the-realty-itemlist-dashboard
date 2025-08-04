// 더부동산 통합 관리 시스템 테이블 생성 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qwxghpwasmvottahchky.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL 또는 키가 없습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 마이그레이션 파일 경로
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// SQL 파일 목록 (순서대로)
const sqlFiles = [
  '20250727000000_initial_schema.sql',
  '20250727000001_initial_data.sql',
  '20250728000000_modify_schema.sql',
  '20250730000000_extended_schema.sql',
  '20250730000001_lookup_data.sql'
];

// 테이블 생성 함수
async function createTables() {
  console.log('테이블 생성 시작...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('-'.repeat(40));

  for (const sqlFile of sqlFiles) {
    const filePath = path.join(migrationsDir, sqlFile);
    
    try {
      // 파일 존재 여부 확인
      if (!fs.existsSync(filePath)) {
        console.error(`파일을 찾을 수 없음: ${filePath}`);
        continue;
      }
      
      console.log(`[${sqlFile}] 실행 중...`);
      
      // SQL 파일 읽기
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // SQL 명령을 여러 개의 문장으로 분리 (간단한 방법)
      const sqlStatements = sqlContent
        .replace(/--.*$/gm, '') // 주석 제거
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      // 각 SQL 문장 실행
      for (let i = 0; i < sqlStatements.length; i++) {
        const statement = sqlStatements[i];
        try {
          // PostgreSQL 함수 실행
          const { error } = await supabase.rpc('run_sql', { sql: statement });
          
          if (error) {
            if (error.message.includes('not exist')) {
              console.log(`SQL 함수 사용 불가: 대체 방법으로 진행합니다.`);
              
              // 테이블 조회 방식으로 대체
              const type = statement.toLowerCase().includes('create table') ? 'CREATE TABLE' :
                         statement.toLowerCase().includes('insert into') ? 'INSERT DATA' :
                         statement.toLowerCase().includes('alter table') ? 'ALTER TABLE' :
                         statement.toLowerCase().includes('create function') ? 'CREATE FUNCTION' :
                         statement.toLowerCase().includes('create trigger') ? 'CREATE TRIGGER' : 'OTHER';
              
              console.log(`[${type}] 문장 (${i+1}/${sqlStatements.length}) - Supabase 대시보드에서 실행 필요`);
            } else {
              console.error(`SQL 문장 오류 (${i+1}/${sqlStatements.length}):`, error.message);
            }
          } else {
            console.log(`SQL 문장 (${i+1}/${sqlStatements.length}) 실행 성공`);
          }
        } catch (err) {
          console.error(`SQL 문장 실행 중 예외 발생 (${i+1}/${sqlStatements.length}):`, err.message);
        }
      }
      
      console.log(`[${sqlFile}] 완료`);
      console.log('-'.repeat(40));
      
    } catch (error) {
      console.error(`[${sqlFile}] 파일 처리 중 오류:`, error);
    }
  }

  console.log('\n테이블 생성 시도 완료');
  console.log('\n다음 단계:');
  console.log('1. Supabase 대시보드에서 SQL 편집기 사용하여 마이그레이션 파일 직접 실행');
  console.log('2. 테이블 생성 후 "node scripts/generate_dummy_data.js" 실행하여 더미 데이터 생성');
  console.log('\n주의: Supabase의 RPC 기능 제한으로 인해 일부 명령은 대시보드에서 직접 실행해야 할 수 있습니다.');
}

// 스크립트 실행
createTables();