# CI/CD 設計書

## 目次

1. [概要](#1-概要)
2. [設計方針](#2-設計方針)
   - [2.1 全体構成](#21-全体構成)
   - [2.2 自動化の判断基準](#22-自動化の判断基準)
3. [共通の権限設計](#3-共通の権限設計)
   - [3.1 ワークフローが持つ権限の制限](#31-ワークフローが持つ権限の制限)
   - [3.2 外部サービスのトークン管理](#32-外部サービスのトークン管理)
   - [3.3 トークン・設定値の一覧](#33-トークン設定値の一覧)
   - [3.4 GitHub Environments](#34-github-environments)
4. [リリース自動化](#4-リリース自動化)
   - [4.1 ワークフロー一覧](#41-ワークフロー一覧)
   - [4.2 ガード条件と同時実行制御](#42-ガード条件と同時実行制御)
   - [4.3 失敗時の扱い](#43-失敗時の扱い)
5. [Wiki 更新通知](#5-wiki-更新通知)

## 1. 概要

本ドキュメントは GitHub Actions で自動化されたワークフローの設計方針を記載する。

## 2. 設計方針

### 2.1 全体構成

GitHub Actions のワークフローは、大きく以下の役割に分かれる。

- **品質ゲート**: PR や push のたびにコードの品質を自動チェックする。詳細は [テスト設計書 4.1](./testing.md#41-github-actions-ワークフロー) を参照
- **リリース自動化**: 本番リリース作業の一部を自動化する。詳細は [セクション 4](#4-リリース自動化) を参照
- **チーム通知**: Wiki 更新など、開発ルールや運用情報の変更を Slack へ自動連携する。詳細は [セクション 5](#5-wiki-更新通知) を参照

### 2.2 自動化の判断基準

新しいワークフローを追加する際は、以下の基準に基づいて自動化の可否を判断する。

**自動化する条件:**

- 手順が定型的で、人間の判断を挟む必要がない
- 誤実行時の影響がリカバリー可能
- 自動化によりヒューマンエラーを削減できる

**手動で継続する条件:**

- 本番データの変更を伴い、ロールバックが困難
- セキュリティ上、人間による目視確認が必要
- ビジネスロジックの判断が必要

**半自動（承認ゲート付き）とする条件:**

- 自動実行は可能だが、人間の確認を経てから実行すべき
- 誤実行時の影響が大きく、事前チェックが必要

## 3. 共通の権限設計

GitHub Actions のワークフローが外部サービスやリポジトリを操作するには、**トークン**（操作権限を証明する文字列）が必要になる。本セクションでは、トークンの管理方針と、機密情報の保管方法を記載する。

### 3.1 ワークフローが持つ権限の制限

GitHub Actions のワークフローには、実行時に **`GITHUB_TOKEN`** というトークンが自動で付与される。このトークンを使って、PR の作成やタグの作成といったリポジトリ操作を行う。

デフォルトでは広い権限が付与されるため、各ワークフローで `permissions` を明示し、そのワークフローに必要な操作だけを許可する。これにより、万が一ワークフローに問題があった場合でも、意図しない操作（例: コードの書き換え）が起きないようにする。

### 3.2 外部サービスのトークン管理

GitHub 以外のサービス（例: フォークリポジトリ、Supabase）を操作する場合は、別途トークンを発行して使用する。

トークンの発行時は以下の方針に従う。

- **有効期限を設定する**: トークンが漏洩していた場合でも、期限切れ後は使用できなくなる
- **必要な権限だけを付与する**: そのワークフローが必要とする最小限の権限のみを付与し、漏洩時の影響範囲を限定する

### 3.3 トークン・設定値の一覧

**GITHUB_TOKEN:**

各ワークフローに自動で付与されるトークン。必要最小限の権限のみ許可し、各ワークフローでは `permissions` を明示してデフォルト権限に依存しない。

| ワークフロー                                                                      | 権限                                     | 理由                                                             |
| --------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| [`release-pr.yml`](../.github/workflows/release-pr.yml)                           | `contents: read`, `pull-requests: write` | リリース PR の作成に必要                                         |
| [`fork-sync.yml`](../.github/workflows/fork-sync.yml)                             | `contents: read`                         | 本体リポジトリの書き込みは不要（フォーク同期は別トークンで行う） |
| [`create-release.yml`](../.github/workflows/create-release.yml)                   | `contents: write`                        | タグのプッシュと GitHub Release の作成に必要                     |
| [`wiki-slack-notification.yml`](../.github/workflows/wiki-slack-notification.yml) | `contents: read`                         | Wiki 更新イベントを受けて Slack 通知するために必要               |

**Secrets:**

機密情報はソースコードに書かず、GitHub の **Secrets**（暗号化された秘密情報）に保存する。登録場所: GitHub リポジトリの **Settings → Secrets and variables → Actions**

| 名前                    | 内容                                                           | 使用箇所                                                                          | 備考                                                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FORK_SYNC_TOKEN`       | フォーク同期用トークン                                         | [`fork-sync.yml`](../.github/workflows/fork-sync.yml)                             | 対象リポジトリをフォークのみに限定し、権限はコードの読み書きのみに制限する                                                                                                                                       |
| `SUPABASE_ACCESS_TOKEN` | Supabase 接続用トークン                                        | [`db-types.yml`](../.github/workflows/db-types.yml)                               |                                                                                                                                                                                                                  |
| `SLACK_WEBHOOK_URL`     | Wiki 更新通知ワークフローで利用する Slack Incoming Webhook URL | [`wiki-slack-notification.yml`](../.github/workflows/wiki-slack-notification.yml) | GitHub リポジトリの **Settings → Secrets and variables → Actions → Secrets** に登録する。アプリ通知でも同一値を利用する方針だが、アプリ側の設定先は実行環境の環境変数（例: `.env.local` / ホスティング環境変数） |

**Variables:**

機密ではないがワークフローから参照する設定値は GitHub の **Variables** に保存する。登録場所: GitHub リポジトリの **Settings → Secrets and variables → Actions → Variables**

| 名前                  | 内容                                          | 使用ワークフロー                                      | 備考                                             |
| --------------------- | --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `SUPABASE_PROJECT_ID` | 型生成対象の Supabase Project ID              | [`db-types.yml`](../.github/workflows/db-types.yml)   |                                                  |
| `FORK_REPO`           | フォーク同期先リポジトリ（`owner/repo` 形式） | [`fork-sync.yml`](../.github/workflows/fork-sync.yml) | 同期先を切り替える際はこの値だけを変更すればよい |

### 3.4 GitHub Environments

承認ゲート付きのワークフローでは、GitHub の **Environments** 機能を利用する。Environment は事前にリポジトリ側で作成し、保護ルール（Required reviewers 等）を設定する必要がある。

**Required reviewers が未設定の場合、承認ゲートは事実上機能せずジョブが自動で進行する**ため、本番運用を開始する前に必ず設定する。

| 名前                 | 用途                                        | 使用ワークフロー                                                | 必須の保護ルール                              |
| -------------------- | ------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `production-release` | タグ作成・GitHub Release 公開前の承認ゲート | [`create-release.yml`](../.github/workflows/create-release.yml) | Required reviewers にリリース承認権限者を登録 |

設定手順:

1. リポジトリの **Settings → Environments → New environment** で `production-release` を作成する
2. **Deployment protection rules → Required reviewers** にチェックを入れ、リリース承認権限を持つメンバー／チームを追加する

> **注意**: **Deployment branches and tags** を `release` のみに制限すると、`create-release.yml` を発火させる `pull_request` イベント（`github.ref` が `refs/pull/<n>/merge` になる）や、main ブランチからの `workflow_dispatch` 起動が Environment 制限ではじかれて承認段階に到達できない。本ワークフローでは Required reviewers のみで承認ゲートとし、branch 制限は **設定しない**（"No deployment branch policy" のまま）こと。

## 4. リリース自動化

本番環境リリース手順の一部を GitHub Actions で自動化する。

リリース手順の具体的な操作手順・チェックリストは [GitHub Wiki: 本番環境リリース手順](https://github.com/Singuralitylabs/portal-site/wiki/%E6%9C%AC%E7%95%AA%E7%92%B0%E5%A2%83%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E6%89%8B%E9%A0%86) を参照すること。

### 4.1 ワークフロー一覧

| ワークフロー                                                    | 内容                                                                                                                                                    | トリガー                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`release-pr.yml`](../.github/workflows/release-pr.yml)         | 品質チェック（build / type-check / lint / test）を実行し、事前作業の検出結果（マイグレーションファイル・新規環境変数）を含む main→release PR を作成する | 手動起動（バージョン番号を入力）                      |
| [`fork-sync.yml`](../.github/workflows/fork-sync.yml)           | フォークリポジトリの release ブランチを同期する                                                                                                         | release ブランチへの PR マージ後・自動 / 手動起動     |
| [`create-release.yml`](../.github/workflows/create-release.yml) | 承認ゲートを経て、Git タグと GitHub Release を作成する                                                                                                  | release ブランチへの PR マージ後・承認待ち / 手動起動 |

### 4.2 ガード条件と同時実行制御

#### ガード条件

[`create-release.yml`](../.github/workflows/create-release.yml) はタグ作成・Release 公開を行うため、誤実行を防ぐ複数のチェックを設定する。すべてのチェックを通過した場合のみ実行される。

| ガード                 | 内容                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| マージ済みチェック     | PR が実際にマージされた場合のみ動作する（PR をクローズしただけでは動かない） |
| PR タイトルチェック    | タイトルが「リリース」で始まる PR のみ対象とする                             |
| バージョン形式チェック | バージョン番号が `X.Y.Z` の形式でなければエラー終了する                      |
| タグ重複チェック       | 同じバージョンのタグが既に存在する場合はエラー終了する                       |
| 承認ゲート             | GitHub Environments で設定した承認者が承認するまで実行を保留する             |

#### 同時実行制御

[`create-release.yml`](../.github/workflows/create-release.yml) に `concurrency`（同時実行制御）を設定し、同じワークフローが複数同時に走ることを防止する。

```yaml
concurrency:
  group: create-release
  cancel-in-progress: false
```

`cancel-in-progress: false` を指定することで、実行中のジョブをキャンセルせず、後から起動されたジョブはキュー待ち（順番待ち）になる。

### 4.3 失敗時の扱い

| ワークフロー                                                    | 失敗した場合の影響                                           | 設計方針                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| [`release-pr.yml`](../.github/workflows/release-pr.yml)         | PR が作成されない。リリースプロセスは開始されない            | 手動での再実行が可能                                       |
| [`fork-sync.yml`](../.github/workflows/fork-sync.yml)           | フォークリポジトリが同期されない。本番デプロイには影響しない | リリース全体をブロックしない。ジョブサマリーに警告を出力   |
| [`create-release.yml`](../.github/workflows/create-release.yml) | タグ・Release が作成されない                                 | 手動での再実行が可能。タグ重複チェックにより二重作成を防止 |

#### `create-release.yml` 部分失敗時のリカバリ

[`create-release.yml`](../.github/workflows/create-release.yml) は「タグの push」と「GitHub Release の作成」を順次実行する。前段だけ成功して後段で失敗した場合、ワークフローを単純に再実行するとタグ重複チェックで停止するため、後段のみ手動で補完する必要がある。

| 失敗パターン                              | 状態                  | リカバリ手順                                                                                                                                                      |
| ----------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| タグ push 前に失敗                        | タグも Release も無い | バージョン番号を確認のうえ、`create-release.yml` を再実行する                                                                                                     |
| タグ push 成功 / Release 作成失敗         | タグのみ存在          | ワークフロー再実行は不可（タグ重複で停止）。**`gh release create vX.Y.Z --target release --title vX.Y.Z --generate-notes` を手動で実行**して Release のみ補完する |
| Release 作成成功 / 後続失敗（理論上のみ） | タグも Release もある | 後続ステップが追加された場合のみ該当。当該ステップだけを手動で補完する                                                                                            |

タグそのものを誤って作ってしまった場合は、`git push --delete origin vX.Y.Z` でリモートタグを削除してから再実行する。**ローカルタグの削除（`git tag -d`）も併せて行わないと、ローカルから誤って再 push されるおそれがある**点に注意する。

具体的な対応手順は [GitHub Wiki: 本番環境リリース手順](https://github.com/Singuralitylabs/portal-site/wiki/%E6%9C%AC%E7%95%AA%E7%92%B0%E5%A2%83%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E6%89%8B%E9%A0%86) のトラブルシューティングを参照すること。

## 5. Wiki 更新通知

Wiki ページの更新内容をチームへ自動連携するため、[`.github/workflows/wiki-slack-notification.yml`](../.github/workflows/wiki-slack-notification.yml) を追加する。

Slack の通知先は、既存のアプリケーション通知と同じ `SLACK_WEBHOOK_URL` を共通利用する。Wiki 通知専用の Webhook URL は発行しない。

GitHub Actions 側の設定値は `docs/setup.md` ではなく本ドキュメントで管理する。Wiki 更新通知に必要な `SLACK_WEBHOOK_URL` は、GitHub リポジトリの **Settings → Secrets and variables → Actions → Secrets** に登録する。

### 5.1 ワークフローの動作

| 項目     | 内容                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| トリガー | Wiki ページの作成・更新・削除（`gollum`）                                                                 |
| 通知単位 | 1 イベントを 1 件の Slack 通知にまとめる。複数ページ更新時もページごとの個別通知には分割しない            |
| 通知内容 | ページ名（リンク）、操作種別、更新者、取得できる場合は compare revisions へのリンク                       |
| 通知先   | `SLACK_WEBHOOK_URL` Secret の既定チャネル                                                                 |
| 取得権限 | `GITHUB_TOKEN` の `contents: read` を利用する。ワークフロー内で Wiki リポジトリの追加 checkout は行わない |

`gollum` イベントでは対象 Wiki ページの情報を受け取り、ワークフローはその payload をもとに通知本文を組み立てる。ページ単位でページ名と操作種別を列挙し、取得できる場合は compare revisions へのリンクも併記する。

複数ページが同一イベントで更新された場合は、1 件の Slack 通知にまとめる。ページ単位でページ名・操作種別を列挙し、詳細確認は GitHub Wiki の compare revisions を参照する。

Slack 通知本文は Incoming Webhook の通常テキストとして送信し、最低限以下の情報を含める。

```text
Wiki が更新されました

- ページ: <ページ名とリンク>
- 操作: <created / edited / deleted>
- 更新者: <GitHub ユーザー名>
- Compare: https://github.com/Singuralitylabs/portal-site/wiki/_compare/<revision>
```

### 5.2 失敗時の扱い

| 失敗パターン               | 影響                                           | リカバリ手順                                                                                |
| -------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SLACK_WEBHOOK_URL` 未設定 | 設定不備としてジョブをエラー終了し、通知しない | GitHub Actions の Secrets に `SLACK_WEBHOOK_URL` を登録し、失敗したワークフローを再実行する |
| Slack Webhook 送信失敗     | Slack 通知が送信されず、ジョブは失敗する       | Slack 側の Webhook 設定・チャンネル権限を確認し、ワークフローを再実行する                   |
