-- 기존 매물 테이블 정책 삭제 및 새로운 권한 기반 정책 생성
DROP POLICY IF EXISTS "인증된 사용자만 접근 가능" ON public.properties;

-- 매물 조회 정책: 관리자는 모든 매물, 일반 사용자는 본인 매물만
CREATE POLICY "매물 조회 권한" ON public.properties
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 매물 조회 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인 매물만 조회 가능
      (
        manager_id = auth.uid() OR
        user_id = auth.uid()
      )
    )
  );

-- 매물 생성 정책: 인증된 모든 사용자 가능 (자동으로 본인을 담당자로 설정)
CREATE POLICY "매물 생성 권한" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      manager_id = auth.uid() OR user_id = auth.uid()
    )
  );

-- 매물 수정 정책: 관리자는 모든 매물, 일반 사용자는 본인 매물만
CREATE POLICY "매물 수정 권한" ON public.properties
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 매물 수정 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인 매물만 수정 가능
      (
        manager_id = auth.uid() OR
        user_id = auth.uid()
      )
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 매물 수정 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인 매물만 수정 가능
      (
        manager_id = auth.uid() OR
        user_id = auth.uid()
      )
    )
  );

-- 매물 삭제 정책: 관리자는 모든 매물, 일반 사용자는 본인 매물만
CREATE POLICY "매물 삭제 권한" ON public.properties
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 매물 삭제 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인 매물만 삭제 가능
      (
        manager_id = auth.uid() OR
        user_id = auth.uid()
      )
    )
  );

-- 사용자 테이블에 대한 정책 개선
DROP POLICY IF EXISTS "인증된 사용자만 접근 가능" ON public.users;
DROP POLICY IF EXISTS "자신의 정보만 업데이트 가능" ON public.users;

-- 사용자 조회 정책: 관리자는 모든 사용자, 일반 사용자는 본인 정보만
CREATE POLICY "사용자 조회 권한" ON public.users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 사용자 조회 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인 정보만 조회 가능
      id = auth.uid()
    )
  );

-- 사용자 생성 정책: 관리자만 가능
CREATE POLICY "사용자 생성 권한" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 사용자 수정 정책: 관리자는 모든 사용자, 일반 사용자는 본인 정보만
CREATE POLICY "사용자 수정 권한" ON public.users
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 사용자 수정 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인 정보만 수정 가능
      id = auth.uid()
    )
  ) WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 사용자 수정 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인 정보만 수정 가능 (단, 역할 변경 불가)
      (id = auth.uid() AND role = OLD.role)
    )
  );

-- 사용자 삭제 정책: 관리자만 가능
CREATE POLICY "사용자 삭제 권한" ON public.users
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 고객 테이블 RLS 정책 (확장 스키마가 있는 경우)
-- ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "고객 조회 권한" ON public.customers
--   FOR SELECT USING (
--     auth.uid() IS NOT NULL AND (
--       -- 관리자는 모든 고객 조회 가능
--       EXISTS (
--         SELECT 1 FROM public.users 
--         WHERE id = auth.uid() AND role = 'admin'
--       ) OR
--       -- 일반 사용자는 본인 담당 고객만 조회 가능
--       user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "고객 생성 권한" ON public.customers
--   FOR INSERT WITH CHECK (
--     auth.uid() IS NOT NULL AND (
--       user_id = auth.uid() OR user_id IS NULL
--     )
--   );

-- CREATE POLICY "고객 수정 권한" ON public.customers
--   FOR UPDATE USING (
--     auth.uid() IS NOT NULL AND (
--       -- 관리자는 모든 고객 수정 가능
--       EXISTS (
--         SELECT 1 FROM public.users 
--         WHERE id = auth.uid() AND role = 'admin'
--       ) OR
--       -- 일반 사용자는 본인 담당 고객만 수정 가능
--       user_id = auth.uid()
--     )
--   );

-- CREATE POLICY "고객 삭제 권한" ON public.customers
--   FOR DELETE USING (
--     auth.uid() IS NOT NULL AND (
--       -- 관리자는 모든 고객 삭제 가능
--       EXISTS (
--         SELECT 1 FROM public.users 
--         WHERE id = auth.uid() AND role = 'admin'
--       ) OR
--       -- 일반 사용자는 본인 담당 고객만 삭제 가능
--       user_id = auth.uid()
--     )
--   );

-- 성과 분석 관련 테이블 RLS 정책
-- ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "성과 데이터 조회 권한" ON public.performance_metrics
--   FOR SELECT USING (
--     auth.uid() IS NOT NULL AND (
--       -- 관리자는 모든 성과 데이터 조회 가능
--       EXISTS (
--         SELECT 1 FROM public.users 
--         WHERE id = auth.uid() AND role = 'admin'
--       ) OR
--       -- 일반 사용자는 본인 성과 데이터만 조회 가능
--       user_id = auth.uid()
--     )
--   );

-- 매물 이력 테이블 정책
CREATE POLICY "매물 이력 조회 권한" ON public.manager_history
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- 관리자는 모든 이력 조회 가능
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      ) OR
      -- 일반 사용자는 본인과 관련된 이력만 조회 가능
      (
        previous_manager_id = auth.uid() OR
        new_manager_id = auth.uid() OR
        changed_by = auth.uid()
      )
    )
  );

