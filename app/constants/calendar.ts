import colors from "tailwindcss/colors";

// カレンダーエイリアスごとの色定義（固定色）
// エイリアス名は .env.local の GOOGLE_CALENDAR_IDS で定義
export const CALENDAR_COLORS: {
  [key: string]: { backgroundColor: string; borderColor: string };
} = {
  // シンラボMTGカレンダー
  "singularity-mtg": {
    backgroundColor: colors.purple[600],
    borderColor: colors.purple[700],
  },
  // シンラボイベントカレンダー
  "singularity-event": {
    backgroundColor: colors.red[500],
    borderColor: colors.red[600],
  },
  // 日本の祝日カレンダー
  holiday: {
    backgroundColor: colors.blue[500],
    borderColor: colors.blue[600],
  },
};

// デフォルトの色（カレンダーIDが未設定または未定義の場合）
export const DEFAULT_CALENDAR_COLOR = {
  backgroundColor: colors.gray[500], // グレー
  borderColor: colors.gray[600],
};

// react-big-calendar用の日本語メッセージ設定
export const CALENDAR_MESSAGES = {
  allDay: "終日",
  previous: "前",
  next: "次",
  today: "今日",
  month: "月",
  week: "週",
  day: "日",
  agenda: "予定リスト",
  date: "日付",
  time: "時間",
  event: "イベント",
  noEventsInRange: "この期間にイベントはありません",
  showMore: (total: number) => `+ ${total}件`,
} as const;

// イベントのテキスト色
export const EVENT_TEXT_COLOR = "white";
