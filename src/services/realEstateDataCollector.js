/**
 * 부동산 실거래가 데이터 수집 서비스
 * 공공데이터포털 API를 활용하여 3시간마다 자동으로 데이터를 수집하고 업데이트
 */

import { createClient } from '@supabase/supabase-js';

class RealEstateDataCollector {
  constructor() {
    // 하드코딩된 Supabase 설정 (GitHub Pages 호환) 
    this.supabaseUrl = 'https://qwxghpwasmvottahchky.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3eGdocHdhc212b3R0YWhjaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0ODI2MTQsImV4cCI6MjA1MTA1ODYxNH0.gCsX7a7s17MwSQvlFpOcjVo6p49Y8QgwQNa52LZ9ZL4';
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // 공공데이터포털 API 설정
    this.apiKey = null; // 사용자가 설정할 API 키
    this.baseUrl = 'https://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc';
    
    // 3시간 간격 (밀리초)
    this.intervalTime = 3 * 60 * 60 * 1000;
    this.isRunning = false;
    this.lastCollectionTime = null;
    
    // 서울시 주요 지역 법정동 코드
    this.targetAreas = [
      { name: '강남구 역삼동', code: '11680' },
      { name: '강남구 삼성동', code: '11680' },
      { name: '서초구 서초동', code: '11650' },
      { name: '송파구 잠실동', code: '11710' },
      { name: '영등포구 여의도동', code: '11560' },
      { name: '마포구 상암동', code: '11440' },
      { name: '용산구 한남동', code: '11170' },
      { name: '종로구 청운동', code: '11110' }
    ];
  }

