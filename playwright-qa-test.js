import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:5175';

class RealEstateQATester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      databaseConnection: false,
      propertyRegistration: false,
      userRegistration: false,
      dataIntegrity: false,
      details: {}
    };
  }

  async init() {
    console.log('🚀 QA 테스트 시작...\n');
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 500 
    });
    this.page = await this.browser.newPage();
    
    // 콘솔 메시지 캡처
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ 브라우저 에러:', msg.text());
      }
    });
  }

  async login() {
    console.log('🔐 로그인 중...');
    await this.page.goto(BASE_URL);
    await this.page.waitForTimeout(2000);
    
    // QA 바이패스 모드 확인
    const isLoginPage = await this.page.locator('text=로그인').isVisible().catch(() => false);
    
    if (isLoginPage) {
      // 실제 로그인 필요
      await this.page.fill('input[type="email"]', 'admin@test.com');
      await this.page.fill('input[type="password"]', 'admin123');
      await this.page.click('button:has-text("로그인")');
    }
    
    // 대시보드 로드 대기
    await this.page.waitForSelector('text=대시보드', { timeout: 10000 });
    console.log('✅ 로그인 성공\n');
  }

  // 1. 데이터베이스 연동 테스트
  async testDatabaseConnection() {
    console.log('📊 1. 데이터베이스 연동 테스트');
    
    try {
      // Supabase 직접 연결 테스트
      const { data: testQuery, error } = await supabase
        .from('properties')
        .select('count')
        .limit(1);
      
      if (!error) {
        console.log('✅ Supabase 연결 성공');
        
        // 대시보드에서 데이터 로드 확인
        await this.page.goto(`${BASE_URL}/dashboard`);
        await this.page.waitForTimeout(3000);
        
        // 매물 현황 카드 확인
        const statusCard = await this.page.locator('.bg-white').first();
        const hasData = await statusCard.isVisible();
        
        if (hasData) {
          console.log('✅ 대시보드 데이터 로드 성공');
          
          // 실제 숫자 읽기
          const availableCount = await this.page.locator('text=거래가능').locator('..').locator('.text-3xl').textContent();
          console.log(`  - 거래가능 매물: ${availableCount}개`);
          
          this.results.databaseConnection = true;
          this.results.details.propertyCount = availableCount;
        }
      }
    } catch (error) {
      console.error('❌ 데이터베이스 연동 실패:', error.message);
    }
    
    console.log('');
  }

  // 2. 매물 등록 테스트
  async testPropertyRegistration() {
    console.log('🏠 2. 매물 등록 테스트');
    
    try {
      // 매물 등록 페이지로 이동
      await this.page.click('text=매물 등록');
      await this.page.waitForSelector('h1:has-text("매물 등록")', { timeout: 5000 });
      
      // 테스트 매물 정보 입력
      const testProperty = {
        name: `QA테스트매물_${Date.now()}`,
        location: '서울시 강남구 테스트동 123',
        price: '500000000'
      };
      
      // 필수 필드 입력
      await this.page.fill('input[placeholder*="매물명"]', testProperty.name);
      await this.page.fill('input[placeholder*="소재지"]', testProperty.location);
      
      // 매물 종류 선택
      await this.page.click('text=매물종류 선택');
      await this.page.click('text=아파트');
      
      // 거래 유형 선택
      await this.page.click('text=거래유형 선택');
      await this.page.click('text=매매');
      
      // 진행 상태 선택
      await this.page.click('text=진행상태 선택');
      await this.page.click('text=거래가능');
      
      // 가격 입력
      await this.page.fill('input[placeholder*="매매가"]', testProperty.price);
      
      // 등록 버튼 클릭
      await this.page.click('button:has-text("등록")');
      
      // 성공 메시지 또는 리다이렉트 대기
      await this.page.waitForTimeout(3000);
      
      // 등록 확인
      const currentUrl = this.page.url();
      if (currentUrl.includes('/properties')) {
        console.log('✅ 매물 등록 성공');
        
        // DB에서 확인
        const { data: newProperty } = await supabase
          .from('properties')
          .select('*')
          .eq('property_name', testProperty.name)
          .single();
        
        if (newProperty) {
          console.log(`  - 등록된 매물 ID: ${newProperty.id}`);
          this.results.propertyRegistration = true;
          this.results.details.newPropertyId = newProperty.id;
        }
      }
    } catch (error) {
      console.error('❌ 매물 등록 실패:', error.message);
    }
    
    console.log('');
  }

  // 3. 사용자 등록 테스트 (관리자 권한)
  async testUserRegistration() {
    console.log('👤 3. 사용자 등록 테스트 (관리자 권한)');
    
    try {
      // 사용자 관리 페이지로 이동
      await this.page.goto(`${BASE_URL}/users`);
      await this.page.waitForSelector('h1:has-text("사용자 관리")', { timeout: 5000 });
      
      // 새 사용자 추가 버튼 클릭
      await this.page.click('button:has-text("새 사용자 추가")');
      await this.page.waitForTimeout(1000);
      
      // 테스트 사용자 정보
      const testUser = {
        name: `QA테스트사용자_${Date.now()}`,
        email: `qatest_${Date.now()}@test.com`,
        phone: '010-1234-5678'
      };
      
      // 사용자 정보 입력
      await this.page.fill('input[placeholder*="이름"]', testUser.name);
      await this.page.fill('input[placeholder*="이메일"]', testUser.email);
      await this.page.fill('input[placeholder*="전화번호"]', testUser.phone);
      
      // 역할 선택
      await this.page.click('text=역할 선택');
      await this.page.click('text=직원');
      
      // 저장 버튼 클릭
      await this.page.click('button:has-text("저장")');
      await this.page.waitForTimeout(2000);
      
      // 등록 확인
      const userRow = await this.page.locator(`text=${testUser.name}`).isVisible();
      
      if (userRow) {
        console.log('✅ 사용자 등록 성공');
        console.log(`  - 등록된 사용자: ${testUser.name}`);
        this.results.userRegistration = true;
        this.results.details.newUserEmail = testUser.email;
      }
    } catch (error) {
      console.error('❌ 사용자 등록 실패:', error.message);
    }
    
    console.log('');
  }

  // 4. 데이터 무결성 검증
  async testDataIntegrity() {
    console.log('🔍 4. 데이터 무결성 검증 (기획 vs 실제)');
    
    try {
      // 기획서 요구사항 체크리스트
      const requirements = {
        statusTypes: ['available', 'contract', 'inspection_available', 'hold', 'completed', 'cancelled'],
        propertyTypes: ['apt', 'officetel', 'villa', 'house', 'commercial'],
        transactionTypes: ['presale', 'developer', 'sale', 'lease', 'rent', 'short'],
        dashboardFeatures: {
          currentStatus: false,
          weeklyActivity: false,
          realtimeFeed: false,
          teamPerformance: false
        }
      };
      
      // 1. 상태 타입 확인
      const { data: statuses } = await supabase
        .from('property_statuses')
        .select('id');
      
      const dbStatuses = statuses.map(s => s.id);
      const statusMatch = requirements.statusTypes.every(s => dbStatuses.includes(s));
      
      console.log(`  - 매물 상태 타입: ${statusMatch ? '✅' : '❌'} (${dbStatuses.length}/${requirements.statusTypes.length})`);
      
      // 2. 매물 종류 확인
      const { data: types } = await supabase
        .from('property_types')
        .select('id');
      
      const dbTypes = types.map(t => t.id);
      const typeMatch = requirements.propertyTypes.every(t => dbTypes.includes(t));
      
      console.log(`  - 매물 종류: ${typeMatch ? '✅' : '❌'} (${dbTypes.length}/${requirements.propertyTypes.length})`);
      
      // 3. 거래 유형 확인
      const { data: transactions } = await supabase
        .from('transaction_types')
        .select('id');
      
      const dbTransactions = transactions.map(t => t.id);
      const transactionMatch = requirements.transactionTypes.every(t => dbTransactions.includes(t));
      
      console.log(`  - 거래 유형: ${transactionMatch ? '✅' : '❌'} (${dbTransactions.length}/${requirements.transactionTypes.length})`);
      
      // 4. 대시보드 기능 확인
      await this.page.goto(`${BASE_URL}/dashboard`);
      await this.page.waitForTimeout(2000);
      
      // 현재 매물 현황
      requirements.dashboardFeatures.currentStatus = await this.page.locator('text=현재 매물 현황').isVisible();
      console.log(`  - 현재 매물 현황: ${requirements.dashboardFeatures.currentStatus ? '✅' : '❌'}`);
      
      // 이번 주 활동 현황
      requirements.dashboardFeatures.weeklyActivity = await this.page.locator('text=이번 주 활동 현황').isVisible();
      console.log(`  - 이번 주 활동 현황: ${requirements.dashboardFeatures.weeklyActivity ? '✅' : '❌'}`);
      
      // 최근 활동 피드
      requirements.dashboardFeatures.realtimeFeed = await this.page.locator('text=최근 활동').isVisible();
      console.log(`  - 실시간 활동 피드: ${requirements.dashboardFeatures.realtimeFeed ? '✅' : '❌'}`);
      
      // 팀 성과
      requirements.dashboardFeatures.teamPerformance = await this.page.locator('text=주간 팀 활동').isVisible();
      console.log(`  - 팀 성과 추적: ${requirements.dashboardFeatures.teamPerformance ? '✅' : '❌'}`);
      
      // 전체 평가
      this.results.dataIntegrity = statusMatch && typeMatch && transactionMatch && 
        Object.values(requirements.dashboardFeatures).every(v => v === true);
      
    } catch (error) {
      console.error('❌ 데이터 무결성 검증 실패:', error.message);
    }
    
    console.log('');
  }

  async generateReport() {
    console.log('📋 QA 테스트 결과 요약');
    console.log('========================');
    console.log(`1. 데이터베이스 연동: ${this.results.databaseConnection ? '✅ 성공' : '❌ 실패'}`);
    console.log(`2. 매물 등록: ${this.results.propertyRegistration ? '✅ 성공' : '❌ 실패'}`);
    console.log(`3. 사용자 등록: ${this.results.userRegistration ? '✅ 성공' : '❌ 실패'}`);
    console.log(`4. 데이터 무결성: ${this.results.dataIntegrity ? '✅ 정상' : '❌ 문제 발견'}`);
    console.log('========================');
    
    const passedTests = Object.values(this.results).filter(v => v === true).length;
    const totalTests = 4;
    
    console.log(`\n전체 결과: ${passedTests}/${totalTests} 테스트 통과`);
    
    if (passedTests === totalTests) {
      console.log('✅ 모든 테스트를 통과했습니다!');
    } else {
      console.log('⚠️ 일부 테스트가 실패했습니다. 위 로그를 확인하세요.');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.login();
      
      // 순차적으로 테스트 실행
      await this.testDatabaseConnection();
      await this.testPropertyRegistration();
      await this.testUserRegistration();
      await this.testDataIntegrity();
      
      await this.generateReport();
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// 테스트 실행
const tester = new RealEstateQATester();
tester.run();