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
import { ProjectService } from '@/server/services/project.service'
import { UserService } from '@/server/services/user.service'
import { VendorService } from '@/server/services/vendor.service'
import { ProjectActivity } from '@/server/types/project.dto'
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'

describe('budget:testing', () => {
  let app: INestApplication
  let programService: ProgramService
  let partnerService: PartnerService
  let employeeService: EmployeeService
  let projectService: ProjectService
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
    programService = moduleRef.get<ProgramService>(ProgramService)
    userService = moduleRef.get<UserService>(UserService)
    partnerService = moduleRef.get<PartnerService>(PartnerService)
    employeeService = moduleRef.get<EmployeeService>(EmployeeService)
    projectService = moduleRef.get<ProjectService>(ProjectService)
    vendorService = moduleRef.get<VendorService>(VendorService)
  })

  describe('budget:set', () => {
    it('set program budget', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programs = await programService.getProgramsList(1, 100, 'pending')
      const project = await projectService.getProjectList(programs[0].id)

      const vendorType = await vendorService.getVendorTypes()
      const vendorCategories = await vendorService.getVendorCategories(vendorType[0].id)

      return request(app.getHttpServer())
        .put(`/v1/programs/${programs[0].id}/budgets`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          projects: [
            {
              id: project[0].id,
              activities: [
                {
                  id: project[0].activities[0].id,
                  budgets: [
                    {
                      ordering_seq: 1,
                      code: 'A',
                      vendor_category_id: vendorCategories[0].id,
                      description: 'ipsum',
                      type: 'ipsum',
                      category: 'ipsum',
                      qty: 10,
                      unit: 'ipsum',
                      pkg_qty: 30,
                      pkg_unit: 'ipsum',
                      unit_cost_value: 2000,
                    },
                  ],
                },
              ],
            },
          ],
        })
        .expect(200)
        .expect(function (res) {
          expect(res.body.data).toBe('')
        })
    })
  })

  describe('budget:list', () => {
    it('get budget list', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programs = await programService.getProgramsList(1, 100, 'pending')

      return request(app.getHttpServer())
        .get(`/v1/programs/${programs[0].id}/budgets`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          expect(res.body.data.projects.length).toBeGreaterThan(0)
        })
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
