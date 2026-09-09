import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/heranca/**/tests/**/*.spec.ts', 'tests/**/*.spec.ts'],
  },
})
