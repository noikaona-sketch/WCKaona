import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceDirs = ["app", "components", "lib"];
const clientSecretNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "N8N_WEBHOOK_URL",
];

const ignoredDirs = new Set([".git", ".next", "node_modules"]);
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) files.push(fullPath);
  }

  return files;
}

function isApiRoute(relativePath) {
  return relativePath.startsWith(`app${path.sep}api${path.sep}`);
}

function isServerOnlySource(source) {
  return source.includes('import "server-only"') || source.includes("import 'server-only'");
}

function isClientEntrypoint(source, relativePath) {
  return source.startsWith('"use client"') || source.startsWith("'use client'") || relativePath.startsWith(`components${path.sep}`);
}

const findings = [];

for (const sourceDir of sourceDirs) {
  const absoluteDir = path.join(rootDir, sourceDir);
  const files = await collectFiles(absoluteDir);

  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const source = await readFile(file, "utf8");

    if (isApiRoute(relativePath) || isServerOnlySource(source)) continue;
    if (!isClientEntrypoint(source, relativePath)) continue;

    for (const secretName of clientSecretNames) {
      if (source.includes(secretName)) {
        findings.push(`${relativePath}: references ${secretName}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Client-reachable secret references found:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("No client-reachable secret env references found.");
