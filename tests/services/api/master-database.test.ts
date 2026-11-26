import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "supabase/migrations");
let database: PGlite;

async function apply(relativePath: string) {
  await database.exec(readFileSync(path.join(root, relativePath), "utf8"));
}

async function query<T>(sql: string, values: unknown[] = []) {
  await database.exec("SAVEPOINT attempt");
  try {
    const result = await database.query<T>(sql, values);
    await database.exec("RELEASE SAVEPOINT attempt");
    return result.rows;
  } catch (error) {
    await database.exec("ROLLBACK TO SAVEPOINT attempt; RELEASE SAVEPOINT attempt");
    throw error;
  }
}

async function mutate(
  table: string,
  operation: string,
  id: number | null,
  fields: object = {},
  placement: object = { type: "last" },
  token: string | null = null
) {
  return (
    await query<{ id: number }>("SELECT mutate_master_record($1,$2,$3,$4,$5,$6) AS id", [
      table,
      operation,
      id,
      fields,
      placement,
      token,
    ])
  )[0].id;
}

async function category(name: string, type = "documents") {
  return mutate("categories", "create", null, { name, category_type: type });
}

async function preview(id: number) {
  return (
    await query<{ value: { token: string; contents: { id: number; is_deleted: boolean }[] } }>(
      "SELECT master_category_preview($1) AS value",
      [id]
    )
  )[0].value;
}

async function actor(id: number) {
  await database.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
    `00000000-0000-0000-0000-${String(id).padStart(12, "0")}`,
  ]);
}

