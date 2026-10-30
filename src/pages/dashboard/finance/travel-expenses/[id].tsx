/* eslint-disable tailwindcss/no-custom-classname */
import { SafeHtml } from '@/components/SafeHtml'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import ProgramRoleAccessControlProvider, { accessActionType, programTasks } from '@/providers/ProgramRoleAccessControl'
import { BucketsEnum } from '@/shared/file.system'
import { PRApprovalBy, PRApprovalStatus, PRFinanceCheckingStatus, PRTypes } from '@/shared/pr.type'
import { RoleDefinition } from '@/shared/role.access'
import { BucketsUnion, DynamicProgressType } from '@/types/global'
import { theme } from '@/types/themes'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { fileApi, getOpenUrl, getPerdiemSetting, paymentRequestApi } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import {
  calculatePureTotalBudget,
  checkIsLoggedInRoleAll,
  dateFormatToISO,
  formatCurrency,
  isMoreThan24Hours,
  slugify,
  titleCase,
} from '@/utils/globalHelper'
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { Log } from '@sdk'
import axios from 'axios'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Controller, FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  EmployeeApi,
  FilesApi,
  MetadataApi,
  PRApprovalStatusRequest,
  PRAttachment,
  PaymentReport,
  PaymentRequestApi,
  PaymentRequestDetail as PaymentRequestDetailType,
  PaymentRequestSimple,
  ProgramApi,
  ProgramDetail,
  RequisitionFormApi,
  RequisitionFormDetail,
} from 'sdk/api'
import useSWRMutation from 'swr/mutation'

dayjs.extend(utc)
dayjs.extend(relativeTime)

