import { expect, test } from '@playwright/test'
import path from 'path'
import { AVATAR_EMPLOYEE, TESTING_URL } from './testing-constant'

// PAYMENT
test.describe.configure({ mode: 'serial' })

test.describe('Payment module (Payment Request) for Personnel Hire', () => {
  test.use({ storageState: 'playwright/requisition-state.json' })

  let paymentResponseData: {
    data: string
    message: string
  }

  test('Create PR by Ranoto Sukamai (Requested By)', async ({ page, context }) => {
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
    // await page.goto(`${TESTING_URL}/dashboard/procurement/19310a2b-cf90-4e15-8830-51b630336aaf/detail/5638aa78-29a4-45a8-a292-edb82cd9866e/dca30419-c1f8-4c6a-858c-215f62700eb6`)

    await expect(page.getByTestId('A.01.01')).toBeVisible()
    await page.getByTestId('A.01.01').check()
    await expect(page.getByTestId('A.01.02')).toBeVisible()
    await page.getByTestId('A.01.02').check()
    await expect(page.getByRole('checkbox').first()).toBeChecked()
    await page.getByRole('button', { name: 'Create Payment Request' }).click()

    await page.getByPlaceholder('Select Dates').click()
    await page.getByLabel('Next Month').click()
    await page.getByLabel('Choose Thursday, April 11th,').click()
    await page.getByText('Select vendor...').click()
    await page.getByRole('option', { name: 'Skiba' }).click()

    await page.getByRole('button', { name: 'Additional Attachment for' }).click()

    await page
      .locator('div')
      .filter({
        hasText: /^InvoiceClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-invoice')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-CPP-Cheatsheet__Hackr.pdf'))
    await expect(page.getByTestId('file-upload-status-invoice')).toContainText('Uploaded!')

    await page
      .locator('div')
      .filter({
        hasText: /^Hasil\/LuaranClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-hasilluaran')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-html-cheat-sheet.pdf'))
    await expect(page.getByTestId('file-upload-status-hasilluaran')).toContainText('Uploaded!')

    await page
      .locator('div')
      .filter({
        hasText: /^Bukti Serah Terima\/Berita AcaraClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-bukti-serah-terimaberita-acara')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-Javascript-Cheat-Sheet.pdf'))
    await expect(page.getByTestId('file-upload-status-bukti-serah-terimaberita-acara')).toContainText('Uploaded!')

    await page
      .locator('div')
      .filter({
        hasText: /^ReceiptClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-receipt')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-LearnVue-Vue-3-Cheatsheet.pdf'))
    await expect(page.getByTestId('file-upload-status-receipt')).toContainText('Uploaded!')

    await page
      .locator('div')
      .filter({
        hasText: /^ToRClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-tor')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-dummy-gdocs.pdf'))
    await expect(page.getByTestId('file-upload-status-tor')).toContainText('Uploaded!')

    await page
      .locator('div')
      .filter({
        hasText: /^KontrakClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-kontrak')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-docker.pdf'))
    await expect(page.getByTestId('file-upload-status-kontrak')).toContainText('Uploaded!')

    await page
      .locator('div')
      .filter({
        hasText: /^TimesheetClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-timesheet')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-git-cheat-sheet-education.pdf'))
    await expect(page.getByTestId('file-upload-status-timesheet')).toContainText('Uploaded!')

    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Submit Payment Request' }).click()

    await page.waitForResponse(endpointUrl)

    await expect(page.getByTestId('requested-by-status')).toContainText('Submitted')
  })

  test('Mark ongoing on checking PR by finance checker (Nilson Beardsworth)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="nilson@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Nilson Beardsworth' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByRole('button', { name: 'Mark this as “Ongoing Check”' })).toBeVisible()
    await page.getByRole('button', { name: 'Mark this as “Ongoing Check”' }).click()
  })

  test('Approve PR by finance checker (Nilson Beardsworth)', async ({ page }) => {
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

  test('Approve PR by budget controller (Khatimah Poniman)', async ({ page }) => {
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

  test('Approve PR by head of finance (Alfian Fathoni)', async ({ page }) => {
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

  test('Mark PR by finance team (Brady Douglas) ready to be processed and continue to report form', async ({
    page,
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

    // Finance team continue to payment report
    await page.getByRole('button', { name: 'Finance Payment Report Form' }).click()
    await expect(page.getByText('Rp 5.520.000')).toBeVisible({ timeout: 14000 })
    await page.getByRole('button', { name: 'Finance Process Attachment' }).click()

    // Upload file
    await page.getByText('Click to upload or drag and dropImage Format or PDF (max 2MB)').click()
    await page
      .getByTestId('file-upload')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-LearnVue-Vue-3-Cheatsheet.pdf'))

    // Choose date
    await page.getByPlaceholder('Select Dates').click()
    await page.getByLabel('Next Month').click()
    await page.getByLabel('Choose Wednesday, April 24th,').click()

    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Submit Report Form' }).click()
    await expect(page.getByTestId('finance-team-process-status')).toContainText('Done Process')
  })
})
