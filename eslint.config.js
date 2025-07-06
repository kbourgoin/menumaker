import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Allow console statements in test files
    files: ["**/*.test.{ts,tsx}", "**/test/**/*.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Allow console statements in logger utility and migration files
    files: ["**/utils/logger.ts", "**/utils/performance.ts", "**/utils/cuisineToTagMigration.ts", "**/utils/errorHandling.ts"],
    rules: {
      "no-console": "off",
    },
  }
);
