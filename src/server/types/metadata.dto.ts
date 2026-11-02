import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'

export class MetadataTotals {
  @ApiProperty()
  time_off_requested: number
  @ApiProperty()
  need_approval_timeoff?: number
  @ApiProperty()
  need_approval_program_budget?: number
  @ApiProperty()
  need_approval_rf?: number
  @ApiProperty()
  need_approval_pr?: number
}

export class MetadataDashboard {
  @ApiProperty()
  need_action_rf?: number
  @ApiProperty()
  need_action_pr?: number
  @ApiProperty()
  need_approval_timeoff?: number
  @ApiProperty()
  need_approval_program_budget?: number
  @ApiProperty()
  need_approval_rf?: number
  @ApiProperty()
  need_approval_pr?: number
}

export class MetadaataTotalResponse extends HttpBaseResponse<MetadataTotals> {
  @ApiProperty()
  data: MetadataTotals
}

export class EmployeeProfile {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  employee_pass_photo?: string[]
}

export class Log {
  @ApiProperty()
  message?: string
  @ApiProperty({ type: EmployeeProfile })
  user?: EmployeeProfile
  @ApiProperty()
  created_at?: string
  @ApiProperty()
  body?: string
}

export class LogsListResponse extends HttpBaseResponse<Log[]> {
  @ApiProperty({ type: [Log] })
  data: Log[]
}

export class DashboardFinance {
  @ApiProperty()
  total_ongoing?: number
  @ApiProperty()
  total_payment_request?: number
  @ApiProperty()
  pending_payment_request?: number

  @ApiProperty()
  total_budget_allocation_amount?: number
  @ApiProperty()
  total_remaining_budget_amount?: number
  @ApiProperty()
  total_paid_payment_amount?: number
  @ApiProperty()
  total_pending_requested_amount?: number
}

export class FinanceDashboardResponse extends HttpBaseResponse<DashboardFinance> {
  @ApiProperty({ type: DashboardFinance })
  data: DashboardFinance
}
