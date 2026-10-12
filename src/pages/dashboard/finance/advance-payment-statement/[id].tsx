/* eslint-disable tailwindcss/no-custom-classname */
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { SafeHtml } from '@/components/SafeHtml'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import ProgramRoleAccessControlProvider, { accessActionType, programTasks } from '@/providers/ProgramRoleAccessControl'
import { BucketsEnum } from '@/shared/file.system'
import { PRApprovalBy, PRApprovalStatus, PRFinanceCheckingStatus } from '@/shared/pr.type'
import { RoleDefinition } from '@/shared/role.access'
import { BucketsUnion, CurrencyUnion, DynamicProgressType } from '@/types/global'
import { theme } from '@/types/themes'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { fileApi, getOpenUrl, paymentRequestApi, vendorExternalApi } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import {
  calculateTotalAdvancePaymentRequest,
  calculateTotalBudget,
  calculateUnitCostPerActivity,
  checkIsLoggedInRoleAll,
  dateFormatToISO,
  formatCurrency,
  isMoreThan24Hours,
  paymentTitle,
  snakeCase,
  titleCase,
  translateAttachmentKey,
} from '@/utils/globalHelper'
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
import { useEffect, useMemo, useState } from 'react'
import { Controller, FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  FilesApi,
  MetadataApi,
  PRApprovalStatusRequest,
  PRAttachment,
  PaymentReport,
  PaymentRequestApi,
  PaymentRequestDetail as PaymentRequestDetailType,
  ProgramApi,
  ProgramDetail,
  RequisitionFormApi,
  RequisitionFormDetail,
  VendorDto,
} from 'sdk/api'
dayjs.extend(utc)
dayjs.extend(relativeTime)

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
const Expand03Icon: any = dynamic(() => import('@/components/icon/Expand03Icon').then((mod) => mod.Expand03Icon))
const FileSearch02Icon: any = dynamic(() =>
  import('@/components/icon/FileSearch02Icon').then((mod) => mod.FileSearch02Icon),
)
const InfoCircleIcon: any = dynamic(() => import('@/components/icon/InfoCircleIcon').then((mod) => mod.InfoCircleIcon))
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
  aprDetail: PaymentRequestDetailType
  buttonDisabled: boolean
  buttonHidden: boolean
  paymentRequestLogs: Log[]
  isHeadOfFinance: boolean
}

type ModalStatement = {
  checkingPaymentRejected: boolean
  deleteConfirmationModal: boolean
  confirmationFinanceCheckerModal: boolean
}

