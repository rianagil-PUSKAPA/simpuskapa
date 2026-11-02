import { APSResult, PRTypes } from '@/shared/pr.type'
import { ApiProperty } from '@nestjs/swagger'
import { HttpBaseResponse } from './base.response.dto'
import { ActivityBudgetList, BudgetProgramProjectDetail } from './program.dto'
import { VendorPayment } from './vendor.dto'

export class PRAttachment {
  @ApiProperty()
  key?: string
  @ApiProperty()
  file_path?: string[]
}

export class CreatePaymentReportApiRequest {
  @ApiProperty()
  payment_date?: string
  @ApiProperty()
  report_documents?: string[]
}

export class PaymentReport {
  @ApiProperty()
  payment_date?: string
  @ApiProperty()
  report_documents?: string[]
}

export class PRReportDetailResponse extends HttpBaseResponse<PaymentReport> {
  @ApiProperty({ type: PaymentReport })
  data: PaymentReport
}

export class UpdateAPSforAPRApiRequest {
  @ApiProperty()
  vendor_id?: string
  @ApiProperty()
  with_ppn?: boolean
  @ApiProperty({ type: [PRAttachment] })
  attachments?: PRAttachment[]
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]
  @ApiProperty()
  aps_result?: string
}

export class SetFinanceCheckerProcessBulk {
  @ApiProperty()
  employee_id: string
  @ApiProperty()
  pr_id: string
}

export class SetFinanceCheckerProcessBulkApiRequest {
  @ApiProperty({ type: [SetFinanceCheckerProcessBulk] })
  payment_requests: SetFinanceCheckerProcessBulk[]
}

export class FinanceProcessBankAccount {
  @ApiProperty({ type: VendorPayment })
  transfer_to: VendorPayment
  @ApiProperty()
  pr_number: string
  @ApiProperty()
  pr_description: string
  @ApiProperty()
  transfer_deadline: string
  @ApiProperty()
  project_name: string
  @ApiProperty()
  amount: number
}

export class FinanceProcessBankAccountResponse extends HttpBaseResponse<FinanceProcessBankAccount[]> {
  @ApiProperty({ type: [FinanceProcessBankAccount] })
  data: FinanceProcessBankAccount[]
}

export class CreatePaymentRequestApiRequest {
  @ApiProperty()
  created_by?: string
  @ApiProperty()
  description?: string
  @ApiProperty()
  rf_id?: string
  @ApiProperty()
  vendor_id?: string
  @ApiProperty()
  expected_payment_date?: string
  @ApiProperty()
  spending_deadline?: string
  @ApiProperty()
  with_ppn?: boolean
  @ApiProperty({ type: [PRAttachment] })
  attachments?: PRAttachment[]
  @ApiProperty({ type: [ActivityBudgetList] })
  budgets?: ActivityBudgetList[]

  @ApiProperty()
  aps_related_pr_id?: string

  @ApiProperty({
    enum: [APSResult.MS.toString(), APSResult.PR.toString(), APSResult.RC.toString()],
  })
  aps_result?: string
  @ApiProperty({
    enum: [
      PRTypes.PR.toString(),
      PRTypes.APR.toString(),
      PRTypes.TE.toString(),
      PRTypes.APF.toString(),
      PRTypes.APS.toString(),
    ],
  })
  payment_type?: string
  @ApiProperty()
  travel_end_date_estimation?: string
}

export class EmployeeProfile {
  @ApiProperty()
  id?: string
  @ApiProperty()
  name?: string
  @ApiProperty()
  employee_pass_photo?: string[]
  @ApiProperty()
  bank_name?: string | null
  @ApiProperty()
  bank_branch?: string | null
  @ApiProperty()
  bank_acc_number?: string | null
  @ApiProperty()
  bank_acc_name?: string | null
  @ApiProperty()
  bank_path?: string[] | null
}
export class ProcessedByStatus {
  @ApiProperty()
  employee_id?: string
  @ApiProperty()
  is_done?: boolean
}

export class PaymentRequestDetail {
  @ApiProperty()
  id?: string
  @ApiProperty()
  description?: string
  @ApiProperty()
  number?: string
  @ApiProperty({ type: [BudgetProgramProjectDetail] })
  projects?: BudgetProgramProjectDetail[]
  @ApiProperty()
  vendor_id?: string
  @ApiProperty()
  program_id?: string
  @ApiProperty()
  rf_id?: string
  @ApiProperty()
  payment_date?: string
  @ApiProperty()
  expected_payment_date?: string
  @ApiProperty()
  spending_deadline?: string
  @ApiProperty()
  with_ppn?: boolean
  @ApiProperty({ type: EmployeeProfile })
  requested_by?: EmployeeProfile

  @ApiProperty({ type: EmployeeProfile })
  finance_checking_process_by?: EmployeeProfile
  @ApiProperty()
  finance_checking_process_status?: string
  @ApiProperty()
  finance_checking_process_note?: string
  @ApiProperty()
  finance_checking_process_at?: Date | string

