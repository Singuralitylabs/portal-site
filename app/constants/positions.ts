// 役職者セクションで抽出表示する position_id
// id 8, 9, 10 はアプリケーションコードで参照する予約済みID（docs/database.md §2.6 参照）
export const LEADERSHIP_POSITIONS = [
  { id: 8, name: "代表" },
  { id: 9, name: "副代表" },
  { id: 10, name: "シンラボ管理人" },
] as const;
