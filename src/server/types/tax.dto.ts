import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'

export enum TaxNationality {
  WNI = 'WNI',
  WNA = 'WNA',
}

export class TaxParam {
  @ApiProperty()
  is_organization?: boolean
  @ApiProperty({ type: TaxNationality })
  nationality?: TaxNationality | string
  @ApiProperty()
  with_ppn?: boolean
  @ApiProperty()
  with_npwp?: boolean
}
