-- 会員一覧・担当者表示向けの公開プロフィールビュー（issue #424）
--
-- users テーブルの列レベルPII（email / auth_id / role / status）を隠蔽するため、
-- 会員一覧・担当者選択・資料/動画/アプリの担当者名表示に必要な公開列のみを
-- 別ビューとして切り出す。
--
-- security_invoker = false（所有者権限で実行）にする理由:
--   一般会員は users テーブル本体を「本人行」しか読めない
--  （04_policies/users/02_restrict_active_users_read_all.sql）。
--   invoker 権限のままだと呼び出しユーザーの RLS がそのまま適用され、
--   会員一覧が本人1行しか返らなくなってしまう。
--   所有者権限で実行することで RLS をバイパスしつつ、下記 WHERE 句と
--   is_active_user() のガードにより「承認済み会員が公開列のみを閲覧できる」
--   という意図した挙動に限定する。
--   Supabase の security lint はこの構成を `security_definer_view` として
--   警告するが、ビュー内のガードと anon への REVOKE により実質的な
--   RLS 迂回は発生しない（詳細は Wiki のナレッジ共有ページを参照）。
CREATE OR REPLACE VIEW member_profiles
WITH (security_invoker = false)
AS
SELECT
  id,
  display_name,
  bio,
  avatar_url,
  profile_image_path,
  x_url,
  facebook_url,
  instagram_url,
  github_url,
  portfolio_url
FROM users
WHERE status = 'active'
  AND is_deleted = FALSE
  AND is_active_user();

-- anon には公開しない（未承認の匿名アクセスから会員一覧を隠す）
REVOKE ALL ON member_profiles FROM PUBLIC;
REVOKE ALL ON member_profiles FROM anon;
GRANT SELECT ON member_profiles TO authenticated;
