import { ProjectActivityModified } from '@/layout/program/budget-needs/BudgetNeedsList'
import { JwtLib } from '@/shared/jwt.lib'
import { getLocalCookie } from '@/utils/globalHelper'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type ProjectWithoutActivitiesType = {
  code: string
  description: string
  ordering_seq: number
  id: string
}

type RequisitionType = 'PC' | 'TR' | 'PH' | 'SC' | null
type PaymentRequestType = 'PR' | 'APR' | 'TE' | 'APF' | null

type UserJWTInformationType = {
  id: string
  email: string
  acl: any[]
  avatar: string
  employee_name: string
  employee_id: string
  role: any
}

type ContextProps = {
  isCollapsed: boolean
  handleSidebarToggle: (value: boolean) => void
  isFixedExpand: boolean
  handleSidebarExpand: (value: boolean) => void
  isInternal: boolean
  handleInternal: (value: boolean) => void
  // BUDGET TO PROCUREMENT - START
  budgetsFromProgramToProcurements: ProjectActivityModified[]
  handleBudgetsToProcurements: (value: ProjectActivityModified[]) => void
  requisitionIdentifier: RequisitionType
  handleRequisitionIdentifier: (value: RequisitionType) => void
  project: ProjectWithoutActivitiesType
  handleProjectToProcurement: (value: ProjectWithoutActivitiesType) => void
  // PROCUREMENT TO PAYMENT REQUEST - START
  budgetsFromProcurementsToPaymentRequest: ProjectActivityModified[]
  handleRequisitionBudgetToPaymentRequest: (value: ProjectActivityModified[]) => void
  paymentRequestIdentifier: PaymentRequestType
  handlePaymentRequestIdentifier: (value: PaymentRequestType) => void
  paymentRequestProject: ProjectWithoutActivitiesType
  handleProjectToPaymentRequest: (value: ProjectWithoutActivitiesType) => void
  userLoggedinInformation: UserJWTInformationType
  programAccessor: string[]
  handleProgramAccessor: (value: string[]) => void
}

const DashboardContext = createContext<ContextProps | null>(null)

export const useDashboardContext = () => useContext(DashboardContext)

