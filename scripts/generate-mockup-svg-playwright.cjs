const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const outDir = path.join(projectRoot, "docs/mockups/svg");
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

async function captureAsSvg({ browser, target }) {
  const page = await browser.newPage({
    viewport: {
      width: viewportWidth,
      height: viewportHeight,
    },
  });

  await page.goto(target.url, { waitUntil: "networkidle" });
  await page.waitForSelector(target.selector, { timeout: 15000 });

  const svg = await page.evaluate(
    ({ selector, width, height }) => {
      function inlineComputedStyles(sourceEl, clonedEl) {
        if (!(sourceEl instanceof Element) || !(clonedEl instanceof Element)) {
          return;
        }

        const computed = getComputedStyle(sourceEl);
        let cssText = "";

        for (let i = 0; i < computed.length; i += 1) {
          const propName = computed[i];
          cssText += `${propName}:${computed.getPropertyValue(propName)};`;
        }

        clonedEl.setAttribute("style", cssText);

        const srcChildren = sourceEl.children;
        const clonedChildren = clonedEl.children;

        for (let i = 0; i < srcChildren.length; i += 1) {
          inlineComputedStyles(srcChildren[i], clonedChildren[i]);
        }
      }

      function escapeXml(value) {
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      const root = document.querySelector(selector) || document.body;
      if (!(root instanceof HTMLElement)) {
        throw new Error(`target element not found: ${selector}`);
      }

      const clone = root.cloneNode(true);
      if (!(clone instanceof HTMLElement)) {
        throw new Error("failed to clone target element");
      }

      inlineComputedStyles(root, clone);

      clone.querySelectorAll("script").forEach(node => node.remove());

      const bodyComputed = getComputedStyle(document.body);
      const bgColor = bodyComputed.backgroundColor || "#ffffff";

      return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="mockup-screen-playwright">\n  <foreignObject x="0" y="0" width="100%" height="100%">\n    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;background:${escapeXml(bgColor)};">${clone.outerHTML}</div>\n  </foreignObject>\n</svg>\n`;
    },
    {
      selector: target.selector,
      width: viewportWidth,
      height: viewportHeight,
    }
  );

  await page.close();
  return svg;
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
      const svg = await captureAsSvg({ browser, target });
      const outPath = path.join(outDir, `${target.name}.svg`);
      fs.writeFileSync(outPath, svg, "utf8");
      console.log(`generated: docs/mockups/svg/${target.name}.svg`);
    }
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
