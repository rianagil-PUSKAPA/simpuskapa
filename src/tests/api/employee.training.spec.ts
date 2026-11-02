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

describe('employee:training', () => {
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

  describe('employee:training:add', () => {
    it('Add employee training', async () => {
      const cvFilePath = `${__dirname}/cv.pdf`
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employee = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))

      return request(app.getHttpServer())
        .post(`/v1/employes/${employee}/trainings`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          training_name: faker.name.fullName(),
          training_date: new Date().toDateString(),
          organizer: faker.name.fullName(),
          source_fund: faker.name.fullName(),
          file: cvFilePath,
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body.message).toBe('Employee Training Successfully Created')
        })
    })
  })

  describe('employee:training:get', () => {
    it('Add employee training', async () => {
      const cvFilePath = `${__dirname}/cv.pdf`
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const payloadJwt = await JwtLib.decodeJwtToken(adminAuthToken.auth_token)

      // create employee
      const employee = await employeeService.createEmployee(createEmployeeRequest(payloadJwt.id))
      await employeeService.addEmployeeTraining(
        employee,
        faker.name.fullName(),
        new Date().toDateString(),
        faker.name.fullName(),
        faker.name.fullName(),
        [faker.image.avatar()],
      )
      await employeeService.addEmployeeTraining(
        employee,
        faker.name.fullName(),
        new Date().toDateString(),
        faker.name.fullName(),
        faker.name.fullName(),
        [faker.image.avatar()],
      )

      return request(app.getHttpServer())
        .get(`/v1/employes/${employee}/trainings`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          expect(res.body.data.length).toBeGreaterThan(1)
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