export const DashboardLayoutProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isFixedExpand, setIsFixedExpand] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  // BUDGET TO PROCUREMENT - START
  const [budgetsFromProgramToProcurements, setBudgetsFromProgramToProcurements] = useState<
    ProjectActivityModified[] | null
  >(null)
  const [requisitionIdentifier, setRequisitionIdentifier] = useState<RequisitionType>(null)
  const [project, setProject] = useState<ProjectWithoutActivitiesType | null>(null)
  // PROCUREMENT TO PAYMENT REQUEST - START
  const [budgetsFromProcurementsToPaymentRequest, setBudgetsFromProcurementsToPaymentRequest] = useState<
    ProjectActivityModified[] | null
  >(null)
  const [paymentRequestIdentifier, setPaymentRequestIdentifier] = useState<PaymentRequestType>(null)
  const [paymentRequestProject, setPaymentRequestProject] = useState<ProjectWithoutActivitiesType | null>(null)
  const [userLoggedinInformation, setUserLoggedinInformation] = useState<UserJWTInformationType>()
  const [programAccessor, setProgramAccessor] = useState<string[]>()

  const handleSidebarToggle = (value: boolean) => {
    setIsCollapsed(value)
  }

  const handleSidebarExpand = (value: boolean) => {
    setIsFixedExpand(value)
  }

  const handleInternal = (value: boolean) => {
    localStorage.setItem('is_internal', JSON.stringify(value))
    setIsInternal(value)
  }

  // BUDGET TO PROCUREMENT - START
  const handleBudgetsToProcurements = (value: ProjectActivityModified[]) => {
    localStorage.setItem('budget_needs_to_procurements', JSON.stringify(value))
    setBudgetsFromProgramToProcurements(value)
  }

  const handleRequisitionIdentifier = (value: RequisitionType) => {
    localStorage.setItem('requisition_type', JSON.stringify(value))
    setRequisitionIdentifier(value)
  }

  const handleProjectToProcurement = (value: ProjectWithoutActivitiesType) => {
    localStorage.setItem('project_to_procurements', JSON.stringify(value))
    setProject(value)
  }
  // PROCUREMENT TO PAYMENT REQUEST - START
  const handleRequisitionBudgetToPaymentRequest = (value: ProjectActivityModified[]) => {
    localStorage.setItem('budget_needs_to_payment_request', JSON.stringify(value))
    setBudgetsFromProcurementsToPaymentRequest(value)
  }

  const handlePaymentRequestIdentifier = (value: PaymentRequestType) => {
    localStorage.setItem('payment_request_type', JSON.stringify(value))
    setPaymentRequestIdentifier(value)
  }

  const handleProjectToPaymentRequest = (value: ProjectWithoutActivitiesType) => {
    localStorage.setItem('project_to_payment_request', JSON.stringify(value))
    setPaymentRequestProject(value)
  }

  const handleProgramAccessor = (value: string[]) => {
    setProgramAccessor(value)
  }

  useEffect(() => {
    // BUDGET TO PROCUREMENT - START
    localStorage.getItem('budget_needs_to_procurements') &&
      setBudgetsFromProgramToProcurements(JSON.parse(localStorage.getItem('budget_needs_to_procurements')))
    localStorage.getItem('requisition_type') &&
      setRequisitionIdentifier(JSON.parse(localStorage.getItem('requisition_type')))

    localStorage.getItem('project_to_procurements') &&
      setProject(JSON.parse(localStorage.getItem('project_to_procurements')))

    // BUDGET TO PROCUREMENT - START
    localStorage.getItem('budget_needs_to_payment_request') &&
      setBudgetsFromProcurementsToPaymentRequest(JSON.parse(localStorage.getItem('budget_needs_to_payment_request')))
    localStorage.getItem('payment_request_type') &&
      setPaymentRequestIdentifier(JSON.parse(localStorage.getItem('payment_request_type')))

    localStorage.getItem('project_to_payment_request') &&
      setPaymentRequestProject(JSON.parse(localStorage.getItem('project_to_payment_request')))
    localStorage.getItem('is_internal') && setIsInternal(JSON.parse(localStorage.getItem('is_internal')))
  }, [])

  useEffect(() => {
    const localCookie = getLocalCookie('auth_token')
    if (localCookie) {
      JwtLib.decodeOnly(localCookie).then((authTokenJWT) => {
        setUserLoggedinInformation(authTokenJWT as unknown as UserJWTInformationType)
      })
    }
  }, [getLocalCookie('auth_token')])

  const contextValue = useMemo(
    () => ({
      isCollapsed,
      handleSidebarToggle,
      isInternal,
      handleInternal,
      isFixedExpand,
      // BUDGET TO PROCUREMENT - START
      handleSidebarExpand,
      budgetsFromProgramToProcurements,
      handleBudgetsToProcurements,
      requisitionIdentifier,
      handleRequisitionIdentifier,
      project,
      handleProjectToProcurement,
      // PROCUREMENT TO PAYMENT REQUEST - START
      budgetsFromProcurementsToPaymentRequest,
      handleRequisitionBudgetToPaymentRequest,
      paymentRequestIdentifier,
      handlePaymentRequestIdentifier,
      paymentRequestProject,
      handleProjectToPaymentRequest,
      userLoggedinInformation,
      programAccessor,
      handleProgramAccessor,
    }),
    [
      isCollapsed,
      handleSidebarToggle,
      isInternal,
      handleInternal,
      isFixedExpand,
      // BUDGET TO PROCUREMENT - START
      handleSidebarExpand,
      budgetsFromProgramToProcurements,
      handleBudgetsToProcurements,
      requisitionIdentifier,
      handleRequisitionIdentifier,
      project,
      handleProjectToProcurement,
      // PROCUREMENT TO PAYMENT REQUEST - START
      budgetsFromProcurementsToPaymentRequest,
      handleRequisitionBudgetToPaymentRequest,
      paymentRequestIdentifier,
      handlePaymentRequestIdentifier,
      paymentRequestProject,
      handleProjectToPaymentRequest,
      userLoggedinInformation,
      programAccessor,
      handleProgramAccessor,
    ],
  )

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>
}
