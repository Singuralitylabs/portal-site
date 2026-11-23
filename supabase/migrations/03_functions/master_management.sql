BEGIN;

CREATE OR REPLACE FUNCTION public.master_category_preview(category_id bigint)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  snapshot jsonb;
BEGIN
  IF NOT (is_active_user() AND is_content_manager()) THEN
    RAISE EXCEPTION '操作権限がありません。';
  END IF;
  SELECT jsonb_build_object(
    'category', to_jsonb(categories),
    'contents', COALESCE((SELECT jsonb_agg(items ORDER BY items->>'table', (items->>'id')::bigint)
      FROM (
        SELECT jsonb_build_object('table', 'documents', 'id', id, 'name', name, 'is_deleted', is_deleted, 'updated_at', updated_at) AS items FROM documents WHERE documents.category_id = $1
        UNION ALL
        SELECT jsonb_build_object('table', 'videos', 'id', id, 'name', name, 'is_deleted', is_deleted, 'updated_at', updated_at) FROM videos WHERE videos.category_id = $1
        UNION ALL
        SELECT jsonb_build_object('table', 'applications', 'id', id, 'name', name, 'is_deleted', is_deleted, 'updated_at', updated_at) FROM applications WHERE applications.category_id = $1
      ) AS linked), '[]'::jsonb)
  ) INTO snapshot FROM categories WHERE id = $1 AND NOT is_deleted;
  IF snapshot IS NULL THEN RAISE EXCEPTION 'カテゴリーが見つかりません。'; END IF;
  RETURN snapshot || jsonb_build_object('token', md5(snapshot::text));
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_master_writes()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(420, 1);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_master_integrity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  actor_id bigint;
  category_row categories;
  position_row positions;
