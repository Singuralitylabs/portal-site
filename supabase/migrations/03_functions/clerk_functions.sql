-- 関数作成

-- クライアントからClerk IDを設定するための関数
CREATE OR REPLACE FUNCTION set_clerk_user_id(clerk_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.clerk_user_id', clerk_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- セッション変数からClerk IDを取得する関数
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.clerk_user_id', true);
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clerk IDがusersテーブルに存在し、削除されていないか、承認済みであるかをチェックする関数
CREATE OR REPLACE FUNCTION is_registered_user()
RETURNS BOOLEAN AS $$
DECLARE
  current_clerk_id TEXT;
BEGIN
  current_clerk_id := get_clerk_user_id();
  
  IF current_clerk_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE 
      clerk_id = current_clerk_id
  );
EXCEPTION
  WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
