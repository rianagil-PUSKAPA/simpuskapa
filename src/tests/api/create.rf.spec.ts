import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { RfRepository } from '@/server/repositories/rf.repository'
import { EmployeeService } from '@/server/services/employee.service'
import { ProgramService } from '@/server/services/program.service'
import { UserService } from '@/server/services/user.service'
import { CreateEmployeeContractRequest } from '@/server/types/employee.contract.dto'
import { EmployeeDataRequest, EmployeeInitRequest, EmployeeUpdateRequest } from '@/server/types/employee.dto'
import { CreateProcurementRfApiRequest, PersonalHireDetail, TravelRfDetail } from '@/server/types/rf.dto'
import { JwtLib } from '@/shared/jwt.lib'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { employee_contracts } from '@prisma/client'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'
import { createEmployeeRequest } from './test.util'

describe('requisition form', () => {
  let app: INestApplication
  let userService: UserService
  let employeeService: EmployeeService
  let programService: ProgramService
  let rfRepository: RfRepository
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
  })

  describe('rf:create:procurement', () => {
    it('Create procurement rf', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const employee = await employeeService.getAllEmployee()

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      const reqPayload = {
        deadline: new Date().toISOString(),
        action_by: employee[0].id,
        about_request: faker.lorem.sentence(5),
        budgets: budgetsSelected,
      } as CreateProcurementRfApiRequest

      return request(app.getHttpServer())
        .post(`/v1/programs/${program.id}/projects/${project.id}/rf/procurement`)
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

  describe('rf:create:travel', () => {
    it('Create travel rf', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const employee = await employeeService.getAllEmployee()

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      const reqPayload = {
        deadline: new Date().toISOString(),
        action_by: employee[0].id,
        about_request: faker.lorem.sentence(5),
        budgets: budgetsSelected,
        travel_detail: {
          date_start: new Date(),
          date_end: new Date(),
          employee_id: employee[0].id,
          who_traveling: 'puskapa',
        } as TravelRfDetail,
      } as CreateProcurementRfApiRequest

      return request(app.getHttpServer())
        .post(`/v1/programs/${program.id}/projects/${project.id}/rf/travel`)
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

  describe('rf:create:personalhire', () => {
    it('Create personal hire rf', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const employee = await employeeService.getAllEmployee()

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      const reqPayload = {
        deadline: new Date().toISOString(),
        action_by: employee[0].id,
        about_request: faker.lorem.sentence(5),
        budgets: budgetsSelected,
        travel_detail: {
          type_hire: 'x',
          notes: 'x',
          other_docs: ['x'],
          background_docs: ['x'],
          offer_page_docs: ['x'],
          primary_division: 'x',
          hire_process_docs: ['x'],
        } as PersonalHireDetail,
      } as CreateProcurementRfApiRequest

      return request(app.getHttpServer())
        .post(`/v1/programs/${program.id}/projects/${project.id}/rf/personal-hire`)
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

  describe('rf:get:list', () => {
    it('get list rf', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const employee = await employeeService.getAllEmployee()

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      return request(app.getHttpServer())
        .get(`/v1/programs/${program.id}/rfs`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          console.log(res.body)
          expect(res.body).not.toBeNull()
        })
    })
  })

  describe('rf:get:detail', () => {
    it('get detail rf', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const employee = await employeeService.getAllEmployee()

      const programAll = await programService.getProgramsList(1, 10000, '')
      const program = programAll[0]
      const programBudget = await programService.getBudgets(program.id)
      const project = programBudget.projects[0]
      const budgetsSelected = project.activities[0].budgets

      const rfs = await rfRepository.getListRf(program.id, null)
      console.log('RFS', rfs[0].id)

      return request(app.getHttpServer())
        .get(`/v1/programs/${program.id}/projects/${project.id}/rf/${rfs[0].id}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          console.log(res.body)
          expect(res.body).not.toBeNull()
          expect(res.body.data).not.toBe({})
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
