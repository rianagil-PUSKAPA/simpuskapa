import { employeeApi, getEmployeeDetail } from '@/utils/apiRequestHelper'
import { getLocalSession, isEmpty } from '@/utils/globalHelper'
import { Employee, EmployeeUpdateRequest } from '@sdk'
import { createContext, useContext, useEffect, useState } from 'react'

type AvailableForms =
  | 'employmentData'
  | 'personalIdentity'
  | 'identityDocuments'
  | 'paymentData'
  | 'finalStepOnboarding'

export interface AddEmployeeFormWizardProps {
  identifier: string
  status: boolean
  percentage: number
}

export interface ContextProps {
  stepFormWizardHistory: AddEmployeeFormWizardProps[]
  formWizardCurrentState: AvailableForms
  handleFormWizardHistory: (
    currentIndetifier: AvailableForms,
    nextIndetifier: AvailableForms,
    totalPercentage: number,
  ) => void
}

export const EMPLOYMENT_DATA_TOTAL_PAGE = 10
export const PERSONAL_IDENTITY_TOTAL_PAGE = 10
export const IDENTITY_DOCUMENT_TOTAL_PAGE = 19
export const PAYMENT_DATA_TOTAL_PAGE = 6

const WIZARD_HISTORY_DEFAULT_VALUE = [
  {
    identifier: 'employmentData',
    status: false,
    percentage: 0,
  },
  {
    identifier: 'personalIdentity',
    status: false,
    percentage: 0,
  },
  {
    identifier: 'identityDocuments',
    status: false,
    percentage: 0,
  },
  {
    identifier: 'paymentData',
    status: false,
    percentage: 0,
  },
  {
    identifier: 'finalStepOnboarding',
    status: false,
    percentage: 0,
  },
]

const FormWizardContext = createContext<ContextProps | null>(null)

export const useAddEmployeeFormWizardProvider = () => useContext(FormWizardContext)

