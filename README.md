# 会員制ポータルサイト

会員限定のコンテンツを提供するためのポータルサイトです。Google認証による会員管理と承認機能を備え、承認された会員のみがコンテンツを視聴できます。  

こちらの[開発ガイドライン](https://github.com/Singuralitylabs/portal-site/wiki/%E3%83%9D%E3%83%BC%E3%82%BF%E3%83%AB%E3%82%B5%E3%82%A4%E3%83%88%E9%96%8B%E7%99%BA%E3%82%AC%E3%82%A4%E3%83%89%E3%83%A9%E3%82%A4%E3%83%B3)も合わせてご覧ください。 

## 機能概要

- Google認証による会員管理
- シンラボ内資料の一覧ページ
- ユーザーロール管理（member, maintainer, admin）

### ユーザーロール

| ロール        | 権限                                         |
| ------------- | -------------------------------------------- |
| **member**    | コンテンツの閲覧のみ                         |
| **maintainer** | コンテンツの閲覧・追加・編集・削除           |
| **admin**     | 全権限（ユーザー管理 + コンテンツ管理）      |

## 技術スタック

### フロントエンド

- Next.js (TypeScript)
- Tailwind CSS
- Mantine UI

### バックエンド/インフラ

- Supabase Auth (認証)
- Supabase (データベース)
- Vercel (ホスティング)

### 開発環境

- Git/GitHub (ソースコード管理)
- GitHub Actions (CI/CD)

## 開発環境のセットアップ

1. リポジトリのクローン

   ```bash
   git clone https://github.com/Singuralitylabs/portal-site.git
   cd portal-site
   ```

2. 依存パッケージのインストール

   ```bash
   npm install
   ```

3. 環境変数の設定
   `.env.local`ファイルを作成し、必要な環境変数を設定します。
   環境変数の値については、プロジェクトリーダーに確認してください。

   ```bash
   # Supabase関連（認証・データベース）
   NEXT_PUBLIC_SUPABASE_URL=https://************.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ*********************************
   SUPABASE_PROJECT_ID=************
   ```

4. 開発サーバーの起動

   ```bash
   npm run dev
   ```

## ブランチ戦略

```
release (protected) - 本番環境
  ↑
main (protected) - テスト環境
  ↑
feature/* - 機能開発
```

- `release`: 本番環境用ブランチ（保護済）
- `main`: テスト環境用ブランチ（保護済）
- `feature/*`: 機能開発用ブランチ

## 必要スキル

### 基礎スキル

- HTML/CSSの基本的な理解
- JavaScriptの基本構文とES6機能の理解
- Git/GitHubの基本操作

### 学習リソース

- HTML/CSS: Progate推奨
- JavaScript: GAS講座推奨
- その他技術スタックは参画後に学習可能

## 開発手順

1. featureブランチの作成

   ```bash
   git checkout main           # mainブランチに移動
   git pull origin main       # 最新の状態に更新
   git checkout -b feature/[機能名]  # 新しいブランチを作成
   ```

   - **重要**: 必ずmainブランチから新しいfeatureブランチを作成してください

2. 実装

   - コミットメッセージは変更内容が分かるように記載してください
     ```bash
     git add .
     git commit -m "Add: ログイン機能の実装"
     ```

3. プルリクエストの作成

   - featureブランチからmainブランチに向けて作成します
   - 以下の項目を必ず設定してください：
     - Assignee: 自分自身
     - Reviewer: プロジェクトリーダー
     - Description: 実装内容の概要（追加・修正・削除した内容）
   - GithubActionsのテストが全てパスしていることを確認してください

4. コードレビュー

   - レビューでの指摘事項があった場合は対応してください
   - 変更後は再度レビューを依頼してください

5. mainブランチへのマージ
   - プロジェクトリーダーによる承認後、マージされます
   - マージ後、プロジェクトリーダーから全メンバーにrebaseの実行が指示されます
6. rebaseの実行
   ```bash
   git checkout main          # mainブランチに移動
   git pull origin main      # リモートの変更を取得
   git checkout feature/[作業中の機能名]  # 作業ブランチに移動
   git rebase main          # mainの内容で作業ブランチを更新
   ```
   - コンフリクトが発生した場合は解消してください
   - 解消後は以下のコマンドで続行します
   ```bash
   git add .
   git rebase --continue
   ```
7. ブランチの後片付け（作業完了時）
   ```bash
   git checkout main          # mainブランチに移動
   git pull origin main      # 最新の状態に更新
   git branch -d feature/[機能名]  # 作業ブランチの削除
   ```
