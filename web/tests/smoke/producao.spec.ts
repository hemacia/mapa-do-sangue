import { expect, test } from '@playwright/test'

// Só leitura: nada aqui registra doação ou muda dados em produção.
const API = process.env.SMOKE_API_URL ?? 'https://mapa-do-sangue-api.onrender.com'

test('a API de produção está no ar e conectada ao banco', async ({ request }) => {
  const resposta = await request.get(`${API}/readyz`)

  expect(resposta.ok()).toBe(true)
  expect(await resposta.json()).toEqual({ status: 'ok' })
})

test('a página inicial mostra a manchete, o mapa e os tipos em falta', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Mapa do Brasil por estado' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tipos em falta hoje' })).toBeVisible()
})

// Pró-Sangue: a fonte que a coleta do GitHub Actions lê sem falhar desde o início.
test('a página de um estado que publica o estoque mostra o hemocentro', async ({ page }) => {
  await page.goto('/estado/sp')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Estoque de sangue em São Paulo')
  await expect(page.getByRole('heading', { name: 'Pró-Sangue' })).toBeVisible()
})

test('o "Posso doar?" calcula a resposta no navegador', async ({ page }) => {
  await page.goto('/posso-doar')

  await page.getByLabel('Data de nascimento').fill('1995-05-20')
  await page.getByLabel('Peso (kg)').fill('70')
  await page.getByRole('button', { name: 'Verificar' }).click()

  await expect(page.getByRole('status')).toContainText('Você pode doar hoje')
})