export const AddEmployeeFormWizardProvider = ({ children }) => {
  const [stepFormWizardHistory, setStepFormWizardHistory] =
    useState<AddEmployeeFormWizardProps[]>(WIZARD_HISTORY_DEFAULT_VALUE)
  const [formWizardCurrentState, setFormWizardCurrentState] = useState<AvailableForms>('employmentData')

  const handleFormWizardHistory = (
    currentIndetifier: AvailableForms,
    nextIndetifier: AvailableForms,
    totalPercentage: number,
  ) => {
    const exec = async () => {
      const getDetailEmployee = await getEmployeeDetail(getLocalSession('employee_id'))

      let percentage = null

      switch (currentIndetifier) {
        case 'employmentData':
          percentage = employmentDataFiltration(getDetailEmployee)
          break
        case 'personalIdentity':
          percentage = personalIdentityFiltration(getDetailEmployee)
          break
        case 'identityDocuments':
          percentage = identityDocumentsFiltration(getDetailEmployee)
          break
        case 'paymentData':
          percentage = paymentDataFiltration(getDetailEmployee)
          break
        default:
          break
      }

      setFormWizardCurrentState(nextIndetifier)

      const filterDuplicateId: AddEmployeeFormWizardProps[] = stepFormWizardHistory.filter(
        (item) => item.identifier !== currentIndetifier,
      )

      const insertedNewValue = [
        ...filterDuplicateId,
        {
          identifier: currentIndetifier,
          status: true,
          percentage: (percentage / totalPercentage) * 100,
        },
      ]

      // console.log('insertedNewValue', insertedNewValue)

      sessionStorage.setItem('form_wizard_history_employee', JSON.stringify(insertedNewValue))
      sessionStorage.setItem('employee_id', getDetailEmployee.id)
      setStepFormWizardHistory(insertedNewValue)

      const employeeUpdateRequest = {} as EmployeeUpdateRequest
      // Name
      employeeUpdateRequest.staff_id = getDetailEmployee.staff_id
      employeeUpdateRequest.user_id = getDetailEmployee.user_id
      employeeUpdateRequest.full_name = getDetailEmployee.full_name
      employeeUpdateRequest.gender = getDetailEmployee.gender
      employeeUpdateRequest.pob = getDetailEmployee.pob
      employeeUpdateRequest.dob = getDetailEmployee.dob
      employeeUpdateRequest.religion = getDetailEmployee.religion
      employeeUpdateRequest.marital_status = getDetailEmployee.marital_status
      employeeUpdateRequest.nationality = getDetailEmployee.nationality
      employeeUpdateRequest.id_card_address = getDetailEmployee.id_card_address
      employeeUpdateRequest.residence_address = getDetailEmployee.residence_address
      employeeUpdateRequest.phone_number = getDetailEmployee.phone_number
      employeeUpdateRequest.emergency_contacts = getDetailEmployee.emergency_contacts || ''
      employeeUpdateRequest.identity_number = getDetailEmployee.identity_number
      employeeUpdateRequest.identity_path = getDetailEmployee.identity_path || []
      employeeUpdateRequest.npwp_number = getDetailEmployee.npwp_number
      employeeUpdateRequest.npwp_path = getDetailEmployee.npwp_path || []
      employeeUpdateRequest.bpjs_number = getDetailEmployee.bpjs_number
      employeeUpdateRequest.bpjs_path = getDetailEmployee.bpjs_path || []
      employeeUpdateRequest.bpjs_tkn_number = getDetailEmployee.bpjs_tkn_number
      employeeUpdateRequest.bpjs_emp_path = getDetailEmployee.bpjs_emp_path || []
      employeeUpdateRequest.passport_number = getDetailEmployee.passport_number
      employeeUpdateRequest.passport_expiry = getDetailEmployee.passport_expiry
      employeeUpdateRequest.passport_path = getDetailEmployee.passport_path || []
      employeeUpdateRequest.kk_number = getDetailEmployee.kk_number
      employeeUpdateRequest.kk_path = getDetailEmployee.kk_path || []
      employeeUpdateRequest.health_insurance_number = getDetailEmployee.health_insurance_number
      employeeUpdateRequest.health_insurance_path = getDetailEmployee.health_insurance_path || []
      employeeUpdateRequest.cv_title = getDetailEmployee.cv_title
      employeeUpdateRequest.cv_path = getDetailEmployee.cv_path || []
      employeeUpdateRequest.recruitment_documents_title = getDetailEmployee.recruitment_documents_title
      employeeUpdateRequest.recruitment_documents_path = getDetailEmployee.recruitment_documents_path || []
      employeeUpdateRequest.bank_name = getDetailEmployee.bank_name
      employeeUpdateRequest.bank_branch = getDetailEmployee.bank_branch
      employeeUpdateRequest.bank_acc_number = getDetailEmployee.bank_acc_number
      employeeUpdateRequest.bank_acc_name = getDetailEmployee.bank_acc_name
      employeeUpdateRequest.swift_code = getDetailEmployee.swift_code
      employeeUpdateRequest.bank_path = getDetailEmployee.bank_path || []

      const formCalculation = insertedNewValue.reduce((accum, item) => accum + item.percentage, 0)

      const percentageFormCalculation = ((Number(formCalculation) / 400) * 100).toFixed(0)

      const isLock = () => {
        if (
          getDetailEmployee.full_name &&
          getDetailEmployee.user.email &&
          getDetailEmployee.employee_contracts[0]?.department &&
          getDetailEmployee.employee_contracts[0]?.position &&
          getDetailEmployee.employee_contracts[0]?.supervisor_id &&
          getDetailEmployee.employee_contracts[0]?.emp_status &&
          getDetailEmployee?.gender &&
          getDetailEmployee?.religion &&
          getDetailEmployee?.marital_status &&
          getDetailEmployee?.nationality &&
          getDetailEmployee?.phone_number &&
          getDetailEmployee?.identity_number &&
          getDetailEmployee?.identity_path.length > 0 &&
          getDetailEmployee?.npwp_number &&
          getDetailEmployee?.npwp_path.length > 0
        ) {
          return true
        }
        return false
      }

      await employeeApi.employeeControllerUpdateEmployee(getDetailEmployee?.id, {
        ...employeeUpdateRequest,
        form_progress: Number(percentageFormCalculation),
        form_state: String(JSON.stringify(insertedNewValue)),
        is_lock: isLock(),
      })
    }
    exec()
  }

  useEffect(() => {
    const parsedStringSession = JSON.parse(getLocalSession('form_wizard_history_employee') || '{}')

    const isFormWizardEmpty = isEmpty(parsedStringSession)

    if (!isFormWizardEmpty) {
      setStepFormWizardHistory(parsedStringSession)
    }
  }, [formWizardCurrentState])

  const contextValue: ContextProps = {
    stepFormWizardHistory,
    formWizardCurrentState,
    handleFormWizardHistory,
  }

  return <FormWizardContext.Provider value={contextValue}>{children}</FormWizardContext.Provider>
}

