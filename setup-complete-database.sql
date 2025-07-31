-- =====================================================
-- 부동산 매물 관리 시스템 - 완전한 데이터베이스 설정
-- =====================================================

-- 1. 기존 테이블 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS property_statuses CASCADE;
DROP TABLE IF EXISTS transaction_types CASCADE;
DROP TABLE IF EXISTS property_types CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_mappings CASCADE;

-- 2. 사용자 프로필 테이블
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    department TEXT,
    position TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    performance_score NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 매핑 테이블 (이메일 기반 권한)
CREATE TABLE user_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 매물 유형 (Property Types)
CREATE TABLE property_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- 5. 거래 유형 (Transaction Types)
CREATE TABLE transaction_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- 6. 매물 상태 (Property Statuses)
CREATE TABLE property_statuses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    display_order INTEGER DEFAULT 0
);

-- 7. 매물 정보 테이블
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_name TEXT NOT NULL,
    location TEXT NOT NULL,
    building_name TEXT,
    room_number TEXT,
    property_type TEXT REFERENCES property_types(id),
    transaction_type TEXT REFERENCES transaction_types(id),
    property_status TEXT REFERENCES property_statuses(id) DEFAULT 'available',
    area_pyeong NUMERIC(10,2),
    area_m2 NUMERIC(10,2),
    floor_current INTEGER,
    floor_total INTEGER,
    room_count INTEGER,
    bath_count INTEGER,
    price BIGINT,
    lease_price BIGINT,
    monthly_fee BIGINT,
    description TEXT,
    special_notes TEXT,
    available_date DATE,
    exclusive_type TEXT,
    exclusive_end_date DATE,
    
    -- 담당자 정보
    user_id UUID REFERENCES auth.users(id),
    manager_id TEXT,
    manager_name TEXT,
    
    -- 고객 정보
    owner_name TEXT,
    owner_phone TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_request TEXT,
    
    -- 메타데이터
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스를 위한 필드
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 8. 매물 이미지 테이블
CREATE TABLE property_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 인덱스 생성
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_transaction_type ON properties(transaction_type);
CREATE INDEX idx_properties_property_status ON properties(property_status);
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_manager_id ON properties(manager_id);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_mappings_email ON user_mappings(email);

-- 10. RLS (Row Level Security) 정책
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- user_profiles 정책
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- user_mappings 정책 (관리자만)
CREATE POLICY "Anyone can view mappings" ON user_mappings
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage mappings" ON user_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- properties 정책
CREATE POLICY "Anyone can view properties" ON properties
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (
        auth.uid() = user_id OR
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can delete own properties" ON properties
    FOR DELETE USING (
        auth.uid() = user_id OR
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- property_images 정책
CREATE POLICY "Anyone can view images" ON property_images
    FOR SELECT USING (true);

CREATE POLICY "Property owners can manage images" ON property_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_images.property_id
            AND (properties.user_id = auth.uid() OR properties.created_by = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 11. 기본 데이터 삽입

-- 매물 유형
INSERT INTO property_types (id, name, display_order) VALUES
('apt', '아파트', 1),
('officetel', '오피스텔', 2),
('villa', '빌라', 3),
('house', '단독주택', 4),
('store', '상가', 5),
('office', '사무실', 6),
('land', '토지', 7),
('etc', '기타', 8);

-- 거래 유형
INSERT INTO transaction_types (id, name, display_order) VALUES
('sale', '매매', 1),
('lease', '전세', 2),
('monthly', '월세', 3),
('short', '단기임대', 4);

-- 매물 상태
INSERT INTO property_statuses (id, name, color, display_order) VALUES
('available', '거래가능', '#10B981', 1),
('contract', '계약중', '#F59E0B', 2),
('completed', '거래완료', '#6B7280', 3),
('hold', '보류', '#EF4444', 4);

-- 12. 관리자 계정 매핑 추가
INSERT INTO user_mappings (email, role, name) VALUES
('admin@realty.com', 'admin', '관리자'),
('manager@realty.com', 'admin', '매니저'),
('staff1@realty.com', 'user', '직원1'),
('staff2@realty.com', 'user', '직원2')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;

-- 13. 트리거 함수 - updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. 뷰 생성 - 매물 통계
CREATE OR REPLACE VIEW property_statistics AS
SELECT 
    COUNT(*) as total_properties,
    COUNT(CASE WHEN property_status = 'available' THEN 1 END) as available_count,
    COUNT(CASE WHEN property_status = 'contract' THEN 1 END) as contract_count,
    COUNT(CASE WHEN property_status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN transaction_type = 'sale' THEN 1 END) as sale_count,
    COUNT(CASE WHEN transaction_type = 'lease' THEN 1 END) as lease_count,
    COUNT(CASE WHEN transaction_type = 'monthly' THEN 1 END) as monthly_count
FROM properties;

-- 완료 메시지
SELECT '✅ 데이터베이스 설정이 완료되었습니다!' as message;