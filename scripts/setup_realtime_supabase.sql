-- Supabase 양방향 실시간 연동 설정
-- 이 스크립트는 Supabase 대시보드의 SQL Editor에서 실행해야 합니다.

-- 1. RLS(Row Level Security) 정책 업데이트
-- properties 테이블 RLS 활성화
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 매물을 조회할 수 있음
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);

-- 인증된 사용자는 매물을 추가할 수 있음  
CREATE POLICY "Authenticated users can insert properties" ON properties FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 매물 관리자나 관리자 권한을 가진 사용자만 수정 가능
CREATE POLICY "Property managers can update their properties" ON properties FOR UPDATE 
USING (
  auth.uid()::text = manager_id OR 
  auth.jwt() ->> 'email' IN (
    'jenny@the-realty.co.kr',
    'lucas@the-realty.co.kr', 
    'hmlee@the-realty.co.kr'
  )
);

-- 매물 관리자나 관리자 권한을 가진 사용자만 삭제 가능
CREATE POLICY "Property managers can delete their properties" ON properties FOR DELETE 
USING (
  auth.uid()::text = manager_id OR 
  auth.jwt() ->> 'email' IN (
    'jenny@the-realty.co.kr',
    'lucas@the-realty.co.kr', 
    'hmlee@the-realty.co.kr'
  )
);

-- 2. users 테이블 RLS 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 사용자 정보를 조회할 수 있음 (회사 내부용)
CREATE POLICY "Authenticated users can view users" ON users FOR SELECT 
USING (auth.role() = 'authenticated');

-- 관리자만 사용자를 추가할 수 있음
CREATE POLICY "Only admins can insert users" ON users FOR INSERT 
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'jenny@the-realty.co.kr',
    'lucas@the-realty.co.kr', 
    'hmlee@the-realty.co.kr'
  )
);

-- 사용자는 자신의 정보를 수정할 수 있고, 관리자는 모든 사용자 정보를 수정할 수 있음
CREATE POLICY "Users can update own profile, admins can update all" ON users FOR UPDATE 
USING (
  auth.uid()::text = id OR 
  auth.jwt() ->> 'email' IN (
    'jenny@the-realty.co.kr',
    'lucas@the-realty.co.kr', 
    'hmlee@the-realty.co.kr'
  )
);

-- 관리자만 사용자를 삭제할 수 있음
CREATE POLICY "Only admins can delete users" ON users FOR DELETE 
USING (
  auth.jwt() ->> 'email' IN (
    'jenny@the-realty.co.kr',
    'lucas@the-realty.co.kr', 
    'hmlee@the-realty.co.kr'
  )
);

-- 3. 룩업 테이블들 RLS 설정 (읽기 전용)
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;  
ALTER TABLE property_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property_types" ON property_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view transaction_types" ON transaction_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view property_statuses" ON property_statuses FOR SELECT USING (true);

-- 4. Realtime 구독 설정
-- properties 테이블에 대한 실시간 구독 활성화
ALTER publication supabase_realtime ADD TABLE properties;
ALTER publication supabase_realtime ADD TABLE users;
ALTER publication supabase_realtime ADD TABLE property_types;
ALTER publication supabase_realtime ADD TABLE transaction_types;
ALTER publication supabase_realtime ADD TABLE property_statuses;

-- 5. 인덱스 추가 (성능 최적화)
-- 매물 조회 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_properties_manager_id ON properties(manager_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_transaction_type ON properties(transaction_type);
CREATE INDEX IF NOT EXISTS idx_properties_property_status ON properties(property_status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING gin(to_tsvector('korean', location));

-- 사용자 조회 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 6. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- properties 테이블에 updated_at 자동 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- users 테이블에 updated_at 자동 업데이트 트리거 적용  
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 고유 ID 제약조건 및 시퀀스 확인
-- properties 테이블의 UUID 기본키 확인
ALTER TABLE properties ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- users 테이블의 UUID 기본키 확인  
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 8. 외래키 제약조건 확인 및 추가
-- properties 테이블의 외래키 제약조건
ALTER TABLE properties DROP CONSTRAINT IF EXISTS fk_properties_property_type;
ALTER TABLE properties ADD CONSTRAINT fk_properties_property_type 
    FOREIGN KEY (property_type) REFERENCES property_types(id);

ALTER TABLE properties DROP CONSTRAINT IF EXISTS fk_properties_transaction_type;  
ALTER TABLE properties ADD CONSTRAINT fk_properties_transaction_type
    FOREIGN KEY (transaction_type) REFERENCES transaction_types(id);

ALTER TABLE properties DROP CONSTRAINT IF EXISTS fk_properties_property_status;
ALTER TABLE properties ADD CONSTRAINT fk_properties_property_status
    FOREIGN KEY (property_status) REFERENCES property_statuses(id);

-- manager_id는 users.id를 참조하지만, 하드코딩된 관리자 계정도 있으므로 제약조건 추가하지 않음

-- 9. 성공 메시지
SELECT 'Supabase 양방향 실시간 연동 설정 완료! 🎉' as message;