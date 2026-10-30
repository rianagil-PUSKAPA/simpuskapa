import { PaymentRequestSimple } from 'sdk/api'

export type PaymentRequestWithAPRType = {
  id: string
  ordering_seq: number
  description: string
  code: string
  budgets: BudgetPayment[]
  is_checked: boolean
}

export type BudgetPayment = {
  recommended_vendor: string
  qty: number
  advance_payment_total?: number
  pkg_qty: number
  unit_cost_value: number
  total_prs: number
  // unit_cost_value_shadow: number
  id: string
  ordering_seq: number
  code: string
  description: string
  vendor_category_id: string
  unit: string
  pkg_unit: string
  unit_cost: string
  vendor_category_information?: VendorCategoryInformation
  is_checked: boolean
}

type VendorCategoryInformation = {
  id: string
  name: string
  action_by: string
  vendor_type_id?: string
  attachment_list?: string[]
  vendor_type: VendorType
}

type VendorType = {
  id: string
  name: string
  tax_calculation_type?: string
}

export type PaymentRequestListType = {
  pr_type: string
  pr_year: string
  // expected_payment_date?: string
  // paid_at?: string
  // created_at?: string
} & PaymentRequestSimple
