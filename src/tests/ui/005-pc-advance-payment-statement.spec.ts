import { expect, test } from '@playwright/test'
import path from 'path'
import { AVATAR_EMPLOYEE, EXPECTED_PAYMENT_STATEMENT, TESTING_URL } from './testing-constant'

// PAYMENT
test.describe.configure({ mode: 'serial' })

test.describe('Payment module (Advance Payment Statement)', () => {
  test.use({ storageState: 'playwright/payment-state.json' })

  let paymentResponseData: {
    data: string
    message: string
  }

  test('Create APS by Kamala Haris (Action By) - Only requester can make APS', async ({ page, context }) => {
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
    const paymentId = cookies.find((item) => item.name === 'advance_payment_request_detail_id').value
    await page.goto(`${TESTING_URL}/dashboard/finance/payment-request/${paymentId}`)

    // await page.goto(`${TESTING_URL}/dashboard/procurement/19310a2b-cf90-4e15-8830-51b630336aaf/detail/5638aa78-29a4-45a8-a292-edb82cd9866e/dca30419-c1f8-4c6a-858c-215f62700eb6`)

    await page.getByRole('button', { name: 'Create Advance Payment Statement' }).click()

    await page.getByText('Select vendor...').click()
    await page.getByRole('option', { name: 'Gleason Group' }).click()
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
        hasText: /^SPKClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-spk')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-git-cheat-sheet-education.pdf'))
    await expect(page.getByTestId('file-upload-status-spk')).toContainText('Uploaded!')

    await page
      .locator('div')
      .filter({
        hasText: /^Dokumen BiddingClick to upload or drag and dropImage Format or PDF \(max 2MB\)$/,
      })
      .locator('div')
      .first()
      .click()
    await page
      .getByTestId('file-upload-dokumen-bidding')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-golang_refcard.pdf'))
    await expect(page.getByTestId('file-upload-status-dokumen-bidding')).toContainText('Uploaded!')

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

    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByPlaceholder('Qty').first()).toHaveValue('2')
    await expect(page.getByPlaceholder('Qty').nth(1)).toHaveValue('4')
    await expect(page.getByPlaceholder('0').first()).toHaveValue('120.000', {
      timeout: 10000,
    })
    await expect(page.getByPlaceholder('Qty').nth(2)).toHaveValue('4')
    await expect(page.getByPlaceholder('Qty').nth(3)).toHaveValue('2')
    await expect(page.getByPlaceholder('0').nth(1)).toHaveValue('340.000', {
      timeout: 10000,
    })
    await page.getByRole('button', { name: 'Submit Advance Payment Statement' }).click()

    await page.waitForResponse(endpointUrl)
    await expect(page.getByTestId('statement-result-options')).toContainText(EXPECTED_PAYMENT_STATEMENT)
  })

  test('Mark ongoing on checking APS by finance checker (Nilson Beardsworth)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="nilson@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Nilson Beardsworth' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByRole('button', { name: 'Mark this as “Ongoing Check”' })).toBeVisible()
    await page.getByRole('button', { name: 'Mark this as “Ongoing Check”' }).click()
  })

  test('Approve APS by finance checker (Nilson Beardsworth)', async ({ page }) => {
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

  test('Approve APS by budget controller (Khatimah Poniman)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="khatimah@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Khatimah Poniman' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByRole('button', { name: 'Approve Request' })).toBeVisible()
    await page.getByRole('button', { name: 'Approve Request' }).click()

    await expect(page.getByTestId('bc-status')).toContainText('Approved')
  })

  test('Approve APS by head of finance (Alfian Fathoni)', async ({ page }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="alfiankan@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Alfian Fathoni' })).toBeVisible({ timeout: 14000 })

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Finance Request' }).click()
    await page.getByTestId(paymentResponseData.data).click({ timeout: 14000 })

    await expect(page.getByRole('button', { name: 'Approve Request' })).toBeVisible({ timeout: 14000 })
    await page.getByRole('button', { name: 'Approve Request' }).click()

    await expect(page.getByTestId('hof-status')).toContainText('Approved')
  })

  test('Mark APS by finance team (Brady Douglas) ready to be processed and continue to report form', async ({
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

    await expect(
      page.getByRole('button', {
        name: 'Unmark this Payment Request as Processed',
      }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Finance Payment Report Form' })).toBeVisible()
    await expect(page.getByText('Wait for Process Done')).toBeVisible()

    // Finance team continue to payment report
    await expect(page.getByTestId('statement-result-options')).toContainText(EXPECTED_PAYMENT_STATEMENT)
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
    await page.getByLabel('Choose Friday, April 26th,').click()

    await page.getByRole('button', { name: 'Save' }).click()
    await page.getByRole('button', { name: 'Submit Report Form' }).click()
    await expect(page.getByTestId('finance-team-process-status')).toContainText('Done Process')
  })
})