BEGIN
  IF TG_TABLE_NAME = 'position_tags' THEN
    SELECT * INTO position_row FROM positions WHERE id = NEW.position_id FOR UPDATE;
    IF NOT FOUND OR position_row.is_deleted THEN
      RAISE EXCEPTION '削除済みの役職には割り当てできません。';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'ID・作成日時は変更できません。';
    END IF;
  END IF;
  IF TG_TABLE_NAME IN ('documents', 'videos', 'applications') THEN
    SELECT * INTO category_row FROM categories WHERE id = NEW.category_id FOR UPDATE;
    IF NOT FOUND OR category_row.is_deleted OR category_row.category_type <> TG_TABLE_NAME THEN
      RAISE EXCEPTION '有効な同種別のカテゴリーを指定してください。';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION '作成者は変更できません。';
    END IF;
    SELECT id INTO actor_id FROM users WHERE auth_id = auth.uid() AND status = 'active' AND NOT is_deleted;
    IF actor_id IS NOT NULL THEN
      IF TG_OP = 'INSERT' THEN NEW.created_by := actor_id; END IF;
      NEW.updated_by := actor_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'categories' THEN
    IF TG_OP = 'UPDATE' THEN
      IF OLD.name = '未分類' AND (NEW.name <> OLD.name OR NEW.category_type <> OLD.category_type OR NEW.is_deleted) THEN
        RAISE EXCEPTION '未分類カテゴリーは名称・種別の変更および削除ができません。';
      END IF;
      IF NEW.category_type <> OLD.category_type OR (NEW.is_deleted AND NOT OLD.is_deleted) THEN
        IF EXISTS (SELECT 1 FROM documents WHERE category_id = OLD.id)
          OR EXISTS (SELECT 1 FROM videos WHERE category_id = OLD.id)
          OR EXISTS (SELECT 1 FROM applications WHERE category_id = OLD.id) THEN
          RAISE EXCEPTION '参照されているカテゴリーの種別変更・直接削除はできません。';
        END IF;
      END IF;
    END IF;
    IF NEW.name = '未分類' AND EXISTS (
      SELECT 1 FROM categories WHERE category_type = NEW.category_type AND name = '未分類' AND NOT is_deleted AND id <> NEW.id
    ) THEN RAISE EXCEPTION '未分類カテゴリーは重複作成できません。'; END IF;
  ELSIF TG_TABLE_NAME = 'positions' AND TG_OP = 'UPDATE' THEN
    IF NEW.is_deleted AND NOT OLD.is_deleted AND (OLD.is_leadership OR EXISTS (SELECT 1 FROM position_tags WHERE position_id = OLD.id)) THEN
      RAISE EXCEPTION '幹部または使用中の役職は削除できません。';
    END IF;
    IF NEW.is_leadership IS DISTINCT FROM OLD.is_leadership AND EXISTS (SELECT 1 FROM position_tags WHERE position_id = OLD.id) THEN
      RAISE EXCEPTION '使用中の役職の幹部フラグは変更できません。';
    END IF;
    IF OLD.is_deleted THEN RAISE EXCEPTION '削除済みの役職は変更できません。'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['documents','videos','applications','categories','positions','position_tags'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS lock_master_writes ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER lock_master_writes BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.lock_master_writes()', table_name);
    EXECUTE format('DROP TRIGGER IF EXISTS guard_master_integrity ON public.%I', table_name);
    EXECUTE format('CREATE TRIGGER guard_master_integrity BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_master_integrity()', table_name);
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS update_positions_updated_at ON public.positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.mutate_master_record(
  table_name text,
  operation text,
  record_id bigint DEFAULT NULL,
  fields jsonb DEFAULT '{}'::jsonb,
  placement jsonb DEFAULT '{"type":"last"}'::jsonb,
  confirmation_token text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  current_record jsonb;
  new_record jsonb;
  allowed_columns text[];
  column_names text;
  selected_columns text;
  field_name text;
  group_column text;
  old_group text;
  new_group text;
  group_filter text;
  target_order integer;
  after_order integer;
  result_id bigint;
  destination_id bigint;
  actor_id bigint;
  preview jsonb;
  content_table text;
BEGIN
  IF table_name NOT IN ('documents','videos','applications','categories','positions') OR table_name IS NULL
    OR operation NOT IN ('create','update','delete','restore') OR operation IS NULL THEN
    RAISE EXCEPTION '対象または操作が不正です。';
  END IF;
  IF NOT (is_active_user() AND is_content_manager()) THEN RAISE EXCEPTION '操作権限がありません。'; END IF;
  PERFORM pg_advisory_xact_lock(420, 1);
  SELECT id INTO actor_id FROM users WHERE auth_id = auth.uid() AND status = 'active' AND NOT is_deleted;
  IF operation = 'restore' AND table_name = 'positions' THEN RAISE EXCEPTION '役職は復元できません。'; END IF;
  IF operation <> 'create' THEN
    EXECUTE format('SELECT to_jsonb(target) FROM public.%I target WHERE id = $1 FOR UPDATE', table_name) INTO current_record USING record_id;
    IF current_record IS NULL THEN RAISE EXCEPTION '対象レコードが見つかりません。'; END IF;
    IF (current_record->>'is_deleted')::boolean <> (operation = 'restore') THEN RAISE EXCEPTION '削除状態が変更されています。再取得してください。'; END IF;
  END IF;
  IF table_name = 'categories' AND operation IN ('update','delete') THEN
    preview := master_category_preview(record_id);
    IF confirmation_token IS DISTINCT FROM preview->>'token' THEN RAISE EXCEPTION '参照状況が変更されています。再確認してください。'; END IF;
    IF operation = 'delete' THEN
      IF current_record->>'name' = '未分類' THEN RAISE EXCEPTION '未分類カテゴリーは削除できません。'; END IF;
      SELECT id INTO STRICT destination_id FROM categories WHERE category_type = current_record->>'category_type' AND name = '未分類' AND NOT is_deleted;
      content_table := current_record->>'category_type';
      EXECUTE format('UPDATE public.%I SET category_id = $1, display_order = display_order + COALESCE((SELECT max(display_order) FROM public.%I WHERE category_id = $1 AND NOT is_deleted),0) WHERE category_id = $2', content_table, content_table) USING destination_id, record_id;
      EXECUTE format('WITH ordered AS (SELECT id, row_number() OVER (ORDER BY display_order, id) AS ordinal FROM public.%I WHERE category_id = $1 AND NOT is_deleted) UPDATE public.%I target SET display_order = ordered.ordinal FROM ordered WHERE target.id = ordered.id AND target.display_order <> ordered.ordinal', content_table, content_table) USING destination_id;
    END IF;
  END IF;
  allowed_columns := ARRAY['name','description'];
  IF table_name = 'categories' THEN allowed_columns := allowed_columns || ARRAY['category_type'];
  ELSIF table_name = 'positions' THEN allowed_columns := allowed_columns || ARRAY['is_leadership'];
  ELSE
    allowed_columns := allowed_columns || ARRAY['url','category_id'];
    IF table_name = 'applications' THEN allowed_columns := allowed_columns || ARRAY['developer_id','thumbnail_path'];
    ELSE allowed_columns := allowed_columns || ARRAY['assignee_id']; END IF;
    IF table_name = 'videos' THEN allowed_columns := allowed_columns || ARRAY['thumbnail_path','thumbnail_time','length']; END IF;
  END IF;
  IF jsonb_typeof(fields) <> 'object' OR fields IS NULL THEN RAISE EXCEPTION '入力が不正です。'; END IF;
  FOR field_name IN SELECT jsonb_object_keys(fields) LOOP
    IF NOT (field_name = ANY(allowed_columns)) THEN RAISE EXCEPTION '編集できない項目です: %', field_name; END IF;
  END LOOP;
  IF operation IN ('create','update') THEN
    new_record := COALESCE(current_record, '{}'::jsonb) || fields;
    IF length(btrim(COALESCE(new_record->>'name',''))) = 0 THEN RAISE EXCEPTION '名称は必須です。'; END IF;
  ELSE fields := '{}'::jsonb; END IF;
  group_column := CASE WHEN table_name = 'categories' THEN 'category_type' WHEN table_name = 'positions' THEN NULL ELSE 'category_id' END;
  old_group := current_record->>group_column;
  new_group := COALESCE(new_record->>group_column, old_group);
  group_filter := CASE WHEN group_column IS NULL THEN 'true' ELSE format('%I::text = $1', group_column) END;
  IF operation = 'delete' THEN
    fields := jsonb_build_object('is_deleted', true);
  ELSE
    IF operation = 'restore' THEN placement := '{"type":"last"}'::jsonb; fields := jsonb_build_object('is_deleted',false); END IF;
    IF placement IS NULL OR placement->>'type' IS NULL OR placement->>'type' NOT IN ('first','last','current','after') THEN RAISE EXCEPTION '配置位置が不正です。'; END IF;
    IF placement->>'type' = 'current' THEN
      IF operation <> 'update' OR old_group IS DISTINCT FROM new_group THEN RAISE EXCEPTION 'グループ変更時は配置位置を指定してください。'; END IF;
      target_order := (current_record->>'display_order')::integer;
    ELSE
      IF placement->>'type' = 'first' THEN target_order := 1;
      ELSIF placement->>'type' = 'after' THEN
        EXECUTE format('SELECT display_order FROM public.%I WHERE %s AND id = $2 AND NOT is_deleted AND id IS DISTINCT FROM $3', table_name, group_filter) INTO after_order USING new_group, (placement->>'afterId')::bigint, record_id;
        IF after_order IS NULL THEN RAISE EXCEPTION '配置先が見つかりません。'; END IF;
        target_order := after_order + 1;
      ELSE
        EXECUTE format('SELECT COALESCE(max(display_order),0)+1 FROM public.%I WHERE %s AND NOT is_deleted', table_name, group_filter) INTO target_order USING new_group;
      END IF;
      EXECUTE format('UPDATE public.%I SET display_order = display_order + 1 WHERE %s AND NOT is_deleted AND display_order >= $2 AND id IS DISTINCT FROM $3', table_name, group_filter) USING new_group, target_order, record_id;
    END IF;
    fields := fields || jsonb_build_object('display_order',target_order);
  END IF;
  IF table_name IN ('documents','videos','applications') THEN
    fields := fields || jsonb_build_object('updated_by', actor_id);
    IF operation = 'create' THEN fields := fields || jsonb_build_object('created_by',actor_id); END IF;
  END IF;
  SELECT string_agg(format('%I', key), ',' ORDER BY key), string_agg(format('source.%I', key), ',' ORDER BY key)
    INTO column_names, selected_columns FROM jsonb_object_keys(fields) AS key;
  IF operation = 'create' THEN
    EXECUTE format('INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) source RETURNING id', table_name,column_names,selected_columns,table_name) INTO result_id USING fields;
  ELSE
    EXECUTE format('UPDATE public.%I SET (%s) = (SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) source) WHERE id = $2 RETURNING id',table_name,column_names,selected_columns,table_name) INTO result_id USING fields,record_id;
  END IF;
  IF result_id IS NULL THEN RAISE EXCEPTION '操作対象が見つからないか権限がありません。'; END IF;
  EXECUTE format('WITH ordered AS (SELECT id,row_number() OVER (%s ORDER BY display_order, CASE WHEN id = $2 THEN 0 ELSE 1 END,id) AS ordinal FROM public.%I WHERE NOT is_deleted AND (%s OR %s)) UPDATE public.%I target SET display_order = ordered.ordinal FROM ordered WHERE target.id = ordered.id AND target.display_order <> ordered.ordinal',
    CASE WHEN group_column IS NULL THEN '' ELSE format('PARTITION BY %I',group_column) END,
    table_name, CASE WHEN group_column IS NULL THEN 'true' ELSE format('%I::text = $1',group_column) END,
    CASE WHEN group_column IS NULL THEN 'true' ELSE format('%I::text = $3',group_column) END,table_name)
    USING new_group,result_id,old_group;
  RETURN result_id;
END;
$$;

REVOKE ALL ON FUNCTION public.master_category_preview(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_category_preview(bigint) TO authenticated;
REVOKE ALL ON FUNCTION public.mutate_master_record(text,text,bigint,jsonb,jsonb,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mutate_master_record(text,text,bigint,jsonb,jsonb,text) TO authenticated;

COMMIT;