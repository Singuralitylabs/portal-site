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
    - [3.6 コアコンポーネントテスト（中優先度）（未実装）](#36-コアコンポーネントテスト中優先度未実装)
    - [3.7 データ取得系API テスト（中優先度）（未実装）](#37-データ取得系api-テスト中優先度未実装)
    - [3.8 ページレベル統合テスト（中低優先度）（未実装）](#38-ページレベル統合テスト中低優先度未実装)
    - [3.9 UIコンポーネントテスト（中低優先度）（未実装）](#39-uiコンポーネントテスト中低優先度未実装)
    - [3.10 E2Eテスト（低優先度）（未実装）](#310-e2eテスト低優先度未実装)
    - [3.11 Supabase 統合テスト（低優先度）（未実装）](#311-supabase-統合テスト低優先度未実装)
4. [テスト/CIで使用するアーキテクチャ・ツール一覧](#4-テストciで使用するアーキテクチャツール一覧)

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
| TypeScript Type Check (`.github/workflows/typecheck.yml`) | 型安全性と ESLint ルール違反の早期検出 | Node.js 22.x で `npm ci` → `npx tsc --noEmit` → `npm run lint` → `npm run lint:unused-exports`（ts-prune／`UNUSED_EXPORTS_STRICT=true` でのみfail） | `push` / `pull_request`（`app/**`, `*.ts(x)` 等）、`workflow_dispatch` |
| Jest Unit Tests (`.github/workflows/test.yml`) | ユニットテストとカバレッジ確認 | Node.js 22.x で `npm ci` → `npm test` (Jest) | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |
| Check console.log and debugger (`.github/workflows/check_console_log.yml`) | デバッグ用出力を混入させないための静的検査 | `find` + `grep` で `console.log/info` と `debugger` を検出し、許可済み箇所以外が見つかれば失敗 | `push` / `pull_request` (`app/**`)、`workflow_dispatch` |
| Supabase DB Types Consistency (`.github/workflows/db-types.yml`) | DBスキーマと型定義の同期を確認 | `npx supabase gen types` → `git diff --quiet app/types/lib/database.types.ts` で差分検知 | `push` / `pull_request`（`supabase/**`, `app/types/lib/database.types.ts` 等）、`workflow_dispatch` |

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

- **コンパイル**: TypeScriptエラーの検出
  Next.js の `next build` には TypeScript チェックが含まれ、`.github/workflows/build.yml` で `npm run build` を実行することで型エラーを自動的に検出できる。

- **最適化**: Next.jsビルド処理の成功
  `next build` が完走すること自体が最適化パイプラインの成功を意味し、CI でのビルド結果が本番相当で成立するか確認している。

- **依存関係**: パッケージ間の整合性確認
  `npm ci` により lockfile 通りに依存関係を再構築し、破損や不足があれば取得・ビルド段階で検知できる。

- **静的ファイル**: アセット生成の確認
  ビルド結果として `.next/static` 等のアセットが生成されるため、`npm run build` の完了が静的ファイル生成フローの健全性確認となる。

### 3.5 コード品質テスト（高優先度）

保守性とコード品質を維持する

#### テストポイント:

- **デバッグコード除去**: console.log、debugger文の検出
  `.github/workflows/check_console_log.yml` が `find` + `grep` で `console.log/info` や `debugger` を走査し、許可されていない出力を検出するとジョブを失敗させる。
  ローカルでは `npm run lint:logs`（`scripts/lint-logs.cjs` を実行し、`.ts/.tsx` を再帰走査して許可リスト以外の出力を行番号付きで表示）を pre-commit Hook に組み込み、開発段階で検知できるようにする。

- **未使用コード**: 不要なimport・関数・変数の検出
  `.github/workflows/typecheck.yml` 内で実行する `npm run lint` が `eslint-plugin-import` や `no-unused-vars` 等のルールを通じて未使用コードを検知する。
  さらに `npm run lint:unused-exports`（`scripts/lint-unused-exports.cjs` → `ts-prune --project tsconfig.json --ignore app/types/lib/database.types.ts`）を同ワークフローに追加済みで、デフォルトは警告のみを表示する。GitHub Secrets/Variables に `UNUSED_EXPORTS_STRICT=true` を設定すると CI で失敗させられるため、大規模な削除作業前後で切り替えると安全に監視できる。

- **コーディング規約**: ESLintルール準拠
  同じく `npm run lint` により、プロジェクトの ESLint 設定（`eslint-config-next`, `eslint-config-prettier` など）へ違反したコードを検出する。
  `eslint --max-warnings=0` を標準とし、`lint-staged` で `next lint --fix` を自動適用することで PR 作成前に整形を強制する。

- **型安全性**: TypeScriptの型エラー検出
  `.github/workflows/typecheck.yml` で `npx tsc --noEmit` を実行し、型エラー発生時にはジョブを失敗させる。
  `incremental` オプションをオフにした専用 `tsconfig.ci.json` を用意するとキャッシュ汚染による取りこぼしを防ぎやすい。

- **フォーマッタ整合**: Prettier などの自動整形ルールからの逸脱検知 *（未実装）*
  `npm run format:check`（`prettier --check "app/**/*.{ts,tsx,js,json,md}"`）を追加し、CI のコード品質ジョブで `npm run format:check` → `npm run lint` の順に実行する。
  ローカルでは `npm run format` を pre-commit Hook に仕込み、人手による整形差分を減らす。

- **依存関係健全性**: 未使用/未宣言 dependency, security fix の検出 *（未実装）*
  `npm run depcheck`（`depcheck --specials=eslint,babel,webpack --skip-missing`）や `npm audit --omit=dev` をコード品質ジョブの末尾に足し、使用していない依存や脆弱性を検出する。
  検出結果は GitHub Actions のアーティファクトにレポートし、Critical 以上のみで失敗させる運用にすると対応負荷を抑えられる。

### 3.6 コアコンポーネントテスト（中優先度）（未実装）

ユーザー操作に直結するUI機能の品質を確保する。
UI検証は Playwright を標準ツールとし、`tests/core-components/*.spec.ts` にタグ `@core` を付けたシナリオを集約する。
Next.js を `next dev` で起動した上で `npx playwright test --project=chromium --grep @core` を実行し、`storageState` を使って認証済み状態を再利用する。
各 spec では `beforeEach` でテストユーザーの権限種別を切り替え、`page.route` で Supabase/外部API をスタブする。

#### テストポイント:

- **イベント処理**: クリック・フォーム送信などの動作
  `page.getByRole("button", { name: "Googleでログイン" })` や `getByLabel("資料名")` などアクセシビリティロケーターを使い、CTA・フォーム送信・モーダル操作を `await expect(page).toHaveURL(...)` / `toHaveText(...)` で検証する。
  外部リンクは `page.waitForEvent("popup")` で新規タブ遷移を捕捉し、ファイルダウンロードは `page.waitForEvent("download")` で確認する。
  イベント順序が重要なコンポーネント（例: カルーセル、ステップフォーム）は `test.step` で区切り、ログ出力を Playwright Tracing で追跡できるよう `npx playwright show-trace` を活用する。

- **状態管理**: コンポーネント内状態の正確な更新
  状態が UI に反映されることを `await expect(page.getByTestId("document-card").nth(0)).toHaveClass(/is-loading/)` のように確認し、内部 state 変化を `page.evaluate` で直接覗かず UI 経由でのみ検証する。
  フォームウィザードやタグフィルターは `page.route("**/documents", route => route.fulfill({ json: mockedResponse }))` でレスポンスを切り替え、状態遷移（ローディング → 結果 → 空状態）が順に描画されるかを `expect(page.getByText("該当データがありません")).toBeVisible()` で確かめる。

- **条件表示**: 権限・状態による表示制御
  Playwright の `storageState` に admin/member/pending の JWT を事前保存し、`test.describe("role matrix", () => describeRole("admin", ...)` のように `test.use({ storageState: "storage/admin.json" })` で切り替える。
  ロールによって表示/非表示になるボタンや列を `await expect(page.getByRole("button", { name: "承認" })).toBeHidden()` のように検査し、未承認ユーザーが保護ビューにアクセスした際は `await expect(page).toHaveURL(/pending/)` を確認する。

- **エラーハンドリング**: UI上でのエラー表示・処理
  `page.route("**/videos", route => route.fulfill({ status: 500 }))` などでエラー応答を注入し、トースト・アラート・リトライボタンが表示されること、閉じる操作で UI が復元することを期待値に加える。
  Playwright の screenshot を `test.info().attach("error-state", { body: await page.screenshot(), contentType: "image/png" })` で保存し、差分チェックを簡単にする。
  複数エラーが同時に発生するケースは `Promise.all` で並列リクエストを発火させ、UI が競合状態に陥らないかを検証する。

#### 対象コンポーネント:

- 認証関連（ログインボタン、承認待ち画面のログアウトボタン）
- 資料一覧 UI（分類ショートカットバー、ドキュメントカード、カード内リンク）
- 動画一覧 UI（動画カード、サムネイルクリック → 詳細遷移）
- CRUD モーダル（資料・動画・アプリ紹介フォームの登録/編集ダイアログ）
- 共通ナビゲーション（サイドナビ、ヘッダー内ユーザーメニュー）
- 通知・トーストコンポーネント（成功/失敗メッセージ表示）
- カレンダービューのイベントカード（月週切替・ドラッグ操作がある場合）

### 3.7 データ取得系API テスト（中優先度）（未実装）

データフェッチ処理の信頼性を確保する。
`react-query` / `SWR` などのデータ取得フックは Jest + Testing Library + MSW でユニット検証し、実ブラウザでの API 通信は Playwright で軽微な E2E も追加する。
CI では `npm run test:data-fetch` を `test` スクリプトにマージし、`.github/workflows/test.yml` から自動実行する想定。

#### テストポイント:

- **データ取得**: 正しいクエリでのデータ取得
  `msw` の `rest.get("/api/documents")` ハンドラで `req.url.searchParams` を検証しつつ、`renderHook(() => useDocumentsQuery(), { wrapper: createQueryClientWrapper() })` を用意して `await waitFor(() => expect(result.current.data).toHaveLength(3))` を行う。
  Supabase RPC の場合は `jest.mock("@supabase/supabase-js")` で `from().select()` を監視し、クエリが正しいテーブル・列を対象にしているか `expect(mockFrom).toHaveBeenCalledWith("*", { count: "exact" })` のようにアサートする。

- **フィルタリング**: 削除フラグやユーザー権限による絞り込み
  `describe.each(["admin", "member"])` でロール別に `useDocumentsQuery({ status: "active" })` を実行し、MSW で返す JSON を切り替えて `expect(result.current.data.every(doc => doc.status === "active"))` を確認する。
  クエリストリング検証も併せて行い、`expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("is_deleted=eq.false"))` を用いる。

- **エラーハンドリング**: 取得失敗時の適切な処理
  MSW で 500 応答やタイムアウト (`ctx.delay("infinite")`) を返し、React Query の `retry` / `onError` が発火するか `await waitFor(() => expect(toast.error).toHaveBeenCalled())` を確認する。
  Playwright では `page.route("**/api/videos", route => route.fulfill({ status: 500 }))` で UI がリトライボタンを表示し、クリック後に回復することを検証する。

- **パフォーマンス**: レスポンス時間の妥当性
  Jest では `performance.now` を `jest.spyOn(globalThis, "performance", "get")` 経由でモックし、`await result.current.refetch()` の前後差分が SLA (例: 500ms) を超えると警告ログが出る仕様を確認する。
  Playwright では `await page.waitForResponse(resp => resp.url().includes("/api/documents") && resp.timing().responseEnd < 500)` のように timing API を使い、遅延時にローディングスケルトンが表示され続けるかをスクリーンショットで検証する。
- **ページネーション / 無限スクロール**: `fetchNextPage` の制御
  `useInfiniteQuery` を用いるフックでは `await act(async () => result.current.fetchNextPage())` を呼び、MSW のレスポンスで `nextCursor` を変化させて `expect(result.current.hasNextPage).toBe(false)` となる条件を確認する。
  Playwright ではスクロールイベントを `await page.mouse.wheel(0, 2000)` で発火し、ネットワークタブの追加リクエスト件数と DOM 追加件数を `expect(await page.locator("[data-testid=\"document-card\"]").count()).toBeGreaterThan(initialCount)` で比較する。

- **キャッシュ / 再検証**: stale-while-revalidate の破綻防止
  React Query の `staleTime` と `cacheTime` をテスト用に短縮し、`await waitFor(() => expect(result.current.isFetching).toBe(false))` の後に `jest.advanceTimersByTime(staleTime + 1)` で再検証が走るかを確認する。
  `queryClient.invalidateQueries(["documents", { category: "program" }])` を呼んだ際に適切な範囲だけ再フェッチされることを `expect(fetchSpy).toHaveBeenCalledTimes(2)` で検証する。
  Playwright では複数タブ (chromium context) を開き、一方で更新された値が他方で `BroadcastChannel` 経由で再取得されるか観察する。

### 3.8 ページレベル統合テスト（中低優先度）（未実装）

`app/(authenticated)/*` 配下の各ページ（資料一覧、動画一覧、アプリ紹介、会員一覧、プロフィール、管理画面など）で、データ取得フック・UIコンポーネント・ルーティングガードが一体として動作するかを検証する。Next.js の `App Router` を `next dev` で起動し、Playwright もしくは Testing Library + `next-router-mock` を使ってページ単位の統合を行う。

#### テストポイント:

- **データ連携**: API・コンポーネント間のデータ流れ
  `useDocumentsQuery` などのフェッチフックと表示コンポーネントの橋渡しが成立し、フェッチ成功・空データ・APIエラーの各状態でページ全体が期待通り描画されるか。MSW で `/api/documents` 等を差し替えて確認する。

- **ページ遷移**: 認証状態によるリダイレクト
  認証状態や承認ステータスによるガードが `middleware.ts` → `layout.tsx` → ページ本体の順に効くこと。
  ログイン済み/未承認/管理者の `storageState` を切り替え、`/documents` → `/documents/{id}` → `/admin` の遷移をシナリオ化する。

- **レイアウト**: 画面表示の正確性
  サイドバー/ショートカットバー/グリッドなど、仕様書に記載された主要セクションがブレずに表示されるか。
  ビューポートを `390px`（モバイル）と `1280px`（デスクトップ）でスナップショットを取り、Tailwind クラスが崩れていないことを `expect(page).toHaveScreenshot()` で担保する。

- **パフォーマンス**: ページ読み込み速度
  ページロードでの初回描画時間・データ取得時間を `performance.getEntriesByType("navigation")` や Playwright の `HAR` で計測し、UX 基準（例: LCP 2.5s 以内）を超える場合に警告を出す。
  SWR/React Query のキャッシュヒット時に無用な追加リクエストが発生していないかも合わせて確認する。

- **クリティカルユーザーフロー**: 主要な操作の追跡
  仕様書 3〜7 章に記載された主要操作（資料カード「開く」、動画カードから詳細へ、アプリ詳細モーダル開閉、メンバー詳細モーダル表示）を、ページ境界をまたいでも破綻なく実行できるかを一連のテストで追跡する。

- **承認フローの遷移**: 新規ユーザー承認プロセス確認
  初回ログイン → 承認待ち → 承認後のメイン遷移、拒否時の案内画面遷移が設計通り動くことを確認する。

- **管理画面の表示順ロジック**: 表示順変更確認
  資料/動画/アプリの「最初/末尾/指定の後に配置」選択で `display_order` が再計算され、一覧の並び順が更新されることを確認する。
  
- **カレンダーページ固有の表示**: カレンダーUI確認
  月/週/日/予定リストの切替と、前後期間の追加取得が正しく動き、イベント詳細モーダルが表示されることを確認する。

### 3.9 UIコンポーネントテスト（中低優先度）（未実装）

視覚的プレゼンテーションのみを担う `app/components/*`（カード、タグ、トースト、フォーム入力など）を対象に、Props → DOM 表示が仕様通りであることを確認する。Storybook を「仕様の真実」として整備し、Chromatic や Jest + Testing Library + `@testing-library/jest-dom` で自動検証する。

#### テストポイント:

- **表示内容**: 渡されたpropsの正確な表示
  Props に渡したテキスト・数値・アイコンが想定のロケーターに描画されるか。
  `render(<DocumentCard title="企画書" ... />)` → `expect(screen.getByText("企画書")).toBeVisible()` のようにシンプルな断面で保証する。

- **スタイリング/バリアント**: 基本的なCSS適用確認
  `variant="primary"` `size="lg"` 等のバリアント prop が正しい Tailwind クラスを付与するかを `expect(card).toHaveClass("bg-sinlab-primary")` で検証し、Storybook のビジュアルリグレッションで差分を監視する。

- **フォールバック表示**: 未設定項目の代替表示確認
  画像や値が未設定の場合に期待するフォールバック（例: `avatar_url` 未設定時のイニシャル表示）が成立することを確認する。

- **アクセシビリティ**: 基本的なa11y要件
  `aria-*` 属性・ラベル・キーボード操作が成立しているかを `axe-core` / `@testing-library/jest-dom` の `toHaveAccessibleName` で確認する。タブ移動でフォーカスリングが見えること、`role="dialog"` を持つモーダルが `aria-modal="true"` になっていることなど基本要件をカバーする。

- **インタラクションの最小保証**: UX上重要な見た目の反応確認
  表示専用といえども hover/focus 等でスタイルが変化するコンポーネントは、`userEvent.hover` や `focus` で擬似状態を再現し、クラス切り替えやツールチップ表示を確認する。

- **Storybook Docs との整合**: UI状態の固定化、仕様・ドキュメント・テストの一元化
  Story args をそのまま Jest/Chromatic で再利用し、ドキュメントに掲載されたサンプルが常に動作するよう `storiesToTests` パターンを導入する。

### 3.10 E2Eテスト（低優先度）（未実装）

実ユーザー視点での主要ジャーニー（ログイン → 資料閲覧 → 動画視聴 → プロフィール編集 → ログアウトなど）を、Playwright のマルチプロジェクト（Chromium/Safari/Firefox 相当）で夜間ジョブとして検証する。  
Supabase のステージング環境を用意し、最低限のシードデータを投入して実データベースを叩く。

#### テストポイント:

- **ユーザーフロー**: ログインから主要機能利用まで
  仕様書に基づいた代表ジャーニーをテーブル化し、`test.describe("member happy path")` などで順序立てて実行する。
  Google OAuth は `storageState` で代替し、資料カードを開いた後に動画ページへ移動するなど横断シナリオを検証する。
- **外部リンク/新タブ遷移**: 外部リソースへの正確な遷移
  資料「開く」やアプリ「アプリを開く」が新規タブで開くこと、動画カードが詳細ページへ遷移することを確認する。

- **ブラウザ互換性**: 主要ブラウザでの動作確認
  Playwright の `projects` で `chromium`, `firefox`, `webkit` を切り替え、CSS レイアウトと機能が主要ブラウザで破綻しないかをチェックする。
  スマホ/タブレットのビューポートを追加し、レスポンシブ要件もここで担保する。

- **パフォーマンス/計測**: 実環境での応答確認
  `test.step("capture metrics", async () => { const metrics = await page.evaluate(() => performance.getEntriesByType("navigation")); ... })` で LCP/FID 相当の値を採取し、閾値超過時にテストを警告扱いにする。実環境での Supabase 往復時間も `await response.timing()` で記録。

- **回帰テスト**: 機能追加・修正時の既存機能への影響確認
  クリティカルバグの再発を防ぐため、過去に報告された不具合を `test.fixme` から昇格させてシナリオ化する。
  PR マージ前は `--grep @smoke` のみを動かし、Nightly で全シナリオを実行する形で負荷をコントロールする。

- **障害時フォールバック**: 外部API利用不可時の挙動確認
  Slack 通知や Google Calendar がダウンしている場合の代替導線（通知スキップ、空状態表示）が維持されるか、Playwright の `route.abort()` / `route.fulfill({ status: 500 })` を使って実際のブラウザから確認する。

### 3.11 Supabase 統合テスト（低優先度）（未実装）

Supabase の Postgres・Auth・Storage・Edge Functions を本番と同じ設定で立ち上げ、マイグレーション・RLS・トリガーが期待どおり動くかを CLI ベースで検証する。`supabase start` でローカルエミュレーターを起動し、Node から `supabase-js` を使った統合テストを `tests/supabase/*.test.ts` に配置する。

#### テストポイント:

- **接続確認**: データベース・認証サービスとの通信
  `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)` で CRUD を実行し、`supabase status` が正常であること、Auth の `signInWithPassword` が成功/失敗パターンともに動作することを確認する。
  CI では GitHub Actions サービスコンテナで Supabase を立ち上げ、`npm run test:supabase` を実行する。

- **設定確認**: 環境変数・設定値の正確性
  `.env.local` / GitHub Secrets に定義された `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_WEBHOOK_URL` などが欠けていないかを `zod-env` で検証し、欠損時はテストを fail させる。
  Edge Functions や Storage バケット名が `specification.md` の記述と一致しているかもチェックする。

- **制約確認**: DB制約・RLSポリシーの動作
  `supabase db reset` → `supabase migration up` の流れで最新スキーマを適用し、`pgTAP` または Jest で `INSERT`/`UPDATE` を試みてユニーク制約・外部キー制約が発火するか、`documents` テーブルの RLS がロール別に正しく拒否/許可するかを `expect(result.error?.message).toContain("RLS")` で確認する。

- **イベント/トリガー**: イベント・トリガーの動作・副作用の確認
  新規ユーザー作成時の Slack 通知やステータス初期化トリガーが動くか、`supabase.functions.invoke` や Webhook モックを使って副作用を検証する。
  失敗時でもメインフローがロールバックされないことを保証する。

- **バックアップ/ロールフォワード**: DBマイグレーションの整合性確認
  主要マイグレーションを `supabase db diff` で差分抽出し、ロールフォワード/ロールバックのスクリプトをテスト内で実行して整合性を担保する。
  大規模スキーマ変更前に必須。

## 4. テスト/CIで使用するアーキテクチャ・ツール一覧

### 4.1 アーキテクチャ（実行方針）

- **テストピラミッド**: Unit → Integration → E2E の層構造で、上位ほど本数を絞る。
- **PR/ Nightly 分離**: PR では短時間テストを必須、E2E/大規模統合は Nightly で実行する。
- **モック優先**: 外部依存は MSW/モックで隔離し、統合テストは専用環境で実施する。

### 4.2 GitHub Actions（CI/CD）

- **Build**: `.github/workflows/build.yml`（`npm run build`）
- **Type Check + Lint**: `.github/workflows/typecheck.yml`（`npx tsc --noEmit`, `npm run lint`, `npm run lint:unused-exports`）
- **Unit Test**: `.github/workflows/test.yml`（`npm test`）
- **Console/Debugger 検出**: `.github/workflows/check_console_log.yml`
- **DB Types 差分チェック**: `.github/workflows/db-types.yml`

### 4.3 テスト/品質ツール

- **Jest**: ユニットテスト実行基盤
- **React Testing Library**: コンポーネント/フック検証
- **@testing-library/jest-dom**: DOM アサーション強化
- **Playwright**: E2E/ページ統合/コアUI検証
- **MSW**: API モック（フロント/サービス層）
- **axe-core**: a11y 自動検査
- **TypeScript**: 型チェック（`tsc --noEmit`）
- **ESLint**: 静的解析
- **ts-prune**: 未使用 export 検出（`npm run lint:unused-exports`）
- **Supabase CLI**: 型生成・スキーマ整合性確認
- **Custom Scripts**: `scripts/lint-logs.cjs`, `scripts/lint-unused-exports.cjs`

### 4.4 プラットフォーム/ランタイム

- **Node.js 22.x**: CI 実行環境
- **Next.js Build**: 本番ビルド互換の検証
