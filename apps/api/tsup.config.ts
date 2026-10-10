import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    migrate: "src/cli/migrate.ts",
    seed: "src/cli/seed.ts",
    "create-admin": "src/cli/create-admin.ts",
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
