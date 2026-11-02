import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { UserService } from '@/server/services/user.service'
import { VendorService } from '@/server/services/vendor.service'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'

describe('vendor:testing', () => {
  let app: INestApplication
  let vendorService: VendorService
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
    vendorService = moduleRef.get<VendorService>(VendorService)
    userService = moduleRef.get<UserService>(UserService)
  })

  describe('vendor:create', () => {
    it('Create new vendor', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const vendorType = await vendorService.getVendorTypes()
      const vendorCategories = await vendorService.getVendorCategories(vendorType[0].id)
      return request(app.getHttpServer())
        .post('/v1/vendors')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          vendor_type: faker.name.lastName(),
          vendor_categories: [vendorCategories[0].id],
          vendor_information: { name: 'value' },
          vendor_packages: [
            {
              name: faker.name.fullName(),
              currency: 'Rp.',
              price: 10.5,
              unit: 'pcs',
            },
          ],
          vendor_payment: {
            bank_name: 'BCA',
          },
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body.data.length).toBeGreaterThan(0)
        })
    })
  })

  describe('vendor:update', () => {
    it('update vendor', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const about = new Map<string, string>()
      about.set('name', 'value')
      const vendorType = await vendorService.getVendorTypes()
      const vendorCategories = await vendorService.getVendorCategories(vendorType[0].id)
      const vendorid = await vendorService.createVendor('hello', about, [vendorCategories[0].id], [], '{}', 0, {})

      return request(app.getHttpServer())
        .put(`/v1/vendors/${vendorid}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          vendor_type: faker.name.lastName(),
          vendor_categories: [vendorCategories[0].id],
          vendor_information: { name: 'value' },
          vendor_packages: [
            {
              name: faker.name.fullName(),
              currency: 'Rp.',
              price: 10.5,
              unit: 'pcs',
            },
          ],
          vendor_payment: {
            bank_name: 'BCA',
          },
        })
        .expect(200)
        .expect(function (res) {
          console.log(res.body.data)
        })
    })

    it('update vendor unfilled', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const about = new Map<string, string>()
      about.set('name', 'value')
      const vendorType = await vendorService.getVendorTypes()
      const vendorCategories = await vendorService.getVendorCategories(vendorType[0].id)
      const vendorid = await vendorService.createVendor('hello', about, [vendorCategories[0].id], [], '{}', 0, {})

      return request(app.getHttpServer())
        .put(`/v1/vendors/${vendorid}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          vendor_type: faker.name.lastName(),
          vendor_categories: [vendorCategories[0].id],
          about_vendor: {},
          packages: [],
          vendor_payment: {
            bank_name: 'BCA',
          },
        })
        .expect(200)
        .expect(function (res) {
          console.log(res.body.data)
        })
    })
  })

  describe('vendor:getall', () => {
    it('Get vendor all', async () => {
      const vendorType = await vendorService.getVendorTypes()
      const vendorCategories = await vendorService.getVendorCategories(vendorType[0].id)
      await vendorService.createVendor(
        faker.name.gender(),
        new Map<string, string>(),
        [vendorCategories[0].id],
        [
          {
            name: faker.name.fullName(),
            currency: 'Rp.',
            price: 10.5,
            unit: 'pcs',
          },
        ],
        '{}',
        0,
        {},
      )

      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      return request(app.getHttpServer())
        .get('/v1/vendors')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          expect(res.body.data.length).toBeGreaterThan(0)
          expect(res.body.data[0].vendor_packages.length).toBeGreaterThan(0)
        })
    })
  })

  describe('vendor:get:one:by:id', () => {
    it('Get vendor detail', async () => {
      const vendorType = await vendorService.getVendorTypes()
      const vendorCategories = await vendorService.getVendorCategories(vendorType[0].id)

      const createdVendor = await vendorService.createVendor(
        faker.name.gender(),
        new Map<string, string>(),
        [vendorCategories[0].id],
        [
          {
            name: faker.name.fullName(),
            currency: 'Rp.',
            price: 10.5,
            unit: 'pcs',
          },
          {
            name: faker.name.fullName(),
            currency: 'Rp.',
            price: 10.5,
            unit: 'pcs',
          },
        ],
        '{}',
        0,
        {},
      )

      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      return request(app.getHttpServer())
        .get(`/v1/vendors/${createdVendor}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          expect(res.body.data.vendor_packages.length).toBeGreaterThan(0)
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
