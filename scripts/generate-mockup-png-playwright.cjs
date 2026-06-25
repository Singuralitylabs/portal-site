const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { URL } = require("node:url");

const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "docs/mockups/png");
const htmlRoot = path.join(projectRoot, "docs/mockups/html");
const viewportWidth = Number(process.env.MOCKUP_VIEWPORT_WIDTH || 1280);
const viewportHeight = Number(process.env.MOCKUP_VIEWPORT_HEIGHT || 720);

const targets = [
  {
    name: "mockups-index.playwright",
    path: "/",
    selector: '[data-mockup-capture="mockups-index-content"]',
  },
  {
    name: "home.playwright",
    path: "/home/",
    selector: '[data-mockup-capture="home-content"]',
  },
  {
    name: "login.playwright",
    path: "/login/",
    selector: '[data-mockup-capture="login-content"]',
  },
  {
    name: "pending.playwright",
    path: "/pending/",
    selector: '[data-mockup-capture="pending-content"]',
  },
  {
    name: "rejected.playwright",
    path: "/rejected/",
    selector: '[data-mockup-capture="rejected-content"]',
  },
  {
    name: "documents-layout.playwright",
    path: "/documents/",
    selector: '[data-mockup-capture="documents-layout-content"]',
  },
  {
    name: "document-card.playwright",
    path: "/documents/card/",
    selector: '[data-mockup-capture="document-card-content"]',
  },
  {
    name: "document-detail-modal.playwright",
    path: "/documents/detail-modal/",
    selector: '[data-mockup-capture="document-detail-modal-content"]',
  },
  {
    name: "videos-layout.playwright",
    path: "/videos/",
    selector: '[data-mockup-capture="videos-layout-content"]',
  },
  {
    name: "video-card.playwright",
    path: "/videos/card/",
    selector: '[data-mockup-capture="video-card-content"]',
  },
  {
    name: "video-detail.playwright",
    path: "/videos/detail/",
    selector: '[data-mockup-capture="video-detail-content"]',
  },
  {
    name: "profile-layout.playwright",
    path: "/profile/",
    selector: '[data-mockup-capture="profile-layout-content"]',
  },
  {
    name: "members-layout.playwright",
    path: "/members/",
    selector: '[data-mockup-capture="members-layout-content"]',
  },
  {
    name: "member-card.playwright",
    path: "/members/card/",
    selector: '[data-mockup-capture="member-card-content"]',
  },
  {
    name: "member-detail-modal.playwright",
    path: "/members/detail-modal/",
    selector: '[data-mockup-capture="member-detail-modal-content"]',
  },
  {
    name: "applications-layout.playwright",
    path: "/applications/",
    selector: '[data-mockup-capture="applications-layout-content"]',
  },
  {
    name: "application-card.playwright",
    path: "/applications/card/",
    selector: '[data-mockup-capture="application-card-content"]',
  },
  {
    name: "application-detail-modal.playwright",
    path: "/applications/detail-modal/",
    selector: '[data-mockup-capture="application-detail-modal-content"]',
  },
  {
    name: "dashboard-sidebar.playwright",
    path: "/dashboard/sidebar/",
    selector: '[data-mockup-capture="dashboard-sidebar-content"]',
  },
  {
    name: "dashboard-layout.playwright",
    path: "/dashboard/",
    selector: '[data-mockup-capture="dashboard-layout-content"]',
  },
  {
    name: "dashboard-approve-modal.playwright",
    path: "/dashboard/approve-modal/",
    selector: '[data-mockup-capture="dashboard-approve-modal-content"]',
  },
  {
    name: "dashboard-reject-modal.playwright",
    path: "/dashboard/reject-modal/",
    selector: '[data-mockup-capture="dashboard-reject-modal-content"]',
  },
];

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

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

function resolveStaticFilePath(requestPathname) {
  const decodedPath = decodeURIComponent(requestPathname);
  let candidate = path.join(htmlRoot, decodedPath);

  if (!path.extname(candidate)) {
    if (decodedPath.endsWith("/")) {
      candidate = path.join(candidate, "index.html");
    } else {
      candidate = `${candidate}.html`;
    }
  }

  const normalizedRoot = path.resolve(htmlRoot);
  const normalizedCandidate = path.resolve(candidate);
  if (!normalizedCandidate.startsWith(normalizedRoot)) {
    return null;
  }

  if (!fs.existsSync(normalizedCandidate)) {
    return null;
  }

  return normalizedCandidate;
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = new URL(req.url || "/", "http://127.0.0.1");
      const filePath = resolveStaticFilePath(parsed.pathname);

      if (!filePath) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "content-type": mimeType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to acquire static server address"));
        return;
      }

      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function captureAsPng({ baseUrl, browser, target }) {
  const page = await browser.newPage({
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
  });

  const targetUrl = new URL(target.path, `${baseUrl}/`).toString();

  await page.goto(targetUrl, { waitUntil: "networkidle" });
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

  if (!fs.existsSync(htmlRoot)) {
    console.error("mockup html root does not exist:", htmlRoot);
    process.exitCode = 1;
    return;
  }

  const manualBaseUrl = process.env.MOCKUP_BASE_URL;
  let staticServer = null;
  let baseUrl = manualBaseUrl;

  if (!baseUrl) {
    const started = await startStaticServer();
    staticServer = started.server;
    baseUrl = started.baseUrl;
    console.log(`mockup static server started: ${baseUrl}`);
  }

  const browser = await playwright.chromium.launch({
    headless: true,
  });

  try {
    for (const target of targets) {
      const pngBuffer = await captureAsPng({ baseUrl, browser, target });
      const outPath = path.join(outDir, `${target.name}.png`);
      fs.writeFileSync(outPath, pngBuffer);
      console.log(`generated: docs/mockups/png/${target.name}.png`);
    }
  } finally {
    await browser.close();
    if (staticServer) {
      await new Promise(resolve => staticServer.close(resolve));
      console.log("mockup static server stopped");
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
