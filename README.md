# シンギュラリティ・ラボ ポータルサイト

シンギュラリティ・ラボ（シンラボ）会員向けポータルサイトです。本サイトは、会員限定のコンテンツ（資料・動画等）の提供や、会員同士の交流を促進することを目的にしています。

本サイトはシンラボ内の希望者で開発しています。
本開発を通じて、Webアプリ開発のスキルアップやチーム開発のノウハウを身につけます。

本開発には、[シンギュラリティ・ラボ](https://sinlab.future-tech-association.org/join/)（シンラボ）に入会頂いた方のみ参画いただけます。

詳細は[チーム開発ガイドライン](https://github.com/Singuralitylabs/team-development)をご参照ください。

## 主な機能

- Google認証による会員管理 - Supabase Authを使用した安全な認証
- 資料 - 申請フォームや各種ドキュメントへのアクセス
- 動画 - 学習教材等の各種動画の閲覧
- アプリ - メンバーが開発したアプリの共有
- 会員 - シンラボメンバー同士の交流促進用ページ
- コンテンツ管理 - 管理者・メンテナー向けの編集機能
- カテゴリー管理 - 資料/動画/アプリ用カテゴリーの追加・編集・削除
- カレンダー - シンラボイベントやシンラボMTGおよび日本の祝祭日を統合したカレンダー

## 技術スタック

### フロントエンド

- Next.js 15 (App Router) - Reactフレームワーク
- TypeScript - 型安全性の確保
- Tailwind CSS - ユーティリティファーストなスタイリング
- Mantine UI - UIコンポーネントライブラリ

### バックエンド/インフラ

- Supabase Auth - Google OAuth認証
- Supabase (PostgreSQL) - データベース
- Row Level Security (RLS) - データアクセス制御
- Vercel - ホスティング

### 開発ツール

- ESLint & Prettier - コード品質管理
- GitHub Actions - CI/CD
- Git/GitHub - バージョン管理
- GitHub copilot - 生成AIによるコードレビュー
- Jest - テストフレームワーク

## プロジェクト構成

```
portal-site/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ（ログイン、コールバックなど）
│   ├── (authenticated)/   # 認証済みユーザー向けページ
│   ├── services/          # APIクライアント（Supabase連携）
│   ├── types/             # TypeScript型定義
│   ├── api/               # 外部サービスとのAPI連携
│   └── constants/         # 定数定義
├── docs/                  # プロジェクトドキュメント
│   ├── setup.md           # 環境構築手順
│   ├── database.md        # データベース設計書
│   ├── specification.md   # 機能仕様書
│   └── testing.md         # テスト設計書
├── supabase/              # Supabaseマイグレーション
│   ├── migrations/        # DBマイグレーションファイル
│   └── README.md          # Supabase設定ガイド
├── tests/                 # テストコード
│   └── *.test.ts          # 各種テストコード
└── public/                # 静的ファイル
```

## 開発環境の構築

開発環境のセットアップ方法については、[環境構築手順](docs/setup.md)を参照してください。

## 開発フロー

本開発フローの詳細は、[ポータルサイト開発フロー](https://github.com/Singuralitylabs/portal-site/wiki/%E3%83%9D%E3%83%BC%E3%82%BF%E3%83%AB%E3%82%B5%E3%82%A4%E3%83%88%E9%96%8B%E7%99%BA%E3%83%95%E3%83%AD%E3%83%BC)をご覧ください。

## 必要なスキル

本プロジェクトに参加するには、以下の基礎スキルが必要です（最低限の知識があれば問題ありません）。

- HTML/CSSの基本的な理解
- JavaScriptの基本構文とES6機能
- React/Next.jsの基本的な理解
- Git/GitHubの基本操作

上記スキルは、シンラボ内で提供している講座でも学習することができます。

## 参考資料

プロジェクトに関する詳細については、下記ドキュメントをご参照下さい。

- [環境構築手順](docs/setup.md) - 開発環境のセットアップ方法
- [データベース設計](docs/database.md) - テーブル構造とRLSポリシー
- [機能仕様書](docs/specification.md) - 各機能の詳細仕様
- [テスト設計](docs/testing.md) - テスト戦略と項目
- [Supabaseガイド](supabase/README.md) - Supabaseの設定と使い方
- [開発フロー](https://github.com/Singuralitylabs/portal-site/wiki/%E3%83%9D%E3%83%BC%E3%82%BF%E3%83%AB%E3%82%B5%E3%82%A4%E3%83%88%E9%96%8B%E7%99%BA%E3%83%95%E3%83%AD%E3%83%BC) - 開発の進め方
- [コーディング規約](https://github.com/Singuralitylabs/portal-site/wiki/%E3%82%B3%E3%83%BC%E3%83%87%E3%82%A3%E3%83%B3%E3%82%B0%E8%A6%8F%E7%B4%84) - コーディングを行う上でのルール

## ライセンス

本ポータルサイトのライセンスは[未来技術推進協会](https://future-tech-association.org/)に帰属します。
