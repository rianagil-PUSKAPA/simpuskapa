import { ApiProperty } from '@nestjs/swagger'
import { DocType } from '@prisma/client'
import { HttpBaseResponse } from './base.response.dto'
import { EmployeeContract } from './employee.contract.dto'
import { Employee } from './employee.dto'

export class EmployeePerformanceCreateRequest {
  @ApiProperty()
  file?: string[]
  @ApiProperty()
  year?: number
  @ApiProperty({ enum: ['end-year', 'planning', 'mid-year'] })
  doc_type?: string
}

export class EmployeePerformance {
  @ApiProperty()
  id: string
  @ApiProperty()
  employee_id: string
  @ApiProperty()
  year: number
  @ApiProperty()
  doc_path?: string[]
  @ApiProperty()
  doc_type: DocType
  @ApiProperty({ type: 'string' })
  created_at: Date | string
  @ApiProperty({ type: 'string' })
  updated_at: Date | string
  @ApiProperty({ type: 'string' })
  deleted_at: Date | string | null
  @ApiProperty({ type: Employee })
  employee?: Employee
  @ApiProperty({ type: [EmployeeContract] })
  employee_contracts?: EmployeeContract[]
}

class PerfFileDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  path?: string
}

export class EmployeePerformanceAggregated {
  @ApiProperty()
  id?: string
  @ApiProperty()
  year: number
  @ApiProperty({ type: PerfFileDetail })
  planning?: PerfFileDetail
  @ApiProperty({ type: PerfFileDetail })
  mid_year?: PerfFileDetail
  @ApiProperty({ type: PerfFileDetail })
  end_year?: PerfFileDetail
  @ApiProperty()
  employee_name?: string
  @ApiProperty()
  employee_pass_photo?: string
  @ApiProperty()
  user_avatar?: string
  @ApiProperty()
  contract_position?: any
  @ApiProperty()
  contract_department?: any
  @ApiProperty()
  email?: string
  @ApiProperty()
  employee_id?: string
  @ApiProperty()
  spv_id?: string
  @ApiProperty()
  spv_name?: string
  @ApiProperty()
  spv_pass_photo?: string
  @ApiProperty()
  spv_avatar?: string
}

export class EmployeePerformanceDataResponse extends HttpBaseResponse<EmployeePerformance> {
  @ApiProperty({ type: EmployeePerformance })
  data: EmployeePerformance
}

export class EmployeePerformanceListDataResponse extends HttpBaseResponse<EmployeePerformanceAggregated[]> {
  @ApiProperty({ type: [EmployeePerformanceAggregated] })
  data: EmployeePerformanceAggregated[]
}