const AvatarPlacement: any = dynamic(() => import('@/components/AvatarPlacement').then((mod) => mod.AvatarPlacement))
const Badge: any = dynamic(() => import('@/components/Badge').then((mod) => mod.Badge))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const DatePickerCalendar: any = dynamic(() =>
  import('@/components/DatePickerCalendar').then((mod) => mod.DatePickerCalendar),
)
const Drawer: any = dynamic(() => import('@/components/Drawer').then((mod) => mod.Drawer))
const FilePreview: any = dynamic(() => import('@/components/FilePreview').then((mod) => mod.FilePreview))
const SwitchableUploadField: any = dynamic(() =>
  import('@/components/SwitchableUploadField').then((mod) => mod.SwitchableUploadField),
)
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const Modal: any = dynamic(() => import('@/components/Modal').then((mod) => mod.Modal))
const AlertCircleIcon: any = dynamic(() =>
  import('@/components/icon/AlertCircleIcon').then((mod) => mod.AlertCircleIcon),
)
const AlertTriangleIcon: any = dynamic(() =>
  import('@/components/icon/AlertTriangleIcon').then((mod) => mod.AlertTriangleIcon),
)
const CheckAquareBrokenIcon: any = dynamic(() =>
  import('@/components/icon/CheckAquareBrokenIcon').then((mod) => mod.CheckAquareBrokenIcon),
)
const FileSearch02Icon: any = dynamic(() =>
  import('@/components/icon/FileSearch02Icon').then((mod) => mod.FileSearch02Icon),
)
const LinkExternal02Icon: any = dynamic(() =>
  import('@/components/icon/LinkExternal02Icon').then((mod) => mod.LinkExternal02Icon),
)
const PlusIcon: any = dynamic(() => import('@/components/icon/PlusIcon').then((mod) => mod.PlusIcon))
const Save01Icon: any = dynamic(() => import('@/components/icon/Save01Icon').then((mod) => mod.Save01Icon))
const Trash01Icon: any = dynamic(() => import('@/components/icon/Trash01Icon').then((mod) => mod.Trash01Icon))
const XCloseIcon: any = dynamic(() => import('@/components/icon/XCloseIcon').then((mod) => mod.XCloseIcon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

type Props = {
  programDetail: ProgramDetail
  rfDetail: RequisitionFormDetail
  teDetail: PaymentRequestDetailType
  buttonDisabled: boolean
  buttonHidden: boolean
  authToken: string
  travellerPerdiemTax?: number
  paymentRequestLogs: Log[]
  isHeadOfFinance: boolean
}

type ModalStatement = {
  checkingPaymentRejected: boolean
  deleteConfirmationModal: boolean
  confirmationFinanceCheckerModal: boolean
}

export const TravelExpensesDetail = ({
  programDetail,
  rfDetail,
  teDetail,
  buttonDisabled,
  buttonHidden,
  travellerPerdiemTax,
  paymentRequestLogs,
  isHeadOfFinance,
}: Props) => {
  const router = useRouter()

  const {
    userLoggedinInformation,
    handlePaymentRequestIdentifier,
    handleRequisitionBudgetToPaymentRequest,
    handleProjectToPaymentRequest,
  } = useDashboardContext()

  const breadcrumbUrl = useMemo(() => {
    const allowedRoles = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM, RoleDefinition.SUPERADMIN]
    return allowedRoles.includes(userLoggedinInformation?.role) ? '/dashboard/finance/payment-request' : ''
  }, [userLoggedinInformation])

  const [requestedByAvatar, setRequestedByAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [budgetControllerAvatar, setBudgetControllerAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [programManagerAvatar, setProgramManagerAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [financeTeamPreAvatar, setFinanceTeamPreAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [financeTeamPostAvatar, setFinanceTeamPostAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [additionalAttachmentDrawer, setAdditionalAttachmentDrawer] = useState(false)
  const [bankAccountDrawer, setBankAccountDrawer] = useState(false)
  const [attachments, setAttachments] = useState<PRAttachment[] | null>(null)
  const [apfData, setApfData] = useState<PaymentRequestSimple | null>(null)
  const [perdiemTotal, setPerdiemTotal] = useState<number>(0)
  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    checkingPaymentRejected: false,
    deleteConfirmationModal: false,
    confirmationFinanceCheckerModal: false,
  })
  const [financeProcessAttachmentDrawer, setFinanceProcessAttachmentDrawer] = useState(false)
  const [taxBenchmark, setTaxBenchmark] = useState<number>(0)
  const [viewLogActivityDrawer, setViewLogActivityDrawer] = useState(false)
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    editPayment: boolean
    markAsGoingCheck: boolean
    markAsChecked: boolean
    markProcessedToFinanceProcess: boolean
    unmarkProcessedToFinanceProcess: boolean
    unmarkCheckingPayment: boolean
    PMBCApproval: boolean
    PMBCFinanceRejection: boolean
    deletePayment: boolean
    submitReport: boolean
  }>({
    editPayment: false,
    markAsGoingCheck: false,
    markAsChecked: false,
    markProcessedToFinanceProcess: false,
    unmarkProcessedToFinanceProcess: false,
    unmarkCheckingPayment: false,
    PMBCApproval: false,
    PMBCFinanceRejection: false,
    deletePayment: false,
    submitReport: false,
  })
  const [formFinanceProcessAttachmentDrawer, setFormFinanceProcessAttachmentDrawer] = useState(false)
  const [detailFinanceProcessAttachmentDrawer, setDetailFinanceProcessAttachmentDrawer] = useState(false)
  const [proofOfPayment, setProofOfPayment] = useState([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [totalTaxCalculation, setTotalTaxCalculation] = useState(0)
  const [totalTaxCalculationForOtherLevel, setTotalTaxCalculationForOtherLevel] = useState(0)
  const [totalTaxCalculationForTransportationLevel, setTotalTaxCalculationForTransportationLevel] = useState(0)
  const [spendingDeadline, setSpendingDeadline] = useState<Date | null>(null)
  const [prDetailForm, setPrDetailForm] = useState<PaymentRequestDetailType | null>(null)
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    proof_of_payment_doc: boolean
  }>({
    proof_of_payment_doc: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PRApprovalStatusRequest>()
  const {
    handleSubmit: handleSubmitPaymentReport,
    control: controlPaymentReport,
    setValue: setValuePaymentReport,
    formState: { errors: errorsPaymentReport },
  } = useForm<PaymentReport>()

  const { data: perdiemSettingData, trigger: perdiemSettingTrigger } = useSWRMutation(
    `${programDetail.id}`,
    getPerdiemSetting,
  )

  const handleFinanceCheckingStatus = (value: PRFinanceCheckingStatus) => {
    switch (value) {
      case PRFinanceCheckingStatus.CHECKING:
        setLoadingButtonStatement((prev) => ({
          ...prev,
          markAsGoingCheck: true,
        }))
        break
      case PRFinanceCheckingStatus.CHECKED:
        if (teDetail.number.split('/')[0].toUpperCase() === 'APR') {
          setLoadingButtonStatement((prev) => ({
            ...prev,
            markAsChecked: true,
          }))
        }
        break
    }
    if (teDetail.finance_checking_process_status !== PRFinanceCheckingStatus.CHECKED) {
      if (
        userLoggedinInformation?.role?.some(
          (role) => role === RoleDefinition.FINANCE_TEAM || role === RoleDefinition.HEAD_OF_FINANCE,
        ) ||
        userLoggedinInformation?.role?.includes(RoleDefinition.HEAD_OF_FINANCE) ||
        userLoggedinInformation?.role?.includes(RoleDefinition.HEAD_OF_FINANCE) ||
        userLoggedinInformation?.role?.includes(RoleDefinition.HEAD_OF_FINANCE)
      ) {
        switch (value) {
          case PRFinanceCheckingStatus.CHECKING:
            const ongoingCheckingRequest = paymentRequestApi.pRControllerMarkPaymentRequestOnChecking(teDetail.id)

            toast.promise(ongoingCheckingRequest, {
              pending: `Marking payment request as ongoing check`,
              success: `Payment request marked as ongoing check`,
              error: 'Failed to marking payment request as ongoing check',
            })

            ongoingCheckingRequest.finally(() => {
              router.replace(router.asPath)
              setTimeout(() => {
                setLoadingButtonStatement((prev) => ({
                  ...prev,
                  markAsGoingCheck: false,
                }))
              }, 3000)
            })

            break
          case PRFinanceCheckingStatus.CHECKED:
            if (teDetail.number.split('/')[0].toUpperCase() === 'APR') {
              const ongoingCheckedRequest = paymentRequestApi.pRControllerMarkPaymentRequestCheckingPassed(teDetail.id)

              toast.promise(ongoingCheckedRequest, {
                pending: `Marking payment request as checked`,
                success: `Payment request marked as checked`,
                error: 'Failed to marking payment request as checked',
              })

              ongoingCheckedRequest.finally(() => {
                router.replace(router.asPath)
                setTimeout(() => {
                  setLoadingButtonStatement((prev) => ({
                    ...prev,
                    markAsChecked: false,
                  }))
                }, 3000)
              })
            } else {
              openConfirmationFinanceCheckerModal()
            }

            break
        }
      } else {
        toast.warning('Only finance team can do this action')
      }
    } else {
      if (teDetail.program_manager_approval !== PRApprovalStatus.APPROVED) {
        toast.warning('Payment need to be approved by project manager first')
        return false
      }
    }
  }

  const errorSubmitReport = async (error: FieldErrors<PaymentReport>) => {
    if (error.report_documents || error.payment_date) {
      openFormFinanceProcessAttachmentDrawer()
    }
  }

  const deletePayment = () => {
    setLoadingButtonStatement((prev) => ({ ...prev, deletePayment: true }))
    const deletedPayment = paymentRequestApi.pRControllerDeletePaymentRequest(teDetail.id)

    toast.promise(deletedPayment, {
      pending: 'Deleting payment',
      success: 'Payment deleted successfully',
      error: 'Promise rejected 🤯',
    })

    deletedPayment.finally(() => {
      router.replace('/dashboard/finance/payment-request')

      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({ ...prev, deletePayment: false }))
      }, 3000)
    })
  }

  const openRejectPayment = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      checkingPaymentRejected: true,
    }))
  }

  const closeRejectPayment = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      checkingPaymentRejected: false,
    }))
  }

  const openFormFinanceProcessAttachmentDrawer = () => {
    setFormFinanceProcessAttachmentDrawer(true)
  }
  const openDetailFinanceProcessAttachmentDrawer = () => {
    setDetailFinanceProcessAttachmentDrawer(true)
  }

  const openViewLogActivityDrawer = () => {
    setViewLogActivityDrawer(true)
  }

  const closeFormFinanceProcessAttachmentDrawer = () => {
    setFormFinanceProcessAttachmentDrawer(false)
  }

  const openAdditionalAttachmentDrawer = () => {
    setAdditionalAttachmentDrawer(true)
  }
  const closeAdditionalAttachmentDrawer = () => {
    setAdditionalAttachmentDrawer(false)
  }
  const openBankInformationDrawer = () => {
    setBankAccountDrawer(true)
  }
  const closeBankInformationDrawer = () => {
    setBankAccountDrawer(false)
  }
  const openDeleteConfirmationModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      deleteConfirmationModal: true,
    }))
  }

  const closeDeleteConfirmationModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      deleteConfirmationModal: false,
    }))
  }

  const openConfirmationFinanceCheckerModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      confirmationFinanceCheckerModal: true,
    }))
  }

  const closeConfirmationFinanceCheckerModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      confirmationFinanceCheckerModal: false,
    }))
  }

  const submitReport: SubmitHandler<PaymentReport> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, submitReport: true }))
    let fileNameS3 = ''

    if (!switchTogglableButton.proof_of_payment_doc) {
      const bucketName = BucketsEnum.pr_attachment
      const presignUrl = await fileApi.fileControllerGetPresignUrl(proofOfPayment[0].name, bucketName)

      fileNameS3 = String(presignUrl.data.data).split('::')[0]
      const identifier = 'report_documents'

      await axios.put(String(presignUrl.data.data).split('::')[1], proofOfPayment[0], {
        headers: {
          'Content-Type': proofOfPayment[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })
    }

    const submitValues = {
      payment_date: dateFormatToISO(dayjs(formInput.payment_date).utc().format()),
      report_documents: switchTogglableButton.proof_of_payment_doc
        ? [`${formInput.report_documents}`]
        : [`${BucketsEnum.pr_attachment}/${fileNameS3}`],
    }

    // console.log('submitValues', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, submitReport: false }))
    // return false

    const paymentReport = paymentRequestApi.pRControllerCreatePaymentReport(teDetail.id, submitValues)
    const paymentMarkAsPaid = paymentRequestApi.pRControllerMarkAsPaid(teDetail.id)

    toast.promise(paymentMarkAsPaid, {
      pending: 'Creating finance payment report',
      success: 'Finance payment report created 🎉',
      error: 'Promise rejected 🤯',
    })

    Promise.all([paymentReport, paymentMarkAsPaid]).finally(() => {
      router.replace(router.asPath)
      setLoadingButtonStatement((prev) => ({ ...prev, submitReport: false }))
      closeFormFinanceProcessAttachmentDrawer()
    })
  }

  const rejectPaymentSubmit = async (formInput: PRApprovalStatusRequest) => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      PMBCFinanceRejection: true,
    }))

    const parameter = teDetail.number.split('/')[0].toUpperCase()
    let textMessage = ''

    switch (parameter) {
      case 'APF':
        textMessage = 'Advance Perdiem Fee'
        break
      case 'APR':
        textMessage = 'Advance Payment Request'
        break
      case 'APS':
        textMessage = 'Advance Payment Statement'
        break
      case 'PR':
        textMessage = 'Payment Request'
        break
      case 'TE':
        textMessage = 'Travel Expense'
        break

      default:
        break
    }

    const isFinanceChecker = userLoggedinInformation.employee_id === teDetail.finance_checking_process_by?.id

    if (isFinanceChecker) {
      const rejectPaymentRequest = paymentRequestApi.pRControllerMarkPaymentRequestCheckingNeedRevision(teDetail.id, {
        note: formInput.rejection_note,
      })

      toast.promise(rejectPaymentRequest, {
        pending: `Rejecting ${textMessage.toLowerCase()}`,
        success: `${titleCase(textMessage)} rejected`,
        error: `Failed to reject ${textMessage.toLowerCase()}`,
      })

      rejectPaymentRequest.finally(() => {
        closeRejectPayment()
        router.replace(router.asPath)

        setTimeout(() => {
          setLoadingButtonStatement((prev) => ({
            ...prev,
            PMBCFinanceRejection: false,
          }))
        }, 3000)
      })
    } else {
      const rejectPaymentRequest = paymentRequestApi.pRControllerApprovalPaymentRequest(teDetail.id, {
        approved_by: PRApprovalBy.PM,
        status: PRApprovalStatus.REJECTED,
        rejection_note: formInput.rejection_note,
      })

      toast.promise(rejectPaymentRequest, {
        pending: `Rejecting ${textMessage.toLowerCase()}`,
        success: `${titleCase(textMessage)} rejected`,
        error: `Failed to reject ${textMessage.toLowerCase()}`,
      })

      rejectPaymentRequest.finally(() => {
        closeRejectPayment()
        router.replace(router.asPath)

        setTimeout(() => {
          setLoadingButtonStatement((prev) => ({
            ...prev,
            PMBCFinanceRejection: false,
          }))
        }, 3000)
      })
    }
  }

  const handleTaxInputChange = (
    projectId: string,
    activityId: string,
    budgetId: string,
    event: any,
    otherDynamicId?: string,
  ) => {
    const { name, value } = event.target

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    setPrDetailForm((prevBudgets) => {
      return {
        ...prevBudgets,
        projects: prevBudgets.projects.map((project) => {
          if (project.id === projectId) {
            if (activityId) {
              return {
                ...project,
                activities: project.activities.map((activity) => {
                  if (activity.id === activityId) {
                    if (budgetId) {
                      // Update budget
                      return {
                        ...activity,
                        budgets: activity.budgets.map((budget) => {
                          if (budget.id === budgetId) {
                            if (otherDynamicId) {
                              return {
                                ...budget,
                                additional_data: {
                                  ...(budget['additional_data'] as unknown as object),
                                  detail_other: budget.additional_data?.['detail_other'].map((items) => {
                                    if (items.id === otherDynamicId) {
                                      return {
                                        ...items,
                                        [name]: Number(value),
                                      }
                                    }
                                    return items
                                  }),
                                },
                              }
                            }
                            return { ...budget, [name]: Number(value) }
                          }
                          return budget
                        }),
                      }
                    }
                    // Update activity
                    return { ...activity, [name]: value }
                  }
                  return activity
                }),
              }
            }
            // Update project
            return { ...project, [name]: value }
          }
          return project
        }),
      }
    })
  }

  const handleUpdatePayment = () => {
    const projectBudgetsModified = teDetail.projects

    let filteredActivities = null
    let parameter = teDetail.number.split('/')[0].toUpperCase()

    switch (parameter) {
      case 'APF':
        parameter = PRTypes.APF
        break
      case 'APR':
        parameter = PRTypes.APR
        break
      case 'APS':
        parameter = PRTypes.APS
        break
      case 'PR':
        parameter = PRTypes.PR
        break
      case 'TE':
        parameter = PRTypes.TE
        break

      default:
        break
    }

    if (parameter === PRTypes.APF) {
      filteredActivities = projectBudgetsModified
        .flatMap((project) =>
          project.activities
            .filter((activity) => activity.budgets.some((budget) => budget.id))
            .map((activity) => ({
              ...activity,
              budgets: activity.budgets.filter(
                (budget) =>
                  budget.vendor_category_information.name === 'Overseas Perdiem' ||
                  budget.vendor_category_information.name === 'Normal Perdiem' ||
                  budget.vendor_category_information.name === 'Remote Area Perdiem',
              ),
            })),
        )
        .filter((project) => project.budgets.length > 0)
    }
    if (parameter === PRTypes.TE) {
      filteredActivities = projectBudgetsModified.flatMap((project) =>
        project.activities
          .filter((activity) => activity.budgets.some((budget) => budget.id))
          .map((activity) => ({
            ...activity,
            budgets: activity.budgets.filter((budget) => budget.id),
          })),
      )
    }
    if (parameter === PRTypes.PR || parameter === PRTypes.APR) {
      filteredActivities = projectBudgetsModified.flatMap((project) =>
        project.activities
          .filter((activity) => activity.budgets.some((budget) => budget.id))
          .map((activity) => ({
            ...activity,
            budgets: activity.budgets.filter((budget) => budget.id),
          })),
      )
    }

    const getTypesOfBudget = filteredActivities.map((item) =>
      item.budgets.map((budget) => budget.vendor_category_information.vendor_type.name),
    )
    const getCategoriesOfBudget = filteredActivities.map((item) =>
      item.budgets.map((budget) => budget.vendor_category_information.name),
    )

    const flattenTypes = getTypesOfBudget.flat()
    const flattenCategories = getCategoriesOfBudget.flat()

    const sampleElement = flattenTypes[0]

    const isAllSameValueType = flattenTypes.every((element) => element === sampleElement)

    const perdiemCollections = flattenCategories.filter(
      (element) => element === 'Overseas Perdiem' || element === 'Normal Perdiem' || element === 'Remote Area Perdiem',
    )

    let projectWithChecked = null

    if (parameter === PRTypes.APF || parameter === PRTypes.TE) {
      projectWithChecked = projectBudgetsModified.find((item) =>
        item.activities.some((activity) => activity.budgets.some((budget) => budget.id)),
      )

      if (parameter === PRTypes.TE && perdiemCollections.length > 1) {
        setIsOpenModal((prev: ModalStatement) => ({
          ...prev,
          doublePerdiem: true,
        }))
        setLoadingButtonStatement((prev) => ({ ...prev, [parameter]: false }))
        return false
      }
    }

    if (parameter === PRTypes.PR || parameter === PRTypes.APR) {
      projectWithChecked = projectBudgetsModified.find((item) =>
        item.activities.some((activity) => activity.budgets.some((budget) => budget.id)),
      )
      if (!isAllSameValueType) {
        setIsOpenModal((prev: ModalStatement) => ({
          ...prev,
          paymentRequest: true,
        }))
        setLoadingButtonStatement((prev) => ({ ...prev, [parameter]: false }))
        return false
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { activities, ...itemWithoutActivities } = projectWithChecked
    // return false

    handleRequisitionBudgetToPaymentRequest(filteredActivities)
    handleProjectToPaymentRequest(itemWithoutActivities)

    // return false

    switch (parameter) {
      case PRTypes.PR:
        handlePaymentRequestIdentifier('PR')
        router.push(
          `/dashboard/finance/payment-request/pr/${programDetail.id}/${teDetail.projects[0].id}/${rfDetail.id}?edit=${teDetail.id}`,
        )
        setLoadingButtonStatement((prev) => ({ ...prev, [parameter]: false }))
        break
      case PRTypes.APR:
        handlePaymentRequestIdentifier('APR')
        router.push(
          `/dashboard/finance/payment-request/apr/${programDetail.id}/${teDetail.projects[0].id}/${rfDetail.id}?edit=${teDetail.id}`,
        )
        setLoadingButtonStatement((prev) => ({ ...prev, [parameter]: false }))
        break
      case PRTypes.APF:
        const isPerdiemExist = filteredActivities.map((activity) =>
          activity.budgets.some(
            (budget) =>
              budget.vendor_category_information.name === 'Overseas Perdiem' ||
              budget.vendor_category_information.name === 'Normal Perdiem' ||
              budget.vendor_category_information.name === 'Remote Area Perdiem',
          ),
        )

        const isPerdiemExistValue = isPerdiemExist.some((item: boolean) => item === true)

        if (!isPerdiemExistValue) {
          toast.warning("Perdiem category not found, Can't create advance perdiem fee without it")
          return false
        }

        handlePaymentRequestIdentifier('APF')
        router.push(
          `/dashboard/finance/payment-request/apf/${programDetail.id}/${teDetail.projects[0].id}/${rfDetail.id}?edit=${teDetail.id}`,
        )
        setLoadingButtonStatement((prev) => ({ ...prev, [parameter]: false }))
        break
      case PRTypes.TE:
        handlePaymentRequestIdentifier('TE')
        router.push(
          `/dashboard/finance/payment-request/te/${programDetail.id}/${teDetail.projects[0].id}/${rfDetail.id}?edit=${teDetail.id}`,
        )
        setLoadingButtonStatement((prev) => ({ ...prev, [parameter]: false }))
        break
      default:
        break
    }
  }

  const approvePaymentDetail = async (status: PRApprovalStatus) => {
    if (teDetail.finance_checking_process_status !== PRFinanceCheckingStatus.CHECKED) {
      toast.warning('This payment request need to be approved by finance team first', {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      return false
    }

    const approvalRequest = paymentRequestApi.pRControllerApprovalPaymentRequest(teDetail.id, {
      approved_by: PRApprovalBy.PM.toString(),
      status: status.toString(),
    } as PRApprovalStatusRequest)

    toast.promise(approvalRequest, {
      pending: `Processing payment request approval`,
      success: `Payment request ${status}`,
      error: 'Failed to approve payment request',
    })

    approvalRequest.finally(() => {
      router.replace(router.asPath)
    })
  }

  const continueCheckerFinanceApproval = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      markAsChecked: true,
    }))

    // Mark as checked finance team
    const ongoingCheckedRequest = paymentRequestApi.pRControllerMarkPaymentRequestCheckingPassed(teDetail.id)

    toast.promise(ongoingCheckedRequest, {
      pending: `Marking travel expense as checked`,
      success: `Travel expense marked as checked`,
      error: 'Failed to marking travel expense as checked',
    })

    // Send tax value
    const submitTaxValues = {
      ...teDetail,
      attachments: JSON.parse(teDetail.attachments as unknown as string),
      budgets: prDetailForm?.projects.flatMap((activity) =>
        activity.activities.flatMap((budget) =>
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          budget.budgets.map(({ vendor_category_information, ...budget }) => {
            return { ...budget }
          }),
        ),
      ),
      created_by: teDetail.requested_by.id,
    }

    // console.log('prDetailForm', prDetailForm)
    // console.log('submitTaxValues', submitTaxValues)
    // setLoadingButtonStatement((prev) => ({
    //   ...prev,
    //   markAsChecked: false,
    // }))
    // closeConfirmationFinanceCheckerModal()
    // return false

    const submitPaymentRequest = paymentRequestApi.pRControllerUpdatePaymentRequest(
      teDetail.id as unknown as string,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      submitTaxValues,
    )

    Promise.all([ongoingCheckedRequest, submitPaymentRequest]).finally(() => {
      router.replace(router.asPath)
      closeConfirmationFinanceCheckerModal()
      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({
          ...prev,
          markAsChecked: false,
        }))
      }, 3000)
    })
  }

  const markProcessedPayment = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      markProcessedToFinanceProcess: true,
    }))

    const markProcessedPaymentRes = paymentRequestApi.pRControllerMarkProcessedPaymentRequest(teDetail.id)

    toast.promise(markProcessedPaymentRes, {
      pending: `Marking payment as processed`,
      success: `Payment marked as processed`,
      error: 'Failed to mark payment as processed',
    })

    markProcessedPaymentRes.finally(() => {
      router.replace(router.asPath)

      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({
          ...prev,
          markProcessedToFinanceProcess: false,
        }))
      }, 3000)
    })
  }

  const unmarkCheckingPaymentHandler = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      unmarkCheckingPayment: true,
    }))

    const unmarkCheckingPaymentRes = paymentRequestApi.pRControllerUnMarkPaymentRequestOnChecking(teDetail.id)

    toast.promise(unmarkCheckingPaymentRes, {
      pending: `Unmarking checking payment`,
      success: `Payment checking unmarked`,
      error: 'Failed to unmark payment',
    })

    unmarkCheckingPaymentRes.finally(() => {
      router.replace(router.asPath)
      setLoadingButtonStatement((prev) => ({
        ...prev,
        unmarkCheckingPayment: false,
      }))
    })
  }

  const unmarkProcessedPayment = async () => {
    const unmarkProcessedPaymentRes = paymentRequestApi.pRControllerUnMarkProcessedPaymentRequest(teDetail.id)

    toast.promise(unmarkProcessedPaymentRes, {
      pending: `Unmarking payment`,
      success: `Payment unmarked`,
      error: 'Failed to unmark payment',
    })

    unmarkProcessedPaymentRes.finally(() => {
      router.replace(router.asPath)
    })
  }

  const deleteReportDocumentsFile = async (filename: string) => {
    setValuePaymentReport('report_documents', undefined)
    setProofOfPayment((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    if (teDetail.attachments) {
      setAttachments(JSON.parse(teDetail.attachments as unknown as string))
    }
    setPrDetailForm(teDetail)
  }, [teDetail])

  useEffect(() => {
    if (teDetail) {
      const passPhotoEmployee = teDetail?.requested_by.employee_pass_photo
      const passPhotoFinanceTeamPre = teDetail?.finance_checking_process_by?.employee_pass_photo
      const passPhotoFinanceTeamPost = teDetail?.processed_by?.employee_pass_photo

      getOpenUrl(passPhotoEmployee[0].split('/')[0] as BucketsUnion, passPhotoEmployee[0].split('/')[1], 3600 * 24)
        .then((file) => {
          setRequestedByAvatar(file.url)
        })
        .catch((err) => console.error(err))

      if (passPhotoFinanceTeamPre) {
        getOpenUrl(
          passPhotoFinanceTeamPre[0].split('/')[0] as BucketsUnion,
          passPhotoFinanceTeamPre[0].split('/')[1],
          3600 * 24,
        )
          .then((file) => {
            setFinanceTeamPreAvatar(file.url)
          })
          .catch((err) => console.error(err))
      }

      if (passPhotoFinanceTeamPost) {
        getOpenUrl(
          passPhotoFinanceTeamPost[0].split('/')[0] as BucketsUnion,
          passPhotoFinanceTeamPost[0].split('/')[1],
          3600 * 24,
        )
          .then((file) => {
            setFinanceTeamPostAvatar(file.url)
          })
          .catch((err) => console.error(err))
      }
    }

    if (programDetail) {
      getOpenUrl(
        programDetail?.program_manager?.pass_photo_path?.[0]?.split('/')[0] as BucketsUnion,
        programDetail?.program_manager?.pass_photo_path?.[0]?.split('/')[1],
        3600 * 24,
      )
        .then((file) => {
          setProgramManagerAvatar(file.url)
        })
        .catch((err) => console.error(err))
    }
  }, [teDetail, programDetail])

  useEffect(() => {
    if (programDetail?.id) {
      const exec = async () => {
        const getListAPFResult = await paymentRequestApi.pRControllerGetListPaymentRequest(
          programDetail.id,
          null,
          'advance-perdiem-fee',
          undefined,
          undefined,
        )

        const getAPFList = getListAPFResult.data.data

        setApfData(getAPFList[0])
      }
      exec()
    }
  }, [programDetail?.id])

  useEffect(() => {
    const tableContainers = document.querySelectorAll('.table-container')

    // Collect per-container cleanups; a `return` inside forEach is swallowed by
    // forEach (never reaches useEffect), so listeners would leak on every re-render.
    const cleanups: (() => void)[] = []

    tableContainers.forEach((container) => {
      const topScrollbar = container.querySelector('.top-scrollbar')
      const tableWrapper = container.querySelector('.table-wrapper')

      if (!topScrollbar && !tableWrapper) return

      // Create a dummy div to simulate scrollbar content
      const timeoutTopBar = setTimeout(() => {
        const scrollbarContent = document.createElement('div')
        scrollbarContent.style.width = `${tableWrapper.scrollWidth}px`
        scrollbarContent.style.height = '1px'
        topScrollbar.appendChild(scrollbarContent)
      }, 100)

      // Synchronize scroll positions
      const handleTopScroll = () => {
        tableWrapper.scrollLeft = topScrollbar.scrollLeft
      }
      const handleTableScroll = () => {
        topScrollbar.scrollLeft = tableWrapper.scrollLeft
      }

      topScrollbar.addEventListener('scroll', handleTopScroll)
      tableWrapper.addEventListener('scroll', handleTableScroll)

      cleanups.push(() => {
        topScrollbar.removeEventListener('scroll', handleTopScroll)
        tableWrapper.removeEventListener('scroll', handleTableScroll)
        clearTimeout(timeoutTopBar)
      })
    })

    // Cleanup all listeners/timeouts on unmount or before the next run.
    return () => cleanups.forEach((fn) => fn())
  }, [teDetail, userLoggedinInformation])

  useEffect(() => {
    // SPECIAL FOR PERDIEM
    const totalPerdiem = teDetail.projects.flatMap((project) =>
      project.activities.flatMap((activity) => {
        return activity.budgets
          .filter(
            (item) =>
              item.vendor_category_information.name === 'Overseas Perdiem' ||
              item.vendor_category_information.name === 'Normal Perdiem' ||
              item.vendor_category_information.name === 'Remote Area Perdiem',
          )
          .flatMap((budget) => {
            const totalPerdiemPerBudget = budget.qty * budget.pkg_qty * budget.unit_cost_value
            const staticPerdiemTotal = budget.additional_data['static_data'].reduce(
              (a: number, b: any) => a + b.total,
              0,
            )
            const thp = totalPerdiemPerBudget + staticPerdiemTotal
            const tax =
              Math.abs(budget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
                ? budget.qty *
                  budget.unit_cost_value *
                  (budget.pkg_qty - budget.additional_data['static_data']['3']['pkg_qty']) *
                  (travellerPerdiemTax / 100)
                : budget.qty * budget.unit_cost_value * budget.pkg_qty * (travellerPerdiemTax / 100)

            const finalTotal = thp - tax - budget.additional_data['apf']

            // console.log('thp', thp)
            // console.log('tax', tax)
            // console.log('apfTotal', budget.additional_data['apf'])

            return finalTotal
          })
      }),
    )
    setPerdiemTotal(totalPerdiem as unknown as number)
  }, [travellerPerdiemTax, taxBenchmark])

  useEffect(() => {
    if (perdiemSettingData?.travel_expense_percentages.non_overnight) {
      setTaxBenchmark(perdiemSettingData?.travel_expense_percentages.non_overnight)
    }
  }, [perdiemSettingData?.travel_expense_percentages.non_overnight])

  useEffect(() => {
    // Tax calculation for non others or the another side this is for transportation
    const nonOtherTaxCalculation = prDetailForm?.projects.flatMap((activity) =>
      activity.activities.flatMap((budget) => budget.budgets),
    )

    const nonOtherTaxInternalCalculation = nonOtherTaxCalculation
      ?.map((budget) => budget.tax_amount || 0)
      .reduce((acc, cur) => acc + cur, 0)

    setTotalTaxCalculationForTransportationLevel(nonOtherTaxInternalCalculation || 0)

    // Tax calculation for  others
    const otherTaxCalculation = prDetailForm?.projects.flatMap((activity) =>
      activity.activities.flatMap((budget) =>
        budget.budgets.flatMap((item) => item?.additional_data?.['detail_other']?.flatMap((other) => other)),
      ),
    )

    const otherTaxInternalCalculation = otherTaxCalculation
      ?.map((budget) => budget?.tax_amount || 0)
      .reduce((acc, cur) => acc + cur, 0)
    setTotalTaxCalculationForOtherLevel(otherTaxInternalCalculation || 0)
    setTotalTaxCalculation((nonOtherTaxInternalCalculation || 0) + (otherTaxInternalCalculation || 0))
  }, [prDetailForm])

  useEffect(() => {
    perdiemSettingTrigger()
  }, [teDetail.vendor_id])

  if (!userLoggedinInformation) {
    return <></>
  }

  return (
    <>
      <NextSeo
        title={`TE - ${teDetail.description}`}
        canonical={`${MAIN_URL_FE}dashboard/finance/travel-expenses/${router.query.id}`}
      />
      <Dashboard
        breadcrumbLists={[
          { title: 'Finance', url: breadcrumbUrl },
          {
            title: 'Travel Expenses',
            url: breadcrumbUrl,
          },
          {
            title: `${teDetail.number.toUpperCase().replace(/\s/g, '')}`,
            url: ``,
          },
        ]}
      >
        <div className="sim-modern-forms sim-modern-forms-payment">
          <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">Travel Expenses</h1>
              <p
                className={cn(
                  'text-sm font-medium text-gray-400',
                  teDetail.program_manager_approval === PRApprovalStatus.PENDING ? 'mt-1' : '',
                )}
              >
                {(teDetail.finance_checking_process_status === null ||
                  teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING ||
                  teDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION) &&
                teDetail.program_manager_approval === PRApprovalStatus.PENDING
                  ? 'Please check this finance request before we proceed to approval stage'
                  : null}

                {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
                teDetail.program_manager_approval === PRApprovalStatus.PENDING
                  ? programDetail?.program_ownership_type === 'INTERNAL'
                    ? 'Please wait the Previous Approval (General Manager) to approve the request first.'
                    : 'Please wait the Previous Approval (Project Manager) to approve the request first.'
                  : null}

                {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
                teDetail.program_manager_approval === PRApprovalStatus.REJECTED
                  ? programDetail?.program_ownership_type === 'INTERNAL'
                    ? 'Rejected by General Manager. Please review the payment request.'
                    : 'Rejected by project manager. Please review the payment request.'
                  : null}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN) ? (
                <Button
                  type="button"
                  btnType="normal"
                  size="sm"
                  variant="error-secondary"
                  btnFormat="rectangle"
                  onClick={openDeleteConfirmationModal}
                >
                  <Trash01Icon className="h-5 w-5 stroke-error-700" />
                  Delete Payment
                </Button>
              ) : null}

              <Button
                type="button"
                btnType="normal"
                size="sm"
                color="secondary-gray"
                onClick={openViewLogActivityDrawer}
              >
                View Log Activity
              </Button>

              {userLoggedinInformation.employee_id === teDetail.requested_by.id &&
              teDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION ? (
                <div className="ml-auto inline-flex items-center gap-3">
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    color="secondary"
                    // onClick={() => {
                    //   handlePaymentRequestIdentifier('TE')
                    //   router.push(
                    //     `/dashboard/finance/payment-request/te/${programDetail.id}/${teDetail.projects[0].id}/${rfDetail.id}?edit=${teDetail.id}`,
                    //   )
                    // }}
                    onClick={handleUpdatePayment}
                    isLoading={loadingButtonStatement.editPayment}
                  >
                    Edit Travel Expense
                  </Button>
                </div>
              ) : null}
              <ProgramRoleAccessControlProvider
                programId={teDetail.program_id}
                task={programTasks.APPROVAL_PR_GLOBALLY}
                action={accessActionType.UPDATE}
                replaceWith={<></>}
              >
                {programDetail?.program_manager?.id === userLoggedinInformation.employee_id &&
                teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? (
                  <div className={cn(!buttonHidden ? 'ml-auto inline-flex items-center gap-3' : 'hidden')}>
                    {!buttonHidden ? (
                      <Button
                        type="button"
                        btnType="normal"
                        size="sm"
                        color="secondary-gray"
                        onClick={() => {
                          router.back()
                        }}
                      >
                        Cancel
                      </Button>
                    ) : null}
                    {!buttonHidden ? (
                      <Button
                        disabled={buttonDisabled ? true : false}
                        type="button"
                        btnType="normal"
                        size="sm"
                        variant="error-secondary"
                        onClick={openRejectPayment}
                      >
                        {/* By PM or BC */}
                        Reject Request
                        <XCloseIcon
                          className={cn('h-5 w-5', buttonDisabled ? 'stroke-error-300' : 'stroke-error-700')}
                        />
                      </Button>
                    ) : null}

                    {!buttonHidden ? (
                      <Button
                        disabled={buttonDisabled ? true : false}
                        type="submit"
                        btnType="normal"
                        size="sm"
                        color="primary"
                        onClick={() => approvePaymentDetail(PRApprovalStatus.APPROVED)}
                        isLoading={loadingButtonStatement.PMBCApproval}
                      >
                        Approve Request P
                        <PlusIcon className="h-5 w-5 stroke-white" />
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </ProgramRoleAccessControlProvider>

              {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
              teDetail.program_manager_approval === PRApprovalStatus.APPROVED ? (
                <>
                  {!teDetail.paid_at ? (
                    <ProgramRoleAccessControlProvider
                      programId={teDetail.program_id}
                      task={programTasks.MARK_PAYMENT}
                      action={accessActionType.UPDATE}
                      replaceWith={<></>}
                    >
                      <div className="inline-flex items-center gap-3">
                        {isHeadOfFinance ? (
                          <Button
                            type="button"
                            btnType="normal"
                            size="sm"
                            variant="error-secondary"
                            onClick={openRejectPayment}
                          >
                            {/* By HoF */}
                            Reject Request
                            <XCloseIcon className="h-5 w-5 stroke-error-700" />
                          </Button>
                        ) : null}

                        {teDetail?.processed_by?.id ? (
                          <>
                            {teDetail?.processed_by?.id === userLoggedinInformation.employee_id ? (
                              <>
                                <Button
                                  type="button"
                                  btnType="normal"
                                  size="sm"
                                  color="secondary-gray"
                                  onClick={unmarkProcessedPayment}
                                  isLoading={loadingButtonStatement.unmarkProcessedToFinanceProcess}
                                >
                                  <XCloseIcon className="h-5 w-5 stroke-gray-700" />
                                  Unmark this Process
                                </Button>
                                <Button
                                  type="button"
                                  btnType="normal"
                                  size="sm"
                                  color="secondary-gray"
                                  onClick={openFormFinanceProcessAttachmentDrawer}
                                >
                                  Upload Finance Process Attachment
                                </Button>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <Button
                            type="submit"
                            btnType="normal"
                            size="sm"
                            color="primary"
                            onClick={markProcessedPayment}
                            isLoading={loadingButtonStatement.markProcessedToFinanceProcess}
                          >
                            <CheckAquareBrokenIcon className="h-5 w-5 stroke-white" />
                            Mark as Proceed
                          </Button>
                        )}
                      </div>
                    </ProgramRoleAccessControlProvider>
                  ) : null}
                </>
              ) : (
                <ProgramRoleAccessControlProvider
                  programId={teDetail.program_id}
                  task={programTasks.CHECK_PAYMENT}
                  action={accessActionType.CREATE}
                >
                  <div className="inline-flex items-center gap-3">
                    {teDetail.finance_checking_process_status === null ? (
                      <>
                        <Button
                          type="button"
                          btnType="normal"
                          size="sm"
                          color="secondary-gray"
                          onClick={() => {
                            router.back()
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          btnType="normal"
                          size="sm"
                          color="primary"
                          onClick={() => handleFinanceCheckingStatus(PRFinanceCheckingStatus.CHECKING)}
                        >
                          Mark this as “Ongoing Check”
                          <PlusIcon className="h-5 w-5 stroke-white" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING ? (
                          <>
                            {!buttonHidden ? (
                              <Button
                                type="button"
                                btnType="normal"
                                size="sm"
                                color="secondary-gray"
                                onClick={() => {
                                  router.back()
                                }}
                              >
                                Cancel
                              </Button>
                            ) : null}
                            {!buttonHidden ? (
                              <Button
                                disabled={buttonDisabled ? true : false}
                                type="button"
                                btnType="normal"
                                size="sm"
                                color="secondary-gray"
                                onClick={unmarkCheckingPaymentHandler}
                                isLoading={loadingButtonStatement.unmarkCheckingPayment}
                              >
                                Unmark Checking Payment
                              </Button>
                            ) : null}
                            {!buttonHidden ? (
                              <Button
                                disabled={buttonDisabled ? true : false}
                                type="button"
                                btnType="normal"
                                size="sm"
                                variant="error-secondary"
                                onClick={openRejectPayment}
                              >
                                Reject Request
                                <XCloseIcon
                                  className={cn('h-5 w-5', buttonDisabled ? 'stroke-error-300' : 'stroke-error-700')}
                                />
                              </Button>
                            ) : null}
                            {!buttonHidden ? (
                              <Button
                                disabled={buttonDisabled ? true : false}
                                type="submit"
                                btnType="normal"
                                size="sm"
                                color="primary"
                                onClick={() => handleFinanceCheckingStatus(PRFinanceCheckingStatus.CHECKED)}
                              >
                                Approve Request Y
                                <PlusIcon className="h-5 w-5 stroke-white" />
                              </Button>
                            ) : null}
                          </>
                        ) : (
                          <Button type="button" btnType="normal" size="sm" color="primary" disabled>
                            <CheckAquareBrokenIcon className="h-5 w-5 stroke-white" />
                            Mark as Proceed
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </ProgramRoleAccessControlProvider>
              )}
            </div>
          </div>
          <div className="p-7 xl:p-10">
            <div className="grid grid-cols-3 gap-5 border-b border-b-gray-200 py-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-gray-500">Project</p>
                  <Link href={`/dashboard/project/${programDetail.id}`}>
                    <LinkExternal02Icon className="h-3 w-3 stroke-gray-500" />
                  </Link>
                </div>
                <div className="inline-flex items-center gap-2">
                  <p className="text-xl font-semibold text-gray-900">{programDetail.program_name}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Partner</p>
                <div className="inline-flex items-center gap-2">
                  <p className="text-xl font-semibold text-gray-900">{programDetail.partner.name}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Activity Name</p>
                <div className="inline-flex items-center gap-2">
                  <p className="text-xl font-semibold text-gray-900">{teDetail.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-5 border-b border-b-gray-200 py-6">
              <div className="flex grow flex-col gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Finance Request Code</p>
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold uppercase text-gray-900">
                      {teDetail.number.replace(/\s/g, '')}
                    </p>
                    <Link
                      href={`/dashboard/procurement/${programDetail.id}/detail/${teDetail.projects[0].id}/${teDetail.rf_id}`}
                    >
                      <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                    </Link>
                  </div>
                </div>
                {userLoggedinInformation?.role?.includes(RoleDefinition.FINANCE_TEAM) && teDetail.paid_at ? (
                  <div>
                    <p className="mb-2 text-xs font-bold text-gray-500">Finance Process Attachment</p>
                    <Button
                      type="button"
                      btnType="normal"
                      size="sm"
                      color="secondary-gray"
                      className="inline-flex w-full justify-center gap-2"
                      onClick={openDetailFinanceProcessAttachmentDrawer}
                    >
                      <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                      View Finance Process Attachment
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                      Travel Expenses State
                    </p>
                    <p className="text-xl font-semibold tracking-tight text-gray-900">Finance transfer to Traveler</p>
                  </div>
                )}
              </div>
              <div className="flex grow flex-col gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Requisition Form</p>
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold uppercase text-gray-900">{rfDetail.number}</p>
                    <Link
                      href={`/dashboard/procurement/${programDetail.id}/detail/${teDetail.projects[0].id}/${teDetail.rf_id}`}
                    >
                      <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Advance Perdiem Fee</p>
                  {apfData?.pr_number ? (
                    <div className="inline-flex items-center gap-2">
                      <p className="text-lg font-semibold uppercase text-gray-900">
                        {apfData?.pr_number.replace(/\s/g, '')}
                      </p>
                      <Link href={`/dashboard/finance/advance-perdiem-fee/${apfData?.id}`}>
                        <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                      </Link>
                    </div>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div className="flex grow flex-col gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Travel Date End</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {dayjs(teDetail.travel_end_date_estimation).format('dddd, DD MMM YYYY')}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Estimated Payment Date</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {dayjs(teDetail.expected_payment_date).format('dddd, DD MMM YYYY')}
                  </p>
                </div>
              </div>
              <div className="flex grow flex-col gap-6">
                <div>
                  <p className="mb-2 block text-xs font-bold text-gray-500">Attachment</p>
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    color="secondary-gray"
                    className="inline-flex w-full justify-center gap-2"
                    onClick={openAdditionalAttachmentDrawer}
                  >
                    <FileSearch02Icon className="h-5 w-5 stroke-white" />
                    View Travel Expenses Attachment
                  </Button>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Bank Information</p>
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    color="secondary-gray"
                    className="inline-flex w-full justify-center gap-2"
                    onClick={openBankInformationDrawer}
                  >
                    <FileSearch02Icon className="h-5 w-5 stroke-white" />
                    View Requester Bank Information
                  </Button>
                </div>
              </div>
            </div>
            <div className="sim-te-amount-summary grid grid-cols-5 gap-5 border-b border-b-gray-200 py-6">
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Total Travel Expenses</p>
                <p className="text-4xl font-semibold text-gray-900">
                  {formatCurrency(
                    'IDR',
                    // Perdiem
                    Number(perdiemTotal) +
                      // Transportation
                      Number(
                        teDetail.projects
                          .flatMap((project) =>
                            project.activities.flatMap((activity) =>
                              activity.budgets
                                .filter((budget) => budget.vendor_category_information.name === 'Transportation')
                                .flatMap((budget) => budget.additional_data['total_expenses_real']),
                            ),
                          )
                          .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                      ) +
                      // Other
                      Number(
                        teDetail.projects
                          .flatMap((project) =>
                            project.activities.flatMap((activity) =>
                              activity.budgets
                                .filter((budget) => budget.vendor_category_information.name === 'Other')
                                ?.flatMap((budget) =>
                                  budget.additional_data['detail_other']?.flatMap(
                                    (budgetOther) => budgetOther.total_expenses,
                                  ),
                                ),
                            ),
                          )
                          .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                      ) -
                      totalTaxCalculation,
                  )}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Perdiem</p>
                <p className="text-2xl font-semibold text-gray-900">{formatCurrency('IDR', perdiemTotal)}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Transport</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(
                    'IDR',
                    teDetail.projects
                      .flatMap((project) =>
                        project.activities.flatMap((activity) =>
                          activity.budgets
                            .filter((budget) => budget.vendor_category_information.name === 'Transportation')
                            .flatMap((budget) => budget.additional_data['total_expenses_real']),
                        ),
                      )
                      .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                  )}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Others</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(
                    'IDR',
                    teDetail.projects
                      .flatMap((project) =>
                        project.activities.flatMap((activity) =>
                          activity.budgets
                            .filter((budget) => budget.vendor_category_information.name === 'Other')
                            ?.flatMap((budget) =>
                              budget.additional_data?.['detail_other']?.flatMap(
                                (budgetOther) => budgetOther.total_expenses,
                              ),
                            ),
                        ),
                      )
                      .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                  )}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Pajak</p>
                <div className="inline-flex items-center gap-2">
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency('IDR', totalTaxCalculation)}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-5 border-b border-b-gray-200 py-6">
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Requested by</p>
                <div className="mb-4 flex items-center gap-2.5">
                  <Image
                    src={requestedByAvatar}
                    width={32}
                    height={24}
                    alt={requestedByAvatar}
                    className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
                  />
                  <p className="font-semibold text-gray-700">{teDetail.requested_by.name}</p>
                </div>

                <Badge
                  id="requested-by-status"
                  size="sm"
                  color={
                    {
                      approved: 'success',
                      pending: 'success',
                      revision: 'warning',
                      rejected: 'error',
                    }[teDetail.finance_checking_process_status || teDetail.program_manager_approval] || 'success'
                  }
                  icon="circle"
                >
                  {{
                    approved: 'Submitted',
                    pending: 'Submitted',
                    rejected: 'Rejected',
                    revision: 'Notified to revise',
                  }[teDetail.finance_checking_process_status || teDetail.program_manager_approval] || 'Submitted'}
                </Badge>
                <p className="mt-2 text-xs text-gray-600">
                  {dayjs(teDetail?.requested_at && (teDetail.requested_at as unknown as string))
                    .utc()
                    .local()
                    .format('dddd, DD MMMM YYYY (HH:mm)')}
                </p>
              </div>
              <FinanceCheckerSection teDetail={teDetail} financeTeamPreAvatar={financeTeamPreAvatar} />
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">
                  {programDetail?.program_ownership_type === 'INTERNAL' ? 'General Manager' : 'Project Manager'}
                </p>
                <div className="mb-4 flex items-center gap-2.5">
                  <Image
                    src={programManagerAvatar}
                    width={32}
                    height={24}
                    alt={programManagerAvatar}
                    className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
                  />
                  <p className="font-semibold text-gray-700">{programDetail?.program_manager?.full_name || null}</p>
                </div>
                <Badge
                  id="program-manager-status"
                  className="capitalize"
                  size="sm"
                  color={
                    {
                      approved: 'success',
                      pending: 'warning',
                      rejected: 'error',
                    }[teDetail.program_manager_approval] || 'blue'
                  }
                  icon="circle"
                >
                  {teDetail.program_manager_approval === PRApprovalStatus.PENDING &&
                  teDetail.finance_checking_process_status === null ? (
                    'Waiting Checking Process Done'
                  ) : (
                    <>
                      {{
                        approved: PRApprovalStatus.APPROVED,
                        pending: 'Pending Approval',
                        rejected: 'Rejected',
                      }[teDetail.program_manager_approval] || 'No Status'}
                    </>
                  )}
                </Badge>
                <p className="mt-2 text-xs text-gray-600">
                  {teDetail?.program_manager_approval !== PRApprovalStatus.PENDING &&
                    teDetail?.program_manager_approval_at &&
                    dayjs(teDetail.program_manager_approval_at as unknown as string)
                      .utc()
                      .local()
                      .format('dddd, DD MMMM YYYY (HH:mm)')}
                </p>
              </div>
              <FinanceTeamProcessComponent teDetail={teDetail} financeTeamPostAvatar={financeTeamPostAvatar} />
            </div>

            <div className="mt-5 flex w-full flex-col">
              {teDetail.projects.map((project, projectIndex) =>
                project.activities.map((activity, activityIndex) => (
                  // eslint-disable-next-line tailwindcss/no-custom-classname
                  <div key={`projects_${activity.id}`} className="activity-category">
                    <div className="mb-10 flex w-full items-center gap-4 border-b border-b-gray-200 py-6">
                      <span className="rounded bg-gray-100 px-8 py-0.5 font-semibold leading-6 text-gray-900">
                        {activity.code}
                      </span>
                      <div className="flex grow flex-wrap">
                        <p className="text-left font-semibold text-gray-900">{activity.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-10">
                      {activity.budgets.map((budget, budgetIndex) => (
                        <Fragment key={budgetIndex}>
                          {budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER' ? (
                            <div
                              className={cn(
                                'border-l-4 border-l-rose-400 pl-6',
                                budget.vendor_category_information.name.toLowerCase(),
                              )}
                            >
                              <div className="mb-6 grid grid-cols-5 gap-5">
                                <div>
                                  <p className="mb-2 text-xs font-bold text-gray-500">Vendor Category</p>
                                  <p className="text-lg font-semibold capitalize text-gray-900">
                                    {budget.vendor_category_information.name}
                                  </p>
                                </div>
                                {budget.vendor_category_information.name === 'Overseas Perdiem' ||
                                budget.vendor_category_information.name === 'Normal Perdiem' ||
                                budget.vendor_category_information.name === 'Remote Area Perdiem' ? (
                                  <>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Total Hak Perdiem</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          budget.qty * budget.pkg_qty * budget.unit_cost_value +
                                            budget.additional_data['static_data'].reduce((a, b) => a + b.total, 0),
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">
                                        Pajak (
                                        {Math.abs(budget.additional_data['static_data']['3']['tax']) ===
                                        Math.abs(taxBenchmark)
                                          ? 'Menginap'
                                          : 'Perjalanan'}
                                        ) - {travellerPerdiemTax} %
                                      </p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          Math.abs(budget.additional_data['static_data']['3']['tax']) ===
                                            Math.abs(taxBenchmark)
                                            ? budget.qty *
                                                budget.unit_cost_value *
                                                (budget.pkg_qty -
                                                  budget.additional_data['static_data']['3']['pkg_qty']) *
                                                (travellerPerdiemTax / 100)
                                            : budget.qty *
                                                budget.unit_cost_value *
                                                budget.pkg_qty *
                                                (travellerPerdiemTax / 100),
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Advance Perdiem Fee</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency('IDR', budget.additional_data['apf'])}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Terima Bersih</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          // THP
                                          budget.qty * budget.pkg_qty * budget.unit_cost_value +
                                            budget.additional_data['static_data'].reduce((a, b) => a + b.total, 0) -
                                            // Tax
                                            (Math.abs(budget.additional_data['static_data']['3']['tax']) ===
                                            Math.abs(taxBenchmark)
                                              ? budget.qty *
                                                budget.unit_cost_value *
                                                (budget.pkg_qty -
                                                  budget.additional_data['static_data']['3']['pkg_qty']) *
                                                (travellerPerdiemTax / 100)
                                              : budget.qty *
                                                budget.unit_cost_value *
                                                budget.pkg_qty *
                                                (travellerPerdiemTax / 100)) -
                                            // apf
                                            budget.additional_data['apf'],
                                        )}
                                      </p>
                                    </div>
                                  </>
                                ) : null}
                                {budget.vendor_category_information.name.toLowerCase() === 'transportation' ? (
                                  <>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Total Requested (from TR)</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          calculatePureTotalBudget(
                                            activity.budgets.filter(
                                              (budget) =>
                                                budget.vendor_category_information.name.toLowerCase() ===
                                                'transportation',
                                            ),
                                          ),
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Total Expenses</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          project.activities[activityIndex].budgets
                                            .filter(
                                              (budget) => budget.vendor_category_information.name === 'Transportation',
                                            )
                                            .map((budget) => budget.additional_data['total_expenses_real'])
                                            .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                        )}
                                      </p>
                                    </div>
                                    {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? (
                                      <div>
                                        <p className="mb-2 text-xs font-bold text-gray-500">Total Potongan Pajak</p>
                                        <p className="text-lg font-semibold capitalize text-gray-900">
                                          {formatCurrency('IDR', totalTaxCalculationForTransportationLevel)}
                                        </p>
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                                {budget.vendor_category_information.name.toLowerCase() === 'other' ? (
                                  <>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Description</p>
                                      <p className="line-clamp-1 text-lg font-semibold capitalize text-gray-900">
                                        {
                                          activity.budgets?.find(
                                            (budget) =>
                                              budget.vendor_category_information.name.toLowerCase() === 'other',
                                          ).description
                                        }
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Total Requested (from TR)</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          project.activities[activityIndex].budgets
                                            .filter((budget) => budget.vendor_category_information.name === 'Other')
                                            .map((budget) =>
                                              budget?.additional_data
                                                ? budget?.additional_data['total_requested_from_tr'] || 0
                                                : 0,
                                            )
                                            .reduce(
                                              (accumulator, currentValue) => accumulator + Number(currentValue),
                                              0,
                                            ),
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Total Others Expenses</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          activity.budgets
                                            .find(
                                              (budget) =>
                                                budget.vendor_category_information.name.toLowerCase() === 'other',
                                            )
                                            .additional_data['detail_other']?.reduce(
                                              (a, b) => a + Number(b.total_expenses),
                                              0,
                                            ),
                                        )}
                                      </p>
                                    </div>
                                    {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? (
                                      <div>
                                        <p className="mb-2 text-xs font-bold text-gray-500">Total Potongan Pajak</p>
                                        <p className="text-lg font-semibold capitalize text-gray-900">
                                          {formatCurrency('IDR', totalTaxCalculationForOtherLevel)}
                                        </p>
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                              </div>

                              {/* Special For perdiem */}
                              {budget.vendor_category_information.name === 'Overseas Perdiem' ||
                              budget.vendor_category_information.name === 'Normal Perdiem' ||
                              budget.vendor_category_information.name === 'Remote Area Perdiem' ? (
                                <div className="table-container">
                                  <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                                  <div className="table-wrapper overflow-x-auto border-b border-b-gray-200 py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                                    {activity.budgets.length > 0 && (
                                      <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                                        <div className="border-y border-y-gray-200 bg-gray-50">
                                          <div className="flex items-center">
                                            <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">
                                              No
                                            </div>
                                            <div className="w-72 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Description
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Qty
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Unit
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Pckg Qty
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Pckg Unit
                                            </div>
                                            <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Unit Cost (Perdiem)
                                            </div>
                                            <div className="w-20 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              %
                                            </div>
                                            <div className="w-52 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Total
                                            </div>
                                          </div>
                                        </div>
                                        <div className="divide-y divide-gray-200 text-sm">
                                          {/* Original Perdiem */}
                                          {activity.budgets.map((budgetPerdiem) => (
                                            <Fragment key={`perdiem_${budgetPerdiem.id}`}>
                                              {budgetPerdiem.vendor_category_information.action_by ===
                                                'ACTION_BY_TRAVELLER' &&
                                              budget.vendor_category_information.name ===
                                                budgetPerdiem.vendor_category_information.name ? (
                                                <div className="flex items-center">
                                                  <div className="w-32 p-4 pl-6">
                                                    {budgetPerdiem.code.replace(/\.(\d+)$/, '-$1')}
                                                  </div>
                                                  <div className="w-72 p-4">{budgetPerdiem.description}</div>
                                                  <div className="w-28 px-4 py-2.5">{budgetPerdiem.qty}</div>
                                                  <div className="w-28 p-4 lowercase">{budgetPerdiem.unit}</div>
                                                  <div className="w-28 px-4 py-2.5">{budgetPerdiem.pkg_qty}</div>
                                                  <div className="w-28 p-4 lowercase">{budgetPerdiem.pkg_unit}</div>
                                                  <div className="w-52 px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p className="text-gray-500">Rp</p>
                                                      <p>
                                                        {formatCurrency('IDR', budgetPerdiem.unit_cost_value, true)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="w-20 px-4 py-2.5">100%</div>
                                                  <div className="w-52 bg-white p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p>Rp</p>
                                                      <p>
                                                        {formatCurrency(
                                                          'IDR',
                                                          budgetPerdiem.qty *
                                                            budgetPerdiem.pkg_qty *
                                                            budgetPerdiem.unit_cost_value,
                                                          true,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : null}
                                            </Fragment>
                                          ))}
                                          {/* Static Perdiem */}
                                          {activity.budgets
                                            .filter(
                                              (budget) =>
                                                budget.vendor_category_information.name === 'Overseas Perdiem' ||
                                                budget.vendor_category_information.name === 'Normal Perdiem' ||
                                                budget.vendor_category_information.name === 'Remote Area Perdiem',
                                            )
                                            .map((budgetStatic) =>
                                              budgetStatic.additional_data['static_data'].map((staticData) => (
                                                <div
                                                  className="flex items-center"
                                                  key={`budget_static_${slugify(staticData.description)}`}
                                                >
                                                  <div className="w-32 p-4 pl-6">-</div>
                                                  <div className="w-72 p-4">{staticData.description}</div>
                                                  <div className="w-28 px-4 py-2.5">{budget.qty}</div>
                                                  <div className="w-28 p-4 lowercase">{budget.unit}</div>
                                                  <div className="w-28 px-4 py-2.5">{staticData.pkg_qty}</div>
                                                  <div className="w-28 p-4 lowercase">{budget.pkg_unit}</div>
                                                  <div className="w-52 px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p className="text-gray-500">Rp</p>
                                                      <p>{formatCurrency('IDR', budget.unit_cost_value, true)}</p>
                                                    </div>
                                                  </div>
                                                  <div className="w-20 px-4 py-2.5">{staticData.tax}%</div>
                                                  <div className="w-52 bg-white p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p className="text-gray-500">Rp</p>
                                                      <p>
                                                        {formatCurrency(
                                                          'IDR',
                                                          budget.qty *
                                                            staticData.pkg_qty *
                                                            budget.unit_cost_value *
                                                            (staticData.tax / 100),
                                                          true,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              )),
                                            )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}

                              {/* Special For Transportation */}
                              {budget.vendor_category_information.name.toLowerCase() === 'transportation' ? (
                                <div className="table-container">
                                  <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                                  <div className="table-wrapper overflow-x-auto border-b border-b-gray-200 py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                                    {activity.budgets.length > 0 && (
                                      <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                                        <div className="border-y border-y-gray-200 bg-gray-50">
                                          <div className="flex items-center">
                                            <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">
                                              No
                                            </div>
                                            <div className="w-72 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Description
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Qty
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Unit
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Pckg Qty
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Pckg Unit
                                            </div>
                                            <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Unit Cost
                                            </div>
                                            <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Requested (TR)
                                            </div>
                                            <div className="w-56 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Expenses
                                            </div>
                                            {teDetail.finance_checking_process_status ===
                                              PRFinanceCheckingStatus.CHECKING &&
                                            teDetail.finance_checking_process_by.id ===
                                              userLoggedinInformation?.employee_id ? (
                                              <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                                Potongan Pajak
                                              </div>
                                            ) : null}
                                            {teDetail.finance_checking_process_status ===
                                            PRFinanceCheckingStatus.CHECKED ? (
                                              <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                                Potongan Pajak
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                        <div className="divide-y divide-gray-200 text-sm">
                                          {activity.budgets.map((budgetTransportation) => (
                                            <Fragment key={`transportation_${budgetTransportation.id}`}>
                                              {budgetTransportation.vendor_category_information.action_by ===
                                                'ACTION_BY_TRAVELLER' &&
                                              budget.vendor_category_information.name ===
                                                budgetTransportation.vendor_category_information.name ? (
                                                <div className="flex items-center">
                                                  <div className="w-32 p-4 pl-6">
                                                    {budgetTransportation.code.replace(/\.(\d+)$/, '-$1')}
                                                  </div>
                                                  <div className="w-72 p-4">{budgetTransportation.description}</div>
                                                  <div className="w-28 px-4 py-2.5">{budgetTransportation.qty}</div>
                                                  <div className="w-28 p-4 lowercase">{budgetTransportation.unit}</div>
                                                  <div className="w-28 px-4 py-2.5">{budgetTransportation.pkg_qty}</div>
                                                  <div className="w-28 p-4 lowercase">
                                                    {budgetTransportation.pkg_unit}
                                                  </div>
                                                  <div className="w-52 px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p className="text-gray-500">Rp</p>
                                                      <p>
                                                        {formatCurrency(
                                                          'IDR',
                                                          budgetTransportation.unit_cost_value,
                                                          true,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="w-52 px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p className="text-gray-500">Rp</p>
                                                      <p>
                                                        {formatCurrency(
                                                          'IDR',
                                                          budgetTransportation.qty *
                                                            budgetTransportation.pkg_qty *
                                                            budgetTransportation.unit_cost_value,
                                                          true,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="w-56 bg-white px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p>Rp</p>
                                                      <p>
                                                        {formatCurrency(
                                                          'IDR',
                                                          Number(
                                                            budgetTransportation.additional_data['total_expenses_real'],
                                                          ),
                                                          true,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  {teDetail.finance_checking_process_status ===
                                                    PRFinanceCheckingStatus.CHECKING &&
                                                  teDetail.finance_checking_process_by.id ===
                                                    userLoggedinInformation?.employee_id ? (
                                                    <div className="w-48 px-4 py-2.5">
                                                      <div className="flex items-center justify-between gap-3">
                                                        <p className="text-gray-500">Rp</p>
                                                        <div>
                                                          <Input
                                                            id={`tax-${projectIndex}-${activityIndex}-${budgetIndex}`}
                                                            name="tax_amount"
                                                            type="number"
                                                            align="end"
                                                            placeholder="0"
                                                            isCurrency={true}
                                                            inputSelectionInit="IDR"
                                                            value={
                                                              prDetailForm?.projects[projectIndex].activities[
                                                                activityIndex
                                                              ].budgets[budgetIndex].tax_amount || ''
                                                            }
                                                            size="sm"
                                                            onChange={(e) =>
                                                              handleTaxInputChange(project.id, activity.id, budget.id, {
                                                                target: {
                                                                  name: 'tax_amount',
                                                                  value: e,
                                                                },
                                                              })
                                                            }
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ) : null}
                                                  {teDetail.finance_checking_process_status ===
                                                  PRFinanceCheckingStatus.CHECKED ? (
                                                    <div className="w-48 p-4">
                                                      <div className="flex items-center justify-between gap-3">
                                                        <p>Rp</p>
                                                        <p>{formatCurrency('IDR', budget.tax_amount || 0, true)}</p>
                                                      </div>
                                                    </div>
                                                  ) : null}
                                                </div>
                                              ) : null}
                                            </Fragment>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}

                              {/* Special For Other */}
                              {budget.vendor_category_information.name.toLowerCase() === 'other' ? (
                                <div className="table-container">
                                  <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                                  <div className="table-wrapper overflow-x-auto border-b border-b-gray-200 py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                                    {activity.budgets.length > 0 && (
                                      <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                                        <div className="border-y border-y-gray-200 bg-gray-50">
                                          <div className="flex items-center">
                                            <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">
                                              No
                                            </div>
                                            <div className="w-72 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Description
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Qty
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Unit
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Pckg Qty
                                            </div>
                                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Pckg Unit
                                            </div>
                                            <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Unit Cost
                                            </div>
                                            <div className="w-52 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                              Expenses
                                            </div>
                                            {teDetail.finance_checking_process_status ===
                                              PRFinanceCheckingStatus.CHECKING &&
                                            teDetail.finance_checking_process_by.id ===
                                              userLoggedinInformation?.employee_id ? (
                                              <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                                Potongan Pajak
                                              </div>
                                            ) : null}
                                            {teDetail.finance_checking_process_status ===
                                            PRFinanceCheckingStatus.CHECKED ? (
                                              <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                                Potongan Pajak
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                        {activity.budgets.length > 0 ? (
                                          <>
                                            <div className="divide-y divide-gray-200 text-sm">
                                              {/* Original Others*/}
                                              {/* {activity.budgets.map(
                                                (budgetOther) => (
                                                  <Fragment
                                                    key={`other_${budgetOther.id}`}
                                                  >
                                                    {budgetOther
                                                      .vendor_category_information
                                                      .action_by ===
                                                      'ACTION_BY_TRAVELLER' &&
                                                    budget
                                                      .vendor_category_information
                                                      .name ===
                                                      budgetOther
                                                        .vendor_category_information
                                                        .name ? (
                                                      <div className="flex items-center">
                                                        <div className="w-32 p-4 pl-6">
                                                          {budgetOther.code.replace(
                                                            /\.(\d+)$/,
                                                            '-$1',
                                                          )}
                                                        </div>
                                                        <div className="w-72 p-4">
                                                          {
                                                            budgetOther.description
                                                          }
                                                        </div>
                                                        <div className="w-28 p-4">
                                                          {budgetOther.qty}
                                                        </div>
                                                        <div className="w-28 p-4 lowercase">
                                                          {budgetOther.unit}
                                                        </div>
                                                        <div className="w-28 p-4">
                                                          {budgetOther.pkg_qty}
                                                        </div>
                                                        <div className="w-28 p-4 lowercase">
                                                          {budgetOther.pkg_unit}
                                                        </div>
                                                        <div className="w-52 p-4">
                                                          <div className="flex items-center justify-between gap-3">
                                                            <p className="text-gray-500">
                                                              Rp
                                                            </p>
                                                            <p>
                                                              {formatCurrency(
                                                                'IDR',
                                                                budgetOther.unit_cost_value,
                                                                true,
                                                              )}
                                                            </p>
                                                          </div>
                                                        </div>
                                                        <div className="w-52 bg-white p-4">
                                                          <div className="flex items-center justify-between gap-3">
                                                            <p className="text-gray-500">
                                                              Rp
                                                            </p>
                                                            <p>
                                                              {formatCurrency(
                                                                'IDR',
                                                                budgetOther.qty *
                                                                  budgetOther.pkg_qty *
                                                                  budgetOther.unit_cost_value,
                                                                true,
                                                              )}
                                                            </p>
                                                          </div>
                                                        </div>
                                                        {teDetail.finance_checking_process_status ===
                                                          PRFinanceCheckingStatus.CHECKING &&
                                                        teDetail
                                                          .finance_checking_process_by
                                                          .id ===
                                                          userLoggedinInformation?.employee_id ? (
                                                          <div className="w-48 px-4 py-2.5">
                                                            <div className="flex items-center justify-between gap-3">
                                                              <p className="text-gray-500">
                                                                Rp
                                                              </p>
                                                              <div>
                                                                <Input
                                                                  id={`tax-${projectIndex}-${activityIndex}-${budgetIndex}`}
                                                                  name="tax_amount"
                                                                  type="number"
                                                                  align="end"
                                                                  placeholder="0"
                                                                  isCurrency={
                                                                    true
                                                                  }
                                                                  inputSelectionInit="IDR"
                                                                  value={
                                                                    prDetailForm
                                                                      ?.projects[
                                                                      projectIndex
                                                                    ]
                                                                      .activities[
                                                                      activityIndex
                                                                    ].budgets[
                                                                      budgetIndex
                                                                    ]
                                                                      .tax_amount ||
                                                                    ''
                                                                  }
                                                                  size="sm"
                                                                  onChange={(
                                                                    e,
                                                                  ) =>
                                                                    handleTaxInputChange(
                                                                      project.id,
                                                                      activity.id,
                                                                      budget.id,
                                                                      {
                                                                        target:
                                                                          {
                                                                            name: 'tax_amount',
                                                                            value:
                                                                              e,
                                                                          },
                                                                      },
                                                                    )
                                                                  }
                                                                />
                                                              </div>
                                                            </div>
                                                          </div>
                                                        ) : null}
                                                        {teDetail.finance_checking_process_status ===
                                                        PRFinanceCheckingStatus.CHECKED ? (
                                                          <div className="w-48 p-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                              <p>Rp</p>
                                                              <p>
                                                                {formatCurrency(
                                                                  'IDR',
                                                                  budget.tax_amount ||
                                                                    0,
                                                                  true,
                                                                )}
                                                              </p>
                                                            </div>
                                                          </div>
                                                        ) : null}
                                                      </div>
                                                    ) : null}
                                                  </Fragment>
                                                ),
                                              )} */}
                                              {/* Dynamic others */}
                                              {activity.budgets.map((budgetOther) => (
                                                <Fragment key={`other_${budgetOther.id}`}>
                                                  {budgetOther.vendor_category_information.action_by ===
                                                    'ACTION_BY_TRAVELLER' &&
                                                  budget.vendor_category_information.name ===
                                                    budgetOther.vendor_category_information.name
                                                    ? budgetOther.additional_data['detail_other']?.map(
                                                        (otherDynamic, otherDynamicIndex) => (
                                                          <div key={otherDynamic.id} className="flex items-center">
                                                            <div className="w-32 p-4 pl-6">-</div>
                                                            <div className="w-72 p-4">{otherDynamic.description}</div>
                                                            <div className="w-28 p-4">{otherDynamic.qty}</div>
                                                            <div className="w-28 p-4 lowercase">
                                                              {otherDynamic.unit}
                                                            </div>
                                                            <div className="w-28 p-4">{otherDynamic.pkg_qty}</div>
                                                            <div className="w-28 p-4 lowercase">
                                                              {otherDynamic.pkg_unit}
                                                            </div>
                                                            <div className="w-52 p-4">
                                                              <div className="flex items-center justify-between gap-3">
                                                                <p className="text-gray-500">Rp</p>
                                                                <p>
                                                                  {formatCurrency(
                                                                    'IDR',
                                                                    otherDynamic.unit_cost_value,
                                                                    true,
                                                                  )}
                                                                </p>
                                                              </div>
                                                            </div>
                                                            <div className="w-52 bg-white p-4">
                                                              <div className="flex items-center justify-between gap-3">
                                                                <p className="text-gray-500">Rp</p>
                                                                <p>
                                                                  {formatCurrency(
                                                                    'IDR',
                                                                    otherDynamic.qty *
                                                                      otherDynamic.pkg_qty *
                                                                      otherDynamic.unit_cost_value,
                                                                    true,
                                                                  )}
                                                                </p>
                                                              </div>
                                                            </div>
                                                            {teDetail.finance_checking_process_status ===
                                                              PRFinanceCheckingStatus.CHECKING &&
                                                            teDetail.finance_checking_process_by.id ===
                                                              userLoggedinInformation?.employee_id ? (
                                                              <div className="w-48 px-4 py-2.5">
                                                                <div className="flex items-center justify-between gap-3">
                                                                  <p className="text-gray-500">Rp</p>
                                                                  <div>
                                                                    <Input
                                                                      id={`tax-${projectIndex}-${activityIndex}-${budgetIndex}-${otherDynamicIndex}`}
                                                                      name="tax_amount"
                                                                      type="number"
                                                                      align="end"
                                                                      placeholder="0"
                                                                      isCurrency={true}
                                                                      inputSelectionInit="IDR"
                                                                      value={
                                                                        prDetailForm?.projects[projectIndex].activities[
                                                                          activityIndex
                                                                        ].budgets[budgetIndex].additional_data[
                                                                          'detail_other'
                                                                        ][otherDynamicIndex].tax_amount || ''
                                                                      }
                                                                      size="sm"
                                                                      onChange={(e) =>
                                                                        handleTaxInputChange(
                                                                          project.id,
                                                                          activity.id,
                                                                          budget.id,
                                                                          {
                                                                            target: {
                                                                              name: 'tax_amount',
                                                                              value: e,
                                                                            },
                                                                          },
                                                                          otherDynamic.id,
                                                                        )
                                                                      }
                                                                    />
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            ) : null}
                                                            {teDetail.finance_checking_process_status ===
                                                            PRFinanceCheckingStatus.CHECKED ? (
                                                              <div className="w-48 p-4">
                                                                <div className="flex items-center justify-between gap-3">
                                                                  <p>Rp</p>
                                                                  <p>
                                                                    {formatCurrency(
                                                                      'IDR',
                                                                      prDetailForm?.projects[projectIndex].activities[
                                                                        activityIndex
                                                                      ].budgets[budgetIndex].additional_data[
                                                                        'detail_other'
                                                                      ][otherDynamicIndex].tax_amount || 0,
                                                                      true,
                                                                    )}
                                                                  </p>
                                                                </div>
                                                              </div>
                                                            ) : null}
                                                          </div>
                                                        ),
                                                      )
                                                    : null}
                                                </Fragment>
                                              ))}
                                            </div>
                                          </>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      </Dashboard>

      {/* Form Finance Process Attachment */}
      <form onSubmit={handleSubmitPaymentReport(submitReport, errorSubmitReport)}>
        <Drawer
          isOpen={formFinanceProcessAttachmentDrawer}
          setIsOpen={setFormFinanceProcessAttachmentDrawer}
          title="Finance Process Attachment"
          description={teDetail.number.split('/')[0].toUpperCase() === 'TE' ? 'Travel Expenses' : 'Payment Request'}
          icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
          drawerWidth="w-[28rem]"
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                color="secondary-gray"
                size="md"
                onClick={closeFormFinanceProcessAttachmentDrawer}
              >
                Back
              </Button>
              <Button
                type="submit"
                btnType="normal"
                color="primary"
                size="md"
                isLoading={loadingButtonStatement.submitReport}
              >
                Submit
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <SwitchableUploadField
              name="report_documents"
              label="Transfer Receipt"
              fieldKey="report_documents"
              control={controlPaymentReport}
              errors={errorsPaymentReport}
              setValue={setValuePaymentReport}
              isLinkMode={switchTogglableButton.proof_of_payment_doc}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  proof_of_payment_doc: !prev.proof_of_payment_doc,
                }))
                setProofOfPayment([])
              }}
              bucketName={BucketsEnum.pr_attachment}
              uploadProgress={tempProgressUpload}
              uploadedFiles={proofOfPayment}
              setUploadedFiles={setProofOfPayment}
              deleteFilePath={deleteReportDocumentsFile}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={null}
              handleDeleteExistingFile={() => {}}
              isEditMode={false}
              isRequired={true}
            />
            {teDetail.number.split('/')[0].toUpperCase() === 'TE' ? (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">Travel Expenses State</p>
                <p className="text-xl font-semibold tracking-tight text-gray-900">Finance transfer to Traveler</p>
              </div>
            ) : null}
            <div>
              <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                Payment Date
              </label>
              <Controller
                control={controlPaymentReport}
                name="payment_date"
                rules={{ required: 'Payment date is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <DatePickerCalendar
                      id="payment_date"
                      size="sm"
                      dateFormat="eee, dd MMM yyyy"
                      selected={spendingDeadline}
                      onChange={(date: Date) => {
                        setSpendingDeadline(date)
                        onChange(date)
                      }}
                      error={invalid}
                    />
                    {errorsPaymentReport.payment_date && (
                      <span className="input-hint-text error">{errorsPaymentReport.payment_date?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </Drawer>
      </form>

      {/* Additional Attachment */}
      <Drawer
        isOpen={additionalAttachmentDrawer}
        setIsOpen={setAdditionalAttachmentDrawer}
        title="Travel Expenses Attachment"
        description={`(${teDetail.number.replace(/\s/g, '').toUpperCase()})`}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              color="secondary-gray"
              size="md"
              onClick={closeAdditionalAttachmentDrawer}
            >
              Back
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          {attachments?.find((attachment) => attachment.key === 'eticket')?.file_path.length > 0 ? (
            <div>
              <p className="input-label">E-ticket</p>
              {attachments
                .find((attachment) => attachment.key === 'eticket')
                ?.file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}

          {attachments?.find((attachment) => attachment.key === 'boarding_pass')?.file_path.length > 0 ? (
            <div>
              <p className="input-label">Boarding Pass</p>
              {attachments
                .find((attachment) => attachment.key === 'boarding_pass')
                ?.file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}
          {attachments?.find((attachment) => attachment.key === 'transport_expenses_receipt').file_path.length > 0 ? (
            <div>
              <p className="input-label">Receipt Bundle for Transport Expenses</p>
              {attachments
                .find((attachment) => attachment.key === 'transport_expenses_receipt')
                .file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}
          {attachments?.find((attachment) => attachment.key === 'other_expenses_receipt').file_path.length > 0 ? (
            <div>
              <p className="input-label">Receipt Bundle for Others Expenses</p>
              {attachments
                .find((attachment) => attachment.key === 'other_expenses_receipt')
                .file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}
          <div className="h-px w-full bg-gray-200"></div>
          {attachments?.find((attachment) => attachment.key === 'invitation').file_path.length > 0 ? (
            <div>
              <p className="input-label">Undangan</p>
              {attachments
                .find((attachment) => attachment.key === 'invitation')
                .file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}
          {attachments?.find((attachment) => attachment.key === 'tor').file_path ? (
            <div>
              <p className="input-label">Term of References (ToR)</p>
              {attachments
                .find((attachment) => attachment.key === 'tor')
                .file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}
          {attachments?.find((attachment) => attachment.key === 'assignment_letter').file_path.length > 0 ? (
            <div>
              <p className="input-label">Surat Tugas</p>
              {attachments
                .find((attachment) => attachment.key === 'assignment_letter')
                .file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}
          {attachments?.find((attachment) => attachment.key === 'event_report').file_path ? (
            <div>
              <p className="input-label">Event Report (AAR)</p>
              {attachments
                .find((attachment) => attachment.key === 'event_report')
                .file_path.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      </Drawer>

      {/* Bank Account */}
      <Drawer
        isOpen={bankAccountDrawer}
        setIsOpen={setBankAccountDrawer}
        title="Bank Account"
        description={`(${teDetail.number.toUpperCase()})`}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              color="secondary-gray"
              size="md"
              onClick={closeBankInformationDrawer}
            >
              Back
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="input-label">Requester Name</label>
            <p className="text-lg font-semibold text-gray-900">{teDetail.requested_by.name}</p>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">Beneficiary Name</label>
            <p className="text-lg font-semibold text-gray-900">{teDetail.requested_by['bank_acc_name']}</p>
          </div>
          <div>
            <label className="input-label">Bank Name</label>
            <p className="text-lg font-semibold text-gray-900">{teDetail.requested_by['bank_name']}</p>
          </div>
          <div>
            <label className="input-label">Bank Account Number</label>
            <p className="text-lg font-semibold text-gray-900">{teDetail.requested_by['bank_acc_number']}</p>
          </div>
        </div>
      </Drawer>

      {/* Payment rejected */}
      <Modal
        icon={<Save01Icon className="h-6 w-6 stroke-warning-600" />}
        theme={theme.WARNING}
        modalTitle="Reject this request?"
        modalDescription="Please make sure to give reason why it rejected"
        stateModal={isOpenModal.checkingPaymentRejected}
        handleCloseModal={closeRejectPayment}
      >
        <form className="mt-6" onSubmit={handleSubmit(rejectPaymentSubmit)}>
          <textarea
            {...register('rejection_note', {
              required: 'Message is required field',
            })}
            id="rejection_note"
            className={cn(
              'form-textarea w-full resize-none rounded-lg border px-3.5 py-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
              errors.rejection_note
                ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
                : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
            )}
            rows={5}
            placeholder="Enter a message..."
          ></textarea>
          {errors.rejection_note && <span className="input-hint-text error">{errors.rejection_note?.message}</span>}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              btnType="normal"
              color="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeRejectPayment}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              btnType="normal"
              color="primary"
              className="w-full justify-center"
              size="lg"
              isLoading={loadingButtonStatement.PMBCFinanceRejection}
            >
              Confirm
            </Button>
          </div>
        </form>
      </Modal>

      {/* Log Activity */}
      <Drawer
        isOpen={viewLogActivityDrawer}
        setIsOpen={setViewLogActivityDrawer}
        title="Log Activity"
        description={teDetail?.number.toUpperCase()}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        usingFooter={false}
        drawerWidth="w-[28rem]"
      >
        <div id="log-activity-container">
          {paymentRequestLogs?.map((log) => (
            <div key={log.created_at} className="log-activity-card relative flex items-start gap-3">
              <div className="shrink-0">
                <AvatarPlacement size="lg" image={log.user.employee_pass_photo} />
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

      {/* Finance Process Attachment */}
      <Drawer
        isOpen={financeProcessAttachmentDrawer}
        setIsOpen={setFinanceProcessAttachmentDrawer}
        title="Finance Process Attachment"
        description="Advance Perdiem Fee"
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        usingFooter={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="report_documents" className="input-label">
              Transfer Receipt
            </label>
            {teDetail.report_documents ? (
              <FilePreview fileName={JSON.parse(teDetail.report_documents as unknown as string)[0]} />
            ) : (
              '-'
            )}
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">Travel Expenses State</p>
            <p className="text-xl font-semibold tracking-tight text-gray-900">Finance transfer to Traveler</p>
          </div>
          <div>
            <label className="input-label">Payment Date</label>
            <p className="text-lg font-semibold text-gray-900">
              {dayjs(teDetail.payment_date).format('ddd, DD MMM YYYY')}
            </p>
          </div>
        </div>
      </Drawer>

      {/* Finance Process Attachment */}
      <Drawer
        isOpen={detailFinanceProcessAttachmentDrawer}
        setIsOpen={setDetailFinanceProcessAttachmentDrawer}
        title="Finance Process Attachment"
        description={
          teDetail.number.split('/')[0].toUpperCase() === 'APR' ? 'Advance Payment Request' : 'Payment Request'
        }
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        usingFooter={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="report_documents" className="input-label">
              Transfer Receipt
            </label>
            {teDetail.report_documents ? (
              <FilePreview fileName={JSON.parse(teDetail.report_documents as unknown as string)[0]} />
            ) : (
              '-'
            )}
          </div>
          <div>
            <label className="input-label">Payment Date</label>
            <p className="text-lg font-semibold text-gray-900">
              {dayjs(teDetail.payment_date).format('ddd, DD MMM YYYY')}
            </p>
          </div>
        </div>
      </Drawer>

      {/* Delete Modal */}
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Are you sure want to delete this payment?"
        modalDescription="When you delete it, there is no way to undo the action. Please make sure you are aware that it will happen."
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              color="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeDeleteConfirmationModal}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button
              type="button"
              btnType="normal"
              color="error"
              className="w-full justify-center"
              size="lg"
              onClick={deletePayment}
              isLoading={loadingButtonStatement.deletePayment}
            >
              Yes, Sure
            </Button>
          </>,
        ]}
        stateModal={isOpenModal.deleteConfirmationModal}
        handleCloseModal={closeDeleteConfirmationModal}
      />

      {/* Confirmation CHECKED Modal */}
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-warning-600" />}
        theme={theme.WARNING}
        modalTitle="Are you sure to approve?"
        modalDescription=""
        modalSizeStyles="max-w-[29rem]"
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              color="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeConfirmationFinanceCheckerModal}
            >
              Back to Check
            </Button>
          </>,
          <>
            <Button
              type="button"
              btnType="normal"
              color="primary"
              className="w-full justify-center"
              size="lg"
              onClick={continueCheckerFinanceApproval}
              isLoading={loadingButtonStatement.markAsChecked}
            >
              Confirm Approve
            </Button>
          </>,
        ]}
        stateModal={isOpenModal.confirmationFinanceCheckerModal}
        handleCloseModal={closeConfirmationFinanceCheckerModal}
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>Make sure the tax calculation are right</li>
          </ul>
        </div>
      </Modal>
    </>
  )
}

export default TravelExpensesDetail

const FinanceCheckerSection = ({
  teDetail,
  financeTeamPreAvatar,
}: {
  teDetail: PaymentRequestDetailType
  financeTeamPreAvatar: string
}) => {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-gray-500">Finance Checker</p>
      <div className="mb-4 flex items-center gap-2.5">
        {teDetail.finance_checking_process_status === null ? (
          <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-[200px] bg-gray-100 object-cover text-xs font-medium text-gray-500">
            ?
          </span>
        ) : (
          <Image
            src={financeTeamPreAvatar}
            width={32}
            height={24}
            alt={financeTeamPreAvatar}
            className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
          />
        )}
        <p className="font-semibold text-gray-700">
          {teDetail.finance_checking_process_status === null
            ? 'Finance Team'
            : teDetail.finance_checking_process_by.name}
        </p>
      </div>
      <Badge
        id="finance-checker-status"
        size="sm"
        color={
          teDetail.finance_checking_process_status === null
            ? 'warning'
            : teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED
            ? 'success'
            : teDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION
            ? 'error'
            : teDetail.finance_checking_process_status !== null
            ? 'blue'
            : 'blue'
        }
        icon="circle"
      >
        {teDetail.finance_checking_process_status === null ? 'Waiting Finance Team' : null}
        {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING
          ? 'Ongoing Checking the Documents'
          : null}
        {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? 'Done Check' : null}
        {teDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION ? 'Rejected' : null}
      </Badge>
      <p className="mt-2 text-xs text-gray-600">
        {teDetail?.finance_checking_process_at &&
          dayjs(teDetail.finance_checking_process_at as unknown as string)
            .utc()
            .local()
            .format('dddd, DD MMMM YYYY (HH:mm)')}
      </p>
    </div>
  )
}

const FinanceTeamProcessComponent = ({
  teDetail,
  financeTeamPostAvatar,
}: {
  teDetail: PaymentRequestDetailType
  financeTeamPostAvatar: string
}) => {
  if (!teDetail) return null

  return (
    <div>
      <p className="mb-2 text-xs font-bold text-gray-500">Finance Team Process</p>
      <div className="mb-4 flex items-center gap-2.5">
        {teDetail.processed_by === null ? (
          <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-[200px] bg-gray-100 object-cover text-xs font-medium text-gray-500">
            ?
          </span>
        ) : (
          <Image
            src={financeTeamPostAvatar}
            width={32}
            height={24}
            alt={financeTeamPostAvatar}
            className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
          />
        )}
        <p className="font-semibold text-gray-700">
          {teDetail.processed_by === null ? 'Waiting Finance Team' : teDetail.processed_by.name}
        </p>
      </div>
      <Badge
        id="finance-team-process-status"
        size="sm"
        color={
          teDetail.processed_by === null
            ? 'warning'
            : teDetail.processed_by !== null
            ? teDetail.paid_at
              ? 'success'
              : 'pink'
            : 'blue'
        }
        icon="circle"
      >
        {teDetail.processed_by === null ? 'Waiting Finance Team to Mark this Payment' : null}
        {teDetail.processed_by !== null ? (teDetail.paid_at ? 'Done Process' : 'Wait for Process Done') : null}
      </Badge>
      <p className="mt-2 text-xs text-gray-600">
        {teDetail.processed_by &&
          teDetail?.processed_at &&
          dayjs(teDetail.processed_at as unknown as string)
            .utc()
            .local()
            .format('dddd, DD MMMM YYYY (HH:mm)')}
      </p>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const paymentId = context.params.id
  /*
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const programApi = new ProgramApi(createAPIConfig(auth_token as string))
  const employeeApi = new EmployeeApi(createAPIConfig(auth_token as string))
  const requisitionFormApi = new RequisitionFormApi(createAPIConfig(auth_token as string))
  const paymentRequestApi = new PaymentRequestApi(createAPIConfig(auth_token as string))
  const metadataApi = new MetadataApi(createAPIConfig(auth_token as string))
  const fileApi = new FilesApi(createAPIConfig(auth_token as string))

  try {
    const getTEDetail = await paymentRequestApi.pRControllerGetDetailPaymentRequest(paymentId as string)

    const teDetail = getTEDetail.data.data

    const getRfDetail = await requisitionFormApi.rFControllerGetRfDetail(
      teDetail.program_id,
      teDetail.projects[0].id,
      teDetail.rf_id,
    )

    const rfDetail = getRfDetail.data.data

    const getProgram = await programApi.programControllerGetProgramDetail(teDetail.program_id)

    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    const checkUserRole = checkIsLoggedInRoleAll(authTokenJWT.payload['role'])

    if (!checkUserRole) {
      return {
        notFound: true,
      }
    }

    const programDetail = getProgram.data.data

    let buttonHidden = false
    let buttonDisabled = false
    let approvalBy = null

    if (authTokenJWT.payload['employee_id'] === programDetail.program_manager.id) {
      approvalBy = PRApprovalBy.PM
    }

    if (approvalBy == PRApprovalBy.PM) {
      if (teDetail.finance_checking_process_status !== PRFinanceCheckingStatus.CHECKED) {
        buttonDisabled = true
      } else if (teDetail.program_manager_approval === PRApprovalStatus.APPROVED) {
        buttonHidden = true
      }
    }

    if (teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING) {
      if (teDetail.finance_checking_process_by?.id !== authTokenJWT.payload['employee_id']) {
        buttonDisabled = true
      } else {
        buttonDisabled = false
      }
    }

    if (
      teDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
      authTokenJWT.payload['role']?.includes(RoleDefinition.FINANCE_TEAM) &&
      teDetail.program_manager_approval !== PRApprovalStatus.APPROVED
    ) {
      buttonDisabled = true
    }

    // Case for TE (For now the options available is 2, puskapa empl and other, consultant not included yet)
    // If traveller puskapa employee
    let travellerPerdiemTax = 0
    let travellerId: string | undefined = undefined

    if (rfDetail.rf_attributes?.['employee_id'].split(':')[0] === 'employee') {
      travellerId = rfDetail.rf_attributes['who_traveling']['id']
    } else {
      // get tax another puspaka employee is not handled yet
      travellerId = undefined
    }

    if (travellerId !== undefined) {
      const travellerResponse = await employeeApi.employeeControllerGetEmployeeDetail(travellerId)
      const traveller = travellerResponse?.data.data

      travellerPerdiemTax = traveller.perdiem_tax_percentage
    } else {
      travellerPerdiemTax = 2.5
    }

    // Related to logs and requesting S3 url
    const logsRes = await metadataApi.metadataControllerGetLogsFiltered(paymentId as string, 'PaymentRequest')
    const logs = logsRes?.data?.data
    const renderedIds = new Set()

    const uniqueLogs = logs.filter((log) => {
      if (renderedIds.has(log.user.id)) {
        return false
      }
      renderedIds.add(log.user.id)
      return true
    })

    const dispatchers = []
    for (const uniqueLog of uniqueLogs) {
      const [bucketName, fileName] = uniqueLog.user.employee_pass_photo?.split('/')
      const expiry = 3600 * 24

      const dispatcher = new Promise(async (resolve) => {
        const presignUrlRes = await fileApi.fileControllerGetPresignUrlForDownload(
          fileName,
          bucketName as any,
          expiry as number,
        )

        const presignUrl = presignUrlRes?.data.data

        uniqueLog.user['avatar_url'] = presignUrl

        resolve(uniqueLog)
      })

      dispatchers.push(dispatcher)
    }

    const logModified = await Promise.all(dispatchers)

    const paymentRequestLogs = logs.map((log) => {
      return {
        ...log,
        user: {
          ...log.user,
          avatar_url: logModified.find((logUnique) => logUnique.user.id === log.user.id)?.user.avatar_url,
        },
      }
    })
    const isHeadOfFinance = authTokenJWT.payload['role']?.includes(RoleDefinition.HEAD_OF_FINANCE)

    // Pass data to the page via props
    return {
      props: {
        programDetail,
        rfDetail,
        teDetail,
        activeSidebar: 'Payment Request',
        buttonDisabled,
        buttonHidden,
        travellerPerdiemTax: travellerPerdiemTax || 0,
        paymentRequestLogs,
        isHeadOfFinance,
      },
    }
  } catch (error) {
    console.error('Error fetching travel expense detail', error)
    if (error.message === 'Request failed with status code 500') {
      return {
        notFound: true,
      }
    }

    if (error.message === 'Request failed with status code 401') {
      return {
        redirect: {
          destination: '/refresh',
          permanent: false,
        },
      }
    }
  }
}
