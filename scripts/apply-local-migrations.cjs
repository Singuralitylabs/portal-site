const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// supabase/migrations は「番号順にSupabaseのSQLエディタで手動実行する」運用のため、
// フォルダ名の辞書順では一部の外部キー・関数参照の順序を満たせない
// （例: applications はcategories/usersより辞書順で先に来るが、それらを参照する）。
// そのため実際に依存関係を満たす順序をここに明示する。
// 新しいマイグレーションファイルを追加した場合は、このリストにも追記すること。
const MIGRATIONS_ROOT = path.join("supabase", "migrations");

const ORDERED_RELATIVE_PATHS = [
  // 01_tables: FK依存を満たす順（users/positions/categories → それらを参照するテーブル）
  "01_tables/users/00_create_users_table.sql",
  "01_tables/users/01_add_bio_to_users_table.sql",
  "01_tables/users/02_alter_clerk_id_to_auth_id_for_users_table.sql",
  "01_tables/users/03_add_avatar_url_to_users_table.sql",
  "01_tables/users/04_add_sns_urls_to_users_table.sql",
  "01_tables/users/05_add_url_check_constraint_to_users.sql",
  "01_tables/users/06_add_profile_image_path_to_users.sql",
  "01_tables/users/07_add_registration_notified_at_to_users.sql",
  "01_tables/positions/00_create_positions_table.sql",
  "01_tables/positions/01_set_display_order_not_null.sql",
  "01_tables/positions/02_insert_leadership_positions.sql",
  "01_tables/positions/03_fix_positions_id_seq.sql",
  "01_tables/positions/04_add_is_leadership_column.sql",
  "01_tables/categories/00_create_categories_table.sql",
  "01_tables/categories/01_add_display_order_to_categories.sql",
  "01_tables/categories/02_add_applications_to_category_type.sql",
  "01_tables/categories/03_set_display_order_not_null.sql",
  "01_tables/position_tags/00_create_position_tags_table.sql",
  "01_tables/documents/00_create_documents_table.sql",
  "01_tables/documents/01_alter_category_ctrl_for_documents_table.sql",
  "01_tables/documents/02_add_foreign_key_to_documents.sql",
  "01_tables/documents/03_add_display_order_to_documents.sql",
  "01_tables/documents/04_set_display_order_not_null.sql",
  "01_tables/documents/05_add_assignee_id_to_documents.sql",
  "01_tables/documents/06_add_url_check_constraint_to_documents.sql",
  "01_tables/videos/00_create_videos_table.sql",
  "01_tables/videos/01_alter_category_ctrl_for_videos_table.sql",
  "01_tables/videos/02_add_foreign_key_to_videos.sql",
  "01_tables/videos/03_add_display_order_to_videos.sql",
  "01_tables/videos/04_set_display_order_not_null.sql",
  "01_tables/videos/05_add_assignee_id_to_videos.sql",
  "01_tables/videos/06_add_url_check_constraint_to_videos.sql",
  "01_tables/applications/00_create_applications_table.sql",
  "01_tables/applications/01_set_display_order_not_null.sql",
  "01_tables/applications/02_add_url_check_constraint_to_applications.sql",

  // 03_functions: 02_triggers/users_triggers.sql が is_active_user()/is_admin() を
  // 参照するため、02_triggersより先に適用する（users_triggers.sql内のコメント参照）
  "03_functions/rls_helper_functions.sql",
  "03_functions/clerk_functions.sql",

  // 02_triggers: common_triggers.sql が他の全トリガーから参照される
  // update_updated_at_column() を定義するため最初に適用する
  "02_triggers/common_triggers.sql",
  "02_triggers/applications_triggers.sql",
  "02_triggers/categories_triggers.sql",
  "02_triggers/documents_triggers.sql",
  "02_triggers/position_tags_triggers.sql",
  "02_triggers/users_triggers.sql",
  "02_triggers/videos_triggers.sql",

  // 04_policies: 03_functionsのヘルパー関数に依存するが、テーブル間の順序依存はない
  "04_policies/applications/00_applications_policies.sql",
  "04_policies/categories/00_categories_policies.sql",
  "04_policies/documents/00_documents_policies.sql",
  "04_policies/position_tags/00_position_tags_policies.sql",
  "04_policies/positions/00_positions_policies.sql",
  "04_policies/users/00_users_policies.sql",
  "04_policies/users/01_update_users_policies.sql",
  "04_policies/videos/00_videos_policies.sql",

  // 05_storage
  "05_storage/00_profile_images_bucket.sql",
  "05_storage/01_fix_profile_images_policies.sql",
  "05_storage/02_update_profile_images_bucket_settings.sql",
];

function run(command, args, options = {}) {
  return spawnSync(command, args, { encoding: "utf8", ...options });
}

// リストと実際のファイルの過不足を検出する（新規マイグレーション追加時の更新漏れを防ぐ）
function findAllMigrationFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findAllMigrationFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".sql")) {
      results.push(path.relative(MIGRATIONS_ROOT, fullPath).split(path.sep).join("/"));
    }
  }
  return results;
}

function assertListIsUpToDate() {
  const actual = new Set(findAllMigrationFiles(MIGRATIONS_ROOT));
  const listed = new Set(ORDERED_RELATIVE_PATHS);

  const missingFromList = [...actual].filter(f => !listed.has(f));
  const missingOnDisk = [...listed].filter(f => !actual.has(f));

  if (missingFromList.length > 0 || missingOnDisk.length > 0) {
    console.error(
      "scripts/apply-local-migrations.cjs の ORDERED_RELATIVE_PATHS が実際のファイルと一致していません。"
    );
    if (missingFromList.length > 0) {
      console.error("リストに未追加のファイル:\n  " + missingFromList.join("\n  "));
    }
    if (missingOnDisk.length > 0) {
      console.error(
        "リストにあるがディスク上に存在しないファイル:\n  " + missingOnDisk.join("\n  ")
      );
    }
    process.exit(1);
  }
}

// ローカルSupabaseのDB用コンテナ名は `supabase db start` 時のプロジェクトrefで変わるため
// 固定文字列にせず、実行中のコンテナから動的に見つける。
function findDbContainer() {
  const result = run("docker", ["ps", "--filter", "name=supabase_db_", "--format", "{{.Names}}"]);
  const names = (result.stdout || "").trim().split("\n").filter(Boolean);
  if (names.length === 0) {
    console.error(
      "ローカルSupabaseのDBコンテナが見つかりません。先に `supabase start` を実行してください。"
    );
    process.exit(1);
  }
  return names[0];
}

function applyFile(containerName, relativePath) {
  const absolutePath = path.join(MIGRATIONS_ROOT, relativePath);
  const sql = fs.readFileSync(absolutePath, "utf8");

  const result = run(
    "docker",
    [
      "exec",
      "-i",
      containerName,
      "psql",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "postgres",
      "-d",
      "postgres",
    ],
    { input: sql }
  );

  if (result.status !== 0) {
    console.error(`\n適用に失敗しました: ${relativePath}`);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  console.log(`applied: ${relativePath}`);
}

assertListIsUpToDate();
const containerName = findDbContainer();
for (const relativePath of ORDERED_RELATIVE_PATHS) {
  applyFile(containerName, relativePath);
}
console.log(`\n${ORDERED_RELATIVE_PATHS.length} 件のマイグレーションを適用しました。`);
