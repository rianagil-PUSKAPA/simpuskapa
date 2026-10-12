import { faker } from '@faker-js/faker/locale/en'
import { expect, test } from '@playwright/test'
import { AVATAR_EMPLOYEE, TESTING_URL } from './testing-constant'

// REQUISITION
test.describe.configure({ mode: 'serial' })

test.describe('Requisition Module: Create PC', () => {
  test.use({ storageState: 'playwright/program-state.json' })
  test('Create procurement request (PC) by Willa Combs (Requester -> anyone can be a requester)', async ({
    page,
    context,
  }) => {
    const procurementDescription = faker.lorem.lines(1)
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="willa.combs@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Willa Combs' })).toBeVisible({ timeout: 14000 })
    // ================
    const cookies = await context.cookies()
    await page.goto(`${TESTING_URL}/dashboard/program/${cookies.find((item) => item.name === 'program_id').value}`)
    // ================
    await page.getByRole('tab', { name: 'Budget Needs' }).click()
    await expect(page.getByLabel('Budget Needs')).toContainText('Procurement Req (PC)', { timeout: 9000 })
    await page.getByTestId('A.01.03').check()
    await page.getByTestId('A.01.04').check()
    await page.getByTestId('A.01.05').check()
    await page.getByTestId('A.02.08').check()
    await page.getByRole('button', { name: 'Procurement Req (PC)' }).first().click()
    await expect(page.locator('h2')).toContainText('Procurement Request (PC)')
    await page.getByPlaceholder('Select Dates').click()
    await page.getByLabel('Choose Tuesday, March 12th,').click()
    await page.locator('[id="headlessui-combobox-button-:re:"]').click()
    await page.getByRole('option', { name: 'Kamala Haris' }).click()
    await page.getByPlaceholder('Enter the description of').click()
    await page.getByPlaceholder('Enter the description of').fill(procurementDescription)
    await page.getByText('Select vendor...').first().click()
    await page.getByRole('option', { name: 'Gleason Group' }).click()
    await page.getByText('Select vendor...').first().click()
    await page.getByRole('option', { name: 'Gleason Group' }).click()
    await page.getByText('Select vendor...').first().click()
    await page.getByRole('option', { name: 'Babulo Service Group' }).click()
    await page.getByText('Select vendor...').click()
    await page.getByRole('option', { name: 'Grapich Satu media' }).click()
    await page.getByRole('button', { name: 'Submit Form' }).click()

    // await expect(page.locator('section')).toContainText('Please wait the Previous Approval (Program Manager) to approve the request first.')
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

test.describe('Requisition Module: Approving PC', () => {
  test.use({ storageState: 'playwright/requisition-state.json' })
  test('Approve procurement request (PC) by Bambang Setiawan (Program Manager)', async ({ page, context }) => {
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

  test('Approve procurement request (PC) by Khatimah Poniman (Budget Controller)', async ({ page, context }) => {
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

  test('Seen action by PC by Kamala Haris', async ({ page, context }) => {
    await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
    await page.locator('[id="kamala@puskapa.org"]').click()
    await expect(page.getByRole('heading', { name: 'Kamala Haris' })).toBeVisible({ timeout: 14000 })

    // ================

    const cookies = await context.cookies()
    const requisitionId = cookies.find((item) => item.name === 'procurement_id').value

    await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
    await page.getByRole('menuitem', { name: 'Procurement Request' }).click()

    await page.getByTestId(requisitionId).click()
    await expect(page.locator('#action-by-name')).toContainText('Kamala Haris')
    await expect(page.locator('section')).toContainText('Notified')
    await expect(page.locator('section')).toContainText('Create Advance Payment Request')
    await expect(page.locator('section')).toContainText('Create Payment Request')
  })
})
