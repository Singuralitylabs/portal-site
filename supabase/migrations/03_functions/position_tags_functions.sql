-- position_tags 同期関数

-- ユーザーの役職タグを、指定した position ID の集合に一致させる（差分同期）
CREATE OR REPLACE FUNCTION sync_user_position_tags(
  p_user_id INTEGER,
  p_position_ids INTEGER[]
)
RETURNS INTEGER[]
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_position_ids INTEGER[];
  v_invalid_ids INTEGER[];
  v_result INTEGER[];
BEGIN
  -- 1. 権限確認（本人、またはアクティブな管理者・メンテナー）
  --    本人が役割を編集する権限は残している（今後、本人による編集を再び利用する可能性があるため）
  IF NOT (
    EXISTS (
      SELECT 1 FROM users
      WHERE
        id = p_user_id
        AND auth_id = auth.uid()
        AND status = 'active'
        AND is_deleted = FALSE
    )
    OR (is_active_user() AND is_content_manager())
  ) THEN
    RAISE EXCEPTION 'position_tags を更新する権限がありません (user_id=%)', p_user_id
      USING ERRCODE = '42501';
  END IF;

  -- 2. advisory lock で対象ユーザー単位で同期処理を直列化する（トランザクション終了時に解放）
  PERFORM pg_advisory_xact_lock(hashtext('position_tags'), p_user_id);

  -- 3. 入力配列から NULL と重複を除く（NULL の配列は空配列として扱う）
  SELECT COALESCE(array_agg(DISTINCT input.pid), '{}')
    INTO v_position_ids
    FROM unnest(COALESCE(p_position_ids, '{}')) AS input(pid)
    WHERE input.pid IS NOT NULL;

  -- 4. 新規に追加する ID が、未削除の positions に存在することを確認する
  --    すでに保持している ID は、論理削除済みの役職でも保持を許可する
  --    （プロフィール画面は保持中の ID を削除済みの役職も含めて送り返すため）
  SELECT array_agg(input.pid ORDER BY input.pid)
    INTO v_invalid_ids
    FROM unnest(v_position_ids) AS input(pid)
    WHERE
      NOT EXISTS (
        SELECT 1 FROM position_tags
        WHERE user_id = p_user_id AND position_id = input.pid
      )
      AND NOT EXISTS (
        SELECT 1 FROM positions
        WHERE id = input.pid AND is_deleted = FALSE
      );

  IF v_invalid_ids IS NOT NULL THEN
    RAISE EXCEPTION '存在しない、または削除済みの役職 ID が含まれています (user_id=%, position_ids=%)',
      p_user_id, v_invalid_ids
      USING ERRCODE = '22023';
  END IF;

  -- 5. 配列に含まれない既存行を削除する
  DELETE FROM position_tags
    WHERE user_id = p_user_id
      AND position_id <> ALL (v_position_ids);

  -- 6. 不足している行を挿入する
  INSERT INTO position_tags (user_id, position_id)
    SELECT p_user_id, input.pid FROM unnest(v_position_ids) AS input(pid)
    ON CONFLICT (user_id, position_id) DO NOTHING;

  -- 7. 同期後の position ID を昇順で返す
  SELECT COALESCE(array_agg(position_id ORDER BY position_id), '{}')
    INTO v_result
    FROM position_tags
    WHERE user_id = p_user_id;

  RETURN v_result;
END;
$$;

-- 実行権限は authenticated のみに付与する
REVOKE ALL ON FUNCTION sync_user_position_tags(INTEGER, INTEGER[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION sync_user_position_tags(INTEGER, INTEGER[]) FROM anon;
GRANT EXECUTE ON FUNCTION sync_user_position_tags(INTEGER, INTEGER[]) TO authenticated;
