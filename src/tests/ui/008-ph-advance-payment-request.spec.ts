import { expect, test } from '@playwright/test'
import { TESTING_URL } from './testing-constant'

// PAYMENT
test.describe.configure({ mode: 'serial' })

test.describe('Payment module (Advance Payment Request) for Personnel Hire', () => {
  test.use({ storageState: 'playwright/requisition-state.json' })

  let paymentResponseData: {
    data: string
    message: string
  }

  test("Ranoto Sukamai (Action By) can't create APR", async ({ page, context }) => {
    const endpointUrl = 'https://api.staging.sim.puskapa.org/v1/payment-requests'

    // Intercept the network request
    await page.route(endpointUrl, async (route) => {
      // Fetch the response
      const response = await route.fetch()
      // Extract the response data
      paymentResponseData = await response.json()
      // Continue the request
      route.continue()
    })

    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="sukamai@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Ranoto Sukamai' })).toBeVisible({ timeout: 14000 })

    const cookies = await context.cookies()
    await page.goto(cookies.find((item) => item.name === 'procurement_url').value)
    await expect(page.getByTestId('A.01.01')).toBeVisible()
    await page.getByTestId('A.01.01').check()
    await expect(page.getByTestId('A.01.02')).toBeVisible()
    await page.getByTestId('A.01.02').check()
    await expect(page.getByRole('checkbox').first()).toBeChecked()
    await page.getByRole('button', { name: 'Create Advance Payment Request' }).click()
    await expect(page.locator('#toast-ph-error')).toContainText("Personnel hire can't create advance payment request")
  })
})
