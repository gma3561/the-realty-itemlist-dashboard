-- =====================================================
-- 승인된 사용자 추가
-- =====================================================

-- user_mappings 테이블에 승인된 사용자 추가
-- 이메일을 실제 사용할 이메일로 변경하세요

INSERT INTO user_mappings (email, role, name) VALUES
-- 관리자
('lucas@the-realty.co.kr', 'admin', '하상현'),  -- 실제 관리자 이메일로 변경
('admin@example.com', 'admin', '관리자'),

-- 일반 사용자
('user1@example.com', 'user', '직원1'),
('user2@example.com', 'user', '직원2')

ON CONFLICT (email) DO UPDATE SET 
  role = EXCLUDED.role,
  name = EXCLUDED.name;

-- 현재 등록된 사용자 확인
SELECT * FROM user_mappings ORDER BY created_at DESC;