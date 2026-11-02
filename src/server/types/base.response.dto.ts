import { ApiProperty } from '@nestjs/swagger'

export class HttpBaseResponse<TData> {
  @ApiProperty()
  message: string

  @ApiProperty()
  total_data: number

  @ApiProperty()
  data: TData
  constructor(msg: string, data: TData, total: number = 0) {
    this.message = msg
    this.data = data
    this.total_data = total
  }
}
