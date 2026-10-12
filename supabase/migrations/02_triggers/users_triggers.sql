-- usersテーブルのupdated_at自動更新トリガー
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- role / status の書き換えを管理者操作に限定するトリガー関数
-- RLSは行単位の制御のためカラム単位の制限ができない。一般ユーザーが自身の行を
-- 更新できる以上、role / status の保護はトリガーで行う必要がある。
-- auth.uid() が NULL のコンテキスト（SQLエディタ・service_roleキー）はDB管理操作と
-- みなして対象外とする。初期管理者の設定はこの経路で行う。
-- 注: 本関数は is_active_user() / is_admin() を参照するため、
-- 03_functions/rls_helper_functions.sql を先に適用しておくこと
-- （未適用のままだと新規ユーザー登録と role/status を含むUPDATEが失敗する）。
CREATE OR REPLACE FUNCTION enforce_users_role_and_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- is_admin() は role のみを判定するため、承認済み・未削除の担保として
  -- is_active_user() と組み合わせる（否認済み管理者による自己復帰を防ぐ）
  IF auth.uid() IS NULL OR (is_active_user() AND is_admin()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- 明示指定があってもDEFAULTと同じ値に固定する（自己登録でのadmin/active指定を防止）
    NEW.role := 'member';
    NEW.status := 'pending';
  ELSE
    -- 一般ユーザーの更新では旧値を維持する（承認バイパス・権限昇格を防止）
    NEW.role := OLD.role;
    NEW.status := OLD.status;
  END IF;

  RETURN NEW;
END;
$$;

-- usersテーブルのrole/status保護トリガー
-- UPDATE は列指定（UPDATE OF）とし、role / status がSET句に含まれる場合のみ発火させる。
-- UPDATE文はSET句にないカラムを変更できないため、これで保護対象を取りこぼすことはない。
-- プロフィール更新やavatar_url更新では発火せず、不要なヘルパー関数の評価を避けられる。
DROP TRIGGER IF EXISTS enforce_users_role_and_status ON users;
CREATE TRIGGER enforce_users_role_and_status
BEFORE INSERT OR UPDATE OF role, status ON users
FOR EACH ROW
EXECUTE FUNCTION enforce_users_role_and_status();

