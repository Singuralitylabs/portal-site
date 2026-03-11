# AI Agents 補助ガイド

このファイルは **AI向け** の補助エントリです。

## 位置づけ

- Agent 実行時の実質的な運用ルールは `.github/copilot-instructions.md` に統合する
- 本ファイルは「Agent向けであること」の明示と、参照先案内のみに限定する

## 参照先

1. `.github/copilot-instructions.md`
   - Copilot / Agent 共通の運用ルール
   - レビュー優先度（P0〜P3）
   - Agent の役割分担（Planner / Builder / Reviewer）
   - 実装後チェック（`npm run lint` / `npm run type-check` / `npm run build`）
2. GitHub Wiki（正本）
   - コーディング規約・開発フローの詳細
3. `docs/` 配下
   - 機能仕様・DB設計・API仕様

## Wikiとの二重管理方針

- GitHub Copilot / Agent は Wiki を常に自動参照できるとは限らない
- そのため、Agent実行に必須な最小ルールは `.github/copilot-instructions.md` に要約転記して保持する
- 差分が出た場合は Wiki を正本として、`.github/copilot-instructions.md` を同期更新する
