-- 新規登録 Slack 通知の1回制限用。updated_at は BEFORE UPDATE トリガーで
-- CURRENT_TIMESTAMP に上書きされるため、通知状態の claim/release には使えない。
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_notified_at TIMESTAMPTZ;
