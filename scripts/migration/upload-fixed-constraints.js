#!/usr/bin/env node

const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

const CLEANED_DATA_FILE = 'cleaned_properties_2025-08-03.json';
const BATCH_SIZE = 20; // 더 작은 배치로 안정성 확보

// 올바른 Foreign Key 매핑
const PROPERTY_TYPE_MAPPING = {
  'APARTMENT': 'apt',
  'OFFICETEL': 'officetel', 
  'VILLA': 'villa',
  'HOUSE': 'house',
  'STUDIO': 'apt', // studio -> apt
  'TWO_ROOM': 'apt', // two_room -> apt
  'COMMERCIAL': 'store', // commercial -> store
  'OFFICE': 'office',
  'MIXED_USE': 'apt', // mixed -> apt
  'TOWNHOUSE': 'house' // townhouse -> house
};

const PROPERTY_STATUS_MAPPING = {
  'ACTIVE': 'available',
  'COMPLETED': 'completed',
  'SOLD': 'completed',
  'INACTIVE': 'hold',
  'PENDING': 'available',
  'IN_PROGRESS': 'contract'
};

const TRANSACTION_TYPE_MAPPING = {
  'SALE': 'sale',
  'JEONSE': 'lease',
  'MONTHLY_RENT': 'monthly',
  'SHORT_TERM': 'monthly'
};

