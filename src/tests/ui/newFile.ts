import { faker } from '@faker-js/faker/locale/en'
import { expect, test } from '@playwright/test'
import path from 'path'
import { ProgramDetail } from 'sdk/api'
import { AVATAR_EMPLOYEE, TESTING_URL } from './testing-constant'

test.describe(
  'Program module',
  {
    annotation: [
      {
        type: 'Testing Description',
        description:
          'These tests are from creating program, project activty, budget needs, and finally approved by HoF',
      },
    ],
  },
  () => {
    let programResponseData: {
      data: string
      message: string
    }

    test('Project list exist', async ({ page }) => {
      await page.goto(`${TESTING_URL}/dashboard/project`)
      // To approve program is not empty, that mean footer is exist (data is ecist)
      await expect(page.locator('section')).toContainText('Page')
    })

    test('Create project', async ({ page }) => {
      const endpointUrl = 'https://api.staging.sim.puskapa.org/v1/programs'

      const programName = faker.lorem.sentence(5)

      // Intercept the network request
      await page.route(endpointUrl, async (route) => {
        // Fetch the response
        const response = await route.fetch()
        // Extract the response data
        programResponseData = await response.json()
        // Continue the request
        route.continue()
      })

      await page.goto(`${TESTING_URL}/dashboard/project`)
      await page.getByRole('button', { name: 'Add New Project' }).click()
      await expect(page.locator('h1')).toContainText('Add New Project', {
        timeout: 9000,
      })
      await page.locator('label').filter({ hasText: 'New' }).click()
      await page.getByPlaceholder('Name of partners').click()
      await page.getByPlaceholder('Name of partners').fill(faker.company.name())
      await page.getByPlaceholder('Name of program').click()
      await page.getByPlaceholder('Name of program').fill(`e2e - ${programName}`)
      await page.getByPlaceholder('Please describe this program').click()
      await page.getByPlaceholder('Please describe this program').fill(faker.lorem.paragraph(2))
      await page.getByPlaceholder('How much estimated budget of').click()
      await page.getByPlaceholder('How much estimated budget of').fill(faker.commerce.price(125000000, 450000000, 0))
      // await page.locator('[id="headlessui-combobox-button-:r3:"]').click()
      await page.locator('[id="headlessui-combobox-button-:rf:"]').click()
      await page.getByRole('option', { name: 'Rasti Setiawati' }).click()
      // await page.locator('[id="headlessui-combobox-button-:r5:"]').click()
      await page.getByRole('option', { name: 'Bambang Setiawan' }).click()
      await page.locator('[id="headlessui-combobox-button-:r7:"]').click()
      await page.getByRole('option', { name: 'Hanin Dhiya' }).click()
      await page.locator('[id="headlessui-combobox-button-:r9:"]').click()
      await page.getByRole('option', { name: 'Kamala Haris' }).click()
      await page.getByLabel('Program Start').click()
      await page.getByLabel('Program Start').fill('2025')
      await page.locator('[id="headlessui-listbox-button-:r8:"]').click()
      await page.getByRole('option', { name: 'May' }).click()
      await page.locator('[id="headlessui-listbox-button-:r9:"]').click()
      await page.getByLabel('Program End').fill('2026')
      await page.getByRole('option', { name: 'April' }).click()
      await page.getByPlaceholder('Contract number').click()
      await page.getByPlaceholder('Contract number').fill(faker.finance.bic())

      // Upload file
      await page.getByText('Click to upload or drag and dropImage Format or PDF (max 2MB each file)').click()
      await page
        .getByTestId('file-upload')
        .setInputFiles([
          path.join(__dirname, '../dummy-file/w-light-LearnVue-Vue-3-Cheatsheet.pdf'),
          path.join(__dirname, '../dummy-file/w-light-wsu-jquery-cheat-sheet.pdf'),
        ])

      // Validate that file was uploaded
      // await expect(page.getByText('Uploaded!')).toBeVisible()
      await expect(page.getByText('Uploaded!').first()).toBeVisible()
      await expect(page.getByText('Uploaded!').nth(1)).toBeVisible()
      await page.locator('form').getByRole('button', { name: 'Submit New Program' }).click()

      // Wait for the response to be captured
      await page.waitForResponse(endpointUrl)

      await page.goto(`${TESTING_URL}/dashboard/project/${programResponseData.data}`)
      await expect(page.locator('h1')).toContainText(programName.replace(/./g, ''))
    })

    test('Add project and activity', async ({ page }) => {
      await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
      await page.locator('[id="rasti@puskapa.org"]').click()
      await expect(page.getByRole('heading', { name: 'Rasti Setiawati' })).toBeVisible()
      await page.goto(`${TESTING_URL}/dashboard/project/${programResponseData.data}`)
      // ================
      await expect(page.getByRole('tab', { name: 'Project & Activity' })).toBeVisible()
      await page.getByRole('tab', { name: 'Project & Activity' }).click()
      await expect(page.getByRole('button', { name: 'Add Project & Activity' })).toBeVisible()
      await page.getByRole('button', { name: 'Add Project & Activity' }).click()
      await expect(page.locator('h1')).toContainText('Project & Activity Form')
      await page.getByRole('button', { name: 'Add Activity' }).click()
      await page.getByPlaceholder('Projects Description').click()
      await page.getByPlaceholder('Projects Description').fill('Activity 1')
      await page.getByPlaceholder('↳ Activity Description').click()
      await page.getByPlaceholder('↳ Activity Description').fill('Activity 1 Description 1')
      await page.getByPlaceholder('Activity Notes').click()
      await page.getByPlaceholder('Activity Notes').fill('Activity 1 Notes 1')
      await page.getByText('Select date range').click()
      await page.getByLabel('Choose Tuesday, March 12th,').click()
      await page.getByLabel('Choose Thursday, March 28th,').click()
      await page.getByPlaceholder('Activity Milestone').click()
      await page.getByPlaceholder('Activity Milestone').fill('Activity 1 Milestone 1')
      await page.getByText('Select dates').click()
      await page.locator('//*[@id="radix-:r1:"]/div/div/div/div/div[2]/div[5]/div[5]').click()
      await page.getByText('March 28,').click()
      await page.getByRole('button', { name: 'Add Activity' }).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select date rangeSelect dates$/ })
        .getByPlaceholder('↳ Activity Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select date rangeSelect dates$/ })
        .getByPlaceholder('↳ Activity Description')
        .fill('Activity 1 Description 2')
      await page
        .locator('div')
        .filter({
          hasText: /^Activity 1 Description 2Select date rangeSelect dates$/,
        })
        .getByPlaceholder('Activity Notes')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: /^Activity 1 Description 2Select date rangeSelect dates$/,
        })
        .getByPlaceholder('Activity Notes')
        .fill('Activity 1 Notes 2')
      await page.getByText('Select date range').click()
      await page.getByLabel('Choose Tuesday, March 19th').click()
      await page.getByLabel('Choose Friday, March 29th').click()
      await page.getByPlaceholder('Activity Milestone').nth(1).click()
      await page.getByPlaceholder('Activity Milestone').nth(1).fill('Activity 1 Milestion 2')
      await page.getByText('Select dates').click()
      await page.locator('//*[@id="radix-:r3:"]/div/div/div/div/div[2]/div[5]/div[6]').click()
      await page.getByText('March 29,').click()
      await page.getByRole('button', { name: 'Add New Project' }).click()
      await page.getByRole('button', { name: 'Add Activity' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Add ActivitySelect date rangeSelect dates$/ })
        .getByPlaceholder('Projects Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Add ActivitySelect date rangeSelect dates$/ })
        .getByPlaceholder('Projects Description')
        .fill('Activity 2')
      await page
        .locator('div')
        .filter({ hasText: /^Select date rangeSelect dates$/ })
        .getByPlaceholder('↳ Activity Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select date rangeSelect dates$/ })
        .getByPlaceholder('↳ Activity Description')
        .fill('Activity 2 Description 1')
      await page
        .locator('div')
        .filter({
          hasText: /^Activity 2 Description 1Select date rangeSelect dates$/,
        })
        .getByPlaceholder('Activity Notes')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: /^Activity 2 Description 1Select date rangeSelect dates$/,
        })
        .getByPlaceholder('Activity Notes')
        .fill('Activity 2 Notes 1')
      await page.getByText('Select date range').click()
      await page.locator('#timelineDateRange').getByRole('button').nth(1).click()
      await page.getByLabel('Choose Tuesday, April 16th').click()
      await page.getByLabel('Choose Friday, April 26th').click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Activity 2Add ActivityActivity 2 Description 1Activity 2 Notes 1Apr 16, 2024 -',
        })
        .getByPlaceholder('Activity Milestone')
        .click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Activity 2Add ActivityActivity 2 Description 1Activity 2 Notes 1Apr 16, 2024 -',
        })
        .getByPlaceholder('Activity Milestone')
        .fill('Activity 2 Milestone 1')
      await page.getByText('Select dates').click()
      await page.locator('//*[@id="radix-:r5:"]/div/div/div/div/div[2]/div[5]/div[6]').click()
      await page.getByRole('button', { name: 'March 29, 2024' }).nth(3).click()
      await page.getByRole('button', { name: 'Save Project & Activity' }).click()
      await expect(page.getByLabel('Project & Activity')).toContainText('Activity 1')
    })

    test('Add budget needs', async ({ page }) => {
      const qq = faker.lorem.lines(1)
      const ww = faker.lorem.lines(1)
      const ee = faker.lorem.lines(1)
      const rr = faker.lorem.lines(1)
      const tt = faker.lorem.lines(1)
      const yy = faker.lorem.lines(1)
      const uu = faker.lorem.lines(1)
      const ii = faker.lorem.lines(1)
      const oo = faker.lorem.lines(1)
      //
      const aa = faker.lorem.lines(1)
      const ss = faker.lorem.lines(1)
      const dd = faker.lorem.lines(1)
      const ff = faker.lorem.lines(1)
      const gg = faker.lorem.lines(1)
      const hh = faker.lorem.lines(1)
      const jj = faker.lorem.lines(1)
      const kk = faker.lorem.lines(1)
      //
      const zz = faker.lorem.lines(1)
      const xx = faker.lorem.lines(1)
      const cc = faker.lorem.lines(1)
      const vv = faker.lorem.lines(1)
      const bb = faker.lorem.lines(1)
      const nn = faker.lorem.lines(1)

      await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
      await page.locator('[id="rasti@puskapa.org"]').click()
      await expect(page.getByRole('heading', { name: 'Rasti Setiawati' })).toBeVisible()
      await page.goto(`${TESTING_URL}/dashboard/project/${programResponseData.data}`)
      // ================
      await page.getByRole('tab', { name: 'Budget Needs' }).click()
      await expect(page.getByLabel('Budget Needs').getByRole('button')).toContainText('Budget Needs Form')
      await page.getByRole('button', { name: 'Budget Needs Form' }).click()
      await expect(page.locator('form')).toContainText('Activity 1 Description 1')
      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page.getByPlaceholder('↳ Needs Description').click()
      await page.getByPlaceholder('↳ Needs Description').fill(qq)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Consultant' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Consultant' }).click()
      await page.locator('input[name="qty"]').click()
      await page.locator('input[name="qty"]').fill('2')
      await page.locator('textarea[name="unit"]').click()
      await page.locator('textarea[name="unit"]').fill('unit')
      await page.locator('input[name="pkg_qty"]').click()
      await page.locator('input[name="pkg_qty"]').fill('4')
      await page.locator('textarea[name="pkg_unit"]').click()
      await page.locator('textarea[name="pkg_unit"]').fill('unit')
      await page.locator('input[name="unit_cost_value"]').click()
      await page.locator('input[name="unit_cost_value"]').fill('450000')
      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(ww)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Consultant' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Others' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersunitpcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ww}ConsultantOthersunitpcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('320000')
      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(ee)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Misc' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Insurance' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsuranceRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsuranceRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsuranceRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsuranceRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('4')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsuranceRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsuranceRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsurancepcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsurancepcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsurancepcsunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ee}MiscInsurancepcsunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('120000')
      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(rr)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Misc' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Contractor' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorRpRp$`) })
        .locator('input[name="qty"]')
        .fill('4')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorpcsunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${rr}MiscContractorpcsunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('340000')
      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(tt)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Services' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Videographer' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerRpRp$`) })
        .locator('input[name="qty"]')
        .fill('4')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerpcsRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerpcsRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${tt}ServicesVideographerpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${tt}ServicesVideographerpcsunitRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${tt}ServicesVideographerpcsunitRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('260000')
      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(yy)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Services' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Sign Language' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${yy}ServicesSign LanguageunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${yy}ServicesSign LanguageunitunitRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${yy}ServicesSign LanguageunitunitRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('320000')
      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(uu)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Goods' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'IT/Peripherals' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralsRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralsRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralsRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralsRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralsRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralsRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralspcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${uu}GoodsIT\/PeripheralspcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${uu}GoodsIT\/PeripheralspcspcsRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${uu}GoodsIT\/PeripheralspcspcsRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('340000')

      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(ii)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Goods' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Equipment' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentunitRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentunitRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentunitunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ii}GoodsEquipmentunitunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('235000')

      await page.getByRole('button', { name: 'Add Need Entry' }).first().click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(oo)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Vehicle Rental' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentalRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentalRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentalRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentalRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('1')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentalRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentalRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentaltripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${oo}TravelVehicle RentaltripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${oo}TravelVehicle RentaltriptripRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${oo}TravelVehicle RentaltriptripRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('450000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(aa)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Airfare' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfareRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfareRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfareRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfareRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('1')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfareRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfareRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfaretripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfaretripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfaretriptripRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${aa}TravelAirfaretriptripRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('240000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(ss)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Perdiem' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemRpRp$`) })
        .locator('input[name="qty"]')
        .fill('1')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemunitunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ss}TravelPerdiemunitunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('156000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(dd)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Accomodation' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationtripRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationtripRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationtripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${dd}TravelAccomodationtripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${dd}TravelAccomodationtriptripRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${dd}TravelAccomodationtriptripRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('430000')
      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(ff)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Transportation' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ff}TravelTransportationRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ff}TravelTransportationRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ff}TravelTransportationRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ff}TravelTransportationRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('5')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ff}TravelTransportationRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${ff}TravelTransportationRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('ticket')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${ff}TravelTransportationticketRpRp$`),
        })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${ff}TravelTransportationticketRpRp$`),
        })
        .locator('textarea[name="pkg_unit"]')
        .fill('ticket')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${ff}TravelTransportationticketticketRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${ff}TravelTransportationticketticketRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('450000')
      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(gg)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Other' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOtherRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOtherRpRp$`) })
        .locator('input[name="qty"]')
        .fill('4')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOtherRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOtherRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOtherRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOtherRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOthertripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOthertripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOthertriptripRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${gg}TravelOthertriptripRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('380000')
      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(hh)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Vehicle Rental' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentalRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentalRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentalRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentalRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentalRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentalRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentaltripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${hh}TravelVehicle RentaltripRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('trip')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${hh}TravelVehicle RentaltriptripRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${hh}TravelVehicle RentaltriptripRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('310000')
      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(jj)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Other' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherRpRp$`) })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('1')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('ticket')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherticketRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherticketRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('ticket')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherticketticketRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${jj}TravelOtherticketticketRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('216000')
      await page.getByRole('button', { name: 'Add Need Entry' }).nth(1).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(kk)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Subscription' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Software' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${kk}SubscriptionSoftwareRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${kk}SubscriptionSoftwareRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${kk}SubscriptionSoftwareRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${kk}SubscriptionSoftwareRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${kk}SubscriptionSoftwareRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${kk}SubscriptionSoftwareRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('ticket')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${kk}SubscriptionSoftwareticketRpRp$`),
        })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${kk}SubscriptionSoftwareticketRpRp$`),
        })
        .locator('textarea[name="pkg_unit"]')
        .fill('ticket')
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${kk}SubscriptionSoftwareticketticketRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({
          hasText: new RegExp(`^${kk}SubscriptionSoftwareticketticketRpRp$`),
        })
        .locator('input[name="unit_cost_value"]')
        .fill('180000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(2).click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .getByPlaceholder('↳ Needs Description')
        .fill(zz)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Subscription' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Internet & Telephone' }).click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('input[name="qty"]')
        .fill('2')
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('input[name="pkg_qty"]')
        .fill('3')
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('textarea[name="unit"]')
        .fill('package')
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('textarea[name="pkg_unit"]')
        .fill('package')
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('form div')
        .filter({
          hasText: 'Project (B)Activity 2TotalRp 0B.01Activity 2 Description',
        })
        .locator('input[name="unit_cost_value"]')
        .fill('320000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(2).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(xx)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Misc' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Auditor' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorpcsRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorpcsRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorpcspcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${xx}MiscAuditorpcspcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('120000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(2).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(cc)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Goods' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Printing' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingunitRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingunitRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('4')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('package')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingunitpackageRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${cc}GoodsPrintingunitpackageRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('270000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(2).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(vv)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Goods' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'ATK' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKpcspcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${vv}GoodsATKpcspcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('450000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(2).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(bb)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Event' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Transportation' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('2')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationpcsRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('pcs')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationpcspcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${bb}EventTransportationpcspcsRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('90000')

      await page.getByRole('button', { name: 'Add Need Entry' }).nth(2).click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .click()
      await page
        .locator('div')
        .filter({ hasText: /^Select type\.\.\.Select category\.\.\.RpRp$/ })
        .getByPlaceholder('↳ Needs Description')
        .fill(nn)
      await page.getByText('Select type...').click()
      await page.getByRole('option', { name: 'Travel' }).click()
      await page.getByText('Select category...').click()
      await page.getByRole('option', { name: 'Other' }).click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherRpRp$`) })
        .locator('input[name="qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherRpRp$`) })
        .locator('input[name="qty"]')
        .fill('3')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherRpRp$`) })
        .locator('input[name="pkg_qty"]')
        .fill('5')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherRpRp$`) })
        .locator('textarea[name="unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherRpRp$`) })
        .locator('textarea[name="unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherunitRpRp$`) })
        .locator('textarea[name="pkg_unit"]')
        .fill('unit')
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherunitunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .click()
      await page
        .locator('div')
        .filter({ hasText: new RegExp(`^${nn}TravelOtherunitunitRpRp$`) })
        .locator('input[name="unit_cost_value"]')
        .fill('450000')
      await page.getByRole('button', { name: 'Save Budget Needs' }).click()

      await expect(page.getByLabel('Budget Needs')).toContainText(qq)
      await expect(page.getByLabel('Budget Needs')).toContainText(ww)
      await expect(page.getByLabel('Budget Needs')).toContainText(ee)
      await expect(page.getByLabel('Budget Needs')).toContainText(rr)
      await expect(page.getByLabel('Budget Needs')).toContainText(tt)
      await expect(page.getByLabel('Budget Needs')).toContainText(yy)
      await expect(page.getByLabel('Budget Needs')).toContainText(uu)
      await expect(page.getByLabel('Budget Needs')).toContainText(ii)
      await expect(page.getByLabel('Budget Needs')).toContainText(oo)
      await expect(page.getByLabel('Budget Needs')).toContainText(aa)
      await expect(page.getByLabel('Budget Needs')).toContainText(ss)
      await expect(page.getByLabel('Budget Needs')).toContainText(dd)
      await expect(page.getByLabel('Budget Needs')).toContainText(ff)
      await expect(page.getByLabel('Budget Needs')).toContainText(gg)
      await expect(page.getByLabel('Budget Needs')).toContainText(hh)
      await expect(page.getByLabel('Budget Needs')).toContainText(jj)
      await expect(page.getByLabel('Budget Needs')).toContainText(kk)
      await expect(page.getByLabel('Budget Needs')).toContainText(zz)
      await expect(page.getByLabel('Budget Needs')).toContainText(xx)
      await expect(page.getByLabel('Budget Needs')).toContainText(cc)
      await expect(page.getByLabel('Budget Needs')).toContainText(vv)
      await expect(page.getByLabel('Budget Needs')).toContainText(bb)
      await expect(page.getByLabel('Budget Needs')).toContainText(nn)

      await page.getByRole('button', { name: 'Submit Budget Needs' }).click()
    })

    test('Approve budget needs by HoF (Alfian Fathoni)', async ({ page, request, context }) => {
      await page.goto(`${TESTING_URL}/dashboard/internal/employee`)
      await page.locator('[id="alfiankan@puskapa.org"]').click()
      await expect(page.getByRole('heading', { name: 'Alfian Fathoni' })).toBeVisible({ timeout: 14000 })
      // ================
      const cookies = await context.cookies()
      const endpointUrl = `https://api.staging.sim.puskapa.org/v1/programs/${programResponseData.data}`
      const response = await request.get(endpointUrl, {
        headers: {
          Authorization: `Bearer ${cookies.find((item) => item.name === 'auth_token').value}`,
          'Content-Type': 'application/json',
        },
      })
      expect(response.ok()).toBeTruthy()
      const resBody: ProgramDetail = JSON.parse(await response.text()).data
      // ================
      await context.addCookies([
        {
          name: 'program_id',
          value: resBody.id,
          domain: 'localhost',
          path: '/',
        },
      ])

      await page.context().storageState({ path: 'playwright/program-state.json' })

      await page.getByRole('button', { name: AVATAR_EMPLOYEE }).click()
      await page.getByRole('menuitem', { name: 'Project Budget' }).click()
      await expect(page.locator('tbody')).toContainText(resBody.program_name)
      await page.locator(`//*[@id="${resBody.id}"]`).click()
      await expect(page.locator('h1')).toContainText(resBody.program_name)
      await page.getByRole('tab', { name: 'Budget Needs' }).click()
      await expect(page.getByLabel('Budget Needs')).toContainText('Approve Budget')
      await page.getByRole('button', { name: 'Approve Budget' }).click()
      await expect(page.getByLabel('Budget Needs')).toContainText('Approved')
      await expect(page.getByLabel('Budget Needs')).toContainText('Create Request Form')
    })
  },
)
