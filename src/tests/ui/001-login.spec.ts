import { expect, test } from '@playwright/test'
import { TESTING_URL } from './testing-constant'

test.describe('Login as superadmin', () => {
  test('Fail login - Email not found', async ({ page }) => {
    await page.goto(`${TESTING_URL}/login`)
    await page.getByPlaceholder('Enter your email').click()
    await page.getByPlaceholder('Enter your email').fill('superadmin_admin@gmail.coms')
    await page.getByPlaceholder('••••••••').click()
    await page.getByPlaceholder('••••••••').fill('puskapa')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('User not found')).toBeVisible()
  })

  test('Fail login - Password wrong', async ({ page }) => {
    await page.goto(`${TESTING_URL}/login`)
    await page.getByPlaceholder('Enter your email').click()
    await page.getByPlaceholder('Enter your email').fill('superadmin_admin@gmail.com')
    await page.getByPlaceholder('••••••••').click()
    await page.getByPlaceholder('••••••••').fill('puskapax')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText('Password not match')).toBeVisible()
  })
})
