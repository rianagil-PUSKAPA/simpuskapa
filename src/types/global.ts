import { TimeOffRequestDtoStatusEnum } from 'sdk/api'

export type BucketsUnion =
  | 'puskapa-employee-cv'
  | 'puskapa-employee-identity-card'
  | 'puskapa-employee-passport'
  | 'puskapa-employee-npwp'
  | 'puskapa-employee-bpjs'
  | 'puskapa-employee-bpjs-emp'
  | 'puskapa-employee-kk'
  | 'puskapa-employee-insurance'
  | 'puskapa-employee-emergency'
  | 'puskapa-employee-bank'
  | 'puskapa-employee-pass-photo'
  | 'puskapa-employee-trainings'
  | 'puskapa-employee-contract'
  | 'puskapa-employee-performance'
  | 'puskapa-user-avatars'
  | 'puskapa-employee-timeoff'
  | 'puskapa-employee-health-insurance'
  | 'puskapa-employee-recruitment-docs'
  | 'puskapa-vendor-files'
  | 'puskapa-program-snapshoot'
  | 'puskapa-program-contract'
  | 'revise-approval-doc'
  | 'puskapa-rf-doc'
  | 'puskapa-pr-attachment'
  | 'puskapa-program-transfer-list'

export type BucketNameKeyType = {
  bucketName: BucketsUnion
  progress: number
  identifier?: string
}

export type DynamicProgressType = Record<string, BucketNameKeyType>

export type TrainingForms = {
  certificate: string[]
  training_name: string
  training_date: string
  organizer: string
  source_fund: string
}

export type DepartmentPosition = {
  department: string
  position: string[]
}

export type TimeoffStatusType =
  | (typeof TimeOffRequestDtoStatusEnum)[keyof typeof TimeOffRequestDtoStatusEnum]
  | 'cancelled|declined'

export type ComboboxType = {
  id: number | string
  name: string
  alias?: string
  avatarUrl?: string[]
  pass_photo?: string[]
}

export type CurrencyUnion = 'USD' | 'IDR' | 'AUD'

export type FinanceDashboardType = {
  total_budget_allocation_amount: number
  total_remaining_budget_amount: number
  total_paid_payment_amount: number
  total_pending_requested_amount: number
  total_ongoing: number
  total_payment_request: number
  pending_payment_request: number
}

export type SortType =
  | ''
  | 'name|asc'
  | 'name|desc'
  | 'partner|asc'
  | 'partner|desc'
  | 'program_manager|asc'
  | 'program_manager|desc'

export type ApprovalStatusType = 'approved' | 'rejected' | 'pending' | 'revision' | ''
