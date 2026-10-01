import { chromium, expect } from '@playwright/test'

async function globalSetup() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`https://staging.sim.puskapa.org/login`)
  await page.getByPlaceholder('Enter your email').click()
  await page.getByPlaceholder('Enter your email').fill('superadmin_admin@gmail.com')
  await page.getByPlaceholder('••••••••').click()
  await page.getByPlaceholder('••••••••').fill('puskapa')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/.*dashboard/)
  await expect(page.getByText('Needs Approval')).toBeVisible()
  await page.context().storageState({ path: 'playwright/auth-state.json' })

  await browser.close()
}

export default globalSetup
