import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { Request, Response } from 'express'

import { UserService } from '@server/services/user.service'
import { HttpBaseResponse } from '@server/types/base.response.dto'
import {
  CreateUserRequest,
  CreateUserResponse,
  CreateUserResponseDetail,
  PairJWTResponse,
  UpdateUserPassword,
  UpdateUserRequest,
  UserResponse as User,
  UserListResponse,
  UserLoginRequest,
  ForgotPasswordDto,
  CompleteForgotPasswordDto,
  ChangePasswordDto,
} from '@server/types/user.dto'

import { BaseLanguageDefinition, LD } from '@/i18n/base.language.definition'
import { Language } from '@/i18n/language'
import { ApplicationContext } from '@server/common/acl.gate'
import { ServerBadRequest } from '@/shared/server.errors'

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name)
  private static readonly apiTags = 'identity'
  private lang = Language.use(new BaseLanguageDefinition())
  constructor(private readonly userService: UserService) {}

  @Get('/v1/auth/refresh')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'refresh auth' })
  @ApiExtraModels(User)
  @ApiQuery({ name: 'refresh_token', required: true, example: 'xxx.xxx.xxx' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PairJWTResponse })
  async refreshAuth(
    @Query('refresh_token') token,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const jwt = await this.userService.refreshSessionJwt(token)

    return response.status(HttpStatus.OK).send(new PairJWTResponse(this.lang.lang(LD.RESPONSE_OK), jwt))
  }

  @Get('/v1/users')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'get users list' })
  @ApiExtraModels(User)
  // @ApiQuery({ name: 'page', required: false, example: 1 })
  // @ApiQuery({ name: 'per_page', required: false, example: 10 })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: UserListResponse })
  @ApiBearerAuth()
  async getUsers(
    @Query('page') page = '1',
    @Query('per_page') per_page = '10',
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const ctx = ApplicationContext.getContext(request)
    const users = await this.userService.getUsers(ctx)

    return response
      .status(HttpStatus.OK)
      .send(new UserListResponse(this.lang.lang(LD.RESPONSE_READ, ['User']), users as User[]))
  }

  @Post('/v1/users')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'create new users' })
  @ApiExtraModels(User)
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiCreatedResponse({ type: CreateUserResponse })
  @ApiBearerAuth()
  async createUsers(
    @Body() user: CreateUserRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const ctx = ApplicationContext.getContext(request)

    const userCreated = await this.userService.createUser(user.email, user.password, '', user.role)
    return response
      .status(HttpStatus.CREATED)
      .send(
        new CreateUserResponse(this.lang.lang(LD.RESPONSE_CREATED, ['User']), userCreated as CreateUserResponseDetail),
      )
  }

  @Post('/v1/auth/login')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'auth user login email password' })
  @ApiExtraModels(User)
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PairJWTResponse })
  async loginUser(@Body() user: UserLoginRequest, @Res() response: Response): Promise<Response> {
    const pairToken = await this.userService.emailPasswordLogin(user.email, user.password)
    console.log('API NORMAL', pairToken)

    return response.status(HttpStatus.OK).send(new PairJWTResponse(this.lang.lang(LD.RESPONSE_OK), pairToken))
  }

  @Post('/v1/auth/login-arbitary')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'auth user arbitary' })
  @ApiExtraModels(User)
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: PairJWTResponse })
  async loginUserArbitary(@Body() user: UserLoginRequest, @Res() response: Response): Promise<Response> {
    // if (process.env.NODE_ENV == 'testing') {
    //   throw new ForbiddenException()
    // }

    const pairToken = await this.userService.emailPasswordLogin(user.email, user.password, true)
    console.log('API ARBITARY', pairToken)

    return response.status(HttpStatus.OK).send(new PairJWTResponse(this.lang.lang(LD.RESPONSE_OK), pairToken))
  }

  @Put('/v1/users/:id')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'update user by id' })
  @ApiExtraModels(User)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateUsers(
    @Param('id') id,
    @Body() user: UpdateUserRequest,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    const claims = JSON.parse(request.headers.authorization)
    if ((claims['role'] as string[]).indexOf('superadmin') < 0) {
      throw new ServerBadRequest('Forbidden Access Only for Superadmin')
    }

    await this.userService.updateUserByID(id, user.email, user.role, user.status)
    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse(this.lang.lang(LD.RESPONSE_UPDATED, ['User']), null))
  }

  @Put('/v1/users/:id/password')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'update user password by id' })
  @ApiExtraModels(User)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async updateUserpassword(
    @Param('id') id,
    @Body() user: UpdateUserPassword,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    await this.userService.updatePasswordByID(id, user.password)
    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse(this.lang.lang(LD.RESPONSE_UPDATED, ['User Password']), null))
  }

  @Delete('/v1/users/:id')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'delete user by id' })
  @ApiExtraModels(User)
  @ApiParam({ name: 'id', type: 'string' })
  @ApiInternalServerErrorResponse({ type: HttpBaseResponse })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  @ApiBearerAuth()
  async deleteUserById(@Param('id') id, @Req() request: Request, @Res() response: Response): Promise<Response> {
    await this.userService.deleteUserByID(id)
    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse(this.lang.lang(LD.RESPONSE_DELETED, ['User']), null))
  }

  @Get('/v1/auth/oauth/google/callback')
  async oauthGoogleCallback(@Req() request: Request, @Res() response: Response): Promise<void> {
    const code = request.query['code'] as string
    const state = request.query['state'] as string
    try {
      if (state != 'simpuskapa') {
        return response.redirect(`${process.env['GOOGLE_OAUTH_REDIRECT_FE']}?error=Unauthorized oauth state`)
      }

      const jwt = await this.userService.exchangeGoogleToken(code)

      return response.redirect(
        `${process.env['GOOGLE_OAUTH_REDIRECT_FE']}?auth_token=${jwt.auth_token}&refresh_token=${jwt.refresh_token}`,
      )
    } catch (e) {
      return response.redirect(`${process.env['GOOGLE_OAUTH_REDIRECT_FE']}?error=Oauth Google Failed ${e}`)
    }
  }

  @Get('/v1/auth/oauth/google')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'oauth google' })
  async oauthGoogleInitiation(@Res() response: Response): Promise<void> {
    const clientId = process.env['GOOGLE_OAUTH_CLIENT_ID']
    const redirectUri = process.env['GOOGLE_REDIRECT_URI']

    const oauthRedirect = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/userinfo.profile+https://www.googleapis.com/auth/userinfo.email&state=simpuskapa`
    return response.redirect(oauthRedirect)
  }
  @ApiTags(UserController.apiTags)
  @Post('/v1/users/forgot-password')
  @ApiOperation({ summary: 'forgot password' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.userService.forgotPassword(body.email)
  }

  @Put('/change-password')
  @ApiBearerAuth()
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<Response> {
    console.log('[CHANGE PASSWORD] REQUEST')
    console.log('[CHANGE PASSWORD] email:', body.email)
    console.log('[CHANGE PASSWORD] old_password length:', body.old_password?.length)
    console.log('[CHANGE PASSWORD] new_password length:', body.new_password?.length)

    await this.userService.changePassword(body.email, body.old_password, body.new_password)

    console.log('[CHANGE PASSWORD] SUCCESS:', body.email)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse(this.lang.lang(LD.RESPONSE_UPDATED, ['Password']), null))
  }

  @Get('/me')
  @ApiBearerAuth()
  async profile(@Req() request: Request) {
    const claims = JSON.parse(request.headers.authorization)

    const user = await this.userService.getUserById(claims.id)

    return {
      id: user.id,
      email: user.email,
    }
  }

  @Put('/complete-forgot-password')
  @ApiTags(UserController.apiTags)
  @ApiOperation({ summary: 'complete forgot password' })
  @ApiBadRequestResponse({ type: HttpBaseResponse })
  @ApiOkResponse({ type: HttpBaseResponse })
  async completeForgotPassword(@Body() body: CompleteForgotPasswordDto, @Res() response: Response): Promise<Response> {
    await this.userService.completeForgotPassword(body.email, body.old_password, body.new_password)

    return response
      .status(HttpStatus.OK)
      .send(new HttpBaseResponse(this.lang.lang(LD.RESPONSE_UPDATED, ['Password']), null))
  }
}
