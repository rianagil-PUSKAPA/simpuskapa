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
import { faker } from '@faker-js/faker'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'

describe('project:testing', () => {
  let app: INestApplication
  let programService: ProgramService
  let partnerService: PartnerService
  let employeeService: EmployeeService
  let projectService: ProjectService
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
  })

  describe('project:create', () => {
    it('Create new project', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programs = await programService.getProgramsList(1, 100, '')

      return request(app.getHttpServer())
        .post(`/v1/program/${programs[0].id}/projects`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          projects: [
            {
              ordering_seq: 1,
              code: 'A',
              description: 'lorem',
              activities: [
                {
                  ordering_seq: 1,
                  code: 'A.1',
                  description: 'ipsum',
                  notes: 'ipsum',
                  timeline: {
                    start: '2011-10-05T14:48:00.000Z',
                    end: '2011-10-05T14:48:00.000Z',
                  },
                  proposed_milestone: 'ipsum',
                  due_date: '2011-10-05T14:48:00.000Z',
                },
                {
                  ordering_seq: 2,
                  code: 'A.1',
                  description: 'ipsum',
                  notes: 'ipsum',
                  timeline: {
                    start: '2011-10-05T14:48:00.000Z',
                    end: '2011-10-05T14:48:00.000Z',
                  },
                  proposed_milestone: 'ipsum',
                  due_date: '2011-10-05T14:48:00.000Z',
                },
              ],
            },
          ],
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body.data).toBe('')
        })
    })
  })

  describe('project:update', () => {
    it('Update project', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)

      const programs = await programService.getProgramsList(1, 100, 'pending')
      const projects = await projectService.getProjectList(programs[0].id)

      return request(app.getHttpServer())
        .put(`/v1/program/${programs[0].id}/projects`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          projects: [
            {
              id: projects[0].id,
              ordering_seq: 1,
              code: 'A',
              description: 'lorem',
              activities: [
                {
                  id: projects[0].activities[0].id,
                  ordering_seq: 1,
                  code: 'A.1',
                  description: 'ipsum',
                  notes: 'ipsum',
                  timeline: {
                    start: '2011-10-05T14:48:00.000Z',
                    end: '2011-10-05T14:48:00.000Z',
                  },
                  proposed_milestone: 'ipsum',
                  due_date: '2011-10-05T14:48:00.000Z',
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

  describe('project:listing', () => {
    it('get programs', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      const programs = await programService.getProgramsList(1, 100, '')

      return request(app.getHttpServer())
        .get(`/v1/program/${programs[0].id}/projects`)
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
