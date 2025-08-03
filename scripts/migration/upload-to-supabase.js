#!/usr/bin/env node

const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (키체인에서 가져온 자격 증명)
const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

const CLEANED_DATA_FILE = 'cleaned_properties_2025-08-03.json';
const BATCH_SIZE = 50; // 한 번에 업로드할 레코드 수

class SupabaseUploader {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.uploadStats = {
      total: 0,
      success: 0,
      errors: 0,
      batches: 0
    };
    this.errorLog = [];
  }

  // 배치 업로드
  async uploadBatch(properties, batchNumber) {
    try {
      console.log(`📦 배치 ${batchNumber} 업로드 중... (${properties.length}개)`);
      
      const { data, error } = await this.supabase
        .from('properties')
        .insert(properties)
        .select('id');
        
      if (error) {
        throw error;
      }
      
      console.log(`✅ 배치 ${batchNumber} 성공: ${data.length}개 업로드`);
      this.uploadStats.success += data.length;
      this.uploadStats.batches++;
      
      return data;
      
    } catch (error) {
      console.error(`❌ 배치 ${batchNumber} 실패:`, error.message);
      this.uploadStats.errors += properties.length;
      
      this.errorLog.push({
        batch: batchNumber,
        error: error.message,
        properties: properties.map(p => ({ id: p.id, name: p.property_name }))
      });
      
      throw error;
    }
  }

  // 메인 업로드 프로세스
  async uploadToSupabase() {
    try {
      console.log('🚀 Supabase 업로드 시작...');
      
      // 정제된 데이터 로드
      const rawData = await fs.readFile(CLEANED_DATA_FILE, 'utf8');
      const properties = JSON.parse(rawData);
      
      this.uploadStats.total = properties.length;
      console.log(`📊 업로드할 매물 수: ${properties.length}개`);
      
      // 기존 데이터 확인
      const { count: existingCount, error: countError } = await this.supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.warn('⚠️ 기존 데이터 수 확인 실패:', countError.message);
      } else {
        console.log(`📋 기존 매물 수: ${existingCount}개`);
      }
      
      // 배치 단위로 업로드
      const totalBatches = Math.ceil(properties.length / BATCH_SIZE);
      
      for (let i = 0; i < properties.length; i += BATCH_SIZE) {
        const batch = properties.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        try {
          await this.uploadBatch(batch, batchNumber);
          
          // 배치 간 잠시 대기 (API 레이트 리미트 방지)
          if (batchNumber < totalBatches) {
            console.log('⏳ 잠시 대기...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          // 배치 실패 시 계속 진행
          console.warn(`⚠️ 배치 ${batchNumber} 건너뛰고 계속 진행...`);
        }
      }
      
      // 최종 결과 출력
      this.printUploadResults();
      await this.saveUploadLog();
      
    } catch (error) {
      console.error('💥 업로드 프로세스 실패:', error);
      throw error;
    }
  }

  // 업로드 결과 출력
  printUploadResults() {
    console.log('\n📈 업로드 결과:');
    console.log(`   전체: ${this.uploadStats.total}개`);
    console.log(`   성공: ${this.uploadStats.success}개`);
    console.log(`   실패: ${this.uploadStats.errors}개`);
    console.log(`   배치: ${this.uploadStats.batches}개 성공`);
    console.log(`   성공률: ${((this.uploadStats.success / this.uploadStats.total) * 100).toFixed(1)}%`);
  }

  // 업로드 로그 저장
  async saveUploadLog() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 업로드 통계 저장
    await fs.writeFile(
      `upload_statistics_${timestamp}.json`,
      JSON.stringify(this.uploadStats, null, 2)
    );
    
    // 에러 로그 저장 (있는 경우)
    if (this.errorLog.length > 0) {
      await fs.writeFile(
        `upload_errors_${timestamp}.json`,
        JSON.stringify(this.errorLog, null, 2)
      );
      console.log(`💾 에러 로그 저장: upload_errors_${timestamp}.json`);
    }
    
    console.log(`💾 업로드 통계 저장: upload_statistics_${timestamp}.json`);
  }

  // 업로드 후 검증
  async verifyUpload() {
    try {
      console.log('\n🔍 업로드 검증 중...');
      
      const { count: finalCount, error: countError } = await this.supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('❌ 검증 실패:', countError.message);
        return false;
      }
      
      console.log(`✅ 검증 완료: 총 ${finalCount}개 매물이 데이터베이스에 있습니다.`);
      
      // 샘플 데이터 조회
      const { data: sampleData, error: sampleError } = await this.supabase
        .from('properties')
        .select('property_name, location, transaction_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!sampleError && sampleData.length > 0) {
        console.log('\n📋 최근 업로드된 매물 (5개):');
        sampleData.forEach((property, index) => {
          console.log(`   ${index + 1}. ${property.property_name} (${property.location}) - ${property.transaction_type}`);
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('💥 검증 중 오류:', error);
      return false;
    }
  }
}

// 메인 실행 함수
async function main() {
  try {
    // 정제된 데이터 파일 존재 확인
    try {
      await fs.access(CLEANED_DATA_FILE);
    } catch (error) {
      console.error(`❌ 정제된 데이터 파일을 찾을 수 없습니다: ${CLEANED_DATA_FILE}`);
      console.log('먼저 CSV 정제 스크립트를 실행해주세요.');
      process.exit(1);
    }
    
    const uploader = new SupabaseUploader();
    
    // 업로드 실행
    await uploader.uploadToSupabase();
    
    // 업로드 검증
    await uploader.verifyUpload();
    
    console.log('\n🎉 CSV 데이터 Supabase 업로드 완료!');
    
  } catch (error) {
    console.error('💥 업로드 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main();
}

module.exports = SupabaseUploader;