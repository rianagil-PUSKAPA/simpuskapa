import { ApiProperty } from '@nestjs/swagger'
import { HttpBaseResponse } from './base.response.dto'

class EmployeSubDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  full_name?: string
  @ApiProperty()
  pass_photo?: string
  @ApiProperty()
  avatar?: string[]
  @ApiProperty()
  email?: string
}

export class EmployeeContract {
  @ApiProperty()
  id: string
  @ApiProperty()
  contract_number?: string
  @ApiProperty()
  supervisor_id: string
  @ApiProperty()
  employee_id: string
  @ApiProperty()
  contract_name: string
  @ApiProperty()
  position: string
  @ApiProperty()
  department?: string
  @ApiProperty()
  emp_status?: string
  @ApiProperty()
  spv_name?: string
  @ApiProperty()
  spv_avatar?: string
  @ApiProperty({ type: 'string' })
  contract_started: Date | string
  @ApiProperty({ type: 'string' })
  contract_ended?: Date | string
  @ApiProperty()
  doc_path?: string[]
  @ApiProperty({ type: 'string' })
  created_at?: Date | string
  @ApiProperty({ type: 'string' })
  updated_at?: Date | string
  @ApiProperty({ type: 'string' })
  deleted_at?: Date | string
  @ApiProperty()
  emp_detail?: EmployeSubDetail
}

export class CreateEmployeeContractRequest {
  @ApiProperty()
  id: string
  @ApiProperty()
  contract_number?: string
  @ApiProperty()
  supervisor_id?: string
  @ApiProperty()
  employee_id?: string
  @ApiProperty()
  contract_name?: string
  @ApiProperty()
  position?: string
  @ApiProperty()
  department?: string
  @ApiProperty()
  emp_status?: string
  @ApiProperty({ type: 'string' })
  contract_started: Date | string
  @ApiProperty({ type: 'string' })
  contract_ended?: Date | string
  @ApiProperty()
  doc_path?: string[]
}

export class EmployeeContractListDataResponse extends HttpBaseResponse<EmployeeContract[]> {
  @ApiProperty({ type: [EmployeeContract] })
  data: EmployeeContract[]
}
