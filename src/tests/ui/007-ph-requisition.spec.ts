import { faker } from '@faker-js/faker/locale/en'
import { expect, test } from '@playwright/test'
import path from 'path'
import { AVATAR_EMPLOYEE, TESTING_URL } from './testing-constant'

// REQUISITION
test.describe.configure({ mode: 'serial' })

test.describe('Requisition Module: Create PH', () => {
  test.use({ storageState: 'playwright/program-state.json' })
  test('Create personal hire request (PH) by Willa Combs (Requester -> anyone can be a requester)', async ({
    page,
    context,
  }) => {
    const procurementDescription = faker.lorem.sentence(15)
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="willa.combs@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Willa Combs' })).toBeVisible({ timeout: 14000 })
    // ================
    const cookies = await context.cookies()
    // await page.goto(`${TESTING_URL}/dashboard/program/${cookies.find((item) => item.name === 'program_id').value}`)
    await page.goto('http://localhost:3000/dashboard/program/7bd5c47a-f993-4c63-98b8-c5d6007c16cd')
    // ================
    await page.getByRole('tab', { name: 'Budget Needs' }).click()
    await expect(page.getByLabel('Budget Needs')).toContainText('Personnel Hire Req (PH)', { timeout: 9000 })
    await expect(page.getByTestId('A.01.01')).toBeVisible()
    await page.getByTestId('A.01.01').check()
    await expect(page.getByTestId('A.01.02')).toBeVisible()
    await page.getByTestId('A.01.02').check()
    await page.getByRole('button', { name: 'Personnel Hire Req (PH)' }).first().click()

    await expect(page.locator('h2')).toContainText('Personnel Hire (PH)')

    await page.getByPlaceholder('Select Dates').click()
    await page.getByTestId('deadline').getByRole('button').nth(1).click()
    await page.getByLabel('Choose Thursday, April 18th,').click()
    await page.locator('[id="headlessui-combobox-button-:re:"]').click()
    await page.getByRole('option', { name: 'Ranoto Sukamai' }).click()
    await page.getByPlaceholder('Enter the description of').click()
    await page.getByPlaceholder('Enter the description of').fill(procurementDescription)
    await page.locator('[id="headlessui-combobox-button-:rg:"]').click()
    await page.getByRole('option', { name: 'Voonte' }).click()
    await page.getByRole('button', { name: 'Add Information' }).click()
    await page.getByPlaceholder('Type of hire this consultant').click()
    await page.getByPlaceholder('Type of hire this consultant').fill(faker.lorem.sentence(5))
    await page.getByPlaceholder('Division of this consultant').click()
    await page.getByPlaceholder('Division of this consultant').fill(faker.lorem.sentence(6))
    await page.getByPlaceholder('Write notes about this').click()
    await page.getByPlaceholder('Write notes about this').fill(faker.lorem.sentence(5))

    await page.getByText('Click to upload or drag and dropPDF, XLSX or DOCX (max 2MB)').first().click()
    await page
      .getByTestId('file-upload-background_docs')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-Javascript-Cheat-Sheet.pdf'))
    await expect(page.getByTestId('file-upload-status-background_docs')).toContainText('Uploaded!')

    await page.getByText('Click to upload or drag and dropPDF, XLSX or DOCX (max 2MB)').nth(1).click()
    await page
      .getByTestId('file-upload-hire_process_docs')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-website-guide-wsu-css-cheat-sheet-gdocs.pdf'))
    await expect(page.getByTestId('file-upload-status-hire_process_docs')).toContainText('Uploaded!')

    await page.getByText('Click to upload or drag and dropPDF, XLSX or DOCX (max 2MB)').nth(2).click()
    await page
      .getByTestId('file-upload-offer_page_docs')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-html-cheat-sheet.pdf'))
    await expect(page.getByTestId('file-upload-status-offer_page_docs')).toContainText('Uploaded!')

    await page.getByText('Click to upload or drag and dropPDF, XLSX or DOCX (max 2MB each file)').click()
    await page
      .getByTestId('file-upload-other_docs')
      .setInputFiles(path.join(__dirname, '../dummy-file/w-light-docker.pdf'))
    await expect(page.getByTestId('file-upload-status-other_docs')).toContainText('Uploaded!')

    await page.getByRole('button', { name: 'Save' }).click()
    // await page.getByText('Select vendor...').first().click()
    // await page.getByRole('option', { name: 'Skiba' }).click()
    // await page.getByText('Select vendor...').click()
    // await page.getByRole('option', { name: 'Voonte' }).click()
    await page.getByText('Select vendor...').first().click()
    await page.getByRole('option', { name: 'Skiba' }).click()
    await page.getByText('Consultant').nth(3).click() // Helper to hidden dropdown otherwise already automatically closed
    await page.getByText('Select vendor...').click()
    await page.getByRole('option', { name: 'Voonte' }).click()
    await page.getByRole('button', { name: 'Submit Form' }).click()

    // await expect(page.locator('section')).toContainText(procurementDescription)
    await expect(page.getByTestId('about-request-description')).toContainText(procurementDescription)

    // ================

    await context.addCookies([
      {
        name: 'procurement_id',
        value: page.url().split('/').pop(),
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'procurement_url',
        value: page.url(),
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.context().storageState({ path: 'playwright/requisition-state.json' })
  })
})

test.describe('Requisition Module: Approving PH', () => {
  test.use({ storageState: 'playwright/requisition-state.json' })
  test('Approve personal hire request (PH) by Bambang Setiawan (Program Manager)', async ({ page, context }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="setiawan.bambang@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Bambang Setiawan' })).toBeVisible({ timeout: 14000 })

    // ================

    const cookies = await context.cookies()
    const requisitionId = cookies.find((item) => item.name === 'procurement_id').value

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Procurement Request' }).click()

    await page.getByTestId(requisitionId).click()
    await expect(page.locator('section')).toContainText('Approve Request')
    await expect(page.locator('#program-manager-name')).toContainText('Bambang Setiawan')
    await page.getByRole('button', { name: 'Approve Request' }).click()
  })

  test('Approve personal hire request (PH) by Khatimah Poniman (Budget Controller)', async ({ page, context }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="khatimah@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Khatimah Poniman' })).toBeVisible({ timeout: 14000 })

    // ================

    const cookies = await context.cookies()
    const requisitionId = cookies.find((item) => item.name === 'procurement_id').value

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Procurement Request' }).click()

    await page.getByTestId(requisitionId).click()
    await expect(page.locator('section')).toContainText('Approve Request')
    await expect(page.locator('#budget-controller-name')).toContainText('Khatimah Poniman')
    await page.getByRole('button', { name: 'Approve Request' }).click()
  })

  test('Seen action by PH by Ranoto Sukamai', async ({ page, context }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="sukamai@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Ranoto Sukamai' })).toBeVisible({ timeout: 14000 })

    // ================

    const cookies = await context.cookies()
    const requisitionId = cookies.find((item) => item.name === 'procurement_id').value

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Procurement Request' }).click()

    await page.getByTestId(requisitionId).click()
    await expect(page.locator('#action-by-name')).toContainText('Ranoto Sukamai')
    await expect(page.locator('section')).toContainText('Notified')
    await expect(page.locator('section')).toContainText('Create Advance Payment Request')
    await expect(page.locator('section')).toContainText('Create Payment Request')
  })
})
