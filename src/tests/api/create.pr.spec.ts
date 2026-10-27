import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { RfRepository } from '@/server/repositories/rf.repository'
import { EmployeeService } from '@/server/services/employee.service'
import { PRServiceService } from '@/server/services/pr.service'
import { ProgramService } from '@/server/services/program.service'
import { RfServiceService } from '@/server/services/rf.service'
import { UserService } from '@/server/services/user.service'
import { VendorService } from '@/server/services/vendor.service'
import { CreatePaymentRequestApiRequest } from '@/server/types/pr.dto'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'

describe('payment request', () => {
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
    execSync(`DATABASE_URL='${databaseTestUri}' npx prisma migrate reset --force`, { stdio: 'inherit' })

    // usable service
    userService = moduleRef.get<UserService>(UserService)
    employeeService = moduleRef.get<EmployeeService>(EmployeeService)
    programService = moduleRef.get<ProgramService>(ProgramService)
    rfRepository = moduleRef.get<RfRepository>(RfRepository)
    rfService = moduleRef.get<RfServiceService>(RfServiceService)
    vendorService = moduleRef.get<VendorService>(VendorService)
    prService = moduleRef.get<PRServiceService>(PRServiceService)
  })

  describe('pf:create:normal', () => {
    it('Create pr normal', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      const rfs = await rfService.getRfList(program.id, '')

      const vendor = await vendorService.getVendors(1, 10, 'desc', '')

      const reqPayload = {
        budgets: budgetsSelected,
        rf_id: rfs[0].id,
        with_ppn: false,
        vendor_id: vendor[0].id,
        attachments: [],
        payment_date: new Date().toISOString(),
      } as CreatePaymentRequestApiRequest

      return request(app.getHttpServer())
        .post(`/v1/payment-requests`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send(reqPayload)
        .expect(201)
        .expect(function (res) {
          console.log(res.body)
          expect(res.body).not.toBeNull()
        })
    })
  })

  describe('pr:detail:normal', () => {
    it('Get detail pr normal', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      const rfs = await rfService.getRfList(program.id, '')

      const vendor = await vendorService.getVendors(1, 10, 'desc', '')

      const reqPayload = {
        budgets: budgetsSelected,
        rf_id: rfs[0].id,
        with_ppn: false,
        vendor_id: vendor[0].id,
        attachments: [],
        payment_date: new Date().toISOString(),
      } as CreatePaymentRequestApiRequest

      const users = await employeeService.getAllEmployee()

      const pr = await prService.createPaymentRequest(reqPayload, users[0].user_id)
      return request(app.getHttpServer())
        .get(`/v1/payment-requests/${pr}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send(reqPayload)
        .expect(200)
        .expect(function (res) {
          console.log(res.body)
          expect(res.body).not.toBeNull()
        })
    })
  })

  describe('pr:create:apr', () => {
    it('Create pr normal', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      const rfs = await rfService.getRfList(program.id, '')

      const vendor = await vendorService.getVendors(1, 10, 'desc', '')

      const reqPayload = {
        budgets: budgetsSelected,
        rf_id: rfs[0].id,
        with_ppn: false,
        vendor_id: vendor[0].id,
        attachments: [],
        payment_date: new Date().toISOString(),
      } as CreatePaymentRequestApiRequest

      return request(app.getHttpServer())
        .post(`/v1/payment-requests`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send(reqPayload)
        .expect(201)
        .expect(function (res) {
          console.log(res.body)
          expect(res.body).not.toBeNull()
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
