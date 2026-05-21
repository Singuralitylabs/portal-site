const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const specsDir = path.join(projectRoot, "docs/mockups/specs");
const outDir = path.join(projectRoot, "docs/mockups/svg");

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLines(value) {
  if (Array.isArray(value)) {
    return value.map(line => String(line));
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [String(value)];
}

function renderTextLines({
  x,
  y,
  lines,
  fontSize,
  fontWeight,
  fill,
  anchor = "start",
  lineGap = 1.45,
}) {
  if (!lines.length) {
    return "";
  }

  const escapedLines = lines.map(escapeXml);
  const tspans = escapedLines
    .map((line, index) => {
      if (index === 0) {
        return `<tspan x="${x}" dy="0">${line}</tspan>`;
      }
      return `<tspan x="${x}" dy="${Math.round(fontSize * lineGap)}">${line}</tspan>`;
    })
    .join("");

  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${fontSize}" font-family="'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif" font-weight="${fontWeight}" fill="${fill}">${tspans}</text>`;
}

function textBlockHeight(lineCount, fontSize, lineGap = 1.45) {
  if (lineCount <= 0) {
    return 0;
  }
  return fontSize + (lineCount - 1) * Math.round(fontSize * lineGap);
}

function buildSvg(spec) {
  const title = escapeXml(spec.title || "画面モック");
  const subtitleLines = normalizeLines(spec.subtitleLines || spec.subtitle);
  const buttonLabel = escapeXml(spec.buttonLabel || "ボタン");
  const noticeTitle = escapeXml(spec.noticeTitle || "お知らせ");
  const noticeBodyLines = normalizeLines(spec.noticeBodyLines || spec.noticeBody);
  const noticeDomain = escapeXml(spec.noticeDomain || "");

  const titleY = 92;
  const subtitleY = 156;
  const subtitleFontSize = 26;

  const buttonY = 208;
  const buttonHeight = 74;
  const buttonCenterY = buttonY + Math.round(buttonHeight / 2) + 10;

  const noticeBoxY = 360;
  const noticeTitleY = 422;
  const noticeBodyStartY = 478;
  const noticeBodyFontSize = 20;
  const noticeBodyLineGap = 1.5;
  const noticeBodyHeight = textBlockHeight(
    noticeBodyLines.length,
    noticeBodyFontSize,
    noticeBodyLineGap
  );
  const noticeDomainY = noticeBodyStartY + noticeBodyHeight + 56;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="mockup-screen">
  <defs>
    <filter id="buttonShadow" x="-20%" y="-20%" width="140%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.16" />
    </filter>
  </defs>

  <rect width="1280" height="720" fill="#e5e7eb" />

  <text x="640" y="${titleY}" text-anchor="middle" font-size="54" font-family="'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif" font-weight="700" fill="#000000">${title}</text>
  ${renderTextLines({
    x: 640,
    y: subtitleY,
    lines: subtitleLines,
    fontSize: subtitleFontSize,
    fontWeight: 700,
    fill: "#ef4444",
    anchor: "middle",
  })}

  <rect x="378" y="${buttonY}" width="524" height="${buttonHeight}" rx="10" fill="#ffffff" stroke="#9ca3af" stroke-width="2" filter="url(#buttonShadow)" />
  <circle cx="463" cy="${buttonY + Math.round(buttonHeight / 2)}" r="23" fill="#ffffff" stroke="#d1d5db" stroke-width="1" />
  <text x="463" y="${buttonCenterY}" text-anchor="middle" font-size="40" font-family="Arial, sans-serif" font-weight="700" fill="#2563eb">G</text>
  <text x="524" y="${buttonCenterY}" text-anchor="start" font-size="58" font-family="'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif" font-weight="700" fill="#000000">${buttonLabel}</text>

  <rect x="188" y="${noticeBoxY}" width="904" height="290" rx="16" fill="#dbe4f0" />
  <text x="220" y="${noticeTitleY}" text-anchor="start" font-size="51" font-family="'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif" font-weight="700" fill="#1e3a8a">${noticeTitle}</text>
  ${renderTextLines({
    x: 220,
    y: noticeBodyStartY,
    lines: noticeBodyLines,
    fontSize: noticeBodyFontSize,
    fontWeight: 400,
    fill: "#1e3a8a",
    anchor: "start",
    lineGap: noticeBodyLineGap,
  })}
  <text x="640" y="${noticeDomainY}" text-anchor="middle" font-size="40" font-family="'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', sans-serif" font-weight="400" fill="#1e3a8a">${noticeDomain}</text>
</svg>
`;
}

function run() {
  if (!fs.existsSync(specsDir)) {
    throw new Error(`Spec directory not found: ${specsDir}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const files = fs
    .readdirSync(specsDir)
    .filter(file => file.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    console.log("No mockup spec files found.");
    return;
  }

  for (const file of files) {
    const name = path.basename(file, ".json");
    const specPath = path.join(specsDir, file);
    const outPath = path.join(outDir, `${name}.svg`);

    const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
    const svg = buildSvg(spec);
    fs.writeFileSync(outPath, svg, "utf8");
    console.log(`generated: docs/mockups/svg/${name}.svg`);
  }
}

run();
