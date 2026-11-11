import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('mostra o título do site', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Mapa do Sangue' })).toBeVisible()
})

test('libera a doação para um adulto que nunca doou', async ({ page }) => {
  await page.getByLabel('Data de nascimento').fill('1995-05-20')
  await page.getByLabel('Peso (kg)').fill('70')

  await page.getByRole('button', { name: 'Verificar' }).click()

  await expect(page.getByRole('status')).toContainText('Você pode doar hoje')
})

test('bloqueia quem tem menos de 16 anos', async ({ page }) => {
  const dozeAnosAtras = `${new Date().getFullYear() - 12}-01-01`
  await page.getByLabel('Data de nascimento').fill(dozeAnosAtras)
  await page.getByLabel('Peso (kg)').fill('45')

  await page.getByRole('button', { name: 'Verificar' }).click()

  await expect(page.getByRole('status')).toContainText('Hoje você ainda não pode doar')
})

test('avisa quando o formulário está incompleto', async ({ page }) => {
  await page.getByRole('button', { name: 'Verificar' }).click()

  await expect(page.getByRole('alert')).toContainText('Confira')
})

test('mostra para quem o tipo B- pode doar', async ({ page }) => {
  await page.getByLabel('Seu tipo sanguíneo').selectOption('B-')

  await expect(page.getByTestId('doa-para')).toHaveText('B+, B-, AB+, AB-')
})
