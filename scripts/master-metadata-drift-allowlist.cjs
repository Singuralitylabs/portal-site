// docs/database.md が database.types.ts より先行して更新されるケースだけを明示管理する。
// ここに登録した列は metadata 生成時に警告のみとし、database.types.ts へ反映されるまでは
// generated metadata / master.ts の出力対象には含めない。

const MASTER_METADATA_DRIFT_ALLOWLIST = {
  documents: [],
  videos: [],
  categories: [],
  applications: [],
  positions: [],
};

module.exports = {
  MASTER_METADATA_DRIFT_ALLOWLIST,
};
