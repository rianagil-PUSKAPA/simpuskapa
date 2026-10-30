/* eslint-disable tailwindcss/no-custom-classname */
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { ActivityBudgetListModified } from '@/layout/program/budget-needs/BudgetNeedsList'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import ProgramRoleAccessControlProvider, { accessActionType, programTasks } from '@/providers/ProgramRoleAccessControl'
import { BucketsEnum } from '@/shared/file.system'
import { APSResult } from '@/shared/pr.type'
import { RoleDefinition } from '@/shared/role.access'
import { BucketsUnion, ComboboxType, CurrencyUnion, DynamicProgressType } from '@/types/global'
import { FundReceived } from '@/types/program'
import { theme } from '@/types/themes'
import { VendorEnum } from '@/types/vendor'
import { createAPIConfig } from '@/utils/apiAuthToken'
import {
  fileApi,
  getAllVendorsCombobox,
  getDetailPayment,
  getOpenUrl,
  getVendorDetail,
  paymentRequestApi,
  programApi,
  vendorExternalApi,
} from '@/utils/apiRequestHelper'
import { FUND_RECEIVED_TYPE, MAIN_URL_FE, UNFIX_TRANSPORT } from '@/utils/constant'
import {
  calculateTotalAdvancePaymentRequest,
  calculateTotalBudgetProcurement,
  calculateUnitCostPerActivity,
  checkIsLoggedInRoleAll,
  convertStringCurrency,
  deduplicateByKey,
  formatCurrency,
  slugify,
  snakeCase,
} from '@/utils/globalHelper'
import axios from 'axios'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  BudgetProgramProjectListResponse,
  CreatePaymentRequestApiRequest,
  CreatePaymentRequestApiRequestPaymentTypeEnum,
  PRAttachment,
  PaymentRequestApi,
  PaymentRequestDetail as PaymentRequestDetailType,
  ProgramApi,
  ProgramDetail,
  VendorDto,
} from 'sdk/api'
import useSWRMutation from 'swr/mutation'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const Drawer: any = dynamic(() => import('@/components/Drawer').then((mod) => mod.Drawer))
const EmptyFile: any = dynamic(() => import('@/components/EmptyFile').then((mod) => mod.EmptyFile))
const FilePreview: any = dynamic(() => import('@/components/FilePreview').then((mod) => mod.FilePreview))
const FileUploadDragDropDynamic: any = dynamic(() =>
  import('@/components/FileUploadDragDropDynamic').then((mod) => mod.FileUploadDragDropDynamic),
)
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const Loader: any = dynamic(() => import('@/components/Loader').then((mod) => mod.Loader))
const Modal: any = dynamic(() => import('@/components/Modal').then((mod) => mod.Modal))
const AlertTriangleIcon: any = dynamic(() =>
  import('@/components/icon/AlertTriangleIcon').then((mod) => mod.AlertTriangleIcon),
)
const FileSearch02Icon: any = dynamic(() =>
  import('@/components/icon/FileSearch02Icon').then((mod) => mod.FileSearch02Icon),
)
const InfoCircleIcon: any = dynamic(() => import('@/components/icon/InfoCircleIcon').then((mod) => mod.InfoCircleIcon))
const LinkExternal02Icon: any = dynamic(() =>
  import('@/components/icon/LinkExternal02Icon').then((mod) => mod.LinkExternal02Icon),
)
const PlusIcon: any = dynamic(() => import('@/components/icon/PlusIcon').then((mod) => mod.PlusIcon))
const ComboboxRadix: any = dynamic(() => import('@/components/radix/ComboboxRadix').then((mod) => mod.ComboboxRadix))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

