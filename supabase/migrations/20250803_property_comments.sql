-- property_comments 테이블 생성
CREATE TABLE IF NOT EXISTS property_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_property_comments_property_id ON property_comments(property_id);
CREATE INDEX idx_property_comments_user_id ON property_comments(user_id);
CREATE INDEX idx_property_comments_created_at ON property_comments(created_at DESC);

-- RLS 정책 활성화
ALTER TABLE property_comments ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 코멘트 읽기 가능
CREATE POLICY "누구나 코멘트 읽기 가능" ON property_comments
  FOR SELECT
  USING (true);

-- RLS 정책: 로그인한 사용자만 코멘트 작성 가능
CREATE POLICY "로그인 사용자만 코멘트 작성" ON property_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS 정책: 본인이 작성한 코멘트만 수정 가능
CREATE POLICY "본인 코멘트만 수정" ON property_comments
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- RLS 정책: 본인이 작성한 코멘트만 삭제 가능
CREATE POLICY "본인 코멘트만 삭제" ON property_comments
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_comments_updated_at BEFORE UPDATE
  ON property_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();