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
npx create-next-app@latest
```

以下の選択肢を選択

```
✔ What is your project named? → portal-site
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → No
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

### 1. ESLintとPrettierのセットアップ

```bash
npm install --save-dev eslint-config-next @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import eslint-config-prettier prettier
```

`.eslintrc.json`の設定：

```json
{
  // 基本的なルールセットの継承
  "extends": [
    "next/core-web-vitals", // Next.jsの推奨設定とWeb Vitalsの最適化ルール
    "plugin:@typescript-eslint/recommended", // TypeScriptの推奨ルール
    "plugin:react/recommended", // Reactの推奨ルール
    "plugin:react-hooks/recommended", // React Hooksの推奨ルール
    "plugin:import/recommended", // import/exportの推奨ルール
    "plugin:import/typescript", // TypeScriptのimport規則
    "prettier" // Prettierとの競合を防ぐ
  ],

  // 使用するプラグイン
  "plugins": [
    "@typescript-eslint", // TypeScript用のLintルール
    "react", // React用のLintルール
    "import" // import/export用のLintルール
  ],

  // 個別のルール設定
  "rules": {
    "react/react-in-jsx-scope": "off", // React 17以降はimport React不要
    "react/prop-types": "off", // TypeScriptを使用するため無効化
    "@typescript-eslint/explicit-module-boundary-types": "off", // 関数の戻り値の型を必須としない
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ], // 未使用変数を禁止（_で始まる変数は除外）
    "@typescript-eslint/no-explicit-any": "warn", // any型の使用を警告
    // importの順序とグループ化を制御
    "import/order": [
      "error",
      {
        // グループの順序を定義
        "groups": [
          "builtin", // Node.jsの組み込みモジュール
          "external", // npm パッケージ
          "internal", // プロジェクト内の指定パス
          "parent", // 親ディレクトリからのインポート
          "sibling", // 同じディレクトリからのインポート
          "index", // カレントディレクトリのindex
          "object", // オブジェクトのインポート
          "type" // 型のインポート
        ],
        "newlines-between": "always", // グループ間に空行を入れる
        "alphabetize": {
          "order": "asc" // アルファベット順に並び替え
        }
      }
    ],
    "eqeqeq": ["error", "always"], // 厳密等価演算子（===）の使用を強制
    "curly": ["error", "all"], // 中括弧の使用を強制
    // コード間の空行を制御
    "padding-line-between-statements": [
      "error",
      {
        "blankLine": "always",
        "prev": "*",
        "next": "return"
      }, // return前に空行
      {
        "blankLine": "always",
        "prev": ["const", "let", "var"],
        "next": "*"
      }, // 変数宣言後に空行
      {
        "blankLine": "any",
        "prev": ["const", "let", "var"],
        "next": ["const", "let", "var"]
      } // 連続する変数宣言は空行不要
    ]
  }
}
```

この設定により以下が実現できます：

1. **コードの品質管理**

   - TypeScriptの型チェックの厳格化
   - React/React Hooksのベストプラクティスの強制
   - 一貫したimport/exportの順序付け

2. **importの整理**

   - モジュールの種類によるグループ化
   - グループ間の空行による視認性の向上
   - アルファベット順での整列

3. **Prettierとの連携**
   - コードフォーマットに関するルールはPrettierに委譲
   - ESLintとPrettierの競合を防止

これらの設定は、チーム開発での一貫性のあるコードベース維持に役立ちます。

`.prettierrc`の設定：

```json
{
  "semi": true, // 文末にセミコロンを追加
  "trailingComma": "es5", // 複数行の場合、最後の要素にカンマを追加（ES5互換）
  "doubleQuote": true, // 文字列をダブルクォートで囲む
  "printWidth": 100, // 1行の最大文字数
  "tabWidth": 2, // インデントのスペース数
  "useTabs": false, // スペースでインデント（タブ文字を使用しない）
  "endOfLine": "lf", // 改行コードをLF（Unix/Linux形式）に統一
  "arrowParens": "avoid", // アロー関数の引数が1つの場合はカッコを省略
  "bracketSpacing": true, // オブジェクトリテラルの括弧の間にスペースを入れる
  "quoteProps": "as-needed", // オブジェクトのプロパティ名のクォートは必要な場合のみ
  "jsxSingleQuote": false, // JSXではダブルクォートを使用
  "bracketSameLine": false, // JSX要素の閉じ括弧は改行して配置
  "proseWrap": "preserve" // マークダウンの折り返しを保持
}
```

VSCodeの設定（`.vscode/settings.json`）：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 2. UIライブラリ（shadcn/ui）のセットアップ

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
