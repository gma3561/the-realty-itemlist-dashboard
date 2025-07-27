import { supabase } from '../services/supabase';

// 처리된 매물 데이터를 Supabase에 업로드하는 함수
export const uploadProcessedProperties = async (queryClient) => {
  try {
    console.log('매물 데이터 업로드 시작...');
    
    // 기존 데이터 확인
    const { data: existingProperties, error: fetchError } = await supabase
      .from('properties')
      .select('id')
      .limit(1);
      
    if (fetchError) {
      console.error('기존 데이터 확인 중 오류:', fetchError);
    }
    
    console.log('기존 매물 수:', existingProperties?.length || 0);
    
    // 첫 번째 배치 - 테스트용 작은 데이터셋
    const testBatch = [
      {
        property_name: "힐탑빌 - 매매",
        location: "한남동 1-241",
        property_type: "villa",
        transaction_type: "sale", 
        property_status: "available",
        sale_price: 2500000000,
        lease_price: 0,
        price: 0,
        building: "-",
        unit: "302",
        supply_area_sqm: 137.46,
        private_area_sqm: 122.97,
        floor_info: "3층/4층",
        rooms_bathrooms: "3/2개",
        direction: "남향",
        maintenance_fee: "20만원+",
        parking: "1대",
        move_in_date: "즉시입주",
        approval_date: "1992.10.02",
        special_notes: "한남동 유엔빌리지 내에 위치한 고급빌라입니다. 수리가 매우 잘되어있는 최고의 컨디션입니다.",
        manager_memo: "",
        is_commercial: false,
        manager_id: "admin-hardcoded"
      },
      {
        property_name: "힐탑빌 - 전세",
        location: "한남동 1-241", 
        property_type: "villa",
        transaction_type: "lease",
        property_status: "available",
        sale_price: 0,
        lease_price: 1400000000,
        price: 0,
        building: "-",
        unit: "302",
        supply_area_sqm: 137.46,
        private_area_sqm: 122.97,
        floor_info: "3층/4층",
        rooms_bathrooms: "3/2개",
        direction: "남향",
        maintenance_fee: "20만원+",
        parking: "1대",
        move_in_date: "즉시입주",
        approval_date: "1992.10.02",
        special_notes: "한남동 유엔빌리지 내에 위치한 고급빌라입니다. 수리가 매우 잘되어있는 최고의 컨디션입니다.",
        manager_memo: "",
        is_commercial: false,
        manager_id: "admin-hardcoded"
      },
      {
        property_name: "힐탑빌 - 월세",
        location: "한남동 1-241",
        property_type: "villa", 
        transaction_type: "rent",
        property_status: "available",
        sale_price: 0,
        lease_price: 100000000,
        price: 9000000,
        building: "-",
        unit: "302",
        supply_area_sqm: 137.46,
        private_area_sqm: 122.97,
        floor_info: "3층/4층",
        rooms_bathrooms: "3/2개",
        direction: "남향",
        maintenance_fee: "20만원+",
        parking: "1대",
        move_in_date: "즉시입주",
        approval_date: "1992.10.02",
        special_notes: "한남동 유엔빌리지 내에 위치한 고급빌라입니다. 수리가 매우 잘되어있는 최고의 컨디션입니다.",
        manager_memo: "",
        is_commercial: false,
        manager_id: "admin-hardcoded"
      },
      {
        property_name: "롯데캐슬이스트폴",
        location: "자양동 680-63번지 일대",
        property_type: "apt",
        transaction_type: "lease",
        property_status: "available",
        sale_price: 0,
        lease_price: 150000000,
        price: 0,
        building: "102",
        unit: "4804",
        supply_area_sqm: 180.16,
        private_area_sqm: 138.52,
        floor_info: "48/48층",
        rooms_bathrooms: "4/2개",
        direction: "남향",
        maintenance_fee: "확인불가",
        parking: "1.32대",
        move_in_date: "2025.03.08 이후",
        approval_date: "2025.1.23",
        special_notes: "롯데캐슬이스트폴 - 커뮤니티 시설 최상, 교통 편리, 한강 및 어린이대공원 인접",
        manager_memo: "",
        is_commercial: false,
        manager_id: "admin-hardcoded"
      },
      {
        property_name: "서초 트리마제",
        location: "서초구 서초동",
        property_type: "apt",
        transaction_type: "sale",
        property_status: "available", 
        sale_price: 4200000000,
        lease_price: 0,
        price: 0,
        building: "103",
        unit: "1502",
        supply_area_sqm: 114.9,
        private_area_sqm: 85.2,
        floor_info: "15층/20층",
        rooms_bathrooms: "3/2개",
        direction: "남동향",
        maintenance_fee: "25만원",
        parking: "2대",
        move_in_date: "즉시입주",
        approval_date: "2010.05.15",
        special_notes: "서초역 도보 5분, 강남 접근성 우수",
        manager_memo: "",
        is_commercial: false,
        manager_id: "admin-hardcoded"
      }
    ];
    
    console.log(`테스트 배치 ${testBatch.length}개 매물 업로드 시작`);
    
    const { data, error } = await supabase
      .from('properties')
      .insert(testBatch)
      .select();
      
    if (error) {
      console.error('업로드 오류:', error);
      throw error;
    }
    
    console.log(`${data.length}개 매물이 성공적으로 업로드되었습니다`);
    
    // 캐시 무효화
    if (queryClient) {
      queryClient.invalidateQueries(['properties']);
    }
    
    return {
      uploaded: data.length,
      failed: 0,
      total: testBatch.length
    };
    
  } catch (error) {
    console.error('업로드 실패:', error);
    throw error;
  }
};