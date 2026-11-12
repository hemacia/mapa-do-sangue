import { expect, test } from '@playwright/test'

// Dados fixos de tests/e2e/seed.sql. Ex.: Hemominas (MG) tem A+ crítico; Hemosc (SC) tem A+ estável.

test('a página inicial mostra o mapa, o panorama e os hemocentros', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('group', { name: /Mapa do Brasil/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Panorama por tipo sanguíneo' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(6)
  await expect(page.getByText('Mais em falta agora:')).toContainText('O-')
})

test('trocar o tipo sanguíneo muda as cores do mapa', async ({ page }) => {
  await page.goto('/')
  const santaCatarina = page.getByRole('link', { name: /^Santa Catarina:/ }).locator('path')
  const corGeral = await santaCatarina.evaluate((el) => getComputedStyle(el).fill)

  await page.getByRole('radio', { name: 'A+', exact: true }).check()

  await expect.poll(() => santaCatarina.evaluate((el) => getComputedStyle(el).fill)).not.toBe(corGeral)
})

test('clicar num estado abre a página do estado com os hemocentros', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: /^Minas Gerais:/ }).click()

  await expect(page).toHaveURL(/\/estado\/mg$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Estoque de sangue em Minas Gerais')
  await expect(page.getByRole('heading', { name: 'Hemominas' })).toBeVisible()
  await expect(page).toHaveTitle(/Minas Gerais \(MG\)/)
})

test('estado que não publica o estoque explica isso e sugere doar', async ({ page }) => {
  await page.goto('/estado/rj')

  await expect(page.getByText('ainda não publicam o estoque')).toBeVisible()
  await expect(page.getByRole('link', { name: 'pode doar' })).toHaveAttribute('href', '/posso-doar')
})

test('UF inexistente responde 404', async ({ page }) => {
  const resposta = await page.goto('/estado/xx')

  expect(resposta?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
})

test('a UF em maiúsculas redireciona para o endereço canônico', async ({ page }) => {
  await page.goto('/estado/MG')

  await expect(page).toHaveURL(/\/estado\/mg$/)
})
