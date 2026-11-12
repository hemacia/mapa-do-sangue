import { expect, test } from '@playwright/test'

test('o quiz informa a próxima data para quem doou há pouco', async ({ page }) => {
  await page.goto('/posso-doar')
  const hoje = new Date()
  const ultima = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 10).toLocaleDateString(
    'en-CA',
  )

  await page.getByLabel('Data de nascimento').fill('1995-05-20')
  await page.getByLabel('Peso (kg)').fill('70')
  await page.getByLabel(/Data da última doação/).fill(ultima)
  await page.getByRole('button', { name: 'Verificar' }).click()

  await expect(page.getByRole('status')).toContainText('Hoje você ainda não pode doar')
})

test('registrar uma doação soma no contador do mês', async ({ page }) => {
  await page.goto('/')
  const contador = page.getByTestId('total-mes').locator('.numero')
  await expect(contador).toBeVisible()
  const antes = Number(await contador.textContent())

  await page.getByRole('combobox', { name: /^Estado/ }).selectOption('MG')
  await page.getByRole('combobox', { name: /^Tipo sanguíneo/ }).selectOption('O-')
  await page.getByRole('button', { name: 'Registrar minha doação' }).click()

  await expect(page.getByRole('status')).toContainText('Obrigado por doar')
  await expect(contador).toHaveText(String(antes + 1))
})

test('o tema escolhido continua depois de recarregar', async ({ page }) => {
  await page.goto('/')
  const temaInicial = await page.evaluate(() => matchMedia('(prefers-color-scheme: light)').matches)

  await page.getByRole('button', { name: /Usar tema/ }).click()
  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', temaInicial ? 'dark' : 'light')
})
