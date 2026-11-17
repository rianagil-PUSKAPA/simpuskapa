import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { EmployeeService } from '@/server/services/employee.service'
import { TimeOffRequestService } from '@/server/services/time.off.request.service'
import { UserService } from '@/server/services/user.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'

describe('timeoff:request', () => {
  let app: INestApplication
  let userService: UserService
  let employeeService: EmployeeService
  let timeOffService: TimeOffRequestService
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
    timeOffService = moduleRef.get<TimeOffRequestService>(TimeOffRequestService)
  })

  describe('timeoff:request:delete', () => {
    describe('timeoff:delete', () => {
      it('Employee request timeoff', async () => {
        const FilePath = `${__dirname}/cv.pdf`
        const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
        const employee = await employeeService.getAllEmployee()

        await timeOffService.createTimeOffRequest(
          [],
          employee[0].id,
          new Date().toISOString(),
          new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(),
          'annual',
          2,
          'catatan kaki',
          employee[1].id,
        )

        const oneOfTimeOff = await timeOffService.getTimeOffList(employee[0].id)
        expect(oneOfTimeOff.data.length).toBeGreaterThan(0)

        return request(app.getHttpServer())
          .delete(`/v1/employes/${employee[0].id}/timeoff/${oneOfTimeOff.data[0].id}`)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
          .expect(function (res) {
            expect(res.body.message).toBe('Time Off Successfully Deleted')
          })
      })
    })
  })

  describe('timeoff:request', () => {
    describe('timeoff:request:add', () => {
      it('Employee request timeoff', async () => {
        const FilePath = `${__dirname}/cv.pdf`
        const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
        const employee = await employeeService.getAllEmployee()

        return request(app.getHttpServer())
          .post(`/v1/employes/${employee[0].id}/timeoff`)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
          .send({
            leave_type: 'annual',
            start_date: new Date().toISOString(),
            pic_id: employee[1].id,
            duration: 2,
            end_date: new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(),
            notes: 'catatan kaki',
            doc_path: FilePath,
          })
          .expect(function (res) {
            expect(res.body.message).toBe('Time Off Successfully Created')
          })
      })
    })

    describe('timeoff:reques:updatet', () => {
      describe('timeoff:request:update', () => {
        it('Employee request timeoff update', async () => {
          const FilePath = `${__dirname}/cv.pdf`
          const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
          const employee = await employeeService.getAllEmployee()
          const timeOffs = await timeOffService.getTimeOffList(employee[0].id)

          return request(app.getHttpServer())
            .put(`/v1/employes/${employee[0].id}/timeoff/${timeOffs.data[0].id}`)
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
            .send({
              leave_type: 'annual',
              start_date: new Date().toISOString(),
              pic_id: employee[1].id,
              duration: 2,
              end_date: new Date(Date.now() + 3600 * 1000 * 24 * 2).toISOString(),
              notes: 'catatan kaki',
              doc_path: FilePath,
            })
            .expect(function (res) {
              expect(res.body.message).toBe('Time Off Successfully Updated')
            })
        })
      })
    })

    describe('timeoff:reques:accept', () => {
      describe('timeoff:request:accept', () => {
        it('Employee request timeoff accept', async () => {
          const FilePath = `${__dirname}/cv.pdf`
          const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
          const employee = await employeeService.getAllEmployee()
          const timeOffs = await timeOffService.getTimeOffList(employee[0].id)

          return request(app.getHttpServer())
            .patch(`/v1/employes/${employee[0].id}/timeoff/${timeOffs.data[0].id}/status`)
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
            .send({
              status: 'approved',
            })
            .expect(function (res) {
              expect(res.body.message).toBe('Time Off Status Successfully Updated')
            })
        })
      })
    })

    describe('timeoff:request:get:all:by:employee', () => {
      it('Employee list request timeoff', async () => {
        const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
        const employee = await employeeService.getAllEmployee()

        return request(app.getHttpServer())
          .get(`/v1/employes/${employee[0].id}/timeoff`)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
          .expect(200)
          .expect(function (res) {
            expect(res.body.message).toBe('Success')
            expect(res.body.data.length).toBeGreaterThan(0)
          })
      })
    })

    describe('timeoff:request:cancel', () => {
      it('Cancel request timeoff', async () => {
        const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
        const employee = await employeeService.getAllEmployee()

        const timeOff = await timeOffService.getTimeOffList(employee[0].id)

        return request(app.getHttpServer())
          .patch(`/v1/employes/${employee[0].id}/timeoff/${timeOff.data[0].id}/cancel`)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
          .expect(function (res) {
            console.log(res.body)
            expect(res.body.message).toBe('Success')
            expect(res.body.data).not.toBeNull()
          })
      })
    })

    describe('timeoff:request:get:all:detail:employee', () => {
      it('Employee list request timeoff', async () => {
        const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
        const employee = await employeeService.getAllEmployee()

        const timeOff = await timeOffService.getTimeOffList(employee[0].id)

        return request(app.getHttpServer())
          .get(`/v1/employes/${employee[0].id}/timeoff/${timeOff.data[0].id}`)
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
          .expect(200)
          .expect(function (res) {
            expect(res.body.message).toBe('Success')
            expect(res.body.data).not.toBeNull()
          })
      })
    })

    afterAll(async () => {
      await app.close()
    })
  })
})
