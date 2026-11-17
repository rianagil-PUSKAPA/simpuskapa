/**
 * Constants for Budget Needs Detail component
 */

// Avatar and UI constants
export const AVATAR_PLACEHOLDER = `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`
export const AVATAR_URL_EXPIRY = 3600 * 24 // 24 hours in seconds
export const ROUTER_REPLACE_DELAY = 300 // milliseconds

// Toast messages
export const TOAST_MESSAGES = {
  BUDGET_SUBMITTED: 'Budget needs submitted',
  BUDGET_DECLINED: 'Budget needs Declined',
  SUBMITTING_BUDGET: 'Submitting budget needs',
  DECLINING_BUDGET: 'Declining budget needs',
  PROMISE_REJECTED: 'Promise rejected 🤯',
  REVISION_MISMATCH_LOWER: (existingTotal: string, maxTotal: string) =>
    `Total project requested (${existingTotal}) is lower than expected revise budget (${maxTotal}), should be exactly same total`,
  REVISION_MISMATCH_HIGHER: (existingTotal: string, maxTotal: string) =>
    `Total project requested (${existingTotal}) is greater than expected revise budget (${maxTotal}), should be exactly same total`,
} as const

// Empty state messages
export const EMPTY_STATE_MESSAGES = {
  NO_ACTIVITY: 'No Activity',
  ACTIVITY_NO_BUDGET: 'Activity found, but no Budget Needs',
  NO_ACTIVITY_DESCRIPTION: "This project hasn't have activity listed, can't submit budget needs",
  NO_BUDGET_DESCRIPTION: "This project hasn't submit the budget needs",
} as const

// Button labels
export const BUTTON_LABELS = {
  DECLINE_BUDGET: 'Decline Budget',
  APPROVE_BUDGET: 'Approve Budget',
  PERDIEM_SETTING: 'Perdiem Setting',
  VIEW_REJECTION_MESSAGE: 'View Rejection Message',
  VIEW_LOG_ACTIVITY: 'View Log Activity',
  VIEW_REVISE_REQUEST: 'View Revise Request',
  EDIT_BUDGET_NEEDS: 'Edit Budget Needs',
  SUBMIT_BUDGET_NEEDS: 'Submit Budget Needs',
  ADD_ACTIVITY_SECTION: 'Add Activity Section',
  BUDGET_NEEDS_FORM: 'Budget Needs Form',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  CLOSE: 'Close',
} as const

// Drawer titles and descriptions
export const DRAWER_TITLES = {
  LOG_ACTIVITY: 'Log Activity',
  REJECTION_MESSAGE: 'Rejection Message',
  REVISE_REQUEST: 'Revise Request',
  PERDIEM_SETTING: 'Perdiem Setting',
} as const

// Modal titles
export const MODAL_TITLES = {
  REJECT_REQUEST: 'Reject this request?',
  REJECT_DESCRIPTION: 'Please make sure to give reason why it rejected',
} as const

// Warning messages
export const WARNING_MESSAGES = {
  FUND_INSUFFICIENT_TITLE: 'Warning, the Fund Received are less than Pending Request + Total Payment.',
  FUND_INSUFFICIENT_DESCRIPTION:
    'Remember, you can not ask payment request if the total payment + your payment request are more than the total fund received. Make sure to get the fund, and submit it.',
} as const

// Vendor types
export const VENDOR_TYPES = {
  CONSULTANT: 'consultant',
  TRAVEL: 'travel',
  STAFF_COST: 'staff cost',
  STAFF: 'staff',
} as const

// Vendor categories
export const VENDOR_CATEGORIES = {
  OVERSEAS_PERDIEM: 'Overseas Perdiem',
  NORMAL_PERDIEM: 'Normal Perdiem',
  REMOTE_AREA_PERDIEM: 'Remote Area Perdiem',
  OTHER: 'Other',
} as const

// Requisition types
export type RequisitionType = 'PC' | 'TR' | 'PH' | 'SC'

export const REQUISITION_TYPES = {
  PROCUREMENT: 'PC' as RequisitionType,
  TRAVEL: 'TR' as RequisitionType,
  PERSONNEL_HIRE: 'PH' as RequisitionType,
  STAFF_COST: 'SC' as RequisitionType,
} as const

// Toast warning messages for budget needs list
export const BUDGET_LIST_WARNINGS = {
  SELECT_ONE_BUDGET: 'Please select at least one budget activity',
  WRONG_BUTTON_SELECTED: 'Wrong button selected with selected budget activity.',
  ONLY_ONE_PH_ALLOWED: 'Only one budget of PH is allowed in one request',
  ONLY_ONE_SC_ALLOWED: 'Only one budget of staff cost is allowed in one request',
} as const
