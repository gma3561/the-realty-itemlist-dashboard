# 더부동산 통합 관리 시스템 데이터베이스 스키마

이 문서는 '더부동산 통합 관리 시스템'의 확장된 데이터베이스 스키마 설계를 제시합니다.

## 1. 사용자 및 권한 관리

### 1.1. users 테이블
```sql
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE CHECK (email LIKE '%@the-realty.co.kr'),
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES public.roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

### 1.2. roles 테이블
```sql
CREATE TABLE public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기본 역할 데이터
INSERT INTO public.roles (id, name, permissions, description)
VALUES 
    ('admin', '관리자', '{"all": true}', '모든 권한을 가진 관리자'),
    ('employee', '직원', '{"view_own_properties": true, "manage_own_properties": true, "view_own_performance": true}', '자신의 매물만 관리할 수 있는 일반 직원');
```

## 2. 매물 관리 (기존 + 확장)

### 2.1. properties 테이블 (확장)
```sql
ALTER TABLE public.properties
ADD COLUMN user_id UUID REFERENCES public.users(id),
ADD COLUMN customer_id UUID REFERENCES public.customers(id),
ADD COLUMN funnel_stage_id TEXT REFERENCES public.funnel_stages(id) DEFAULT 'inquiry',
ADD COLUMN is_visible_to_all BOOLEAN DEFAULT true;
```

### 2.2. property_history 테이블 (신규)
```sql
CREATE TABLE public.property_history (
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
```

## 3. 고객 관리

### 3.1. customers 테이블
```sql
CREATE TABLE public.customers (
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
```

### 3.2. customer_interests 테이블
```sql
CREATE TABLE public.customer_interests (
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
```

## 4. 퍼널 분석

### 4.1. funnel_stages 테이블
```sql
CREATE TABLE public.funnel_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    color TEXT, -- 차트 표시용 색상
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 기본 퍼널 단계 데이터
INSERT INTO public.funnel_stages (id, name, description, "order", color)
VALUES 
    ('inquiry', '문의', '초기 고객 문의 단계', 1, '#3B82F6'),
    ('consultation', '상담', '구체적인 상담 진행 단계', 2, '#10B981'),
    ('visit', '임장', '현장 방문 단계', 3, '#F59E0B'),
    ('negotiation', '협상', '가격 및 조건 협상 단계', 4, '#8B5CF6'),
    ('contract', '계약', '계약 체결 단계', 5, '#EF4444');
```

### 4.2. funnel_events 테이블
```sql
CREATE TABLE public.funnel_events (
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
```

## 5. 직원 성과 분석

### 5.1. performance_metrics 테이블
```sql
CREATE TABLE public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id),
    metric_type TEXT NOT NULL, -- 'inquiry_count', 'consultation_count', 'visit_count', 'contract_count', 'conversion_rate', etc.
    metric_value NUMERIC NOT NULL,
    time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 5.2. performance_goals 테이블
```sql
CREATE TABLE public.performance_goals (
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
```

## 6. 시스템 설정 및 로그

### 6.1. system_settings 테이블
```sql
CREATE TABLE public.system_settings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 6.2. activity_logs 테이블
```sql
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT, -- 'property', 'customer', 'user', etc.
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## 7. RLS 정책 설정

```sql
-- 사용자 권한 정책
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own info" ON public.users FOR SELECT
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.id = 'admin'
    ));
CREATE POLICY "Only admins can insert" ON public.users FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.id = 'admin'
    ));
CREATE POLICY "Users can update own info" ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.id = 'admin'
    ));

-- 매물 정책
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all properties" ON public.properties FOR SELECT
    USING (true);
CREATE POLICY "Users can insert own properties" ON public.properties FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.id = 'admin'
    ));

-- 고객 정보 정책
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view customers they manage" ON public.customers FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.id = 'admin'
    ));
CREATE POLICY "Users can insert customers" ON public.customers FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.id = 'admin'
    ));
```

## 8. 트리거 및 자동화

### 8.1. 매물 상태 변경 트리거
```sql
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

CREATE TRIGGER trg_property_status_change
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION record_property_status_change();
```

### 8.2. 퍼널 이벤트 자동 생성 트리거
```sql
CREATE OR REPLACE FUNCTION create_funnel_event_on_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.funnel_stage_id IS DISTINCT FROM NEW.funnel_stage_id THEN
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

CREATE TRIGGER trg_funnel_event_creation
BEFORE UPDATE ON public.properties
FOR EACH ROW
WHEN (OLD.funnel_stage_id IS DISTINCT FROM NEW.funnel_stage_id)
EXECUTE FUNCTION create_funnel_event_on_stage_change();
```

## 9. 데이터베이스 인덱스 설정

```sql
-- 사용자 이메일 검색 속도 향상
CREATE INDEX idx_users_email ON public.users(email);

-- 매물 필터링 성능 향상
CREATE INDEX idx_properties_type_status ON public.properties(property_type_id, property_status_id);
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_funnel_stage ON public.properties(funnel_stage_id);

-- 고객 검색 최적화
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);

-- 퍼널 분석 쿼리 최적화
CREATE INDEX idx_funnel_events_stage_date ON public.funnel_events(stage_id, event_date);
CREATE INDEX idx_funnel_events_customer_id ON public.funnel_events(customer_id);
CREATE INDEX idx_funnel_events_user_id ON public.funnel_events(user_id);

-- 성과 분석 쿼리 최적화
CREATE INDEX idx_performance_metrics_user_period ON public.performance_metrics(user_id, time_period, start_date);
```

## 10. 데이터 마이그레이션 계획

1. 기존 properties 테이블에서 새로운 스키마로 데이터 마이그레이션
2. 초기 사용자 및 권한 설정 등록
3. 테스트 데이터 생성 및 검증
4. 단계적 기능 활성화

## 11. 데이터베이스 다이어그램

이 스키마는 다음과 같은 주요 엔티티 간의 관계를 포함합니다:

- **users** ↔ **properties**: 1:N (한 사용자가 여러 매물 관리)
- **users** ↔ **customers**: 1:N (한 사용자가 여러 고객 관리)
- **customers** ↔ **properties**: 1:N (한 고객이 여러 매물에 관심)
- **properties** ↔ **property_history**: 1:N (한 매물에 여러 상태 변경 이력)
- **properties** ↔ **funnel_events**: 1:N (한 매물에 여러 퍼널 이벤트)
- **users** ↔ **performance_metrics**: 1:N (한 사용자에 대한 여러 성과 지표)
- **roles** ↔ **users**: 1:N (한 역할에 여러 사용자)