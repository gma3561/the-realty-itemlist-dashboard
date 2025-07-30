-- 사용자 및 권한 관련 테이블
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE CHECK (email LIKE '%@the-realty.co.kr'),
    name TEXT NOT NULL,
    password_hash TEXT,
    role_id TEXT NOT NULL REFERENCES public.roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- 고객 관련 테이블
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    source TEXT, -- 고객 유입 경로 (채널톡, 네이버톡톡, 전화문의 등)
    notes TEXT,
    user_id UUID REFERENCES public.users(id), -- 담당 직원
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    property_type_id TEXT REFERENCES public.property_types(id),
    location TEXT,
    min_price BIGINT,
    max_price BIGINT,
    transaction_type_id TEXT REFERENCES public.transaction_types(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 퍼널 분석 관련 테이블
CREATE TABLE IF NOT EXISTS public.funnel_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    color TEXT, -- 차트 표시용 색상
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.funnel_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
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
    metric_type TEXT NOT NULL, -- 'inquiry_count', 'consultation_count', 'visit_count', 'contract_count', 'conversion_rate', etc.
    metric_value NUMERIC NOT NULL,
    time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.performance_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id), -- NULL이면 전체 회사 목표
    metric_type TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    time_period TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 매물 관련 테이블 확장
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS funnel_stage_id TEXT REFERENCES public.funnel_stages(id) DEFAULT 'inquiry',
ADD COLUMN IF NOT EXISTS is_visible_to_all BOOLEAN DEFAULT true;

-- 매물 상태 히스토리 테이블
CREATE TABLE IF NOT EXISTS public.property_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id),
    user_id UUID NOT NULL REFERENCES public.users(id),
    previous_status_id TEXT REFERENCES public.property_statuses(id),
    new_status_id TEXT NOT NULL REFERENCES public.property_statuses(id),
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
    entity_type TEXT, -- 'property', 'customer', 'user', etc.
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 트리거 및 자동화
CREATE OR REPLACE FUNCTION record_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.property_status_id IS DISTINCT FROM NEW.property_status_id OR 
       OLD.funnel_stage_id IS DISTINCT FROM NEW.funnel_stage_id THEN
        INSERT INTO public.property_history (
            property_id, 
            user_id, 
            previous_status_id, 
            new_status_id,
            previous_funnel_stage_id,
            new_funnel_stage_id,
            notes
        ) VALUES (
            NEW.id, 
            auth.uid(), 
            OLD.property_status_id, 
            NEW.property_status_id,
            OLD.funnel_stage_id,
            NEW.funnel_stage_id,
            'Status automatically updated by system'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_status_change ON public.properties;
CREATE TRIGGER trg_property_status_change
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION record_property_status_change();

CREATE OR REPLACE FUNCTION create_funnel_event_on_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.funnel_stage_id IS DISTINCT FROM NEW.funnel_stage_id AND NEW.customer_id IS NOT NULL THEN
        INSERT INTO public.funnel_events (
            property_id,
            customer_id,
            user_id,
            stage_id,
            previous_stage_id,
            notes
        ) VALUES (
            NEW.id,
            NEW.customer_id,
            auth.uid(),
            NEW.funnel_stage_id,
            OLD.funnel_stage_id,
            'Stage automatically updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_funnel_event_creation ON public.properties;
CREATE TRIGGER trg_funnel_event_creation
BEFORE UPDATE ON public.properties
FOR EACH ROW
WHEN (OLD.funnel_stage_id IS DISTINCT FROM NEW.funnel_stage_id)
EXECUTE FUNCTION create_funnel_event_on_stage_change();

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