import { JwtLib } from '@/shared/jwt.lib'
import { ServerBadRequest, ServerNotFound, ServerUnauthorized } from '@/shared/server.errors'
import { faker } from '@faker-js/faker'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { Prisma, users as User } from '@prisma/client'
import { Password } from '@server/common/password'
import { UserRepository } from '@server/repositories/user.repository'
import { AppJwtPayload } from '@server/types/jwt.payload'
import { PairJWT } from '@server/types/user.dto'
import { CommonRedisClient } from '@server/common/memached.client'
import { EmployeeRepository } from '@server/repositories/employee.repository'
import { MailRepository } from '@server/repositories/mail.repository'

@Injectable()
export class UserService {
  private refreshTTl = '14d'
  private authTTl = '1d'
  // private refreshTTl = '2m'
  // private authTTl = '1m'
  constructor(
    private userRepo: UserRepository,
    private employeeRepo: EmployeeRepository,
    private cacheClient: CommonRedisClient,
    private mailRepo: MailRepository,
  ) {}

  async forgotPassword(email: string) {
    const user = await this.userRepo.getUserByEmail(email)

    if (!user) {
      throw new ServerBadRequest('Email not found')
    }

    const temporaryPassword = faker.internet.password(10)

    const hashedPassword = Password.createPassword(temporaryPassword)

    await this.userRepo.updateUser({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    })

    const templateValues = new Map<string, string>()

    templateValues.set('{{.HEADING}}', 'Password Sementara SIM PUSKAPA')

    templateValues.set(
      '{{.BODY}}',
      `Password sementara untuk akun ${user.email} adalah: <strong>${temporaryPassword}</strong><br /><br />Silakan gunakan password tersebut untuk masuk ke SIM PUSKAPA, kemudian segera ubah password Anda.`,
    )

    templateValues.set('{{.BUTTON_URL}}', 'https://sim.puskapa.org/login')

    templateValues.set('{{.BUTTON_TITLE}}', 'Login ke SIM PUSKAPA')

    await this.mailRepo.sendNotificationNoReply('Password Sementara SIM PUSKAPA', user.email, templateValues)

    await this.cacheClient.cacheClient.del(`session:${user.id}`)

    return {
      message: 'Password sementara telah dikirim ke email',
    }
  }

  async completeForgotPassword(email: string, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.getUserByEmail(email)

    if (!user) {
      throw new ServerBadRequest('Email not found')
    }

    if (!Password.verifyPassword(oldPassword, user.password)) {
      throw new ServerBadRequest('Old Password tidak sesuai')
    }

    const hashedPassword = Password.createPassword(newPassword)

    await this.userRepo.updateUserByID(user.id, {
      password: hashedPassword,
    })

    await this.cacheClient.cacheClient.del(`session:${user.id}`)

    return true
  }

  async getUsers(ctx): Promise<User[]> {
    let users = await this.userRepo.getAllusers()
    users = users.filter((user) => {
      delete user.password
      user.acl = user.acl ?? []
      user.avatar = user.avatar ?? ''
      return user
    })
    return users
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.getUserById(id)
    return user
  }

  async emailPasswordLogin(email: string, password: string, arbitary = false): Promise<PairJWT> {
    const user = await this.userRepo.getUserByEmail(email)
    if (!user) {
      throw new ServerNotFound('User not found')
    }

    if (!arbitary) {
      if (!Password.verifyPassword(password, user.password)) {
        throw new ServerBadRequest('Password not match')
      }
    }

    delete user.password

    const userJwt = new AppJwtPayload()

    userJwt.id = user.id
    userJwt.acl = []
    userJwt.role = user.role as string[]
    userJwt.avatar = user.avatar
    userJwt.email = user.email
    userJwt.is_active = user.status

    const employee = await this.employeeRepo.getEmployeeByUserId(user.id)
    if (employee.length > 0) {
      userJwt.employee_name = employee[0].full_name
      userJwt.employee_id = employee[0].id
      userJwt.pass_photo = employee[0].pass_photo_path[0]
    }

    const authToken = await JwtLib.generateJwtToken(userJwt, this.authTTl)

    await this.cacheClient.cacheClient.set(`session:${user.id}`, authToken)

    delete userJwt.email
    delete userJwt.employee_name
    delete userJwt.avatar
    delete userJwt.acl
    delete userJwt.role
    const refreshToken = await JwtLib.generateJwtToken(userJwt, this.refreshTTl)

    return {
      auth_token: authToken,
      refresh_token: refreshToken,
    } as PairJWT
  }

