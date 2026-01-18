import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function existsDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rimraf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status || 1);
}

const args = process.argv.slice(2);
const versionArgIdx = args.findIndex((a) => a === "--version");
const version = versionArgIdx >= 0 ? args[versionArgIdx + 1] : null;

const outRoot = path.join(repoRoot, "out");
const outDir = path.join(outRoot, "taskledger-release" + (version ? `-${version}` : ""));

const distSrc = path.join(repoRoot, "apps/web/dist");
if (!existsDir(distSrc)) {
  console.log("[bundle] apps/web/dist not found. Building web app...");
  run("npm", ["run", "build", "-w", "apps/web"], repoRoot);
}

if (!existsDir(distSrc)) {
  console.error("[bundle] Build finished but apps/web/dist still not found.");
  process.exit(1);
}

const serveSrc = path.join(repoRoot, "tools/serve-dist.mjs");
const releaseSrc = path.join(repoRoot, "release");
const userReadmeSrc = path.join(repoRoot, "release/README.md");

if (!fs.existsSync(serveSrc)) throw new Error(`Missing: ${serveSrc}`);
if (!existsDir(releaseSrc)) throw new Error(`Missing: ${releaseSrc}`);
if (!fs.existsSync(userReadmeSrc)) throw new Error(`Missing: ${userReadmeSrc}`);

rimraf(outDir);
ensureDir(outDir);

// Copy dist
fs.cpSync(distSrc, path.join(outDir, "dist"), { recursive: true });

// Copy tools
ensureDir(path.join(outDir, "tools"));
fs.copyFileSync(serveSrc, path.join(outDir, "tools/serve-dist.mjs"));

// Copy release scripts + user guide
fs.cpSync(releaseSrc, path.join(outDir, "release"), { recursive: true });

// Put user guide at zip root for best UX
fs.copyFileSync(userReadmeSrc, path.join(outDir, "README.md"));

console.log("");
console.log("[bundle] Done:");
console.log(`- ${outDir}`);
console.log("");
console.log("[bundle] Next:");
console.log("- Zip the folder and upload it to GitHub Releases.");
console.log("- Users can start via release/README.md (also copied to README.md at bundle root).");

