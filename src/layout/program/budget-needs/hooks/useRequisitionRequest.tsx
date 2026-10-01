import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { copyCheckedBudgetsWithActivities } from '@/utils/globalHelper'
import { RequisitionType, BUDGET_LIST_WARNINGS } from '../constants'
import {
  hasInvalidVendorForPC,
  hasTravelVendor,
  hasNonTravelVendor,
  hasConsultantVendor,
  hasStaffCostVendor,
  hasMultiplePerdiemCategories,
  hasMultipleOtherCategories,
  countTotalBudgets,
} from '../utils/vendorValidation'
import { ProjectBudgetsImproved, ProjectActivityModified } from '../BudgetNeedsList'

type ModalStatement = {
  procurementRequest: boolean
  travelRequest: boolean
  personalHireRequest: boolean
  doublePerdiem: boolean
  staffCost: boolean
}

type LoadingButtonStatement = {
  pc: boolean
  tr: boolean
  ph: boolean
  sc: boolean
}

type UseRequisitionRequestReturn = {
  loadingButtonStatement: LoadingButtonStatement
  isOpenModal: ModalStatement
  setIsOpenModal: React.Dispatch<React.SetStateAction<ModalStatement>>
  handleRequisitionRequest: (parameter: RequisitionType, code: string) => void
}

type UseRequisitionRequestParams = {
  programId: string
  projectBudgets: ProjectBudgetsImproved[]
  handleBudgetsToProcurements: (activities: ProjectActivityModified[]) => void
  handleProjectToProcurement: (project: any) => void
  handleRequisitionIdentifier: (type: string) => void
}

/**
 * Custom hook to handle requisition request logic
 * Manages validation, modal states, and navigation for different requisition types
 */
export const useRequisitionRequest = ({
  programId,
  projectBudgets,
  handleBudgetsToProcurements,
  handleProjectToProcurement,
  handleRequisitionIdentifier,
}: UseRequisitionRequestParams): UseRequisitionRequestReturn => {
  const router = useRouter()

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement>({
    procurementRequest: false,
    travelRequest: false,
    personalHireRequest: false,
    doublePerdiem: false,
    staffCost: false,
  })

  const [loadingButtonStatement, setLoadingButtonStatement] = useState<LoadingButtonStatement>({
    pc: false,
    tr: false,
    ph: false,
    sc: false,
  })

  const resetLoadingStates = () => {
    setLoadingButtonStatement({
      pc: false,
      tr: false,
      ph: false,
      sc: false,
    })
  }

  const setLoadingState = (type: RequisitionType, value: boolean) => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      [type.toLowerCase()]: value,
    }))
  }

  const showToastWarning = (message: string) => {
    toast.warning(message, {
      autoClose: 10000,
      icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
    })
  }

  const validateAndGetCheckedActivities = (
    parameter: RequisitionType,
    code: string,
  ): ProjectActivityModified[] | null => {
    setLoadingState(parameter, true)

    const filteredActivities = copyCheckedBudgetsWithActivities(projectBudgets)

    if (filteredActivities.length === 0) {
      showToastWarning(BUDGET_LIST_WARNINGS.SELECT_ONE_BUDGET)
      resetLoadingStates()
      return null
    }

    const projectWithChecked = projectBudgets.find((item) =>
      item.activities.some((activity) => activity.budgets.some((budget) => budget.is_checked)),
    )

    if (!projectWithChecked) {
      resetLoadingStates()
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activities, ...itemWithoutActivities } = projectWithChecked

    if (itemWithoutActivities.code !== code) {
      showToastWarning(BUDGET_LIST_WARNINGS.WRONG_BUTTON_SELECTED)
      resetLoadingStates()
      return null
    }

    handleBudgetsToProcurements(filteredActivities)
    handleProjectToProcurement(itemWithoutActivities)

    return filteredActivities
  }

  const handleProcurementRequest = (filteredActivities: ProjectActivityModified[]) => {
    handleRequisitionIdentifier('PC')

    if (hasInvalidVendorForPC(filteredActivities)) {
      setIsOpenModal((prev) => ({
        ...prev,
        procurementRequest: true,
      }))
      resetLoadingStates()
      return
    }

    router.push(`/dashboard/procurement/${programId}`)
  }

  const handleTravelRequest = (filteredActivities: ProjectActivityModified[]) => {
    if (hasMultiplePerdiemCategories(filteredActivities)) {
      setIsOpenModal((prev) => ({
        ...prev,
        doublePerdiem: true,
      }))
      resetLoadingStates()
      return
    }

    if (hasMultipleOtherCategories(filteredActivities)) {
      setIsOpenModal((prev) => ({
        ...prev,
        doublePerdiem: true,
      }))
      resetLoadingStates()
      return
    }

    handleRequisitionIdentifier('TR')

    if (hasNonTravelVendor(filteredActivities)) {
      setIsOpenModal((prev) => ({
        ...prev,
        travelRequest: true,
      }))
      resetLoadingStates()
      return
    }

    if (hasTravelVendor(filteredActivities)) {
      router.push(`/dashboard/procurement/${programId}`)
    } else {
      setIsOpenModal((prev) => ({
        ...prev,
        travelRequest: true,
      }))
      resetLoadingStates()
    }
  }

  const handlePersonnelHireRequest = (filteredActivities: ProjectActivityModified[]) => {
    const totalPH = countTotalBudgets(filteredActivities)

    if (totalPH > 1) {
      showToastWarning(BUDGET_LIST_WARNINGS.ONLY_ONE_PH_ALLOWED)
      resetLoadingStates()
      return
    }

    handleRequisitionIdentifier('PH')

    if (hasConsultantVendor(filteredActivities)) {
      router.push(`/dashboard/procurement/${programId}`)
    } else {
      setIsOpenModal((prev) => ({
        ...prev,
        personalHireRequest: true,
      }))
      resetLoadingStates()
    }
  }

  const handleStaffCostRequest = (filteredActivities: ProjectActivityModified[]) => {
    const totalSC = countTotalBudgets(filteredActivities)

    if (totalSC > 1) {
      showToastWarning(BUDGET_LIST_WARNINGS.ONLY_ONE_SC_ALLOWED)
      resetLoadingStates()
      return
    }

    handleRequisitionIdentifier('SC')

    if (hasStaffCostVendor(filteredActivities)) {
      router.push(`/dashboard/procurement/${programId}`)
    } else {
      setIsOpenModal((prev) => ({
        ...prev,
        staffCost: true,
      }))
      resetLoadingStates()
    }
  }

  const handleRequisitionRequest = (parameter: RequisitionType, code: string) => {
    const filteredActivities = validateAndGetCheckedActivities(parameter, code)
    if (!filteredActivities) return

    switch (parameter) {
      case 'PC':
        handleProcurementRequest(filteredActivities)
        break
      case 'TR':
        handleTravelRequest(filteredActivities)
        break
      case 'PH':
        handlePersonnelHireRequest(filteredActivities)
        break
      case 'SC':
        handleStaffCostRequest(filteredActivities)
        break
      default:
        break
    }

    resetLoadingStates()
  }

  return {
    loadingButtonStatement,
    isOpenModal,
    setIsOpenModal,
    handleRequisitionRequest,
  }
}
