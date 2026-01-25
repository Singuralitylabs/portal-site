# テスト設計書

## 目次

1. [概要](#1-概要)
2. [テスト方針](#2-テスト方針)
    - [2.1 テストピラミッドと優先度](#21-テストピラミッドと優先度)
    - [2.2 実行タイミング（PR / リリース前）](#22-実行タイミングpr--リリース前)
    - [2.3 テストデータ方針](#23-テストデータ方針)
    - [2.4 可観測性](#24-可観測性)
3. [テスト対象と観点](#3-テスト対象と観点)
    - [3.1 サービス層ユニットテスト（未実装）](#31-サービス層ユニットテスト未実装)
    - [3.2 セキュリティテスト（未実装）](#32-セキュリティテスト未実装)
    - [3.3 型安全性テスト](#33-型安全性テスト)
    - [3.4 ビルドテスト](#34-ビルドテスト)
    - [3.5 コード品質テスト](#35-コード品質テスト)
    - [3.6 E2Eテスト（未実装・リリース前のみ）](#36-e2eテスト未実装リリース前のみ)
4. [CI / ツール構成](#4-ci--ツール構成)
    - [4.1 GitHub Actions ワークフロー](#41-github-actions-ワークフロー)
    - [4.2 導入済みツール](#42-導入済みツール)
    - [4.3 実行環境](#43-実行環境)
5. [テスト規約](#5-テスト規約)

## 1. 概要

本ドキュメントは Singularity Lab Portal アプリケーションのテスト方針、テスト対象と観点、CI/ツール構成を整理する。

## 2. テスト方針

### 2.1 テストピラミッドと優先度

```text
    E2E Tests (少数)
  Integration Tests (中程度)
Unit Tests (多数)
```

- **狙い**: 変更頻度が高く壊れやすい領域は Unit/静的検査で早期に検知し、統合・E2E は本数を絞って「破綻していないこと」を確認する。
- **優先度の決め方**: 変更頻度・影響範囲・障害時コストの観点で、認証/認可、データ整合性、ビルド成立性を優先する。

<<<<<<< HEAD
### 2.2 実行タイミング（PR / リリース前）
=======
| Workflow | 目的 | 主な実行内容 | トリガー |
| --- | --- | --- | --- |
| Build Test (`.github/workflows/build.yml`) | Next.js ビルドが本番相当で成立するかを検証 | Node.js 22.x で `npm ci` → `npm run build` | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |
| TypeScript Type Check (`.github/workflows/typecheck.yml`) | 型安全性と ESLint ルール違反の早期検出 | Node.js 22.x で `npm ci` → `npx tsc --noEmit` → `npm run lint` → `npm run lint:unused-exports`（未実装） | `push` / `pull_request`（`app/**`, `*.ts(x)` 等）、`workflow_dispatch` |
| Jest Unit Tests (`.github/workflows/test.yml`) | ユニットテストとカバレッジ確認 | Node.js 22.x で `npm ci` → `npm test` (Jest) | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |
| Check console.log and debugger (`.github/workflows/check_console_log.yml`) | デバッグ用出力を混入させないための静的検査 | `find` + `grep` で `console.log/info` と `debugger` を検出し、許可済み箇所以外が見つかれば失敗 | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |
| Supabase DB Types Consistency（未実装） (`.github/workflows/db-types.yml`) | DBスキーマと型定義の同期を確認 | `npx supabase gen types` → `git diff --quiet app/types/lib/database.types.ts` で差分検知 | `push` / `pull_request`（`supabase/**`, `app/types/lib/database.types.ts` 等）、`workflow_dispatch` |

各ワークフローは軽量ジョブとして独立しており、失敗すると PR 上で即座にフィードバックされる。テスト設計上は、ローカルで同じ npm スクリプトを再現できるよう `test`, `lint`, `build` を常に最新手順に揃え、必要に応じて追加ジョブ（例: カバレッジ収集や Storybook ビルド）をこの一覧に追記する。

### 2.3 テスト戦略の補足

- **目的の明確化**: 早期検知（Unit/Type/Lint）、統合の破綻検知（Integration/E2E）、運用品質の維持（RLS/外部API/パフォーマンス）を層で分離し、同じ不具合を重複検知しない。
- **優先度の考え方**: 変更頻度・影響範囲・障害コストで評価し、APIサービス層と認証/認可は最優先、UIはコア動線から段階的に拡張する。
- **実行タイミング**: PR では短時間で回るテスト（Unit/Type/Lint/Build）を必須、E2E/負荷/大規模統合は Nightly で実施して開発速度と安全性を両立させる。(夜間実行は未実装)
- **テストデータ方針**: 可能な限りモック/スタブで独立性を確保し、外部依存を叩く統合テストは専用環境＋シードデータで再現性を担保する。
- **可観測性**: 失敗時に原因特定ができるよう、テスト名・ログ・スクリーンショット/トレース・レポート（Coverage/Artifacts）を残す運用を前提とする。

## 3. テスト項目一覧

### 3.1 APIサービス層の単体テスト（高優先度）（未実装）

データの整合性とビジネスロジックの正確性を確保する

#### テストポイント:

- **CRUD操作**: 作成・読込・更新・削除の正常動作
  Supabase クライアントを `jest.mock("@supabase/supabase-js")` で差し替え、サービス関数を呼び出して `insert/select/update/delete` のペイロード・戻り値を `expect(mockClient.from(...).insert).toHaveBeenCalledWith(...)` のように検証する。
  成功/失敗パスを `mockResolvedValueOnce` と `mockRejectedValueOnce` で切り替え、例外ハンドリングも確認する。
  
- **バリデーション**: 入力値検証とエラーハンドリング
  Zod などのバリデーションレイヤーをテスト対象に含め、Jest で不正データを与えて `expect(() => schema.parse(badPayload)).toThrow()`、サービス関数では `rejects.toThrow(ValidationError)` を使って検証し、エラーメッセージや HTTP ステータス変換処理まで網羅する。

- **権限チェック**: 認証・認可の適切な制御
  `jest.spyOn(authProvider, "getSession")` などでユーザーのロール/権限を差し替え、サービス呼び出し時に `ForbiddenError` を投げるか、RLS 対象のクエリフィルタが適切な条件（`eq("organization_id", user.orgId)` など）になっているかをアサートする。

- **エラー処理**: ネットワークエラー、DB制約違反時の適切な処理
  Supabase SDK の戻り値を `{ error: { message: "duplicate key" } }` などにモックし、サービスが再スロー／リトライ／ユーザー向けメッセージ変換を行うか `expect(handleError).toHaveBeenCalledWith(...)` で確認する。
  `Promise.reject(new Error("fetch failed"))` を投げてリトライポリシーのテストも実施する。

- **戻り値**: 期待する型・構造でのレスポンス
  テスト内で `await service.getDocuments()` などを実行し、`expect(result).toMatchObject({ data: expect.arrayContaining([...]) })` でスキーマ準拠を確認。
  Zod で `schema.parse(result)` を通すか、`expectTypeOf` (tsd) で静的保証を追加すると型崩れを検知できる。

- **外部サービス呼び出しのリトライ／デグレード**: Google Calendar や Slack など外部依存の安定運用
  `jest.useFakeTimers()` と `fetchMock.mockRejectedValueOnce(new Error("ETIMEDOUT"))` を組み合わせ、タイムアウト時に再試行ロジックが `setTimeout` 経由で実行されるかを `expect(fetchMock).toHaveBeenCalledTimes(retryCount)` で確認。
  すべて失敗した場合にはフォールバック（空配列返却や通知スキップ）が動作し、警告ログが出るかを `expect(logger.warn).toHaveBeenCalled()` で検証する。

- **フィルタリング／スコーピング**: RLS と同等の条件付与・権限に応じたデータ制限
  Supabase クエリビルダーのモックに対して `expect(mockClient.from("documents").select).toHaveBeenCalledWith(expect.stringContaining("is_deleted"))` のように条件が付与されるかを検証し、戻り値側も `expect(result.data).every(item => item.status === "active")` でフィルタ済みか確認する。
  管理者・一般ユーザーの両ケースを `describe.each` で用意し、権限によってスコープが変わることを担保する。

#### 対象領域:

- ドキュメント管理機能（登録・削除）
- ユーザー管理機能（新規登録・ステータス取得）
- データ取得機能（一覧・詳細）
- 動画管理機能（登録・更新・削除）
- アプリ紹介機能（アプリ登録・表示順制御）
- カテゴリー／役職タグ参照機能（`categories`, `positions`, `position_tags`）
- カレンダーイベント取得サービス（Google Calendar API 連携）
- Slack通知サービス（新規ユーザー登録時の通知送信）

#### 実装手順と進め方

- **テスト対象の分割**: `app/services/api/*` ごとに `tests/services/<service>.test.ts` を置き、CRUD/認可/通知など重要ロジックから優先実装する。3.1 のテストポイントをそのまま `describe` 単位のチェックリストにすると抜け漏れを抑えられる。
- **Supabase モックの共通化**: `jest.mock("@supabase/supabase-js")` あるいは `createClientSupabaseClient` をスパイして、`from().select()` などの戻り値を `setupSupabaseMock` ヘルパーで注入する。`afterEach(jest.clearAllMocks)` を挟み、副作用を持つ外部 API は `msw` や `fetchMock` で差し替える。
- **成功/失敗パス網羅**: 各サービス関数で「正常系」「バリデーション例外」「Supabase error」「権限不足」などを最低 1 ケースずつ書く。`describe.each` でロールやカテゴリーの表を回し、RLS やフィルタ条件を検証する。
- **外部連携/リトライの検証**: Google Calendar や Slack の呼び出しは `jest.useFakeTimers()` と `mockRejectedValueOnce` を組み合わせ、リトライ回数やフォールバック挙動、`logger.warn` 等のログ呼び出しを期待値に含める。必要なら `Promise.all` で並列エラーも再現する。
- **スキーマ/型整合の確認**: Zod などのスキーマを import し、`expect(() => schema.parse(badPayload)).toThrow()` や `await expect(serviceFn(badArgs)).rejects.toThrow()` を追加。型安全性は `expectTypeOf`（tsd）や `satisfies` を併用し、戻り値の shape を `toMatchObject` で検査する。
- **継続的実行**: `npm test -- tests/services/<service>.test.ts` で逐次実行し、十分に揃ったら `npm test` へ統合。進捗は docs/testing.md のチェックリストと同期させ、完了したサービスから TODO を消し込む。

### 3.2 セキュリティテスト（高優先度）（未実装）

認証・認可システムの安全性を確保する。
Next.js `middleware.ts` と `AuthLayout` は Jest/TS-Jest でユニット検証し、Playwright で実際のブラウザ遷移を確認する。
Supabase 側はテスト用プロジェクト（サービスロールキーを GitHub Actions Secret `SUPABASE_SERVICE_ROLE_TEST` に設定）に対して `supabase-js` を用いた統合テストを走らせる。
`npm run test:security` を Jest の projects に追加し、`.github/workflows/test.yml` で `npm test -- --selectProjects security` を実行して CI で常時監視する想定。

#### テストポイント:

- **認証制御**: 未認証ユーザーのアクセス阻止
  `middleware.test.ts` で `new NextRequest(new URL("https://example.com/documents"))` を作成し、`process.env.SUPABASE_ANON_KEY` 未設定状態で `middleware` を実行して `NextResponse.redirect("/login")` になるかを検証する。
  Playwright では `test("redirect unauthenticated", async ({ page }) => { await page.context().clearCookies(); await page.goto("/documents"); await expect(page).toHaveURL(/login/); });` のようにミドルウェアと Layout の組み合わせを確認し、`consoleMessage` にエラーが無いことも `page.on("console")` で捕捉する。

- **認可制御**: ロール別機能制限（管理者・メンバー）
  `authz.test.ts` で `canAccess(resource, role)` ヘルパーをテーブルテストし、未定義ロール時に `UnauthorizedError` を投げるかチェックする。
  Playwright では `test.describe("role matrix", () => { test.use({ storageState: "storage/admin.json" }) ... })` を使い、管理者のみが `/admin/users` にアクセスできること、メンバーの場合は `/403` にリダイレクトされることを `await expect(page).toHaveURL(/403/)` で確認する。
  MSW を活用し、API レベルでも `x-role` ヘッダーによる分岐が正しく機能するかを `expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({ headers: expect.objectContaining({ "x-role": "member" }) }))` で検証する。

- **データアクセス**: Row Level Security (RLS) による適切なデータ分離
  Supabase のテスト環境で `supabase.auth.admin.createUser` → `client.from("documents").select("*")` をロール別に実行し、RLS ポリシーにより他組織のデータが返らないことを `expect(result.data.every(row => row.organization_id === orgIdOfUser))` で確認する。
  必要に応じて `supabase migrate up --db-url` でローカルにシードした DB を立ち上げ、`pgTAP` で `SELECT has_rls('public.documents')` のようなポリシーテストも自動化する。
  Playwright では API をモックせず実際に Supabase を叩く `@security` タグ付き e2e を夜間ジョブのみ実行し、ネットワークログに異常レスポンスが無いか `await expect(response).toHaveStatus(200)` + `expect(await response.json()).toSatisfy(...)` で確認する。

- **承認ステータス制御**: `pending` / `rejected` ユーザーのガード
  サーバー側の `assertApprovedUser(user)` ヘルパーに対して Jest で `pending` → `ApprovalRequiredError`、`rejected` → `AccessRejectedError` となるかをテストし、Playwright では `storageState: "storage/pending.json"` の状態で `/` へアクセスした際に承認待ちページへ遷移し続けるかを確認する。
  Slack 通知 API へは `page.route("**/api/notifications/slack", route => route.fulfill({ status: 204 }))` を使って副作用を抑止しつつ、通知失敗時でも承認処理が継続することを `expect(page.getByText("通知に失敗しました")).not.toBeVisible()` で検証する。

- **セッション管理**: ログイン状態の正確な管理
  `authSession.test.ts` で `supabase.auth.onAuthStateChange` のコールバックを `jest.fn()` で捕捉し、`signOut` 後に `router.push("/login")` が呼ばれるかを確認する。
  ブラウザ側は Playwright で `await page.context().storageState()` を取得し、`access_token` の `exp` を `Date.now()` と比較して期限切れ状態を再現、`await page.reload()` 後に `await expect(page).toHaveURL(/login/)` となることを確かめる。
  さらに `supabase.auth.refreshSession` を MSW で 401 応答にして、強制ログアウトトーストが表示されるかを `await expect(page.getByText("再ログインが必要です")).toBeVisible()` で検証する。

### 3.3 型安全性テスト（高優先度）

TypeScript型定義の整合性を確保する

#### テストポイント:

- **データベース型**: スキーマと型定義の一致（未実装）
  `npm run db:types` で再生成し、`git diff --exit-code app/types/lib/database.types.ts` を確認。
  CI は `.github/workflows/db-types.yml` が同手順を自動実行（db-types.yml実装待ち）

- **API契約**: リクエスト・レスポンス型の整合性（未実装）
  OpenAPI 仕様や Zod スキーマを単一ソースとして定義し、`openapi-typescript` / `orval` などで型を生成 → API ハンドラでは生成型と Zod バリデーションを併用し、Jest で `expect(schema.parse(mockResponse))` を実行して契約違反を検出する。
  CI ではスキーマ生成コマンドと契約テストをワークフローに組み込み、差分や失敗時にブロックする。

- **コンポーネント型**: Props型定義の正確性
  `npx tsc --noEmit` と `npm run lint` を実行し、TypeScript 上の型不整合や ESLint の型ベースルールチェックを行う

### 3.4 ビルドテスト（高優先度）

本番デプロイ前のビルドエラーを検出する

#### テストポイント:
>>>>>>> テスト設計書の未実装事項の修正反映

PR では短時間で完了するチェックを必須とし、リリース前は範囲を絞った確認を追加する。

- **PR（原則）**: 変更内容に応じて CI が自動実行される（型チェック、Lint、ビルド、ユニットテスト、デバッグ出力検知）。
- **リリース前**: 影響範囲が広い変更（例: 認証/認可、データ参照、主要画面の動線）に対して、主要フローの手動確認（または最小限のE2E）を追加する。

CI のワークフロー一覧は [4.1 GitHub Actions ワークフロー](#41-github-actions-ワークフロー) に記載する。

### 2.3 テストデータ方針

- **原則**: Unit テストはモック/スタブで独立性を確保し、外部依存は直接叩かない。
- **統合確認が必要な場合**: 専用環境とシードデータを前提に、対象を最小限に絞って再現性を担保する。

### 2.4 可観測性

- **失敗時の調査容易性**: テストが失敗した際に原因を素早く特定できるよう、
  確認観点ごとにチェックを分離し、テスト名やジョブ名から目的が読み取れる命名にする。
- **ログの扱い**: 開発時のデバッグ出力（`console.log` 等）がコードに残った場合は
  CIで検知してエラーにする。一方、障害調査に必要なログ（エラーログ等）は意図的に残す。

<<<<<<< HEAD
## 3. テスト対象と観点

### 3.1 サービス層ユニットテスト（未実装）

サービス層（ビジネスロジック）の正しさを、外部I/Oから切り離して確認する。
=======
- **デバッグコード除去**: console.log、debugger文の検出
  `.github/workflows/check_console_log.yml` が `find` + `grep` で `console.log/info` や `debugger` を走査し、許可されていない出力を検出するとジョブを失敗させる。
  ローカルでの `npm run lint:logs` 運用は未実装のため、導入後に pre-commit Hook へ組み込み、開発段階で検知できるようにする。

- **未使用コード**: 不要なimport・関数・変数の検出
  `.github/workflows/typecheck.yml` 内で実行する `npm run lint` が `eslint-plugin-import` や `no-unused-vars` 等のルールを通じて未使用コードを検知する。
  `npm run lint:unused-exports` の運用は未実装のため、導入後に同ワークフローへ追加し、`UNUSED_EXPORTS_STRICT=true` の切り替えで CI を fail させる運用を想定する。

- **コーディング規約**: ESLintルール準拠
  同じく `npm run lint` により、プロジェクトの ESLint 設定（`eslint-config-next`, `eslint-config-prettier` など）へ違反したコードを検出する。
  `eslint --max-warnings=0` を標準に設定し、`lint-staged` で `next lint --fix` を自動適用する運用は導入後に検討する。
>>>>>>> テスト設計書の未実装事項の修正反映

- **観点**
  - 代表的な正常系（CRUDの代表ケース）
  - 入力のバリデーション（代表ケース）
  - 戻り値の型・構造が想定どおりであること（代表レスポンス）
  - 代表的な失敗（例: ネットワーク失敗、制約違反）時の扱い
- **対象領域（最小範囲の例）**
  - コンテンツ取得（一覧・詳細）
  - コンテンツ管理（登録・更新・削除）
  - ユーザー管理（登録・承認）
  - 参照系マスタ（カテゴリ等）
- **実行タイミング**: [2.2 実行タイミング](#22-実行タイミングpr--リリース前) に従う。

<<<<<<< HEAD
### 3.2 セキュリティテスト（未実装）

認証・認可・承認ステータスの制御が、意図した振る舞いを満たすことを確認する。
=======
- **フォーマッタ整合**: Prettier などの自動整形ルールからの逸脱検知 *（未実装）*
  将来的に `format:check`/`format` スクリプトを追加し、CI と pre-commit Hook で整形逸脱を検知する運用を想定している。

- **依存関係健全性**: 未使用/未宣言 dependency, security fix の検出 *（未実装）*
  コード品質ジョブの末尾に、使用していない依存や既知の脆弱性を検出する仕組みを追加することを想定している。
  検出結果の扱い（アーティファクト化や fail 判定のしきい値）は運用負荷とのバランスで決定する。
>>>>>>> テスト設計書の未実装事項の修正反映

本プロジェクトのセキュリティテストは、**単体で確認できる部分はユニット**、**実際の認証フローに関わる部分は統合/ E2E**に分類する。

- **観点**

| 観点 | CI（自動） | 手動 |
| --- | --- | --- |
| 認証制御 | 認証ヘルパー関数の判定ロジック | 未認証ユーザーのリダイレクト |
| 認可制御 | 権限判定ロジック（ロール別の許可/拒否） | UI・ミドルウェアでのアクセス制御 |
| 承認ステータス制御 | ステータス判定ロジック（pending/rejected） | 画面遷移の正当性 |
| データアクセス | ―（ユニットでは検証困難） | RLSによるデータ分離 |

- **実行タイミング**: [2.2 実行タイミング](#22-実行タイミングpr--リリース前) に従う。

### 3.3 型安全性テスト

TypeScript と型生成の運用によって、型の破綻を早期に検知する。

- **観点**
  - **コンポーネント/ロジック型**: 型チェックと静的解析により型不整合を検知する
  - **データベース型（未実装）**: 型生成の実行と差分確認により、スキーマと型定義の整合性を保つ

- **実行タイミング**: [2.2 実行タイミング](#22-実行タイミングpr--リリース前) に従う。

### 3.4 ビルドテスト

本番相当のビルドが成立することを確認する。

- **観点**
  - 本番相当のビルドが完走する
  - 依存関係のインストールが lockfile どおりに成功する

- **実行タイミング**: [2.2 実行タイミング](#22-実行タイミングpr--リリース前) に従う。

### 3.5 コード品質テスト

デバッグ用出力の混入を早期に検知する。

- **観点**
  - **デバッグ出力**: `console.log` / `console.info` / `debugger` の混入を検知して失敗させる（`check_console_log.yml`）

- **実行タイミング**: [2.2 実行タイミング](#22-実行タイミングpr--リリース前) に従う。

### 3.6 E2Eテスト（未実装・リリース前のみ）

実ユーザー視点の主要ジャーニーを、少数のケースで確認する（全網羅はしない）。

- **実施条件**: リリース前、または影響範囲が大きい変更（認証/認可、データ参照、主要画面の動線）
- **実施方法**: 単一ブラウザで、主要フローを1〜2本確認する（当面は手動）
- **対象フロー例**
  - ログイン → コンテンツ（資料）閲覧 → ログアウト
  - admin/maintainer による更新操作 → 一覧/詳細への反映
  - pending/rejected ユーザーが保護ページへアクセス → 適切な誘導

- **実行タイミング**: リリース前のみ（[2.2 実行タイミング](#22-実行タイミングpr--リリース前) に従う）。

## 4. CI / ツール構成

### 4.1 GitHub Actions ワークフロー

GitHub Actions は CI/CD の実行基盤として利用する。詳細は各ワークフロー定義を参照する。

| Workflow | 目的 | 主な実行内容 | トリガー |
| --- | --- | --- | --- |
| Build Test ([.github/workflows/build.yml](../.github/workflows/build.yml)) | 本番相当のビルド成立性を検証 | 依存関係インストール + ビルド | `push` / `pull_request`（`app/**`）、`workflow_dispatch` |
| TypeScript Type Check ([.github/workflows/typecheck.yml](../.github/workflows/typecheck.yml)) | 型安全性と ESLint 違反の早期検出 | 型チェック + ESLint | `push` / `pull_request`（`app/**`, `*.ts(x)` 等）、`workflow_dispatch` |
| Jest Unit Tests ([.github/workflows/test.yml](../.github/workflows/test.yml)) | ユニットテスト実行 | ユニットテスト | `push` / `pull_request`（`app/**`）、`workflow_dispatch` |
| Check console.log and debugger ([.github/workflows/check_console_log.yml](../.github/workflows/check_console_log.yml)) | デバッグ用出力の混入を防止 | console/debugger 検査 | `push` / `pull_request`（`app/**`）、`workflow_dispatch` |

### 4.2 導入済みツール

- **Jest**: ユニットテスト実行基盤
- **TypeScript**: 型チェック（`tsc --noEmit`）
- **ESLint**: 静的解析
- **Supabase CLI**: 型生成・スキーマ整合性確認（現状は手動）

### 4.3 実行環境

- **Node.js 22.x**: CI 実行環境
- **Next.js**: 本番ビルド互換の検証

<<<<<<< HEAD
## 5. テスト規約
=======
- **テストピラミッド**: Unit → Integration → E2E の層構造で、上位ほど本数を絞る。
- **PR/ Nightly 分離**: PR では短時間テストを必須、E2E/大規模統合は Nightly で実行する。（Nightly 実行は未実装）
- **モック優先**: 外部依存は MSW/モックで隔離し、統合テストは専用環境で実施する。
>>>>>>> テスト設計書の未実装事項の修正反映

### テストファイルの配置

<<<<<<< HEAD
- 原則としてテストコードは `tests/` 配下に配置する。
- ディレクトリ構成は、対象コード（例: `app/` 配下）の構造に寄せて配置する。
=======
- **Build**: `.github/workflows/build.yml`（`npm run build`）
- **Type Check + Lint**: `.github/workflows/typecheck.yml`（`npx tsc --noEmit`, `npm run lint`, `npm run lint:unused-exports`（未実装））
- **Unit Test**: `.github/workflows/test.yml`（`npm test`）
- **Console/Debugger 検出**: `.github/workflows/check_console_log.yml`
- **DB Types 差分チェック（未実装）**: `.github/workflows/db-types.yml`
>>>>>>> テスト設計書の未実装事項の修正反映

### ファイル名の命名

<<<<<<< HEAD
- Jest は `*.test.ts` / `*.spec.ts` をテストとして実行できるが、本プロジェクトでは `*.test.ts` に統一する。
- テストファイル名は「対象 + 期待する振る舞い」が想像できる名前にする。
=======
#### 導入済み

- **Jest**: ユニットテスト実行基盤
- **TypeScript**: 型チェック（`tsc --noEmit`）
- **ESLint**: 静的解析
- **Supabase CLI**: 型生成・スキーマ整合性確認

#### 導入予定（未実装）

- **React Testing Library**: コンポーネント/フック検証
- **@testing-library/jest-dom**: DOM アサーション強化
- **Playwright**: E2E/ページ統合/コアUI検証
- **MSW**: API モック（フロント/サービス層）
- **axe-core**: a11y 自動検査
- **ts-prune**: 未使用 export 検出
- **Custom Scripts**: `scripts/lint-logs.cjs`, `scripts/lint-unused-exports.cjs`
>>>>>>> テスト設計書の未実装事項の修正反映

例:

- `tests/services/auth/permissions.test.ts`
