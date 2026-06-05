import { existsSync } from "node:fs";

const requiredFiles = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/wood/new/page.tsx",
  "app/wood/review/page.tsx",
  "app/wood/review/[id]/page.tsx",
  "app/wood/unload/page.tsx",
  "app/wood/history/page.tsx",
  "app/wood/reports/page.tsx",
  "app/wood/inbound-scale/page.tsx",
  "app/wood/outbound-scale/page.tsx",
  "app/wood/admin/page.tsx",
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  console.error(`Missing scaffold route files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

if (process.argv.includes("--dev")) {
  console.log("WC Kaona UI scaffold verified. Install Next.js dependencies before running a real dev server.");
} else {
  console.log("WC Kaona UI scaffold route verification passed.");
}
