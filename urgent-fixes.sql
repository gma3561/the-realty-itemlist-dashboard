-- 1. manager_history 테이블 생성
CREATE TABLE IF NOT EXISTS manager_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  manager_id TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by TEXT,
  reason TEXT
);

CREATE INDEX idx_manager_history_property ON manager_history(property_id);
CREATE INDEX idx_manager_history_manager ON manager_history(manager_id);

-- 2. property_types 테이블을 string ID로 변경
DROP TABLE IF EXISTS property_types CASCADE;
CREATE TABLE property_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER
);

-- 3. transaction_types 테이블도 string ID로 변경  
DROP TABLE IF EXISTS transaction_types CASCADE;
CREATE TABLE transaction_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER
);

-- 4. property_statuses 테이블도 string ID로 변경
DROP TABLE IF EXISTS property_statuses CASCADE;
CREATE TABLE property_statuses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  display_order INTEGER
);

-- 5. properties 테이블 컬럼 타입 수정
ALTER TABLE properties 
  ALTER COLUMN property_type TYPE TEXT,
  ALTER COLUMN transaction_type TYPE TEXT,
  ALTER COLUMN property_status TYPE TEXT;