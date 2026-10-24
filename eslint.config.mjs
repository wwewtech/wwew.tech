import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "@typescript-eslint/eslint-plugin";
import { createProjectService } from "@typescript-eslint/project-service";

// Type-aware linting. The rules that need type information (no-floating-
// promises, no-misused-promises, no-unsafe-*, require-await, ...) catch
// mistakes the compiler cannot see, because TypeScript erases them at
// runtime.
//
// Every preset entry is re-scoped to TypeScript files: the preset ships its
// rule block without a `files` key, which would otherwise apply the
// type-aware rules to plain .mjs/.cjs files that carry no type information
// and crash the run.
//
// The project service is used instead of a manual `project` list so that
// tsconfig.json stays the single source of truth.
const typeChecked = tseslint.configs["flat/recommended-type-checked"].map(
  (entry) => ({ ...entry, files: ["**/*.ts", "**/*.tsx"] })
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...typeChecked,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: createProjectService(true),
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Next.js requires these entry points to be `async` even when they
    // await nothing, so the rule fights the framework there.
    files: [
      "next.config.ts",
      "src/app/opengraph-image.tsx",
      "src/app/twitter-image.tsx",
    ],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    // node:test resolves the test's returned promise itself; awaiting it
    // from inside the callback would double-settle the test.
    files: ["src/__tests__/**"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored third-party component, kept as-is.
    "src/components/reactbits/**",
    // Verification tooling, not part of the shipped application.
    "scripts/**",
  ]),
]);

export default eslintConfig;
