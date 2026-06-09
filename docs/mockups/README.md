# 画面モック運用（PoC）

`docs/mockups/` は、機能設計書に掲載する画面イメージの素材を管理するディレクトリです。

## ディレクトリ方針

- `drawio/`: Draw.io の編集元データ（`.drawio`）
- `svg/`: 設計書掲載用の SVG
- `png/`: 設計書掲載用の PNG（Playwright 生成）
- `html/`: 軽量 HTML モック（必要な場合）
- `screenshots/`: 実画面キャプチャ（Playwright などで取得）

現時点では最小検証段階のため、まずは `/mockups` ルートの HTML モックと併用しながら運用を固める。

## ローカルでの SVG 生成手順

JSON 定義から SVG を生成する PoC スクリプトを用意しているため、Node.js があればどの環境でも同じ手順で生成できます。

1. 生成元定義を編集する
   - `docs/mockups/specs/*.json`

2. SVG を生成する

   ```bash
   npm run mockup:svg
   ```

3. 出力先を確認する
   - `docs/mockups/svg/*.svg`

## ブラウザ描画 + Playwright で PNG 生成する手順

実装済みの HTML モックをブラウザで描画し、描画結果を PNG 化する PoC パターンです。

1. 前提
   - 開発サーバーを起動していること（`npm run dev`）
   - `playwright` パッケージがインストール済みであること

   ```bash
   npm install -D playwright
   ```

2. 実行

   ```bash
   npm run mockup:png:playwright
   ```

3. 出力先
   - `docs/mockups/png/login.playwright.png`

補足:

- 既定では `http://127.0.0.1:3000/mockups/login` を対象にします
- 必要に応じて `MOCKUP_BASE_URL` で対象ホストを変更できます

  ```bash
  MOCKUP_BASE_URL="http://127.0.0.1:3001" npm run mockup:png:playwright
  ```

## 方針

- 生成元の正本は `docs/mockups/specs/*.json` とする
- 生成物は `docs/mockups/png/*.png` を優先して設計書から参照する
- Draw.io 運用と併用する場合は、将来的に `.drawio -> .svg` の生成フローと統合する
