import { ApplicationContext } from '@/server/common/acl.gate'
import {
  BadRequestExceptionFilter,
  NotFoundExceptionFilter,
  PrismaExceptionFilter,
  UnauthorizedExceptionFilter,
  ValidationErrorExceptionFilter,
} from '@/server/common/catch.response'
import { UserService } from '@/server/services/user.service'
import { AclDefinition } from '@/shared/acl.labels'
import { RoleDefinition } from '@/shared/role.access'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '@server/app.module'
import { execSync } from 'child_process'
import request from 'supertest'
import { v4 as uuidv4 } from 'uuid'

describe('users', () => {
  let app: INestApplication
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
    userService = moduleRef.get<UserService>(UserService)
  })

  describe('user:login', () => {
    it('Login user', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200)
    })

    it('Login user not registered', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          email: `${uuidv4()}1@simpuskapa.com`,
          password: adminPassword,
        })
        .expect(404)
    })

    it('Login user wrong password', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          email: adminEmail,
          password: '12345678Ab',
        })
        .expect(400)
    })
  })

  describe('user:create', () => {
    it('Create new user unauthorized', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}xx`)
        .send({
          email: `${uuidv4()}2@simpuskapa.com`,
          password: adminPassword,
        })
        .expect(401)
    })
    it('Create new user', async () => {
      const adminAuthToken = await userService.emailPasswordLogin(adminEmail, adminPassword)
      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          email: 'newuser@simpuskapa.com',
          password: adminPassword,
          acl: [AclDefinition.USER_READ],
        })
        .expect(201)
        .expect(function (res) {
          expect(res.body.data.email).toBe('newuser@simpuskapa.com')
        })
    })
    it('Create new user without access', async () => {
      const email = `${uuidv4()}3@simpuskapa.com`
      const password = '12345678'

      await userService.createUser(email, password, '', RoleDefinition.ADMIN)
      const adminAuthToken = await userService.emailPasswordLogin(email, password)
      return request(app.getHttpServer())
        .post('/v1/users')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          email: `${uuidv4()}4@simpuskapa.com`,
          password: password,
        })
        .expect(201)
    })
  })

  describe('user:read', () => {
    it('Get users data', async () => {
      const email = `${uuidv4()}5@simpuskapa.com`
      const password = '12345678'

      await userService.createUser(email, password, '', RoleDefinition.ADMIN)

      const adminAuthToken = await userService.emailPasswordLogin(email, password)
      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
        .expect(function (res) {
          expect(res.body.data.length).toBeGreaterThan(0)
        })
    })
  })

  describe('user:update', () => {
    it('Update user', async () => {
      const email = `${uuidv4()}6@simpuskapa.com`
      const password = '12345678'

      await userService.createUser(email, password, '', RoleDefinition.ADMIN)

      const userToBeEdited = await userService.createUser('tobeedited@gmail.com', password, '', RoleDefinition.ADMIN)

      const adminAuthToken = await userService.emailPasswordLogin(email, password)
      return request(app.getHttpServer())
        .put(`/v1/users/${userToBeEdited.id}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          email: '11edited@gmail.com',
          acl: [AclDefinition.USER_DELETE],
        })
        .expect(200)
        .expect(function (res) {
          userService.getUserById(userToBeEdited.id).then((user) => {
            expect(user.email).toBe('11edited@gmail.com')
          })
        })
    })

    it('Update user password', async () => {
      const email = `${uuidv4()}7@simpuskapa.com`
      const password = '12345678'

      await userService.createUser(email, password, '', RoleDefinition.ADMIN)
      const userToBeEdited = await userService.createUser(
        `${uuidv4()}8@simpuskapa.com`,
        password,
        '',
        RoleDefinition.ADMIN,
      )

      const adminAuthToken = await userService.emailPasswordLogin(email, password)
      return request(app.getHttpServer())
        .put(`/v1/users/${userToBeEdited.id}/password`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .send({
          password: '54321#####',
        })
        .expect(200)
    })
  })

  describe('user:delete', () => {
    it('Delete user', async () => {
      const email = `${uuidv4()}9@simpuskapa.com`
      const password = '12345678'

      await userService.createUser(email, password, '', RoleDefinition.ADMIN)
      const userToBeEdited = await userService.createUser(
        `${uuidv4()}8@simpuskapa.com`,
        password,
        '',
        RoleDefinition.ADMIN,
      )

      const adminAuthToken = await userService.emailPasswordLogin(email, password)
      return request(app.getHttpServer())
        .delete(`/v1/users/${userToBeEdited.id}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${adminAuthToken.auth_token}`)
        .expect(200)
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
