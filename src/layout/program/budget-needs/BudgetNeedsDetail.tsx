import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { SafeHtml } from '@/components/SafeHtml'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { Input } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { ArrowRightIcon } from '@/components/icon/ArrowRightIcon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { Mail02Icon } from '@/components/icon/Mail02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { RefreshCCW03Icon } from '@/components/icon/RefreshCw03Icon'
import { Save01Icon } from '@/components/icon/Save01Icon'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import ProgramRoleAccessControlProvider, { accessActionType, programTasks } from '@/providers/ProgramRoleAccessControl'
import { theme } from '@/types/themes'
import { decideProgramBudgetRevision, programApi } from '@/utils/apiRequestHelper'
import {
  calculateTotalBudget,
  formatCurrency,
  isMoreThan24Hours,
  programDataBadgeColor,
  programDataBadgeStatus,
} from '@/utils/globalHelper'
import { Log } from '@sdk'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  BudgetProgramProjectListResponse,
  ProgramDetail,
  ProgramDetailApprovalEnum,
  ProgramPerdiemSettings,
  ProgramReviseBudgetDocs,
  ProgramStatus,
} from 'sdk/api'
import { BudgetNeedsList } from './BudgetNeedsList'
import { BudgetInfoDropdown } from './components/BudgetInfoDropdown'
import { BudgetStatusCard } from './components/BudgetStatusCard'
import { WarningAlert } from './components/WarningAlert'
import {
  BUTTON_LABELS,
  DRAWER_TITLES,
  EMPTY_STATE_MESSAGES,
  MODAL_TITLES,
  ROUTER_REPLACE_DELAY,
  TOAST_MESSAGES,
  WARNING_MESSAGES,
} from './constants'
import { useAvatarFetcher } from './hooks/useAvatarFetcher'
import { useBudgetCalculations } from './hooks/useBudgetCalculations'
import { useLoadingState } from './hooks/useLoadingState'
import { RoleDefinition } from '@/shared/role.access'

dayjs.extend(utc)
dayjs.extend(relativeTime)

type Props = {
  slugIdentifier: string[]
  logProgram: Log[]
  totalFundReceived: number
  perdiemSettingData: ProgramPerdiemSettings
  budgetNeedsData: BudgetProgramProjectListResponse
  programData: ProgramDetail
  triggerCollection: () => void
  isProgramMutating: boolean
}
type ModalStatement = {
  declineBudget: boolean
}

