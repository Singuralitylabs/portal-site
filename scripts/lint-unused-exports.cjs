#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const PROJECT = 'tsconfig.json';
const STRICT = process.env.UNUSED_EXPORTS_STRICT === 'true';

const IGNORE_PATH_REGEXPS = [
  /^\.next\//,
  /^next\.config\.ts$/,
  /^tailwind\.config\.ts$/,
  /^postcss\.config\.[cm]?js$/,
  /^middleware\.ts$/,
  /^app\/layout\.tsx$/,
  /^app\/types\/lib\/database\.types\.ts$/,
  /^app\/types\/index\.ts$/,
  /^app\/.*\/(layout|template|loading|error|not-found)\.(ts|tsx)$/,
  /^app\/.*\/page\.(ts|tsx)$/,
  /^app\/.*\/route\.ts$/
];

const IGNORE_EXPORTS = new Set([
  'middleware.ts:middleware',
  'middleware.ts:config',
  'app/layout.tsx:metadata'
]);

function runTsPrune() {
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = [
    'ts-prune',
    '--project',
    PROJECT,
    '--ignore',
    'app/types/lib/database.types.ts'
  ];

  return spawnSync(npxCmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function main() {
  const result = runTsPrune();

  if (result.error) {
    console.error('ts-prune 実行に失敗しました:', result.error.message);
    process.exit(1);
  }

  if (result.status !== 0 && !result.stdout) {
    console.error('ts-prune が異常終了しました:\n', result.stderr.trim());
    process.exit(result.status ?? 1);
  }

  const findings = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseFinding)
    .filter(Boolean)
    .filter((finding) => !shouldIgnore(finding));

  if (findings.length === 0) {
    console.log('OK! 未使用エクスポートは見つかりませんでした。');
    return;
  }

  console.warn('未使用エクスポートを検出しました (ts-prune):');
  findings.forEach((finding) => {
    const relPath = finding.relativePath;
    const lineInfo = finding.line ? `#L${finding.line}` : '';
    const exportInfo = finding.exportName ? ` - ${finding.exportName}` : '';
    console.warn(`- ${relPath}${lineInfo}${exportInfo}`);
  });

  if (STRICT) {
    console.error('UNUSED_EXPORTS_STRICT=true のため失敗します。');
    process.exit(1);
  } else {
    console.warn('情報提供のみのため、エラーコード 0 で終了します。');
  }
}

function parseFinding(rawLine) {
  const match = rawLine.match(/^(.*?):(\d+)\s+-\s+(.*)$/);
  let filePath;
  let lineNumber;
  let exportName;

  if (match) {
    [, filePath, lineNumber, exportName] = match;
  } else {
    const [first, ...rest] = rawLine.split(':');
    filePath = first;
    exportName = rest.join(':').trim();
  }

  if (!filePath) {
    return null;
  }

  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return {
    filePath,
    relativePath,
    line: lineNumber ? Number(lineNumber) : undefined,
    exportName: exportName?.trim() ?? ''
  };
}

function shouldIgnore(finding) {
  const key = `${finding.relativePath}:${finding.exportName}`;
  if (IGNORE_EXPORTS.has(key)) {
    return true;
  }

  return IGNORE_PATH_REGEXPS.some((regex) => regex.test(finding.relativePath));
}

main();