export const AdvancePaymentStatementDetail = ({
  programDetail,
  rfDetail,
  aprDetail,
  buttonDisabled,
  buttonHidden,
  paymentRequestLogs,
  isHeadOfFinance,
}: Props) => {
  const router = useRouter()

  const { userLoggedinInformation } = useDashboardContext()

  const breadcrumbUrl = useMemo(() => {
    const allowedRoles = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM, RoleDefinition.SUPERADMIN]
    return allowedRoles.includes(userLoggedinInformation?.role) ? '/dashboard/finance/advance-payment-statement' : ''
  }, [userLoggedinInformation])

  const [aprDetailForm, setAprDetailForm] = useState<PaymentRequestDetailType | null>(null)

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
  const [vendorInformationDrawer, setVendorInformationDrawer] = useState(false)
  const [bankAccountDrawer, setBankAccountDrawer] = useState(false)
  const [taxInfromationDrawer, setTaxInfromationDrawer] = useState(false)
  const [attachments, setAttachments] = useState<PRAttachment[] | null>(null)
  const [vendorTypes, setVendorTypes] = useState<string[]>([])
  const [vendorDetail, setVendorDetail] = useState<VendorDto | null>(null)
  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    checkingPaymentRejected: false,
    deleteConfirmationModal: false,
    confirmationFinanceCheckerModal: false,
  })
  const [proofOfPayment, setProofOfPayment] = useState([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [spendingDeadline, setSpendingDeadline] = useState<Date | null>(null)
  const [isAdditionalInformationExist, setIsAdditionalInformationExist] = useState(false)
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
  const [totalTaxCalculation, setTotalTaxCalculation] = useState(0)
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

  const openAdditionalAttachmentDrawer = () => {
    setAdditionalAttachmentDrawer(true)
  }
  const closeAdditionalAttachmentDrawer = () => {
    setAdditionalAttachmentDrawer(false)
  }
  const openVendorInformationDrawer = () => {
    setVendorInformationDrawer(true)
  }
  const closeVendorInformationDrawer = () => {
    setVendorInformationDrawer(false)
  }
  const openBankInformationDrawer = () => {
    setBankAccountDrawer(true)
  }
  const closeBankInformationDrawer = () => {
    setBankAccountDrawer(false)
  }
  const openViewLogActivityDrawer = () => {
    setViewLogActivityDrawer(true)
  }
  const openTaxInformationDrawer = () => {
    setTaxInfromationDrawer(true)
  }
  const closeTaxInformationDrawer = () => {
    setTaxInfromationDrawer(false)
  }
  const openFormFinanceProcessAttachmentDrawer = () => {
    setFormFinanceProcessAttachmentDrawer(true)
  }
  const openDetailFinanceProcessAttachmentDrawer = () => {
    setDetailFinanceProcessAttachmentDrawer(true)
  }
  const closeFormFinanceProcessAttachmentDrawer = () => {
    setFormFinanceProcessAttachmentDrawer(false)
  }

  const handleInputChange = (projectId: string, activityId: string, budgetId: string, event: any) => {
    const { name, value } = event.target

    setAprDetailForm((prevBudgets) => {
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

  const submitFinanceReport: SubmitHandler<PaymentReport> = async (formInput) => {
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
    // return false

    const paymentReport = paymentRequestApi.pRControllerCreatePaymentReport(aprDetail.id, submitValues)
    const paymentMarkAsPaid = paymentRequestApi.pRControllerMarkAsPaid(aprDetail.id)

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

  const errorSubmitReport = async (error: FieldErrors<PaymentReport>) => {
    if (error.report_documents || error.payment_date) {
      openFormFinanceProcessAttachmentDrawer()
    }
  }

  const rejectPaymentSubmit = async (formInput: PRApprovalStatusRequest) => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      PMBCFinanceRejection: true,
    }))

    const parameter = aprDetail.number.split('/')[0].toUpperCase()
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

    const isFinanceChecker = userLoggedinInformation.employee_id === aprDetail.finance_checking_process_by.id

    if (isFinanceChecker) {
      const rejectPaymentRequest = paymentRequestApi.pRControllerMarkPaymentRequestCheckingNeedRevision(aprDetail.id, {
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
      const rejectPaymentRequest = paymentRequestApi.pRControllerApprovalPaymentRequest(aprDetail.id, {
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

  const deletePayment = () => {
    setLoadingButtonStatement((prev) => ({ ...prev, deletePayment: true }))
    const deletedPayment = paymentRequestApi.pRControllerDeletePaymentRequest(aprDetail.id)

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

  const approvePaymentDetail = async (status: PRApprovalStatus) => {
    setLoadingButtonStatement((prev) => ({ ...prev, PMBCApproval: true }))

    if (aprDetail.finance_checking_process_status !== PRFinanceCheckingStatus.CHECKED) {
      toast.warning('This advance payment statement need to be approved by finance team first', {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      setLoadingButtonStatement((prev) => ({ ...prev, PMBCApproval: false }))
      return false
    }

    const approvalRequest = paymentRequestApi.pRControllerApprovalPaymentRequest(aprDetail.id, {
      approved_by: PRApprovalBy.PM.toString(),
      status: status.toString(),
    } as PRApprovalStatusRequest)

    toast.promise(approvalRequest, {
      pending: `Processing advance payment statement approval`,
      success: `Advance Payment statement ${status}`,
      error: 'Failed to approve advance payment statement',
    })

    approvalRequest.finally(() => {
      router.replace(router.asPath)
      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({ ...prev, PMBCApproval: false }))
      }, 3000)
    })
  }

  const markProcessedPayment = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      markProcessedToFinanceProcess: true,
    }))

    const markProcessedPaymentRes = paymentRequestApi.pRControllerMarkProcessedPaymentRequest(aprDetail.id)

    toast.promise(markProcessedPaymentRes, {
      pending: `Marking advance payment statement as processed`,
      success: `Advance payment statement marked as processed`,
      error: 'Failed to mark advance payment statement as processed',
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

    const unmarkCheckingPaymentRes = paymentRequestApi.pRControllerUnMarkPaymentRequestOnChecking(aprDetail.id)

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
    setLoadingButtonStatement((prev) => ({
      ...prev,
      unmarkProcessedToFinanceProcess: true,
    }))

    const unmarkProcessedPaymentRes = paymentRequestApi.pRControllerUnMarkProcessedPaymentRequest(aprDetail.id)

    toast.promise(unmarkProcessedPaymentRes, {
      pending: `Unmarking advance payment statement`,
      success: `Advance payment statement unmarked`,
      error: 'Failed to unmark advance payment statement',
    })

    unmarkProcessedPaymentRes.finally(() => {
      router.replace(router.asPath)
      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({
          ...prev,
          unmarkProcessedToFinanceProcess: false,
        }))
      }, 3000)
    })
  }

  const handleFinanceCheckingStatus = (value: PRFinanceCheckingStatus) => {
    switch (value) {
      case PRFinanceCheckingStatus.CHECKING:
        setLoadingButtonStatement((prev) => ({
          ...prev,
          markAsGoingCheck: true,
        }))
        break
    }

    if (aprDetail.finance_checking_process_status !== PRFinanceCheckingStatus.CHECKED) {
      if (userLoggedinInformation?.role?.includes(RoleDefinition.FINANCE_TEAM)) {
        switch (value) {
          case PRFinanceCheckingStatus.CHECKING:
            const ongoingCheckingRequest = paymentRequestApi.pRControllerMarkPaymentRequestOnChecking(aprDetail.id)

            toast.promise(ongoingCheckingRequest, {
              pending: `Marking advance payment statement as ongoing check`,
              success: `Advance Payment statement marked as ongoing check`,
              error: 'Failed to marking advance payment statement as ongoing check',
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
            // Tax input validation, cannot be empty
            // let isTaxValueEmpty = false
            // let budgetDescription = ''
            // aprDetailForm?.projects.flatMap((activity) =>
            //   activity.activities.flatMap((budget) =>
            //     budget.budgets.flatMap((budget) => {
            //       if (budget.tax_amount === undefined) {
            //         isTaxValueEmpty = true
            //         budgetDescription = budget.description
            //       }
            //     }),
            //   ),
            // )

            // if (isTaxValueEmpty) {
            //   toast.warning(
            //     `Potongan pajak for “${budgetDescription}” cannot be empty`,
            //     {
            //       autoClose: 10000,
            //     },
            //   )
            //   return false
            // }

            openConfirmationFinanceCheckerModal()

            break
        }
      } else {
        toast.warning('Only finance team can do this action')
      }
    } else {
      if (aprDetail.program_manager_approval !== PRApprovalStatus.APPROVED) {
        toast.warning('Payment need to be approved by project manager first')
        return false
      }
    }
  }

  const continueCheckerFinanceApproval = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      markAsChecked: true,
    }))

    // Mark as checked finance team
    const ongoingCheckedRequest = paymentRequestApi.pRControllerMarkPaymentRequestCheckingPassed(aprDetail.id)

    toast.promise(ongoingCheckedRequest, {
      pending: `Marking advance payment statement as checked`,
      success: `Advance Payment statement marked as checked`,
      error: 'Failed to marking advance payment statement as checked',
    })

    // Send tax value
    const submitTaxValues = {
      ...aprDetail,
      attachments: JSON.parse(aprDetail.attachments as unknown as string),
      budgets: aprDetailForm?.projects.flatMap((activity) =>
        activity.activities.flatMap((budget) =>
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          budget.budgets.map(({ vendor_category_information, ...budget }) => {
            return { ...budget, recommended_vendor: aprDetail.vendor_id }
          }),
        ),
      ),
      created_by: aprDetail.requested_by.id,
    }

    // console.log('submitTaxValues', submitTaxValues)
    // setLoadingButtonStatement((prev) => ({
    //   ...prev,
    //   markAsChecked: false,
    // }))
    // return false

    const submitPaymentRequest = paymentRequestApi.pRControllerUpdatePaymentRequest(
      aprDetail.id as unknown as string,
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

  const deleteReportDocumentsFile = async (filename: string) => {
    setValuePaymentReport('report_documents', undefined)
    setProofOfPayment((prev) => prev.filter((item) => item.path !== filename))
  }

  const statement = useMemo(() => {
    const REAL_PAYMENT = calculateTotalBudget(aprDetail)
    const APR = calculateTotalAdvancePaymentRequest(aprDetail)
    if (APR > REAL_PAYMENT) {
      return 'Money Settlement'
    } else if (APR === REAL_PAYMENT) {
      return 'Report Closure'
    } else if (APR < REAL_PAYMENT) {
      return 'Payment Request'
    }
  }, [aprDetail])

  useEffect(() => {
    const exec = async () => {
      if (aprDetail.vendor_id) {
        const vendorRes = await vendorExternalApi.vendorControllerGetVendorDetail(aprDetail.vendor_id)
        const vendorResult = vendorRes.data.data
        setVendorDetail(vendorResult)
      }
    }
    exec()

    if (aprDetail.attachments) {
      const parsedString = JSON.parse(aprDetail.attachments as unknown as string)
      setAttachments(parsedString)
    }
  }, [aprDetail.vendor_id, aprDetail.attachments])

  useEffect(() => {
    if (aprDetail) {
      const passPhotoEmployee = aprDetail?.requested_by.employee_pass_photo
      const passPhotoFinanceTeamPre = aprDetail?.finance_checking_process_by?.employee_pass_photo
      const passPhotoFinanceTeamPost = aprDetail?.processed_by?.employee_pass_photo

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
  }, [aprDetail, programDetail])

  useEffect(() => {
    let total = 0
    if (vendorDetail?.vendor_information) {
      if (vendorDetail?.vendor_information['npwp_path']) {
        total++
      }
      if (vendorDetail?.vendor_information['identity_path']) {
        total++
      }
      if (vendorDetail?.vendor_information['driving_license_path']) {
        total++
      }
      if (vendorDetail?.vendor_information['vechile_registration_path']) {
        total++
      }
      if (vendorDetail?.vendor_information['cv_path']) {
        total++
      }
      if (vendorDetail?.vendor_information['cod_path']) {
        total++
      }
    }

    if (total > 0) {
      setIsAdditionalInformationExist(true)
    }
  }, [vendorDetail?.vendor_information])

  useEffect(() => {
    const localVendorTypes = []
    aprDetail.projects.map((project) =>
      project.activities.map((activity) =>
        activity.budgets.map((budget) => {
          localVendorTypes.push(budget.vendor_category_information.name)
        }),
      ),
    )
    setVendorTypes([...new Set(localVendorTypes)])
  }, [aprDetail])

  useEffect(() => {
    const tableContainers = document.querySelectorAll('.table-container')

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

      // Cleanup event listeners on unmount
      return () => {
        topScrollbar.removeEventListener('scroll', handleTopScroll)
        tableWrapper.removeEventListener('scroll', handleTableScroll)
        clearTimeout(timeoutTopBar)
      }
    })
  }, [aprDetail, userLoggedinInformation])

  useEffect(() => {
    const internalTaxCalculation = aprDetailForm?.projects.flatMap((activity) =>
      activity.activities.flatMap((budget) => budget.budgets),
    )

    const totalTaxCalculationInternal = internalTaxCalculation
      ?.map((budget) => budget.tax_amount || 0)
      .reduce((acc, cur) => acc + cur, 0)

    setTotalTaxCalculation(totalTaxCalculationInternal || 0)
  }, [aprDetailForm])

  useEffect(() => {
    setAprDetailForm(aprDetail)
  }, [aprDetail])

  if (!userLoggedinInformation) {
    return <></>
  }
  return (
    <>
      <NextSeo
        title={`APS - ${aprDetail.description}`}
        canonical={`${MAIN_URL_FE}dashboard/finance/advance-payment-statement/${router.query.id}`}
      />
      <Dashboard
        breadcrumbLists={[
          {
            title: 'Finance',
            url: breadcrumbUrl,
          },
          {
            title: 'Advance Payment Statement',
            url: breadcrumbUrl,
          },
          {
            title: `${aprDetail.number.toUpperCase().replace(/\s/g, '')}`,
            url: '',
          },
        ]}
      >
        <>
          <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">Advance Payment Statement</h1>
              <p
                className={cn(
                  'text-sm font-medium text-gray-400',
                  aprDetail.program_manager_approval === PRApprovalStatus.PENDING ? 'mt-1' : '',
                )}
              >
                {(aprDetail.finance_checking_process_status === null ||
                  aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING ||
                  aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION) &&
                aprDetail.program_manager_approval === PRApprovalStatus.PENDING
                  ? 'Please check this finance request before we proceed to approval stage'
                  : null}

                {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
                aprDetail.program_manager_approval === PRApprovalStatus.PENDING
                  ? programDetail?.program_ownership_type === 'INTERNAL'
                    ? 'Please wait the Previous Approval (General Manager) to approve the request first.'
                    : 'Please wait the Previous Approval (Project Manager) to approve the request first.'
                  : null}

                {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
                aprDetail.program_manager_approval === PRApprovalStatus.REJECTED
                  ? programDetail?.program_ownership_type === 'INTERNAL'
                    ? 'Rejected by General Manager. Please review the advance payment statement.'
                    : 'Rejected by project manager. Please review the advance payment statement.'
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
                variant="secondary-gray"
                onClick={openViewLogActivityDrawer}
              >
                View Log Activity
              </Button>

              {userLoggedinInformation.employee_id === aprDetail.requested_by.id &&
              aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION ? (
                <div className="ml-auto inline-flex items-center gap-3">
                  <Link href={`/dashboard/finance/advance-payment-statement/aps/${aprDetail.id}?edit=${aprDetail.id}`}>
                    <Button btnType="div" size="sm" variant="secondary" isLoading={loadingButtonStatement.editPayment}>
                      Edit Advance Payment Statement
                    </Button>
                  </Link>
                </div>
              ) : null}
              <ProgramRoleAccessControlProvider
                programId={aprDetail.program_id}
                task={programTasks.APPROVAL_PR_GLOBALLY}
                action={accessActionType.UPDATE}
                replaceWith={<></>}
              >
                {/* Show this item if user is PM and finance status checker should be checked */}
                {programDetail?.program_manager.id === userLoggedinInformation.employee_id &&
                aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? (
                  <div className={cn(!buttonHidden ? 'ml-auto inline-flex items-center gap-3' : 'hidden')}>
                    {!buttonHidden ? (
                      <Button
                        type="button"
                        btnType="normal"
                        size="sm"
                        variant="secondary-gray"
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
                        variant="primary"
                        onClick={() => approvePaymentDetail(PRApprovalStatus.APPROVED)}
                        isLoading={loadingButtonStatement.PMBCApproval}
                      >
                        {/* By PM or BC */}
                        Approve Request
                        <PlusIcon className="h-5 w-5 stroke-white" />
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </ProgramRoleAccessControlProvider>

              {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
              aprDetail.program_manager_approval === PRApprovalStatus.APPROVED ? (
                <>
                  {!aprDetail.paid_at ? (
                    <ProgramRoleAccessControlProvider
                      programId={aprDetail.program_id}
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

                        {aprDetail?.processed_by?.id ? (
                          <>
                            {aprDetail.processed_by.id === userLoggedinInformation?.employee_id ? (
                              <>
                                <Button
                                  type="button"
                                  btnType="normal"
                                  size="sm"
                                  variant="secondary-gray"
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
                                  variant="secondary-gray"
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
                            variant="primary"
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
                  programId={aprDetail.program_id}
                  task={programTasks.CHECK_PAYMENT}
                  action={accessActionType.CREATE}
                >
                  <div className="inline-flex items-center gap-3">
                    {aprDetail.finance_checking_process_status === null ? (
                      <>
                        <Button
                          type="button"
                          btnType="normal"
                          size="sm"
                          variant="secondary-gray"
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
                          variant="primary"
                          onClick={() => handleFinanceCheckingStatus(PRFinanceCheckingStatus.CHECKING)}
                          isLoading={loadingButtonStatement.markAsGoingCheck}
                        >
                          Mark this as “Ongoing Check”
                          <PlusIcon className="h-5 w-5 stroke-white" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING ? (
                          <>
                            {!buttonHidden ? (
                              <Button
                                type="button"
                                btnType="normal"
                                size="sm"
                                variant="secondary-gray"
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
                                variant="secondary-gray"
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
                                variant="primary"
                                onClick={() => handleFinanceCheckingStatus(PRFinanceCheckingStatus.CHECKED)}
                              >
                                Approve Request
                                <PlusIcon className="h-5 w-5 stroke-white" />
                              </Button>
                            ) : null}
                          </>
                        ) : (
                          <Button type="button" btnType="normal" size="sm" variant="primary" disabled>
                            <CheckAquareBrokenIcon className="h-5 w-5 stroke-white" />
                            Mark as Proceed
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </ProgramRoleAccessControlProvider>
              )}
              {aprDetail.paid_at ? (
                <Button
                  type="button"
                  btnType="normal"
                  size="sm"
                  variant="secondary-gray"
                  onClick={openDetailFinanceProcessAttachmentDrawer}
                >
                  <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                  View Finance Process Attachment
                </Button>
              ) : null}
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
                  <p className="text-xl font-semibold text-gray-900">{aprDetail.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5 border-b border-b-gray-200 py-6">
              <div className="flex grow flex-col gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Requisition Form</p>
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold uppercase text-gray-900">{rfDetail.number}</p>
                    <Link
                      href={`/dashboard/procurement/${programDetail.id}/detail/${aprDetail.projects[0].id}/${aprDetail.rf_id}`}
                    >
                      <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Finance Request Code</p>
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold uppercase text-gray-900">
                      {aprDetail.number.replace(/\s/g, '')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                    Statement Result
                    <InfoCircleIcon className="h-3 w-3 stroke-gray-500" />
                  </p>
                  <p
                    data-testid="statement-result-options"
                    className="text-xl font-semibold tracking-tight text-gray-900"
                  >
                    {statement}
                  </p>
                </div>
              </div>
              <div className="flex grow flex-col gap-6">
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Vendor Type</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {aprDetail.projects[0].activities[0].budgets[0].vendor_category_information.vendor_type.name}
                  </p>
                </div>
                <div>
                  <p className="mb-2 block text-xs font-bold text-gray-500">Vendor Category</p>
                  <div className="inline-flex flex-wrap items-center gap-2">
                    {vendorTypes.map((vendorType) => (
                      <span
                        key={snakeCase(vendorType)}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 mix-blend-multiply"
                      >
                        {vendorType}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Vendor</p>
                  <div className="inline-flex items-center gap-2">
                    <p className="text-xl font-semibold text-gray-900">
                      {aprDetail.projects[0].activities[0].budgets[0].recommended_vendor}
                    </p>
                    <Link href={`/dashboard/external/vendor-adm/${aprDetail.vendor_id}`}>
                      <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="flex grow flex-col gap-6">
                <div>
                  <p className="mb-2 block text-xs font-bold text-gray-500">Attachment</p>
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    variant="secondary-gray"
                    className="inline-flex w-full justify-center gap-2"
                    onClick={openAdditionalAttachmentDrawer}
                  >
                    <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                    View Additional Attachment
                  </Button>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Vendor Information</p>
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    variant="secondary-gray"
                    className="inline-flex w-full justify-center gap-2"
                    onClick={openVendorInformationDrawer}
                  >
                    <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                    View Vendor Information
                  </Button>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Bank Information</p>
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    variant="secondary-gray"
                    className="inline-flex w-full justify-center gap-2"
                    onClick={openBankInformationDrawer}
                  >
                    <FileSearch02Icon className="h-5 w-5 stroke-gray-700" />
                    View Bank Information
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5 border-b border-b-gray-200 py-6">
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Money to Processed</p>

                <p className="text-4xl font-semibold text-gray-900">
                  {formatCurrency(
                    'IDR' as unknown as CurrencyUnion,
                    calculateTotalBudget(aprDetail) -
                      totalTaxCalculation -
                      (calculateTotalAdvancePaymentRequest(aprDetail) || 0),
                  )}
                </p>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-5">
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Total Payment Used/Requested</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency('IDR' as unknown as CurrencyUnion, calculateTotalBudget(aprDetail))}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Pajak</p>
                  <div className="inline-flex items-center gap-2">
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency('IDR', totalTaxCalculation)}</p>
                    <button type="button" onClick={openTaxInformationDrawer}>
                      <Expand03Icon className="h-5 w-5 stroke-gray-500" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Total Advance Payment</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(
                      'IDR' as unknown as CurrencyUnion,
                      calculateTotalAdvancePaymentRequest(aprDetail) || 0,
                    )}
                  </p>
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
                  <p className="font-semibold text-gray-700">{aprDetail.requested_by.name}</p>
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
                    }[aprDetail.finance_checking_process_status || aprDetail.program_manager_approval] || 'success'
                  }
                  icon="circle"
                >
                  {{
                    approved: 'Submitted',
                    pending: 'Submitted',
                    rejected: 'Rejected',
                    revision: 'Notified to revise',
                  }[aprDetail.finance_checking_process_status || aprDetail.program_manager_approval] || 'Submitted'}
                </Badge>
                <p className="mt-2 text-xs text-gray-600">
                  {dayjs(aprDetail?.requested_at && (aprDetail.requested_at as unknown as string))
                    .utc()
                    .local()
                    .format('dddd, DD MMMM YYYY (HH:mm)')}
                </p>
              </div>
              <FinanceCheckerSection aprDetail={aprDetail} financeTeamPreAvatar={financeTeamPreAvatar} />
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
                    }[aprDetail.program_manager_approval] || 'blue'
                  }
                  icon="circle"
                >
                  {aprDetail.program_manager_approval === PRApprovalStatus.PENDING &&
                  aprDetail.finance_checking_process_status === null ? (
                    'Waiting Checking Process Done'
                  ) : (
                    <>
                      {{
                        approved: PRApprovalStatus.APPROVED,
                        pending: 'Pending Approval',
                        rejected: 'Rejected',
                      }[aprDetail.program_manager_approval] || 'No Status'}
                    </>
                  )}
                </Badge>
                <p className="mt-2 text-xs text-gray-600">
                  {aprDetail?.program_manager_approval !== PRApprovalStatus.PENDING &&
                    aprDetail?.program_manager_approval_at &&
                    dayjs(aprDetail.program_manager_approval_at as unknown as string)
                      .utc()
                      .local()
                      .format('dddd, DD MMMM YYYY (HH:mm)')}
                </p>
              </div>
              <FinanceTeamProcessComponent aprDetail={aprDetail} financeTeamPostAvatar={financeTeamPostAvatar} />
            </div>

            <div className="mt-5">
              <div className="flex w-full flex-col">
                {aprDetail.projects.map((project, projectIndex) =>
                  project.activities.map((activity, activityIndex) => (
                    <div className="border-b border-b-gray-200 py-0" key={activity.id}>
                      <div className="flex w-full items-center gap-4 py-6">
                        <span className="rounded bg-gray-100 px-8 py-0.5 font-semibold leading-6 text-gray-900">
                          {activity.code}
                        </span>
                        <div className="flex grow flex-wrap">
                          <p className="text-left font-semibold text-gray-900">{activity.description}</p>
                        </div>
                        <div className="inline-flex w-60 items-center justify-between gap-3 pl-3 pr-6">
                          <p className="font-extrabold text-gray-600">Rp</p>
                          <div className="w-40 text-right">
                            <p className="font-extrabold text-gray-600">
                              {formatCurrency('IDR', calculateUnitCostPerActivity(activity), true)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="table-container">
                        <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                        <div className="table-wrapper overflow-x-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                          {activity.budgets.length > 0 && (
                            <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                              <div className="border-y border-y-gray-200 bg-gray-50">
                                <div className="flex items-center">
                                  <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">
                                    No
                                  </div>
                                  <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Description
                                  </div>
                                  <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Vendor Category
                                  </div>
                                  <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Qty
                                  </div>
                                  <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Unit
                                  </div>
                                  <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Pckg Qty
                                  </div>
                                  <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Pckg Unit
                                  </div>
                                  <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Unit Cost
                                  </div>
                                  <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Total Payment Request
                                  </div>
                                  <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                    Advance Payment
                                  </div>
                                  {aprDetail.program_manager_approval !== 'approved' ? (
                                    <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                      Money to Processed
                                    </div>
                                  ) : null}
                                  {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING &&
                                  aprDetail.finance_checking_process_by.id === userLoggedinInformation?.employee_id ? (
                                    <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                      Potongan Pajak
                                    </div>
                                  ) : null}
                                  {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? (
                                    <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                      Potongan Pajak
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="divide-y divide-gray-200 text-sm">
                                {activity.budgets?.map((budget, budgetIndex) => (
                                  <div className="flex items-center" key={budget.code}>
                                    <div className="w-32 p-4 pl-6">{budget.code.replace(/\.(\d+)$/, '-$1')}</div>
                                    <div className="w-52 p-4">{budget.description}</div>
                                    <div className="w-48 p-4 capitalize">{budget.vendor_category_information.name}</div>
                                    <div className="w-24 p-4">{budget.qty}</div>
                                    <div className="w-28 p-4 lowercase">{budget.unit}</div>
                                    <div className="w-24 p-4">{budget.pkg_qty}</div>
                                    <div className="w-28 p-4 lowercase">{budget.pkg_unit}</div>
                                    <div className="w-48 p-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-gray-500">Rp</p>
                                        <p>{formatCurrency('IDR', budget.unit_cost_value, true)}</p>
                                      </div>
                                    </div>
                                    <div className="w-48 p-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>
                                          {formatCurrency(
                                            'IDR',
                                            budget.qty * budget.pkg_qty * budget.unit_cost_value,
                                            true,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="w-48 p-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>{formatCurrency('IDR', budget.advance_payment_total, true)}</p>
                                      </div>
                                    </div>
                                    {aprDetail.program_manager_approval !== 'approved' ? (
                                      <div className="w-48 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                          <p>Rp</p>
                                          <p>
                                            {formatCurrency(
                                              'IDR',
                                              budget.qty * budget.pkg_qty * budget.unit_cost_value -
                                                budget.advance_payment_total,
                                              true,
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    ) : null}
                                    {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING &&
                                    aprDetail.finance_checking_process_by.id ===
                                      userLoggedinInformation?.employee_id ? (
                                      <div className="w-48 px-4 py-2.5">
                                        <div className="flex items-center gap-3">
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
                                                aprDetailForm?.projects[projectIndex].activities[activityIndex].budgets[
                                                  budgetIndex
                                                ].tax_amount || ''
                                              }
                                              size="sm"
                                              onChange={(e) =>
                                                handleInputChange(project.id, activity.id, budget.id, {
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
                                    {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? (
                                      <div className="w-48 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                          <p>Rp</p>
                                          <p>{formatCurrency('IDR', budget.tax_amount || 0, true)}</p>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>
        </>
      </Dashboard>

      {/* Form Finance Process Attachment */}
      <form onSubmit={handleSubmitPaymentReport(submitFinanceReport, errorSubmitReport)}>
        <Drawer
          isOpen={formFinanceProcessAttachmentDrawer}
          setIsOpen={setFormFinanceProcessAttachmentDrawer}
          title="Finance Process Attachment"
          description={paymentTitle(aprDetail.number.split('/')[0].toUpperCase())}
          icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
          drawerWidth="w-[28rem]"
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                size="md"
                onClick={closeFormFinanceProcessAttachmentDrawer}
              >
                Back
              </Button>
              <Button
                type="submit"
                btnType="normal"
                variant="primary"
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
            {aprDetail.number.split('/')[0].toUpperCase() === 'TE' ? (
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
        title="Additional Attachments"
        description="Advance Payment Statement"
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeAdditionalAttachmentDrawer}
            >
              Back
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          {attachments
            ? attachments?.map((attachment: PRAttachment, index: number) => (
                <div key={index}>
                  <p className="input-label">{translateAttachmentKey(attachment.key)}</p>
                  <div key={index}>
                    <FilePreview fileName={attachment.file_path[0]} />
                  </div>
                </div>
              ))
            : null}
        </div>
      </Drawer>

      {/* Vendor Information */}
      <Drawer
        isOpen={vendorInformationDrawer}
        setIsOpen={setVendorInformationDrawer}
        title="Vendor Information"
        description={`(${aprDetail.number.toUpperCase()})`}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeVendorInformationDrawer}
            >
              Back
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="input-label">Vendor Name</label>
            {vendorDetail?.vendor_information['name'] ? (
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_information['name']}</p>
                <Link href={`/dashboard/external/vendor-adm/${vendorDetail?.id}`}>
                  <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                </Link>
              </div>
            ) : null}
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          {vendorDetail?.vendor_information['npwp_path'] ? (
            <div>
              <label className="input-label">NPWP</label>
              {vendorDetail?.vendor_information['npwp_path'].map((file: any, index: number) => (
                <div key={index}>
                  <FilePreview fileName={file} />
                </div>
              ))}
            </div>
          ) : null}
          {vendorDetail?.vendor_information['identity_path'] ? (
            <div>
              <label className="input-label">Nationality Card</label>
              {vendorDetail?.vendor_information['identity_path'].map((file: any, index: number) => (
                <div key={index}>
                  <FilePreview fileName={file} />
                </div>
              ))}
            </div>
          ) : null}
          {vendorDetail?.vendor_information['driving_license_path'] ? (
            <div>
              <label className="input-label">Surat Izin Mengemudi (SIM)</label>
              {vendorDetail?.vendor_information['driving_license_path'].map((file: any, index: number) => (
                <div key={index}>
                  <FilePreview fileName={file} />
                </div>
              ))}
            </div>
          ) : null}
          {vendorDetail?.vendor_information['vechile_registration_path'] ? (
            <div>
              <label className="input-label">Surat Tanda Nomor Kendaraan (STNK)</label>
              {vendorDetail?.vendor_information['vechile_registration_path'].map((file: any, index: number) => (
                <div key={index}>
                  <FilePreview fileName={file} />
                </div>
              ))}
            </div>
          ) : null}
          {vendorDetail?.vendor_information['cv_path'] ? (
            <div>
              <label className="input-label">Curriculum Vitae (CV)</label>
              {vendorDetail?.vendor_information['cv_path'].map((file: any, index: number) => (
                <div key={index}>
                  <FilePreview fileName={file} />
                </div>
              ))}
            </div>
          ) : null}
          {vendorDetail?.vendor_information['cod_path'] ? (
            <div>
              <label className="input-label">Certificate of Domicile (CoD)</label>
              {vendorDetail?.vendor_information['cod_path'].map((file: any, index: number) => (
                <div key={index}>
                  <FilePreview fileName={file} />
                </div>
              ))}
            </div>
          ) : null}
          {isAdditionalInformationExist ? <div className="h-px w-full bg-gray-200"></div> : null}
          {vendorDetail?.vendor_information['other_path'] ? (
            <div>
              <label className="input-label">Additional Documents</label>
              <div className="flex flex-col gap-6">
                {vendorDetail?.vendor_information['other_path'].map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Drawer>

      {/* Bank Account */}
      <Drawer
        isOpen={bankAccountDrawer}
        setIsOpen={setBankAccountDrawer}
        title="Bank Account"
        description={`(${aprDetail.number.toUpperCase()})`}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeBankInformationDrawer}
            >
              Back
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          {vendorDetail ? (
            <div>
              <label className="input-label">Vendor Name</label>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_information['name']}</p>
                <Link href={`/dashboard/external/vendor-adm/${vendorDetail?.id}`}>
                  <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <label className="input-label">Requester Name</label>
              <p className="text-lg font-semibold text-gray-900">{aprDetail.requested_by.name}</p>
            </div>
          )}
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">Beneficiary Name</label>
            <p className="text-lg font-semibold text-gray-900">
              {vendorDetail ? vendorDetail?.vendor_payment.bank_acc_name : aprDetail.requested_by['bank_acc_name']}
            </p>
          </div>
          <div>
            <label className="input-label">Bank Name</label>
            <p className="text-lg font-semibold text-gray-900">
              {vendorDetail ? vendorDetail?.vendor_payment.bank_name : aprDetail.requested_by['bank_name']}
            </p>
          </div>
          <div>
            <label className="input-label">Bank Account Number</label>
            <p className="text-lg font-semibold text-gray-900">
              {vendorDetail ? vendorDetail?.vendor_payment.bank_acc_number : aprDetail.requested_by['bank_acc_number']}
            </p>
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
              variant="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeRejectPayment}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              btnType="normal"
              variant="primary"
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
        description={aprDetail?.number.toUpperCase()}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        usingFooter={false}
        drawerWidth="w-[28rem]"
      >
        <div id="log-activity-container">
          {paymentRequestLogs?.map((log) => (
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

      {/* Tax Information */}
      <Drawer
        isOpen={taxInfromationDrawer}
        setIsOpen={setTaxInfromationDrawer}
        title="Tax Information"
        description={`(${aprDetail.number.toUpperCase()})`}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeTaxInformationDrawer}
            >
              Back
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="input-label">Vendor Name</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_information['name']}</p>
              <Link
                href={`/dashboard/external/vendor-adm/${vendorDetail?.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
              </Link>
            </div>
          </div>
          {vendorDetail?.vendor_information?.['organization_type'] ? (
            <div>
              <p className="input-label">Organization Type</p>
              <p className="text-lg font-semibold capitalize text-gray-900">
                {vendorDetail?.vendor_information?.['organization_type']}
              </p>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['nationality'] ? (
            <div>
              <p className="input-label">Nationality</p>
              <p className="text-lg font-semibold capitalize text-gray-900">
                {titleCase(vendorDetail?.vendor_information['nationality'])}
              </p>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['identity_path']?.length > 0 ? (
            <div>
              <p className="input-label">National Identity Card</p>
              <div className="mt-3">
                <FilePreview fileName={vendorDetail?.vendor_information['identity_path'][0]} />
              </div>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['npwp_path']?.length > 0 ? (
            <div>
              <p className="input-label">NPWP</p>
              <div className="mt-3">
                <FilePreview fileName={vendorDetail?.vendor_information['npwp_path'][0]} />
              </div>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['cv_path']?.length > 0 ? (
            <div>
              <p className="input-label">Curriculum Vitae (CV)</p>
              <div className="mt-3">
                <FilePreview fileName={vendorDetail?.vendor_information['cv_path'][0]} />
              </div>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['cod_path']?.length > 0 ? (
            <div>
              <p className="input-label">Certificate of Domicile (CoD)</p>
              <div className="mt-3">
                <FilePreview fileName={vendorDetail?.vendor_information['cod_path'][0]} />
              </div>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['driving_license_path']?.length > 0 ? (
            <div>
              <p className="input-label">Surat Izin Mengemudi (SIM)</p>
              <div className="mt-3">
                <FilePreview fileName={vendorDetail?.vendor_information['driving_license_path'][0]} />
              </div>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['vechile_registration_path']?.length > 0 ? (
            <div>
              <p className="input-label">Surat Tanda Nomor Kendaraan (STNK)</p>
              <div className="mt-3">
                <FilePreview fileName={vendorDetail?.vendor_information['vechile_registration_path'][0]} />
              </div>
            </div>
          ) : null}

          {vendorDetail?.vendor_information?.['other_path']?.length > 0 ? (
            <div>
              <label className="input-label">Documents</label>
              <div className="flex flex-col gap-6">
                {vendorDetail?.vendor_information?.['other_path']?.map((file: any, index: number) => (
                  <div key={index}>
                    <FilePreview fileName={file} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Drawer>

      {/* Finance Process Attachment */}
      <Drawer
        isOpen={detailFinanceProcessAttachmentDrawer}
        setIsOpen={setDetailFinanceProcessAttachmentDrawer}
        title="Finance Process Attachment"
        description={paymentTitle(aprDetail.number.split('/')[0].toUpperCase())}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        usingFooter={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="report_documents" className="input-label">
              Transfer Receipt
            </label>
            {aprDetail.report_documents ? (
              <FilePreview fileName={JSON.parse(aprDetail.report_documents as unknown as string)[0]} />
            ) : (
              '-'
            )}
          </div>
          <div>
            <label className="input-label">Payment Date</label>
            <p className="text-lg font-semibold text-gray-900">
              {dayjs(aprDetail.payment_date).format('ddd, DD MMM YYYY')}
            </p>
          </div>
        </div>
      </Drawer>

      {/* Delete Modal */}
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Are you sure want to delete this advance payment statement?"
        modalDescription="When you delete it, there is no way to undo the action. Please make sure you are aware that it will happen."
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
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
              variant="error"
              className="w-full justify-center"
              size="lg"
              onClick={deletePayment}
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
              variant="secondary-gray"
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
              variant="primary"
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

export default AdvancePaymentStatementDetail

const FinanceCheckerSection = ({
  aprDetail,
  financeTeamPreAvatar,
}: {
  aprDetail: PaymentRequestDetailType
  financeTeamPreAvatar: string
}) => {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-gray-500">Finance Checker</p>
      <div className="mb-4 flex items-center gap-2.5">
        {aprDetail.finance_checking_process_status === null ? (
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
          {aprDetail.finance_checking_process_status === null
            ? 'Finance Team'
            : aprDetail.finance_checking_process_by.name}
        </p>
      </div>
      <Badge
        id="finance-checker-status"
        size="sm"
        color={
          aprDetail.finance_checking_process_status === null
            ? 'warning'
            : aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED
            ? 'success'
            : aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION
            ? 'error'
            : aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING
            ? 'blue'
            : 'blue'
        }
        icon="circle"
      >
        {aprDetail.finance_checking_process_status === null ? 'Waiting Finance Team' : null}
        {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.REVISION ? 'Rejected' : null}
        {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING
          ? 'Ongoing Checking the Documents'
          : null}
        {aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED ? 'Done Check' : null}
      </Badge>
      <p className="mt-2 text-xs text-gray-600">
        {aprDetail?.finance_checking_process_status !== PRApprovalStatus.PENDING &&
          aprDetail?.finance_checking_process_status !== null &&
          aprDetail?.finance_checking_process_at &&
          dayjs(aprDetail.finance_checking_process_at as unknown as string)
            .utc()
            .local()
            .format('dddd, DD MMMM YYYY (HH:mm)')}
      </p>
    </div>
  )
}

const FinanceTeamProcessComponent = ({
  aprDetail,
  financeTeamPostAvatar,
}: {
  aprDetail: PaymentRequestDetailType
  financeTeamPostAvatar: string
}) => {
  if (!aprDetail) return null

  return (
    <div>
      <p className="mb-2 text-xs font-bold text-gray-500">Finance Team Process</p>
      <div className="mb-4 flex items-center gap-2.5">
        {aprDetail.processed_by === null ? (
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
          {aprDetail.processed_by === null ? 'Waiting Finance Team' : aprDetail.processed_by.name}
        </p>
      </div>
      <Badge
        id="finance-team-process-status"
        size="sm"
        color={
          aprDetail.processed_by === null
            ? 'warning'
            : aprDetail.processed_by !== null
            ? aprDetail.paid_at
              ? 'success'
              : 'pink'
            : 'blue'
        }
        icon="circle"
      >
        {aprDetail.processed_by === null ? 'Waiting Finance Team to Mark this Payment' : null}
        {aprDetail.processed_by !== null ? (aprDetail.paid_at ? 'Done Process' : 'Wait for Process Done') : null}
      </Badge>
      <p className="mt-2 text-xs text-gray-600">
        {aprDetail.processed_by &&
          aprDetail?.processed_at &&
          dayjs(aprDetail.processed_at as unknown as string)
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
  const requisitionFormApi = new RequisitionFormApi(createAPIConfig(auth_token as string))
  const paymentRequestApi = new PaymentRequestApi(createAPIConfig(auth_token as string))
  const metadataApi = new MetadataApi(createAPIConfig(auth_token as string))
  const fileApi = new FilesApi(createAPIConfig(auth_token as string))

  try {
    const getAPRDetail = await paymentRequestApi.pRControllerGetDetailPaymentRequest(paymentId as string)

    const aprDetail = getAPRDetail.data.data

    if (aprDetail === undefined) {
      return {
        notFound: true,
      }
    }

    const getRfDetail = await requisitionFormApi.rFControllerGetRfDetail(
      aprDetail.program_id,
      aprDetail.projects[0].id,
      aprDetail.rf_id,
    )

    const getProgram = await programApi.programControllerGetProgramDetail(aprDetail.program_id)

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
      if (aprDetail.finance_checking_process_status !== PRFinanceCheckingStatus.CHECKED) {
        buttonDisabled = true
      } else if (aprDetail.program_manager_approval === PRApprovalStatus.APPROVED) {
        buttonHidden = true
      }
    }

    if (aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKING) {
      if (aprDetail.finance_checking_process_by.id !== authTokenJWT.payload['employee_id']) {
        buttonDisabled = true
      } else {
        buttonDisabled = false
      }
    }

    if (
      aprDetail.finance_checking_process_status === PRFinanceCheckingStatus.CHECKED &&
      authTokenJWT.payload['role']?.includes(RoleDefinition.FINANCE_TEAM) &&
      authTokenJWT.payload['employee_id'] !== programDetail.program_manager.id &&
      aprDetail.program_manager_approval !== PRApprovalStatus.APPROVED
    ) {
      buttonDisabled = true
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
        rfDetail: getRfDetail.data.data,
        aprDetail,
        activeSidebar: 'Payment Request',
        buttonDisabled,
        buttonHidden,
        paymentRequestLogs,
        isHeadOfFinance,
      },
    }
  } catch (error) {
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
