import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'

export class Partner {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  code?: string
}

export class PartnerListResponse extends HttpBaseResponse<Partner[]> {
  @ApiProperty({ type: [Partner] })
  data: Partner[]
}

export class PartnerCode {
  @ApiProperty()
  code?: string
}

export class PartnerCreatedCodeResponse extends HttpBaseResponse<PartnerCode> {
  @ApiProperty({ type: PartnerCode })
  data: PartnerCode
}
