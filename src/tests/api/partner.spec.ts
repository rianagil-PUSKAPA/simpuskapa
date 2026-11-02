import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { PartnerService } from '@/server/services/partner.service'
import { UserService } from '@/server/services/user.service'
import { VendorService } from '@/server/services/vendor.service'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'

describe('partner:testing', () => {
  let app: INestApplication
  let partnerService: PartnerService
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
    partnerService = moduleRef.get<PartnerService>(PartnerService)
    userService = moduleRef.get<UserService>(UserService)
  })

  describe('partner:create', () => {
    it('Create new partner', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      return request(app.getHttpServer())
        .post('/v1/partners')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          name: faker.company.name(),
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body.data).not.toBeNull()
        })
    })
  })

  describe('partner:getall', () => {
    it('Get partner all', async () => {
      await partnerService.createPartner(faker.company.name())

      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      return request(app.getHttpServer())
        .get('/v1/partners')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          expect(res.body.data.length).toBeGreaterThan(0)
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
