-- usersテーブルの行レベル露出を管理者限定に縮小する（issue #424）
--
-- active_users_can_read_all は「承認済み会員なら他の全会員行（email/auth_id/role/status含む）を
-- 閲覧できる」ポリシーであり、列レベルPII露出（issue #424）の原因になっていた。
-- 会員一覧・担当者選択など、他会員を参照する正規の用途は公開列のみの member_profiles ビュー
-- （06_views/member_profiles/00_create_member_profiles_view.sql）に置き換えるため、
-- users テーブル本体への直接アクセスは「本人行」（users_can_read_own_data）と
-- 「管理者」に限定する。
--
-- 副作用: これにより pending/rejected 行も非管理者からは見えなくなるため、
-- dashboard/page.tsx が認可チェック前に fetchApprovalUsers() を実行しても
-- 非管理者には 0 件が返る（DB層での多層防御）。

DROP POLICY IF EXISTS "active_users_can_read_all" ON "users";
DROP POLICY IF EXISTS "admins_can_read_all_users" ON "users";
CREATE POLICY "admins_can_read_all_users" ON "users"
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_active_user())
    AND (SELECT is_admin())
    AND is_deleted = FALSE
  );
