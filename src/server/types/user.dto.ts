import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'

export class User {
  @ApiProperty()
  id: string

  @ApiProperty()
  email: string

  @ApiProperty()
  password: string

  @ApiProperty()
  avatar: string

  @ApiProperty()
  role?: string

  @ApiProperty()
  acl: string[]

  @ApiProperty()
  status?: boolean
}

export class CreateUserRequest {
  @ApiProperty()
  email: string

  @ApiProperty()
  password: string

  @ApiProperty()
  role?: string

  @ApiProperty()
  acl: string[]

  @ApiProperty()
  status?: boolean
}

export class UpdateUserRequest {
  @ApiProperty()
  email: string

  @ApiProperty()
  role?: string[]

  @ApiProperty()
  acl: string[]

  @ApiProperty()
  status?: boolean
}

export class UpdateUserPassword {
  @ApiProperty()
  password: string
}

export class CreateUserResponseDetail extends CreateUserRequest {
  @ApiProperty()
  id: string
}

export class CreateUserResponse extends HttpBaseResponse<CreateUserResponseDetail> {
  @ApiProperty({ type: CreateUserResponseDetail })
  data: CreateUserResponseDetail
}

export class UserLoginRequest {
  @ApiProperty()
  email: string

  @ApiProperty()
  password: string
}

export class PairJWT {
  @ApiProperty()
  auth_token: string
  @ApiProperty()
  refresh_token: string
  must_change_password: boolean
}

export class UserResponse {
  @ApiProperty()
  id: string

  @ApiProperty()
  email: string

  @ApiProperty()
  avatar: string

  @ApiProperty()
  role?: string

  @ApiProperty()
  acl: string[]

  @ApiProperty()
  status?: boolean
}

export class UserListResponse extends HttpBaseResponse<UserResponse[]> {
  @ApiProperty({ type: [UserResponse] })
  data: UserResponse[]
}

export class PairJWTResponse extends HttpBaseResponse<PairJWT> {
  @ApiProperty({ type: PairJWT })
  data: PairJWT
}

export class ForgotPasswordDto {
  email: string
}

export class CompleteForgotPasswordDto {
  email: string
  old_password: string
  new_password: string
}

export class ChangePasswordDto {
  email: string
  old_password: string
  new_password: string
}
