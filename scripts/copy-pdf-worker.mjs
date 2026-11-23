// Copies the pdf.js worker from the installed pdfjs-dist package into public/
// so it is served from our own origin (works on the website, offline, and in
// the Capacitor Android app). Runs automatically before `next build`.
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

try {
  if (!existsSync(src)) {
    console.warn("[copy-pdf-worker] source not found, skipping:", src);
    process.exit(0);
  }
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);
  console.log("[copy-pdf-worker] synced public/pdf.worker.min.mjs");
} catch (err) {
  // Never fail the build over this; a committed copy already exists as a fallback.
  console.warn("[copy-pdf-worker] non-fatal error:", err?.message || err);
  process.exit(0);
}
