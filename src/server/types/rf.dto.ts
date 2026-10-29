import { RequisitionFormEnum } from '@/shared/rf.type'
import { ApiProperty } from '@nestjs/swagger'
import { HttpBaseResponse } from './base.response.dto'
import { ActivityBudgetList, BudgetProgramProjectDetail } from './program.dto'

export class RFActionBy {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  pass_photo?: string[]
}

export class EmployeeSimpleDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  pass_photo?: string[]
}

export class RFActivity {
  @ApiProperty()
  id?: string
  @ApiProperty()
  budget_ids?: string
}

export class CreateProcurementRfApiRequest {
  @ApiProperty()
  deadline?: Date | string
  @ApiProperty()
  action_by?: string
  @ApiProperty()
  about_request?: string
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]
}

export class CreateStaffCostRfApiRequest {
  @ApiProperty()
  deadline?: Date | string
  @ApiProperty()
  action_by?: string
  @ApiProperty()
  about_request?: string
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]
  @ApiProperty()
  staff_id?: string
}

export class AdditionalData {
  @ApiProperty()
  key?: string
  @ApiProperty()
  value?: string
}

export class TravelRfDetail {
  @ApiProperty({ type: RFActionBy })
  who_traveling?: RFActionBy
  @ApiProperty()
  employee_id?: string
  @ApiProperty()
  date_start?: Date | string
  @ApiProperty()
  date_end?: Date | string
  @ApiProperty()
  travel_organizer?: string
  @ApiProperty()
  additional_data?: Map<string, string> | string
}

export class CreateTravelRfApiRequest {
  @ApiProperty()
  deadline?: Date | string
  @ApiProperty()
  action_by?: string
  @ApiProperty()
  about_request?: string
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]
  @ApiProperty({ type: TravelRfDetail })
  travel_detail?: TravelRfDetail
}

export class PersonalHireDetail {
  @ApiProperty()
  vendor_id?: string
  @ApiProperty()
  type_hire?: string
  @ApiProperty()
  primary_division?: string
  @ApiProperty()
  notes?: string
  @ApiProperty()
  background_docs?: string[]
  @ApiProperty()
  hire_process_docs?: string[]
  @ApiProperty()
  offer_page_docs?: string[]
  @ApiProperty()
  other_docs?: string[]
}

export class CreatePersonalHireRfApiRequest {
  @ApiProperty()
  deadline?: Date | string
  @ApiProperty()
  action_by?: string
  @ApiProperty()
  about_request?: string
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]
  @ApiProperty({ type: PersonalHireDetail })
  personal_hire_information?: PersonalHireDetail
}

export class RequisitionFormSimple {
  @ApiProperty()
  id?: string
  @ApiProperty({ type: EmployeeSimpleDetail })
  budget_controller_approval_by?: EmployeeSimpleDetail
  @ApiProperty({ type: EmployeeSimpleDetail })
  program_manager_approval_by?: EmployeeSimpleDetail
  @ApiProperty()
  project_id?: string
  @ApiProperty()
  rf_number?: string
  @ApiProperty()
  type?: string
  @ApiProperty()
  about_request?: string
  @ApiProperty()
  total_request?: string
  @ApiProperty()
  total_request_value?: number
  @ApiProperty()
  budget_controller_id?: string
  @ApiProperty()
  program_manager_approval_status?: string
  @ApiProperty()
  budget_controller_approval_status?: string
  @ApiProperty()
  program_name?: string
  @ApiProperty()
  partner_name?: string
  @ApiProperty()
  program_manager_id?: string
  @ApiProperty()
  program_id?: string
  @ApiProperty()
  action_by_employee_id?: string
  @ApiProperty()
  action_by_employee_ack_status?: string
  @ApiProperty({ type: RFActionBy })
  action_by?: RFActionBy
  @ApiProperty({ type: EmployeeSimpleDetail })
  requested_by?: EmployeeSimpleDetail
  @ApiProperty()
  closed_at?: string
  @ApiProperty({ type: EmployeeSimpleDetail })
  closed_by?: EmployeeSimpleDetail
}

export class RFListResponse extends HttpBaseResponse<RequisitionFormSimple[]> {
  @ApiProperty({ type: [RequisitionFormSimple] })
  data: RequisitionFormSimple[]
}

export class RequisitionFormDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  number?: string
  @ApiProperty()
  requested_at?: Date | string
  @ApiProperty({ type: EmployeeSimpleDetail })
  requested_by?: EmployeeSimpleDetail
  @ApiProperty({ type: EmployeeSimpleDetail })
  staff_detail?: EmployeeSimpleDetail
  @ApiProperty()
  deadline?: string | Date
  @ApiProperty({ type: RFActionBy })
  action_by?: RFActionBy
  @ApiProperty()
  about_request?: string
  @ApiProperty({
    enum: [
      RequisitionFormEnum.PERSONAL_HIRE,
      RequisitionFormEnum.PROCUREMENT,
      RequisitionFormEnum.TRAVEL,
      RequisitionFormEnum.STAFF_COST,
    ],
  })
  rf_type?: string
  @ApiProperty()
  rf_attributes?: TravelRfDetail | PersonalHireDetail | string
  @ApiProperty({ type: [BudgetProgramProjectDetail] })
  projects?: BudgetProgramProjectDetail[]
  @ApiProperty()
  program_manager_approval_status?: string
  @ApiProperty()
  program_manager_approval_at?: Date | string

  @ApiProperty()
  budget_controller_approval_status?: string
  @ApiProperty()
  budget_controller_approval_at?: Date | string

  @ApiProperty()
  action_by_notified_status?: boolean
  @ApiProperty()
  action_by_notified_at?: Date | string
  @ApiProperty()
  closed_at?: string
  @ApiProperty({ type: EmployeeSimpleDetail })
  closed_by?: EmployeeSimpleDetail
  @ApiProperty()
  has_retur?: boolean
}

export class RFDetailResponse extends HttpBaseResponse<RequisitionFormDetail> {
  @ApiProperty({ type: RequisitionFormDetail })
  data: RequisitionFormDetail
}

export class RFApprovalStatusRequest {
  @ApiProperty({
    enum: ['program_manager_approval_status', 'budget_controller_approval_status'],
  })
  approved_by?: string
  @ApiProperty({ enum: ['success', 'pending', 'rejected'] })
  status?: string
  @ApiProperty()
  rejection_note?: string
}

export class RFApprovalDataForList {
  @ApiProperty()
  id?: string
  @ApiProperty()
  partner?: string
  @ApiProperty()
  type?: string
  @ApiProperty()
  about_request?: string
  @ApiProperty()
  total_request?: string
  @ApiProperty()
  total_request_value?: number
}

export class RFApprovalListResponse extends HttpBaseResponse<RFApprovalDataForList[]> {
  @ApiProperty({ type: [RFApprovalDataForList] })
  data: RFApprovalDataForList[]
}
