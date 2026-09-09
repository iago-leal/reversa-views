import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/heranca/**/tests/**/*.spec.ts', 'tests/**/*.spec.{ts,tsx}'],
  },
  // The webview is written in component syntax; without this, a test that
  // imports a component fails on syntax and the failure reads as a defect
  // where there is none. This does NOT make the runner compile the webview
  // with the host configuration: `tsconfig.webview.json` stays the only type
  // checker of that unit (D-12).
  esbuild: {
    jsx: 'automatic',
  },
})
