// Astro integration: render the /resume page to a clean white/black PDF.
//
//   build (astro:build:done)   → serve dist, render /resume.html, write dist/resume.pdf
//   dev   (astro:server:setup) → intercept GET /resume.pdf, render live against the dev server

import type { AstroIntegration } from "astro";
import { writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer, { type Browser } from "puppeteer";
import handler from "serve-handler";

async function renderPdf(browser: Browser, url: string): Promise<Uint8Array> {
  const page = await browser.newPage();
  try {
    await page.emulateMediaType("print");
    await page.goto(url, { waitUntil: "networkidle0" });
    // Ensure webfonts (if any) have finished loading before capturing.
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({ printBackground: true, preferCSSPageSize: true });
  } finally {
    await page.close();
  }
}

// Reuse one long-lived browser in dev.
let devBrowser: Promise<Browser> | undefined;
function getDevBrowser(): Promise<Browser> {
  devBrowser ??= puppeteer.launch({ headless: true });
  return devBrowser;
}

// Serve a built directory (correct even if /resume pulls external assets).
async function serveDir(root: string): Promise<Server> {
  const server = createServer((req, res) => handler(req, res, { public: root }));
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

export default function resumePdf(): AstroIntegration {
  return {
    name: "resume-pdf",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const server = await serveDir(root);
        const { port } = server.address() as AddressInfo;
        const browser = await puppeteer.launch({ headless: true });
        try {
          const pdf = await renderPdf(browser, `http://127.0.0.1:${port}/resume`);
          await writeFile(join(root, "resume.pdf"), pdf);
          logger.info("Generated resume.pdf");
        } finally {
          await browser.close();
          server.close();
        }
      },

      "astro:server:setup": ({ server, logger }) => {
        server.middlewares.use((req, res, next) => {
          if ((req.url ?? "").split("?")[0] !== "/resume.pdf") {
            next();
            return;
          }
          getDevBrowser()
            .then((browser) => renderPdf(browser, `http://${req.headers.host}/resume`))
            .then((pdf) => {
              res.setHeader("content-type", "application/pdf");
              res.end(Buffer.from(pdf));
            })
            .catch((err: unknown) => {
              logger.error(`resume.pdf render failed: ${(err as Error).message}`);
              res.statusCode = 500;
              res.end("PDF generation failed");
            });
        });
      },
    },
  };
}
