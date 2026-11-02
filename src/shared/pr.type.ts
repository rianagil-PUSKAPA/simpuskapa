export enum PRApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION = 'revision',
}

export enum PRApprovalBy {
  HOO = 'head_of_operation',
  HOF = 'head_of_finance_approval',
  PM = 'program_manager_approval',
  BC = 'budget_controller_approval',
}

export enum APSApprovalBy {
  HOO = 'aps_budget_controller_approval',
  HOF = 'aps_head_of_finance_approval',
}

export enum PRTypes {
  PR = 'payment-request',
  APR = 'advance-payment-request',
  APF = 'advance-perdiem-fee',
  TE = 'travel-expense',
  APS = 'advance-payment-statement',
}

export enum PRTypesReadableText {
  PR = 'Payment Request',
  APR = 'Advance Payment Request',
  APF = 'Advance Perdiem Fee',
  TE = 'Travel Expense',
  APS = 'Advance Payment Statement',
}

export enum APSResult {
  PR = 'payment-request',
  RC = 'report-closure',
  MS = 'money-settlement',
}

export enum PRFinanceCheckingStatus {
  CHECKING = 'checking',
  CHECKED = 'checked',
  REVISION = 'revision',
}

export type PaymentIdentifierType = PRTypes.PR | PRTypes.APR | PRTypes.TE | PRTypes.APS | PRTypes.APF
