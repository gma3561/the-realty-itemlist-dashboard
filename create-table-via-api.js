const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createTableViaAPI() {
  console.log('🔧 API로 테이블 생성 시도...\n');
  
  const sql = `
    -- property_comments 테이블 생성
    CREATE TABLE IF NOT EXISTS property_comments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_property_comments_property_id ON property_comments(property_id);
    CREATE INDEX IF NOT EXISTS idx_property_comments_user_id ON property_comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_property_comments_created_at ON property_comments(created_at DESC);
  `;
  
  try {
    // Supabase Management API 사용
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ API 응답 오류:', error);
      
      // 대안: pg 프로토콜 직접 사용
      console.log('\n💡 대안: Supabase Dashboard에서 직접 실행하세요');
      console.log(`🔗 https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].replace('https://', '')}/sql/new`);
    } else {
      console.log('✅ 테이블 생성 성공!');
    }
  } catch (error) {
    console.log('❌ 요청 실패:', error.message);
    console.log('\n📝 SQL을 복사해서 Supabase SQL Editor에서 실행하세요:');
    console.log(sql);
  }
}

createTableViaAPI();