type CreateAdvancePaymentStatementType = CreatePaymentRequestApiRequest & {
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

type Props = {
  programDetail: ProgramDetail
  aprDetail: PaymentRequestDetailType
  totalFundReceived?: number
  budgetNeeds: BudgetProgramProjectListResponse
}

const AdvancePaymentStatement = ({ programDetail, aprDetail, totalFundReceived, budgetNeeds }: Props) => {
  const router = useRouter()

  const { userLoggedinInformation } = useDashboardContext()

  const breadcrumbUrl = useMemo(() => {
    const allowedRoles = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM, RoleDefinition.SUPERADMIN]
    return allowedRoles.includes(userLoggedinInformation?.role) ? '/dashboard/finance/advance-payment-statement' : ''
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
  const [additionalAttachmentDrawer, setAdditionalAttachmentDrawer] = useState(false)
  const [vendorInformationDrawer, setVendorInformationDrawer] = useState(false)
  const [bankAccountDrawer, setBankAccountDrawer] = useState(false)
  const [vendorTypes, setVendorTypes] = useState<string[]>([])
  const [vendorDetail, setVendorDetail] = useState<VendorDto | null>(null)
  const [vendor, setVendor] = useState<ComboboxType[]>([])
  const [choosenVendorId, setChoosenVendorId] = useState<string>('')
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [additionalAttachments, setAdditionalAttachments] = useState<
    {
      key: string
      file: File[]
    }[]
  >([])
  const [attachmentLinks, setAttachmentLinks] = useState<PRAttachment[]>([])
  const [attachmentsFiles, setAttachmentsFiles] = useState<PRAttachment[]>([])
  const [existingAttachments, setExistingAttachments] = useState<PRAttachment[]>([])
  const [attachmentList, setAttachmentList] = useState<string[]>([])
  const [isAdditionalInformationExist, setIsAdditionalInformationExist] = useState(false)
  const [renderForm, setRenderForm] = useState<boolean>(false)
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    submitPayment: boolean
  }>({
    submitPayment: false,
  })

  const vendorTypeMemo = useMemo(() => {
    if (aprDetail?.projects[0].activities?.[0].budgets[0].vendor_category_information.vendor_type.name) {
      return aprDetail?.projects[0].activities?.[0].budgets[0].vendor_category_information.vendor_type.name
    }
  }, [aprDetail])

  const categoriesValue = useMemo(() => {
    if (vendorDetail) {
      return vendorDetail?.vendor_categories.map((item) => ({
        id: item.vendor_category_info_id,
        name: item.vendor_category_info.name,
      }))
    }
  }, [vendorDetail])

  const { data: paymentDetailData, trigger: paymentDetailTrigger } = useSWRMutation(
    router.query.edit ? router.query.edit : null,
    (paymentId: string) => getDetailPayment(paymentId),
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
    getValues,
    formState: { errors },
  } = useForm<CreateAdvancePaymentStatementType>({
    defaultValues: {
      description: !router.query.edit ? aprDetail.description : undefined,
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

  const handleUploadText = async (text: string, identifier: string) => {
    setAttachmentLinks((prev) => {
      prev = prev.filter((item) => item.key !== identifier)
      prev = [...prev, { key: identifier, file_path: [text] }]

      return prev
    })
  }

  const handleUploadFile = async (fileObjects: File[], identifier: string) => {
    if (!Array.isArray(fileObjects)) return
    const bucketName = BucketsEnum.pr_attachment

    fileObjects.map(async (fileObject) => {
      setAdditionalAttachments((prev) => {
        prev = prev.filter((item) => item.key !== identifier)
        prev = [...prev, { key: identifier, file: [fileObject] }]

        return prev
      })
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

  const submitAdvancePaymentStatement: SubmitHandler<CreateAdvancePaymentStatementType> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: true }))

    const mergeDocs = [...attachmentsFiles, ...attachmentLinks]

    if (router.query.edit === undefined && attachmentList.length !== mergeDocs.length) {
      toast.warning("Please check all attachments, it's required field")
      openAdditionalAttachmentDrawer()
      setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
      return false
    }

    if (router.query.edit) {
      mergeDocs.forEach((newItem) => {
        const existingItem = existingAttachments.find((item) => item.key === newItem.key)
        if (existingItem) {
          existingItem.file_path = newItem.file_path
        }
      })
    }

    // Check real payment greather than RF
    let realPaymentGreaterThanRF = false

    aprDetail.projects.map((project) =>
      project.activities.map((activity, activityIndex) => {
        if (realPaymentGreaterThanRF) return

        activity.budgets.map((budget, index) => {
          const underlayingBudget = budget.qty * budget.pkg_qty * budget.unit_cost_value
          const realCalculation =
            Number(getValues(`activities.${activityIndex}.budgets.${index}.qty`) || 0) *
            Number(getValues(`activities.${activityIndex}.budgets.${index}.pkg_qty`) || 0) *
            Number(getValues(`activities.${activityIndex}.budgets.${index}.unit_cost_value`) || 0)

          if (realCalculation > underlayingBudget) {
            realPaymentGreaterThanRF = true
          }
        })
      }),
    )

    if (realPaymentGreaterThanRF) {
      toast.warning('Unable to create APS, karena APS lebih besar dari RF', {
        autoClose: 10000,
      })
      setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
      return false
    }

    const statement = () => {
      // const REAL_PAYMENT = calculateTotalBudget(aprDetail)
      const REAL_PAYMENT = calculateTotalBudgetProcurement(watch('activities'))
      const APR = calculateTotalAdvancePaymentRequest(aprDetail)

      if (APR > REAL_PAYMENT) {
        return APSResult.MS
      } else if (APR === REAL_PAYMENT) {
        return APSResult.RC
      } else if (APR < REAL_PAYMENT) {
        return APSResult.PR
      }
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
        `Sorry, the advance payment statement cannot be submitted due to the total of this request (${formatCurrency(
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
      rf_id: aprDetail.rf_id,
      vendor_id: choosenVendorId,
      description: formInput.description || '',
      payment_type: CreatePaymentRequestApiRequestPaymentTypeEnum.AdvancePaymentStatement,
      with_ppn: (formInput.with_ppn as unknown as string) === 'include' ? true : false,
      attachments: deduplicateByKey([...mergeDocs, ...existingAttachments]),
      budgets: formInput.activities.flatMap((activity) =>
        activity.budgets.flatMap((budget) => ({
          ...budget,
          recommended_vendor: choosenVendorId,
          unit_cost: `IDR_${Number(budget.unit_cost_value)}`,
          unit_cost_value: Number(budget.unit_cost_value),
          additional_data: '',
          action_by: '',
          advance_payment_total: budget.advance_payment_total ? budget.advance_payment_total : 0,
        })),
      ),
      aps_result: statement(),
      aps_related_pr_id: aprDetail.id,
      expected_payment_date: null,
      spending_deadline: null,
      travel_end_date_estimation: null,
      created_by: null,
    }

    // console.log('submitValues', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
    // return false

    if (router.query.edit) {
      const submitPaymentRequest = paymentRequestApi.pRControllerUpdatePaymentRequest(
        router.query.edit as unknown as string,
        submitValues,
      )

      toast.promise(submitPaymentRequest, {
        pending: 'Updating advance payment statement',
        success: 'Advance payment statement updated 🎉',
        error: 'Promise rejected 🤯',
      })

      submitPaymentRequest.then((success) => {
        router.replace(`/dashboard/finance/advance-payment-statement/${success.data.data}`)
      })
    } else {
      const submitPaymentRequest = paymentRequestApi.pRControllerCreatePaymentRequest(submitValues)

      toast.promise(submitPaymentRequest, {
        pending: 'Creating advance payment statement',
        success: 'Advance payment statement created 🎉',
        error: 'Promise rejected 🤯',
      })

      submitPaymentRequest.then((success) => {
        router.replace(`/dashboard/finance/advance-payment-statement/${success.data.data}`)
      })
    }
  }

  useEffect(() => {
    if (!paymentDetailData || vendorDetailData === undefined) return

    setValue('description', paymentDetailData.description)
    setValue('vendor_id', vendorDetailData.vendor_information['name'].toLowerCase())
    setExistingAttachments(JSON.parse(paymentDetailData.attachments as unknown as string))
    // setValue('with_ppn', paymentDetailData.with_ppn)

    // if (paymentDetailData.with_ppn) {
    //   const include = document.getElementById('include') as HTMLInputElement
    //   if (include) {
    //     include.checked = true
    //   }
    // } else {
    //   const exclude = document.getElementById('exclude') as HTMLInputElement
    //   if (exclude) {
    //     exclude.checked = true
    //   }
    // }
  }, [paymentDetailData, vendorDetailData])

  useEffect(() => {
    const exec = async () => {
      if (choosenVendorId) {
        const vendorRes = await vendorExternalApi.vendorControllerGetVendorDetail(choosenVendorId)
        const result = vendorRes.data.data
        setVendorDetail(result)
      }
    }
    exec()
  }, [choosenVendorId])

  useEffect(() => {
    if (aprDetail) {
      const passPhotoEmployee = aprDetail?.requested_by.employee_pass_photo

      getOpenUrl(passPhotoEmployee[0].split('/')[0] as BucketsUnion, passPhotoEmployee[0].split('/')[1], 3600 * 24)
        .then((file) => {
          setRequestedByAvatar(file.url)
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
    const localVendorTypes = []
    const localVendorTypeIds = []
    aprDetail.projects.map((project) =>
      project.activities.map((activity) =>
        activity.budgets.map((budget) => {
          localVendorTypes.push(budget.vendor_category_information.name)
          localVendorTypeIds.push(budget.vendor_category_information.id)
        }),
      ),
    )
    setVendorTypes([...new Set(localVendorTypes)])

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
    }

    // Get vendor list based on vendor type and vendor category
    const getRecommendedVendor = async () => {
      const filterType = aprDetail.projects[0].activities?.[0].budgets[0].vendor_category_information.vendor_type.name

      const categoryTypes = aprDetail.projects
        .map((project) =>
          project.activities.map((activity) => activity.budgets.map((budget) => budget.vendor_category_information.id)),
        )
        .join(',')

      const vendor = await getAllVendorsCombobox(filterType, categoryTypes)
      setVendor(vendor)
    }
    getRecommendedVendor()
    exec()

    aprDetail.projects.map((project) =>
      project.activities.map((activity, activityIndex) =>
        activity.budgets.map((budget, index) => {
          setValue(`activities.${activityIndex}.budgets.${index}.id`, budget.id)
          setValue(`activities.${activityIndex}.budgets.${index}.ordering_seq`, budget.ordering_seq)
          setValue(`activities.${activityIndex}.budgets.${index}.code`, budget.code)
          setValue(`activities.${activityIndex}.budgets.${index}.description`, budget.description)
          setValue(`budgets.${index}.vendor_category_id`, budget.vendor_category_information.id)
          setValue(`activities.${activityIndex}.budgets.${index}.qty`, budget.qty)
          setValue(`activities.${activityIndex}.budgets.${index}.unit`, budget.unit)
          setValue(`activities.${activityIndex}.budgets.${index}.pkg_qty`, budget.pkg_qty)
          setValue(`activities.${activityIndex}.budgets.${index}.pkg_unit`, budget.pkg_unit)
          setValue(`activities.${activityIndex}.budgets.${index}.unit_cost_value`, budget.unit_cost_value)
          setValue(`activities.${activityIndex}.budgets.${index}.vendor_category_id`, budget.vendor_category_id)
          setValue(`activities.${activityIndex}.budgets.${index}.advance_payment_total`, budget.advance_payment_total)
        }),
      ),
    )

    if (!aprDetail?.projects) return

    const clearInitialTO = setTimeout(() => {
      setRenderForm(true)
    }, 1000)

    return () => {
      clearTimeout(clearInitialTO)
    }
  }, [aprDetail, aprDetail?.projects])

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
    const vendorName = watch('vendor_id')
    const vendorId = vendor.find((item) => item.name === vendorName)?.id as unknown as string
    setChoosenVendorId(vendorId)
  }, [watch('vendor_id')])

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
    if (router.query.edit) {
      paymentDetailTrigger()
    }

    if (router.query.edit && paymentDetailData?.vendor_id) {
      vendorDetailTrigger()
    }
  }, [router.query.edit, paymentDetailData?.vendor_id])

  if (!renderForm) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader customText="Loading advance payment statement form..." />
      </div>
    )
  }

  if (renderForm && router.query.edit && paymentDetailData?.requested_by.id !== userLoggedinInformation?.employee_id) {
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
              The responsible to edit of this advance payment statement is{' '}
              <span className="font-semibold">{paymentDetailData?.requested_by.name}</span>
            </li>
          </ul>
        </div>
      </Modal>
    )
  }

  return (
    <>
      <NextSeo
        title="Advance Payment Statement"
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
        <div className="sim-modern-forms sim-modern-forms-payment">
          <form onSubmit={handleSubmit(submitAdvancePaymentStatement)}>
            <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
              <div>
                <h1 className="mb-1 text-2xl font-semibold text-gray-900">Submit Advance Payment Statement Form</h1>
              </div>
              <ProgramRoleAccessControlProvider
                programId={aprDetail.program_id}
                task={programTasks.CREATE_APS}
                action={accessActionType.CREATE}
                isActionBy={aprDetail.requested_by.id === userLoggedinInformation?.employee_id}
                replaceWith={<></>}
              >
                <div className="inline-flex items-center gap-3">
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
                    Submit Advance Payment Statement
                    <PlusIcon className="h-5 w-5 stroke-white" />
                  </Button>
                </div>
              </ProgramRoleAccessControlProvider>
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
                    <p className="mb-2 text-xs font-bold text-gray-500">Advance Payment</p>
                    <div className="inline-flex items-center gap-2">
                      <p className="text-lg font-semibold uppercase text-gray-900">
                        {aprDetail.number.replace(/\s/g, '')}
                      </p>
                      <Link
                        href={`/dashboard/procurement/${programDetail.id}/detail/${aprDetail.projects[0].id}/${aprDetail.rf_id}`}
                      >
                        <LinkExternal02Icon className="h-5 w-5 stroke-gray-500" />
                      </Link>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                      Statement Result
                      <InfoCircleIcon className="h-3 w-3 stroke-gray-500" />
                    </p>
                    <p className="text-xl font-semibold text-error-400">Please Complete the Statement</p>
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
                      Estimated Money to Processed
                      <InfoCircleIcon className="h-3 w-3 stroke-gray-500" />
                    </p>
                    <p className="text-xl font-semibold text-error-400">Please Complete the Statement</p>
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
                          />
                          {errors.vendor_id && (
                            <span className="input-hint-text error">{errors.vendor_id?.message}</span>
                          )}
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
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(
                      programDetail.currency as unknown as CurrencyUnion,
                      calculateTotalAdvancePaymentRequest(aprDetail) || 0,
                    )}
                  </p>
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
                    <p className="font-semibold text-gray-700">{aprDetail.requested_by.name}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-500">Project Manager</p>
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={programManagerAvatar}
                      width={32}
                      height={24}
                      alt={programManagerAvatar}
                      className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
                    />
                    <p className="font-semibold text-gray-700">{programDetail?.program_manager?.full_name || null}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex w-full flex-col">
                  {aprDetail.projects.map((project) =>
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
                                      Total Payment
                                    </div>
                                    <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                      Advance Payment
                                    </div>
                                    <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                      Remaining Budget
                                    </div>
                                  </div>
                                </div>
                                <div className="divide-y divide-gray-200 text-sm">
                                  {activity.budgets?.map((budget, budgetIndex) => (
                                    <div className="flex items-center" key={budget.code}>
                                      <div className="w-32 p-4 pl-6">{budget.code.replace(/\.(\d+)$/, '-$1')}</div>
                                      <div className="w-52 p-4">{budget.description}</div>
                                      <div className="w-48 p-4 capitalize">
                                        {budget.vendor_category_information.name}
                                      </div>
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
                                              {errors.activities?.[activityIndex].budgets?.[budgetIndex]?.qty && (
                                                <span className="input-hint-text error">
                                                  {
                                                    errors.activities?.[activityIndex].budgets?.[budgetIndex]?.qty
                                                      ?.message
                                                  }
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
                                              {errors.activities?.[activityIndex].budgets?.[budgetIndex]?.pkg_qty && (
                                                <span className="input-hint-text error">
                                                  {
                                                    errors.activities?.[activityIndex].budgets?.[budgetIndex]?.pkg_qty
                                                      ?.message
                                                  }
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
                                                  {errors.activities?.[activityIndex].budgets?.[budgetIndex]
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
                                      <div className="w-48 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                          <p>Rp</p>
                                          <p>
                                            {formatCurrency(
                                              'IDR',
                                              Number(
                                                watch(`activities.${activityIndex}.budgets.${budgetIndex}.qty`) || 0,
                                              ) *
                                                Number(
                                                  watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) ||
                                                    0,
                                                ) *
                                                convertStringCurrency(
                                                  watch(
                                                    `activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                                  ) || 0,
                                                ),
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
                                      <div className="w-48 bg-white p-4">
                                        <div className="flex items-center justify-between gap-3">
                                          <p>Rp</p>
                                          <p>
                                            {formatCurrency(
                                              'IDR',
                                              budget.qty * budget.pkg_qty * budget.unit_cost_value -
                                                Number(
                                                  watch(`activities.${activityIndex}.budgets.${budgetIndex}.qty`) || 0,
                                                ) *
                                                  Number(
                                                    watch(
                                                      `activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                                    ) || 0,
                                                  ) *
                                                  convertStringCurrency(
                                                    watch(
                                                      `activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                                    ) || 0,
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
                    )),
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </Dashboard>

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
          {attachmentList.map((attachment, attachmentIndex) => (
            <Fragment key={attachmentIndex}>
              <FileUploadDragDropDynamic
                attachmentName={attachment}
                bucketName={BucketsEnum.pr_attachment}
                progress={tempProgressUpload}
                fileAttachments={additionalAttachments
                  .filter((attachmentInternal) => attachmentInternal.key === slugify(attachment))
                  .flatMap(({ file }) => file)}
                onChange={(files: File[]) => {
                  handleUploadFile(files, slugify(attachment))
                }}
                onChangeText={(text: string) => {
                  handleUploadText(text, slugify(attachment))
                }}
                existingAttachments={existingAttachments}
                maxFiles={1}
                informationText="IMAGE or DOCUMENTS (max. 5MB)"
                allowedDataType={['images', 'png', 'jpg', 'jpeg', 'pdf', 'doc', 'xls', 'xlsx']}
                maxSize={5242880}
              />
            </Fragment>
          ))}
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
          {(vendorTypeMemo.toLowerCase() === VendorEnum.SERVICES ||
            vendorTypeMemo.toLowerCase() === VendorEnum.CONSULTANT) && (
            <>
              {vendorTypeMemo.toLowerCase() === VendorEnum.SERVICES ? (
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
          {vendorTypeMemo.toLowerCase() !== VendorEnum.TRAVEL &&
            vendorTypeMemo.toLowerCase() !== VendorEnum.SUBSCRIPTIONS && (
              <>
                {vendorTypeMemo.toLowerCase() === VendorEnum.GOODS ||
                vendorTypeMemo.toLowerCase() === VendorEnum.EVENT ||
                vendorTypeMemo.toLowerCase() === VendorEnum.MISC ? (
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

          {vendorTypeMemo.toLowerCase() === VendorEnum.EVENT && (
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

          {vendorTypeMemo.toLowerCase() === VendorEnum.EVENT &&
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

          {(vendorTypeMemo.toLowerCase() === VendorEnum.SERVICES ||
            vendorTypeMemo.toLowerCase() === VendorEnum.CONSULTANT) && (
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

          {isAdditionalInformationExist ? <div className="h-px w-full bg-gray-200"></div> : null}

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
        description={`(${aprDetail.number.toUpperCase()})`}
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
    </>
  )
}

export default AdvancePaymentStatement

export const getServerSideProps: GetServerSideProps = async (context) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [identifier, rfId] = context.params.slug
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const programApi = new ProgramApi(createAPIConfig(auth_token as string))
  const paymentRequestApi = new PaymentRequestApi(createAPIConfig(auth_token as string))
  try {
    const getAPRDetail = await paymentRequestApi.pRControllerGetDetailPaymentRequest(rfId as string)

    const finalAPRDetail = getAPRDetail.data.data

    const getProgram = await programApi.programControllerGetProgramDetail(finalAPRDetail.program_id)

    const programDetail = getProgram.data.data

    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    const checkUserRole = checkIsLoggedInRoleAll(authTokenJWT.payload['role'])

    if (!checkUserRole || finalAPRDetail.requested_by.id !== authTokenJWT.payload['employee_id']) {
      return {
        notFound: true,
      }
    }

    // Get total fund received
    let totalFundReceived = 0
    const fundReceivedTotalResponse = await programApi.programControllerGetSubmittedFundReceived(
      programDetail.id as string,
    )
    const fundReceivedTotalData = fundReceivedTotalResponse?.data?.data as FundReceived[]

    const puskapaTotal =
      fundReceivedTotalData
        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.PUSKAPA)
        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
    const donorTotal =
      fundReceivedTotalData
        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR)
        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
    const donorReimburseTotal =
      fundReceivedTotalData
        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR_REIMBURSE)
        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0

    totalFundReceived =
      donorTotal +
      donorReimburseTotal +
      (puskapaTotal - donorReimburseTotal < 0 ? 0 : puskapaTotal - donorReimburseTotal)

    // Budget needs at project level
    const budgetNeedsRes = await programApi.programControllerGetProgramBudget(programDetail.id as string)

    const budgetNeeds = budgetNeedsRes?.data?.data

    // Pass data to the page via props
    return {
      props: {
        programDetail,
        aprDetail: finalAPRDetail,
        activeSidebar: 'Payment Request',
        totalFundReceived,
        budgetNeeds,
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