-- 함수: 현재 사용자의 역할 확인
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 사용자가 특정 매물에 대한 권한이 있는지 확인
CREATE OR REPLACE FUNCTION public.user_has_property_access(property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = property_id AND (
        u.role = 'admin' OR 
        p.manager_id = auth.uid() OR 
        p.user_id = auth.uid()
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 매물 생성 시 자동으로 담당자를 현재 사용자로 설정하는 트리거
CREATE OR REPLACE FUNCTION public.set_property_manager()
RETURNS TRIGGER AS $$
BEGIN
  -- manager_id가 설정되지 않은 경우 현재 사용자로 설정
  IF NEW.manager_id IS NULL THEN
    NEW.manager_id = auth.uid();
  END IF;
  
  -- user_id가 설정되지 않은 경우 현재 사용자로 설정
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 매물 테이블에 트리거 설정
DROP TRIGGER IF EXISTS trg_set_property_manager ON public.properties;
CREATE TRIGGER trg_set_property_manager
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_property_manager();

-- 권한 검사를 위한 뷰 생성
CREATE OR REPLACE VIEW public.user_permissions AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  CASE 
    WHEN u.role = 'admin' THEN true 
    ELSE false 
  END AS can_view_all_properties,
  CASE 
    WHEN u.role = 'admin' THEN true 
    ELSE false 
  END AS can_manage_users,
  CASE 
    WHEN u.role = 'admin' THEN true 
    ELSE false 
  END AS can_view_all_performance
FROM public.users u;

-- 사용자별 매물 통계 뷰 (권한 기반)
CREATE OR REPLACE VIEW public.user_property_stats AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  u.role,
  COUNT(p.id) as total_properties,
  COUNT(CASE WHEN ps.name = '거래완료' THEN 1 END) as completed_properties,
  COUNT(CASE WHEN ps.name = '거래가능' THEN 1 END) as available_properties
FROM public.users u
LEFT JOIN public.properties p ON (
  CASE 
    WHEN u.role = 'admin' THEN true
    ELSE (p.manager_id = u.id OR p.user_id = u.id)
  END
)
LEFT JOIN public.property_statuses ps ON p.property_status_id = ps.id
GROUP BY u.id, u.name, u.email, u.role;

-- 코멘트 추가
COMMENT ON POLICY "매물 조회 권한" ON public.properties IS 
'관리자는 모든 매물을 조회할 수 있고, 일반 사용자는 본인이 담당하는 매물만 조회할 수 있습니다.';

COMMENT ON POLICY "매물 수정 권한" ON public.properties IS 
'관리자는 모든 매물을 수정할 수 있고, 일반 사용자는 본인이 담당하는 매물만 수정할 수 있습니다.';

COMMENT ON POLICY "매물 삭제 권한" ON public.properties IS 
'관리자는 모든 매물을 삭제할 수 있고, 일반 사용자는 본인이 담당하는 매물만 삭제할 수 있습니다.';

COMMENT ON FUNCTION public.get_current_user_role() IS 
'현재 인증된 사용자의 역할(role)을 반환합니다.';

COMMENT ON FUNCTION public.user_has_property_access(UUID) IS 
'특정 매물에 대해 현재 사용자가 접근 권한을 가지고 있는지 확인합니다.';