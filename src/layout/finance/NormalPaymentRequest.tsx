/* eslint-disable tailwindcss/no-custom-classname */
import { Button } from '@/components/Button'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { EmptyFile } from '@/components/EmptyFile'
import { FilePreview } from '@/components/FilePreview'
import { FileUploadDragDropDynamic } from '@/components/FileUploadDragDropDynamic'
import { Input } from '@/components/Input'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/Modal'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { InfoCircleIcon } from '@/components/icon/InfoCircleIcon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { ComboboxRadix } from '@/components/radix/ComboboxRadix'
import { ActivityBudgetListModified } from '@/layout/program/budget-needs/BudgetNeedsList'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { PaymentIdentifierType, PRTypes } from '@/shared/pr.type'
import { BucketsUnion, ComboboxType, CurrencyUnion, DynamicProgressType } from '@/types/global'
import { PaymentRequestWithAPRType } from '@/types/payment-request'
import { theme } from '@/types/themes'
import { VendorEnum } from '@/types/vendor'
import {
  fileApi,
  getAllActiveStaffCombobox,
  getAllVendorsCombobox,
  getDetailPayment,
  getOpenUrl,
  getPaymentBasedOnBudgetCode,
  getPaymentList,
  getVendorDetail,
  paymentRequestApi,
  programApi,
  vendorExternalApi,
} from '@/utils/apiRequestHelper'
import { UNFIX_TRANSPORT } from '@/utils/constant'
import {
  calculateTotalBudget,
  calculateTotalBudgetAdvancePaymentRequest,
  calculateTotalBudgetProcurement,
  calculateUnitCostPerActivity,
  convertStringCurrency,
  dateFormatToISO,
  deduplicateByKey,
  formatCurrency,
  isValidUrl,
  remainingBudgetPayment,
  slugify,
  snakeCase,
} from '@/utils/globalHelper'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Controller, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  BudgetProgramProjectListResponse,
  CreatePaymentRequestApiRequest,
  CreatePaymentRequestApiRequestApsResultEnum,
  CreatePaymentRequestApiRequestPaymentTypeEnum,
  PRAttachment,
  ProgramDetail,
  RequisitionFormDetail,
  VendorDto,
} from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'
dayjs.extend(utc)

type PaymentRequestType = {
  programDetail: ProgramDetail
  requisitionFormDetail: RequisitionFormDetail
  paymentRequestIdentifier: 'PR'
  programId: string
  projectId: string
  rfId: string
  totalFundReceived: number
  budgetNeeds: BudgetProgramProjectListResponse
}

type CreatePaymentRequestType = CreatePaymentRequestApiRequest & {
  activities: {
    budgets: ActivityBudgetListModified[]
  }[]
  additional_attachments?: {
    invoice?: string[]
    receipt?: string[]
    offeringLetter?: string[]
    invitation?: string[]
    tor?: string[]
    contract?: string[]
    spk?: string[]
    biddingDoc?: string[]
    timesheet?: string[]
    workResult?: string[]
    newsProofHandover?: string[]
    presentationMaterials?: string[]
    eventReport?: string[]
    attendees?: string[]
  }
}

const taxOptions: {
  text: string
}[] = [
  {
    text: 'Include',
  },
  {
    text: 'Exclude',
  },
]

