/* eslint-disable tailwindcss/no-custom-classname */
import { Button } from '@/components/Button'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Input } from '@/components/Input'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/Modal'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsUnion, ComboboxType } from '@/types/global'
import { theme } from '@/types/themes'
import {
  getAllVendorsCombobox,
  getDetailPayment,
  getOpenUrl,
  paymentRequestApi,
  programApi,
  requisitionFormApi,
} from '@/utils/apiRequestHelper'
import {
  calculateTotalBudget,
  calculateUnitCostPerActivity,
  convertStringCurrency,
  dateFormatToISO,
  formatCurrency,
  snakeCase,
} from '@/utils/globalHelper'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Controller, FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  BudgetProgramProjectListResponse,
  CreatePaymentRequestApiRequest,
  CreatePaymentRequestApiRequestApsResultEnum,
  CreatePaymentRequestApiRequestPaymentTypeEnum,
  ProgramDetail,
  RequisitionFormDetail,
} from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'
import { ActivityBudgetListModified } from '../program/budget-needs/BudgetNeedsList'
dayjs.extend(utc)

type PaymentRequestType = {
  programDetail: ProgramDetail
  requisitionFormDetail: RequisitionFormDetail
  paymentRequestIdentifier: 'APR'
  programId: string
  projectId: string
  rfId: string
  totalFundReceived: number
  budgetNeeds: BudgetProgramProjectListResponse
}

type CreateAdvancePaymentRequestType = CreatePaymentRequestApiRequest & {
  activities: {
    budgets: ActivityBudgetListModified[]
  }[]
}

