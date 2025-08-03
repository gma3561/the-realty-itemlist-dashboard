#!/usr/bin/env node

const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://qwxghpwasmvottahchky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTI3NTksImV4cCI6MjA2ODQ4ODc1OX0.4a1Oc66k9mGmXLoHmrKyZiVeZISpyzgq1BERrb_-8n8';

const CLEANED_DATA_FILE = 'cleaned_properties_2025-08-03.json';
const BATCH_SIZE = 30; // 좀 더 작은 배치 크기

// 데이터베이스 스키마 매핑
const PROPERTY_TYPE_TO_DB = {
  'APARTMENT': 'apt',
  'OFFICETEL': 'officetel',
  'VILLA': 'villa',
  'HOUSE': 'house',
  'STUDIO': 'studio',
  'TWO_ROOM': 'two_room',
  'COMMERCIAL': 'commercial',
  'OFFICE': 'office',
  'MIXED_USE': 'mixed',
  'TOWNHOUSE': 'townhouse'
};

const TRANSACTION_TYPE_TO_DB = {
  'SALE': 'sale',
  'JEONSE': 'lease',
  'MONTHLY_RENT': 'monthly',
  'SHORT_TERM': 'short_term'
};

const STATUS_TO_DB = {
  'ACTIVE': 'available',
  'COMPLETED': 'contracted',
  'SOLD': 'sold',
  'INACTIVE': 'inactive',
  'PENDING': 'pending',
  'IN_PROGRESS': 'in_progress'
};

class SchemaMapper {
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

  // CSV 데이터를 현재 DB 스키마로 변환
  mapToCurrentSchema(csvProperty) {
    try {
      return {
        id: csvProperty.id,
        
        // 기본 정보
        property_name: csvProperty.property_name,
        location: csvProperty.location,
        building_name: csvProperty.building_name,
        room_number: csvProperty.unit_number, // unit_number -> room_number
        
        // 매물 유형
        property_type: PROPERTY_TYPE_TO_DB[csvProperty.property_type] || 'apt',
        transaction_type: TRANSACTION_TYPE_TO_DB[csvProperty.transaction_type] || 'sale',
        property_status: STATUS_TO_DB[csvProperty.property_status] || 'available',
        
        // 면적 정보
        area_pyeong: csvProperty.area_pyeong,
        area_m2: csvProperty.area_m2,
        
        // 층 정보
        floor_current: csvProperty.floor, // floor -> floor_current
        floor_total: csvProperty.total_floors, // total_floors -> floor_total
        
        // 방 정보
        room_count: csvProperty.rooms, // rooms -> room_count
        bath_count: csvProperty.bathrooms, // bathrooms -> bath_count
        
        // 가격 정보 (현재 스키마에 맞춰 조정)
        price: csvProperty.sale_price || csvProperty.jeonse_deposit || csvProperty.monthly_deposit,
        lease_price: csvProperty.jeonse_deposit,
        monthly_fee: csvProperty.monthly_rent || csvProperty.maintenance_fee,
        
        // 설명
        description: this.buildDescription(csvProperty),
        special_notes: csvProperty.special_notes || csvProperty.manager_memo,
        
        // 날짜
        available_date: csvProperty.move_in_date,
        
        // 전속 정보 (기본값)
        exclusive_type: null,
        exclusive_end_date: null,
        
        // 사용자 정보
        user_id: null,
        manager_id: csvProperty.manager_id,
        manager_name: csvProperty.manager_name,
        
        // 소유주 정보
        owner_name: csvProperty.owner_name,
        owner_phone: csvProperty.owner_phone,
        
        // 고객 정보 (빈 값으로 설정)
        customer_name: null,
        customer_phone: null,
        customer_request: null,
        
        // 기타
        view_count: 0,
        
        // 타임스탬프
        created_at: csvProperty.created_at,
        updated_at: csvProperty.updated_at,
        created_by: null,
        updated_by: null
      };
    } catch (error) {
      console.error('데이터 변환 실패:', error);
      throw error;
    }
  }

