import { expect, test } from '@playwright/test'
import path from 'path'
import { AVATAR_EMPLOYEE, TESTING_URL } from './testing-constant'

// PAYMENT
test.describe.configure({ mode: 'serial' })

test.describe('Payment module (Advance Payment Request) for Procurement Request', () => {
  test.use({ storageState: 'playwright/requisition-state.json' })

  let paymentResponseData: {
    data: string
    message: string
  }

  test('Create APR by Kamala Haris (Action By)', async ({ page, context }) => {
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
    await page.locator('[id="kamala@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Kamala Haris' })).toBeVisible({ timeout: 14000 })

    const cookies = await context.cookies()
    await page.goto(cookies.find((item) => item.name === 'procurement_url').value)

    // await page.goto(`${TESTING_URL}/dashboard/procurement/19310a2b-cf90-4e15-8830-51b630336aaf/detail/5638aa78-29a4-45a8-a292-edb82cd9866e/dca30419-c1f8-4c6a-858c-215f62700eb6`)

    await page.getByTestId('A.01.03').check({ timeout: 14000 })
    await page.getByTestId('A.01.04').check({ timeout: 14000 })
    await page.getByRole('button', { name: 'Create Advance Payment Request' }).click()

    await expect(page.getByTestId('expected_payment_date').getByPlaceholder('Select Dates')).toBeVisible()
    await page.getByTestId('expected_payment_date').getByPlaceholder('Select Dates').click()
    await page.getByLabel('Choose Friday, March 29th,').click()
    await expect(page.getByTestId('spending_deadline').getByPlaceholder('Select Dates')).toBeVisible()
    await page.getByTestId('spending_deadline').getByPlaceholder('Select Dates').click()
    await page.getByTestId('spending_deadline').getByRole('button').nth(1).click()
    await page.getByLabel('Choose Tuesday, April 30th,').click()

    // This block is customize to adjust statement result options

    // To make Payment Request (APR < Real Payment)
    await page.getByPlaceholder('0').first().click()
    await page.getByPlaceholder('0').first().fill('900000')
    await page.getByPlaceholder('0').nth(1).click()
    await page.getByPlaceholder('0').nth(1).fill('2000000')
    await expect(page.locator('form')).toContainText('Rp 2.900.000')

    // To make Approve Statement (APR = Real Payment)
    // await page.getByPlaceholder('0').first().click()
    // await page.getByPlaceholder('0').first().fill('960000')
    // await page.getByPlaceholder('0').nth(1).click()
    // await page.getByPlaceholder('0').nth(1).fill('2720000')
    // await expect(page.locator('form')).toContainText('Rp 3.680.000')

    // To make Settlement (APR > Real Payment)
    // await page.getByPlaceholder('0').first().click()
    // await page.getByPlaceholder('0').first().fill('960000')
    // await page.getByPlaceholder('0').nth(1).click()
    // await page.getByPlaceholder('0').nth(1).fill('3000000')
    // await expect(page.locator('form')).toContainText('Rp 3.960.000')

    await page.getByRole('button', { name: 'Submit Advance Payment Request' }).click()

    await page.waitForResponse(endpointUrl)

    await expect(page.locator('section')).toContainText('Fri, 29 Mar 2024')
    await expect(page.locator('section')).toContainText('Tue, 30 Apr 2024')
  })

  test('Mark ongoing on checking APR by finance checker (Nilson Beardsworth)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="nilson@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Nilson Beardsworth' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByTestId('finance-checker-status')).toContainText('Waiting Finance Team')

    await expect(page.getByRole('button', { name: 'Mark this as “Ongoing Check”' })).toBeVisible()
    await page.getByRole('button', { name: 'Mark this as “Ongoing Check”' }).click()

    await expect(page.getByTestId('finance-checker-status')).toContainText('Ongoing Checking the Documents')
  })

  test('Approve APR by finance checker (Nilson Beardsworth)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="nilson@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Nilson Beardsworth' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByRole('button', { name: 'Approve Request' })).toBeVisible()
    await page.getByRole('button', { name: 'Approve Request' }).click()
    await expect(page.getByTestId('finance-checker-status')).toContainText('Done Check')
  })

  test('Approve APR by budget controller (Khatimah Poniman)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="khatimah@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Khatimah Poniman' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByRole('button', { name: 'Approve Request' })).toBeVisible()
    await page.getByRole('button', { name: 'Approve Request' }).click()

    await expect(page.getByTestId('bc-status')).toContainText('approved')
  })

  test('Approve APR by head of finance (Alfian Fathoni)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="alfiankan@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Alfian Fathoni' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByRole('button', { name: 'Approve Request' })).toBeVisible({ timeout: 14000 })
    await page.getByRole('button', { name: 'Approve Request' }).click()

    await expect(page.getByTestId('hof-status')).toContainText('approved')
  })

  test('Mark APR by finance team (Brady Douglas) ready to be processed and continue to report form', async ({
    page,
    context,
  }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="brady.douglas@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Brady Douglas' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(
      page.getByRole('button', {
        name: 'Mark this Payment Request to be Processed',
      }),
    ).toBeVisible()

    await page
      .getByRole('button', {
        name: 'Mark this Payment Request to be Processed',
      })
      .click()
    await expect(page.getByTestId('finance-team-process-status')).toContainText('Wait for Process Done')

    await expect(page.getByRole('button', { name: 'Unmark this Payment Request' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Finance Payment Report Form' })).toBeVisible()
    await expect(page.getByText('Wait for Process Done')).toBeVisible()

    await context.addCookies([
      {
        name: 'advance_payment_request_detail_id',
        value: page.url().split('/').pop(),
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.context().storageState({ path: 'playwright/payment-state.json' })

    // Finance team continue to payment report
    await page.getByRole('button', { name: 'Finance Payment Report Form' }).click()
    await page.getByRole('button', { name: 'Finance Process Attachment' }).click()

    // Upload file
    await page.getByText('Click to upload or drag and dropImage Format or PDF (max 2MB)').click()
    await page
      .getByTestId('file-upload')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-LearnVue-Vue-3-Cheatsheet.pdf'))

    // Choose date
    await page.getByPlaceholder('Select Dates').click()
    await page.getByLabel('Next Month').click()
    await page.getByLabel('Choose Wednesday, April 17th,').click()

    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Submit Report Form' }).click()

    await expect(page.getByTestId('finance-team-process-status')).toContainText('Done Process')
  })
})
