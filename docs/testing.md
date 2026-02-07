# テスト設計書

## 目次

1. [概要](#1-概要)
2. [テスト戦略](#2-テスト戦略)
    - [2.1 テストピラミッド](#21-テストピラミッド)
    - [2.2 CI/CD と GitHub Actions での自動実行](#22-cicd-と-github-actions-での自動実行)
    - [2.3 テスト戦略の補足](#23-テスト戦略の補足)
3. [テスト項目一覧](#3-テスト項目一覧)
    - [3.1 APIサービス層の単体テスト（高優先度）（未実装）](#31-apiサービス層の単体テスト高優先度未実装)
    - [3.2 セキュリティテスト（高優先度）（未実装）](#32-セキュリティテスト高優先度未実装)
    - [3.3 型安全性テスト（高優先度）](#33-型安全性テスト高優先度)
    - [3.4 ビルドテスト（高優先度）](#34-ビルドテスト高優先度)
    - [3.5 コード品質テスト（高優先度）](#35-コード品質テスト高優先度)
    - [3.6 E2Eテスト（低優先度）（リリース前のみ）](#36-e2eテスト低優先度リリース前のみ)
4. [テスト/CIで使用するアーキテクチャ・ツール一覧](#4-テストciで使用するアーキテクチャツール一覧)
    - [4.1 アーキテクチャ（実行方針）](#41-アーキテクチャ実行方針)
    - [4.2 GitHub Actions（CI/CD）](#42-github-actionscicd)
    - [4.3 テスト/品質ツール](#43-テスト品質ツール)
    - [4.4 プラットフォーム/ランタイム](#44-プラットフォームランタイム)

## 1. 概要

本ドキュメントは Singularity Lab Portal アプリケーションのテスト設計について記載します。

## 2. テスト戦略

### 2.1 テストピラミッド

```text
    E2E Tests (少数)
  Integration Tests (中程度)
Unit Tests (多数) - Component Tests
```

### 2.2 CI/CD と GitHub Actions での自動実行

| Workflow | 目的 | 主な実行内容 | トリガー |
| --- | --- | --- | --- |
| Build Test (`.github/workflows/build.yml`) | Next.js ビルドが本番相当で成立するかを検証 | Node.js 22.x で `npm ci` → `npm run build` | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |
| TypeScript Type Check (`.github/workflows/typecheck.yml`) | 型安全性と ESLint ルール違反の早期検出 | Node.js 22.x で `npm ci` → `npx tsc --noEmit` → `npm run lint` | `push` / `pull_request`（`app/**`, `*.ts(x)` 等）、`workflow_dispatch` |
| Jest Unit Tests (`.github/workflows/test.yml`) | ユニットテストとカバレッジ確認 | Node.js 22.x で `npm ci` → `npm test` (Jest) | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |
| Check console.log and debugger (`.github/workflows/check_console_log.yml`) | デバッグ用出力を混入させないための静的検査 | `find` + `grep` で `console.log/info` と `debugger` を検出し、許可済み箇所以外が見つかれば失敗 | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |

各ワークフローは軽量ジョブとして独立しており、失敗すると PR 上で即座にフィードバックされる。テスト設計上は、ローカルで同じ npm スクリプトを再現できるよう `test`, `lint`, `build` を常に最新手順に揃える。

### 2.3 テスト戦略の補足

- **目的の明確化**: 早期検知（Unit/Type/Lint）、統合の破綻検知（Integration/E2E）、運用品質の維持（RLS/外部API/パフォーマンス）を層で分離し、同じ不具合を重複検知しない。
- **優先度の考え方**: 変更頻度・影響範囲・障害コストで評価し、APIサービス層と認証/認可は最優先、UIはコア動線から段階的に拡張する。
- **実行タイミング**: PR では短時間で回るテスト（Unit/Type/Lint/Build）を必須とし、リリース前に対象を絞った確認を実施する。
- **テストデータ方針**: 可能な限りモック/スタブで独立性を確保し、外部依存を叩く統合テストは専用環境＋シードデータで再現性を担保する。
- **可観測性**: 失敗時に原因特定ができるよう、テスト名・ログ・スクリーンショット/トレース・レポート（Coverage/Artifacts）を残す運用を前提とする。

## 3. テスト項目一覧

### 3.1 APIサービス層の単体テスト（高優先度）（未実装）

データの整合性とビジネスロジックの正確性を確保する

#### 3.1.0 実施区分（PR / リリース前）

- **PRで必須**: `lint` / `tsc` / `build` / **最小限の unit**（変更箇所に限定）
- **リリース前のみ**: 影響範囲の広い箇所に絞った **簡易網羅テスト**（開発用DB・ローカルで実施）

リリース前の実施方法（簡易）:

1. 変更点と依存機能を洗い出し
2. 代表シナリオ（1〜2本）で動作確認
3. 例外系は代表ケースのみ実施（全網羅はしない）
4. 結果をPRコメントまたはリリースノートに記載

#### テストポイント:

- **重複排除**: 認証・認可・承認フローの検証は **単体 / 統合 / E2E のいずれか1レイヤー** に集約する。
- **簡素化**: エラーハンドリングは **代表ケースのみ** を確認し、全関数での網羅は行わない。
- **認可/RLS/承認**: セキュリティ観点の詳細な検証項目は 3.2 に集約する。
- **CRUD操作**: 作成・読込・更新・削除の正常動作（代表ケース）
- **バリデーション**: 入力値検証（代表ケース）
  
- **エラー処理**: ネットワークエラー、DB制約違反時の適切な処理  
  代表的な失敗（例: ネットワーク、制約違反）のみ確認する。
  
- **戻り値**: 期待する型・構造でのレスポンス  
  代表レスポンスが想定スキーマ（shape）に準拠することを確認する。

#### 対象領域（最小範囲）:

- コンテンツ取得（一覧・詳細）
- コンテンツ管理（登録・更新・削除）
- ユーザー管理（登録・承認）
- 参照系マスタ（カテゴリ等）

#### 実装手順と進め方

- まずは変更箇所のサービスから 1〜2 本だけユニットテストを追加する。
- Supabase/外部依存はモックし、正常系 + 代表的な失敗を各 1 ケースずつに絞る。
- リリース前にだけ、影響範囲が広い箇所を追加でつまむ（全網羅はしない）。

### 3.2 セキュリティテスト（高優先度）（未実装）

認証・認可システムの安全性を確保する。  
PR では Jest のユニット検証（ガード/判定ロジック中心）を優先する。  

#### テストポイント:

- **認証制御**: 未認証ユーザーのアクセス阻止  
  `middleware.ts` のリダイレクト制御（`/login`）が正しく機能する。
  
- **認可制御**: ロール別機能制限（admin / maintainer / member）  
  `app/services/auth/permissions.ts` の `checkAdminPermissions` / `checkContentPermissions` がロールごとに期待どおりの boolean を返す。
  
- **データアクセス**: Row Level Security (RLS) による適切なデータ分離  
  RLS ポリシーは Supabase（DB）側の責務として設定し、アプリ側ではポリシー前提で実装する（自動テストは未実装）。
  
- **承認ステータス制御**: `pending` / `rejected` ユーザーのガード  
  `middleware.ts` が `fetchUserStatusByIdInServer` の結果に応じて `/pending` / `/rejected` へリダイレクトする。
  
- **セッション管理**: ログイン状態の正確な管理  
  未認証（期限切れ含む）で保護ページにアクセスした場合に `/login` に誘導される。
  
### 3.3 型安全性テスト（高優先度）

TypeScript型定義の整合性を確保する

#### テストポイント:

- **データベース型**: スキーマと型定義の一致（未実装）  
  `npm run db:types` で再生成し、`git diff --exit-code app/types/lib/database.types.ts` を確認。  
  CI への組み込みは未実装。  
  
- **コンポーネント型**: Props型定義の正確性  
  `npx tsc --noEmit` と `npm run lint` を実行し、TypeScript 上の型不整合や ESLint の型ベースルールチェックを行う  
  
### 3.4 ビルドテスト（高優先度）

本番デプロイ前のビルドエラーを検出する

#### テストポイント:

- **ビルドが通る**: `.github/workflows/build.yml` で `npm run build` が完走する。
- **依存関係が揃う**: `npm ci` が lockfile どおりに成功する。
  
### 3.5 コード品質テスト（高優先度）

保守性とコード品質を維持する

#### テストポイント:

- **デバッグコード除去**: console.log、debugger文の検出  
  `.github/workflows/check_console_log.yml` が `find` + `grep` で `console.log/info` や `debugger` を走査し、許可されていない出力を検出するとジョブを失敗させる。  
  
- **コーディング規約**: ESLintルール準拠  
  `.github/workflows/typecheck.yml` が `npm run lint` を実行し、ルール違反を検出する。  
  
- **未使用コード**: 不要なimport・関数・変数の検出  
  `.github/workflows/typecheck.yml` 内で実行する `npm run lint` が `eslint-plugin-import` や `no-unused-vars` 等のルールを通じて未使用コードを検知する。  
  
- **型安全性**: TypeScriptの型エラー検出  
  `.github/workflows/typecheck.yml` で `npx tsc --noEmit` を実行し、型エラー発生時にはジョブを失敗させる。  
  
- **フォーマッタ整合**: Prettier などの自動整形ルールからの逸脱検知 *（未実装）*  
  将来的に `format:check`/`format` スクリプトを追加し、CI と pre-commit Hook で整形逸脱を検知する運用を想定している。  

- **依存関係健全性**: 未使用/未宣言 dependency, security fix の検出 *（未実装）*  
  コード品質ジョブの末尾に、使用していない依存や既知の脆弱性を検出する仕組みを追加することを想定している。  
  検出結果の扱い（アーティファクト化や fail 判定のしきい値）は運用負荷とのバランスで決定する。  
  
### 3.6 E2Eテスト（低優先度）（リリース前のみ）

実ユーザー視点の**主要ジャーニー1〜2本**のみを、**単一ブラウザ**で実施する。複数ブラウザ・全網羅は行わない。

## 4. テスト/CIで使用するアーキテクチャ・ツール一覧

### 4.1 アーキテクチャ（実行方針）

- **テストピラミッド**:  
  Unit → Integration → E2E の層構造で、上位ほど本数を絞る。  
  
- **PR / リリース前**:  
  PR では短時間テストを必須とし、E2E/大規模統合はリリース前に対象を絞って実行する。  
  
- **モック優先**:  
  外部依存はモックで隔離し、必要な統合確認はリリース前に対象を絞って実施する。

### 4.2 GitHub Actions（CI/CD）

- **Build**:  
  `.github/workflows/build.yml`（`npm run build`）  

- **Type Check + Lint**:  
  `.github/workflows/typecheck.yml`（`npx tsc --noEmit`, `npm run lint`）  

- **Unit Test**:  
  `.github/workflows/test.yml`（`npm test`）  

- **Console/Debugger 検出**:  
  `.github/workflows/check_console_log.yml`  

### 4.3 テスト/品質ツール

#### 導入済み

- **Jest**: ユニットテスト実行基盤
- **TypeScript**: 型チェック（`tsc --noEmit`）
- **ESLint**: 静的解析
- **Supabase CLI**: 型生成・スキーマ整合性確認

### 4.4 プラットフォーム/ランタイム

- **Node.js 22.x**: CI 実行環境
- **Next.js Build**: 本番ビルド互換の検証
