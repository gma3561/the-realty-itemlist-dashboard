-- 고객(customers) 테이블 생성
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('남성', '여성', '기타')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- 고객 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

-- 고객 테이블 RLS 활성화
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 고객 테이블 RLS 정책
-- 1. 인증된 사용자는 모든 고객 정보 조회 가능
CREATE POLICY "authenticated_users_can_select_customers" ON public.customers
    FOR SELECT TO authenticated USING (true);

-- 2. 인증된 사용자는 고객 정보 삽입 가능
CREATE POLICY "authenticated_users_can_insert_customers" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (true);

-- 3. 인증된 사용자는 고객 정보 수정 가능
CREATE POLICY "authenticated_users_can_update_customers" ON public.customers
    FOR UPDATE TO authenticated USING (true);

-- 4. 관리자만 고객 정보 삭제 가능
CREATE POLICY "admin_users_can_delete_customers" ON public.customers
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Properties 테이블에 customer_id 컬럼 추가 (고객 연결용)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- customer_id 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_properties_customer_id ON public.properties(customer_id);

-- updated_at 자동 업데이트 트리거 함수 (이미 존재하지 않는 경우에만)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- customers 테이블에 updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 더미 고객 데이터 삽입 (테스트용)
INSERT INTO public.customers (name, phone, email, address, notes, created_by) VALUES
('김철수', '010-1234-5678', 'kimcs@example.com', '서울시 강남구 테헤란로 123', '분양 문의 고객', 
 (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
('이영희', '010-9876-5432', 'leeyh@example.com', '서울시 서초구 반포대로 456', '전세 문의 고객',
 (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)),
('박민수', '010-5555-1234', 'parkms@example.com', '경기도 성남시 분당구 정자로 789', '매매 문의 고객',
 (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1));

COMMENT ON TABLE public.customers IS '고객 정보 테이블 - 매물 문의 및 거래 고객 관리';
COMMENT ON COLUMN public.customers.id IS '고객 고유 식별자';
COMMENT ON COLUMN public.customers.name IS '고객 이름';
COMMENT ON COLUMN public.customers.phone IS '고객 전화번호';
COMMENT ON COLUMN public.customers.email IS '고객 이메일';
COMMENT ON COLUMN public.customers.address IS '고객 주소';
COMMENT ON COLUMN public.customers.notes IS '고객 메모 및 특이사항';
COMMENT ON COLUMN public.customers.created_by IS '고객 정보를 등록한 직원 ID';