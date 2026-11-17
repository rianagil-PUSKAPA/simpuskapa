import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'

export class AclKeysResponse extends HttpBaseResponse<string[]> {
  @ApiProperty({ type: [String] })
  data: string[]
}

export class CreateAclTemplateRequest {
  @ApiProperty()
  name: string

  @ApiProperty()
  acl: string[]
}

export class AclTemplate {
  @ApiProperty()
  role_name: string

  @ApiProperty()
  acl: string[]
}

export class AclTemplateResponse extends HttpBaseResponse<AclTemplate[]> {
  @ApiProperty({ type: [AclTemplate] })
  data: AclTemplate[]
}
