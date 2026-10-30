import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { EmployeeService } from '@/server/services/employee.service'
import { UserService } from '@/server/services/user.service'
import { CreateEmployeeContractRequest } from '@/server/types/employee.contract.dto'
import { EmployeeDataRequest, EmployeeInitRequest, EmployeeUpdateRequest } from '@/server/types/employee.dto'
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

describe('employee', () => {
  let app: INestApplication
  let userService: UserService
  let employeeService: EmployeeService
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
  })

  describe('employee:create:compact', () => {
    it('Create employee data', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const reqPayload = {
        email: `${uuidv4()}_${faker.internet.email()}`,
        full_name: `${faker.name.fullName()} ${uuidv4()}`,
      } as EmployeeInitRequest

      return request(app.getHttpServer())
        .post('/v1/init-employee')
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

  describe('employee:create', () => {
    it('Create employee data', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      return request(app.getHttpServer())
        .post('/v1/employes')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send(createEmployeeRequest(payloadJwt.id))
        .expect(201)
        .expect(function (res) {
          expect(res.body).not.toBeNull()
        })
    })
  })

  describe('employee:update', () => {
    it('create pre empty employee initial', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)
      return request(app.getHttpServer())
        .post('/v1/employes')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          user_id: payloadJwt.id,
          full_name: faker.name.fullName(),
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body).not.toBe(null)
        })
    })
    it('Update employee data full_name', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      console.log(adminAuthToken)
      const user = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      const employee = await employeeService.createEmployee({
        user_id: user.id,
        full_name: faker.name.fullName(),
      } as EmployeeDataRequest)

      const reqData = {
        full_name: `updated ${faker.name.fullName()}`,
        residence_address: 'Jl. pegangsaan timur',
        nationality: `updated ${faker.address.country()}`,
      }
      return request(app.getHttpServer())
        .put(`/v1/employes/${employee}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send(reqData)
        .expect(200)
        .expect(function (res) {
          expect(res.body.message).toBe('Employee Successfully Updated')
        })
    })
  })

  describe('employee:delete', () => {
    it('Delete employee data', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      await JwtLib.decodeJwtToken(adminAuthToken.auth_token)
      const employee = await employeeService.getAllEmployee()
      const eid = employee[0].id
      return request(app.getHttpServer())
        .delete(`/v1/employes/${eid}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          const employee = await employeeService.getEmployeeByID(eid)
          expect(employee).toBeNull()
        })
    })
  })

  describe('employee:read:all', () => {
    it('Get employee all', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      await JwtLib.decodeJwtToken(adminAuthToken.auth_token)
      const employee = await employeeService.getAllEmployee()
      const eid = employee[0].id
      return request(app.getHttpServer())
        .get(`/v1/employes/`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          console.log(res.body.data[0].employee_contracts)
          expect(res.body.data.length).toBeGreaterThan(0)
        })
    })
  })

  describe('employee:read:draft', () => {
    it('Get employee all in draft', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const employee = await employeeService.getAllEmployee()
      const eid = employee[0].id

      await employeeService.updateEmployee(null, eid, {
        form_progress: 10,
        is_lock: false,
      } as EmployeeUpdateRequest)

      return request(app.getHttpServer())
        .get(`/v1/employes?only_draft=true`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          console.log(res.body.data)
          expect(res.body.data.length).toBeGreaterThan(0)
        })
    })
    it('Get employee all not in draft', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const employee = await employeeService.getAllEmployee()
      const eid = employee[0].id

      await employeeService.updateEmployee(null, eid, {
        form_progress: 10,
        is_lock: false,
      } as EmployeeUpdateRequest)

      return request(app.getHttpServer())
        .get(`/v1/employes`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          console.log(res.body.data)
          expect(res.body.data.length).toBeGreaterThan(1)
        })
    })
  })

  describe('employee:read:detail', () => {
    it('Get employee detail', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      await JwtLib.decodeJwtToken(adminAuthToken.auth_token)
      const employee = await employeeService.getAllEmployee()
      const eid = employee[0].id
      return request(app.getHttpServer())
        .get(`/v1/employes/${eid}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          console.log(res.body.data)
          const employee = await employeeService.getEmployeeByID(eid)
          expect(res.body.data.full_name).toBe(employee.full_name)
        })
    })
  })

  describe('employee:read:contract', () => {
    it('Get employee contract history', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      await JwtLib.decodeJwtToken(adminAuthToken.auth_token)
      const employee = await employeeService.getAllEmployee()

      const eid = employee[0].id
      // add contract
      await employeeService.addEmployeeContracts({
        contract_number: uuidv4(),
        department: 'dev',
        emp_status: 'full-time',
        supervisor_id: employee[0].id,
        employee_id: employee[0].id,
        contract_name: 'hello',
        position: 'spv',
        doc_path: ['xxx'],
        contract_started: new Date().toISOString(),
        contract_ended: new Date().toISOString(),
      } as CreateEmployeeContractRequest)
      await employeeService.addEmployeeContracts({
        contract_number: uuidv4(),
        department: 'dev',
        emp_status: 'full-time',
        supervisor_id: employee[0].id,
        employee_id: employee[0].id,
        contract_name: 'hello',
        position: 'spv',
        doc_path: ['xxx'],
        contract_started: new Date().toISOString(),
        contract_ended: new Date().toISOString(),
      } as CreateEmployeeContractRequest)

      return request(app.getHttpServer())
        .get(`/v1/employes/${eid}/contracts`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          console.log('employeee', eid)
          //const employee = await employeeService.getEmployeeByID(eid)
          console.log(res.body.data)
          expect(res.body.data.length).toBeGreaterThan(1)
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
