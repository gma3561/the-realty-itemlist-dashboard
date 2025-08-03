-- 더부동산 통합 관리 시스템 룩업 테이블 초기 데이터

-- 1. 역할 데이터
INSERT INTO public.roles (id, name, permissions, description)
VALUES 
  ('admin', '관리자', '{"all": true}', '모든 권한을 가진 관리자'),
  ('employee', '직원', '{"view_own_properties": true, "manage_own_properties": true, "view_own_performance": true}', '자신의 매물만 관리할 수 있는 일반 직원')
ON CONFLICT (id) DO NOTHING;

-- 2. 매물 유형이 없으면 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.property_types LIMIT 1) THEN
    INSERT INTO public.property_types (id, name)
    VALUES 
      (gen_random_uuid(), '아파트'),
      (gen_random_uuid(), '오피스텔'),
      (gen_random_uuid(), '빌라'),
      (gen_random_uuid(), '단독주택'),
      (gen_random_uuid(), '상가'),
      (gen_random_uuid(), '사무실'),
      (gen_random_uuid(), '토지'),
      (gen_random_uuid(), '공장/창고');
  END IF;
END $$;

-- 3. 매물 상태가 없으면 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.property_statuses LIMIT 1) THEN
    INSERT INTO public.property_statuses (id, name)
    VALUES 
      (gen_random_uuid(), '거래가능'),
      (gen_random_uuid(), '거래보류'),
      (gen_random_uuid(), '거래완료'),
      (gen_random_uuid(), '만료'),
      (gen_random_uuid(), '숨김');
  END IF;
END $$;

-- 4. 거래 유형이 없으면 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.transaction_types LIMIT 1) THEN
    INSERT INTO public.transaction_types (id, name)
    VALUES 
      (gen_random_uuid(), '매매'),
      (gen_random_uuid(), '전세'),
      (gen_random_uuid(), '월세'),
      (gen_random_uuid(), '단기임대');
  END IF;
END $$;

-- 5. 퍼널 단계
INSERT INTO public.funnel_stages (id, name, description, "order", color)
VALUES 
  ('inquiry', '문의', '초기 고객 문의 단계', 1, '#3B82F6'),
  ('consultation', '상담', '구체적인 상담 진행 단계', 2, '#10B981'),
  ('visit', '임장', '현장 방문 단계', 3, '#F59E0B'),
  ('negotiation', '협상', '가격 및 조건 협상 단계', 4, '#8B5CF6'),
  ('contract', '계약', '계약 체결 단계', 5, '#EF4444')
ON CONFLICT (id) DO NOTHING;

-- 6. 시스템 설정
INSERT INTO public.system_settings (id, name, value, description)
VALUES 
  ('general', '일반 설정', '{"company_name": "더부동산", "company_phone": "02-123-4567", "company_email": "admin@the-realty.co.kr"}', '시스템 일반 설정'),
  ('email', '이메일 설정', '{"notification_enabled": true, "daily_summary_enabled": true, "summary_time": "18:00"}', '이메일 알림 설정'),
  ('security', '보안 설정', '{"password_expiry_days": 90, "login_attempts": 5, "session_timeout_minutes": 30}', '보안 관련 설정')
ON CONFLICT (id) DO NOTHING;