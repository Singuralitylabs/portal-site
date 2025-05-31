# Supabase セットアップと利用ガイド

このドキュメントでは、プロジェクトでのSupabaseの設定方法と利用方法について説明します。

## 目次

- [マイグレーションファイルの説明](#マイグレーションファイルの説明)
- [環境設定](#環境設定)
- [APIの使い方](#APIの使い方)
- [認証連携](#認証連携)
- [よくある問題と解決策](#よくある問題と解決策)

## マイグレーションファイルの説明

`migrations`ディレクトリには、データベース構築に必要なSQLファイルが含まれています：

1. `01_create_tables.sql` - テーブル作成
2. `02_triggers.sql` - トリガー設定（updated_at自動更新など）
3. `03_functions.sql` - 関数作成
4. `policies` - テーブルのRLSポリシー設定

### マイグレーションとは？

マイグレーションとは、データベースの構造やデータを段階的に変更・管理するための仕組みです。これにより、以下の利点があります。

- 変更履歴の管理
- 環境間の一貫性確保
- ロールバックの可能性
- チーム開発の効率化

### SQLファイルの設定方法

各マイグレーションファイルは番号順に実行する必要があります。ファイル内のSQLコマンドは、supabaseのSQLエディタ画面で実行して下さい。

## 環境設定

### 必要な環境変数

ローカル環境では、supabaseに接続するため、URLやキーを.env.localファイルに設定する必要があります。

各値は、supabaseダッシュボードのProject Settingsにある、General画面やData API画面から取得できます。

```bash
# .env.local に追加
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_PROJECT_ID=xxxxxxxxxx
```

### データベース型定義の生成

型安全なデータベース操作のために、Supabaseから型定義を生成します：

```bash
npm run db:types
```

この操作により、`app/types/lib/database.types.ts`ファイルが更新されます。テーブル構造を変更した場合は、必ずこのコマンドを実行してください。

## APIの使い方

### 基本的な使い方

```typescript
import supabase from "@/app/services/api/supabase";

// データの取得
const { data, error } = await supabase.from("table_name").select("*");

// データの挿入
const { data, error } = await supabase
  .from("table_name")
  .insert([{ column1: "value1", column2: "value2" }]);

// データの更新
const { data, error } = await supabase
  .from("table_name")
  .update({ column1: "new_value" })
  .eq("id", 1);

// データの削除
const { data, error } = await supabase.from("table_name").delete().eq("id", 1);
```

## 認証連携

本プロジェクトでは、Clerkを使用した認証と、Supabaseを使用したデータ管理を組み合わせています：

1. ユーザーがClerkでGoogle認証を行う
2. 認証成功後、Clerkからwebhookが呼び出され、ユーザー情報がSupabaseのusersテーブルに登録される
3. クライアントからのデータアクセスはRLSポリシーによって制御される

### Row Level Security (RLS)

Row Level Security (RLS)を使用して、データアクセスを制御しています：

- ユーザーは自分自身のデータのみ閲覧可能
- 管理者は全ユーザーデータを閲覧可能
- 登録済みユーザーのみ資料を閲覧可能

これらのポリシーは `04_policies.sql` ファイルで定義されています。

## よくある問題と解決策

### RLSによるアクセス拒否

問題: データが取得できない（`error: permission denied for table xxx`）

解決策:

1. RLSポリシーが正しく設定されているか確認
2. Clerk認証からclerk_idが正しくセットされているか確認

### 型定義の不一致

問題: TypeScriptエラー（`Property 'xxx' does not exist on type...`）

解決策:

1. `npm run db:types`を実行して型定義を更新
2. 必要に応じてテーブル定義を修正

### その他の問題

他に問題が発生した場合は、Slackのテックサポートチャンネルでご質問ください。
