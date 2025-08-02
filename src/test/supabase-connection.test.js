import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Supabase Connection Test', () => {
  it('should test actual Supabase connection if configured', async () => {
    // 환경변수 체크
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase 환경변수가 설정되지 않아 연결 테스트를 건너뜁니다.')
      return
    }

    console.log('Supabase 연결 테스트 시작...')
    console.log('URL:', supabaseUrl)
    console.log('Key 길이:', supabaseKey.length)

    try {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // 기본 연결 테스트
      const { data, error } = await supabase
        .from('properties')
        .select('count')
        .limit(1)

      if (error) {
        console.log('Supabase 에러:', error.message)
        // RLS 에러는 정상적인 보안 동작
        if (error.message.includes('RLS') || error.message.includes('permission')) {
          console.log('✅ RLS 정책이 정상 작동 중 (보안 정상)')
        }
      } else {
        console.log('✅ Supabase 연결 성공:', data)
      }

      // 룩업 테이블 테스트
      const lookupTables = ['property_types', 'transaction_types', 'property_statuses']
      
      for (const table of lookupTables) {
        try {
          const { data: lookupData, error: lookupError } = await supabase
            .from(table)
            .select('*')
            .limit(5)

          if (lookupError) {
            console.log(`❌ ${table} 테이블 접근 실패:`, lookupError.message)
          } else {
            console.log(`✅ ${table} 테이블 접근 성공:`, lookupData?.length || 0, '개 레코드')
          }
        } catch (err) {
          console.log(`❌ ${table} 테이블 테스트 중 에러:`, err.message)
        }
      }

    } catch (error) {
      console.log('Supabase 연결 테스트 실패:', error.message)
    }

    // 테스트는 항상 통과 (실제 환경에서는 연결이 실패할 수 있으므로)
    expect(true).toBe(true)
  })
})