  @ApiProperty()
  requested_at?: Date | string
  @ApiProperty()
  budget_controller_approval?: string
  @ApiProperty()
  head_of_finance_approval?: string
  @ApiProperty()
  budget_controller_approval_by?: EmployeeProfile
  @ApiProperty()
  budget_controller_approval_at?: Date | string

  @ApiProperty()
  program_manager_approval_by?: EmployeeProfile
  @ApiProperty()
  program_manager_approval?: string
  @ApiProperty()
  program_manager_approval_at?: Date | string

  @ApiProperty()
  head_of_finance_approval_by?: EmployeeProfile
  @ApiProperty({ type: [PRAttachment] })
  attachments?: PRAttachment[]
  @ApiProperty()
  payment_type?: string
  @ApiProperty({ type: EmployeeProfile })
  processed_by?: EmployeeProfile
  @ApiProperty()
  processed_at?: Date | string

  @ApiProperty()
  paid_at?: string
  @ApiProperty()
  aps_budget_controller_approval_by?: EmployeeProfile
  @ApiProperty()
  aps_head_of_finance_approval_by?: EmployeeProfile
  @ApiProperty({ type: EmployeeProfile })
  aps_processed_by?: EmployeeProfile
  @ApiProperty()
  aps_result?: string
  @ApiProperty({ type: PaymentRequestDetail })
  ref_detail?: PaymentRequestDetail
  @ApiProperty()
  report_documents?: string[]
  @ApiProperty()
  travel_end_date_estimation?: string
  @ApiProperty()
  transfer_amount?: number
}

export class PRDetailResponse extends HttpBaseResponse<PaymentRequestDetail> {
  @ApiProperty({ type: PaymentRequestDetail })
  data: PaymentRequestDetail
}

export class PaymentRequestSimple {
  @ApiProperty()
  id?: string
  @ApiProperty()
  expected_payment_date: Date | string
  @ApiProperty()
  created_at?: Date | string
  @ApiProperty()
  description?: string
  @ApiProperty()
  program_name?: string
  @ApiProperty()
  rf_number?: string
  @ApiProperty({ type: EmployeeProfile })
  requested_by?: EmployeeProfile
  @ApiProperty()
  about_request?: string
  @ApiProperty()
  pr_number?: string
  @ApiProperty()
  transfer_amount?: string
  @ApiProperty()
  transfer_amount_value?: number
  @ApiProperty()
  budget_controller_approval?: string
  @ApiProperty()
  program_manager_approval?: string
  @ApiProperty()
  head_of_finance_approval?: string
  @ApiProperty({ type: EmployeeProfile })
  budget_controller_approval_by?: EmployeeProfile
  @ApiProperty({ type: EmployeeProfile })
  program_manager_approval_by?: EmployeeProfile
  @ApiProperty()
  @ApiProperty({ type: EmployeeProfile })
  processed_by?: EmployeeProfile
  @ApiProperty()
  payment_type?: string
  @ApiProperty()
  paid_at?: string
  @ApiProperty({ type: EmployeeProfile })
  finance_checking_process_by?: EmployeeProfile
  @ApiProperty()
  finance_checking_process_status: string
}

export class PRListResponse extends HttpBaseResponse<PaymentRequestSimple[]> {
  @ApiProperty({ type: [PaymentRequestSimple] })
  data: PaymentRequestSimple[]
}

export class APSApprovalStatusRequest {
  @ApiProperty({
    enum: ['aps_budget_controller_approval', 'aps_head_of_finance_approval'],
  })
  approved_by?: string
  @ApiProperty({ enum: ['success', 'pending', 'rejected'] })
  status?: string
}
export class PRApprovalStatusRequest {
  @ApiProperty({
    enum: ['program_manager_approval', 'budget_controller_approval', 'head_of_finance_approval'],
  })
  approved_by?: string
  @ApiProperty({ enum: ['success', 'pending', 'rejected'] })
  status?: string
  @ApiProperty()
  rejection_note?: string
}

export class PRCheckingRejectPayload {
  @ApiProperty()
  note?: string
}

export class CalculationTaxParam {
  @ApiProperty()
  with_ppn?: boolean
  @ApiProperty()
  nationality?: string
  @ApiProperty()
  is_organization?: boolean
  @ApiProperty()
  with_npwp?: boolean
  @ApiProperty()
  tier_rule?: any
}

export class PRTaxes {
  @ApiProperty()
  tax_type?: string
  @ApiProperty()
  percentage?: number
  @ApiProperty()
  total_charged_tax_cap?: number
  @ApiProperty()
  total_tax?: number
  @ApiProperty()
  is_tier?: boolean
}

export class CalculationTaxResult {
  @ApiProperty({ type: CalculationTaxParam })
  calculation_params?: CalculationTaxParam
  @ApiProperty({ type: [PRTaxes] })
  taxes?: PRTaxes[]
}

export class PRCalculationTaxResultResponse extends HttpBaseResponse<CalculationTaxResult> {
  @ApiProperty({ type: CalculationTaxResult })
  data: CalculationTaxResult
}