export const AdvancePaymentRequest = ({
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

  const [paymentDate, setPaymentDate] = useState<Date | null>(null)
  const [spendingDeadlinePayment, setSpendingDeadlinePayment] = useState<Date | null>(null)
  const [vendor, setVendor] = useState<ComboboxType[]>([])
  const [choosenVendorId, setChoosenVendorId] = useState<string>('')
  const [vendorTypes, setVendorTypes] = useState<string[]>([])
  const [totalAdvanceCalculation, setTotalAdvanceCalculation] = useState<number>(0)
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    submitPayment: boolean
  }>({
    submitPayment: false,
  })
  const [renderForm, setRenderForm] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAdvancePaymentRequestType>({
    defaultValues: {
      description: !router.query.edit ? requisitionFormDetail.about_request : undefined,
    },
  })

  const { data: paymentDetailData, trigger: paymentDetailTrigger } = useSWRMutation(
    router.query.edit ? router.query.edit : null,
    (paymentId: string) => getDetailPayment(paymentId),
  )

  const submitAdvancePaymentRequest: SubmitHandler<CreateAdvancePaymentRequestType> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: true }))

    // Block request if total APR more than 50jt
    if (totalAdvanceCalculation > 50000000) {
      toast.warning("Total APR can't more than Rp 50.000.000", {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
      return false
    }

    if (totalAdvanceCalculation <= 0) {
      toast.warning("Total APR can't be 0 or less", {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
      return false
    }

    if (totalAdvanceCalculation > calculateTotalBudget(budgetNeeds)) {
      toast.error('Total advance payment request is more than total project budget!', {
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
      totalAdvanceCalculation + paidTotal >
      totalFundReceived
    ) {
      toast.error(
        `Sorry, the advance payment request cannot be submitted due to the total of this request (${formatCurrency(
          'IDR',
          totalAdvanceCalculation,
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
      payment_type: CreatePaymentRequestApiRequestPaymentTypeEnum.AdvancePaymentRequest,
      expected_payment_date: dateFormatToISO(dayjs(formInput.expected_payment_date).utc().format()),
      attachments: [],
      with_ppn: (formInput.with_ppn as unknown as string) === 'include' ? true : false,
      budgets: formInput.activities.flatMap((activity) =>
        activity.budgets.flatMap((budget) => ({
          ...budget,
          recommended_vendor: choosenVendorId,
          unit_cost: `IDR_${Number(budget.unit_cost_value)}`,
          unit_cost_value: Number(budget.unit_cost_value),
          action_by: '',
          advance_payment_total: Number(budget.advance_payment_total),
        })),
      ),
      spending_deadline: dateFormatToISO(dayjs(formInput.spending_deadline).utc().format()),
      aps_related_pr_id: null,
      aps_result: null as unknown as CreatePaymentRequestApiRequestApsResultEnum,
      travel_end_date_estimation: null,
      created_by: null,
    }

    // console.log('submitValues', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, submitPayment: false }))
    // return false

    if (router.query.edit) {
      const submitAdvancePaymentRequest = paymentRequestApi.pRControllerUpdatePaymentRequest(
        router.query.edit as unknown as string,
        submitValues,
      )

      toast.promise(submitAdvancePaymentRequest, {
        pending: 'Updating advance payment request',
        success: 'Advance payment request updated 🎉',
        error: 'Promise rejected 🤯',
      })

      submitAdvancePaymentRequest.then((success) => {
        router.replace(`/dashboard/finance/payment-request/${success.data.data}`)
        removeCookie('budget_needs_to_payment_request')
        removeCookie('project_to_payment_request')
        removeCookie('payment_request_type')
      })
    } else {
      const submitAdvancePaymentRequest = paymentRequestApi.pRControllerCreatePaymentRequest(submitValues)

      toast.promise(submitAdvancePaymentRequest, {
        pending: 'Creating advance payment request',
        success: 'Advance payment request created 🎉',
        error: 'Promise rejected 🤯',
      })

      submitAdvancePaymentRequest.then((success) => {
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

  const errorAdvanceSubmitPaymentRequest = async (error: FieldErrors<CreateAdvancePaymentRequestType>) => {
    if (!error.expected_payment_date || !error.spending_deadline) {
      toast.warning('Check advance payment input because it is required', {
        autoClose: 10000,
      })
    }
  }

  useEffect(() => {
    const modifiedActivityBudgetProvider = budgetsFromProcurementsToPaymentRequest?.map((activity) => {
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
        if (budget.total_prs === 0 || router.query.edit) {
          setValue(`activities.${activityIndex}.budgets.${index}.unit_cost_value`, budget.unit_cost_value)
        } else {
          setValue(
            `activities.${activityIndex}.budgets.${index}.unit_cost_value`,
            budget.qty * budget.pkg_qty * budget.unit_cost_value - budget.total_prs,
          )
        }
        setValue(`activities.${activityIndex}.budgets.${index}.vendor_category_id`, budget.vendor_category_id)

        if (router.query.edit) {
          setValue(`activities.${activityIndex}.budgets.${index}.advance_payment_total`, budget.advance_payment_total)
        }

        requisitionFormApi
          .rFControllerCalculateRfRemainingBudget('', budget.id)
          .then((res) => {
            setValue(`activities.${activityIndex}.budgets.${index}.remaining`, Number(res.data.data))
          })
          .catch(() => {
            setValue(`activities.${activityIndex}.budgets.${index}.remaining`, 0)
          })
      })
    })

    const getRecommendedVendor = async () => {
      const filterType =
        budgetsFromProcurementsToPaymentRequest?.[0].budgets[0].vendor_category_information.vendor_type.name
      const categoryTypes = budgetsFromProcurementsToPaymentRequest
        ?.map((activity) => activity.budgets.map((budget) => budget.vendor_category_information.id))
        .join(',')

      const vendor = await getAllVendorsCombobox(filterType, categoryTypes)
      setVendor(vendor)
    }
    getRecommendedVendor()
  }, [budgetsFromProcurementsToPaymentRequest, programId, rfId])

  useEffect(() => {
    const vendorName = watch('vendor_id')
    const vendorId = vendor.find((item) => item.name === vendorName)?.id as unknown as string
    setChoosenVendorId(vendorId)
  }, [watch('vendor_id')])

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
    if (!budgetsFromProcurementsToPaymentRequest?.length) return

    const localVendorTypes = []
    budgetsFromProcurementsToPaymentRequest?.map((activity) =>
      activity.budgets.map((budget) => {
        localVendorTypes.push(budget.vendor_category_information.name)
      }),
    ),
      setVendorTypes([...new Set(localVendorTypes)])

    const clearInitialTO = setTimeout(() => {
      setRenderForm(true)
    }, 1000)

    return () => {
      clearTimeout(clearInitialTO)
    }
  }, [budgetsFromProcurementsToPaymentRequest])

  useEffect(() => {
    const subscription = watch((value) => {
      const internalCalculationExpense = value.activities
        ?.map((activity) => activity.budgets)
        .flatMap((budget) => budget)

      const totalAdvancePaymentRequest = internalCalculationExpense
        .map((budget) => Number(budget.advance_payment_total || 0) || 0)
        .reduce((acc, cur) => acc + cur, 0)

      setTotalAdvanceCalculation(totalAdvancePaymentRequest || 0)
    })

    return () => subscription.unsubscribe()
  }, [watch])

  useEffect(() => {
    if (router.query.edit) {
      paymentDetailTrigger()
    }
  }, [router.query.edit])

  useEffect(() => {
    if (!paymentDetailData) return

    setValue('description', paymentDetailData.description)

    // Expected payment date
    const expectedPaymentDate = new Date(paymentDetailData.expected_payment_date)
    setValue('expected_payment_date', expectedPaymentDate as unknown as string)
    setPaymentDate(expectedPaymentDate)

    // Spending deadline payment
    const spendingDeadlinePayment = new Date(paymentDetailData.spending_deadline)
    setValue('spending_deadline', spendingDeadlinePayment as unknown as string)
    setSpendingDeadlinePayment(spendingDeadlinePayment)
  }, [paymentDetailData])

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
  }, [budgetsFromProcurementsToPaymentRequest, userLoggedinInformation])

  if (!renderForm) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading advance payment request form..." />
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
    <form onSubmit={handleSubmit(submitAdvancePaymentRequest, errorAdvanceSubmitPaymentRequest)}>
      <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">Submit Advance Payment Request Form</h1>
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
              Submit Advance Payment Request
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
              <p className="mb-2 text-xs font-bold text-gray-500">Total Advance Payment Request</p>
              <p className="text-3xl font-semibold tracking-tight text-gray-900">
                {formatCurrency('IDR', totalAdvanceCalculation)}
              </p>
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
          </div>
          <div className="flex grow flex-col gap-6">
            <div>
              <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                Advance Payment Date
              </label>
              <Controller
                control={control}
                name="expected_payment_date"
                rules={{ required: 'Payment date is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <DatePickerCalendar
                      isUsingCustomHeader={true}
                      typeYears="future"
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
            <div>
              <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                Estimated Deadline Date to Spend the Money
              </label>
              <Controller
                control={control}
                name="spending_deadline"
                rules={{ required: 'Spending deadline is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <DatePickerCalendar
                      isUsingCustomHeader={true}
                      typeYears="future"
                      id="spending_deadline"
                      size="sm"
                      dateFormat="eee, dd MMM yyyy"
                      selected={spendingDeadlinePayment}
                      onChange={(date: Date) => {
                        setSpendingDeadlinePayment(date)
                        onChange(date)
                      }}
                      error={invalid}
                    />
                    {errors.spending_deadline && (
                      <span className="input-hint-text error">{errors.spending_deadline?.message}</span>
                    )}
                  </>
                )}
              />
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
              <p id="requested-by-name" className="font-semibold text-gray-700">
                {userLoggedinInformation?.employee_name}
              </p>
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
            {budgetsFromProcurementsToPaymentRequest?.map((activity, activityIndex) => (
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
                            <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">No</div>
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
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">Total RF</div>
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                              Advance Payment
                            </div>
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
                              <div className="w-24 px-4 py-2.5">{budget.qty}</div>
                              <div className="w-28 p-4 lowercase">{budget.unit}</div>
                              <div className="w-24 px-4 py-2.5">{budget.pkg_qty}</div>
                              <div className="w-28 p-4 lowercase">{budget.pkg_unit}</div>
                              <div className="w-48 px-4 py-2.5">
                                <div className="flex items-center justify-between gap-3">
                                  <p>Rp</p>
                                  <p>{formatCurrency('IDR', budget.unit_cost_value || 0, true)}</p>
                                </div>
                              </div>
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
                                        ),
                                      true,
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="w-48 px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                  <p className="text-gray-500">Rp</p>
                                  <div>
                                    <Controller
                                      control={control}
                                      rules={{
                                        required: 'Advance payment is required field',
                                      }}
                                      name={`activities.${activityIndex}.budgets.${budgetIndex}.advance_payment_total`}
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
                                            ?.advance_payment_total && (
                                            <span className="input-hint-text error">
                                              {
                                                errors.activities?.[activityIndex]?.budgets?.[budgetIndex]
                                                  ?.advance_payment_total?.message
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
                                      Number(watch(`activities.${activityIndex}.budgets.${budgetIndex}.qty`) || 0) *
                                        Number(
                                          watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) || 0,
                                        ) *
                                        convertStringCurrency(
                                          watch(`activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`) ||
                                            0,
                                        ) -
                                        Number(
                                          watch(
                                            `activities.${activityIndex}.budgets.${budgetIndex}.advance_payment_total`,
                                          ),
                                        ) || 0,
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
    </form>
  )
}
