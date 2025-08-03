-- 기존 property_status 테이블 데이터 삭제하고 올바른 값으로 재설정
TRUNCATE TABLE property_statuses CASCADE;

-- 올바른 진행상태 값 삽입
INSERT INTO property_statuses (id, name, display_order, color) VALUES
('available', '거래가능', 1, '#10B981'),
('completed', '거래완료', 2, '#6B7280'),
('hold', '거래보류', 3, '#F59E0B'),
('cancelled', '거래철회', 4, '#EF4444'),
('inspection_available', '임장가능', 5, '#3B82F6'),
('inspection_progress', '임장중', 6, '#8B5CF6');

-- 기존 transaction_types 테이블 데이터 삭제하고 올바른 값으로 재설정
TRUNCATE TABLE transaction_types CASCADE;

-- 올바른 거래유형 값 삽입
INSERT INTO transaction_types (id, name, display_order) VALUES
('presale', '분양', 1),
('developer', '시행사매물', 2),
('sale', '매매', 3),
('lease', '전세', 4),
('monthly', '월세/렌트', 5),
('short', '단기', 6);

-- 기존 properties 테이블의 잘못된 상태값 업데이트
UPDATE properties 
SET property_status = 'hold' 
WHERE property_status = 'contract';