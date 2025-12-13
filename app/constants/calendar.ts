// カレンダーIDごとの色定義（固定色）
export const CALENDAR_COLORS: {
  [key: string]: { backgroundColor: string; borderColor: string };
} = {
  // シンラボMTGカレンダー
  "c_4df1ec54385c933420637b11092efb7af2d5e7829941f8a7527ec5a8e4a2033d@group.calendar.google.com": {
    backgroundColor: "#9333ea", // 紫色
    borderColor: "#7e22ce",
  },
  // 日本の祝日カレンダー
  "ja.japanese#holiday@group.v.calendar.google.com": {
    backgroundColor: "#ef4444", // 赤色
    borderColor: "#dc2626",
  },
};

// デフォルトの色（カレンダーIDが未設定または未定義の場合）
export const DEFAULT_CALENDAR_COLOR = {
  backgroundColor: "#6b7280", // グレー
  borderColor: "#4b5563",
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
