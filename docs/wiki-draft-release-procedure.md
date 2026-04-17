# 本番環境リリース手順

## 概要

本番環境へのリリースは、手動作業と GitHub Actions による自動化を組み合わせて行う。

- **自動で行われる作業**: 品質チェック、PR 作成、事前作業の検出、フォークリポジトリ同期、タグ・GitHub Release 作成
- **手動で行う作業**: DB マイグレーション、初期データ投入、環境変数確認、PR レビュー、本番動作確認、Slack 通知

各ワークフローの設計方針や実行条件の詳細は [CI/CD 設計書](https://github.com/Singuralitylabs/portal-site/blob/main/docs/ci-cd-design.md) を参照すること。

---

## 事前準備（初回のみ）

リリース自動化を利用するには、以下の初期設定が必要。

### GitHub Secrets の登録

GitHub リポジトリの **Settings → Secrets and variables → Actions → Secrets** に以下を登録する。

| 名前 | 内容 | 取得方法 |
| --- | --- | --- |
| `FORK_SYNC_TOKEN` | フォーク同期用トークン | GitHub Settings → Developer Settings → Fine-grained tokens で発行 |
| `SUPABASE_ACCESS_TOKEN` | Supabase 接続用トークン | https://supabase.com/dashboard/account/tokens で発行 |

### GitHub Variables の登録

**Settings → Secrets and variables → Actions → Variables** に以下を登録する。

| 名前 | 内容 |
| --- | --- |
| `FORK_OWNER` | フォークリポジトリのオーナー名 |
| `FORK_REPO` | フォークリポジトリ名 |
| `SUPABASE_PROJECT_ID` | Supabase プロジェクト ID（Supabase の URL に含まれる） |

### GitHub Environment の作成

**Settings → Environments** で以下を作成する。

| 項目 | 設定値 |
| --- | --- |
| Environment 名 | `production-release` |
| Required reviewers | リリース承認者を追加 |

---

## リリース手順

### Phase 1: リリース PR 作成（自動）

#### Step 1: リリース PR の作成と品質チェック

1. GitHub リポジトリの **Actions** タブを開く
2. 左メニューから **Create Release PR** を選択する
3. **Run workflow** ボタンをクリックする
4. 以下を入力して実行する
   - **リリースバージョン**（必須）: `X.Y.Z` 形式（例: `7.0.0`）
   - **リリースサマリー**（任意）: リリース内容の説明
5. ワークフローが品質チェック（build / type-check / lint / test）を実行する
6. すべてのチェックが通ると、`main → release` の PR が自動作成される

作成された PR の本文には、以下の情報が自動で含まれる。

- **マイグレーションファイル**: 前回リリース以降に追加・変更されたマイグレーションファイルの一覧
- **新規環境変数の参照**: 前回リリース以降にコード上で新しく参照された環境変数の一覧

> **品質チェックが失敗した場合**: 失敗原因を修正して main にマージした後、再度ワークフローを実行する。

### Phase 2: 事前作業（手動）

PR 本文の「事前作業チェックリスト」を確認し、該当がある場合のみ実施する。

#### Step 2: Supabase マイグレーション実行

PR 本文の「マイグレーションファイル」に一覧が表示されている場合に実施する。

1. Supabase ダッシュボードの SQL Editor を開く
2. PR に記載されたマイグレーションファイル（`supabase/migrations/` 配下）の SQL を実行する
3. 実行結果を確認し、エラーがないことを確認する

#### Step 3: 初期データ投入

該当リリースで新規テーブルや初期データの追加がある場合のみ実施する。

1. 対象のシードデータを Supabase ダッシュボードの SQL Editor で投入する
2. データが正しく投入されたことを確認する

#### Step 4: Vercel 環境変数確認

PR 本文の「新規環境変数の参照」に一覧が表示されている場合に実施する。

1. Vercel ダッシュボードの **Settings → Environment Variables** を開く
2. PR に記載された環境変数が Production 環境に設定されていることを確認する
3. 未設定の場合は追加する

> **注意**: 環境変数の自動検出はコード上の `process.env.*` の参照を元にしている。既存の環境変数の値を変更する場合など、検出されないケースもあるため、リリース内容に応じて確認すること。

### Phase 3: レビュー・マージ（手動）

#### Step 5: PR レビュー・承認・マージ

1. 作成された PR の内容（チェンジログ、差分）を確認する
2. 事前作業（Step 2〜4）が完了していることを確認する
3. レビュアーが承認する
4. PR を `release` ブランチにマージする

### Phase 4: デプロイと動作確認（手動）

PR のマージ後、以下が自動で実行される。

- **Vercel**: `release` ブランチのデプロイが開始される
- **fork-sync.yml**: フォークリポジトリの `release` ブランチが同期される
- **create-release.yml**: ワークフローが起動するが、**承認待ち状態で停止**する

#### Step 6: Vercel デプロイ確認

1. Vercel ダッシュボードでデプロイが正常に完了したことを確認する
2. デプロイが失敗した場合は、Vercel ダッシュボードから手動で再デプロイする

#### Step 7: 本番動作確認

1. 本番 URL にアクセスし、サイトが表示されることを確認する
2. Google 認証でログインできることを確認する
3. リリースで変更した機能が正しく動作することを確認する
4. 既存機能に問題がないことを確認する

### Phase 5: リリース公開と通知（半自動 + 手動）

#### Step 8: タグ作成・GitHub Release 公開

Step 7 の動作確認が完了したら、承認ゲートを通過させる。

1. GitHub リポジトリの **Actions** タブを開く
2. **Create Release Tag and GitHub Release** ワークフローの実行中ジョブを確認する
3. 「Review deployments」の承認画面で、動作確認が完了していることを確認し、**Approve** をクリックする
4. タグと GitHub Release が自動作成される

> **承認後にワークフローが失敗した場合**: Actions タブから **Create Release Tag and GitHub Release** を手動起動（Run workflow）して再実行する。

#### Step 9: Slack 通知

1. GitHub Release のページを開き、リリース内容を確認する
2. チームの Slack チャンネルにリリース完了を通知する
   - リリースバージョン
   - GitHub Release へのリンク
   - 主な変更点

---

## トラブルシューティング

### release-pr.yml が失敗する

**原因**: 品質チェック（build / type-check / lint / test）のいずれかが失敗している。

**対応**:
1. Actions タブでジョブのログを確認し、失敗箇所を特定する
2. main ブランチで修正を行い、マージする
3. 再度ワークフローを手動起動する

### fork-sync.yml が失敗する

**原因**: トークンの期限切れ、フォークリポジトリの設定変更など。

**対応**:
1. Actions タブでジョブサマリーを確認する
2. トークンが有効か確認し、必要であれば再発行して Secrets を更新する
3. Actions タブから手動起動（Run workflow）で再実行する

> フォーク同期の失敗は本番デプロイには影響しない。リリース作業を先に進め、後から対応しても問題ない。

### create-release.yml が失敗する

**原因**: タグの重複、バージョン形式の不備など。

**対応**:
1. Actions タブでジョブのログを確認し、エラー内容を特定する
2. バージョン番号が正しい形式（`X.Y.Z`）かを確認する
3. 同じバージョンのタグが既に存在していないか確認する
4. 必要であれば Actions タブから手動起動（Run workflow）で再実行する

### Vercel のデプロイが失敗する

**対応**:
1. Vercel ダッシュボードでデプロイログを確認する
2. 環境変数の不足がないか確認する
3. Vercel ダッシュボードから手動で再デプロイする
