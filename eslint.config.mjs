import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "frontend/dist/**", "node_modules/**", "frontend/node_modules/**", "coverage/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    }
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    files: ["frontend/src/**/*.{ts,tsx}", "frontend/vite.config.ts"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
);
