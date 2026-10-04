import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const pairs = [
  [".env.example", ".env"],
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/web/.env.example", "apps/web/.env.local"],
];

for (const [srcRel, destRel] of pairs) {
  const src = path.resolve(root, srcRel);
  const dest = path.resolve(root, destRel);
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}