export const BudgetNeedsDetail = ({
  slugIdentifier,
  logProgram,
  totalFundReceived,
  perdiemSettingData,
  budgetNeedsData,
  programData,
  triggerCollection,
  isProgramMutating,
}: Props) => {
  const { isInternal } = useDashboardContext()
  const router = useRouter()
  const budgetRevisionStatus = (programData as any)?.budget_revision_status as string | undefined

  // Custom hooks
  const { loadingState, setLoading } = useLoadingState()
  const { totalProgramBudget } = useBudgetCalculations(budgetNeedsData)

  const budgetApprovalPhoto = isInternal
    ? programData?.head_operation?.employee_pass_photo
    : programData?.grant_manager?.pass_photo_path?.[0]

  const budgetApprovalAvatar = useAvatarFetcher(budgetApprovalPhoto)

  const budgetApprovalName = isInternal ? programData?.head_operation?.name : programData?.grant_manager?.full_name

  const budgetApprovalRole = isInternal ? 'General Manager' : 'Grant Manager'

  // Avatar URLs using custom hook
  const programOfficerPhoto =
    programData?.program_officer?.pass_photo_path?.[0] || programData?.created_by?.employee_pass_photo
  const programOfficerAvatar = useAvatarFetcher(programOfficerPhoto)

  const generalManagerPhoto =
    (programData as any)?.general_manager?.employee_pass_photo?.[0] ||
    (programData as any)?.general_manager?.pass_photo_path?.[0]

  const grantManagerPhoto = programData?.grant_manager?.pass_photo_path?.[0]
  const generalManagerAvatar = useAvatarFetcher(generalManagerPhoto)

  const grantManagerAvatar = useAvatarFetcher(grantManagerPhoto)
  // Local state
  const [isBudgetExist, setIsBudgetExist] = useState<boolean | null>(null)
  const [isOpenModal, setIsOpenModal] = useState<ModalStatement>({
    declineBudget: false,
  })
  const [perdiemSettingDrawer, setPerdiemSettingDrawer] = useState<boolean>(false)
  const [viewRejectionDrawer, setViewRejectionDrawer] = useState<boolean>(false)
  const [viewRevisedDrawer, setViewRevisedDrawer] = useState<boolean>(false)
  const [viewReviseBudgetDrawer, setViewReviseBudgetDrawer] = useState(false)
  const [isRevisionDecisionLoading, setIsRevisionDecisionLoading] = useState(false)

  const {
    register: registerDeclineBudget,
    handleSubmit: handleSubmitDeclineBudget,
    formState: { errors: errorsDeclineBudget },
  } = useForm<ProgramStatus>()

  const {
    register,
    control: controlPerdiemSetting,
    setValue: setValuePerdiemSetting,
  } = useForm<ProgramPerdiemSettings>()

  /**
   * Handles the budget approval submission process.
   * Validates revision amounts if applicable and submits the budget for approval.
   */
  const budgetApprovalTrigger = async () => {
    setLoading('submitBudgetNeeds', true)

    if (budgetRevisionStatus === 'APPROVED') {
      let maxTotalProject = 0
      let existingTotal = 0

      budgetNeedsData.projects.forEach((project) => {
        project.activities.forEach((activity) => {
          activity.budgets.forEach((budget) => {
            existingTotal += budget.qty * budget.pkg_qty * budget.unit_cost_value
          })
        })
      })

      if (programData.revise_amount === 0) {
        maxTotalProject = existingTotal
      } else {
        maxTotalProject = programData.revise_amount
      }

      if (existingTotal !== maxTotalProject) {
        const existingTotalFormatted = formatCurrency('IDR', existingTotal)
        const maxTotalFormatted = formatCurrency('IDR', maxTotalProject)

        const message =
          existingTotal < maxTotalProject
            ? TOAST_MESSAGES.REVISION_MISMATCH_LOWER(existingTotalFormatted, maxTotalFormatted)
            : TOAST_MESSAGES.REVISION_MISMATCH_HIGHER(existingTotalFormatted, maxTotalFormatted)

        toast.warning(message, {
          autoClose: 5000,
          icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        })
        setLoading('submitBudgetNeeds', false)
        return false
      }
    }

    const approvalResponse = programApi.programControllerSubmitBudget(slugIdentifier[0], {} as ProgramReviseBudgetDocs)

    toast.promise(approvalResponse, {
      pending: TOAST_MESSAGES.SUBMITTING_BUDGET,
      success: TOAST_MESSAGES.BUDGET_SUBMITTED,
      error: TOAST_MESSAGES.PROMISE_REJECTED,
    })

    approvalResponse.then(() => {
      router.replace(router.asPath)
    })

    approvalResponse.finally(() => {
      triggerCollection()
      setLoading('submitBudgetNeeds', false)
    })
  }

  /**
   * Approves or rejects a budget based on the provided status.
   * @param status - The approval status to set for the budget
   */
  const approveBudget = async (status: string) => {
    setLoading('approvalBudget', true)
    const approvalResponse = programApi.programControllerApprovalProgram(slugIdentifier[0], {
      status,
      notes: '',
    } as ProgramStatus)

    toast.promise(approvalResponse, {
      pending: TOAST_MESSAGES.SUBMITTING_BUDGET,
      success: TOAST_MESSAGES.BUDGET_SUBMITTED,
      error: TOAST_MESSAGES.PROMISE_REJECTED,
    })

    approvalResponse.then(() => {
      setTimeout(() => {
        router.replace(router.asPath)
      }, ROUTER_REPLACE_DELAY)
    })

    approvalResponse.finally(() => {
      triggerCollection()
      setLoading('approvalBudget', false)
    })
  }

  /**
   * Handles the budget decline/rejection with notes.
   * @param input - Form input containing the rejection notes
   */
  const declineBudgetHandler: SubmitHandler<ProgramStatus> = async (input) => {
    setLoading('declineBudget', true)

    const approvalResponse = programApi.programControllerApprovalProgram(slugIdentifier[0], {
      status: ProgramDetailApprovalEnum.Rejected.toString(),
      notes: input.notes,
    } as ProgramStatus)

    toast.promise(approvalResponse, {
      pending: TOAST_MESSAGES.DECLINING_BUDGET,
      success: TOAST_MESSAGES.BUDGET_DECLINED,
      error: TOAST_MESSAGES.PROMISE_REJECTED,
    })

    approvalResponse.then(() => {
      router.replace(router.asPath)
      closeDeclineBudget()
    })

    approvalResponse.finally(() => {
      triggerCollection()
      setLoading('declineBudget', false)
    })
  }

  const decideRevisionRequest = async (status: 'approved' | 'rejected') => {
    let notes = ''
    if (status === 'rejected') {
      const enteredReason = window.prompt('Reason for rejecting the Budget Needs revision:')
      if (!enteredReason?.trim()) return
      notes = enteredReason.trim()
    }
    setIsRevisionDecisionLoading(true)
    try {
      await toast.promise(decideProgramBudgetRevision(slugIdentifier[0], status, notes), {
        pending: status === 'approved' ? 'Approving revision request' : 'Rejecting revision request',
        success: status === 'approved' ? 'Revision request approved' : 'Revision request rejected',
        error: TOAST_MESSAGES.PROMISE_REJECTED,
      })
      setViewRevisedDrawer(false)
      await router.replace(router.asPath)
      triggerCollection()
    } catch {
      // toast.promise displays the API error; keep the drawer open to allow retry.
    } finally {
      setIsRevisionDecisionLoading(false)
    }
  }

  const openReviseBudget = () => {
    setViewReviseBudgetDrawer(true)
  }

  const openPerdiemSettingDrawer = () => {
    setPerdiemSettingDrawer(true)
  }

  const closePerdiemSettingDrawer = useCallback(() => {
    setPerdiemSettingDrawer(false)
  }, [])

  const openRejectionDrawer = () => {
    setViewRejectionDrawer(true)
  }

  const closeRejectionDrawer = useCallback(() => {
    setViewRejectionDrawer(false)
  }, [])

  const openRevisedDrawer = () => {
    setViewRevisedDrawer(true)
  }

  const closeRevisedDrawer = useCallback(() => {
    setViewRevisedDrawer(false)
  }, [])

  const openDeclineBudget = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      declineBudget: true,
    }))
  }

  const closeDeclineBudget = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      declineBudget: false,
    }))
  }

  useEffect(() => {
    const isEmptyBudgets = budgetNeedsData?.projects.every((project) =>
      project.activities.every((activity) => activity.budgets.length === 0),
    )
    setIsBudgetExist(!isEmptyBudgets)
  }, [budgetNeedsData])

  useEffect(() => {
    if (perdiemSettingData?.base_value_normal) {
      setValuePerdiemSetting('base_value_normal', perdiemSettingData?.base_value_normal)
      setValuePerdiemSetting('base_value_overseas', perdiemSettingData?.base_value_overseas)
      setValuePerdiemSetting('base_value_remote_area', perdiemSettingData?.base_value_remote_area)
      setValuePerdiemSetting('travel_perdiem', perdiemSettingData?.travel_perdiem)
      setValuePerdiemSetting('activity_perdiem', perdiemSettingData?.activity_perdiem)
      setValuePerdiemSetting(
        'travel_expense_percentages.breakfast',
        perdiemSettingData?.travel_expense_percentages.breakfast,
      )
      setValuePerdiemSetting('travel_expense_percentages.lunch', perdiemSettingData?.travel_expense_percentages.lunch)
      setValuePerdiemSetting('travel_expense_percentages.dinner', perdiemSettingData?.travel_expense_percentages.dinner)
      setValuePerdiemSetting(
        'travel_expense_percentages.non_overnight',
        perdiemSettingData?.travel_expense_percentages.non_overnight,
      )
      setValuePerdiemSetting(
        'travel_expense_percentages.travel_days',
        perdiemSettingData?.travel_expense_percentages.travel_days,
      )
      setValuePerdiemSetting('note', perdiemSettingData?.note)
    }
  }, [perdiemSettingData])

  useEffect(() => {
    triggerCollection()
  }, [])

  if (!budgetNeedsData || !programData || isBudgetExist === null || isProgramMutating) {
    return <></>
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between border-b border-b-gray-200 pb-6',
          programData.approval !== null &&
            programData.approval !== 'revision' &&
            programData.approval !== 'rejected' &&
            programData.approval !== 'cancelled' &&
            programData.approval !== 'pending'
            ? 'mb-0'
            : 'mb-6',
        )}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Budget Needs</h2>
          {budgetRevisionStatus === 'PENDING' ? (
            <span className="text-amber-700 text-sm font-semibold">Revision request pending approval</span>
          ) : budgetRevisionStatus === 'REJECTED' ? (
            <span className="text-red-700 text-sm font-semibold">Revision request rejected</span>
          ) : null}
        </div>
        <div className="inline-flex items-center gap-3">
          {programData.approval !== null &&
          programData.approval !== 'revision' &&
          programData.approval !== 'rejected' &&
          programData.approval !== 'cancelled' ? (
            <>
              {programData.approval !== 'success' ? (
                <ProgramRoleAccessControlProvider
                  programId={slugIdentifier[0]}
                  task={programTasks.APPROVE_BUDGET_NEED}
                  action={accessActionType.CREATE}
                >
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="error-secondary"
                    onClick={openDeclineBudget}
                  >
                    {BUTTON_LABELS.DECLINE_BUDGET}
                  </Button>

                  <Button
                    onClick={() => {
                      approveBudget(ProgramDetailApprovalEnum.Success.toString())
                    }}
                    type="submit"
                    btnType="normal"
                    size="md"
                    variant="primary"
                    isLoading={loadingState.approvalBudget}
                  >
                    {BUTTON_LABELS.APPROVE_BUDGET}
                  </Button>
                </ProgramRoleAccessControlProvider>
              ) : null}
              {budgetRevisionStatus === 'PENDING' || budgetRevisionStatus === 'REJECTED' ? (
                <ProgramRoleAccessControlProvider
                  programId={slugIdentifier[0]}
                  task={programTasks.VIEW_REVISED_PROJECT_MESSAGE}
                  action={accessActionType.READ}
                >
                  <Button type="button" btnType="normal" size="md" variant="secondary-gray" onClick={openRevisedDrawer}>
                    <Mail02Icon className="h-5 w-5 stroke-gray-700" />
                    View Revision Request
                  </Button>
                </ProgramRoleAccessControlProvider>
              ) : null}
            </>
          ) : (
            <>
              {isBudgetExist ? (
                <>
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="secondary-gray"
                    onClick={openPerdiemSettingDrawer}
                  >
                    {BUTTON_LABELS.PERDIEM_SETTING}
                  </Button>

                  {/* Show rejected message from HoF */}
                  {programData.approval === 'rejected' ? (
                    <ProgramRoleAccessControlProvider
                      programId={slugIdentifier[0]}
                      task={programTasks.VIEW_REJECTED_PAYMENT_MESSAGE}
                      action={accessActionType.READ}
                    >
                      <Button
                        type="button"
                        btnType="normal"
                        size="md"
                        variant="secondary-gray"
                        onClick={openRejectionDrawer}
                      >
                        <Mail02Icon className="h-5 w-5 stroke-gray-700" />
                        {BUTTON_LABELS.VIEW_REJECTION_MESSAGE}
                      </Button>
                    </ProgramRoleAccessControlProvider>
                  ) : null}

                  {programData.approval === 'revision' ? (
                    <>
                      <ProgramRoleAccessControlProvider
                        programId={slugIdentifier[0]}
                        task={programTasks.VIEW_REVISED_PROJECT_MESSAGE}
                        action={accessActionType.READ}
                      >
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={openReviseBudget}
                        >
                          <Mail02Icon className="h-5 w-5 stroke-gray-700" />
                          View Log Activity
                        </Button>
                      </ProgramRoleAccessControlProvider>
                      <ProgramRoleAccessControlProvider
                        programId={slugIdentifier[0]}
                        task={programTasks.VIEW_REVISED_PROJECT_MESSAGE}
                        action={accessActionType.READ}
                      >
                        <Button
                          type="button"
                          btnType="normal"
                          size="md"
                          variant="secondary-gray"
                          onClick={openRevisedDrawer}
                        >
                          <Mail02Icon className="h-5 w-5 stroke-gray-700" />
                          View Revise Request
                        </Button>
                      </ProgramRoleAccessControlProvider>
                    </>
                  ) : null}
                  <ProgramRoleAccessControlProvider
                    programId={slugIdentifier[0]}
                    task={programTasks.EDIT_BUDGET_NEED}
                    action={accessActionType.UPDATE}
                    replaceWith={
                      <Button type="button" btnType="normal" size="md" variant="secondary" disabled>
                        Edit Budget Needs
                      </Button>
                    }
                  >
                    <Link href={`/dashboard/project/${slugIdentifier[0]}/budget-needs`}>
                      <Button btnType="div" size="md" variant="secondary">
                        Edit Budget Needs
                      </Button>
                    </Link>
                  </ProgramRoleAccessControlProvider>
                  <ProgramRoleAccessControlProvider
                    programId={slugIdentifier[0]}
                    task={programTasks.SUBMIT_BUDGET_NEED}
                    action={accessActionType.SUBMIT}
                    replaceWith={
                      <Button type="button" btnType="normal" size="md" variant="primary" disabled>
                        Submit Budget Needs
                      </Button>
                    }
                  >
                    <Button type="button" btnType="normal" size="md" variant="primary" onClick={budgetApprovalTrigger}>
                      Submit Budget Needs
                    </Button>
                  </ProgramRoleAccessControlProvider>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* This component is to handle empt state at project & activity tab */}
      {isBudgetExist ? (
        <>
          <div className="my-6 grid grid-cols-3 items-stretch gap-5">
            <div>
              <div className="mb-6 inline-flex items-center gap-3.5 font-extrabold text-gray-500">
                Total Project Budget
                <Badge size="sm" color="transparent" icon="none">
                  x
                </Badge>
              </div>
              <BudgetInfoDropdown
                totalAmount={calculateTotalBudget(budgetNeedsData)}
                widthClass="w-full"
                items={[
                  {
                    label: 'Total Budget Cost',
                    amount: calculateTotalBudget(budgetNeedsData),
                  },
                  {
                    label: 'Total Remaining Budget',
                    amount: totalProgramBudget?.remaining || 0,
                  },
                  {
                    label: 'Total Pending Requested',
                    amount: totalProgramBudget?.pending_requested || 0,
                  },
                  {
                    label: 'Total Payment',
                    amount: totalProgramBudget?.paid_total || 0,
                  },
                  {
                    label: 'Total Fund Received',
                    amount: totalFundReceived,
                  },
                ]}
              />
            </div>
            <BudgetStatusCard
              title="Submitted Status"
              badgeColor={programDataBadgeColor(programData.approval)}
              badgeText={programDataBadgeStatus(programData.approval)}
              avatarUrl={programOfficerAvatar}
              userName={isInternal ? programData?.created_by?.name : programData?.program_officer?.full_name}
              userRole={isInternal ? 'Created By' : 'Program Officer'}
              statusText="(Wait for the budget to be submitted)"
              timestamp={
                programData.approval === null ||
                programData.approval === 'revision' ||
                programData.approval === 'rejected'
                  ? null
                  : programData.submitted_at
              }
            />
            <BudgetStatusCard
              title="Approval Status"
              badgeColor={
                {
                  success: 'success',
                  pending: 'warning',
                  rejected: 'error',
                }[programData.approval] || 'blue'
              }
              badgeText={
                {
                  success: 'Approved',
                  pending: 'Pending Approval',
                  rejected: 'Rejected',
                }[programData.approval] || 'Waiting'
              }
              avatarUrl={budgetApprovalAvatar}
              userName={budgetApprovalName}
              userRole={isInternal ? 'General Manager' : 'Grant Manager'}
              statusText={programData.approval === 'success' ? '' : '(Wait for the budget to be submitted)'}
              timestamp={
                programData.approval === null ||
                programData.approval === 'revision' ||
                programData.approval === 'rejected'
                  ? null
                  : programData.approval === 'success'
                  ? programData.approved_at
                  : null
              }
            />
          </div>
          {totalFundReceived < totalProgramBudget?.pending_requested + totalProgramBudget?.paid_total ? (
            <WarningAlert
              title={WARNING_MESSAGES.FUND_INSUFFICIENT_TITLE}
              description={WARNING_MESSAGES.FUND_INSUFFICIENT_DESCRIPTION}
            />
          ) : null}

          <BudgetNeedsList slugIdentifier={slugIdentifier} approval={programData.approval} />
        </>
      ) : (
        <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-10 text-center">
          <Image
            src={`${process.env.NEXT_PUBLIC_ASSETS}/svg/cloud-illustration.svg`}
            width={152}
            height={118}
            alt={`${process.env.NEXT_PUBLIC_ASSETS}/svg/cloud-illustration.svg`}
            className="mx-auto mb-4"
          />
          <h6 className="mx-auto mb-1 w-52 text-base font-semibold text-gray-900">
            {budgetNeedsData.projects.length === 0 && EMPTY_STATE_MESSAGES.NO_ACTIVITY}
            {budgetNeedsData.projects.length > 0 &&
              budgetNeedsData.projects.every((project) =>
                project.activities.every((activity) => activity.budgets.length === 0),
              ) &&
              EMPTY_STATE_MESSAGES.ACTIVITY_NO_BUDGET}
          </h6>
          <p className="mx-auto mb-6 w-[22rem] text-sm text-gray-600">
            {budgetNeedsData.projects.length === 0 && EMPTY_STATE_MESSAGES.NO_ACTIVITY_DESCRIPTION}
            {budgetNeedsData.projects.length > 0 &&
              budgetNeedsData.projects.every((project) =>
                project.activities.every((activity) => activity.budgets.length === 0),
              ) &&
              EMPTY_STATE_MESSAGES.NO_BUDGET_DESCRIPTION}
          </p>
          {budgetNeedsData.projects.length === 0 ? (
            <ProgramRoleAccessControlProvider
              programId={slugIdentifier[0]}
              task={programTasks.CREATE_PROJECT_ACTIVITY}
              action={accessActionType.CREATE}
              replaceWith={
                <Button disabled type="button" btnType="normal" size="md" variant="primary" className="mx-auto">
                  Add Activity Section
                </Button>
              }
            >
              <Link href={`/dashboard/project/${slugIdentifier[0]}/activity`} className="inline-block">
                <Button btnType="div" size="md" variant="primary" className="mx-auto">
                  Add Activity Section
                  <ArrowRightIcon className="h-5 w-5 stroke-white" />
                </Button>
              </Link>
            </ProgramRoleAccessControlProvider>
          ) : null}

          {budgetNeedsData.projects.length > 0 &&
            budgetNeedsData.projects.every((project) =>
              project.activities.every((activity) => activity.budgets.length === 0),
            ) && (
              <ProgramRoleAccessControlProvider
                programId={slugIdentifier[0]}
                task={programTasks.ADD_BUDGET_NEED}
                action={accessActionType.CREATE}
                replaceWith={
                  <Button type="button" btnType="normal" size="md" variant="primary" className="mx-auto" disabled>
                    <PlusIcon className="h-5 w-5 stroke-white" />
                    Budget Needs Form
                  </Button>
                }
              >
                <Link href={`/dashboard/project/${slugIdentifier[0]}/budget-needs`} className="inline-block">
                  <Button btnType="div" size="md" variant="primary">
                    <PlusIcon className="h-5 w-5 stroke-white" />
                    Budget Needs Form
                  </Button>
                </Link>
              </ProgramRoleAccessControlProvider>
            )}
        </div>
      )}

      {/* Decline budget */}
      <Modal
        icon={<Save01Icon className="h-6 w-6 stroke-warning-600" />}
        theme={theme.WARNING}
        modalTitle={MODAL_TITLES.REJECT_REQUEST}
        modalDescription={MODAL_TITLES.REJECT_DESCRIPTION}
        stateModal={isOpenModal.declineBudget}
        handleCloseModal={closeDeclineBudget}
      >
        <form className="mt-6" onSubmit={handleSubmitDeclineBudget(declineBudgetHandler)}>
          <textarea
            {...registerDeclineBudget('notes', {
              required: 'Message is required field',
            })}
            id="decline-budget-notes"
            className={cn(
              'form-textarea w-full resize-none rounded-lg border px-3.5 py-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
              errorsDeclineBudget.notes
                ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
                : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
            )}
            rows={5}
            placeholder="Enter a message..."
          ></textarea>
          {errorsDeclineBudget.notes && (
            <span className="input-hint-text error">{errorsDeclineBudget.notes?.message}</span>
          )}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeDeclineBudget}
            >
              {BUTTON_LABELS.CANCEL}
            </Button>
            <Button
              type="submit"
              btnType="normal"
              variant="primary"
              className="w-full justify-center"
              size="lg"
              isLoading={loadingState.declineBudget}
            >
              {BUTTON_LABELS.CONFIRM}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Activity */}
      <Drawer
        isOpen={viewReviseBudgetDrawer}
        setIsOpen={setViewReviseBudgetDrawer}
        title={DRAWER_TITLES.LOG_ACTIVITY}
        description={programData.program_name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        usingFooter={false}
        drawerWidth="w-[28rem]"
      >
        <div id="log-activity-container">
          {logProgram?.map((log) => (
            <div key={log.created_at} className="log-activity-card relative flex items-start gap-3">
              <div className="shrink-0">
                <Image
                  className="h-12 w-12 rounded-full object-cover"
                  src={log.user['avatar_url']}
                  alt={log.user.employee_pass_photo}
                  width={48}
                  height={48}
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-700">{log.user.name}</p>
                  <p className="text-xs text-gray-600">
                    {isMoreThan24Hours(log?.created_at)
                      ? dayjs(log?.created_at).local().format('dddd, DD MMM YYYY - HH:mm')
                      : dayjs(log?.created_at).local().fromNow()}
                  </p>
                </div>
                <SafeHtml className="render-html text-sm text-gray-600" html={log.message} />
                {log.body ? <p className="mt-3 text-sm text-gray-600">“{log.body}”</p> : null}
              </div>
              <span className="absolute right-0 top-0 hidden h-2.5 w-2.5 rounded-full bg-success-500"></span>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Show message rejected budgetNeeds */}
      <Drawer
        drawerWidth="w-[28rem]"
        isOpen={viewRejectionDrawer}
        setIsOpen={setViewRejectionDrawer}
        title={DRAWER_TITLES.REJECTION_MESSAGE}
        description={programData.program_name}
        icon={<Mail02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button type="button" btnType="normal" variant="secondary-gray" size="md" onClick={closeRejectionDrawer}>
              Cancel
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2">
            <div>
              <label className="input-label">Rejected By</label>
              <p className="text-lg font-semibold text-gray-900">
                {isInternal ? 'General Manager' : programData?.grant_manager?.full_name}
              </p>
            </div>
            <div>
              <label className="input-label">Position</label>
              <p className="text-lg font-semibold text-gray-900">{isInternal ? 'General Manager' : 'Grant Manager'}</p>
            </div>
          </div>
          <div>
            <label className="input-label">Time of Rejection</label>
            <p className="text-lg font-semibold text-gray-900">
              {programData.approved_at ? dayjs(programData.approved_at).format('dddd, DD MMMM YYYY - HH:mm') : null}
            </p>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">Message</label>
            <p className="text-gray-900">{programData.approval_note}</p>
          </div>
        </div>
      </Drawer>

      {/* Show message revised budgetNeeds */}
      <Drawer
        drawerWidth="w-[28rem]"
        isOpen={viewRevisedDrawer}
        setIsOpen={setViewRevisedDrawer}
        title={DRAWER_TITLES.REVISE_REQUEST}
        description={programData.program_name}
        icon={<RefreshCCW03Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button type="button" btnType="normal" variant="secondary-gray" size="md" onClick={closeRevisedDrawer}>
              Cancel
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2">
            <div>
              <label className="input-label">Requested by</label>
              <p className="text-lg font-semibold text-gray-900">
                {(programData as any)?.budget_revision_requested_by?.full_name ||
                  (isInternal ? programData.created_by?.name : programData.program_officer?.full_name) ||
                  programData.program_manager?.full_name ||
                  '-'}
              </p>
            </div>
            <div>
              <label className="input-label">Position</label>
              <p className="text-lg font-semibold text-gray-900">{isInternal ? 'Created By' : 'Program Officer'}</p>
            </div>
          </div>
          <div>
            <label className="input-label">Time of Request</label>
            <p className="text-lg font-semibold text-gray-900">
              {programData.budget_revision_requested_at
                ? dayjs(programData.budget_revision_requested_at).format('dddd, DD MMMM YYYY - HH:mm')
                : null}
            </p>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">Document</label>
            <FilePreview fileName={programData.revise_approval_doc?.[0]} />
          </div>
          <div>
            <label className="input-label">Message</label>
            <p className="text-gray-900">{programData.budget_revision_note}</p>
          </div>
          <div>
            <label className="input-label">Total Budget Need</label>
            <p className="text-gray-900">
              {formatCurrency('IDR', programData.revise_amount || calculateTotalBudget(budgetNeedsData))}
            </p>
          </div>

          {budgetRevisionStatus ? (
            <div>
              <label className="input-label">Revision Request Status</label>
              <p className="text-lg font-semibold text-gray-900">
                {budgetRevisionStatus === 'PENDING'
                  ? 'Pending Approval'
                  : budgetRevisionStatus === 'APPROVED'
                  ? 'Approved'
                  : budgetRevisionStatus === 'REJECTED'
                  ? 'Rejected'
                  : budgetRevisionStatus === 'COMPLETED'
                  ? 'Completed'
                  : '-'}
              </p>
            </div>
          ) : null}
          {budgetRevisionStatus === 'PENDING' ? (
            <ProgramRoleAccessControlProvider
              programId={slugIdentifier[0]}
              task={programTasks.APPROVE_BUDGET_NEED}
              action={accessActionType.CREATE}
            >
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  btnType="normal"
                  variant="error-secondary"
                  size="md"
                  disabled={isRevisionDecisionLoading}
                  onClick={() => decideRevisionRequest('rejected')}
                >
                  Reject Revision
                </Button>
                <Button
                  type="button"
                  btnType="normal"
                  variant="primary"
                  size="md"
                  isLoading={isRevisionDecisionLoading}
                  onClick={() => decideRevisionRequest('approved')}
                >
                  Approve Revision
                </Button>
              </div>
            </ProgramRoleAccessControlProvider>
          ) : null}
        </div>
      </Drawer>

      {/* Perdiem Setting Drawer */}
      <Drawer
        drawerWidth="w-[28rem]"
        isOpen={perdiemSettingDrawer}
        setIsOpen={setPerdiemSettingDrawer}
        title={DRAWER_TITLES.PERDIEM_SETTING}
        description={programData.program_name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closePerdiemSettingDrawer}
            >
              Cancel
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="base_value_normal" className="input-label">
              Perdiem Base Value
            </label>
            <p className="text-xs text-gray-700">This will serve as Unit Cost of Perdiem.</p>
          </div>
          {/* Perdiem: Normal */}
          <div className="flex flex-col gap-3">
            <div>
              <div>
                <label htmlFor="base_value_normal" className="input-label">
                  Perdiem: Normal
                </label>
              </div>
              <Controller
                control={controlPerdiemSetting}
                name="base_value_normal"
                rules={{
                  required: 'Perdiem base value is required field',
                  min: {
                    value: 0,
                    message: 'Perdiem base value must be greater than 0',
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <div className="mx-2 flex items-center gap-2">
                    <p className="text-gray-500">Rp</p>
                    <Input
                      readonly
                      type="number"
                      id="base_value_normal"
                      placeholder="0"
                      isCurrency={true}
                      onChange={onChange}
                      value={value || ''}
                      error={invalid}
                      className="flex-1"
                    />
                  </div>
                )}
              />
            </div>
            {/* Perdiem: Luar Negeri */}
            <div>
              <div>
                <label htmlFor="base_value_remote_area" className="input-label">
                  Perdiem: Pelosok
                </label>
              </div>
              <Controller
                control={controlPerdiemSetting}
                name="base_value_remote_area"
                rules={{
                  required: 'Perdiem base value is required field',
                  min: {
                    value: 0,
                    message: 'Perdiem base value must be greater than 0',
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <div className="mx-2 flex items-center gap-2">
                    <p className="text-gray-500">Rp</p>
                    <Input
                      readonly
                      type="number"
                      id="base_value_remote_area"
                      placeholder="0"
                      isCurrency={true}
                      onChange={onChange}
                      value={value || ''}
                      error={invalid}
                      className="flex-1"
                    />
                  </div>
                )}
              />
            </div>
            {/* Perdiem: Luar Negeri */}
            <div>
              <div>
                <label htmlFor="base_value_overseas" className="input-label">
                  Perdiem: Luar Negeri
                </label>
              </div>
              <Controller
                control={controlPerdiemSetting}
                name="base_value_overseas"
                rules={{
                  required: 'Perdiem base value is required field',
                  min: {
                    value: 0,
                    message: 'Perdiem base value must be greater than 0',
                  },
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <div className="mx-2 flex items-center gap-2">
                    <p className="text-gray-500">Rp</p>
                    <Input
                      readonly
                      type="number"
                      id="base_value_overseas"
                      placeholder="0"
                      isCurrency={true}
                      onChange={onChange}
                      value={value || ''}
                      error={invalid}
                      className="flex-1"
                    />
                  </div>
                )}
              />
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label htmlFor="base_value_normal" className="input-label !mb-1">
              Percentage Calculation
            </label>
            <p className="text-xs text-gray-700">This setup relate to Travel Expenses</p>
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.breakfast"
              rules={{
                required: 'Breakfast value is required field',
                min: {
                  value: 0,
                  message: 'Breakfast value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Breakfast value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.breakfast"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Makan Pagi Ditanggung
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.breakfast"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.lunch"
              rules={{
                required: 'Lunch value is required field',
                min: {
                  value: 0,
                  message: 'Lunch value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Lunch value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.lunch"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Makan Siang Ditanggung
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.lunch"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.dinner"
              rules={{
                required: 'Dinner value is required field',
                min: {
                  value: 0,
                  message: 'Dinner value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Dinner value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.dinner"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Makan Malam Ditanggung
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.dinner"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.non_overnight"
              rules={{
                required: 'Non overnight value is required field',
                min: {
                  value: 0,
                  message: 'Non overnight value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Non overnight value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.non_overnight"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Malam Tidak Menginap
                    </label>
                    <p className="text-xs text-gray-700">(Pengurangan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.non_overnight"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div>
            <Controller
              control={controlPerdiemSetting}
              name="travel_expense_percentages.travel_days"
              rules={{
                required: 'Travel days value is required field',
                min: {
                  value: 0,
                  message: 'Travel days value must be greater than 0',
                },
                max: {
                  value: 100,
                  message: 'Travel days value must be less than 100',
                },
              }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <div className="mx-2 flex items-center gap-2">
                  <div className="w-52">
                    <label
                      htmlFor="travel_expense_percentages.travel_days"
                      className="w-24 text-sm font-medium text-gray-700"
                    >
                      Hari Perjalanan
                    </label>
                    <p className="text-xs text-gray-700">(Penambahan dari total Perdiem)</p>
                  </div>
                  <Input
                    readonly
                    type="number"
                    id="travel_expense_percentages.travel_days"
                    placeholder="0"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                    className="w-16"
                  />
                  <p className="text-sm text-gray-700">%</p>
                </div>
              )}
            />
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label htmlFor="note" className="input-label">
              Notes (Optional)
            </label>
            <textarea
              readOnly
              {...register('note')}
              id="note"
              className="textarea-input resize-none"
              rows={5}
              placeholder="Write notes about this perdiem setting"
            ></textarea>
          </div>
        </div>
      </Drawer>
    </>
  )
}
