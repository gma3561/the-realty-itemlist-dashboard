-- 매물 상태 변경 이력 테이블 생성
CREATE TABLE IF NOT EXISTS property_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(255) NOT NULL, -- manager_id와 동일한 형식
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_status_history_property ON property_status_history(property_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON property_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_by ON property_status_history(changed_by);

-- RLS 정책
ALTER TABLE property_status_history ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 이력을 볼 수 있음
CREATE POLICY "Anyone can view status history" ON property_status_history
  FOR SELECT USING (true);

-- 인증된 사용자만 이력 추가 가능
CREATE POLICY "Authenticated users can insert history" ON property_status_history
  FOR INSERT WITH CHECK (true);

-- 트리거 함수: 매물 상태 변경 시 자동으로 이력 생성
CREATE OR REPLACE FUNCTION log_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- property_status가 변경된 경우
  IF OLD.property_status IS DISTINCT FROM NEW.property_status THEN
    INSERT INTO property_status_history (
      property_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.property_status,
      NEW.property_status,
      COALESCE(NEW.manager_id, 'system')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS property_status_change_trigger ON properties;
CREATE TRIGGER property_status_change_trigger
  AFTER UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION log_property_status_change();

-- 초기 데이터 마이그레이션 (기존 매물의 현재 상태를 이력으로 추가)
INSERT INTO property_status_history (property_id, new_status, changed_by, changed_at)
SELECT 
  id,
  property_status,
  COALESCE(manager_id, 'system'),
  created_at
FROM properties
WHERE NOT EXISTS (
  SELECT 1 FROM property_status_history 
  WHERE property_id = properties.id
);

-- 이번 주 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW weekly_status_changes AS
SELECT 
  date_trunc('week', changed_at) as week_start,
  new_status,
  COUNT(*) as change_count,
  COUNT(DISTINCT changed_by) as unique_users
FROM property_status_history
WHERE changed_at >= date_trunc('week', CURRENT_DATE)
GROUP BY date_trunc('week', changed_at), new_status;

-- 최근 활동 피드를 위한 뷰
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
  h.id,
  h.changed_at,
  h.changed_by,
  h.old_status,
  h.new_status,
  h.reason,
  p.property_name as property_name,
  p.location as property_address,
  CASE 
    WHEN h.changed_by LIKE '%@%' THEN h.changed_by
    ELSE u.name
  END as changed_by_name
FROM property_status_history h
JOIN properties p ON h.property_id = p.id
LEFT JOIN users u ON h.changed_by = u.id::text OR h.changed_by = u.email
WHERE h.changed_at >= NOW() - INTERVAL '24 hours'
ORDER BY h.changed_at DESC
LIMIT 50;