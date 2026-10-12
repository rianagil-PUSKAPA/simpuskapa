import { ApiProperty } from '@nestjs/swagger'

import { HttpBaseResponse } from '@server/types/base.response.dto'
import { Partner } from './partner.dto'
import { VendorCategoryInformation } from './vendor.dto'

export class EmployeeSimpleDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  pass_photo?: string[]
}

export class ProgramReceivedFundDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  source?: string
  @ApiProperty()
  amount?: number
  @ApiProperty()
  documents?: string[]
  @ApiProperty()
  notes?: string
  @ApiProperty()
  created_at?: string
  @ApiProperty({ type: EmployeeSimpleDetail })
  created_by?: EmployeeSimpleDetail
}

export class ProgramReceivedFundList extends HttpBaseResponse<ProgramReceivedFundDetail[]> {
  @ApiProperty({ type: [ProgramReceivedFundDetail] })
  data: ProgramReceivedFundDetail[]
}

export class ProgramReceivedFundRequest {
  @ApiProperty()
  amount?: number
  @ApiProperty()
  documents?: string[]
  @ApiProperty()
  source?: string
  @ApiProperty()
  notes?: string
}

export class ProgramReviseBudgetDocs {
  @ApiProperty()
  revise_doc_path?: string[]
  @ApiProperty()
  revise_note?: string
  @ApiProperty()
  revise_amount?: number
}

export class ProgramTimeLineDetail {
  @ApiProperty()
  month?: number
  @ApiProperty()
  year?: number
}

export class DetailUserInfo {
  @ApiProperty()
  id?: string
  @ApiProperty()
  avatar?: string[]
  @ApiProperty()
  full_name?: string
  @ApiProperty()
  pass_photo_path?: string[]
}

export class ProgramTimeLine {
  @ApiProperty()
  start_date?: ProgramTimeLineDetail
  @ApiProperty()
  end_date?: ProgramTimeLineDetail
}

export class ProgramContract {
  @ApiProperty()
  contract_number?: string
  @ApiProperty()
  contract_path?: string[]
}

export class ProgramCreateRequest {
  @ApiProperty()
  id?: string
  @ApiProperty()
  code?: string
  @ApiProperty()
  partner_code?: string
  @ApiProperty()
  program_name?: string
  @ApiProperty()
  program_description?: string
  @ApiProperty()
  currency?: string
  @ApiProperty()
  estimated_budget?: number
  @ApiProperty()
  grant_manager?: string
  @ApiProperty()
  program_manager?: string
  @ApiProperty()
  budget_controller?: string
  @ApiProperty()
  program_officer?: string
  @ApiProperty()
  timeline?: ProgramTimeLine
  @ApiProperty()
  contract?: ProgramContract
  @ApiProperty()
  finance_progress?: number
  @ApiProperty()
  form_state?: string
  @ApiProperty()
  form_progress?: number
  @ApiProperty({ enum: ['PROGRAM', 'INTERNAL'] })
  program_ownership_type?: string
}

export class ProgramBudgetRevision {
  @ApiProperty()
  submitted_at?: string
  @ApiProperty()
  approved_at?: string
  @ApiProperty()
  path?: string
}

export class Program {
  @ApiProperty()
  id?: string
  @ApiProperty()
  code?: string
  @ApiProperty()
  partner_code?: string
  @ApiProperty()
  program_name?: string
  @ApiProperty()
  program_description?: string
  @ApiProperty()
  currency?: string
  @ApiProperty()
  estimated_budget?: number
  @ApiProperty()
  grant_manager?: string
  @ApiProperty()
  program_manager?: string
  @ApiProperty()
  program_officer?: string
  @ApiProperty()
  timeline?: ProgramTimeLine
  @ApiProperty()
  contract?: ProgramContract
  @ApiProperty()
  finance_progress?: number
  @ApiProperty({
    enum: ['success', 'pending', 'rejected', 'drafted', 'revision', 'cancelled'],
  })
  approval?: string
  @ApiProperty()
  submitted_at?: string
  @ApiProperty()
  approved_at?: string
  @ApiProperty({ type: [ProgramBudgetRevision] })
  snapshoot_path?: ProgramBudgetRevision[]
  @ApiProperty({ enum: ['PROGRAM', 'INTERNAL'] })
  program_ownership_type?: string
}

export class HeadFinanceProfile {
  @ApiProperty()
  name?: string
  @ApiProperty()
  employee_pass_photo?: string
}

export class EmployeeProfile {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  employee_pass_photo?: string
}

export class ProgramDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  partner?: Partner
  @ApiProperty()
  program_name?: string
  @ApiProperty()
  program_code?: string
  @ApiProperty()
  program_description?: string
  @ApiProperty()
  estimated_budget_value?: number
  @ApiProperty()
  estimated_budget?: string
  @ApiProperty()
  currency?: string
  @ApiProperty()
  grant_manager?: DetailUserInfo
  @ApiProperty()
  revise_amount?: number
  @ApiProperty()
  program_manager?: DetailUserInfo
  @ApiProperty()
  program_officer?: DetailUserInfo
  @ApiProperty()
  budget_controller?: DetailUserInfo
  @ApiProperty()
  timeline?: ProgramTimeLine
  @ApiProperty()
  contract?: ProgramContract
  @ApiProperty()
  finance_progress?: number
  @ApiProperty({
    enum: ['success', 'pending', 'rejected', 'drafted', 'revision', 'cancelled'],
  })
  approval?: string
  @ApiProperty()
  approval_note?: string
  @ApiProperty()
  submitted_at?: string
  @ApiProperty()
  approved_at?: string
  @ApiProperty({ type: [ProgramBudgetRevision] })
  snapshoot_path?: ProgramBudgetRevision[]
  @ApiProperty({ type: HeadFinanceProfile })
  head_finance?: HeadFinanceProfile
  @ApiProperty({ type: HeadFinanceProfile })
  head_operation?: HeadFinanceProfile
  @ApiProperty({ type: EmployeeProfile })
  submitted_by?: EmployeeProfile
  @ApiProperty({ type: EmployeeProfile })
  created_by?: EmployeeProfile
  @ApiProperty()
  revise_approval_doc?: string[]
  @ApiProperty()
  budget_revision_note?: string
  @ApiProperty()
  budget_revision_requested_at?: string
  @ApiProperty()
  form_state?: string
  @ApiProperty()
  form_progress?: number
  @ApiProperty()
  program_ownership_type?: string
}

