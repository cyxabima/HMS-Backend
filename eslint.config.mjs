import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Architect's rules:
      "@typescript-eslint/no-explicit-any": "error", // No cheating with 'any' in our specialized schema
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "no-console": "warn",
    },
  },
  {
    // Ignore compiled files and node_modules
    ignores: ["dist/**", "node_modules/**", "eslint.config.mjs"],
  },
  prettierPlugin,
);
