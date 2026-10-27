import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { EmployeeService } from '@/server/services/employee.service'
import { PartnerService } from '@/server/services/partner.service'
import { ProgramService } from '@/server/services/program.service'
import { UserService } from '@/server/services/user.service'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'

describe('program:testing', () => {
  let app: INestApplication
  let programService: ProgramService
  let partnerService: PartnerService
  let employeeService: EmployeeService
  let userService: UserService
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
    programService = moduleRef.get<ProgramService>(ProgramService)
    userService = moduleRef.get<UserService>(UserService)
    partnerService = moduleRef.get<PartnerService>(PartnerService)
    employeeService = moduleRef.get<EmployeeService>(EmployeeService)
  })

  describe('program:create', () => {
    it('Create new program', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const partner = await partnerService.getPartnersAll()
      const employee = await employeeService.getAllEmployee()

      return request(app.getHttpServer())
        .post('/v1/programs')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          code: faker.datatype.hexadecimal({ case: 'upper', length: 4 }),
          partner_code: partner[0].code,
          program_name: faker.name.firstName(),
          program_description: faker.lorem.sentence(5),
          currency: 'IDR',
          estimated_budget: faker.datatype.number({ min: 5000, max: 5000000 }),
          grant_manager: employee[0].id,
          program_manager: employee[0].id,
          program_officer: employee[0].id,
          timeline: {
            start_date: {
              month: faker.datatype.number({ min: 10, max: 25 }),
              year: 2022,
            },
            end_date: {
              month: faker.datatype.number({ min: 10, max: 25 }),
              year: 2023,
            },
          },
          contract: {
            contract_number: faker.datatype.hexadecimal({
              length: 10,
              case: 'upper',
            }),
            contract_path: [],
          },
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body.data.length).toBeGreaterThan(0)
        })
    })
  })

  describe('program:listing', () => {
    it('get programs', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      return request(app.getHttpServer())
        .get('/v1/programs?page=1&per_page=10')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          expect(res.body.data.length).toBeGreaterThan(0)
        })
    })
  })

  describe('program:detail', () => {
    it('get program detail', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programs = await programService.getProgramsList(1, 100, 'pending')

      return request(app.getHttpServer())
        .get(`/v1/programs/${programs[0].id}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          console.log(res.body.data)
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
