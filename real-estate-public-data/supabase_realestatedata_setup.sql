-- 부동산 실거래가 데이터 수집을 위한 테이블 생성
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

-- 1. 부동산 실거래 데이터 테이블
CREATE TABLE IF NOT EXISTS real_estate_transactions (
    id BIGSERIAL PRIMARY KEY,
    area_name TEXT NOT NULL,           -- 지역명 (예: 강남구 역삼동)
    area_code TEXT NOT NULL,           -- 지역코드 (법정동 코드)
    apartment_name TEXT NOT NULL,      -- 아파트명
    transaction_amount BIGINT NOT NULL, -- 거래금액 (만원)
    build_year INTEGER,                -- 건축년도
    transaction_year INTEGER NOT NULL, -- 거래년도
    transaction_month INTEGER NOT NULL,-- 거래월
    transaction_day INTEGER NOT NULL,  -- 거래일
    exclusive_area DECIMAL(10,2),      -- 전용면적 (㎡)
    legal_dong TEXT,                   -- 법정동
    jibun TEXT,                        -- 지번
    floor INTEGER,                     -- 층
    collected_at TIMESTAMPTZ DEFAULT NOW(), -- 수집 시각
    updated_at TIMESTAMPTZ DEFAULT NOW(),   -- 업데이트 시각
    
    -- 중복 방지를 위한 복합 인덱스
    CONSTRAINT unique_transaction UNIQUE (area_code, apartment_name, transaction_year, transaction_month, transaction_day, jibun)
);

-- 2. 데이터 수집 로그 테이블
CREATE TABLE IF NOT EXISTS collection_logs (
    id BIGSERIAL PRIMARY KEY,
    collected_count INTEGER NOT NULL DEFAULT 0, -- 수집된 데이터 건수
    duration_ms BIGINT NOT NULL DEFAULT 0,      -- 수집 소요시간 (밀리초)
    collected_at TIMESTAMPTZ DEFAULT NOW(),     -- 수집 시각
    status TEXT DEFAULT 'success',              -- 수집 상태 (success, error)
    error_message TEXT,                         -- 에러 메시지 (있는 경우)
    notes TEXT                                  -- 추가 메모
);

-- 3. 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_real_estate_area_code ON real_estate_transactions(area_code);
CREATE INDEX IF NOT EXISTS idx_real_estate_transaction_date ON real_estate_transactions(transaction_year, transaction_month);
CREATE INDEX IF NOT EXISTS idx_real_estate_apartment_name ON real_estate_transactions(apartment_name);
CREATE INDEX IF NOT EXISTS idx_real_estate_transaction_amount ON real_estate_transactions(transaction_amount);
CREATE INDEX IF NOT EXISTS idx_real_estate_collected_at ON real_estate_transactions(collected_at);
CREATE INDEX IF NOT EXISTS idx_collection_logs_collected_at ON collection_logs(collected_at);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE real_estate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기 권한 부여
CREATE POLICY "Allow read access for all users" ON real_estate_transactions
    FOR SELECT USING (true);

CREATE POLICY "Allow read access for logs" ON collection_logs
    FOR SELECT USING (true);

-- 인증된 사용자에게 쓰기 권한 부여
CREATE POLICY "Allow insert for authenticated users" ON real_estate_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON real_estate_transactions
    FOR UPDATE USING (true);

CREATE POLICY "Allow insert for logs" ON collection_logs
    FOR INSERT WITH CHECK (true);

-- 5. 업데이트 시각 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 생성
CREATE TRIGGER update_real_estate_transactions_updated_at 
    BEFORE UPDATE ON real_estate_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 데이터 정리를 위한 함수 (6개월 이상 된 중복 데이터 제거)
CREATE OR REPLACE FUNCTION cleanup_old_duplicate_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 같은 거래에 대해 여러 수집 기록이 있는 경우, 가장 최신 것만 유지
    WITH duplicate_transactions AS (
        SELECT 
            area_code, apartment_name, transaction_year, transaction_month, transaction_day, jibun,
            MAX(collected_at) as latest_collected_at
        FROM real_estate_transactions
        WHERE collected_at < NOW() - INTERVAL '6 months'
        GROUP BY area_code, apartment_name, transaction_year, transaction_month, transaction_day, jibun
        HAVING COUNT(*) > 1
    )
    DELETE FROM real_estate_transactions ret
    WHERE EXISTS (
        SELECT 1 FROM duplicate_transactions dt
        WHERE ret.area_code = dt.area_code
        AND ret.apartment_name = dt.apartment_name
        AND ret.transaction_year = dt.transaction_year
        AND ret.transaction_month = dt.transaction_month
        AND ret.transaction_day = dt.transaction_day
        AND ret.jibun = dt.jibun
        AND ret.collected_at < dt.latest_collected_at
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 로그 기록
    INSERT INTO collection_logs (collected_count, duration_ms, status, notes)
    VALUES (0, 0, 'cleanup', CONCAT('중복 데이터 ', deleted_count, '건 정리 완료'));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. 월별 통계 뷰 생성
CREATE OR REPLACE VIEW monthly_transaction_stats AS
SELECT 
    area_name,
    transaction_year,
    transaction_month,
    COUNT(*) as transaction_count,
    AVG(transaction_amount) as avg_amount,
    MIN(transaction_amount) as min_amount,
    MAX(transaction_amount) as max_amount,
    AVG(exclusive_area) as avg_area
FROM real_estate_transactions
GROUP BY area_name, transaction_year, transaction_month
ORDER BY transaction_year DESC, transaction_month DESC;

-- 9. 아파트별 최신 거래 정보 뷰
CREATE OR REPLACE VIEW latest_apartment_transactions AS
SELECT DISTINCT ON (area_code, apartment_name)
    area_name,
    area_code,
    apartment_name,
    transaction_amount,
    build_year,
    transaction_year,
    transaction_month,
    transaction_day,
    exclusive_area,
    legal_dong,
    jibun,
    floor,
    collected_at
FROM real_estate_transactions
ORDER BY area_code, apartment_name, transaction_year DESC, transaction_month DESC, transaction_day DESC;

-- 설정 완료 메시지
SELECT 'Supabase 부동산 데이터 수집 테이블 설정이 완료되었습니다!' as message;