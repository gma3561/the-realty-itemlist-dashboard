-- 사용자 및 권한 관련 테이블
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 사용자 테이블 수정 (기존 users 테이블과 호환)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS role_id TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 고객 관련 테이블
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    source TEXT,
    notes TEXT,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    property_type_id UUID REFERENCES public.property_types(id),
    location TEXT,
    min_price BIGINT,
    max_price BIGINT,
    transaction_type_id UUID REFERENCES public.transaction_types(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 퍼널 분석 관련 테이블
CREATE TABLE IF NOT EXISTS public.funnel_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.funnel_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    user_id UUID REFERENCES public.users(id),
    stage_id TEXT NOT NULL REFERENCES public.funnel_stages(id),
    previous_stage_id TEXT REFERENCES public.funnel_stages(id),
    event_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 성과 분석 관련 테이블
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id),
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    time_period TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.performance_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    metric_type TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    time_period TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 매물 관련 테이블 확장
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS funnel_stage_id TEXT REFERENCES public.funnel_stages(id),
ADD COLUMN IF NOT EXISTS is_visible_to_all BOOLEAN DEFAULT true;

-- 매물 상태 히스토리 테이블
CREATE TABLE IF NOT EXISTS public.property_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id),
    user_id UUID REFERENCES public.users(id),
    previous_status_id UUID REFERENCES public.property_statuses(id),
    new_status_id UUID REFERENCES public.property_statuses(id),
    previous_funnel_stage_id TEXT REFERENCES public.funnel_stages(id),
    new_funnel_stage_id TEXT REFERENCES public.funnel_stages(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 시스템 설정 및 로그 테이블
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기본 데이터 삽입
INSERT INTO public.roles (id, name, permissions, description)
VALUES 
    ('admin', '관리자', '{"all": true}', '모든 권한을 가진 관리자'),
    ('employee', '직원', '{"view_own_properties": true, "manage_own_properties": true, "view_own_performance": true}', '자신의 매물만 관리할 수 있는 일반 직원')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    permissions = EXCLUDED.permissions, 
    description = EXCLUDED.description;

-- 퍼널 단계 기본 데이터
INSERT INTO public.funnel_stages (id, name, description, "order", color)
VALUES 
    ('inquiry', '문의', '초기 고객 문의 단계', 1, '#3B82F6'),
    ('consultation', '상담', '구체적인 상담 진행 단계', 2, '#10B981'),
    ('visit', '임장', '현장 방문 단계', 3, '#F59E0B'),
    ('negotiation', '협상', '가격 및 조건 협상 단계', 4, '#8B5CF6'),
    ('contract', '계약', '계약 체결 단계', 5, '#EF4444')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    "order" = EXCLUDED."order", 
    color = EXCLUDED.color;