const employmentDataFiltration = (employeeDetailData: Employee) => {
  let percentage = 0

  if (employeeDetailData?.full_name) {
    percentage++
  }
  if (employeeDetailData?.user.email) {
    percentage++
  }
  if (employeeDetailData?.pass_photo_path?.length > 0) {
    percentage++
  }
  /* Employment */
  if (employeeDetailData.employee_contracts.length && employeeDetailData.employee_contracts[0].department) {
    percentage++
  }
  if (employeeDetailData.employee_contracts.length && employeeDetailData.employee_contracts[0].position) {
    percentage++
  }
  if (employeeDetailData.employee_contracts.length && employeeDetailData.employee_contracts[0].supervisor_id) {
    percentage++
  }
  if (employeeDetailData.employee_contracts.length && employeeDetailData.employee_contracts[0].emp_status) {
    percentage++
  }
  /* Contract */
  if (employeeDetailData.employee_contracts.length && employeeDetailData.employee_contracts[0].created_at) {
    percentage++
  }
  if (employeeDetailData.employee_contracts.length && employeeDetailData.employee_contracts[0].contract_number) {
    percentage++
  }
  if (employeeDetailData.employee_contracts.length && employeeDetailData.employee_contracts[0].doc_path) {
    percentage++
  }

  return percentage
}
const personalIdentityFiltration = (employeeDetailData: Employee) => {
  let percentage = 0

  if (employeeDetailData?.gender) {
    percentage++
    // console.log(1)
  }
  if (employeeDetailData?.religion) {
    percentage++
    // console.log(2)
  }
  if (employeeDetailData?.marital_status) {
    percentage++
    // console.log(3)
  }
  if (employeeDetailData?.nationality) {
    percentage++
    // console.log(4)
  }

  /* Birth Information */
  if (employeeDetailData?.pob) {
    percentage++
    // console.log(5)
  }
  if (employeeDetailData?.dob) {
    percentage++
    // console.log(6)
  }

  /* Contacts */
  if (employeeDetailData?.phone_number) {
    percentage++
    // console.log(7)
  }

  /* Address */
  if (employeeDetailData?.id_card_address) {
    percentage++
    // console.log(8)
  }
  if (employeeDetailData?.residence_address) {
    percentage++
    // console.log(9)
  }

  /* Emergency Contacts */
  if (JSON.parse(employeeDetailData?.emergency_contacts).length > 0) {
    percentage++
    // console.log(10)
  }

  return percentage
}
const identityDocumentsFiltration = (employeeDetailData: Employee) => {
  let percentage = 0

  /* Nationality Identity Card */
  if (employeeDetailData?.identity_number) {
    percentage++
  }
  if (employeeDetailData?.identity_path.length > 0) {
    percentage++
  }

  /* NPWP */
  if (employeeDetailData?.npwp_number) {
    percentage++
  }
  if (employeeDetailData?.npwp_path.length > 0) {
    percentage++
  }

  /* BPJS Kesehatan */
  if (employeeDetailData?.bpjs_number) {
    percentage++
  }
  if (employeeDetailData?.bpjs_path.length > 0) {
    percentage++
  }

  /* BPJS Ketenagakerjaan */
  if (employeeDetailData?.bpjs_tkn_number) {
    percentage++
  }
  if (employeeDetailData?.bpjs_emp_path.length > 0) {
    percentage++
  }

  /* Passport */
  if (employeeDetailData?.passport_number) {
    percentage++
  }
  if (employeeDetailData?.passport_expiry) {
    percentage++
  }
  if (employeeDetailData?.passport_path.length > 0) {
    percentage++
  }

  /* Family Identity Card */
  if (employeeDetailData?.kk_number) {
    percentage++
  }
  if (employeeDetailData?.kk_path.length > 0) {
    percentage++
  }

  /* Health Insurance */
  if (employeeDetailData?.health_insurance_number) {
    percentage++
  }
  if (employeeDetailData?.health_insurance_path.length > 0) {
    percentage++
  }

  /* CV */
  if (employeeDetailData?.cv_title) {
    percentage++
  }
  if (employeeDetailData?.cv_path.length > 0) {
    percentage++
  }

  /* Recruitment Documents */
  if (employeeDetailData?.recruitment_documents_title) {
    percentage++
  }
  if (employeeDetailData?.recruitment_documents_path.length > 0) {
    percentage++
  }

  return percentage
}
const paymentDataFiltration = (employeeDetailData: Employee) => {
  let percentage = 0

  if (employeeDetailData?.bank_name) {
    percentage++
  }
  if (employeeDetailData?.bank_branch) {
    percentage++
  }
  if (employeeDetailData?.bank_acc_number) {
    percentage++
  }
  if (employeeDetailData?.bank_acc_name) {
    percentage++
  }
  if (employeeDetailData?.swift_code) {
    percentage++
  }
  if (employeeDetailData?.bank_path.length > 0) {
    percentage++
  }

  return percentage
}