  // 설명 문구 생성
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
      console.log('🚀 스키마 매핑 후 Supabase 업로드 시작...');
      
      // 정제된 데이터 로드
      const rawData = await fs.readFile(CLEANED_DATA_FILE, 'utf8');
      const csvProperties = JSON.parse(rawData);
      
      console.log(`📊 원본 데이터: ${csvProperties.length}개`);
      
      // 스키마 변환
      console.log('🔄 스키마 변환 중...');
      const mappedProperties = [];
      let conversionErrors = 0;
      
      csvProperties.forEach((csvProperty, index) => {
        try {
          const mapped = this.mapToCurrentSchema(csvProperty);
          mappedProperties.push(mapped);
        } catch (error) {
          console.warn(`⚠️ 변환 실패 (${index + 1}): ${csvProperty.property_name} - ${error.message}`);
          conversionErrors++;
        }
      });
      
      console.log(`✅ 변환 완료: ${mappedProperties.length}개 성공, ${conversionErrors}개 실패`);
      this.uploadStats.total = mappedProperties.length;
      
      // 기존 데이터 확인
      const { count: existingCount, error: countError } = await this.supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
        
      if (!countError) {
        console.log(`📋 기존 매물 수: ${existingCount}개`);
      }
      
      // 배치 단위로 업로드
      const totalBatches = Math.ceil(mappedProperties.length / BATCH_SIZE);
      
      for (let i = 0; i < mappedProperties.length; i += BATCH_SIZE) {
        const batch = mappedProperties.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        try {
          await this.uploadBatch(batch, batchNumber);
          
          // 배치 간 잠시 대기
          if (batchNumber < totalBatches) {
            await new Promise(resolve => setTimeout(resolve, 500));
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
    
    await fs.writeFile(
      `final_upload_statistics_${timestamp}.json`,
      JSON.stringify(this.uploadStats, null, 2)
    );
    
    if (this.errorLog.length > 0) {
      await fs.writeFile(
        `final_upload_errors_${timestamp}.json`,
        JSON.stringify(this.errorLog, null, 2)
      );
      console.log(`💾 에러 로그 저장: final_upload_errors_${timestamp}.json`);
    }
    
    console.log(`💾 업로드 통계 저장: final_upload_statistics_${timestamp}.json`);
  }

  // 업로드 후 검증
  async verifyUpload() {
    try {
      console.log('\n🔍 최종 업로드 검증 중...');
      
      const { count: finalCount, error: countError } = await this.supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('❌ 검증 실패:', countError.message);
        return false;
      }
      
      console.log(`✅ 검증 완료: 총 ${finalCount}개 매물이 데이터베이스에 있습니다.`);
      
      // 최근 업로드된 데이터 조회
      const { data: recentData, error: recentError } = await this.supabase
        .from('properties')
        .select('property_name, location, transaction_type, price, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!recentError && recentData.length > 0) {
        console.log('\n📋 최근 업로드된 매물 (10개):');
        recentData.forEach((property, index) => {
          const price = property.price ? `${(property.price / 100000000).toFixed(1)}억` : '가격미정';
          console.log(`   ${index + 1}. ${property.property_name} (${property.location}) - ${property.transaction_type} ${price}`);
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
      process.exit(1);
    }
    
    const mapper = new SchemaMapper();
    
    // 업로드 실행
    await mapper.uploadToSupabase();
    
    // 업로드 검증
    await mapper.verifyUpload();
    
    console.log('\n🎉 CSV 데이터 Supabase 업로드 완료!');
    console.log('이제 웹 애플리케이션에서 업로드된 매물 데이터를 확인할 수 있습니다.');
    
  } catch (error) {
    console.error('💥 업로드 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  main();
}

module.exports = SchemaMapper;