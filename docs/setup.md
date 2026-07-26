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

### 2.3 環境変数の設定（dotenvx による暗号化管理）

#### この節でやること

ローカル開発の機密情報は [dotenvx](https://dotenvx.com) で暗号化し、暗号化済みの `.env.development` をリポジトリに含めている。そのため **各自で `.env.local` を作成する必要はなく、値を 1 つずつ集める作業も不要**。

各開発者がやることは、次の 1 点だけ。

> 復号鍵を受け取り、環境変数 `DOTENV_PRIVATE_KEY_DEVELOPMENT` として供給できる状態にする

この状態で `npm run dev` を実行すると、dotenvx が鍵で `.env.development` を復号し、環境変数として注入する。

| Step   | やること                                     | 完了の目安                                             |
| ------ | -------------------------------------------- | ------------------------------------------------------ |
| Step 1 | 復号鍵を受け取る                             | 64 桁の16進文字列が手元にある                          |
| Step 2 | 鍵を OS のセキュアストアに保存する           | 保存の確認コマンドが `64`（Windows は `True`）を返す   |
| Step 3 | シェル起動時に環境変数へ供給する設定を入れる | 新しいターミナルで鍵の長さが `64` になる（Step 4 (1)） |
| Step 4 | 復号できることを確認する                     | `npm run dev` が起動する                               |

> 依存パッケージ `@dotenvx/dotenvx` は §2.2 の `npm install` で導入済み。

#### Step 1. 復号鍵を受け取る

既存メンバーから dev 用の復号鍵を受け取る。配布元が分からない場合は Slack の `201-club_チーム開発` チャンネルで依頼する。

- 鍵は **64 桁の16進文字列**（`0`〜`9` と `a`〜`f` のみ）
- 受け取ったテキストに `DOTENV_PRIVATE_KEY_DEVELOPMENT=` という変数名や引用符が付いている場合、**それらは鍵の一部ではない**。64 桁の値だけを取り出して次へ進む（この混入が設定失敗の典型例）

#### Step 2. 鍵を OS のセキュアストアに保存する

鍵は平文ファイルとして残さず、OS のセキュアストアに保管する。

**Mac（Keychain）**

```bash
security add-generic-password -U -a "$USER" -s DOTENV_PRIVATE_KEY_DEVELOPMENT -w
```

- 実行するとプロンプトが表示されるので、鍵を貼り付けて Enter（確認のため再入力を求められた場合は同じ値をもう一度入力する）。入力内容は画面に表示されない
- 鍵をコマンドの引数に直接書かない。シェル履歴に残るため、必ず `-w` のプロンプト経由で入力する
- `-U` は既存項目の上書き。鍵のローテーション時も同じコマンドでよい

保存できたかを確認する。鍵の値は表示せず、長さだけを見る。

```bash
security find-generic-password -a "$USER" -s DOTENV_PRIVATE_KEY_DEVELOPMENT -w | tr -d '\n' | wc -c | tr -d ' '
# → 64 と表示されれば OK
```

- アクセス許可のダイアログが表示された場合は「常に許可」を選ぶ。「許可しない」を選ぶとこのコマンドが失敗し、Step 3 で鍵が空文字になる

**Windows（PowerShell + DPAPI）**

```powershell
# 保存（ユーザー＋マシンに紐づく暗号化ブロブとして保管）
New-Item -ItemType Directory -Force "$HOME\.dotenvx" | Out-Null
Read-Host "Enter private key" -AsSecureString | ConvertFrom-SecureString | Out-File "$HOME\.dotenvx\dev.key"

# 保存できたかの確認
Test-Path "$HOME\.dotenvx\dev.key"   # → True と表示されれば OK
```

WSL で開発する場合は Linux 扱いとし、`pass` などで保管する。

#### Step 3. シェル起動時に環境変数へ供給する

シェルの起動ファイルには、**鍵の値ではなく鍵を取り出すコマンド**を書く。

**Mac（zsh の場合は `~/.zshrc` の末尾に追記）**

```bash
export DOTENV_PRIVATE_KEY_DEVELOPMENT="$(security find-generic-password -a "$USER" -s DOTENV_PRIVATE_KEY_DEVELOPMENT -w)"
```

- 使用中のシェルは `echo $SHELL` で確認する。bash の場合は `~/.bash_profile` に追記する

**Windows（PowerShell プロファイル `$PROFILE` に追記）**

```powershell
$sec = Get-Content "$HOME\.dotenvx\dev.key" | ConvertTo-SecureString
$env:DOTENV_PRIVATE_KEY_DEVELOPMENT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
```

**追記しただけでは、すでに開いているターミナルには反映されない。** 新しいターミナルを開くか、`source ~/.zshrc`（PowerShell は `. $PROFILE`）を実行する。VS Code の内蔵ターミナルも同じで、反映されない場合は VS Code 自体を再起動する。

#### Step 4. 復号できることを確認する

**新しいターミナルを開いて**、プロジェクトルートで次の 2 つを実行する。

**Mac**

```bash
# (1) 環境変数に鍵が届いているか（期待値: 64）
echo ${#DOTENV_PRIVATE_KEY_DEVELOPMENT}

# (2) 実際に復号できるか（期待値: https://xxxxx.supabase.co のような URL）
npx dotenvx get NEXT_PUBLIC_SUPABASE_URL -f .env.development
```

**Windows（PowerShell）**

```powershell
# (1) 環境変数に鍵が届いているか（期待値: 64。未設定なら 0）
"$env:DOTENV_PRIVATE_KEY_DEVELOPMENT".Length

# (2) 実際に復号できるか（期待値: https://xxxxx.supabase.co のような URL）
npx dotenvx get NEXT_PUBLIC_SUPABASE_URL -f .env.development
```

- 鍵そのものを画面に出さない（画面共有・スクリーンショット・シェル履歴から漏れる）。長さだけを確認する
- (2) で `encrypted:BDw2...` のような文字列や `[DECRYPTION_FAILED]` が表示された場合は鍵が効いていない。下の「うまくいかないとき」へ進む

両方 OK なら開発サーバーを起動する。

```bash
npm run dev
```

#### うまくいかないとき（症状別）

dotenvx は **鍵が未設定のときも、鍵が間違っているときも同じエラー**を出す（v2.3.4 で確認）。メッセージだけでは原因を判別できないため、下表の順に切り分ける。

```text
☠ [DECRYPTION_FAILED] could not decrypt NEXT_PUBLIC_SUPABASE_URL, ... fix: [https://github.com/dotenvx/dotenvx/issues/757]
```

切り分けには Step 4 (1) の結果を使う。ただし `.env.keys` でのフォールバック運用中はこの表の対象外で（環境変数を使わないため常に `0` になる）、`.env.keys` の中身（変数名 + 64 桁の鍵が 1 行）と配置場所（プロジェクトルート）を確認する。

| 結果                | 原因                         | 対処                                                                                                                                                                                                                                      |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`（空）           | 環境変数が供給されていない   | 次の順に確認する。(1) 起動ファイル（`~/.zshrc` / `$PROFILE`）に設定行があるか、(2) ターミナルを開き直したか（Step 3）、(3) セキュアストアに鍵があるか（Step 2 の確認コマンド）、(4) Keychain のアクセス許可を「許可しない」にしていないか |
| `64` 以外の数値     | 鍵に余計な文字が混入している | `DOTENV_PRIVATE_KEY_DEVELOPMENT=`・引用符・空白・改行を取り除いた 64 桁だけを、Step 2 で保存し直す                                                                                                                                        |
| `64` だが復号に失敗 | 別の鍵ペアの鍵を使っている   | `.env.development` 冒頭の `DOTENV_PUBLIC_KEY_DEVELOPMENT` に対応する鍵かどうかを配布元に確認する（鍵のローテーション後に旧鍵を使っている場合など）                                                                                        |

上記で解決しない場合は、`next dev` を直接実行していないかも確認する。暗号化された値は dotenvx 経由（`npm run dev`）でのみ復号される。

#### （最終手段）セキュアストアが使えない場合のフォールバック

セキュアストアの運用がどうしても難しい場合に限り、受け取った鍵をプロジェクトルートの `.env.keys` に置く方法もある。この場合 Step 2・Step 3 は不要（dotenvx が `.env.keys` を自動的に読む）。

`.env.keys` を作成し、次の 1 行だけを書く（ターミナルで実行するコマンドではない）。

```text
DOTENV_PRIVATE_KEY_DEVELOPMENT="（受け取った64桁の鍵）"
```

新規ファイルは既定で同じマシンの他ユーザーからも読めるため、パーミッションを制限する。

```bash
chmod 600 .env.keys   # Mac/Linux
```

この方法は平文の鍵がディスクに残り、ローカルで動く他プロセス（postinstall スクリプト等）からも読める。最終手段とし、可能な限りセキュアストア運用を推奨する。

#### 参考: 各環境変数の内容

各変数の概要は以下のとおり（値は `.env.development` に暗号化済みのため、通常は個別の取得・差し替えは不要。鍵のローテーションや新規追加時に参照する）。

| 変数                            | 説明                                                                                                                                                                                                                                                                                                                                                                                                                        | 取得元                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase プロジェクトのエンドポイント URL。ブラウザ／サーバー双方から Supabase の認証・データベース API へ接続する際に使用する                                                                                                                                                                                                                                                                                              | Supabase Dashboard → Project Settings → API → Project URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の匿名 API キー。クライアント側から Supabase に接続する際の認証に使用される（実権限は RLS で制御される）                                                                                                                                                                                                                                                                                                           | Supabase Dashboard → Project Settings → API → anon public                             |
| `SUPABASE_PROJECT_ID`           | Supabase プロジェクトの一意 ID。`npm run db:types:local` でデータベース型定義を自動生成する際に使用する（ローカル開発でのみ必要）                                                                                                                                                                                                                                                                                           | Supabase Dashboard → Project Settings → General → Reference ID                        |
| `NEXT_PUBLIC_ADMIN_EMAIL`       | 管理者のメールアドレス。`NEXT_PUBLIC_` プレフィックスのためクライアントバンドルにも露出する。現状アプリ内では未参照で、将来の管理者関連機能向けに保持している（機微な個人メールは設定しない）                                                                                                                                                                                                                               | 運用で定める管理者アカウントのメールアドレス                                          |
| `GOOGLE_CALENDAR_IDS`           | 取得対象の Google Calendar の `alias:calendarId` ペアをカンマ区切りで指定する。`alias` は `app/constants/calendar.ts` の `CALENDAR_COLORS` で定義されたキー（例: `singularity-mtg` / `singularity-event` / `holiday` / `test-calendar`）。`calendarId` に `#` を含む場合は `%23` に URL エンコードする必要がある（実装で `decodeURIComponent` されるため）。例: `holiday:ja.japanese%23holiday@group.v.calendar.google.com` | Google Calendar の各カレンダー設定画面で取得した ID を、対応する alias と組み合わせる |
| `GOOGLE_SERVICE_ACCOUNT_KEY`    | Google API を呼び出すためのサービスアカウント鍵（JSON 文字列）。カレンダー API への認証に使用する                                                                                                                                                                                                                                                                                                                           | Google Cloud Console で発行した JSON 鍵の中身（1 行に整形）                           |
| `SLACK_WEBHOOK_URL`             | Slack に通知を送るための Incoming Webhook URL（任意設定）。申請・承認イベント等の通知送信先として使用する                                                                                                                                                                                                                                                                                                                   | Slack の Incoming Webhook 設定画面                                                    |

#### 環境変数を追加・変更するとき

`.env.development`（暗号化）・`.env.example`・Vercel ダッシュボードの**3か所を同期**する。`.env.example` はキー一覧の雛形であり、リリース PR の「新規環境変数の検出」の基準となるため必ず更新する。

#### 重要な注意事項

- 復号鍵はセキュアストアで保管し、平文の `.env.keys` は原則として作らない（例外は最終手段のフォールバックと、ローテーション作業での一時生成。後者は作業後に削除する）
- 秘密鍵（`.env.keys` / `DOTENV_PRIVATE_KEY_DEVELOPMENT`）は Git にコミットしない。暗号化済みの `.env.development` はコミットされる（`.env*` を除外しつつ `.env.development` のみコミット許可）
- 本番（Vercel）は dotenvx を使わず、環境変数はダッシュボードで設定する
- 環境変数の値は機密情報のため、公開しないでください
- 復号鍵や値が不明な場合は、Slackの`201-club_チーム開発`チャンネルで質問してください

#### 鍵・秘密情報のローテーション

本リポジトリは公開リポジトリだが、暗号化済みの `.env.development`（サーバー秘密である Google サービスアカウント鍵・Slack Webhook を含む）をコミットする方針を採る。暗号文自体は復号鍵なしには解けないが、**一度コミットした暗号文は Git 履歴に永久に残る**ため、安全性は最終的に「復号鍵の秘匿」に依存する。したがって以下を守る。

- **鍵配布の最小化**: 復号鍵（`DOTENV_PRIVATE_KEY_DEVELOPMENT`）を渡すのは、実際に開発中の現行メンバーのみに限る。
- **メンバー離脱・予防的ローテ（鍵ペアの入れ替え）**: 復号鍵を持つメンバーが抜けたとき等に実施する。現行の復号鍵が手元にある状態で、プロジェクトルートで以下を行う。

  ```bash
  # 1) 現行の鍵で復号（平文に戻す）
  npx dotenvx decrypt -f .env.development

  # 2) 旧鍵ペアを破棄（.env.development から DOTENV_PUBLIC_KEY_DEVELOPMENT の行を削除し、旧秘密鍵ファイルも削除）
  rm -f .env.keys

  # 3) 新しい鍵ペアで再暗号化（新しい .env.development と .env.keys が生成される）
  npx dotenvx encrypt -f .env.development
  ```

  生成された新しい秘密鍵（`.env.keys` の `DOTENV_PRIVATE_KEY_DEVELOPMENT`）を現行メンバーへ配布し、再暗号化済みの `.env.development` をコミットする。**配布後は自分の鍵を Step 2 の手順でセキュアストアへ保存し、`rm -f .env.keys` で削除する**（ローテーション作業以外で `.env.keys` を残さない）。
  なお、この鍵入れ替えだけでは**過去にコミットした暗号文（履歴）は保護されない**点に注意する。旧鍵が漏れていれば履歴の値は復号され得るため、鍵漏洩が疑われる場合は次の緊急対応を行う。

- **鍵・秘密情報の漏洩時（緊急対応）**: 復号鍵の漏洩が疑われる場合、鍵の入れ替えだけでは不十分で、**暗号化していた秘密情報そのものを上流で無効化・再発行**する必要がある。
  1. Supabase: Dashboard → Project Settings → API で API キーをローテーションする（必要に応じて anon / service キーを再発行）。
  2. Google サービスアカウント: Google Cloud Console で対象の鍵を削除し、新しい JSON 鍵を発行する。
  3. Slack: 対象の Incoming Webhook を無効化し、新しい Webhook を発行する。
  4. 新しい値で `.env.development` を再暗号化し（`npx dotenvx set <KEY> <値> -f .env.development`）、上記「予防的ローテ」の手順で dev 鍵も入れ替える。
  5. Vercel ダッシュボードの本番環境変数も同じ新しい値へ更新する。

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
[dotenvx@x.x.x] injected env (8) from .env.development
▲ Next.js 15.x.x
- Local:        http://localhost:3000

✓ Ready in Xms
```

`injected env (...) from .env.development` の行が表示されれば、dotenvx による復号・注入が成功しています。

### 3.2 ブラウザでの動作確認

1. ブラウザで `http://localhost:3000` にアクセス
2. ログイン画面が表示されることを確認
3. 「Googleでログイン」ボタンが表示されることを確認

注意：実際にログインして機能を確認するには、「ユーザー承認」が必要です。

### 3.3 ビルドの確認

本番環境と同じビルドプロセスが正常に動作するか確認します。

```bash
# コンパイル確認（CI・Vercel と同じ、環境変数を注入しない素のビルド）
npm run build

# 実際の環境変数を注入したローカル本番ビルド（復号鍵が必要）
npm run build:local
```

エラーなくビルドが完了すれば OK です。

`NEXT_PUBLIC_*` はビルド時にバンドルへ焼き込まれるため、実際の値でクライアント動作まで確認したい場合は `npm run build:local`（実 env でビルド）→ `npm run start:local`（実 env で本番サーバー起動）を使う。素の `npm run build` / `npm run start` は環境変数を注入しないため、Vercel（ダッシュボードの環境変数を使用）や CI と同じ挙動になる。

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

症状： 開発サーバー起動時に復号エラーが発生し、起動に失敗する

```text
☠ [DECRYPTION_FAILED] could not decrypt NEXT_PUBLIC_SUPABASE_URL, ... fix: [https://github.com/dotenvx/dotenvx/issues/757]
```

解決方法： このエラーは **復号鍵が未設定のときと、鍵が間違っているときの両方で同じ文言**が出るため、メッセージからは原因を判別できない。[§2.3 の「うまくいかないとき（症状別）」](#うまくいかないとき症状別)の表に従い、Step 4 (1) の結果（期待値 `64`）から切り分ける。

とくに多いのは次の 2 つ。

1. 起動ファイル（`~/.zshrc` 等）に export 行を追記した後、ターミナルを開き直していない
2. Keychain に保存した鍵に、変数名や引用符などの余計な文字が混入している

上記に該当しない場合は、開発サーバーを再起動（Ctrl + C で停止後、`npm run dev`）して再確認する。

### TypeScript のエラー

症状： 型エラーが大量に表示される

解決方法：

```bash
# TypeScript の型定義を再生成（ローカルは dotenvx 経由の :local を使う）
npm run db:types:local

# または、既存のビルドキャッシュをクリア
rm -rf .next
npm run dev
```

## 次のステップ

環境構築が完了したら、チーム開発会議で担当となったissueの設計・実装を進めてください。
