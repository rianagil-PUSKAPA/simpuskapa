export enum RequisitionFormEnum {
  PROCUREMENT = 'PROCUREMENT',
  PERSONAL_HIRE = 'PERSONAL_HIRE',
  TRAVEL = 'TRAVEL',
  STAFF_COST = 'STAFF_COST',
}

export enum RFApprovalBy {
  BY_PROGRAM_MANAGER = 'program_manager_approval_status',
  BY_BUDGET_CONTROLLER = 'budget_controller_approval_status',
}

export enum RFApprovalStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
  REVISION = 'revision',
}

export type RequisitionIdentifierType =
  | RequisitionFormEnum.PERSONAL_HIRE
  | RequisitionFormEnum.STAFF_COST
  | RequisitionFormEnum.PROCUREMENT
  | RequisitionFormEnum.TRAVEL