  /**
   * API 키 설정
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    console.log('✅ 공공데이터포털 API 키가 설정되었습니다.');
  }

  /**
   * 현재 년월 가져오기 (YYYYMM 형식)
   */
  getCurrentYearMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}${month}`;
  }

  /**
   * 지난 달 년월 가져오기 (YYYYMM 형식)
   */
  getLastMonth() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = (lastMonth.getMonth() + 1).toString().padStart(2, '0');
    return `${year}${month}`;
  }

  /**
   * 공공데이터포털 아파트 실거래가 API 호출
   */
  async fetchApartmentData(lawd_cd, deal_ymd) {
    if (!this.apiKey) {
      throw new Error('공공데이터포털 API 키가 설정되지 않았습니다.');
    }

    const url = `${this.baseUrl}/getRTMSDataSvcAptTradeDev`;
    const params = new URLSearchParams({
      serviceKey: this.apiKey,
      pageNo: '1',
      numOfRows: '1000',
      LAWD_CD: lawd_cd,
      DEAL_YMD: deal_ymd
    });

    try {
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const xmlText = await response.text();
      return this.parseXmlResponse(xmlText);
    } catch (error) {
      console.error(`데이터 수집 실패 - 지역: ${lawd_cd}, 년월: ${deal_ymd}`, error);
      throw error;
    }
  }

  /**
   * XML 응답 파싱
   */
  parseXmlResponse(xmlText) {
    // 간단한 XML 파싱 (실제로는 xml2js 등의 라이브러리 사용 권장)
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const item = {};

      // 주요 필드 추출
      const fields = [
        '거래금액', '건축년도', '년', '법정동', '아파트',
        '월', '일', '전용면적', '지번', '지역코드', '층'
      ];

      fields.forEach(field => {
        const regex = new RegExp(`<${field}>(.*?)</${field}>`);
        const fieldMatch = regex.exec(itemXml);
        if (fieldMatch) {
          item[field] = fieldMatch[1].trim();
        }
      });

      if (Object.keys(item).length > 0) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * 데이터를 Supabase에 저장
   */
  async saveToDatabase(data, areaInfo) {
    try {
      const processedData = data.map(item => ({
        area_name: areaInfo.name,
        area_code: areaInfo.code,
        apartment_name: item['아파트'] || '',
        transaction_amount: this.parseAmount(item['거래금액'] || '0'),
        build_year: parseInt(item['건축년도'] || '0'),
        transaction_year: parseInt(item['년'] || '0'),
        transaction_month: parseInt(item['월'] || '0'),
        transaction_day: parseInt(item['일'] || '0'),
        exclusive_area: parseFloat(item['전용면적'] || '0'),
        legal_dong: item['법정동'] || '',
        jibun: item['지번'] || '',
        floor: parseInt(item['층'] || '0'),
        collected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // 중복 데이터 방지를 위한 upsert
      const { data: result, error } = await this.supabase
        .from('real_estate_transactions')
        .upsert(processedData, {
          onConflict: 'area_code,apartment_name,transaction_year,transaction_month,transaction_day,jibun'
        });

      if (error) {
        throw error;
      }

      console.log(`✅ ${areaInfo.name}: ${processedData.length}건 데이터 저장 완료`);
      return processedData.length;
    } catch (error) {
      console.error(`데이터 저장 실패 - ${areaInfo.name}:`, error);
      throw error;
    }
  }

  /**
   * 거래금액 파싱 (쉼표 제거하고 숫자로 변환)
   */
  parseAmount(amountStr) {
    return parseInt(amountStr.replace(/,/g, '')) || 0;
  }

  /**
   * 단일 지역 데이터 수집
   */
  async collectAreaData(areaInfo) {
    try {
      const currentMonth = this.getCurrentYearMonth();
      const lastMonth = this.getLastMonth();
      
      console.log(`🔍 ${areaInfo.name} 데이터 수집 시작...`);
      
      let totalSaved = 0;
      
      // 현재 달과 지난 달 데이터 수집
      for (const month of [currentMonth, lastMonth]) {
        try {
          const data = await this.fetchApartmentData(areaInfo.code, month);
          if (data && data.length > 0) {
            const savedCount = await this.saveToDatabase(data, areaInfo);
            totalSaved += savedCount;
          }
          
          // API 호출 간격 (초당 10회 제한 준수)
          await this.sleep(200);
        } catch (error) {
          console.error(`${areaInfo.name} ${month} 데이터 수집 실패:`, error);
        }
      }
      
      return totalSaved;
    } catch (error) {
      console.error(`${areaInfo.name} 데이터 수집 중 오류:`, error);
      return 0;
    }
  }

  /**
   * 모든 지역 데이터 수집
   */
  async collectAllData() {
    if (!this.apiKey) {
      console.error('❌ API 키가 설정되지 않았습니다.');
      return;
    }

    const startTime = new Date();
    console.log(`🚀 부동산 데이터 수집 시작: ${startTime.toISOString()}`);
    
    let totalCollected = 0;
    
    try {
      for (const area of this.targetAreas) {
        const collected = await this.collectAreaData(area);
        totalCollected += collected;
        
        // 지역 간 수집 간격
        await this.sleep(1000);
      }
      
      this.lastCollectionTime = new Date();
      const duration = this.lastCollectionTime - startTime;
      
      console.log(`✅ 데이터 수집 완료!`);
      console.log(`   - 총 수집 건수: ${totalCollected}건`);
      console.log(`   - 소요 시간: ${Math.round(duration / 1000)}초`);
      console.log(`   - 다음 수집 예정: ${new Date(Date.now() + this.intervalTime).toISOString()}`);
      
      // 수집 로그 저장
      await this.saveCollectionLog(totalCollected, duration);
      
    } catch (error) {
      console.error('❌ 데이터 수집 중 오류 발생:', error);
    }
  }

  /**
   * 수집 로그 저장
   */
  async saveCollectionLog(count, duration) {
    try {
      await this.supabase
        .from('collection_logs')
        .insert({
          collected_count: count,
          duration_ms: duration,
          collected_at: new Date().toISOString(),
          status: 'success'
        });
    } catch (error) {
      console.error('수집 로그 저장 실패:', error);
    }
  }

  /**
   * 대기 함수
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 자동 수집 시작
   */
  startAutoCollection() {
    if (this.isRunning) {
      console.log('⚠️ 이미 자동 수집이 실행 중입니다.');
      return;
    }

    this.isRunning = true;
    console.log('🎯 부동산 데이터 자동 수집 시작 (3시간 간격)');
    
    // 즉시 첫 번째 수집 실행
    this.collectAllData();
    
    // 3시간 간격으로 반복 실행
    this.intervalId = setInterval(() => {
      this.collectAllData();
    }, this.intervalTime);
  }

  /**
   * 자동 수집 중지
   */
  stopAutoCollection() {
    if (!this.isRunning) {
      console.log('⚠️ 자동 수집이 실행되고 있지 않습니다.');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('⏹️ 부동산 데이터 자동 수집이 중지되었습니다.');
  }

  /**
   * 수집 상태 확인
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCollectionTime: this.lastCollectionTime,
      nextCollectionTime: this.isRunning ? new Date(Date.now() + this.intervalTime) : null,
      targetAreas: this.targetAreas.length,
      apiKeyConfigured: !!this.apiKey
    };
  }
}

export default RealEstateDataCollector;