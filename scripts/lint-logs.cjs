#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', 'app');
const TARGET_EXTENSIONS = new Set(['.ts', '.tsx']);
const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist']);
const ALLOW_LIST = [
  { file: 'app/(auth)/callback/route.ts', includes: '"認証成功:' },
  { file: 'app/(auth)/callback/route.ts', includes: '"認証セッション確立完了"' },
  { file: 'app/(auth)/callback/route.ts', includes: '"認証コードなしまたはエラー"' },
  { file: 'app/providers/supabase-auth-provider.tsx', includes: '"新規ユーザーをusersテーブルに追加:' }
];

function walk(dir, collector) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, collector);
    } else if (entry.isFile() && TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      collector.push(fullPath);
    }
  }
}

function isAllowed(filePath, line) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return ALLOW_LIST.some(({ file, includes }) => normalizedPath.endsWith(file) && line.includes(includes));
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error('app directory not found');
    process.exit(1);
  }

  const files = [];
  walk(ROOT, files);

  const violations = [];
  const patterns = [/console\.(log|info)\s*\(/, /debugger/];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (patterns.some((regex) => regex.test(line))) {
        if (!isAllowed(file, line)) {
          violations.push({ file, line: index + 1, text: line.trim() });
        }
      }
    });
  }

  if (violations.length > 0) {
    console.error('NG! console.log/info/debugger が見つかりました。削除してください。');
    violations.forEach(({ file, line, text }) => {
      console.error(`${path.relative(process.cwd(), file)}:${line}: ${text}`);
    });
    process.exit(1);
  } else {
    console.log('OK! console.log/info/debugger は見つかりませんでした。');
  }
}

main();
