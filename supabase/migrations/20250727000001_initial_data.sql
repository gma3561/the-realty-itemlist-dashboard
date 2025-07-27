-- 매물종류 초기 데이터
INSERT INTO property_types (id, name, created_at, updated_at) VALUES
  (uuid_generate_v4(), '아파트', NOW(), NOW()),
  (uuid_generate_v4(), '주상복합', NOW(), NOW()),
  (uuid_generate_v4(), '빌라/연립', NOW(), NOW()),
  (uuid_generate_v4(), '오피스텔', NOW(), NOW()),
  (uuid_generate_v4(), '단독주택', NOW(), NOW()),
  (uuid_generate_v4(), '타운하우스', NOW(), NOW()),
  (uuid_generate_v4(), '빌딩/건물', NOW(), NOW()),
  (uuid_generate_v4(), '사무실/상가', NOW(), NOW()),
  (uuid_generate_v4(), '상가주택', NOW(), NOW()),
  (uuid_generate_v4(), '원룸', NOW(), NOW()),
  (uuid_generate_v4(), '다가구', NOW(), NOW()),
  (uuid_generate_v4(), '한옥', NOW(), NOW()),
  (uuid_generate_v4(), '숙박/콘도', NOW(), NOW()),
  (uuid_generate_v4(), '전원/농가', NOW(), NOW()),
  (uuid_generate_v4(), '공장/창고', NOW(), NOW()),
  (uuid_generate_v4(), '재개발', NOW(), NOW()),
  (uuid_generate_v4(), '재건축', NOW(), NOW()),
  (uuid_generate_v4(), '아파트분양권', NOW(), NOW()),
  (uuid_generate_v4(), '주상복합분양권', NOW(), NOW()),
  (uuid_generate_v4(), '오피스텔분양권', NOW(), NOW()),
  (uuid_generate_v4(), '지식산업센터', NOW(), NOW()),
  (uuid_generate_v4(), '기타', NOW(), NOW());

-- 진행상태 초기 데이터
INSERT INTO property_statuses (id, name, created_at, updated_at) VALUES
  (uuid_generate_v4(), '거래가능', NOW(), NOW()),
  (uuid_generate_v4(), '거래완료', NOW(), NOW()),
  (uuid_generate_v4(), '거래보류', NOW(), NOW()),
  (uuid_generate_v4(), '거래유형추가', NOW(), NOW()),
  (uuid_generate_v4(), '공동중개요청', NOW(), NOW()),
  (uuid_generate_v4(), '거래철회', NOW(), NOW());

-- 거래유형 초기 데이터
INSERT INTO transaction_types (id, name, created_at, updated_at) VALUES
  (uuid_generate_v4(), '분양', NOW(), NOW()),
  (uuid_generate_v4(), '매매', NOW(), NOW()),
  (uuid_generate_v4(), '전세', NOW(), NOW()),
  (uuid_generate_v4(), '월세/렌트', NOW(), NOW()),
  (uuid_generate_v4(), '단기', NOW(), NOW());