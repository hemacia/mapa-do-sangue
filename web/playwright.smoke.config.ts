import { defineConfig, devices } from '@playwright/test'

// Smoke test contra o site publicado: só leitura, nenhum teste grava no banco de produção.
// SMOKE_URL troca o endereço (ex.: a prévia de um deploy da Vercel).
export default defineConfig({
  testDir: 'tests/smoke',
  forbidOnly: !!process.env.CI,
  // A API do plano gratuito do Render dorme após 15 minutos: a primeira chamada pode levar ~1 minuto.
  timeout: 120_000,
  expect: { timeout: 60_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: process.env.SMOKE_URL ?? 'https://mapa-do-sangue.vercel.app', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