beforeAll(async () => {
  database = new PGlite();
  await database.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA public,auth TO authenticated;
  `);
  for (const table of [
    "users",
    "positions",
    "categories",
    "position_tags",
    "documents",
    "videos",
    "applications",
  ]) {
    for (const file of readdirSync(path.join(root, "01_tables", table))
      .filter(file => file.endsWith(".sql"))
      .sort()) {
      await apply(`01_tables/${table}/${file}`);
    }
  }
  await apply("03_functions/rls_helper_functions.sql");
  await apply("02_triggers/common_triggers.sql");
  for (const table of ["documents", "videos", "applications", "categories", "position_tags"]) {
    await apply(`02_triggers/${table}_triggers.sql`);
  }
  await apply("03_functions/master_management.sql");
  for (const table of [
    "positions",
    "categories",
    "position_tags",
    "documents",
    "videos",
    "applications",
  ]) {
    for (const file of readdirSync(path.join(root, "04_policies", table))
      .filter(file => file.endsWith(".sql"))
      .sort()) {
      await apply(`04_policies/${table}/${file}`);
    }
  }
  await database.exec(
    "GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated; GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;"
  );
  for (const [index, role, status, deleted] of [
    [1, "admin", "active", false],
    [2, "maintainer", "active", false],
    [3, "member", "active", false],
    [4, "admin", "pending", false],
    [5, "admin", "active", true],
  ] as const) {
    const uuid = `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`;
    await database.query("INSERT INTO auth.users(id) VALUES ($1)", [uuid]);
    await database.query(
      "INSERT INTO users(id,auth_id,email,display_name,role,status,is_deleted) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [index, uuid, `${index}@example.com`, `User ${index}`, role, status, deleted]
    );
  }
}, 30000);

beforeEach(async () => {
  await database.exec("BEGIN; SET LOCAL ROLE authenticated");
  await actor(1);
});

afterEach(async () => {
  await database.exec("ROLLBACK");
});
afterAll(async () => {
  await database?.close();
});

describe("master database operations with actual migrations and RLS", () => {
  it.each(["documents", "videos", "applications"])(
    "blocks edits to deleted %s while allowing reclassification and restoration",
    async table => {
      const group = await category(`Deleted ${table}`, table);
      const destination = await category(`Other ${table}`, table);
      const record = await mutate(table, "create", null, {
        name: "Original",
        description: "Original description",
        url: "https://example.com",
        category_id: group,
      });
      await mutate(table, "delete", record);
      for (const assignment of [
        "name='Changed'",
        "url='https://example.com/changed'",
        "display_order=100",
        `category_id=${destination}`,
        "is_deleted=false,name='Changed'",
      ]) {
        await expect(
          query(`UPDATE ${table} SET ${assignment} WHERE id=$1`, [record])
        ).rejects.toThrow("削除済み");
      }
      const impact = await preview(group);
      await mutate("categories", "delete", group, {}, undefined, impact.token);
      await mutate(table, "restore", record);
      expect(await query(`SELECT name,is_deleted FROM ${table} WHERE id=$1`, [record])).toEqual([
        { name: "Original", is_deleted: false },
      ]);
    }
  );

  it("blocks edits to deleted categories while allowing restoration", async () => {
    const group = await category("Deleted category");
    const impact = await preview(group);
    await mutate("categories", "delete", group, {}, undefined, impact.token);
    for (const assignment of [
      "name='Changed'",
      "category_type='videos'",
      "display_order=100",
      "is_deleted=false,name='Changed'",
    ]) {
      await expect(
        query(`UPDATE categories SET ${assignment} WHERE id=$1`, [group])
      ).rejects.toThrow("削除済み");
    }
    await mutate("categories", "restore", group);
    expect(await query("SELECT name,is_deleted FROM categories WHERE id=$1", [group])).toEqual([
      { name: "Deleted category", is_deleted: false },
    ]);
  });

  it.each([1, 2])("allows active manager %s to mutate", async id => {
    await actor(id);
    const position = await mutate("positions", "create", null, { name: "New role" });
    await mutate("positions", "update", position, { name: "Renamed" });
    await mutate("positions", "delete", position);
    await expect(mutate("positions", "restore", position)).rejects.toThrow("復元できません");
  });

  it.each([3, 4, 5])("rejects unauthorized actor %s", async id => {
    await actor(id);
    await expect(mutate("positions", "create", null, { name: "Forbidden" })).rejects.toThrow(
      "権限"
    );
    await expect(query("INSERT INTO positions(name) VALUES ('Forbidden')")).rejects.toThrow();
  });

  it("keeps independent contiguous groups when moving, deleting and restoring", async () => {
    const first = await category("First group");
    const second = await category("Second group");
    const firstDoc = await mutate("documents", "create", null, {
      name: "First",
      url: "https://example.com",
      category_id: first,
    });
    const moved = await mutate("documents", "create", null, {
      name: "Moved",
      url: "https://example.com",
      category_id: first,
    });
    const other = await mutate("documents", "create", null, {
      name: "Other",
      url: "https://example.com",
      category_id: second,
    });
    await mutate("documents", "update", moved, { category_id: second });
    expect(
      await query(
        "SELECT id,display_order FROM documents WHERE id IN ($1,$2,$3) ORDER BY category_id,display_order",
        [firstDoc, other, moved]
      )
    ).toEqual([
      { id: firstDoc, display_order: 1 },
      { id: other, display_order: 1 },
      { id: moved, display_order: 2 },
    ]);
    await mutate("documents", "delete", other);
    await mutate("documents", "restore", other);
    expect(
      await query(
        "SELECT id,display_order FROM documents WHERE category_id=$1 ORDER BY display_order",
        [second]
      )
    ).toEqual([
      { id: moved, display_order: 1 },
      { id: other, display_order: 2 },
    ]);
  });

  it("protects uncategorized records and blocks cross-type references", async () => {
    const reserved = (
      await query<{ id: number }>(
        "SELECT id FROM categories WHERE name='未分類' AND category_type='documents' AND NOT is_deleted"
      )
    )[0].id;
    await expect(
      query("UPDATE categories SET name='Renamed' WHERE id=$1", [reserved])
    ).rejects.toThrow("未分類");
    await expect(
      query("UPDATE categories SET is_deleted=true WHERE id=$1", [reserved])
    ).rejects.toThrow("未分類");
    await expect(category("未分類")).rejects.toThrow("重複");
    await expect(
      mutate("videos", "create", null, {
        name: "Wrong",
        url: "https://example.com",
        category_id: reserved,
      })
    ).rejects.toThrow("同種別");
  });

  it("checks deleted content and reconfirms changed references", async () => {
    const group = await category("Referenced");
    const document = await mutate("documents", "create", null, {
      name: "Linked",
      url: "https://example.com",
      category_id: group,
    });
    const original = await preview(group);
    await mutate("documents", "delete", document);
    await expect(
      mutate("categories", "delete", group, {}, undefined, original.token)
    ).rejects.toThrow("再確認");
    const current = await preview(group);
    expect(current.contents).toHaveLength(1);
    expect(current.contents[0].is_deleted).toBe(true);
    await expect(
      mutate("categories", "update", group, { category_type: "videos" }, undefined, current.token)
    ).rejects.toThrow("参照");
    await mutate("categories", "delete", group, {}, undefined, current.token);
    expect(
      await query(
        "SELECT categories.name FROM documents JOIN categories ON documents.category_id=categories.id WHERE documents.id=$1",
        [document]
      )
    ).toEqual([{ name: "未分類" }]);
    await mutate("categories", "restore", group);
    expect(
      await query(
        "SELECT categories.name FROM documents JOIN categories ON documents.category_id=categories.id WHERE documents.id=$1",
        [document]
      )
    ).toEqual([{ name: "未分類" }]);
  });

  it("allows unreferenced category type changes", async () => {
    const group = await category("Unused");
    await mutate(
      "categories",
      "update",
      group,
      { category_type: "videos" },
      undefined,
      (await preview(group)).token
    );
    expect(await query("SELECT category_type FROM categories WHERE id=$1", [group])).toEqual([
      { category_type: "videos" },
    ]);
  });

  it("blocks used and leadership role deletion even through direct writes", async () => {
    const used = await mutate("positions", "create", null, { name: "Used", is_leadership: false });
    await query("INSERT INTO position_tags(position_id,user_id) VALUES ($1,5)", [used]);
    await mutate("positions", "update", used, { name: "Allowed", description: "Allowed" });
    await expect(
      query("UPDATE positions SET is_leadership=true WHERE id=$1", [used])
    ).rejects.toThrow("使用中");
    await expect(query("UPDATE positions SET is_deleted=true WHERE id=$1", [used])).rejects.toThrow(
      "使用中"
    );
    const leader = await mutate("positions", "create", null, {
      name: "Leader",
      is_leadership: true,
    });
    await expect(mutate("positions", "delete", leader)).rejects.toThrow("幹部");
    const removed = await mutate("positions", "create", null, { name: "Removed" });
    await mutate("positions", "delete", removed);
    await expect(
      query("INSERT INTO position_tags(position_id,user_id) VALUES ($1,1)", [removed])
    ).rejects.toThrow("削除済み");
  });

  it("updates role timestamps and protects creation metadata", async () => {
    const role = (
      await query<{ id: number }>(
        "INSERT INTO positions(name,updated_at) VALUES ('Timestamp','2000-01-01') RETURNING id"
      )
    )[0].id;
    await mutate("positions", "update", role, { name: "Updated" });
    expect(
      (
        await query<{ changed: boolean }>(
          "SELECT updated_at > '2000-01-01' AS changed FROM positions WHERE id=$1",
          [role]
        )
      )[0].changed
    ).toBe(true);
    await expect(
      query("UPDATE positions SET created_at='2000-01-01' WHERE id=$1", [role])
    ).rejects.toThrow("作成日時");
    const group = await category("Audit");
    const document = (
      await query<{ id: number }>(
        "INSERT INTO documents(name,url,category_id,created_by,updated_by) VALUES ('Audit','https://example.com',$1,2,2) RETURNING id",
        [group]
      )
    )[0].id;
    expect(
      await query("SELECT created_by,updated_by FROM documents WHERE id=$1", [document])
    ).toEqual([{ created_by: 1, updated_by: 1 }]);
    await expect(
      query("UPDATE documents SET created_by=2 WHERE id=$1", [document])
    ).rejects.toThrow("作成者");
  });

  it("rolls back order changes if insertion fails", async () => {
    const group = await category("Atomic");
    await mutate("documents", "create", null, {
      name: "Existing",
      url: "https://example.com",
      category_id: group,
    });
    await expect(
      mutate(
        "documents",
        "create",
        null,
        { name: "Invalid", category_id: group },
        { type: "first" }
      )
    ).rejects.toThrow();
    expect(
      await query("SELECT name,display_order FROM documents WHERE category_id=$1", [group])
    ).toEqual([{ name: "Existing", display_order: 1 }]);
  });
});
