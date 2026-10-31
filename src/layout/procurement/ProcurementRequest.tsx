/* eslint-disable tailwindcss/no-custom-classname */
import { Button } from '@/components/Button'
import { ComboboxAutocomplete } from '@/components/ComboboxAutocomplete'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Input } from '@/components/Input'
import { Loader } from '@/components/Loader'
import { RequisitionFormRemainingBudget } from '@/components/calculations/RequisitionFormRemainingBudget'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { User01Icon } from '@/components/icon/User01Icon'
import { ComboboxRadix } from '@/components/radix/ComboboxRadix'
import { ProjectActivityModified } from '@/layout/program/budget-needs/BudgetNeedsList'
import { cn } from '@/lib/utils'
import { ProjectWithoutActivitiesType, useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsUnion, ComboboxType, CurrencyUnion } from '@/types/global'
import {
  getAllEmployeeCombobox,
  getAllVendorsCombobox,
  getOpenUrl,
  getProcurementBasedOnBudgetCode,
  handleVendorList,
  programApi,
  requisitionFormApi,
  supervisorByEmployee,
} from '@/utils/apiRequestHelper'
import { convertStringCurrency, dateFormatToISO, formatCurrency, remainingBudgetRf } from '@/utils/globalHelper'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { ActivityBudgetList, CreateProcurementRfApiRequest, ProgramDetail } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'

dayjs.extend(utc)

type Props = {
  programDetail: ProgramDetail
  projectDetail: ProjectWithoutActivitiesType
  budgetProcurement: ProjectActivityModified[]
}

export type ActivityBudgetListImproved = ActivityBudgetList & {
  remaining: number
}

type CreateProcurementType = {
  project_activities: {
    id: number
    budgets: ActivityBudgetListImproved[]
  }[]
} & CreateProcurementRfApiRequest

