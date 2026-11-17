import { programApi } from '@/utils/apiRequestHelper'
import { ProgramDetail } from '@sdk'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AvailableForms = 'aboutProgram'

export interface AddProgramFormWizardProps {
  identifier: string
  status: boolean
  percentage: number
}

export interface ContextProps {
  stepFormWizardHistory: AddProgramFormWizardProps[]
  formWizardCurrentState: AvailableForms
  handleFormWizardHistory: (
    currentIndetifier: AvailableForms,
    nextIndetifier: AvailableForms,
    totalPercentage: number,
    isReset?: boolean,
  ) => void
}

export const ABOUT_PROGRAM_TOTAL_PAGE = 13

const WIZARD_HISTORY_DEFAULT_VALUE = [
  {
    identifier: 'aboutProgram',
    status: false,
    percentage: 0,
  },
]

const FormWizardContext = createContext<ContextProps | null>(null)

export const useAddProgramFormWizardProvider = () => useContext(FormWizardContext)

export const AddProgramFormWizardProvider = ({ children }) => {
  const router = useRouter()
  const [stepFormWizardHistory, setStepFormWizardHistory] =
    useState<AddProgramFormWizardProps[]>(WIZARD_HISTORY_DEFAULT_VALUE)
  const [formWizardCurrentState, setFormWizardCurrentState] = useState<AvailableForms>('aboutProgram')

  const [programDetailDraftData, setProgramDetailDraftData] = useState<ProgramDetail | null>(null)

  const handleFormWizardHistory = (
    currentIndetifier: AvailableForms,
    nextIndetifier: AvailableForms,
    totalPercentage: number,
  ) => {
    const exec = async () => {
      let programDetailResponse = null
      if (router?.query?.id) {
        programDetailResponse = await programApi.programControllerGetProgramDetail(router.query.id as string)
      } else {
        programDetailResponse = await programApi.programControllerGetProgramDetailDraftedByUserLogedIn()
      }

      const programDetail = programDetailResponse.data.data as ProgramDetail

      let percentage = null

      switch (currentIndetifier) {
        case 'aboutProgram':
          percentage = aboutProgramFiltration(programDetail)
          break
        default:
          break
      }

      setFormWizardCurrentState(nextIndetifier)

      const filterDuplicateId = stepFormWizardHistory.filter((item) => item.identifier !== currentIndetifier)

      const insertedNewValue = [
        ...filterDuplicateId,
        {
          identifier: currentIndetifier,
          status: true,
          percentage: (percentage / totalPercentage) * 100,
        },
      ]

      setStepFormWizardHistory(insertedNewValue)

      const formCalculation = insertedNewValue.reduce((accum, item) => accum + item.percentage, 0)

      const percentageFormCalculation = ((Number(formCalculation) / 100) * 100).toFixed(0)

      if (programDetail?.id) {
        await programApi.programControllerUpdateProgram(programDetail?.id, {
          ...programDetail,
          code: programDetail?.program_code,
          partner_code: programDetail?.partner.code,
          estimated_budget: programDetail?.estimated_budget_value, // inconsistence name property between POST and PUT
          grant_manager: programDetail?.grant_manager.id,
          program_manager: programDetail?.program_manager.id,
          program_officer: programDetail?.program_officer.id,
          budget_controller: programDetail?.budget_controller.id,
          form_progress: Number(percentageFormCalculation),
          form_state: String(JSON.stringify(insertedNewValue)),
          program_ownership_type: 'PROGRAM',
        })
      }
    }
    exec()
  }

  useEffect(() => {
    if (programDetailDraftData && programDetailDraftData?.form_state) {
      setStepFormWizardHistory(JSON.parse(programDetailDraftData?.form_state))
    }
  }, [programDetailDraftData])

  useEffect(() => {
    const exec = async () => {
      if (router?.query?.id) {
        const result = await programApi.programControllerGetProgramDetail(router.query.id as string)
        setProgramDetailDraftData(result.data.data)
      } else {
        const result = await programApi.programControllerGetProgramDetailDraftedByUserLogedIn()
        setProgramDetailDraftData(result.data.data)
      }
    }
    exec()

    setTimeout(() => {
      exec()
    }, 600)
  }, [router])

  const contextValue: ContextProps = useMemo(
    () => ({
      stepFormWizardHistory,
      formWizardCurrentState,
      handleFormWizardHistory,
    }),
    [stepFormWizardHistory, formWizardCurrentState, handleFormWizardHistory],
  )

  return <FormWizardContext.Provider value={contextValue}>{children}</FormWizardContext.Provider>
}

const aboutProgramFiltration = (programDetailData: ProgramDetail) => {
  let percentage = 0

  if (programDetailData?.partner.name) {
    percentage++
  }
  if (programDetailData?.program_name) {
    percentage++
  }
  if (programDetailData?.program_description) {
    percentage++
  }
  if (programDetailData?.estimated_budget) {
    percentage++
  }
  if (programDetailData?.grant_manager.full_name) {
    percentage++
  }
  if (programDetailData?.program_manager.full_name) {
    percentage++
  }
  if (programDetailData?.program_officer.full_name) {
    percentage++
  }
  if (programDetailData?.timeline.start_date.month) {
    percentage++
  }
  if (programDetailData?.timeline.start_date.year) {
    percentage++
  }
  if (programDetailData?.timeline.end_date.month) {
    percentage++
  }
  if (programDetailData?.timeline.end_date.year) {
    percentage++
  }
  if (programDetailData?.contract.contract_number) {
    percentage++
  }
  if (programDetailData?.contract.contract_path.length > 0) {
    percentage++
  }

  return percentage
}
