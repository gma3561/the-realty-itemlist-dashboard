-- 더부동산 통합 관리 시스템 룩업 테이블 초기 데이터

-- 1. 역할 데이터
INSERT INTO public.roles (id, name, permissions, description)
VALUES 
  ('admin', '관리자', '{"all": true}', '모든 권한을 가진 관리자'),
  ('employee', '직원', '{"view_own_properties": true, "manage_own_properties": true, "view_own_performance": true}', '자신의 매물만 관리할 수 있는 일반 직원')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  permissions = EXCLUDED.permissions, 
  description = EXCLUDED.description;

-- 2. 매물 유형
INSERT INTO public.property_types (id, name)
VALUES 
  ('apartment', '아파트'),
  ('officetel', '오피스텔'),
  ('villa', '빌라'),
  ('house', '단독주택'),
  ('commercial', '상가'),
  ('office', '사무실'),
  ('land', '토지'),
  ('factory', '공장/창고')
ON CONFLICT (name) DO NOTHING;

-- 3. 매물 상태
INSERT INTO public.property_statuses (id, name)
VALUES 
  ('available', '거래가능'),
  ('reserved', '거래보류'),
  ('completed', '거래완료'),
  ('expired', '만료'),
  ('hidden', '숨김')
ON CONFLICT (name) DO NOTHING;

-- 4. 거래 유형
INSERT INTO public.transaction_types (id, name)
VALUES 
  ('sale', '매매'),
  ('lease', '전세'),
  ('rent', '월세'),
  ('short_rent', '단기임대')
ON CONFLICT (name) DO NOTHING;

-- 5. 퍼널 단계
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

-- 6. 시스템 설정
INSERT INTO public.system_settings (id, name, value, description)
VALUES 
  ('general', '일반 설정', '{"company_name": "더부동산", "company_phone": "02-123-4567", "company_email": "admin@the-realty.co.kr"}', '시스템 일반 설정'),
  ('email', '이메일 설정', '{"notification_enabled": true, "daily_summary_enabled": true, "summary_time": "18:00"}', '이메일 알림 설정'),
  ('security', '보안 설정', '{"password_expiry_days": 90, "login_attempts": 5, "session_timeout_minutes": 30}', '보안 관련 설정')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  value = EXCLUDED.value, 
  description = EXCLUDED.description;