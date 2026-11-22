import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Fuso fixo: o resultado dos testes não pode depender do relógio da máquina que roda.
// Definido aqui, antes de o Vitest (ou o Stryker) abrir os processos dos testes, que herdam o fuso.
process.env.TZ = 'UTC'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
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