export class ProgramListData {
  @ApiProperty()
  id?: string
  @ApiProperty()
  revision_path?: string[]
  @ApiProperty()
  program_name?: string
  @ApiProperty()
  partner_name?: string
  @ApiProperty()
  grant_manager?: DetailUserInfo
  @ApiProperty()
  program_manager?: DetailUserInfo
  @ApiProperty()
  budget_controller?: DetailUserInfo
  @ApiProperty()
  finance_progress?: number
  @ApiProperty()
  currency?: string
  @ApiProperty()
  total_budget_value?: number
  @ApiProperty()
  total_expenses_value?: number
  @ApiProperty()
  total_budget?: string
  @ApiProperty()
  total_expenses?: string
  @ApiProperty()
  approval?: string
  @ApiProperty()
  form_state?: string
  @ApiProperty()
  form_progress?: number
  @ApiProperty()
  program_ownership_type?: string
  @ApiProperty({ type: EmployeeProfile })
  created_by?: EmployeeProfile
}

export class ProgramListResponse extends HttpBaseResponse<ProgramListData[]> {
  @ApiProperty({ type: [ProgramListData] })
  data: ProgramListData[]
  @ApiProperty()
  total_data: number
}

export class ProgramDetailResponse extends HttpBaseResponse<ProgramDetail> {
  @ApiProperty({ type: ProgramDetail })
  data: ProgramDetail
}

export class ActivityBudgetList {
  @ApiProperty()
  id?: string
  @ApiProperty()
  ordering_seq?: number
  @ApiProperty()
  code?: string
  @ApiProperty()
  description?: string
  @ApiProperty({
    type: VendorCategoryInformation,
    description: ' use this to get category info from budget',
  })
  vendor_category_information?: VendorCategoryInformation
  @ApiProperty({ description: 'use thid to set category on budget' })
  vendor_category_id?: string
  @ApiProperty()
  qty?: number
  @ApiProperty()
  unit?: string
  @ApiProperty()
  pkg_qty?: number
  @ApiProperty()
  pkg_unit?: string
  @ApiProperty()
  unit_cost_value?: number
  @ApiProperty()
  unit_cost?: string
  @ApiProperty()
  recommended_vendor?: string
  @ApiProperty()
  additional_data?: string
  @ApiProperty()
  action_by?: string
  @ApiProperty()
  advance_payment_total?: number
  @ApiProperty()
  tax_amount?: number
}

export class BudgetActivity {
  @ApiProperty()
  id?: string
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]
}

export class BudgetProject {
  @ApiProperty()
  id?: string
  @ApiProperty({ type: [BudgetActivity] })
  activities?: BudgetActivity[]
}

export class Budget {
  @ApiProperty()
  revise_approval_doc?: string[]
  @ApiProperty({ type: [BudgetProject] })
  projects?: BudgetProject[]
}

// ----------------------------------

export class BudgetProgramProjectActivity {
  @ApiProperty()
  id?: string
  @ApiProperty()
  ordering_seq?: number
  @ApiProperty()
  code?: string
  @ApiProperty()
  description?: string
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]
}

export class BudgetProgramProjectDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  code?: string
  @ApiProperty()
  ordering_seq?: number
  @ApiProperty()
  description?: string
  @ApiProperty({ type: [BudgetProgramProjectActivity] })
  activities?: BudgetProgramProjectActivity[]
}

export class ProgramPerdiemTravelExpensePercentages {
  @ApiProperty()
  breakfast?: number
  @ApiProperty()
  lunch?: number
  @ApiProperty()
  dinner?: number
  @ApiProperty()
  non_overnight?: number
  @ApiProperty()
  travel_days?: number
}

export class ProgramPerdiemSettings {
  @ApiProperty()
  base_value_normal?: number
  @ApiProperty()
  base_value_remote_area?: number
  @ApiProperty()
  base_value_overseas?: number

  @ApiProperty()
  travel_perdiem?: number
  @ApiProperty()
  activity_perdiem?: number
  @ApiProperty()
  note?: string
  @ApiProperty({ type: ProgramPerdiemTravelExpensePercentages })
  travel_expense_percentages?: ProgramPerdiemTravelExpensePercentages
}

export class BudgetProgramProjectListResponse {
  @ApiProperty({ type: [BudgetProgramProjectDetail] })
  projects?: BudgetProgramProjectDetail[]
}

export class BudgetProgramListResponse extends HttpBaseResponse<BudgetProgramProjectListResponse> {
  @ApiProperty({ type: BudgetProgramProjectListResponse })
  data: BudgetProgramProjectListResponse
}

export class ProgramPerdiemSettingsResponse extends HttpBaseResponse<ProgramPerdiemSettings> {
  @ApiProperty({ type: ProgramPerdiemSettings })
  data: ProgramPerdiemSettings
}