class FixedConstraintUploader {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.uploadStats = {
      total: 0,
      success: 0,
      errors: 0,
      batches: 0,
      skipped: 0
    };
    this.errorLog = [];
    this.skippedLog = [];
  }

  // 가격 값 안전하게 처리
  sanitizePrice(price) {
    if (!price || price === null || price === undefined) return null;
    
    if (typeof price === 'string') {
      price = parseFloat(price);
    }
    
    if (isNaN(price)) return null;
    
    // PostgreSQL bigint 최대값: 9,223,372,036,854,775,807
    const MAX_BIGINT = 9223372036854775807;
    
    if (price > MAX_BIGINT) {
      console.warn(`⚠️ 가격 값이 너무 큼: ${price} -> null로 처리`);
      return null;
    }
    
    // 음수 처리
    if (price < 0) {
      return null;
    }
    
    return Math.round(price);
  }

  // CSV 데이터를 올바른 Foreign Key 값으로 변환
  mapToValidSchema(csvProperty) {
    try {
      const mappedProperty = {
        id: csvProperty.id,
        
        // 기본 정보
        property_name: csvProperty.property_name,
        location: csvProperty.location,
        building_name: csvProperty.building_name,
        room_number: csvProperty.unit_number,
        
        // Foreign Key 매핑
        property_type: PROPERTY_TYPE_MAPPING[csvProperty.property_type] || 'apt',
        transaction_type: TRANSACTION_TYPE_MAPPING[csvProperty.transaction_type] || 'sale',
        property_status: PROPERTY_STATUS_MAPPING[csvProperty.property_status] || 'available',
        
        // 면적 정보
        area_pyeong: csvProperty.area_pyeong,
        area_m2: csvProperty.area_m2,
        
        // 층 정보
        floor_current: csvProperty.floor,
        floor_total: csvProperty.total_floors,
        
        // 방 정보
        room_count: csvProperty.rooms,
        bath_count: csvProperty.bathrooms,
        
        // 가격 정보 (안전하게 처리)
        price: this.sanitizePrice(csvProperty.sale_price || csvProperty.jeonse_deposit || csvProperty.monthly_deposit),
        lease_price: this.sanitizePrice(csvProperty.jeonse_deposit),
        monthly_fee: this.sanitizePrice(csvProperty.monthly_rent || csvProperty.maintenance_fee),
        
        // 설명
        description: this.buildDescription(csvProperty),
        special_notes: csvProperty.special_notes || csvProperty.manager_memo,
        
        // 날짜
        available_date: csvProperty.move_in_date,
        
        // 기본값
        exclusive_type: null,
        exclusive_end_date: null,
        user_id: null,
        manager_id: csvProperty.manager_id,
        manager_name: csvProperty.manager_name,
        owner_name: csvProperty.owner_name,
        owner_phone: csvProperty.owner_phone,
        customer_name: null,
        customer_phone: null,
        customer_request: null,
        view_count: 0,
        
        // 타임스탬프
        created_at: csvProperty.created_at,
        updated_at: csvProperty.updated_at,
        created_by: null,
        updated_by: null
      };

      // 데이터 유효성 검사
      if (!mappedProperty.property_name || !mappedProperty.location) {
        throw new Error('필수 필드 누락');
      }

      return mappedProperty;
      
    } catch (error) {
      throw new Error(`데이터 변환 실패: ${error.message}`);
    }
  }

  buildDescription(csvProperty) {
    const parts = [];
    
    if (csvProperty.direction) parts.push(`방향: ${csvProperty.direction}`);
    if (csvProperty.parking) parts.push(`주차: ${csvProperty.parking}`);
    if (csvProperty.approval_date) parts.push(`사용승인: ${csvProperty.approval_date}`);
    
    return parts.length > 0 ? parts.join(', ') : null;
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
      console.log('🚀 제약 조건 수정 후 Supabase 업로드 시작...');
      
      // 정제된 데이터 로드
      const rawData = await fs.readFile(CLEANED_DATA_FILE, 'utf8');
      const csvProperties = JSON.parse(rawData);
      
      console.log(`📊 원본 데이터: ${csvProperties.length}개`);
      
      // 스키마 변환
      console.log('🔄 Foreign Key 제약 조건에 맞춰 변환 중...');
      const validProperties = [];
      let conversionErrors = 0;
      
      csvProperties.forEach((csvProperty, index) => {
        try {
          const mapped = this.mapToValidSchema(csvProperty);
          validProperties.push(mapped);
        } catch (error) {
          console.warn(`⚠️ 변환 실패 (${index + 1}): ${csvProperty.property_name} - ${error.message}`);
          conversionErrors++;
          this.skippedLog.push({
            index: index + 1,
            property_name: csvProperty.property_name,
            error: error.message
          });
        }
      });
      
      console.log(`✅ 변환 완료: ${validProperties.length}개 성공, ${conversionErrors}개 건너뜀`);
      this.uploadStats.total = validProperties.length;
      this.uploadStats.skipped = conversionErrors;
      
      // 기존 데이터 확인
      const { count: existingCount } = await this.supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
        
      console.log(`📋 기존 매물 수: ${existingCount}개`);
      
      // 배치 단위로 업로드
      const totalBatches = Math.ceil(validProperties.length / BATCH_SIZE);
      
      for (let i = 0; i < validProperties.length; i += BATCH_SIZE) {
        const batch = validProperties.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        try {
          await this.uploadBatch(batch, batchNumber);
          
          // 배치 간 대기
          if (batchNumber < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (error) {
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
    console.log('\n📈 최종 업로드 결과:');
    console.log(`   원본 데이터: ${this.uploadStats.total + this.uploadStats.skipped}개`);
    console.log(`   변환 성공: ${this.uploadStats.total}개`);
    console.log(`   변환 실패: ${this.uploadStats.skipped}개`);
    console.log(`   업로드 성공: ${this.uploadStats.success}개`);
    console.log(`   업로드 실패: ${this.uploadStats.errors}개`);
    console.log(`   성공 배치: ${this.uploadStats.batches}개`);
    console.log(`   최종 성공률: ${((this.uploadStats.success / (this.uploadStats.total + this.uploadStats.skipped)) * 100).toFixed(1)}%`);
  }

  // 로그 저장
  async saveUploadLog() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    await fs.writeFile(
      `final_fixed_upload_statistics_${timestamp}.json`,
      JSON.stringify(this.uploadStats, null, 2)
    );
    
    if (this.errorLog.length > 0) {
      await fs.writeFile(
        `final_fixed_upload_errors_${timestamp}.json`,
        JSON.stringify(this.errorLog, null, 2)
      );
    }
    
    if (this.skippedLog.length > 0) {
      await fs.writeFile(
        `final_fixed_upload_skipped_${timestamp}.json`,
        JSON.stringify(this.skippedLog, null, 2)
      );
    }
    
    console.log(`💾 로그 저장 완료`);
  }

  // 업로드 후 검증
  async verifyUpload() {
    try {
      console.log('\n🔍 최종 검증 중...');
      
      const { count: finalCount } = await this.supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
        
      console.log(`✅ 검증 완료: 총 ${finalCount}개 매물이 데이터베이스에 있습니다.`);
      
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
    const uploader = new FixedConstraintUploader();
    
    // 업로드 실행
    await uploader.uploadToSupabase();
    
    // 업로드 검증
    await uploader.verifyUpload();
    
    console.log('\n🎉 Foreign Key 제약 조건 문제 해결 후 업로드 완료!');
    
  } catch (error) {
    console.error('💥 업로드 실패:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = FixedConstraintUploader;