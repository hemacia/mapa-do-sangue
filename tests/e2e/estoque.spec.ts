import { expect, test } from '@playwright/test'

test('mostra os seis hemocentros com o nível de O-', async ({ page }) => {
  await page.goto('/')

  const linhas = page.getByRole('table', { name: 'Nível de O- por hemocentro' }).locator('tbody tr')

  await expect(linhas).toHaveCount(6)
  await expect(linhas.filter({ hasText: 'Hemominas' })).toContainText('Crítico')
})

test('filtra o estoque por tipo sanguíneo', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Tipo sanguíneo no mapa').selectOption('AB+')

  await expect(page.getByTestId('resumo')).toHaveText(/^AB\+ está crítico em \d de 6 hemocentros$/)
  await expect(page.getByRole('table', { name: 'Nível de AB+ por hemocentro' })).toBeVisible()
})

test('registra uma doação e soma no contador do mês', async ({ page }) => {
  await page.goto('/')
  const contador = page.getByTestId('total-mes')
  await expect(contador).toBeVisible()
  const antes = Number((await contador.textContent())!.match(/\d+/)![0])

  await page.getByLabel('Estado').selectOption('MG')
  await page.getByRole('button', { name: 'Registrar minha doação' }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Obrigado' })).toBeVisible()
  await expect(contador).toContainText(String(antes + 1))
})
