-- RLSポリシー共通ヘルパー関数

-- 現在のユーザーがアクティブかつ未削除のメンバーかを判定する
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE
      auth_id = auth.uid()
      AND status = 'active'
      AND is_deleted = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 現在のユーザーがadminまたはmaintainerロールを持つかを判定する
CREATE OR REPLACE FUNCTION is_content_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE
      auth_id = auth.uid()
      AND role IN ('admin', 'maintainer')
      AND status = 'active'
      AND is_deleted = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