export const NormalPaymentRequest = ({
  programDetail,
  requisitionFormDetail,
  programId,
  projectId,
  rfId,
  totalFundReceived,
  budgetNeeds,
}: PaymentRequestType) => {
  const { budgetsFromProcurementsToPaymentRequest, userLoggedinInformation } = useDashboardContext()

  const router = useRouter()

  const [requestedByAvatar, setReqestedByAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [budgetControllerAvatar, setBudgetControllerAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [programManagerAvatar, setProgramManagerAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [additionalAttachmentDrawer, setAdditionalAttachmentDrawer] = useState(false)
  const [vendorInformationDrawer, setVendorInformationDrawer] = useState(false)
  const [bankAccountDrawer, setBankAccountDrawer] = useState(false)
  const [paymentDate, setPaymentDate] = useState<Date | null>(null)
  const [vendor, setVendor] = useState<ComboboxType[]>([])
  const [choosenVendorId, setChoosenVendorId] = useState<string>('')
  const [vendorDetail, setVendorDetail] = useState<VendorDto | null>(null)
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [attachmentsFiles, setAttachmentsFiles] = useState<PRAttachment[]>([])
  const [existingAttachments, setExistingAttachments] = useState<PRAttachment[]>([])

  const [vendorTypes, setVendorTypes] = useState<string[]>([])
  const [attachmentList, setAttachmentList] = useState<string[]>([])
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    [key: string]: boolean
  }>({})
  const [uploadedFilesByType, setUploadedFilesByType] = useState<{
    [key: string]: File[]
  }>({})
  const [budgetsFromProcurementsToPaymentRequestModified, setBudgetsFromProcurementsToPaymentRequestModified] =
    useState<PaymentRequestWithAPRType[]>([])

  const [totalVendorFilesNonAdditional, setTotalVendorFilesNonAdditional] = useState(0)
  const [renderForm, setRenderForm] = useState<boolean>(false)
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    submitPayment: boolean
  }>({
    submitPayment: false,
  })

  const vendorTypeMemo = useMemo(() => {
    if (budgetsFromProcurementsToPaymentRequest?.[0].budgets[0].vendor_category_information.vendor_type.name) {
      return budgetsFromProcurementsToPaymentRequest?.[0].budgets[0].vendor_category_information.vendor_type.name
    }
  }, [budgetsFromProcurementsToPaymentRequest])

  const isStaffInternalVendor = useMemo(() => {
    const budget = budgetsFromProcurementsToPaymentRequestModified?.[0]?.budgets?.[0]

    const vendorTypeName = budget?.vendor_category_information?.vendor_type?.name?.trim().toLowerCase()

    const vendorCategoryName = budget?.vendor_category_information?.name?.trim().toLowerCase()

    return vendorTypeName === 'staff' && vendorCategoryName === 'internal'
  }, [budgetsFromProcurementsToPaymentRequestModified])

  const categoriesValue = useMemo(() => {
    if (vendorDetail) {
      return vendorDetail?.vendor_categories.map((item) => ({
        id: item.vendor_category_info_id,
        name: item.vendor_category_info.name,
      }))
    }
  }, [vendorDetail])

  const { data: paymentListData, trigger: paymentListTrigger } = useSWRMutation(
    [programId, rfId, 'payment-request'],
    ([programId, rfId, indentifier]) => getPaymentList(programId, rfId, indentifier as PaymentIdentifierType),
  )

  const { data: paymentDetailData, trigger: paymentDetailTrigger } = useSWRMutation(
    'payment-detail',
    (_key: string, { arg }: { arg: string }) => getDetailPayment(arg),
  )

  const { data: vendorDetailData, trigger: vendorDetailTrigger } = useSWRMutation(
    paymentDetailData?.vendor_id ? paymentDetailData?.vendor_id : null,
    (vendorId: string) => getVendorDetail(vendorId),
  )

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePaymentRequestType>({
    defaultValues: {
      description: !router.query.edit ? requisitionFormDetail.about_request : undefined,
    },
  })

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

  const handleUploadFile = async (fileObjects: File[], identifier: string) => {
    const bucketName = BucketsEnum.pr_attachment

    if (!Array.isArray(fileObjects)) return

    fileObjects.map(async (fileObject) => {
      // Update uploaded files state
      setUploadedFilesByType((prev) => ({
        ...prev,
        [identifier]: [fileObject],
      }))

      const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)

      const fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
        headers: {
          'Content-Type': fileObject.type,
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

      setAttachmentsFiles((prev) => {
        prev = prev.filter((item) => item.key !== identifier)
        prev = [...prev, { key: identifier, file_path: [`${bucketName}/${fileNameS3}`] }]

        return prev
      })
    })
  }

  const deleteAttachmentFile = async (identifier: string, filename: string) => {
    setAttachmentsFiles((prev) =>
      prev
        .map((item) =>
          item.key === identifier
            ? {
                ...item,
                file_path: item.file_path.filter((path) => !path.includes(filename)),
              }
            : item,
        )
        .filter((item) => item.file_path.length > 0),
    )
    setUploadedFilesByType((prev) => ({
      ...prev,
      [identifier]: prev[identifier]?.filter((file) => file.name !== filename),
    }))
  }

  const handleErrorPaymentRequest: SubmitErrorHandler<CreatePaymentRequestType> = () => {}

  const handleSubmitPaymentRequest: SubmitHandler<CreatePaymentRequestType> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: true }))

    // Collect attachments from both modes
    const collectedAttachments: PRAttachment[] = attachmentList.map((attachment) => {
      const attachmentKey = slugify(attachment)
      const isLink = switchTogglableButton[attachmentKey]

      if (isLink) {
        // Get link from form input
        const linkValue =
          formInput.additional_attachments?.[attachmentKey as keyof typeof formInput.additional_attachments]
        return {
          key: attachmentKey,
          file_path: linkValue ? (Array.isArray(linkValue) ? linkValue : [linkValue]) : [],
        }
      } else {
        // Get file path from attachmentsFiles
        const fileAttachment = attachmentsFiles.find((att) => att.key === attachmentKey)
        return {
          key: attachmentKey,
          file_path: fileAttachment?.file_path || [],
        }
      }
    })

    const mergeDocs = collectedAttachments.filter((att) => att.file_path.length > 0)

    const modifiedActivityBudgetProvider = budgetsFromProcurementsToPaymentRequestModified?.map((activity) => {
      return {
        ...activity,
        budgets: activity.budgets.map((budget) => {
          return {
            ...budget,
            recommended_vendor: '',
          }
        }),
      }
    })

    if (router.query.edit) {
      mergeDocs.forEach((newItem) => {
        const existingItem = existingAttachments.find((item) => item.key === newItem.key)
        if (existingItem) {
          existingItem.file_path = newItem.file_path
        }
      })
    }

    if (
      // Total payment requested
      calculateTotalBudgetProcurement(watch('activities')) >
      // total project budget
      calculateTotalBudget(budgetNeeds)
    ) {
      toast.error('Total payment requested is more than total project budget!', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-error-500" />,
        autoClose: 5000,
      })
      setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
      return false
    }

    const dispatchers = []
    for (const project of budgetNeeds.projects) {
      for (const activity of project.activities) {
        for (const budget of activity.budgets as ActivityBudgetListModified[]) {
          const dispatcher = new Promise<ActivityBudgetListModified>(async (resolve) => {
            const paidTotalRes = await programApi.programControllerGetPaidBudget(budget.id)
            const paidTotal = paidTotalRes.data.data as unknown as number
            budget['paid_total'] = paidTotal
            resolve(budget)
          })
          dispatchers.push(dispatcher)
        }
      }
    }
    const budgetModified = await Promise.all(dispatchers)

    const paidTotal = budgetModified?.reduce((acc, cur) => acc + cur.paid_total, 0)

    if (
      // Total payment requested + total project budget > Total fund received
      calculateTotalBudgetProcurement(watch('activities')) + paidTotal >
      totalFundReceived
    ) {
      toast.error(
        `Sorry, the payment request cannot be submitted due to the total of this request (${formatCurrency(
          'IDR',
          calculateTotalBudgetProcurement(watch('activities')),
        )}) + total payment (${formatCurrency(
          'IDR',
          paidTotal,
        )}) are more than this project’s fund received (${formatCurrency('IDR', totalFundReceived)}).`,
        {
          icon: <AlertTriangleIcon className="h-5 w-5 stroke-error-500" />,
          autoClose: 5000,
        },
      )
      setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
      return false
    }

    const submitValues = {
      rf_id: rfId,
      description: formInput.description || '',
      vendor_id: choosenVendorId,
      payment_type: CreatePaymentRequestApiRequestPaymentTypeEnum.PaymentRequest,
      expected_payment_date: dateFormatToISO(dayjs(formInput.expected_payment_date).utc().format()),
      spending_deadline: dateFormatToISO(dayjs(formInput.spending_deadline).utc().format()),
      with_ppn: (formInput.with_ppn as unknown as string) === 'include' ? true : false,
      attachments: deduplicateByKey([...mergeDocs, ...existingAttachments]),
      budgets: formInput.activities.flatMap((activity, activityIndex) =>
        activity.budgets.flatMap((budget, budgetIndex) => ({
          ...budget,
          recommended_vendor: choosenVendorId,
          unit_cost: `IDR_${Number(budget.unit_cost_value)}`,
          unit_cost_value: Number(budget.unit_cost_value),
          additional_data: {
            remaining_budget: remainingBudgetPayment(
              router.query.edit,
              modifiedActivityBudgetProvider[activityIndex].budgets[budgetIndex],
              watch(`activities.${activityIndex}.budgets.${budgetIndex}`),
            ),
          } as unknown as string,
          action_by: '',
          advance_payment_total: budget.advance_payment_total || 0,
        })),
      ),
      aps_related_pr_id: null,
      aps_result: null as unknown as CreatePaymentRequestApiRequestApsResultEnum,
      travel_end_date_estimation: null,
      created_by: null,
    }

    // console.log('submitValues', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
    // return false

    // If update action
    if (router.query.edit) {
      const submitPaymentRequest = paymentRequestApi.pRControllerUpdatePaymentRequest(
        router.query.edit as unknown as string,
        submitValues,
      )
      toast.promise(submitPaymentRequest, {
        pending: 'Updating payment request',
        success: 'Payment request updated 🎉',
        error: 'Promise rejected 🤯',
      })

      submitPaymentRequest.then((success) => {
        router.replace(`/dashboard/finance/payment-request/${success.data.data}`)
        removeCookie('budget_needs_to_payment_request')
        removeCookie('project_to_payment_request')
        removeCookie('payment_request_type')
      })
    } else {
      const submitPaymentRequest = paymentRequestApi.pRControllerCreatePaymentRequest(submitValues)

      toast.promise(submitPaymentRequest, {
        pending: 'Creating payment request',
        success: 'Payment request created 🎉',
        error: 'Promise rejected 🤯',
      })

      submitPaymentRequest.then((success) => {
        router.replace(`/dashboard/finance/payment-request/${success.data.data}`)
        removeCookie('budget_needs_to_payment_request')
        removeCookie('project_to_payment_request')
        removeCookie('payment_request_type')
      })
    }

    setTimeout(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
    }, 3000)
  }

  useEffect(() => {
    const modifiedActivityBudgetProvider = budgetsFromProcurementsToPaymentRequestModified?.map((activity) => {
      return {
        ...activity,
        budgets: activity.budgets.map((budget) => {
          return {
            ...budget,
            recommended_vendor: '',
          }
        }),
      }
    })

    modifiedActivityBudgetProvider?.map((activity, activityIndex) => {
      activity.budgets.map((budget, index) => {
        setValue(`activities.${activityIndex}.budgets.${index}.id`, budget.id)
        setValue(`activities.${activityIndex}.budgets.${index}.ordering_seq`, budget.ordering_seq)
        setValue(`activities.${activityIndex}.budgets.${index}.code`, budget.code)
        setValue(`activities.${activityIndex}.budgets.${index}.description`, budget.description)
        setValue(`budgets.${index}.vendor_category_id`, budget.vendor_category_information.id)
        if (router.query.edit === undefined && budget.total_prs !== 0) {
          setValue(`activities.${activityIndex}.budgets.${index}.qty`, 1)
        } else {
          setValue(`activities.${activityIndex}.budgets.${index}.qty`, budget.qty)
        }
        setValue(`activities.${activityIndex}.budgets.${index}.unit`, budget.unit)
        if (router.query.edit === undefined && budget.total_prs !== 0) {
          setValue(`activities.${activityIndex}.budgets.${index}.pkg_qty`, 1)
        } else {
          setValue(`activities.${activityIndex}.budgets.${index}.pkg_qty`, budget.pkg_qty)
        }
        setValue(`activities.${activityIndex}.budgets.${index}.pkg_unit`, budget.pkg_unit)
        if ((budget.total_prs === 0 && budget.advance_payment_total === null) || router.query.edit) {
          setValue(`activities.${activityIndex}.budgets.${index}.unit_cost_value`, budget.unit_cost_value)
        } else {
          setValue(
            `activities.${activityIndex}.budgets.${index}.unit_cost_value`,
            budget.qty * budget.pkg_qty * budget.unit_cost_value - (budget.total_prs + budget.advance_payment_total),
          )
        }
        setValue(`activities.${activityIndex}.budgets.${index}.vendor_category_id`, budget.vendor_category_id)
        setValue(`activities.${activityIndex}.budgets.${index}.advance_payment_total`, budget.advance_payment_total)
      })
    })

    const getRecommendedVendor = async () => {
      const filterType =
        budgetsFromProcurementsToPaymentRequestModified?.[0].budgets[0].vendor_category_information.vendor_type.name
      const categoryTypes = budgetsFromProcurementsToPaymentRequestModified
        ?.map((activity) => activity.budgets.map((budget) => budget.vendor_category_information.id))
        .join(',')

      if (isStaffInternalVendor) {
        const staffVendors = await getAllActiveStaffCombobox()
        setVendor(staffVendors)
        return
      }

      const vendor = await getAllVendorsCombobox(filterType, categoryTypes)

      setVendor(vendor)
    }
    if (budgetsFromProcurementsToPaymentRequestModified && budgetsFromProcurementsToPaymentRequestModified.length > 0) {
      getRecommendedVendor()
    }
  }, [budgetsFromProcurementsToPaymentRequestModified, isStaffInternalVendor])

  useEffect(() => {
    const vendorName = watch('vendor_id')

    if (!vendorName) return

    const vendorId = vendor.find((item) => item.name === vendorName)?.id as unknown as string

    setChoosenVendorId(vendorId)
  }, [watch('vendor_id'), vendor])

  useEffect(() => {
    const exec = async () => {
      if (!choosenVendorId) return

      if (isStaffInternalVendor) {
        setVendorDetail(null)
        return
      }

      const vendorRes = await vendorExternalApi.vendorControllerGetVendorDetail(choosenVendorId)
      const result = vendorRes.data.data
      setVendorDetail(result)
    }

    exec()
  }, [choosenVendorId, isStaffInternalVendor])

  useEffect(() => {
    if (userLoggedinInformation?.avatar) {
      getOpenUrl(
        userLoggedinInformation?.avatar.split('/')[0] as BucketsUnion,
        userLoggedinInformation?.avatar.split('/')[1],
        3600 * 24,
      )
        .then((file) => {
          setReqestedByAvatar(file.url)
        })
        .catch((err) => console.error(err))
    }

    if (programDetail) {
      getOpenUrl(
        programDetail?.budget_controller?.pass_photo_path?.[0]?.split('/')[0] as BucketsUnion,
        programDetail?.budget_controller?.pass_photo_path?.[0]?.split('/')[1],
        3600 * 24,
      )
        .then((file) => {
          setBudgetControllerAvatar(file.url)
        })
        .catch((err) => console.error(err))

      getOpenUrl(
        (programDetail?.program_ownership_type === 'INTERNAL'
          ? (programDetail as any)?.general_manager?.pass_photo_path?.[0]
          : programDetail?.program_manager?.pass_photo_path?.[0]
        )?.split('/')[0] as BucketsUnion,
        (programDetail?.program_ownership_type === 'INTERNAL'
          ? (programDetail as any)?.general_manager?.pass_photo_path?.[0]
          : programDetail?.program_manager?.pass_photo_path?.[0]
        )?.split('/')[1],
        3600 * 24,
      )
        .then((file) => {
          setProgramManagerAvatar(file.url)
        })
        .catch((err) => console.error(err))
    }
  }, [userLoggedinInformation, programDetail])

  useEffect(() => {
    if (!budgetsFromProcurementsToPaymentRequest) return

    const localVendorTypes = []
    const localVendorTypeIds = []
    budgetsFromProcurementsToPaymentRequest?.map((activity) =>
      activity.budgets.map((budget) => {
        localVendorTypes.push(budget.vendor_category_information.name)
        localVendorTypeIds.push(budget.vendor_category_information.id)
      }),
    )

    setVendorTypes([...new Set(localVendorTypes)])

    // Pull APR budget to PR
    const exec = async () => {
      const categoryAttachmentsList = []
      await Promise.all(
        localVendorTypeIds.map(async (localVendorTypeId) => {
          const categoryAttachmentFields = await vendorExternalApi.vendorControllerGetVendorCategoryAttachmentList(
            localVendorTypeId,
          )
          categoryAttachmentsList.push(categoryAttachmentFields.data.data)
        }),
      )

      const categotyAttachments = [...new Set(categoryAttachmentsList)].flatMap((attachment) => attachment)

      setAttachmentList([...new Set(categotyAttachments)])

      const [advancePaymentRequestExist, paymentRequestExist] = await Promise.all([
        getPaymentBasedOnBudgetCode(programId, rfId, PRTypes.APR, budgetsFromProcurementsToPaymentRequest),
        getPaymentBasedOnBudgetCode(programId, rfId, PRTypes.PR, budgetsFromProcurementsToPaymentRequest),
      ])

      const result = budgetsFromProcurementsToPaymentRequest?.map((activity, activityIndex) => ({
        ...activity,
        budgets: activity.budgets.map((budget, budgetIndex) => {
          const total_prs = paymentRequestExist[activityIndex][budgetIndex]?.total_prs || 0
          return {
            ...budget,
            advance_payment_total: !total_prs
              ? advancePaymentRequestExist[activityIndex][budgetIndex]?.advance_payment_total
              : 0,
            total_prs,
          }
        }),
      }))

      setBudgetsFromProcurementsToPaymentRequestModified(result)
    }
    exec()
  }, [budgetsFromProcurementsToPaymentRequest, paymentListData])

  useEffect(() => {
    if (vendorDetail) {
      let total = 0

      if (vendorDetail?.vendor_information['npwp_path'] && vendorDetail?.vendor_information['npwp_path'].length > 0) {
        total += 1
      }
      if (
        vendorDetail?.vendor_information['identity_path'] &&
        vendorDetail?.vendor_information['identity_path'].length > 0
      ) {
        total += 1
      }
      if (
        vendorDetail?.vendor_information['driving_license_path'] &&
        vendorDetail?.vendor_information['driving_license_path'].length > 0
      ) {
        total += 1
      }
      if (
        vendorDetail?.vendor_information['vechile_registration_path'] &&
        vendorDetail?.vendor_information['vechile_registration_path'].length > 0
      ) {
        total += 1
      }
      if (vendorDetail?.vendor_information['cv_path'] && vendorDetail?.vendor_information['cv_path'].length > 0) {
        total += 1
      }
      if (vendorDetail?.vendor_information['cod_path'] && vendorDetail?.vendor_information['cod_path'].length > 0) {
        total += 1
      }
      setTotalVendorFilesNonAdditional(total)
    }
  }, [vendorDetail])

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
  }, [budgetsFromProcurementsToPaymentRequestModified, userLoggedinInformation])

  // =============== UPDATE PAYMENT ===============
  useEffect(() => {
    if (!paymentDetailData || vendorDetailData === undefined) return

    const expectedPaymentDate = new Date(paymentDetailData.expected_payment_date)
    const spendingDeadline = new Date(paymentDetailData.spending_deadline)

    setValue('vendor_id', vendorDetailData.vendor_information['name'])
    setValue('expected_payment_date', expectedPaymentDate as unknown as string)
    setValue('spending_deadline', spendingDeadline as unknown as string)
    setPaymentDate(expectedPaymentDate)
    const parsedAttachments = JSON.parse(paymentDetailData.attachments as unknown as string)
    setExistingAttachments(parsedAttachments)

    // Initialize switch toggle states based on existing attachments
    const toggleStates: { [key: string]: boolean } = {}
    parsedAttachments.forEach((attachment: PRAttachment) => {
      if (attachment.file_path && attachment.file_path.length > 0) {
        toggleStates[attachment.key] = isValidUrl(attachment.file_path[0])
        if (toggleStates[attachment.key]) {
          // It's a link - set the form value
          setValue(`additional_attachments.${attachment.key}` as any, attachment.file_path[0])
        }
      }
    })
    setSwitchTogglableButton(toggleStates)

    setValue('with_ppn', paymentDetailData.with_ppn)
    setValue('description', paymentDetailData.description)

    if (paymentDetailData.with_ppn) {
      const include = document.getElementById('include') as HTMLInputElement
      if (include) {
        include.checked = true
      }
    } else {
      const exclude = document.getElementById('exclude') as HTMLInputElement
      if (exclude) {
        exclude.checked = true
      }
    }
  }, [paymentDetailData, vendorDetailData])

  useEffect(() => {
    paymentListTrigger()

    if (router.query.edit) {
      paymentDetailTrigger(router.query.edit as string)
    }
  }, [router.query.edit])

  useEffect(() => {
    if (paymentDetailData?.vendor_id) {
      vendorDetailTrigger()
    }
  }, [paymentDetailData?.vendor_id])

  useEffect(() => {
    if (!budgetsFromProcurementsToPaymentRequestModified?.length) return

    const clearInitialTO = setTimeout(() => {
      setRenderForm(true)
    }, 1000)

    return () => {
      clearTimeout(clearInitialTO)
    }
  }, [budgetsFromProcurementsToPaymentRequestModified?.length])

  if (!renderForm) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading payment request form..." />
      </div>
    )
  }

  if (router.query.edit && paymentDetailData?.requested_by.id !== userLoggedinInformation?.employee_id) {
    return (
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle={"Can't update payment"}
        modalDescription=""
        stateModal={true}
        modalSizeStyles="max-w-[25rem]"
        handleCloseModal={() => {
          return
        }}
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>
              The responsible to edit of this payment is{' '}
              <span className="font-semibold">{paymentDetailData?.requested_by.name}</span>
            </li>
          </ul>
        </div>
      </Modal>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitPaymentRequest, handleErrorPaymentRequest)}>
      <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">Submit Payment Request Form</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="inline-flex gap-3">
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
              isLoading={loadingButtonStatement.submitPayment}
            >
              Submit Payment Request
              <PlusIcon className="h-5 w-5 stroke-white" />
            </Button>
          </div>
        </div>
      </div>
      <div className="p-7 xl:p-10">
        <div className="grid grid-cols-4 gap-5 border-b border-b-gray-200 py-6">
          <div className="col-span-2">
            <p className="mb-2 text-xs font-bold text-gray-500">Project</p>
            <div className="inline-flex items-center gap-2">
              <p className="text-xl font-semibold text-gray-900">{programDetail?.program_name}</p>
              <Link href={`/dashboard/project/${programId}`}>
                <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
              </Link>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Partner</p>
            <div className="inline-flex items-center gap-2">
              <p className="text-xl font-semibold text-gray-900">{programDetail?.partner?.name}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Activity</p>
            <div className="inline-flex items-center gap-2">
              <p className="text-xl font-semibold text-gray-900">
                ({requisitionFormDetail?.projects[0].code}) {requisitionFormDetail?.projects[0].description}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-6">
          <div>
            <label htmlFor="description" className="mb-2 block text-xs font-bold text-gray-500">
              Activity Name
            </label>
            <textarea
              {...register('description', {
                required: 'Activity name is required field',
              })}
              id="description"
              className={cn(
                'form-textarea w-full resize-none rounded-lg border px-3.5 py-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
                errors.description
                  ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
                  : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
              )}
              rows={3}
              placeholder="Enter the description of the activity (max 250 char)"
              maxLength={250}
            ></textarea>
            {errors.description && <span className="input-hint-text error">{errors.description?.message}</span>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5 border-b border-b-gray-200 py-6">
          <div className="flex grow flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Requisition Form</p>
              <div className="inline-flex items-center gap-2">
                <p className="text-lg font-semibold uppercase text-gray-900">{requisitionFormDetail.number}</p>
                <Link href={`/dashboard/procurement/${programId}/detail/${projectId}/${rfId}`}>
                  <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                Estimated Transfer (Exclude Tax)
                <InfoCircleIcon className="h-3 w-3 stroke-gray-500" />
              </p>
              <p className="text-xl font-semibold tracking-tight text-gray-900">
                {formatCurrency(
                  programDetail.currency as unknown as CurrencyUnion,
                  // estimatedTransfer,
                  calculateTotalBudgetProcurement(watch('activities')) -
                    calculateTotalBudgetAdvancePaymentRequest(budgetsFromProcurementsToPaymentRequestModified),
                )}
              </p>
            </div>
            <div>
              <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                Payment Date
              </label>
              <Controller
                control={control}
                name="expected_payment_date"
                rules={{ required: 'Payment date is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <DatePickerCalendar
                      id="expected_payment_date"
                      size="sm"
                      dateFormat="eee, dd MMM yyyy"
                      selected={paymentDate}
                      onChange={(date: Date) => {
                        setPaymentDate(date)
                        onChange(date)
                      }}
                      error={invalid}
                    />
                    {errors.expected_payment_date && (
                      <span className="input-hint-text error">{errors.expected_payment_date?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
          </div>
          <div className="flex grow flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Vendor Type</p>
              <p className="text-xl font-semibold text-gray-900">
                {budgetsFromProcurementsToPaymentRequest?.[0].budgets[0].vendor_category_information.vendor_type.name}
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
              <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                Vendor
              </label>
              <Controller
                control={control}
                rules={{
                  required: 'Vendor is required field',
                }}
                name={`vendor_id`}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <>
                    <ComboboxRadix
                      widthControllerStyles="w-full"
                      placeholder="Vendor"
                      value={value}
                      listData={vendor}
                      handleChange={(vendor) => onChange(vendor)}
                      error={invalid}
                      showAvatar={isStaffInternalVendor}
                    />
                    {errors.vendor_id && <span className="input-hint-text error">{errors.vendor_id?.message}</span>}
                  </>
                )}
              />
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
                className="w-full justify-center"
                onClick={openAdditionalAttachmentDrawer}
              >
                Additional Attachment for Payment Request
              </Button>
            </div>
            {!isStaffInternalVendor && (
              <>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Vendor Information</p>
                  {choosenVendorId ? (
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
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <p className="text-lg font-semibold text-error-400">(Please choose the vendor first)</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Bank Information</p>
                  {choosenVendorId ? (
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
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <p className="text-lg font-semibold text-error-400">(Please choose the vendor first)</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5 border-b border-b-gray-200 py-6">
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Total Payment Requested</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(
                programDetail.currency as unknown as CurrencyUnion,
                calculateTotalBudgetProcurement(watch('activities')) || 0,
              )}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Total Advance Payment</p>
            <p className="text-2xl font-semibold text-gray-900">0</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Include or Exclude PPN?</p>
            <div className="grid grid-cols-2 items-center gap-2">
              {taxOptions.map((tax) => (
                <div key={`${snakeCase(tax.text)}`}>
                  <input
                    {...register('with_ppn')}
                    className="select-multiple standart hidden"
                    id={`${snakeCase(tax.text)}`}
                    value={snakeCase(tax.text)}
                    type="radio"
                    name="with_ppn"
                    defaultChecked={snakeCase(tax.text) === 'include' ? true : false}
                  />
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    htmlFor={`${snakeCase(tax.text)}`}
                  >
                    <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300 bg-white bg-center bg-no-repeat duration-300"></span>
                    <p className="font-medium text-gray-700 duration-300">{tax.text}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5 border-b border-b-gray-200 py-6">
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Requested by</p>
            <div className="flex items-center gap-2.5">
              <Image
                src={requestedByAvatar}
                width={32}
                height={24}
                alt={requestedByAvatar}
                className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
              />
              <p className="font-semibold text-gray-700">{userLoggedinInformation?.employee_name}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">
              {programDetail?.program_ownership_type === 'INTERNAL' ? 'General Manager' : 'Project Manager'}
            </p>
            <div className="flex items-center gap-2.5">
              <Image
                src={programManagerAvatar}
                width={32}
                height={24}
                alt={programManagerAvatar}
                className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
              />
              <p className="font-semibold text-gray-700">
                {(programDetail?.program_ownership_type === 'INTERNAL'
                  ? (programDetail as any)?.general_manager?.full_name
                  : programDetail?.program_manager?.full_name) || null}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex w-full flex-col">
            {budgetsFromProcurementsToPaymentRequestModified?.map((activity, activityIndex) => (
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
                        {formatCurrency(
                          'IDR',
                          calculateUnitCostPerActivity(watch(`activities.${activityIndex}`) || activity),
                          true,
                        )}
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
                            <div className="w-32 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">No</div>
                            <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                              Description
                            </div>
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                              Vendor Category
                            </div>
                            <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">Qty</div>
                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">Unit</div>
                            <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">Pckg Qty</div>
                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                              Pckg Unit
                            </div>
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                              Unit Cost
                            </div>
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                              Total Payment Request
                            </div>
                            {/* <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                Advance Payment
                              </div> */}
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                              Remaining Budget
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-200 text-sm">
                          {activity.budgets?.map((budget, budgetIndex) => (
                            <div className="flex items-center" key={budget.code}>
                              <div className="w-32 p-4">{budget.code.replace(/\.(\d+)$/, '-$1')}</div>
                              <div className="w-52 p-4">{budget.description}</div>
                              <div className="w-48 p-4 capitalize">{budget.vendor_category_information.name}</div>
                              <div className="w-24 px-4 py-2.5">
                                <Controller
                                  control={control}
                                  rules={{
                                    required: 'Qty is required field',
                                  }}
                                  name={`activities.${activityIndex}.budgets.${budgetIndex}.qty`}
                                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                                    <>
                                      <Input
                                        type="number"
                                        value={value || ''}
                                        placeholder="Qty"
                                        onChange={onChange}
                                        size="sm"
                                        error={invalid}
                                      />
                                      {errors.activities?.[activityIndex]?.budgets?.[budgetIndex]?.qty && (
                                        <span className="input-hint-text error">
                                          {errors.activities?.[activityIndex].budgets?.[budgetIndex]?.qty?.message}
                                        </span>
                                      )}
                                    </>
                                  )}
                                />
                              </div>
                              <div className="w-28 p-4 lowercase">{budget.unit}</div>
                              <div className="w-24 px-4 py-2.5">
                                <Controller
                                  control={control}
                                  rules={{
                                    required: 'Pckg Qty is required field',
                                  }}
                                  name={`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`}
                                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                                    <>
                                      <Input
                                        type="number"
                                        value={value || ''}
                                        placeholder="Qty"
                                        onChange={onChange}
                                        size="sm"
                                        error={invalid}
                                      />
                                      {errors.activities?.[activityIndex]?.budgets?.[budgetIndex]?.pkg_qty && (
                                        <span className="input-hint-text error">
                                          {errors.activities?.[activityIndex].budgets?.[budgetIndex]?.pkg_qty?.message}
                                        </span>
                                      )}
                                    </>
                                  )}
                                />
                              </div>
                              <div className="w-28 p-4 lowercase">{budget.pkg_unit}</div>
                              <div className="w-48 px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                  <p className="text-gray-500">Rp</p>
                                  <div>
                                    <Controller
                                      control={control}
                                      rules={{
                                        required: 'Unit cost is required field',
                                      }}
                                      name={`activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`}
                                      render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                                        <>
                                          <Input
                                            type="number"
                                            align="end"
                                            placeholder="0"
                                            value={value || ''}
                                            isCurrency={true}
                                            inputSelectionInit="IDR"
                                            onChange={onChange}
                                            size="sm"
                                            error={invalid}
                                          />
                                          {errors.activities?.[activityIndex]?.budgets?.[budgetIndex]
                                            ?.unit_cost_value && (
                                            <span className="input-hint-text error">
                                              {
                                                errors.activities?.[activityIndex].budgets?.[budgetIndex]
                                                  ?.unit_cost_value?.message
                                              }
                                            </span>
                                          )}
                                        </>
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Total Payment Request */}
                              <div className="w-48 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p>Rp</p>
                                  <p>
                                    {formatCurrency(
                                      'IDR',
                                      Number(watch(`activities.${activityIndex}.budgets.${budgetIndex}.qty`) || 0) *
                                        Number(
                                          watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) || 0,
                                        ) *
                                        convertStringCurrency(
                                          watch(`activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`) ||
                                            0,
                                        ) || 0,
                                      true,
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="w-48 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p>Rp</p>
                                  <p>
                                    {formatCurrency(
                                      'IDR',
                                      remainingBudgetPayment(
                                        router.query.edit,
                                        budget,
                                        watch(`activities.${activityIndex}.budgets.${budgetIndex}`),
                                      ),
                                      true,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Attachment */}
      <Drawer
        isOpen={additionalAttachmentDrawer}
        setIsOpen={setAdditionalAttachmentDrawer}
        title="Additional Attachments"
        description="Payment Request"
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeAdditionalAttachmentDrawer}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button
              type="button"
              btnType="normal"
              variant="primary"
              size="md"
              onClick={closeAdditionalAttachmentDrawer}
            >
              Save
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          {attachmentList.map((attachment, attachmentIndex) => {
            const attachmentKey = slugify(attachment)
            const existingAttachment = existingAttachments.find((att) => att.key === attachmentKey)
            const existingFilePath =
              existingAttachment && !isValidUrl(existingAttachment.file_path[0])
                ? existingAttachment.file_path[0]
                : null

            return (
              <Fragment key={attachmentIndex}>
                <FileUploadDragDropDynamic
                  name={`additional_attachments.${attachmentKey}` as any}
                  label={attachment}
                  fieldKey={attachmentKey}
                  control={control}
                  errors={errors}
                  setValue={setValue}
                  isLinkMode={switchTogglableButton[attachmentKey] || false}
                  onToggle={() => {
                    setSwitchTogglableButton((prev) => ({
                      ...prev,
                      [attachmentKey]: !prev[attachmentKey],
                    }))
                  }}
                  bucketName={BucketsEnum.pr_attachment}
                  uploadProgress={tempProgressUpload}
                  uploadedFiles={uploadedFilesByType[attachmentKey] || []}
                  setUploadedFiles={(files) => {
                    setUploadedFilesByType((prev) => ({
                      ...prev,
                      [attachmentKey]: files,
                    }))
                  }}
                  handleUploadFile={handleUploadFile}
                  deleteFilePath={(filename) => deleteAttachmentFile(attachmentKey, filename)}
                  existingFilePath={existingFilePath}
                  handleDeleteExistingFile={() => {
                    setExistingAttachments((prev) => prev.filter((att) => att.key !== attachmentKey))
                  }}
                  isEditMode={router.query.edit !== undefined}
                  isRequired={false}
                  maxFiles={1}
                  informationText="IMAGE or DOCUMENTS (max. 5MB)"
                />
              </Fragment>
            )
          })}
        </div>
      </Drawer>

      {/* Vendor Information */}
      <Drawer
        isOpen={vendorInformationDrawer}
        setIsOpen={setVendorInformationDrawer}
        title="Vendor Information"
        description={`(${requisitionFormDetail.number.toUpperCase()})`}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`/dashboard/external/vendor-adm/edit/${vendorDetail?.id}?section=vendor-information`}
            >
              <Button btnType="div" variant="secondary-gray" size="md">
                Update Vendor Files
              </Button>
            </Link>
          </>,
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
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_information['name']}</p>
              <Link href={`/dashboard/external/vendor-adm/${vendorDetail?.id}`}>
                <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
              </Link>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          {(vendorTypeMemo?.toLowerCase() === VendorEnum.SERVICES ||
            vendorTypeMemo?.toLowerCase() === VendorEnum.CONSULTANT) && (
            <>
              {vendorTypeMemo?.toLowerCase() === VendorEnum.SERVICES ? (
                <>
                  {categoriesValue?.some(
                    (category) => category.name === 'Key Person' || category.name === 'Moderator',
                  ) && (
                    <>
                      {vendorDetail?.vendor_information['identity_path'] ? (
                        <div>
                          <label className="mb-3 block text-sm font-medium text-gray-700">
                            Nationality Identity Card
                          </label>
                          {vendorDetail?.vendor_information['identity_path'].map((file: any, index: number) => (
                            <div key={index}>
                              <FilePreview fileName={file} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <label className="mb-3 block text-sm font-medium text-gray-700">
                            Nationality Identity Card
                          </label>
                          <EmptyFile
                            message="No Nationality Identity Card found"
                            description="Please go to vendor page to update Nationality Identity Card"
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {vendorDetail?.vendor_information['identity_path'] ? (
                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">Nationality Identity Card</label>
                      {vendorDetail?.vendor_information['identity_path'].map((file: any, index: number) => (
                        <div key={index}>
                          <FilePreview fileName={file} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">Nationality Identity Card</label>
                      <EmptyFile
                        message="No Nationality Identity Card found"
                        description="Please go to vendor page to update Nationality Identity Card"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {vendorTypeMemo?.toLowerCase() !== VendorEnum.TRAVEL &&
            vendorTypeMemo?.toLowerCase() !== VendorEnum.SUBSCRIPTIONS && (
              <>
                {vendorTypeMemo?.toLowerCase() === VendorEnum.GOODS ||
                vendorTypeMemo?.toLowerCase() === VendorEnum.EVENT ||
                vendorTypeMemo?.toLowerCase() === VendorEnum.MISC ? (
                  <>
                    {categoriesValue?.some(
                      (category) =>
                        // Goods
                        category.name === 'IT/Peripherals' ||
                        category.name === 'Equipment' ||
                        // Event
                        category.name === UNFIX_TRANSPORT ||
                        category.name === 'Food Services' ||
                        category.name === 'Event Organizer' ||
                        // Miscellaneous
                        category.name === 'Auditor' ||
                        category.name === 'Contractor',
                    ) && (
                      <>
                        {vendorDetail?.vendor_information['npwp_path'] ? (
                          <div>
                            <label className="mb-3 block text-sm font-medium text-gray-700">NPWP</label>
                            {vendorDetail?.vendor_information['npwp_path'].map((file: any, index: number) => (
                              <div key={index}>
                                <FilePreview fileName={file} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <label className="mb-3 block text-sm font-medium text-gray-700">NPWP</label>
                            <EmptyFile message="No NPWP found" description="Please go to vendor page to update NPWP" />
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {vendorDetail?.vendor_information['npwp_path'] ? (
                      <div>
                        <label className="mb-3 block text-sm font-medium text-gray-700">NPWP</label>
                        {vendorDetail?.vendor_information['npwp_path'].map((file: any, index: number) => (
                          <div key={index}>
                            <FilePreview fileName={file} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label className="mb-3 block text-sm font-medium text-gray-700">NPWP</label>
                        <EmptyFile message="No NPWP found" description="Please go to vendor page to update NPWP" />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

          {vendorTypeMemo?.toLowerCase() === VendorEnum.EVENT && (
            <>
              {categoriesValue?.some((category) => category.name === 'Transportation') && (
                <>
                  <>
                    {vendorDetail?.vendor_information['driving_license_path'] ? (
                      <div>
                        <label className="mb-3 block text-sm font-medium text-gray-700">
                          Surat Izin Mengemudi (SIM)
                        </label>
                        {vendorDetail?.vendor_information['driving_license_path'].map((file: any, index: number) => (
                          <div key={index}>
                            <FilePreview fileName={file} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label className="mb-3 block text-sm font-medium text-gray-700">
                          Surat Izin Mengemudi (SIM)
                        </label>
                        <EmptyFile
                          message="No Surat Izin Mengemudi found"
                          description="Please go to vendor page to update SIM"
                        />
                      </div>
                    )}
                  </>
                  <>
                    {vendorDetail?.vendor_information['vechile_registration_path'] ? (
                      <div>
                        <label className="mb-3 block text-sm font-medium text-gray-700">
                          Surat Tanda Nomor Kendaraan (STNK)
                        </label>
                        {vendorDetail?.vendor_information['vechile_registration_path']?.map(
                          (file: any, index: number) => (
                            <div key={index}>
                              <FilePreview fileName={file} />
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="mb-3 block text-sm font-medium text-gray-700">
                          Surat Tanda Nomor Kendaraan (STNK)
                        </label>
                        <EmptyFile
                          message="No Surat Tanda Nomor Kendaraan found"
                          description="Please go to vendor page to update STNK"
                        />
                      </div>
                    )}
                  </>
                </>
              )}
            </>
          )}

          {vendorTypeMemo?.toLowerCase() === VendorEnum.EVENT &&
            categoriesValue?.some((category) => category.name === 'Event Organizer') && (
              <>
                {vendorDetail?.vendor_information['cv_path'] ? (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">Curriculum Vitae (CV)</label>
                    {vendorDetail?.vendor_information['cv_path'].map((file: any, index: number) => (
                      <div key={index}>
                        <FilePreview fileName={file} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">Curriculum Vitae (CV)</label>
                    <EmptyFile
                      message="No Curriculum Vitae found"
                      description="Please go to vendor page to update CV"
                    />
                  </div>
                )}
              </>
            )}

          {(vendorTypeMemo?.toLowerCase() === VendorEnum.SERVICES ||
            vendorTypeMemo?.toLowerCase() === VendorEnum.CONSULTANT) && (
            <>
              <>
                {vendorDetail?.vendor_information['cv_path'] ? (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">Curriculum Vitae (CV)</label>
                    {vendorDetail?.vendor_information['cv_path'].map((file: any, index: number) => (
                      <div key={index}>
                        <FilePreview fileName={file} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">Curriculum Vitae (CV)</label>
                    <EmptyFile
                      message="No Curriculum Vitae found"
                      description="Please go to vendor page to update CV"
                    />
                  </div>
                )}
              </>

              {vendorDetail?.vendor_information['nationality'] === 'warga_negara_asing' ? (
                <>
                  {vendorDetail?.vendor_information['cod_path'] ? (
                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">
                        Certificate of Domicile (CoD)
                      </label>
                      {vendorDetail?.vendor_information['cod_path'].map((file: any, index: number) => (
                        <div key={index}>
                          <FilePreview fileName={file} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label className="mb-3 block text-sm font-medium text-gray-700">
                        Certificate of Domicile (CoD)
                      </label>
                      <EmptyFile
                        message="No Certificate of Domicile found"
                        description="Please go to vendor page to update CoD"
                      />
                    </div>
                  )}
                </>
              ) : null}
            </>
          )}

          {totalVendorFilesNonAdditional ? <div className="h-px w-full bg-gray-200"></div> : null}

          <>
            {vendorDetail?.vendor_information['other_path'] ? (
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">Additional Documents</label>
                <div className="flex flex-col gap-3">
                  {vendorDetail?.vendor_information['other_path'].map((file: any, index: number) => (
                    <div key={index}>
                      <FilePreview fileName={file} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">Additional Documents</label>
                <EmptyFile
                  message="No Additional Documents found"
                  description="Please go to vendor page to update Additional Documents"
                />
              </div>
            )}
          </>
        </div>
      </Drawer>

      {/* Bank Account */}
      <Drawer
        isOpen={bankAccountDrawer}
        setIsOpen={setBankAccountDrawer}
        title="Bank Account"
        description={`(${requisitionFormDetail.number.toUpperCase()})`}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        drawerWidth="w-[28rem]"
        footerButton={[
          <>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`/dashboard/external/vendor-adm/edit/${vendorDetail?.id}?section=vendor-payment`}
            >
              <Button btnType="div" variant="secondary-gray" size="md">
                Edit Bank Account
              </Button>
            </Link>
          </>,
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
          <div>
            <label className="input-label">Vendor Name</label>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_information['name']}</p>
              <Link href={`/dashboard/external/vendor-adm/${vendorDetail?.id}`}>
                <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
              </Link>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">Beneficiary Name</label>
            <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_payment.bank_acc_name}</p>
          </div>
          <div>
            <label className="input-label">Bank Name</label>
            <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_payment.bank_name}</p>
          </div>
          <div>
            <label className="input-label">Bank Account Number</label>
            <p className="text-lg font-semibold text-gray-900">{vendorDetail?.vendor_payment.bank_acc_number}</p>
          </div>
        </div>
      </Drawer>
    </form>
  )
}