export const ProcurementRequest = (props: Props) => {
  const { userLoggedinInformation, isInternal } = useDashboardContext()
  const router = useRouter()
  const {
    programDetail: programDetailRoot,
    projectDetail: projectDetailRoot,
    budgetProcurement: budgetProcurementRoot,
  } = props

  const [programDetail, setProgramDetail] = useState(programDetailRoot)
  const [projectDetail, setProjectDetail] = useState(projectDetailRoot)
  const [budgetProcurement, setBudgetProcurement] = useState(budgetProcurementRoot)

  const [budgetProcurementModified, setBudgetProcurementModified] = useState<ProjectActivityModified[] | []>([])

  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null)
  const [employee, setEmployee] = useState<ComboboxType[]>([])
  const [recommendedVendorFilteredList, setRecommendedVendorFilteredList] = useState([])
  const [recommendedVendor, setRecommendedVendor] = useState<ComboboxType[]>([])
  const [requestedByAvatar, setReqestedByAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [programManagerAvatar, setProgramManagerAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [supervisorAvatar, setSupervisorAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [actionByAvatar, setActionByAvatar] = useState<string>(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [totalRequestValue, setTotalRequestValue] = useState(0)

  const { data: supervisorData, trigger: supervisorTrigger } = useSWRMutation(
    [userLoggedinInformation ? userLoggedinInformation?.employee_id : null],
    ([id]) => supervisorByEmployee(id),
  )
  const [renderForm, setRenderForm] = useState<boolean>(false)
  const [isEditForm, setIsEditForm] = useState<boolean>(false)
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    pc: boolean
  }>({
    pc: false,
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<CreateProcurementType>()

  const submitProcurementRequest: SubmitHandler<CreateProcurementType> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, pc: true }))

    const modifiedActivityBudgetProvider = budgetProcurementModified?.map((activity) => {
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

    // Check negative budget
    let isFoundNegativeValue = false
    modifiedActivityBudgetProvider?.map((activity, activityIndex) => {
      if (isFoundNegativeValue) return

      activity.budgets.map((budget, index) => {
        const calculation =
          budget.remaining -
          Number(getValues(`project_activities.${activityIndex}.budgets.${index}.qty`) || 0) *
            Number(getValues(`project_activities.${activityIndex}.budgets.${index}.pkg_qty`) || 0) *
            Number(getValues(`project_activities.${activityIndex}.budgets.${index}.unit_cost_value`) || 0)

        if (calculation < 0) {
          isFoundNegativeValue = true
        }
      })
    })

    if (isFoundNegativeValue) {
      toast.warning('Negative remaining budget is found, please re-check your budget', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })
      setLoadingButtonStatement((prev) => ({ ...prev, pc: false }))
      return false
    }

    const actionBy = formInput.action_by as unknown as ComboboxType

    // Check is there any remaining RF
    const remainingRFs = await getProcurementBasedOnBudgetCode(programDetail.id, projectDetail?.id, budgetProcurement)

    // console.log('remainingRFs', remainingRFs)

    const submitValues = {
      about_request: formInput.about_request,
      deadline: dateFormatToISO(
        dayjs(formInput.deadline as unknown as string)
          .utc()
          .format(),
      ) as unknown as object,
      action_by: `employee:${actionBy.id}`,
      budgets: formInput.project_activities.flatMap((item, activityIndex) => {
        return item.budgets.map((budget, budgetIndex) => ({
          ...budget,
          recommended_vendor:
            String(
              recommendedVendor.find(
                (vendor) => vendor.name?.toLowerCase() === budget.recommended_vendor?.toLowerCase(),
              )?.id || '',
            ) || null,
          unit_cost: `IDR_${convertStringCurrency(budget.unit_cost_value)}`,
          unit_cost_value: convertStringCurrency(budget.unit_cost_value),
          additional_data: {
            remaining_rf:
              !isEditForm && remainingRFs.length === 0
                ? Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].qty) *
                    Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].pkg_qty) *
                    Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].unit_cost_value) -
                  budget.qty * budget.pkg_qty * budget.unit_cost_value
                : Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].remaining) -
                  budget.qty * budget.pkg_qty * budget.unit_cost_value,
          } as unknown as string,
        }))
      }),
    }

    for (const budget of submitValues.budgets) {
      const remaining = await RequisitionFormRemainingBudget.getRemainingBudget(budget.id)

      if (remaining < 0) {
        toast.warning(
          `Can't create PC, negative remaining budget is found at budget needs number ${budget.code.replace(
            /\.(\d+)$/,
            '-$1',
          )}, please re-check your budget needs`,
          {
            icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
            autoClose: 5000,
          },
        )
        setLoadingButtonStatement((prev) => ({ ...prev, pc: false }))
        return false
      }
    }

    // console.log('submitValues', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, pc: false }))
    // return false

    if (isEditForm) {
      const submitRequisitionForm = requisitionFormApi.rFControllerUpdateRFProcurement(
        router.query.slug[0],
        router.query.slug[2],
        router.query.slug[3],
        submitValues,
      )

      toast.promise(submitRequisitionForm, {
        pending: 'Updating procurement...',
        success: 'Procurement updated successfully',
        error: 'Promise rejected 🤯',
      })

      submitRequisitionForm.then((success) => {
        router.replace(`/dashboard/procurement/${programDetail?.id}/detail/${projectDetail.id}/${success.data.data}`)
      })

      submitRequisitionForm.finally(() => {
        setTimeout(() => {
          setLoadingButtonStatement((prev) => ({ ...prev, pc: false }))
          removeCookie('budget_needs_to_procurements')
          removeCookie('project_to_procurements')
          removeCookie('requisition_type')
        }, 3000)
      })
    } else {
      const submitRequisitionForm = requisitionFormApi.rFControllerCreateRFProcurement(
        programDetail?.id,
        projectDetail.id,
        submitValues,
      )

      toast.promise(submitRequisitionForm, {
        pending: 'Requesting procurement',
        success: 'Procurement requested successfully',
        error: 'Promise rejected 🤯',
      })

      submitRequisitionForm.then((success) => {
        router.replace(`/dashboard/procurement/${programDetail?.id}/detail/${projectDetail.id}/${success.data.data}`)
        removeCookie('budget_needs_to_procurements')
        removeCookie('project_to_procurements')
        removeCookie('requisition_type')
      })

      submitRequisitionForm.finally(() => {
        setTimeout(() => {
          setLoadingButtonStatement((prev) => ({ ...prev, pc: false }))
        }, 3000)
      })
    }
  }

  useEffect(() => {
    const exec = async () => {
      let result = budgetProcurement

      if (isEditForm) {
        const remainingRf: { remaining_id: string; remaining_value: number }[] = []

        for (const item of budgetProcurement) {
          for (const budget of item.budgets) {
            const remaining = await RequisitionFormRemainingBudget.getRemainingBudget(budget.id)

            const remainingObj = {
              remaining_id: budget.id,
              remaining_value: remaining,
            }

            remainingRf.push(remainingObj)
          }
        }
        result = result.map((item) => ({
          ...item,
          budgets: item.budgets.map((budget, budgetIndex) => {
            if (budget.id === remainingRf[budgetIndex].remaining_id) {
              return {
                ...budget,
                remaining: remainingRf[budgetIndex].remaining_value,
              }
            }
          }),
        }))
      }

      setBudgetProcurementModified(result)
    }
    if (budgetProcurement?.length > 0) {
      exec()
    }
  }, [budgetProcurement, programDetail?.id, projectDetail?.id, isEditForm])

  useEffect(() => {
    const getEmployee = async () => {
      const pic = await getAllEmployeeCombobox()
      setEmployee(pic)
    }
    getEmployee()

    const getRecommendedVendor = async () => {
      const recommendedVendor = await getAllVendorsCombobox()
      setRecommendedVendor(recommendedVendor)
    }
    getRecommendedVendor()

    return () => {
      removeCookie('budget_needs_to_procurements')
      removeCookie('project_to_procurements')
      removeCookie('requisition_type')
    }
  }, [])

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
    const exec = async () => {
      if (userLoggedinInformation?.employee_id) {
        supervisorTrigger()
      }
    }
    exec()
  }, [userLoggedinInformation?.employee_id])

  useEffect(() => {
    const exec = async () => {
      if (supervisorData?.pass_photo_path?.[0]) {
        getOpenUrl(
          supervisorData?.pass_photo_path?.[0].split('/')[0] as BucketsUnion,
          supervisorData?.pass_photo_path?.[0].split('/')[1],
          3600 * 24,
        )
          .then((file) => {
            setSupervisorAvatar(file.url)
          })
          .catch((err) => console.error(err))
      }
    }
    exec()
  }, [supervisorData])

  useEffect(() => {
    const exec = async () => {
      const modifiedActivityBudgetProvider = budgetProcurementModified?.map((activity) => {
        return {
          ...activity,
          budgets: activity.budgets.map((budget) => {
            return {
              ...budget,
              recommended_vendor: '',
            }
          }),
        }
      }) as ProjectActivityModified[]

      modifiedActivityBudgetProvider?.map(async (activity, activityIndex) => {
        activity.budgets.map(async (budget, index) => {
          const vendorValue = await handleVendorList(
            budget.vendor_category_information.vendor_type.name,
            budget.vendor_category_information.id,
          )
          setRecommendedVendorFilteredList((prev) => ({
            ...prev,
            [activityIndex]: {
              ...prev[activityIndex],
              [index]: vendorValue,
            },
          }))
          setValue(`project_activities.${activityIndex}.budgets.${index}.id`, budget.id)
          setValue(`project_activities.${activityIndex}.budgets.${index}.ordering_seq`, budget.ordering_seq)
          setValue(`project_activities.${activityIndex}.budgets.${index}.code`, budget.code)
          setValue(`project_activities.${activityIndex}.budgets.${index}.description`, budget.description)
          setValue(
            `project_activities.${activityIndex}.budgets.${index}.vendor_category_id`,
            budget.vendor_category_information.id,
          )
          if (budget.pending_requested === 0 || budget.pending_requested === undefined) {
            setValue(`project_activities.${activityIndex}.budgets.${index}.qty`, budget.qty)
          } else {
            setValue(`project_activities.${activityIndex}.budgets.${index}.qty`, 1)
          }
          setValue(`project_activities.${activityIndex}.budgets.${index}.unit`, budget.unit)
          if (budget.pending_requested === 0 || budget.pending_requested === undefined) {
            setValue(`project_activities.${activityIndex}.budgets.${index}.pkg_qty`, budget.pkg_qty)
          } else {
            setValue(`project_activities.${activityIndex}.budgets.${index}.pkg_qty`, 1)
          }
          setValue(`project_activities.${activityIndex}.budgets.${index}.pkg_unit`, budget.pkg_unit)
          if (budget.pending_requested === 0 || budget.pending_requested === undefined) {
            setValue(`project_activities.${activityIndex}.budgets.${index}.unit_cost_value`, budget.unit_cost_value)
          } else {
            setValue(`project_activities.${activityIndex}.budgets.${index}.unit_cost_value`, budget.remaining)
          }
        })
      })
    }

    exec()
  }, [budgetProcurementModified])

  useEffect(() => {
    const subscription = watch((value) => {
      if (!value) return

      const internalCalculation = value.project_activities
        ?.map((activity) => activity.budgets)
        .flatMap((budget) => budget)

      const totalRequest = internalCalculation
        ?.map((budget) => Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value))
        .reduce((acc, cur) => acc + cur, 0)

      setTotalRequestValue(totalRequest)

      if (value.action_by) {
        let splitImageFilePath = []

        if (value.action_by?.['avatarUrl']) {
          splitImageFilePath = (value.action_by as unknown as ComboboxType).avatarUrl[0].split('/')
        } else {
          splitImageFilePath = (value.action_by as unknown as ComboboxType)?.pass_photo[0].split('/')
        }

        if (splitImageFilePath[1] === 'undefined') return

        getOpenUrl(splitImageFilePath[0] as BucketsUnion, splitImageFilePath[1], 3600 * 24)
          .then((file) => {
            setActionByAvatar(file.url)
          })
          .catch((err) => console.error(err))
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

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

    if (!userLoggedinInformation && !budgetProcurementModified && totalRequestValue === 0) return

    const clearInitialTO = setTimeout(() => {
      setRenderForm(true)
    }, 1000)

    return () => {
      clearTimeout(clearInitialTO)
    }
  }, [budgetProcurementModified, userLoggedinInformation, totalRequestValue])

  useEffect(() => {
    const execEdit = async () => {
      if (router.query.slug[1] === 'edit') {
        const programId = router.query.slug[0]
        const projectId = router.query.slug[2]
        const rfId = router.query.slug[3]

        if (!programId || !projectId || !rfId) return

        const getRequisitionFormDetail = await requisitionFormApi.rFControllerGetRfDetail(programId, projectId, rfId)
        // const programResult = await getProgramDetail(programId)
        const programDetailRes = await programApi.programControllerGetProgramDetail(programId as string)
        const programResult = programDetailRes?.data?.data
        const rfResult = getRequisitionFormDetail.data.data

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { activities, ...itemWithoutActivities } = rfResult.projects[0]

        // Sementara gini dulu
        const budgetProcurementUpdate = rfResult.projects.flatMap((project) =>
          project.activities
            .filter((activity) => activity.budgets.some((budget) => budget.id))
            .map((activity) => ({
              ...activity,
              budgets: activity.budgets,
              notes: '', // add missing properties
              timeline: {
                start: null,
                end: null,
              },
              proposed_milestone: '',
              due_date: '',
              is_checked: false,
            })),
        )

        setIsEditForm(true)
        setProgramDetail(programResult)
        setProjectDetail(rfResult.projects[0])
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        setBudgetProcurement(budgetProcurementUpdate)

        setValue('deadline', rfResult.deadline)
        setDeadlineDate(new Date(rfResult.deadline as unknown as string))
        setValue('action_by', rfResult.action_by as unknown as string)
        setValue('about_request', rfResult.about_request as string)

        budgetProcurementUpdate.map((activity, activityIndex) => {
          activity.budgets.map((budget, budgetIndex) => {
            setValue(
              `project_activities.${activityIndex}.budgets.${budgetIndex}.recommended_vendor`,
              budget.recommended_vendor,
            )
          })
        })
      }
    }

    execEdit()
  }, [router.query.slug[1]])

  if (!renderForm) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading procurement request form..." />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(submitProcurementRequest)}>
      <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">Requisition Form</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Button
            type="button"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => {
              router.back()
            }}
          >
            Cancel
          </Button>
          <Button type="submit" btnType="normal" size="md" variant="primary" isLoading={loadingButtonStatement.pc}>
            Submit Form
            <PlusIcon className="h-5 w-5 stroke-white" />
          </Button>
        </div>
      </div>
      <div className="p-7 xl:p-10">
        <div className="grid grid-cols-4 gap-5 border-b border-b-gray-200 py-6">
          <div className="col-span-2">
            <p className="mb-2 text-xs font-bold text-gray-500">Project</p>
            <div className="inline-flex items-center gap-2">
              <p className="text-xl font-semibold text-gray-900">{programDetail.program_name}</p>
              <Link href={`/dashboard/project/${programDetail.id}`}>
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
                ({projectDetail.code}) {projectDetail.description}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-stretch gap-5 border-b border-b-gray-200 py-6">
          <div className="flex w-80 flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Type of Requisition Form</p>
              <div className="inline-flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Procurement Request (PC)</h2>
              </div>
            </div>
            <div>
              <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                Deadline
              </label>
              <Controller
                control={control}
                name="deadline"
                rules={{ required: 'Deadline is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <>
                    <DatePickerCalendar
                      isUsingCustomHeader={true}
                      typeYears="future"
                      id="deadline"
                      size="sm"
                      dateFormat="eee, dd MMM yyyy"
                      selected={deadlineDate}
                      onChange={(date: Date) => {
                        setDeadlineDate(date)
                        onChange(date)
                      }}
                      error={invalid}
                    />
                    {errors.deadline && <span className="input-hint-text error">{errors.deadline?.message}</span>}
                  </>
                )}
              />
            </div>
            <div>
              <label htmlFor="action_by" className="mb-2 block text-xs font-bold text-gray-500">
                Action by
              </label>
              <Controller
                control={control}
                name="action_by"
                rules={{
                  required: 'Please choose puspaka employee',
                }}
                render={({ field: { onChange, value } }) => (
                  <>
                    <ComboboxAutocomplete
                      icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                      id="action_by"
                      size="sm"
                      placeholder="Select Puskapa Employee"
                      value={value as unknown as ComboboxType}
                      handleChange={(supervisor) => {
                        onChange(supervisor)
                      }}
                      listData={employee}
                      others="none"
                    />
                    {errors.action_by && <span className="input-hint-text error">{errors.action_by?.message}</span>}
                  </>
                )}
              />
            </div>
          </div>
          <div className="flex grow flex-col gap-6">
            <div>
              <label className="mb-2 block text-xs font-bold text-gray-500">Total Request</label>
              <div className="inline-flex items-center gap-2">
                <p className="pb-1 text-4xl font-semibold tracking-tight text-gray-900">
                  {formatCurrency(programDetail?.currency as unknown as CurrencyUnion, totalRequestValue || 0)}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="about_request" className="mb-2 block text-xs font-bold text-gray-500">
                Activity Name
              </label>
              <textarea
                {...register('about_request', {
                  required: 'Activity name is required field',
                })}
                id="about_request"
                className={cn(
                  'form-textarea w-full resize-none rounded-lg border px-3.5 py-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
                  errors.about_request
                    ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
                    : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
                )}
                rows={3}
                placeholder="Enter the description of the activity (max 250 char)"
                maxLength={250}
              ></textarea>
              {errors.about_request && <span className="input-hint-text error">{errors.about_request?.message}</span>}
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
              {!isInternal ? 'General Manager' : 'Project Manager'}
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
                {programDetail?.program_ownership_type === 'INTERNAL'
                  ? (programDetail as any)?.general_manager?.full_name
                  : programDetail?.program_manager?.full_name}
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Action by</p>
            <div className="flex items-center gap-2.5">
              {actionByAvatar ? (
                <Image
                  src={actionByAvatar}
                  width={32}
                  height={24}
                  alt={actionByAvatar}
                  className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
                />
              ) : (
                <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-[200px] bg-gray-100 object-cover text-xs font-medium text-gray-500">
                  ?
                </span>
              )}
              <p className="font-semibold text-gray-700">
                {watch('action_by') ? (watch('action_by') as unknown as ComboboxType).name : '(Please choose above)'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex w-full flex-col">
            {(budgetProcurementModified as unknown as ProjectActivityModified[])?.map((activity, activityIndex) => (
              <div className="border-b border-b-gray-200 py-6" key={activity.id}>
                <div className="mb-6 flex w-full items-center gap-4">
                  <span className="rounded bg-gray-100 px-8 py-0.5 font-semibold leading-6 text-gray-900">
                    {activity.code}
                  </span>
                  <div className="flex grow flex-wrap">
                    <p className="text-left font-semibold text-gray-900">{activity.description}</p>
                  </div>
                  <div className="inline-flex w-48 items-center justify-between gap-3 pl-3 pr-6">
                    <p className="font-extrabold text-gray-600">Rp</p>
                    <div className="w-40 text-right">
                      <p className="font-extrabold text-gray-600">
                        {formatCurrency('IDR', totalRequestValue || 0, true)}
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
                            <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              No
                            </div>
                            <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              Description
                            </div>
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              Vendor Type
                            </div>
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              Vendor Category
                            </div>
                            <div className="w-60 px-2 py-3.5 text-left text-xs font-medium text-gray-600">
                              Recommended Vendor
                            </div>
                            <div className="w-24 px-2 py-3.5 text-left text-xs font-medium text-gray-600">Qty</div>
                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              Unit
                            </div>
                            <div className="w-24 px-2 py-3.5 text-left text-xs font-medium text-gray-600">Pckg Qty</div>
                            <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              Pckg Unit
                            </div>
                            <div className="w-48 px-2 py-3.5 text-left text-xs font-medium text-gray-600">
                              Unit Cost
                            </div>
                            <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              Total Requested (RF)
                            </div>
                            <div className="w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                              Remaining Budget
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-200 text-sm">
                          {activity.budgets?.map((budget, budgetIndex) => (
                            <div className="flex items-center" key={budget.code}>
                              <div className="w-32 p-4 pl-6 2xl:px-6">{budget.code.replace(/\.(\d+)$/, '-$1')}</div>
                              <div className="w-52 p-4 2xl:px-6">{budget.description}</div>
                              <div className="w-48 p-4 capitalize 2xl:px-6">
                                {budget.vendor_category_information.vendor_type.name}
                              </div>
                              <div className="w-48 p-4 capitalize 2xl:px-6">
                                {budget.vendor_category_information.name}
                              </div>
                              <div className="w-60 px-2 py-2.5">
                                <Controller
                                  control={control}
                                  name={`project_activities.${activityIndex}.budgets.${budgetIndex}.recommended_vendor`}
                                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                                    <>
                                      <ComboboxRadix
                                        widthControllerStyles="w-full"
                                        placeholder="Vendor"
                                        value={value}
                                        listData={recommendedVendorFilteredList?.[activityIndex]?.[budgetIndex] || []}
                                        handleChange={(vendor) => onChange(vendor)}
                                        error={invalid}
                                      />
                                    </>
                                  )}
                                />
                              </div>
                              <div className="w-24 px-2 py-2.5">
                                <Controller
                                  control={control}
                                  rules={{
                                    required: 'Qty is required field',
                                  }}
                                  name={`project_activities.${activityIndex}.budgets.${budgetIndex}.qty`}
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
                                      {errors?.project_activities?.[activityIndex]?.budgets?.[budgetIndex]?.qty && (
                                        <span className="input-hint-text error">
                                          {
                                            errors?.project_activities?.[activityIndex]?.budgets?.[budgetIndex]?.qty
                                              ?.message
                                          }
                                        </span>
                                      )}
                                    </>
                                  )}
                                />
                              </div>
                              <div className="w-28 p-4 lowercase 2xl:px-6">{budget.unit}</div>
                              <div className="w-24 px-2 py-2.5">
                                <Controller
                                  control={control}
                                  rules={{
                                    required: 'Pckg Qty is required field',
                                  }}
                                  name={`project_activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`}
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
                                      {errors?.project_activities?.[activityIndex]?.budgets?.[budgetIndex]?.pkg_qty && (
                                        <span className="input-hint-text error">
                                          {
                                            errors?.project_activities?.[activityIndex]?.budgets?.[budgetIndex]?.pkg_qty
                                              ?.message
                                          }
                                        </span>
                                      )}
                                    </>
                                  )}
                                />
                              </div>
                              <div className="w- w-28 p-4 lowercase 2xl:px-6">{budget.pkg_unit}</div>
                              <div className="w-48 px-2 py-2.5">
                                <div className="flex items-center gap-3">
                                  <p className="text-gray-500">Rp</p>
                                  <div>
                                    <Controller
                                      control={control}
                                      rules={{
                                        required: 'Unit cost is required field',
                                      }}
                                      name={`project_activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`}
                                      render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                                        <>
                                          <Input
                                            disabled={
                                              budget.vendor_category_information.name === 'Overseas Perdiem' ||
                                              budget.vendor_category_information.name === 'Normal Perdiem' ||
                                              budget.vendor_category_information.name === 'Remote Area Perdiem'
                                                ? true
                                                : false
                                            }
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
                                          {errors?.project_activities?.[activityIndex]?.budgets?.[budgetIndex]
                                            ?.unit_cost_value && (
                                            <span className="input-hint-text error">
                                              {
                                                errors?.project_activities?.[activityIndex]?.budgets?.[budgetIndex]
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
                              <div className="w-48 p-4 2xl:px-6">
                                <div className="flex items-center justify-between gap-3">
                                  <p>Rp</p>
                                  <p>
                                    {formatCurrency(
                                      'IDR',
                                      Number(
                                        watch(`project_activities.${activityIndex}.budgets.${budgetIndex}.qty`) || 0,
                                      ) *
                                        Number(
                                          watch(`project_activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) ||
                                            0,
                                        ) *
                                        convertStringCurrency(
                                          watch(
                                            `project_activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                          ) || 0,
                                        ),
                                      true,
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="w-48 max-w-4xl bg-white p-4 2xl:px-6">
                                <div className="flex items-center justify-between gap-3">
                                  <p>Rp</p>
                                  <p>
                                    {formatCurrency(
                                      'IDR',
                                      !isEditForm
                                        ? remainingBudgetRf(
                                            budget,
                                            watch(`project_activities.${activityIndex}.budgets.${budgetIndex}`),
                                          )
                                        : budget.remaining -
                                            Number(
                                              watch(`project_activities.${activityIndex}.budgets.${budgetIndex}.qty`) ||
                                                0,
                                            ) *
                                              Number(
                                                watch(
                                                  `project_activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                                ) || 0,
                                              ) *
                                              convertStringCurrency(
                                                watch(
                                                  `project_activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
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
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}
