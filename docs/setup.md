# 環境構築手順書

本プロジェクトに参画する際の、開発環境を構築するための手順を説明します。

本プロジェクトに参画するためには、[シンギュラリティ・ラボ](https://sinlab.future-tech-association.org/join/)への入会が必要です。

## 目次

1. [事前準備](#1-事前準備)
2. [プロジェクトのセットアップ](#2-プロジェクトのセットアップ)
3. [開発環境の起動確認](#3-開発環境の起動確認)
4. [トラブルシューティング](#4-トラブルシューティング)

## 1. 事前準備

### 1.1 必要なツール

ご自身のPCに、以下のツールをインストールしてください。

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

下記アカウントをご準備ください。

- GitHubアカウント: リポジトリへのアクセス権限付与に使用
- Googleアカウント: 本プロジェクトのログイン認証に使用

### 1.3 各開発サービスへのメンバー登録

プロジェクトリーダーに以下のサービスへのメンバー登録を依頼してください。

- GitHubリポジトリへの招待
  - 目的: コードの閲覧・編集・プルリクエストの作成
  - リポジトリ: `Singuralitylabs/portal-site`
  - 必要な情報: GitHubユーザー名、又はメールアドレス

- Supabaseプロジェクトへの招待
  - 目的: データベースやポリシーの確認・更新・型定義の生成
  - プロジェクト: ポータルサイト開発用、データベース検証用
  - 必要な情報: メールアドレス

- シンラボSlackの開発チャンネルの参加
  - 目的: チームコミュニケーション・質問・進捗共有
  - チャンネル: `201-club_チーム開発`
  - 必要な情報: なし

## 2. プロジェクトのセットアップ

### 2.1 リポジトリのクローン

ご自身のPC内の適当なフォルダを準備し、下記コマンドでリポジトリをクローンする

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

1. プロジェクトルートの `.env.example` をコピーして `.env.local` を作成する

   ```bash
   cp .env.example .env.local
   ```

   `.env.example` には本プロジェクトで使用する環境変数のキーがすべて記載されている。新しい環境変数を追加する際は `.env.example` も併せて更新すること（リリース PR の「新規環境変数の検出」が機能する前提となっている）。

2. 作成した `.env.local` の各値を実際のものに差し替える **（各値は参画時に個別共有）**。

   | 変数 | 説明 | 取得元 |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトのエンドポイント URL。ブラウザ／サーバー双方から Supabase の認証・データベース API へ接続する際に使用する | Supabase Dashboard → Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の匿名 API キー。クライアント側から Supabase に接続する際の認証に使用される（実権限は RLS で制御される） | Supabase Dashboard → Project Settings → API → anon public |
   | `SUPABASE_PROJECT_ID` | Supabase プロジェクトの一意 ID。`npm run db:types` でデータベース型定義を自動生成する際に使用する（ローカル開発でのみ必要） | Supabase Dashboard → Project Settings → General → Reference ID |
   | `GOOGLE_CALENDAR_IDS` | 取得対象の Google Calendar の `alias:calendarId` ペアをカンマ区切りで指定する。`alias` は `app/constants/calendar.ts` の `CALENDAR_COLORS` で定義されたキー（例: `singularity-mtg` / `singularity-event` / `holiday` / `test-calendar`）。`calendarId` に `#` を含む場合は `%23` に URL エンコードする必要がある（実装で `decodeURIComponent` されるため）。例: `holiday:ja.japanese%23holiday@group.v.calendar.google.com` | Google Calendar の各カレンダー設定画面で取得した ID を、対応する alias と組み合わせる |
   | `GOOGLE_SERVICE_ACCOUNT_KEY` | Google API を呼び出すためのサービスアカウント鍵（JSON 文字列）。カレンダー API への認証に使用する | Google Cloud Console で発行した JSON 鍵の中身（1 行に整形） |
   | `SLACK_WEBHOOK_URL` | Slack に通知を送るための Incoming Webhook URL。申請・承認イベント等の通知送信先として使用する | Slack の Incoming Webhook 設定画面 |

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

#### ワークスペース設定の反映方法

- 本リポジトリには VS Code 用のワークスペース設定が
  [.vscode/settings.json](../.vscode/settings.json) として含まれています。
- リポジトリを VS Code で開くと、自動的にこの設定が適用されます。
- 設定内容を確認したい場合は、コマンドパレットから
  `Preferences: Open Workspace Settings (JSON)` を開くか、
  `.vscode/settings.json` を直接確認してください。

#### Markdown 整形に関する補足

- Markdown の整形基準は Prettier の出力に統一します。
- 通常のネスト箇条書きは 2 スペース、
  番号付きリスト配下の箇条書きは 3 スペースになることがあります。
- これは Prettier の Markdown 整形仕様によるもので、VS Code 側の不具合ではありません。
- `.vscode/settings.json` では Markdown 編集時の入力補助として
  2 スペース設定を入れていますが、
  Prettier 実行時の 3 スペース出力自体は変わりません。

## 3. 開発環境の起動確認

### 3.1 開発サーバーの起動

```bash
npm run dev
```

成功すると、以下のようなメッセージが表示されます。

```text
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in Xms
```

### 3.2 ブラウザでの動作確認

1. ブラウザで `http://localhost:3000` にアクセス
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
