import { VENDOR_TYPES, VENDOR_CATEGORIES } from '../constants'
import { ProjectActivityModified } from '../BudgetNeedsList'

/**
 * Check if any budget in activities contains consultant vendor type
 */
export const hasConsultantVendor = (activities: ProjectActivityModified[]): boolean => {
  return activities.some((activity) =>
    activity.budgets.some(
      (budget) => budget.vendor_category_information.vendor_type.name.toLowerCase() === VENDOR_TYPES.CONSULTANT,
    ),
  )
}

/**
 * Check if any budget in activities contains travel vendor type
 */
export const hasTravelVendor = (activities: ProjectActivityModified[]): boolean => {
  return activities.some((activity) =>
    activity.budgets.some(
      (budget) => budget.vendor_category_information.vendor_type.name.toLowerCase() === VENDOR_TYPES.TRAVEL,
    ),
  )
}

/**
 * Check if any budget in activities contains non-travel vendor type
 */
export const hasNonTravelVendor = (activities: ProjectActivityModified[]): boolean => {
  return activities.some((activity) =>
    activity.budgets.some(
      (budget) => budget.vendor_category_information.vendor_type.name.toLowerCase() !== VENDOR_TYPES.TRAVEL,
    ),
  )
}

/**
 * Check if any budget in activities contains staff cost vendor type
 */
export const hasStaffCostVendor = (activities: ProjectActivityModified[]): boolean => {
  return activities.some((activity) =>
    activity.budgets.some(
      (budget) =>
        budget.vendor_category_information.vendor_type.name.toLowerCase() === VENDOR_TYPES.STAFF_COST ||
        budget.vendor_category_information.vendor_type.name.toLowerCase() === VENDOR_TYPES.STAFF,
    ),
  )
}

/**
 * Check if activities contain consultant or travel vendor types (not allowed for PC)
 */
export const hasInvalidVendorForPC = (activities: ProjectActivityModified[]): boolean => {
  return activities.some((activity) =>
    activity.budgets.some(
      (budget) =>
        budget.vendor_category_information.vendor_type.name.toLowerCase() === VENDOR_TYPES.CONSULTANT ||
        budget.vendor_category_information.vendor_type.name.toLowerCase() === VENDOR_TYPES.TRAVEL,
    ),
  )
}

/**
 * Get all vendor categories from activities
 */
export const getVendorCategories = (activities: ProjectActivityModified[]): string[] => {
  const categories = activities.flatMap((activity) =>
    activity.budgets.map((budget) => budget.vendor_category_information.name),
  )
  return categories
}

/**
 * Check if there are multiple perdiem categories
 */
export const hasMultiplePerdiemCategories = (activities: ProjectActivityModified[]): boolean => {
  const categories = getVendorCategories(activities)
  const perdiemCategories = categories.filter(
    (category) =>
      category === VENDOR_CATEGORIES.OVERSEAS_PERDIEM ||
      category === VENDOR_CATEGORIES.NORMAL_PERDIEM ||
      category === VENDOR_CATEGORIES.REMOTE_AREA_PERDIEM,
  )
  return perdiemCategories.length > 1
}

/**
 * Check if there are multiple "Other" categories
 */
export const hasMultipleOtherCategories = (activities: ProjectActivityModified[]): boolean => {
  const categories = getVendorCategories(activities)
  const otherCategories = categories.filter((category) => category === VENDOR_CATEGORIES.OTHER)
  return otherCategories.length > 1
}

/**
 * Count total budgets in activities
 */
export const countTotalBudgets = (activities: ProjectActivityModified[]): number => {
  return activities.reduce((total, activity) => total + activity.budgets.length, 0)
}
