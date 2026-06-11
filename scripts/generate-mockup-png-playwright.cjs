const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "docs/mockups/png");
const baseUrl = process.env.MOCKUP_BASE_URL || "http://127.0.0.1:3000";
const viewportWidth = Number(process.env.MOCKUP_VIEWPORT_WIDTH || 1280);
const viewportHeight = Number(process.env.MOCKUP_VIEWPORT_HEIGHT || 720);

const targets = [
  {
    name: "mockups-index.playwright",
    url: `${baseUrl}/mockups`,
    selector: '[data-mockup-capture="mockups-index-content"]',
  },
  {
    name: "home.playwright",
    url: `${baseUrl}/mockups/home`,
    selector: '[data-mockup-capture="home-content"]',
  },
  {
    name: "login.playwright",
    url: `${baseUrl}/mockups/login`,
    selector: '[data-mockup-capture="login-content"]',
  },
  {
    name: "pending.playwright",
    url: `${baseUrl}/mockups/pending`,
    selector: '[data-mockup-capture="pending-content"]',
  },
  {
    name: "rejected.playwright",
    url: `${baseUrl}/mockups/rejected`,
    selector: '[data-mockup-capture="rejected-content"]',
  },
  {
    name: "documents-layout.playwright",
    url: `${baseUrl}/mockups/documents`,
    selector: '[data-mockup-capture="documents-layout-content"]',
  },
  {
    name: "document-card.playwright",
    url: `${baseUrl}/mockups/documents/card`,
    selector: '[data-mockup-capture="document-card-content"]',
  },
  {
    name: "document-detail-modal.playwright",
    url: `${baseUrl}/mockups/documents/detail-modal`,
    selector: '[data-mockup-capture="document-detail-modal-content"]',
  },
  {
    name: "videos-layout.playwright",
    url: `${baseUrl}/mockups/videos`,
    selector: '[data-mockup-capture="videos-layout-content"]',
  },
  {
    name: "video-card.playwright",
    url: `${baseUrl}/mockups/videos/card`,
    selector: '[data-mockup-capture="video-card-content"]',
  },
  {
    name: "video-detail.playwright",
    url: `${baseUrl}/mockups/videos/detail`,
    selector: '[data-mockup-capture="video-detail-content"]',
  },
];

function getPlaywrightModule() {
  try {
    return require("playwright");
  } catch {
    return null;
  }
}

async function hideDevOverlayArtifacts(page) {
  // Hide known Next.js dev overlay containers.
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-toast],
      [data-next-badge-root],
      #__next-build-watcher,
      #nextjs__container,
      #__nextjs-dev-overlay {
        display: none !important;
        visibility: hidden !important;
      }
    `,
  });

  // Remove remaining fixed issue badges that can appear in dev mode.
  await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("body *"));
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }

      const text = (node.textContent || "").toLowerCase();
      const style = window.getComputedStyle(node);
      const isBottomLeft =
        style.position === "fixed" && style.left !== "auto" && style.bottom !== "auto";
      if (isBottomLeft && text.includes("issue")) {
        node.style.display = "none";
      }
    }
  });
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
  await hideDevOverlayArtifacts(page);

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
