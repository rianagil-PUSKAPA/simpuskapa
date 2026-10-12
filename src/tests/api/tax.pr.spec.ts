import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { TaxCalculation } from '@/server/internals/tax/tax.calculation'
import { RfRepository } from '@/server/repositories/rf.repository'
import { EmployeeService } from '@/server/services/employee.service'
import { PRServiceService } from '@/server/services/pr.service'
import { ProgramService } from '@/server/services/program.service'
import { RfServiceService } from '@/server/services/rf.service'
import { UserService } from '@/server/services/user.service'
import { VendorService } from '@/server/services/vendor.service'
import { CreatePaymentRequestApiRequest, PaymentRequestDetail } from '@/server/types/pr.dto'
import {
  ActivityBudgetList,
  BudgetProgramProjectActivity,
  BudgetProgramProjectDetail,
} from '@/server/types/program.dto'
import { TaxNationality, TaxParam } from '@/server/types/tax.dto'
import { JwtLib } from '@/shared/jwt.lib'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'

describe('payment:request:tax:calculation', () => {
  let app: INestApplication
  let userService: UserService
  let employeeService: EmployeeService
  let programService: ProgramService
  let rfRepository: RfRepository
  let rfService: RfServiceService
  let prService: PRServiceService
  let vendorService: VendorService
  const adminEmail = 'alfiankan19@gmail.com'
  const adminPassword = '12345678Ab#'

  beforeAll(async () => {
    const databaseTestUri = process.env['DATABASE_URL_TEST']
    process.env.DATABASE_URL = databaseTestUri
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalFilters(
      new ValidationErrorExceptionFilter(),
      new NotFoundExceptionFilter(),
      new BadRequestExceptionFilter(),
      new PrismaExceptionFilter(),
      new UnauthorizedExceptionFilter(),
    )
    await app.init()

    // migrate reset database then seed
    //execSync(
    //  `DATABASE_URL='${databaseTestUri}' npx prisma migrate reset --force`,
    // { stdio: 'inherit' },
    //)

    // usable service
    userService = moduleRef.get<UserService>(UserService)
    employeeService = moduleRef.get<EmployeeService>(EmployeeService)
    programService = moduleRef.get<ProgramService>(ProgramService)
    rfRepository = moduleRef.get<RfRepository>(RfRepository)
    rfService = moduleRef.get<RfServiceService>(RfServiceService)
    vendorService = moduleRef.get<VendorService>(VendorService)
    prService = moduleRef.get<PRServiceService>(PRServiceService)
  })

  describe('tax:case:consultant:individual:wni', () => {
    it('Calculation Only', async () => {
      /*
       * calculation case
       *    is_organization=false
       *    nationality=WNI
       *    with_ppn=true
       */

      const prs = []
      // get prs by vebdor id on same year paid
      // pr 1
      const pr1 = new PaymentRequestDetail()
      pr1.paid_at = new Date().toString()
      pr1.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 7500000,
                } as ActivityBudgetList,
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 7500000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr1)

      // pr 2
      const pr2 = new PaymentRequestDetail()
      pr2.paid_at = new Date().toString()
      pr2.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 10000000,
                } as ActivityBudgetList,
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 10000000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr2)

      // pr 3
      const pr3 = new PaymentRequestDetail()
      pr3.paid_at = new Date().toString()
      pr3.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 20000000,
                } as ActivityBudgetList,
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 20000000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr3)

      // pr 4
      const pr4 = new PaymentRequestDetail()
      pr4.paid_at = new Date().toString()
      pr4.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 25000000,
                } as ActivityBudgetList,
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 25000000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr4)

      // pr 5
      const pr5 = new PaymentRequestDetail()
      pr5.paid_at = new Date().toString()
      pr5.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 30000000,
                } as ActivityBudgetList,
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 30000000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr5)

      // pr 6 (calculate this)
      const pr6 = new PaymentRequestDetail()
      pr6.paid_at = new Date().toString()
      pr6.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 50000000,
                } as ActivityBudgetList,
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 50000000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr6)

      // pr 7 (calculate this)
      const pr7 = new PaymentRequestDetail()
      pr7.paid_at = new Date().toString()
      pr7.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 150000000,
                } as ActivityBudgetList,
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 150000000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr7)

      // pr 8 (calculate this)
      const pr8 = new PaymentRequestDetail()
      pr8.paid_at = new Date().toString()
      pr8.projects = [
        {
          activities: [
            {
              budgets: [
                {
                  qty: 1,
                  pkg_qty: 1,
                  unit_cost_value: 4500000000,
                } as ActivityBudgetList,
              ] as ActivityBudgetList[],
            } as BudgetProgramProjectActivity,
          ] as BudgetProgramProjectActivity[],
        } as BudgetProgramProjectDetail,
      ] as BudgetProgramProjectDetail[]

      prs.push(pr8)

      const tax = new TaxCalculation({
        with_ppn: true,
        is_organization: false,
        nationality: TaxNationality.WNI,
      })

      const result = tax.setPaymentRequesstHistory(prs).calculate(pr6)

      expect(result).toBeNull()
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
