import { ApiProperty } from '@nestjs/swagger'
import { LeaveType, TimeOffRequestStatus } from '@prisma/client'
import { extend } from 'dayjs'
import { HttpBaseResponse } from './base.response.dto'

export class ResetTimeOffRequestDto {
  @ApiProperty({ type: 'string', example: '2025-01-01 00:00:00' })
  reset_date: string
}

export class TimeOffRequestDto {
  @ApiProperty()
  id: string
  @ApiProperty()
  leave_type: LeaveType | null
  @ApiProperty({ type: 'string' })
  start_date: Date | null | string
  @ApiProperty()
  duration: number | null
  @ApiProperty({ type: 'string' })
  end_date: Date | null | string
  @ApiProperty()
  notes: string | null
  @ApiProperty()
  doc_path?: string[] | null
  @ApiProperty({
    enum: Object.getOwnPropertyNames(TimeOffRequestStatus),
    default: TimeOffRequestStatus.approved,
  })
  status: TimeOffRequestStatus | null
  @ApiProperty()
  pic_employee_id?: string | null
  @ApiProperty()
  direct_approve?: boolean
}

export class TimeOffUpdateStatusDto {
  @ApiProperty({
    enum: Object.getOwnPropertyNames(TimeOffRequestStatus),
    type: 'string',
  })
  status: TimeOffRequestStatus
}

export class TimeOff extends TimeOffRequestDto {
  @ApiProperty()
  employee_id: string
}

class EmployeeTimeoffContract {
  @ApiProperty()
  position?: string
  @ApiProperty()
  department?: string
}

class EmployeeTimeOffDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  full_name?: string
  @ApiProperty()
  pass_photo_path?: string
  @ApiProperty()
  avatar?: string
  @ApiProperty({ type: EmployeeTimeoffContract })
  contract?: EmployeeTimeoffContract
  @ApiProperty()
  email?: string
}

export class TimeOffRow extends TimeOff {
  notes: string | null
  doc_path?: string[] | null
  @ApiProperty({ type: 'string' })
  created_at: Date | string | null
  @ApiProperty({ type: 'string' })
  approved_at: Date | string | null
  @ApiProperty({ type: EmployeeTimeOffDetail })
  employee?: EmployeeTimeOffDetail
  @ApiProperty({ type: EmployeeTimeOffDetail })
  pic_employee?: EmployeeTimeOffDetail
}

export class TimeOffDetailResponse extends HttpBaseResponse<TimeOffRow> {
  @ApiProperty()
  data: TimeOffRow
}

export class SummaryDetail {
  @ApiProperty()
  title: string
  @ApiProperty()
  totalDays: number
}

export class TimeOffListDataResponse extends HttpBaseResponse<TimeOffRow[]> {
  @ApiProperty({ type: [SummaryDetail] })
  summary: SummaryDetail[]
  @ApiProperty({ type: [TimeOffRow] })
  data: TimeOffRow[]
}

export class EmployeeAnnualTimeOffRow {
  @ApiProperty()
  full_name?: string
  @ApiProperty()
  avatar?: string
  @ApiProperty()
  email?: string
  @ApiProperty()
  employee_id?: string
  @ApiProperty()
  employee_number?: string
  @ApiProperty()
  position?: string
  @ApiProperty()
  department?: string
  @ApiProperty()
  quota?: number
  @ApiProperty()
  remaining?: number
  @ApiProperty()
  used?: number
}

export class AnnualTimeOffListDataResponse extends HttpBaseResponse<EmployeeAnnualTimeOffRow[]> {
  @ApiProperty({ type: [EmployeeAnnualTimeOffRow] })
  data: EmployeeAnnualTimeOffRow[]
}
