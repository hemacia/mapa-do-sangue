import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'components/**', 'app/**'],
      exclude: [
        'lib/api/schema.d.ts',
        'app/**/{layout,page,sitemap,robots,not-found,error}.tsx',
        'app/**/*.ts',
      ],
      reporter: ['text', 'lcov', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
