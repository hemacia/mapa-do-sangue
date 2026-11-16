import { expect, test } from '@playwright/test'

// Dados fixos de tests/e2e/seed.sql. Ex.: Hemominas (MG) tem A+ crítico; Hemosc (SC) tem A+ estável.

test('a página inicial mostra a manchete, o mapa, os tipos em falta e os hemocentros', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('O-')
  await expect(page.getByRole('group', { name: 'Mapa do Brasil por estado' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Doações por estado' })).toBeChecked()
  await expect(page.getByRole('heading', { name: 'Tipos em falta hoje' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(6)
})

test('trocar o tipo sanguíneo muda as cores do mapa', async ({ page }) => {
  await page.goto('/')
  const santaCatarina = page.getByRole('link', { name: /^Santa Catarina:/ }).locator('path')
  const corGeral = await santaCatarina.evaluate((el) => getComputedStyle(el).fill)

  await page.getByRole('radio', { name: 'Estoque de hoje do tipo A+' }).check()

  await expect.poll(() => santaCatarina.evaluate((el) => getComputedStyle(el).fill)).not.toBe(corGeral)
})

test('clicar num estado mostra o resumo e o "Ver mais" abre a página do estado', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: /^Minas Gerais:/ }).click()

  const resumo = page.getByRole('dialog', { name: 'Minas Gerais' })
  await expect(resumo).toBeVisible()
  await expect(resumo).toContainText('tipos críticos hoje')
  await expect(page).toHaveURL(/\/$/)
  await resumo.getByRole('link', { name: 'Ver mais sobre Minas Gerais' }).click()

  await expect(page).toHaveURL(/\/estado\/mg$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Estoque de sangue em Minas Gerais')
  await expect(page.getByRole('heading', { name: 'Hemominas' })).toBeVisible()
  await expect(page).toHaveTitle(/Minas Gerais \(MG\)/)
})

test('estado que não publica o estoque explica isso e sugere doar', async ({ page }) => {
  await page.goto('/estado/rj')

  await expect(page.getByText('ainda não publicam o estoque')).toBeVisible()
  await expect(page.getByText('Estoque não publicado')).toBeVisible()
  await expect(page.getByRole('main').getByRole('link', { name: 'Posso doar?' })).toHaveAttribute(
    'href',
    '/posso-doar',
  )
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

test('o menu leva à lista de hemocentros separada por estado', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Hemocentros' }).click()

  await expect(page).toHaveURL(/\/hemocentros$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Minas Gerais' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Hemominas' })).toBeVisible()
})