  async refreshSessionJwt(refreshToken: string): Promise<PairJWT> {
    // validate token
    const jwt = await JwtLib.decodeJwtToken(refreshToken)
    if (!jwt) {
      throw new ServerUnauthorized('Refresh token failed')
    }

    const user = await this.userRepo.getUserById(jwt.id)
    delete user.password

    const userJwt = new AppJwtPayload()

    userJwt.id = user.id
    userJwt.acl = []
    userJwt.role = user.role as string[]
    userJwt.avatar = user.avatar
    userJwt.email = user.email
    userJwt.is_active = user.status

    const employee = await this.employeeRepo.getEmployeeByUserId(user.id)
    if (employee.length > 0) {
      userJwt.employee_name = employee[0].full_name
      userJwt.employee_id = employee[0].id
      userJwt.pass_photo = employee[0].pass_photo_path[0]
    }

    const authToken = await JwtLib.generateJwtToken(userJwt, this.authTTl)
    await this.cacheClient.cacheClient.set(`session:${user.id}`, authToken)

    delete userJwt.email
    delete userJwt.employee_name
    delete userJwt.avatar
    delete userJwt.acl
    delete userJwt.role
    const rt = await JwtLib.generateJwtToken(userJwt, this.refreshTTl)

    return {
      auth_token: authToken,
      refresh_token: rt,
    } as PairJWT
  }

  async createUser(email: string, password: string, avatar = '', role: string): Promise<User> {
    const hashedPassword = Password.createPassword(password)
    const user = await this.userRepo.createUser({
      email: email,
      password: hashedPassword,
      avatar: avatar,
      role: role,
      status: true,
    } as Prisma.usersCreateInput)

    return user
  }

  async updateUserByID(id: string, email: string, role: string[], status: boolean): Promise<User> {
    const user = await this.userRepo.updateUser({
      where: { id: id },
      data: { email: email, acl: [], role: role, status: status },
    })

    // if set as deactivated used delete session also
    await this.cacheClient.cacheClient.del(`session:${id}`)

    return user
  }

  async updatePasswordByID(id: string, password: string): Promise<User> {
    const hashedPassword = Password.createPassword(password)
    const user = await this.userRepo.updateUser({
      where: { id: id },
      data: { password: hashedPassword },
    })

    return user
  }

  async deleteUserByID(id: string): Promise<User> {
    const employee = await this.employeeRepo.getEmployeeByUserId(id)
    if (employee.length == 0) {
      throw new ServerNotFound('Employee Not Found')
    }
    console.log(employee)

    await this.employeeRepo.softDeleteEmployee(employee[0].id, `${employee[0].full_name} (Deleted)`)
    await this.cacheClient.cacheClient.del(`session:${id}`)

    return await this.userRepo.deleteUserById(id)
  }

  async exchangeGoogleToken(code: string): Promise<PairJWT> {
    const token = await this.userRepo.exchangeGoogleToken(code, process.env['GOOGLE_REDIRECT_URI'])
    const gUser = await this.userRepo.getGoogleUserInfo(token.access_token)

    const emails = process.env['ALLOWED_EMAIL_DOMAINS'].split('|')

    if (!emails.includes(gUser.email.split('@')[1])) {
      throw new ServerUnauthorized('Forbidden Email domain')
    }

    let registeredUser = await this.userRepo.getUserByEmail(gUser.email)
    if (!registeredUser) {
      registeredUser = await this.createUser(gUser.email, faker.random.alphaNumeric(10), gUser.picture, null)
      registeredUser.status = true
    }

    // update image avatar from google
    await this.userRepo.updateUser({
      where: { id: registeredUser.id },
      data: { avatar: gUser.picture },
    })

    delete registeredUser.password

    const jwtPayload = registeredUser as AppJwtPayload
    jwtPayload.is_active = registeredUser.status

    // get employee name if exist
    const employee = await this.employeeRepo.getEmployeeByUserId(jwtPayload.id)
    if (employee.length > 0) {
      jwtPayload.employee_name = employee[0].full_name
      jwtPayload.employee_id = employee[0].id
      jwtPayload.pass_photo = employee[0].pass_photo_path[0]
    }
    const authToken = await JwtLib.generateJwtToken(jwtPayload, this.authTTl)
    await this.cacheClient.cacheClient.set(`session:${jwtPayload.id}`, authToken)

    delete registeredUser.email
    delete registeredUser.acl
    delete registeredUser.avatar
    const jwtPayloadRefresh = registeredUser as AppJwtPayload
    const refreshToken = await JwtLib.generateJwtToken(jwtPayloadRefresh, this.refreshTTl)

    return {
      auth_token: authToken,
      refresh_token: refreshToken,
    } as PairJWT
  }

  async changePassword(email: string, oldPassword: string, newPassword: string): Promise<boolean> {
    console.log('[CHANGE PASSWORD] SERVICE email:', email)

    const user = await this.userRepo.getUserByEmail(email)

    console.log('[CHANGE PASSWORD] USER FOUND:', !!user)
    console.log('[CHANGE PASSWORD] USER ID:', user?.id)

    if (!user) {
      throw new ServerNotFound('User tidak ditemukan')
    }

    const passwordValid = Password.verifyPassword(oldPassword, user.password)

    console.log('[CHANGE PASSWORD] OLD PASSWORD VALID:', passwordValid)

    if (!passwordValid) {
      throw new ServerBadRequest('Password lama tidak sesuai')
    }

    const hashed = Password.createPassword(newPassword)

    await this.userRepo.updateUserByID(user.id, {
      password: hashed,
    })

    console.log('[CHANGE PASSWORD] DATABASE UPDATED:', user.id)

    await this.cacheClient.cacheClient.del(`session:${user.id}`)

    console.log('[CHANGE PASSWORD] SESSION DELETED:', user.id)

    return true
  }
}
