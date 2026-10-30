import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { EmployeeService } from '@/server/services/employee.service'
import { UserService } from '@/server/services/user.service'
import { JwtLib } from '@/shared/jwt.lib'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'
import { createEmployeeRequest } from './test.util'

describe('employee:performance', () => {
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

  describe('employee:performance:create', () => {
    it('Create employe performance by employee id', async () => {
      const cvFilePath = `${__dirname}/cv.pdf`
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employee = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))

      return request(app.getHttpServer())
        .post(`/v1/employes/${employee}/performance`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          year: 2022,
          doc_type: 'end-year',
          file: [cvFilePath],
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body.message).not.toBeNull()
        })
    })
  })

  describe('employee:performance:edit:data', () => {
    it('Edit performance by perfoemance id', async () => {
      const cvFilePath = `${__dirname}/cv.pdf`
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employeeId = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))
      // add employee performance
      const performanceId = await employeeService.addEmployeePerformance(employeeId, 2022, 'end-year', [
        faker.image.food(),
      ])

      return request(app.getHttpServer())
        .put(`/v1/employes/${employeeId}/performance/${performanceId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          year: 2020,
          doc_type: 'end-year',
          file: [cvFilePath],
        })
        .expect(200)
        .expect(async function (res) {
          expect(res.body.message).not.toBeNull()
          const performance = await employeeService.getEmployeePerformance(employeeId, performanceId)
          expect(performance.year).toBe(2020)
        })
    })
  })

  describe('employee:performance:delete', () => {
    it('Delete performance by performance id', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employeeId = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))
      // add employee performance
      const performanceId = await employeeService.addEmployeePerformance(employeeId, 2022, 'end-year', [
        faker.image.food(),
      ])

      return request(app.getHttpServer())
        .delete(`/v1/employes/${employeeId}/performance/${performanceId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          expect(res.body.message).not.toBeNull()
          const performance = await employeeService.getEmployeePerformance(employeeId, performanceId)
          expect(performance).toBe(null)
        })
    })
  })

  describe('employee:performance:detail', () => {
    it('Detail employe performance by performance id', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employeeId = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))
      // add employee performance
      const performanceId = await employeeService.addEmployeePerformance(employeeId, 2022, 'end-year', [
        faker.image.food(),
      ])

      return request(app.getHttpServer())
        .get(`/v1/employes/${employeeId}/performance/${performanceId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          expect(res.body.message).not.toBeNull()
          const performance = await employeeService.getEmployeePerformance(employeeId, performanceId)
          expect(res.body.data.year).toBe(performance.year)
        })
    })
  })

  describe('employee:performance:all', () => {
    it('All employe performances', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employeeId = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))
      // add employee performance
      await employeeService.addEmployeePerformance(employeeId, 2022, 'end-year', [faker.image.food()])
      await employeeService.addEmployeePerformance(employeeId, 2023, 'mid-year', [faker.image.food()])

      return request(app.getHttpServer())
        .get(`/v1/employes/performance`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(async function (res) {
          //console.log(res.body.data[0])
          //expect(res.body.message).not.toBeNull()
          //expect(res.body.data.length).toBeGreaterThan(1)
        })
    })
  })

  describe('employee:performance:getall:byemployeeid', () => {
    it('All employe performance by employee id', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employeeId = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))
      // add employee performance
      await employeeService.addEmployeePerformance(employeeId, 2022, 'end-year', [faker.image.food()])
      await employeeService.addEmployeePerformance(employeeId, 2023, 'mid-year', [faker.image.food()])

      return request(app.getHttpServer())
        .get(`/v1/employes/${employeeId}/performance`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          expect(res.body.message).not.toBeNull()
          expect(res.body.data.length).toBeGreaterThan(1)
        })
    })

    it('All employe performance by employee id query by period mid-year', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employeeId = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))
      // add employee performance
      await employeeService.addEmployeePerformance(employeeId, 2022, 'end-year', [faker.image.food()])
      await employeeService.addEmployeePerformance(employeeId, 2023, 'mid-year', [faker.image.food()])

      return request(app.getHttpServer())
        .get(`/v1/employes/${employeeId}/performance?type=mid-year`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(async function (res) {
          console.log(res.body)
          expect(res.body.message).not.toBeNull()
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
