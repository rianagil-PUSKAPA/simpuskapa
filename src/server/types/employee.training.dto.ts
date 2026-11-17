import { ApiProperty } from '@nestjs/swagger'
import { HttpBaseResponse } from './base.response.dto'

export class EmployeeTraining {
  @ApiProperty()
  id?: string
  @ApiProperty()
  employee_id: string
  @ApiProperty()
  training_name: string
  @ApiProperty({ type: 'string' })
  training_date?: string | Date
  @ApiProperty()
  organizer: string
  @ApiProperty()
  source_fund: string
  @ApiProperty()
  certificate_path?: string[]
}

export class EmployeeTrainingListDataResponse extends HttpBaseResponse<EmployeeTraining[]> {
  @ApiProperty({ type: [EmployeeTraining] })
  data: EmployeeTraining[]
}
