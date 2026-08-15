import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    migrate: "src/db/migrate.ts",
    seed: "src/db/seed/index.ts",
  },
  format: ["esm"],
  target: "node22",
  platform: "node",
  sourcemap: true,
  clean: true,
  splitting: false,
  noExternal: [/^@sigillus\//],
  external: ["sharp", "pg", "pg-boss", "better-auth", "@sentry/node"],
});
