const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "docs/mockups/png");
const baseUrl = process.env.MOCKUP_BASE_URL || "http://127.0.0.1:3000";
const viewportWidth = Number(process.env.MOCKUP_VIEWPORT_WIDTH || 1280);
const viewportHeight = Number(process.env.MOCKUP_VIEWPORT_HEIGHT || 720);

const targets = [
  {
    name: "login.playwright",
    url: `${baseUrl}/mockups/login`,
    selector: "main",
  },
];

function getPlaywrightModule() {
  try {
    return require("playwright");
  } catch {
    return null;
  }
}

async function captureAsPng({ browser, target }) {
  const page = await browser.newPage({
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
  });

  await page.goto(target.url, { waitUntil: "networkidle" });
  await page.waitForSelector(target.selector, { timeout: 15000 });

  const locator = page.locator(target.selector).first();
  const pngBuffer = await locator.screenshot({
    type: "png",
  });

  await page.close();
  return pngBuffer;
}

async function run() {
  const playwright = getPlaywrightModule();
  if (!playwright) {
    console.error("playwright package is not installed.");
    console.error("Install dev dependency: npm install -D playwright");
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  const browser = await playwright.chromium.launch({
    headless: true,
  });

  try {
    for (const target of targets) {
      const pngBuffer = await captureAsPng({ browser, target });
      const outPath = path.join(outDir, `${target.name}.png`);
      fs.writeFileSync(outPath, pngBuffer);
      console.log(`generated: docs/mockups/png/${target.name}.png`);
    }
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
