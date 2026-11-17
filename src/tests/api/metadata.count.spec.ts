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
import { BucketsEnum } from '@/shared/file.system'
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

  describe('timeoff', () => {
    it('Employee request timeoff', async () => {
      const FilePath = `${__dirname}/cv.pdf`
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const employee = await employeeService.getAllEmployee()

      const timeOff = await timeOffService.createTimeOffRequest(
        [''],
        employee[0].id,
        new Date().toISOString(),
        new Date().toISOString(),
        'annual',
        1,
        'note',
        employee[0].id,
      )

      return request(app.getHttpServer())
        .get(`/v1/metadata/total`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(function (res) {
          expect(res.body.data.time_off_requested).toBeGreaterThan(0)
        })
    })

    afterAll(async () => {
      await app.close()
    })
  })
})
