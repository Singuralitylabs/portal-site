# 環境構築手順書

このドキュメントでは、プロジェクトの開発環境構築に必要な手順を説明します。

## 目次

1. [プロジェクトの初期設定](#プロジェクトの初期設定)
2. [主要パッケージのインストール](#主要パッケージのインストール)
3. [認証の設定](#認証の設定)
4. [開発環境の起動確認](#開発環境の起動確認)

## プロジェクトの初期設定

### 1. Next.jsプロジェクトの作成

```bash
# App Routerを使用したNext.jsプロジェクトの作成
npx create-next-app@latest
```

以下の選択肢を選んでください：

```
✔ What is your project named? → your-project-name
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → Yes
✔ Would you like to use App Router? → Yes
✔ Would you like to customize the default import alias? → No
```

### 2. 追加の設定ファイル

`.gitignore`に以下を追加：

```
# 環境変数
.env*
!.env.example

# その他
.DS_Store
```

## 主要パッケージのインストール

### 1. UIライブラリ（shadcn/ui）のセットアップ

```bash
# shadcn/uiの初期設定
npx shadcn-ui@latest init
```

以下の選択肢を選んでください：

```
✔ Would you like to use TypeScript (recommended)? → yes
✔ Which style would you like to use? → Default
✔ Which color would you like to use as base color? → Slate
✔ Where is your global CSS file? → src/app/globals.css
✔ Would you like to use CSS variables for colors? → yes
✔ Where is your tailwind.config.js located? → tailwind.config.js
✔ Configure the import alias for components? → @/components
✔ Configure the import alias for utils? → @/lib/utils
```

### 2. 認証（Clerk）のセットアップ

```bash
# Clerkのインストール
npm install @clerk/nextjs
```

## 認証の設定

### 1. Clerkの設定

1. [Clerk Dashboard](https://dashboard.clerk.dev/)でプロジェクトを作成
2. Google認証の有効化:
   - OAuth providersからGoogleを選択
   - 必要な情報を入力

## 開発環境の起動確認

1. 環境変数の設定

   - `.env.local`ファイルを作成し、必要な環境変数を設定

2. 開発サーバーの起動

   ```bash
   npm run dev
   ```

3. ブラウザでの動作確認
   - http://localhost:3000 にアクセス
   - 認証機能の動作確認

## トラブルシューティング

よくある問題と解決方法：

1. パッケージのインストールエラー

   ```bash
   # node_modulesを削除して再インストール
   rm -rf node_modules
   npm install
   ```

2. TypeScriptのエラー
   ```bash
   # TypeScriptの型定義を更新
   npm run build
   ```

不明な点がある場合は、Slackの`201-club_チーム開発`チャンネルで質問してください。
