-- RLSポリシー共通ヘルパー関数

-- 現在のユーザーがアクティブかつ未削除のユーザーかを判定する
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE
      auth_id = auth.uid()
      AND status = 'active'
      AND is_deleted = FALSE
  );
END;
$$;

-- 現在のユーザーがadminまたはmaintainerロールを持つかを判定する
CREATE OR REPLACE FUNCTION is_content_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE
      auth_id = auth.uid()
      AND role IN ('admin', 'maintainer')
  );
END;
$$;

