# 環境構築手順書

このドキュメントでは、本プロジェクトに参画するメンバーが開発環境を構築するための手順を説明します。

本プロジェクトに参画するためには、[シンギュラリティ・ラボ](https://sinlab.future-tech-association.org/join/)への入会が必要です。

## 目次

1. [事前準備](#1-事前準備)
2. [プロジェクトのセットアップ](#2-プロジェクトのセットアップ)
3. [開発環境の起動確認](#3-開発環境の起動確認)
4. [トラブルシューティング](#4-トラブルシューティング)

## 1. 事前準備

### 1.1 必要なツール

以下のツールを事前にインストールしてください。

- Node.js: バージョン 20.x 以上
  - [公式サイト](https://nodejs.org/)からダウンロード
  - インストール確認: `node -v`
- Git: 最新版

  - [公式サイト](https://git-scm.com/)からダウンロード、又は下記コマンドによりインストール

    ```bash
    # macOSの場合
    brew install git

    # Windowsの場合
    winget install Git.Git

    # Linux (Ubuntu/Debian)の場合
    sudo apt-get update
    sudo apt-get install git
    ```

  - インストール確認: `git --version`

- テキストエディタ: Visual Studio Code（他のエディタでも可）
  - [公式サイト](https://code.visualstudio.com/download)からダウンロード

### 1.2 アカウント準備

- GitHubアカウント: リポジトリへのアクセス権限付与に使用
- Googleアカウント: 本プロジェクトのログイン認証に使用

### 1.3 各開発サービスへのメンバー登録

プロジェクトリーダーに以下のサービスへのメンバー登録を依頼してください。

- GitHubリポジトリへの招待

  - リポジトリ: `Singuralitylabs/portal-site`
  - 必要な情報: GitHubユーザー名、又はメールアドレス
  - 目的: コードの閲覧・編集・プルリクエストの作成

- Supabaseプロジェクトへの招待

  - 必要な情報: メールアドレス（Googleアカウント推奨）
  - 目的: データベースやポリシーの確認・更新・型定義の生成

- シンラボSlackの開発チャンネルの参加

  - チャンネル: `201-club_チーム開発`
  - 目的: チームコミュニケーション・質問・進捗共有

#### 登録依頼の手順

1. シンラボSlackの`201-club_チーム開発`チャンネルで以下の情報を共有
   - GitHubユーザー名
   - メールアドレス（Googleアカウント推奨）
2. プロジェクトリーダーからの招待メールを確認
3. 各サービスへのアクセス権限を確認

## 2. プロジェクトのセットアップ

### 2.1 リポジトリのクローン

ご自身のPC内の適当なフォルダを準備し、ターミナル(mac)又はGit Bash(Windows)により、下記コマンドでリポジトリをクローンする

```bash
git clone https://github.com/Singuralitylabs/portal-site.git

cd portal-site
```

### 2.2 依存パッケージのインストール

下記コマンドにより、本プロジェクトに必要な依存パッケージをインストールする

```bash
npm install
```

### 2.3 環境変数の設定

1. `.env.local`ファイルをプロジェクトルートに作成する

```bash
touch .env.local
```

2. 以下の環境変数を設定する **（各値は参画時に個別共有）**。

```bash
# Supabase関連（認証・データベース）
NEXT_PUBLIC_SUPABASE_URL=https://************.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ*********************************
SUPABASE_PROJECT_ID=************

# Slack通知（オプション）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/***************
```

#### 重要な注意事項

- `.env.local`ファイルは`.gitignore`に含まれており、Gitにコミットされません
- 環境変数の値は機密情報のため、公開しないでください
- 環境変数の値が不明な場合は、Slackの`201-club_チーム開発`チャンネルで質問してください

### 2.4 Visual Studio Code の推奨設定

プロジェクトには既に `.vscode/settings.json` が含まれていますが、以下の拡張機能のインストールを推奨します。

- ESLint: コードの静的解析
- Prettier - Code formatter: コードフォーマッター
- TypeScript and JavaScript Language Features: TypeScript サポート

#### 拡張機能のインストール方法

1. VS Code を開く
2. 左サイドバーの拡張機能アイコンをクリック（またはCmd/Ctrl + Shift + X）
3. 上記の拡張機能名で検索してインストール

## 3. 開発環境の起動確認

### 3.1 開発サーバーの起動

```bash
npm run dev
```

成功すると、以下のようなメッセージが表示されます。

```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in Xms
```

### 3.2 ブラウザでの動作確認

1. ブラウザで http://localhost:3000 にアクセス
2. ログイン画面が表示されることを確認
3. 「Googleでログイン」ボタンが表示されることを確認

注意：実際にログインして機能を確認するには、「ユーザー承認」が必要です。

### 3.3 ビルドの確認

本番環境と同じビルドプロセスが正常に動作するか確認します。

```bash
npm run build
```

エラーなくビルドが完了すれば OK です。

## 4. トラブルシューティング

### パッケージのインストールエラー

症状： `npm install` 実行時にエラーが発生する

解決方法：

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### 環境変数が読み込まれない

症状： 開発サーバー起動時に環境変数関連のエラーが発生する

解決方法：

1. `.env.local` ファイルがルートディレクトリ（最上位のフォルダ）に存在することを確認
2. 環境変数名が正確に一致していることを確認（大文字小文字を含む）
3. 開発サーバーを再起動（Ctrl + C で停止後、`npm run dev` で再起動）

### TypeScript のエラー

症状： 型エラーが大量に表示される

解決方法：

```bash
# TypeScript の型定義を再生成
npm run db:types

# または、既存のビルドキャッシュをクリア
rm -rf .next
npm run dev
```

## 次のステップ

環境構築が完了したら、チーム開発会議で担当となったissueの設計・実装を進めてください。
