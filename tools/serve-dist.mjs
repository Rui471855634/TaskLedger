import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

function firstExistingDir(candidates) {
  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

const distDir = firstExistingDir([
  process.env.DIST_DIR,
  // Preferred for "release zip" layout: dist/ next to where user runs the command
  path.resolve(process.cwd(), "dist"),
  // Preferred for this repo's source layout
  path.resolve(__dirname, "../apps/web/dist"),
]);

if (!distDir) {
  console.error(
    [
      "TaskLedger: cannot find dist directory.",
      "Tried:",
      `- DIST_DIR env var (currently: ${process.env.DIST_DIR || "(not set)"})`,
      `- ${path.resolve(process.cwd(), "dist")}`,
      `- ${path.resolve(__dirname, "../apps/web/dist")}`,
      "",
      "Fix:",
      "- Build the web app first (npm run build), or",
      "- Put dist/ next to where you run this command, or",
      "- Set DIST_DIR to the folder that contains index.html.",
    ].join("\n")
  );
  process.exit(1);
}

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
]);

function safeJoin(root, reqPath) {
  // Prevent path traversal, keep inside root
  const normalized = path
    .normalize(reqPath)
    .replace(/^(\.\.(\/|\\|$))+/, "")
    .replace(/^[/\\]+/, "");
  return path.join(root, normalized);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": mime.get(ext) || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);
    const pathname = decodeURIComponent(url.pathname);

    const basePath = pathname === "/" ? "index.html" : pathname;
    const candidate = safeJoin(distDir, basePath);

    const tryFiles = [
      candidate,
      candidate + ".html",
      path.join(candidate, "index.html"),
    ];

    let chosen = null;
    for (const p of tryFiles) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        chosen = p;
        break;
      }
    }

    // SPA fallback
    if (!chosen) chosen = path.join(distDir, "index.html");

    sendFile(res, chosen);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(e && e.stack ? e.stack : e));
  }
});

server.listen(port, host, () => {
  console.log(`TaskLedger running at http://${host}:${port}`);
  console.log(`Serving: ${distDir}`);
});

