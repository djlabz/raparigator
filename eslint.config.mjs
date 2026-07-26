import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: {
        version: "19.2.3",
      },
    },
    rules: {
      "no-unassigned-vars": "error",
      "no-useless-assignment": "error",
      "preserve-caught-error": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".tmp-venv/**",
    ".agents/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
