/* eslint-disable tailwindcss/no-custom-classname */
import { Button } from '@/components/Button'
import { ComboboxAutocomplete } from '@/components/ComboboxAutocomplete'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { Input } from '@/components/Input'
import { Loader } from '@/components/Loader'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { TimePicker } from '@/components/TimePicker'
import { RequisitionFormRemainingBudget } from '@/components/calculations/RequisitionFormRemainingBudget'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { Briefcase02Icon } from '@/components/icon/Briefcase02Icon'
import { CalendarIcon } from '@/components/icon/CalendarIcon'
import { ClockStopwatchIcon } from '@/components/icon/ClockStopwatchIcon'
import { Edit01Icon } from '@/components/icon/Edit01Icon'
import { FilePlus02Icon } from '@/components/icon/FilePlus02Icon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { User01Icon } from '@/components/icon/User01Icon'
import { ComboboxRadix } from '@/components/radix/ComboboxRadix'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ProjectWithoutActivitiesType, useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { RoleDefinition } from '@/shared/role.access'
import { BucketsUnion, ComboboxType, CurrencyUnion, DynamicProgressType } from '@/types/global'
import {
  fileApi,
  getAllEmployeeCombobox,
  getAllVendorsCombobox,
  getOpenUrl,
  getProcurementBasedOnBudgetCode,
  handleVendorList,
  programApi,
  requisitionFormApi,
  supervisorByEmployee,
} from '@/utils/apiRequestHelper'
import {
  calculatePureTotalBudget,
  convertStringCurrency,
  dateFormatToISO,
  formatCurrency,
  isValidUrl,
  remainingBudgetRf,
  snakeCase,
} from '@/utils/globalHelper'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { CheckCircleIcon, PlaneIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Controller, FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  ActivityBudgetList,
  CreateTravelRfApiRequest,
  ProgramDetail,
  ProjectActivity,
  RequisitionFormDetail,
  TravelRfDetail,
} from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'
dayjs.extend(utc)

type TimelineType = {
  uniqueKey: {
    start: Date
    end: Date
  }
}

type TravelProps = {
  id: string
  is_checked: boolean
  remaining: number
  pending_requested: number
  paid_total: number
  total_expenses?: number
  total_prs: number
  additional_data: {
    travel_information: {
      vendor_date_range: {
        start: Date
        end: Date
      }
      airfare_items?: {
        id: string
        name: string
        origin: string
        destination: string
        date: string
        time: string
        transport_mode: string
        luggage_info: string
      }[]
    }
    default_budget: any
  }
}

// type ActivityBudgetListModified = ActivityBudgetList & TravelProps
type ActivityBudgetListModified = Omit<ActivityBudgetList, 'additional_data'> & TravelProps

type ProjectActivityModified = ProjectActivity & {
  budgets: ActivityBudgetListModified[]
  is_checked: boolean
}

type CreateTravelRequestType = {
  id: number
  activities_adjustment: ProjectActivityModified[]
  travel_detail: {
    who_traveling_option: string
    additional_data: {
      travel_organizer: string
      location: string
      invitation_path: string[]
      tor_path: string[]
      assignment_letter_path: string[]
      notes: string
    }
  } & TravelRfDetail
} & CreateTravelRfApiRequest

type WhoIsTravellingType = {
  text: string
}

type Props = {
  programDetail: ProgramDetail
  projectDetail: ProjectWithoutActivitiesType
  budgetProcurement: ProjectActivityModified[]
}

const travellingOptions: WhoIsTravellingType[] = [
  {
    text: 'Puskapa',
  },
  {
    text: 'Other',
  },
]

export const TravelRequest = (props: Props) => {
  const { userLoggedinInformation, isInternal } = useDashboardContext()
  const router = useRouter()
  // const { programDetail, projectDetail, budgetProcurement } = props
  const {
    programDetail: programDetailRoot,
    projectDetail: projectDetailRoot,
    budgetProcurement: budgetProcurementRoot,
  } = props

  const [programDetail, setProgramDetail] = useState(programDetailRoot)
  const [projectDetail, setProjectDetail] = useState(projectDetailRoot)
  const [budgetProcurement, setBudgetProcurement] = useState(budgetProcurementRoot)

  const [travelInformationDrawer, setTravelInformationDrawer] = useState<boolean>(false)
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null)
  const [employee, setEmployee] = useState<ComboboxType[]>([])
  const [recommendedVendor, setRecommendedVendor] = useState<ComboboxType[]>([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [documentsPath, setDocumentsPath] = useState<object | null>(null)
  const [existdocumentsPath, setExistDocumentsPath] = useState<object | null>(null)
  const [invitationDocuments, setInvitationDocuments] = useState([])
  const [torDocuments, setTorDocuments] = useState([])
  const [assignmentDocuments, setAssignmentDocuments] = useState([])
  const [timelineDate, setTimelineDate] = useState<TimelineType>(null)
  const [puskapaOpsteams, setPuskapaOpsteams] = useState<ComboboxType[]>([])
  const [recommendedVendorFilteredList, setRecommendedVendorFilteredList] = useState([])
  const [consultants, setConsultants] = useState<ComboboxType[]>([])
  // Users
  const [requestedByAvatar, setRequestedByAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [programManagerAvatar, setProgramManagerAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [actionByAvatar, setActionByAvatar] = useState(`${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`)
  const [travellerAvatar, setTravellerAvatar] = useState(`${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`)

  const [supervisorAvatar, setSupervisorAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [totalRequestValue, setTotalRequestValue] = useState(0)
  const [budgetProcurementModified, setBudgetProcurementModified] = useState<ProjectActivityModified[] | []>([])
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    tr: boolean
  }>({
    tr: false,
  })
  const [renderForm, setRenderForm] = useState<boolean>(false)
  const [isEditForm, setIsEditForm] = useState<boolean>(false)
  const [rfDetail, setRfDetail] = useState<RequisitionFormDetail>(null)
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    invitation_document: boolean
    tor: boolean
    assignment_letter: boolean
  }>({
    invitation_document: false,
    tor: false,
    assignment_letter: false,
  })

  // Airfare CRUD state management
  type AirfareItem = {
    id: string
    name: string
    origin: string
    destination: string
    date: Date | null
    time: Date | null
    transport_mode: string
    luggage_info: string
  }

  type AirfareListState = {
    [budgetKey: string]: AirfareItem[]
  }

  const [airfareList, setAirfareList] = useState<AirfareListState>({})
  const [editingAirfare, setEditingAirfare] = useState<{
    budgetKey: string
    item: AirfareItem | null
  }>({ budgetKey: '', item: null })
  const [airfareErrors, setAirfareErrors] = useState<{
    [budgetKey: string]: {
      name?: string
      origin?: string
      destination?: string
      date?: string
      time?: string
      transport_mode?: string
    }
  }>({})

  const { data: supervisorData, trigger: supervisorTrigger } = useSWRMutation(
    [userLoggedinInformation ? userLoggedinInformation?.employee_id : null],
    ([id]) => supervisorByEmployee(id),
  )

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateTravelRequestType>()

  const submitTravelRequest: SubmitHandler<CreateTravelRequestType> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, tr: true }))

    const modifiedActivityBudgetProvider = budgetProcurementModified?.map((activity) => {
      return {
        ...activity,
        budgets: activity.budgets?.map((budget) => {
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
          Number(getValues(`activities_adjustment.${activityIndex}.budgets.${index}.qty`) || 0) *
            Number(getValues(`activities_adjustment.${activityIndex}.budgets.${index}.pkg_qty`) || 0) *
            Number(getValues(`activities_adjustment.${activityIndex}.budgets.${index}.unit_cost_value`) || 0)

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
      setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
      return false
    }

    const actionBy = formInput.action_by as unknown as ComboboxType

    // Check is there any remaining RF
    const remainingRFs = await getProcurementBasedOnBudgetCode(
      programDetail.id,
      projectDetail?.id,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      budgetProcurement,
    )

    const getTravellerId = (): string | undefined => {
      const whoTraveling = formInput.travel_detail.who_traveling
      const whoTravelingOptionValue = getValues('travel_detail.who_traveling_option')
      switch (whoTravelingOptionValue.toLowerCase()) {
        case 'puskapa':
          return whoTraveling?.id ? `employee:${whoTraveling.id}` : undefined
        case 'consultant':
          return whoTraveling?.id ? `vendor:${whoTraveling.id}` : undefined
        case 'other':
          return whoTraveling?.name ? whoTraveling.name : undefined
        default:
          return undefined
      }
    }

    const submitValues = {
      deadline: dateFormatToISO(
        dayjs(formInput.deadline as unknown as string)
          .utc()
          .format(),
      ) as unknown as object,
      action_by: `employee:${actionBy.id}`,
      about_request: formInput.about_request,
      budgets: formInput.activities_adjustment.flatMap((activity, activityIndex) =>
        activity.budgets.flatMap((budget, budgetIndex) => {
          const dateRangeStart = budget.additional_data?.travel_information?.vendor_date_range?.start
          const dateRangeEnd = budget.additional_data?.travel_information?.vendor_date_range?.end
          return {
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
              travel_information: (() => {
                const budgetKey = `${activityIndex}-${budgetIndex}`
                const items = airfareList[budgetKey]

                if (items && items.length > 0) {
                  return {
                    airfare_items: items.map((item) => ({
                      id: item.id,
                      name: item.name,
                      origin: item.origin,
                      destination: item.destination,
                      date: item.date ? dateFormatToISO(dayjs(item.date.toString()).utc().format()) : null,
                      time: item.time ? dateFormatToISO(dayjs(item.time.toString()).utc().format()) : null,
                      transport_mode: item.transport_mode,
                      luggage_info: item.luggage_info,
                    })),
                  }
                }

                if (budget?.additional_data?.travel_information?.vendor_date_range) {
                  return {
                    vendor_date_range: {
                      start: dateRangeStart
                        ? dateFormatToISO(dayjs(dateRangeStart?.toString()).utc().format())
                        : undefined,
                      end: dateRangeEnd ? dateFormatToISO(dayjs(dateRangeEnd?.toString()).utc().format()) : undefined,
                    },
                  }
                }

                return null
              })(),
              remaining_rf:
                !isEditForm && remainingRFs.length === 0
                  ? Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].qty) *
                      Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].pkg_qty) *
                      Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].unit_cost_value) -
                    budget.qty * budget.pkg_qty * budget.unit_cost_value
                  : Number(budgetProcurementModified[activityIndex].budgets[budgetIndex].remaining) -
                    budget.qty * budget.pkg_qty * budget.unit_cost_value,
            },
          }
        }),
      ),
      travel_detail: {
        employee_id: getTravellerId(),
        who_traveling:
          getValues('travel_detail.who_traveling_option') === 'consultant'
            ? { name: formInput.travel_detail.who_traveling?.name }
            : formInput.travel_detail.who_traveling,
        additional_data: {
          travel_organizer: formInput.travel_detail.additional_data.travel_organizer,
          location: formInput.travel_detail.additional_data.location,
          invitation_path: switchTogglableButton.invitation_document
            ? formInput.travel_detail.additional_data.invitation_path
              ? [String(formInput.travel_detail.additional_data.invitation_path)]
              : []
            : documentsPath?.['invitation_path'] || existdocumentsPath?.['invitation_path'] || [],
          tor_path: switchTogglableButton.tor
            ? formInput.travel_detail.additional_data.tor_path
              ? [String(formInput.travel_detail.additional_data.tor_path)]
              : []
            : documentsPath?.['tor_path'] || existdocumentsPath?.['tor_path'] || [],
          assignment_letter_path: switchTogglableButton.assignment_letter
            ? formInput.travel_detail.additional_data.assignment_letter_path
              ? [String(formInput.travel_detail.additional_data.assignment_letter_path)]
              : []
            : documentsPath?.['assignment_letter_path'] || existdocumentsPath?.['assignment_letter_path'] || [],
          notes: formInput.travel_detail.additional_data.notes,
        },
      },
    }

    if (formInput.travel_detail.who_traveling_option.toLowerCase() === 'puskapa') {
      if (submitValues.travel_detail.who_traveling?.['id'] === undefined) {
        toast.warning('Please select puskapa employee who is traveling', {
          autoClose: 5000,
        })
        setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
        return false
      }
    }

    if (formInput.travel_detail.who_traveling_option.toLowerCase() === 'consultant') {
      if (
        submitValues.travel_detail.employee_id === undefined ||
        submitValues.travel_detail.who_traveling.name === null
      ) {
        toast.warning('Please select consultant who is traveling', {
          autoClose: 5000,
        })
        setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
        return false
      }
    }

    if (formInput.travel_detail.who_traveling_option.toLowerCase() === 'other') {
      if (
        submitValues.travel_detail.employee_id === undefined ||
        submitValues.travel_detail.who_traveling.name === null
      ) {
        toast.warning('Please type other employee who is traveling', {
          autoClose: 5000,
        })
        setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
        return false
      }
    }

    // Check non airfare information
    const nonAirfareCheck = submitValues.budgets.some((budget) => {
      if (
        budget.vendor_category_information.name.toLowerCase() !== 'airfare' &&
        budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL'
      ) {
        if (
          budget.additional_data.travel_information?.vendor_date_range.start === undefined ||
          budget.additional_data.travel_information?.vendor_date_range.end === undefined ||
          budget.additional_data.travel_information?.vendor_date_range.start === '' ||
          budget.additional_data.travel_information?.vendor_date_range.end === ''
        ) {
          toast.warning(`Please check date range for ${budget.vendor_category_information.name.toLowerCase()}!`, {
            autoClose: 5000,
          })
          setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
          return true
        }
      }
    })

    // Check airfare information
    let airfareCheck = false
    formInput.activities_adjustment.forEach((activity, activityIndex) => {
      activity.budgets.forEach((budget, budgetIndex) => {
        if (budget.vendor_category_information.name.toLowerCase() === 'airfare') {
          const budgetKey = `${activityIndex}-${budgetIndex}`
          const items = airfareList[budgetKey] || []
          if (items.length === 0) {
            toast.warning('Please add at least one airfare information detail!', {
              autoClose: 5000,
            })
            setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
            airfareCheck = true
          }
        }
      })
    })

    if (nonAirfareCheck) return false
    if (airfareCheck) return false
    // if (airfareCheckDateFlight) return false

    for (const budget of submitValues.budgets) {
      const remaining = await RequisitionFormRemainingBudget.getRemainingBudget(budget.id)

      if (remaining < 0) {
        toast.warning(
          `Can't create TR, negative remaining budget is found at budget needs number ${budget.code.replace(
            /\.(\d+)$/,
            '-$1',
          )}, please re-check your budget needs`,
          {
            icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
            autoClose: 5000,
          },
        )
        setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
        return false
      }
    }

    // console.log('submitValues', submitValues)

    // Document attachments are optional on create and edit.

    // console.log('formInput---xxx', formInput)
    // console.log('submitValues---xxx', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, tr: false }))
    // return false

    if (isEditForm) {
      const submitRequisitionForm = requisitionFormApi.rFControllerUpdateRFTravel(
        programDetail.id,
        projectDetail.id,
        rfDetail.id,
        submitValues as unknown as CreateTravelRequestType,
      )

      toast.promise(submitRequisitionForm, {
        pending: 'Updating travel request',
        success: 'Travel Request updated',
        error: 'Travel Request rejected 🤯',
      })

      submitRequisitionForm.then((success) => {
        router.replace(`/dashboard/procurement/${programDetail.id}/detail/${projectDetail.id}/${success.data.data}`)
      })
    } else {
      const submitRequisitionForm = requisitionFormApi.rFControllerCreateRFTravel(
        programDetail.id,
        projectDetail.id,
        submitValues as unknown as CreateTravelRequestType,
      )

      toast.promise(submitRequisitionForm, {
        pending: 'Processing Travel request',
        success: 'Travel Request requested',
        error: 'Travel Request rejected 🤯',
      })

      submitRequisitionForm.then((success) => {
        router.replace(`/dashboard/procurement/${programDetail.id}/detail/${projectDetail.id}/${success.data.data}`)
        removeCookie('budget_needs_to_procurements')
        removeCookie('project_to_procurements')
        removeCookie('requisition_type')
      })
    }
  }

  const openTravelInformationDrawer = () => {
    setTravelInformationDrawer(true)
  }

  const closeTravelInformationDrawer = useCallback(() => {
    setTravelInformationDrawer(false)
  }, [])

  const errorSubmitPersonalHireRequest = async (error: FieldErrors<CreateTravelRequestType>) => {
    if (
      error?.travel_detail?.additional_data?.travel_organizer ||
      error?.travel_detail?.additional_data?.location ||
      error?.travel_detail?.additional_data?.invitation_path ||
      error?.travel_detail?.additional_data?.tor_path ||
      error?.travel_detail?.additional_data?.assignment_letter_path
    ) {
      openTravelInformationDrawer()
    } else {
      if (error) {
        toast.warning('Check empty field and please fill the required field')
      }
    }
  }

  // let temporaryMultipleFileUpload = []
  const handleUploadFile = async (
    fileObjects: File[],
    identifier: 'invitation_path' | 'tor_path' | 'assignment_letter_path',
  ) => {
    if (!Array.isArray(fileObjects)) return

    const bucketName = BucketsEnum.rf_doc

    fileObjects.map(async (fileObject) => {
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

      switch (identifier) {
        case 'invitation_path':
          const invitationDocs = [`${BucketsEnum.rf_doc}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            invitation_path: invitationDocs,
          }))
          break
        case 'tor_path':
          const hireProcessDocs = [`${BucketsEnum.rf_doc}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            tor_path: hireProcessDocs,
          }))
          break
        case 'assignment_letter_path':
          const offerPageDocs = [`${BucketsEnum.rf_doc}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            assignment_letter_path: offerPageDocs,
          }))
          break
        default:
          break
      }
    })
  }

  const handleTimelineChange = (value: any, identifier: string) => {
    const incomingDaterange = {
      [identifier]: {
        start: value[0],
        end: value[1],
      },
    }

    setTimelineDate((prev) => ({ ...prev, ...incomingDaterange }))
  }

  const deleteInvitationFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['invitation_path'] = prev['invitation_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setInvitationDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteTorFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['tor_path'] = prev['tor_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setTorDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteAssignmentFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['assignment_letter_path'] = prev['assignment_letter_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setAssignmentDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    const getVendorConsultant = async () => {
      const consultant = await getAllVendorsCombobox('consultant')
      setConsultants(consultant)
    }
    getVendorConsultant()
  }, [])

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
      const employeeRes = await getAllEmployeeCombobox()
      setEmployee(employeeRes)
    }
    getEmployee()

    const getHeadOfOperation = async () => {
      // const hoo = await getAllEmployeeCombobox(RoleDefinition.OPS_TEAM)
      const hoo = await getAllEmployeeCombobox(RoleDefinition.OPS_TEAM)
      // const opsTeam = await getAllEmployeeCombobox('', hoo[0].id)
      setPuskapaOpsteams(hoo)
    }
    getHeadOfOperation()

    const getVendorRecommendedVendor = async () => {
      const recommendedVendor = await getAllVendorsCombobox()
      setRecommendedVendor(recommendedVendor)
    }
    getVendorRecommendedVendor()
  }, [])

  useEffect(() => {
    const subscription = watch((value) => {
      if (!value) return

      const internalCalculation = value.activities_adjustment
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

      if (
        value.travel_detail?.who_traveling_option.toLowerCase() === 'puskapa' &&
        value.travel_detail?.who_traveling?.name
      ) {
        let splitImageFilePath = []

        if (value.travel_detail.who_traveling?.['avatarUrl']) {
          splitImageFilePath = (value.travel_detail.who_traveling as unknown as ComboboxType).avatarUrl?.[0].split('/')
        } else {
          splitImageFilePath = (value.travel_detail.who_traveling as unknown as ComboboxType)?.pass_photo?.[0].split(
            '/',
          )
        }

        if (splitImageFilePath === undefined) return
        if (splitImageFilePath[1] === 'undefined') return

        getOpenUrl(splitImageFilePath[0] as BucketsUnion, splitImageFilePath[1], 3600 * 24)
          .then((file) => {
            setTravellerAvatar(file.url)
          })
          .catch((err) => console.error(err))
      }
    })

    return () => subscription.unsubscribe()
  }, [watch])

  useEffect(() => {
    const activities = getValues('activities_adjustment')
    activities?.forEach((activity, activityIndex) => {
      activity.budgets.forEach((budget, budgetIndex) => {
        if (budget.vendor_category_information?.name.toLowerCase() === 'airfare') {
          const budgetKey = `${activityIndex}-${budgetIndex}`
          const items = airfareList[budgetKey] || []
          const airfareIdEl = document.getElementById(`airfare-${budget.code}`)

          if (airfareIdEl) {
            if (items.length > 0) {
              airfareIdEl.classList.add('completed')
            } else {
              airfareIdEl.classList.remove('completed')
            }
          }
        }
      })
    })
  }, [airfareList, getValues])

  useEffect(() => {
    if (userLoggedinInformation?.avatar) {
      getOpenUrl(
        userLoggedinInformation?.avatar.split('/')[0] as BucketsUnion,
        userLoggedinInformation?.avatar.split('/')[1],
        3600 * 24,
      )
        .then((file) => {
          setRequestedByAvatar(file.url)
        })
        .catch((err) => console.error(err))
    }

    if (programDetail) {
      getOpenUrl(
        (programDetail?.program_ownership_type === 'INTERNAL'
          ? (programDetail as any)?.general_manager?.pass_photo_path?.[0]
          : programDetail.program_manager.pass_photo_path?.[0]
        ).split('/')[0] as BucketsUnion,
        (programDetail?.program_ownership_type === 'INTERNAL'
          ? (programDetail as any)?.general_manager?.pass_photo_path?.[0]
          : programDetail.program_manager.pass_photo_path?.[0]
        ).split('/')[1],
        3600 * 24,
      )
        .then((file) => {
          setProgramManagerAvatar(file.url)
        })
        .catch((err) => console.error(err))
    }

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
  }, [userLoggedinInformation, programDetail, supervisorData])

  useEffect(() => {
    const exec = async () => {
      const activityBudgetProvider = budgetProcurementModified?.map((activity) => {
        return {
          ...activity,
          budgets: activity.budgets?.map((budget) => {
            return {
              ...budget,
              recommended_vendor: '',
            }
          }),
        }
      }) as unknown as ProjectActivityModified[]

      activityBudgetProvider?.map(async (activity, activityIndex) => {
        activity.budgets?.map(async (budget, index) => {
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

          setValue(`activities_adjustment.${activityIndex}.budgets.${index}.id`, budget.id)
          setValue(`activities_adjustment.${activityIndex}.budgets.${index}.ordering_seq`, budget.ordering_seq)
          setValue(`activities_adjustment.${activityIndex}.budgets.${index}.code`, budget.code)
          setValue(`activities_adjustment.${activityIndex}.budgets.${index}.description`, budget.description)
          setValue(
            `activities_adjustment.${activityIndex}.budgets.${index}.vendor_category_id`,
            budget.vendor_category_information.id,
          )
          if (budget.pending_requested === 0 || budget.pending_requested === undefined) {
            setValue(`activities_adjustment.${activityIndex}.budgets.${index}.qty`, budget.qty)
          } else {
            setValue(`activities_adjustment.${activityIndex}.budgets.${index}.qty`, 1)
          }
          setValue(`activities_adjustment.${activityIndex}.budgets.${index}.unit`, budget.unit)
          if (budget.pending_requested === 0 || budget.pending_requested === undefined) {
            setValue(`activities_adjustment.${activityIndex}.budgets.${index}.pkg_qty`, budget.pkg_qty)
          } else {
            setValue(`activities_adjustment.${activityIndex}.budgets.${index}.pkg_qty`, 1)
          }
          setValue(`activities_adjustment.${activityIndex}.budgets.${index}.pkg_unit`, budget.pkg_unit)
          if (budget.pending_requested === 0 || budget.pending_requested === undefined) {
            setValue(`activities_adjustment.${activityIndex}.budgets.${index}.unit_cost_value`, budget.unit_cost_value)
          } else {
            setValue(`activities_adjustment.${activityIndex}.budgets.${index}.unit_cost_value`, budget.remaining)
          }
          setValue(
            `activities_adjustment.${activityIndex}.budgets.${index}.vendor_category_information`,
            budget.vendor_category_information,
          )
        })
      })
    }

    exec()
  }, [budgetProcurementModified])

  useEffect(() => {
    const exec = async () => {
      if (userLoggedinInformation?.employee_id) {
        supervisorTrigger()
      }
    }
    exec()
  }, [userLoggedinInformation?.employee_id])

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
  }, [userLoggedinInformation, budgetProcurementModified, totalRequestValue])

  useEffect(() => {
    // Init update form
    const execEdit = async () => {
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
          .map((activity, activityIndex) => ({
            ...activity,
            budgets: activity.budgets.map((budget, budgetIndex) => {
              setValue(
                `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.recommended_vendor`,
                budget.recommended_vendor,
              )
              return {
                ...budget,
              }
            }),
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

      if (renderForm) {
        setRfDetail(rfResult)
        setProgramDetail(programResult)
        setProjectDetail(rfResult.projects[0])
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        setBudgetProcurement(budgetProcurementUpdate)

        setValue('deadline', rfResult.deadline)
        setDeadlineDate(new Date(rfResult.deadline as unknown as string))
        setValue('action_by', rfResult.action_by as unknown as string)
        setValue('travel_detail.additional_data.notes', rfResult.rf_attributes['additional_data'].notes)

        setValue('about_request', rfResult.about_request as string)

        // Invitation path
        if (isValidUrl(rfResult.rf_attributes['additional_data'].invitation_path[0])) {
          setSwitchTogglableButton((prev) => ({
            ...prev,
            invitation_document: true,
          }))
          setValue(
            'travel_detail.additional_data.invitation_path',
            rfResult.rf_attributes['additional_data'].invitation_path as unknown as string[],
          )
        } else {
          if (rfResult.rf_attributes['additional_data'].invitation_path.length > 0) {
            setExistDocumentsPath((prev) => ({
              ...prev,
              invitation_path: rfResult.rf_attributes['additional_data'].invitation_path,
            }))
          }
        }

        // ToR
        if (isValidUrl(rfResult.rf_attributes['additional_data'].tor_path[0])) {
          setSwitchTogglableButton((prev) => ({
            ...prev,
            tor: true,
          }))
          setValue(
            'travel_detail.additional_data.tor_path',
            rfResult.rf_attributes['additional_data'].tor_path as unknown as string[],
          )
        } else {
          if (rfResult.rf_attributes['additional_data'].tor_path.length > 0) {
            setExistDocumentsPath((prev) => ({
              ...prev,
              tor_path: rfResult.rf_attributes['additional_data'].tor_path,
            }))
          }
        }

        // Assignment Letter
        if (isValidUrl(rfResult.rf_attributes['additional_data'].assignment_letter_path[0])) {
          setSwitchTogglableButton((prev) => ({
            ...prev,
            assignment_letter: true,
          }))
          setValue(
            'travel_detail.additional_data.assignment_letter_path',
            rfResult.rf_attributes['additional_data'].assignment_letter_path as unknown as string[],
          )
        } else {
          if (rfResult.rf_attributes['additional_data'].assignment_letter_path.length > 0) {
            setExistDocumentsPath((prev) => ({
              ...prev,
              assignment_letter_path: rfResult.rf_attributes['additional_data'].assignment_letter_path,
            }))
          }
        }

        // Update select option organizer
        setValue(
          'travel_detail.additional_data.travel_organizer',
          rfResult.rf_attributes['additional_data'].travel_organizer,
        )

        // Location
        setValue('travel_detail.additional_data.location', rfResult.rf_attributes['additional_data'].location)
        setValue('travel_detail.additional_data.notes', rfResult.rf_attributes['additional_data'].notes)

        if (rfResult.rf_attributes['additional_data'].travel_organizer === 'puskapa') {
          const puskapa = document.getElementById(`${snakeCase('puskapa')}_organizer`) as HTMLInputElement

          if (puskapa) {
            puskapa.checked = true
          }
        } else {
          const other = document.getElementById(`${snakeCase('other')}_organizer`) as HTMLInputElement

          if (other) {
            other.checked = true
          }
        }
        if (rfResult.rf_attributes?.['employee_id'].split(':')[0] === 'employee') {
          setValue('travel_detail.who_traveling_option', 'puskapa')
          setValue('travel_detail.who_traveling', rfResult.rf_attributes['who_traveling'])
        } else if (rfResult.rf_attributes?.['employee_id'].split(':')[0] === 'vendor') {
          setValue('travel_detail.who_traveling_option', 'consultant')
          setValue('travel_detail.who_traveling.name', rfResult.rf_attributes['who_traveling'].name)
        } else {
          setValue('travel_detail.who_traveling_option', 'other')
          setValue('travel_detail.who_traveling.name', rfResult.rf_attributes['who_traveling'].name)
        }

        budgetProcurementUpdate.map((activity, activityIndex) => {
          activity.budgets.map((budget, budgetIndex) => {
            setValue(`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`, budget.qty)
            setValue(`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`, budget.pkg_qty)
            setValue(
              `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
              budget.unit_cost_value,
            )
            // NON AIRFARE
            if (
              budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL' &&
              budget.vendor_category_information.name.toLowerCase() !== 'airfare'
            ) {
              const startDate = budget.additional_data['travel_information']['vendor_date_range']['start']
              const endDate = budget.additional_data['travel_information']['vendor_date_range']['end']

              handleTimelineChange(
                [new Date(startDate), new Date(endDate)],
                `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`,
              )
              setValue(
                `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`,
                {
                  start: new Date(startDate),
                  end: new Date(endDate),
                },
              )
            }

            // AIRFARE - populate airfareList state from server data
            if (
              budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL' &&
              budget.vendor_category_information.name.toLowerCase() === 'airfare'
            ) {
              const budgetKey = `${activityIndex}-${budgetIndex}`
              const serverItems = budget.additional_data?.['travel_information']?.['airfare_items']

              if (Array.isArray(serverItems) && serverItems.length > 0) {
                const items: AirfareItem[] = serverItems.map((item: any) => ({
                  id: item.id || crypto.randomUUID(),
                  name: item.name || '',
                  origin: item.origin || '',
                  destination: item.destination || '',
                  date: item.date ? new Date(item.date) : null,
                  time: item.time ? new Date(item.time) : null,
                  transport_mode: item.transport_mode || '',
                  luggage_info: item.luggage_info || '',
                }))

                setAirfareList((prev) => ({
                  ...prev,
                  [budgetKey]: items,
                }))
              }
            }
          })
        })
      }
    }

    // && renderForm
    if (router.query.slug[1] === 'edit') {
      setIsEditForm(true)
      execEdit()
    }

    if (router.query.slug[1] !== 'edit') {
      setValue('travel_detail.who_traveling_option', 'puskapa')
    }
  }, [router.query.slug[1], renderForm])

  if (!userLoggedinInformation) {
    return <></>
  }

  if (router.query.slug[1] === 'edit' && (!rfDetail || !supervisorData)) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading travel request form..." />
      </div>
    )
  }

  if (!renderForm) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading travel request form..." />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(submitTravelRequest, errorSubmitPersonalHireRequest)}>
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
          <Button type="submit" btnType="normal" size="md" variant="primary" isLoading={loadingButtonStatement.tr}>
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

        <div className="grid grid-cols-4 gap-5 border-b border-b-gray-200 py-6">
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Type of Requisition Form</p>
              <div className="inline-flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Travel Request (TR)</h2>
              </div>
            </div>
            <div>
              <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                Deadline
              </label>
              <Controller
                control={control}
                name="deadline"
                rules={!isEditForm ? { required: 'Deadline is required field' } : null}
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
                Action by (Operational)
              </label>
              <Controller
                control={control}
                name="action_by"
                rules={{
                  required: 'Please choose puspaka employee',
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <>
                    <ComboboxAutocomplete
                      icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                      id="action_by"
                      size="sm"
                      placeholder="Puskapa Ops Team"
                      value={value as unknown as ComboboxType}
                      handleChange={(hoo) => {
                        onChange(hoo)
                      }}
                      listData={puskapaOpsteams}
                      others="none"
                      error={invalid}
                    />
                    {errors?.action_by && <span className="input-hint-text error">{errors.action_by?.message}</span>}
                  </>
                )}
              />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-6">
            <div>
              <label className="mb-2 block w-full text-xs font-bold text-gray-500">Total Request</label>
              <div className="inline-flex items-center gap-2">
                <p className="pb-1 text-4xl font-semibold tracking-tight text-gray-900">
                  {formatCurrency(programDetail.currency as unknown as CurrencyUnion, totalRequestValue || 0)}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="about_request" className="mb-2 block text-xs font-bold text-gray-500">
                Activity Name / Hire Title
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
                rows={4}
                placeholder="Enter the description of the activity (max 250 char)"
                maxLength={250}
              ></textarea>
              {errors.about_request && <span className="input-hint-text error">{errors.about_request?.message}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <label
                htmlFor="personal_hire_information.vendor_id"
                className="mb-2 block text-xs font-bold text-gray-500"
              >
                Who traveling?
              </label>
              <Controller
                control={control}
                name="travel_detail.who_traveling_option"
                render={({ field: { onChange, value } }) => (
                  <>
                    <ComboboxRadix
                      widthControllerStyles="w-full max-w-full"
                      placeholder="who traveling"
                      // value="Other"
                      value={value}
                      listData={[
                        {
                          id: 'puskapa',
                          name: 'Puskapa',
                        },
                        {
                          id: 'consultant',
                          name: 'Consultant',
                        },
                        {
                          id: 'other',
                          name: 'Other',
                        },
                      ]}
                      handleChange={(traveller) => {
                        onChange(traveller)
                        setTravellerAvatar('')
                        setValue('travel_detail.who_traveling', null)
                      }}
                    />
                  </>
                )}
              />
            </div>

            {getValues('travel_detail.who_traveling_option').toLowerCase() === 'puskapa' && (
              <div>
                <label htmlFor="travel_detail.who_traveling" className="mb-2 block text-xs font-bold text-gray-500">
                  Name
                </label>
                <Controller
                  control={control}
                  name="travel_detail.who_traveling"
                  rules={{
                    required: 'Please choose traveller',
                  }}
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <ComboboxAutocomplete
                        icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                        id="travel_detail.who_traveling"
                        size="sm"
                        placeholder="Choose puskapa employee"
                        value={value as unknown as ComboboxType}
                        handleChange={(employee) => {
                          onChange(employee)
                        }}
                        listData={employee}
                        others="none"
                        error={invalid}
                      />
                      {errors.travel_detail?.who_traveling && (
                        <span className="input-hint-text error">{errors.travel_detail.who_traveling?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
            )}

            {getValues('travel_detail.who_traveling_option').toLowerCase() === 'consultant' && (
              <div>
                <label htmlFor="travel_detail.who_traveling" className="mb-2 block text-xs font-bold text-gray-500">
                  Name
                </label>
                <Controller
                  control={control}
                  name="travel_detail.who_traveling"
                  rules={{
                    required: 'Please choose consultant',
                  }}
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <ComboboxAutocomplete
                        id="travel_detail.who_traveling"
                        size="sm"
                        placeholder="Choose consultant"
                        value={value as unknown as ComboboxType}
                        handleChange={(employee) => {
                          onChange(employee)
                        }}
                        listData={consultants}
                        others="none"
                        error={invalid}
                      />
                      {errors.travel_detail?.who_traveling && (
                        <span className="input-hint-text error">{errors.travel_detail.who_traveling?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
            )}

            {getValues('travel_detail.who_traveling_option').toLowerCase() === 'other' && (
              <div>
                <label
                  htmlFor="travel_detail.who_traveling.name"
                  className="mb-2 block text-xs font-bold text-gray-500"
                >
                  Name
                </label>
                <Controller
                  control={control}
                  rules={!isEditForm ? { required: 'Traveller name is required field' } : null}
                  name="travel_detail.who_traveling.name"
                  render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        value={value || ''}
                        size="sm"
                        type="text"
                        id="who_traveller_other"
                        placeholder="Write the traveller here"
                        onChange={onChange}
                        error={invalid}
                      />
                      {errors.travel_detail?.who_traveling?.name && (
                        <span className="input-hint-text error">
                          {errors.travel_detail.who_traveling?.name?.message}
                        </span>
                      )}
                    </>
                  )}
                />
              </div>
            )}

            <div>
              <label htmlFor="action_by" className="mb-2 block text-xs font-bold text-gray-500">
                Travel Information
              </label>
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                className="w-full justify-center"
                onClick={openTravelInformationDrawer}
              >
                Travel Information
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-5 border-b border-b-gray-200 py-6">
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
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Traveler</p>
            <div className="flex items-center gap-2.5">
              {travellerAvatar ? (
                <Image
                  src={travellerAvatar}
                  width={32}
                  height={24}
                  alt={travellerAvatar}
                  className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
                />
              ) : (
                <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-[200px] bg-gray-100 object-cover text-xs font-medium text-gray-500">
                  ?
                </span>
              )}
              <p className="font-semibold text-gray-700">
                {watch('travel_detail.who_traveling')
                  ? watch('travel_detail.who_traveling.name') || '(Please choose above)'
                  : '(Please choose above)'}
              </p>
            </div>
          </div>
        </div>

        {/* ACTION_BY_OPERATIONAL */}
        {budgetProcurementModified?.map((activity, activityIndex) =>
          activity.budgets.filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL')
            .length > 0 ? (
            <div className="mt-5" key={activityIndex}>
              {activityIndex === 0 ? (
                <div className="relative mb-5 flex justify-center py-6">
                  <div className="absolute inset-x-0 top-1/2 z-0 h-px bg-gray-200"></div>
                  <div className="relative z-10 bg-white px-6">
                    <span className="inline-block rounded-full bg-indigo-500 px-10 py-2 text-xs font-bold uppercase text-white">
                      ACTION BY OPERATIONAL
                    </span>
                  </div>
                </div>
              ) : null}
              <Fragment>
                {activity.budgets?.map((budget, budgetIndex) => (
                  <Fragment key={budgetIndex}>
                    {budget.vendor_category_information.action_by === 'ACTION_BY_OPERATIONAL' ? (
                      <div
                        className={cn(
                          'flex w-full flex-col border-l-4 border-l-indigo-400 pl-6',
                          budgetIndex !== 0 && 'mt-10',
                        )}
                      >
                        <div className="flex items-start gap-5 border-b border-b-gray-200 pb-6">
                          <div className="w-52">
                            <p className="mb-2 text-xs font-bold text-gray-500">Vendor Category</p>
                            <p className="text-lg font-semibold capitalize text-gray-900">
                              {budget.vendor_category_information.name}
                            </p>
                          </div>
                          <div className="grow">
                            <div className="grid grid-cols-2 gap-5">
                              <div>
                                <p className="mb-2 text-xs font-bold text-gray-500">Recommended Vendor</p>
                                <Controller
                                  control={control}
                                  name={`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.recommended_vendor`}
                                  render={({ field: { onChange, value } }) => (
                                    <ComboboxRadix
                                      widthControllerStyles="w-full max-w-full"
                                      placeholder={`Vendor for ${budget.vendor_category_information.name}`}
                                      value={value}
                                      listData={recommendedVendorFilteredList?.[activityIndex]?.[budgetIndex] || []}
                                      handleChange={(vendor) => onChange(vendor)}
                                    />
                                  )}
                                />
                              </div>
                              <div>
                                {budget.vendor_category_information.name.toLowerCase() === 'airfare' ? (
                                  <>
                                    <p className="mb-2 text-xs font-bold text-gray-500">Airfare Information</p>
                                    <Sheet>
                                      <SheetTrigger className="w-full">
                                        <Button
                                          btnType="div"
                                          size="sm"
                                          variant="secondary-gray"
                                          className="flex w-full items-center justify-center gap-2 py-2.5"
                                        >
                                          Airfare Information
                                          <span id={`airfare-${budget.code}`} className="airfare-check">
                                            <CheckCircleIcon className="h-5 w-5 stroke-primary-500" />
                                          </span>
                                        </Button>
                                      </SheetTrigger>
                                      <SheetContent>
                                        <SheetHeader>
                                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
                                            <FileSearch02Icon className="h-5 w-5 stroke-primary-600" />
                                          </div>
                                          <div>
                                            <SheetTitle>Airfare Information</SheetTitle>
                                            <SheetDescription>{programDetail.program_name}</SheetDescription>
                                          </div>
                                        </SheetHeader>
                                        <div className="flex flex-col gap-6 px-6 pb-6">
                                          {/* List of Airfare Items */}
                                          {(() => {
                                            const budgetKey = `${activityIndex}-${budgetIndex}`
                                            const items = airfareList[budgetKey] || []

                                            return (
                                              <>
                                                {items.length > 0 && (
                                                  <div className="flex flex-col gap-3">
                                                    {items.map((item) => (
                                                      <div
                                                        key={item.id}
                                                        className="relative rounded-lg border border-gray-300 bg-white px-6 py-4"
                                                      >
                                                        <div className="absolute right-6 top-4 z-10 flex gap-2">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setAirfareList((prev) => ({
                                                                ...prev,
                                                                [budgetKey]: prev[budgetKey].filter(
                                                                  (i) => i.id !== item.id,
                                                                ),
                                                              }))
                                                            }}
                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                                                          >
                                                            <Trash01Icon className="h-5 w-5 stroke-gray-600" />
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              // Clear errors when editing
                                                              setAirfareErrors((prev) => ({
                                                                ...prev,
                                                                [budgetKey]: {},
                                                              }))
                                                              setEditingAirfare({
                                                                budgetKey,
                                                                item,
                                                              })
                                                            }}
                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                                                          >
                                                            <Edit01Icon className="h-5 w-5 stroke-gray-600" />
                                                          </button>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="space-y-2">
                                                          <h4 className="text-base font-medium text-gray-900">
                                                            {item.name}
                                                          </h4>
                                                          <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-medium text-gray-600">
                                                              {item.origin}
                                                            </span>
                                                            <span className="text-gray-500">→</span>
                                                            <span className="font-medium text-gray-600">
                                                              {item.destination}
                                                            </span>
                                                          </div>
                                                          <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                              <CalendarIcon className="h-3.5 w-3.5 stroke-gray-600" />
                                                              <span>
                                                                {item.date
                                                                  ? dayjs(item.date).format('D MMMM YYYY')
                                                                  : '-'}
                                                              </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                              <ClockStopwatchIcon className="h-3.5 w-3.5 stroke-gray-600" />
                                                              <span>
                                                                {item.time ? dayjs(item.time).format('HH:mm') : '-'}
                                                              </span>
                                                            </div>
                                                          </div>
                                                          {item.transport_mode && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                              <PlaneIcon className="h-3.5 w-3.5 stroke-gray-600" />
                                                              <span>{item.transport_mode}</span>
                                                            </div>
                                                          )}
                                                          {item.luggage_info && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                              <Briefcase02Icon className="h-3.5 w-3.5 stroke-gray-600" />
                                                              <span>{item.luggage_info}</span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}

                                                {/* Add/Edit Form - Always visible */}
                                                <div className="flex flex-col gap-4 rounded-lg border border-gray-300 p-6">
                                                  <div>
                                                    <label className="input-label">Nama Informasi</label>
                                                    <Input
                                                      type="text"
                                                      placeholder='e.g "Berangkat", "Transit", "Pulang"'
                                                      required
                                                      error={!!airfareErrors[budgetKey]?.name}
                                                      value={editingAirfare.item?.name || ''}
                                                      onChange={(e) => {
                                                        // Clear error for this field
                                                        if (airfareErrors[budgetKey]?.name) {
                                                          setAirfareErrors((prev) => ({
                                                            ...prev,
                                                            [budgetKey]: {
                                                              ...prev[budgetKey],
                                                              name: undefined,
                                                            },
                                                          }))
                                                        }

                                                        if (editingAirfare.item) {
                                                          setEditingAirfare((prev) => ({
                                                            ...prev,
                                                            item: prev.item
                                                              ? {
                                                                  ...prev.item,
                                                                  name: e.target.value,
                                                                }
                                                              : null,
                                                          }))
                                                        } else {
                                                          setEditingAirfare({
                                                            budgetKey,
                                                            item: {
                                                              id: Date.now().toString(),
                                                              name: e.target.value,
                                                              origin: '',
                                                              destination: '',
                                                              date: null,
                                                              time: null,
                                                              transport_mode: '',
                                                              luggage_info: '',
                                                            },
                                                          })
                                                        }
                                                      }}
                                                    />
                                                    {airfareErrors[budgetKey]?.name && (
                                                      <p className="mt-1.5 text-sm text-error-500">
                                                        {airfareErrors[budgetKey]?.name}
                                                      </p>
                                                    )}
                                                  </div>

                                                  <div>
                                                    <label className="input-label">Dari (Asal)</label>
                                                    <Input
                                                      type="text"
                                                      placeholder="Nama Lokasi Asal"
                                                      required
                                                      error={!!airfareErrors[budgetKey]?.origin}
                                                      value={editingAirfare.item?.origin || ''}
                                                      onChange={(e) => {
                                                        // Clear error for this field
                                                        if (airfareErrors[budgetKey]?.origin) {
                                                          setAirfareErrors((prev) => ({
                                                            ...prev,
                                                            [budgetKey]: {
                                                              ...prev[budgetKey],
                                                              origin: undefined,
                                                            },
                                                          }))
                                                        }

                                                        if (editingAirfare.item) {
                                                          setEditingAirfare((prev) => ({
                                                            ...prev,
                                                            item: prev.item
                                                              ? {
                                                                  ...prev.item,
                                                                  origin: e.target.value,
                                                                }
                                                              : null,
                                                          }))
                                                        }
                                                      }}
                                                    />
                                                    {airfareErrors[budgetKey]?.origin && (
                                                      <p className="mt-1.5 text-sm text-error-500">
                                                        {airfareErrors[budgetKey]?.origin}
                                                      </p>
                                                    )}
                                                  </div>

                                                  <div>
                                                    <label className="input-label">Ke (Tujuan)</label>
                                                    <Input
                                                      type="text"
                                                      placeholder="Nama Lokasi Tujuan"
                                                      required
                                                      error={!!airfareErrors[budgetKey]?.destination}
                                                      value={editingAirfare.item?.destination || ''}
                                                      onChange={(e) => {
                                                        // Clear error for this field
                                                        if (airfareErrors[budgetKey]?.destination) {
                                                          setAirfareErrors((prev) => ({
                                                            ...prev,
                                                            [budgetKey]: {
                                                              ...prev[budgetKey],
                                                              destination: undefined,
                                                            },
                                                          }))
                                                        }

                                                        if (editingAirfare.item) {
                                                          setEditingAirfare((prev) => ({
                                                            ...prev,
                                                            item: prev.item
                                                              ? {
                                                                  ...prev.item,
                                                                  destination: e.target.value,
                                                                }
                                                              : null,
                                                          }))
                                                        }
                                                      }}
                                                    />
                                                    {airfareErrors[budgetKey]?.destination && (
                                                      <p className="mt-1.5 text-sm text-error-500">
                                                        {airfareErrors[budgetKey]?.destination}
                                                      </p>
                                                    )}
                                                  </div>

                                                  <div>
                                                    <label className="input-label">Tanggal</label>
                                                    <DatePickerCalendar
                                                      placeholder="Pilih Tanggal"
                                                      isUsingCustomHeader={true}
                                                      typeYears="future"
                                                      size="sm"
                                                      dateFormat="eee, dd MMM yyyy"
                                                      required
                                                      error={!!airfareErrors[budgetKey]?.date}
                                                      selected={editingAirfare.item?.date || null}
                                                      onChange={(date: Date) => {
                                                        // Clear error for this field
                                                        if (airfareErrors[budgetKey]?.date) {
                                                          setAirfareErrors((prev) => ({
                                                            ...prev,
                                                            [budgetKey]: {
                                                              ...prev[budgetKey],
                                                              date: undefined,
                                                            },
                                                          }))
                                                        }

                                                        if (editingAirfare.item) {
                                                          setEditingAirfare((prev) => ({
                                                            ...prev,
                                                            item: prev.item
                                                              ? {
                                                                  ...prev.item,
                                                                  date,
                                                                }
                                                              : null,
                                                          }))
                                                        }
                                                      }}
                                                    />
                                                    {airfareErrors[budgetKey]?.date && (
                                                      <p className="mt-1.5 text-sm text-error-500">
                                                        {airfareErrors[budgetKey]?.date}
                                                      </p>
                                                    )}
                                                  </div>

                                                  <div>
                                                    <label className="input-label">Waktu</label>
                                                    <TimePicker
                                                      placeholder="Pilih waktu"
                                                      size="sm"
                                                      required
                                                      error={!!airfareErrors[budgetKey]?.time}
                                                      selected={editingAirfare.item?.time || null}
                                                      onChange={(date: Date) => {
                                                        // Clear error for this field
                                                        if (airfareErrors[budgetKey]?.time) {
                                                          setAirfareErrors((prev) => ({
                                                            ...prev,
                                                            [budgetKey]: {
                                                              ...prev[budgetKey],
                                                              time: undefined,
                                                            },
                                                          }))
                                                        }

                                                        if (editingAirfare.item) {
                                                          setEditingAirfare((prev) => ({
                                                            ...prev,
                                                            item: prev.item
                                                              ? {
                                                                  ...prev.item,
                                                                  time: date,
                                                                }
                                                              : null,
                                                          }))
                                                        }
                                                      }}
                                                    />
                                                    {airfareErrors[budgetKey]?.time && (
                                                      <p className="mt-1.5 text-sm text-error-500">
                                                        {airfareErrors[budgetKey]?.time}
                                                      </p>
                                                    )}
                                                  </div>

                                                  <div>
                                                    <label className="input-label">Moda Transportasi</label>
                                                    <Input
                                                      type="text"
                                                      placeholder="Moda Transportasi"
                                                      required
                                                      error={!!airfareErrors[budgetKey]?.transport_mode}
                                                      value={editingAirfare.item?.transport_mode || ''}
                                                      onChange={(e) => {
                                                        // Clear error for this field
                                                        if (airfareErrors[budgetKey]?.transport_mode) {
                                                          setAirfareErrors((prev) => ({
                                                            ...prev,
                                                            [budgetKey]: {
                                                              ...prev[budgetKey],
                                                              transport_mode: undefined,
                                                            },
                                                          }))
                                                        }

                                                        if (editingAirfare.item) {
                                                          setEditingAirfare((prev) => ({
                                                            ...prev,
                                                            item: prev.item
                                                              ? {
                                                                  ...prev.item,
                                                                  transport_mode: e.target.value,
                                                                }
                                                              : null,
                                                          }))
                                                        }
                                                      }}
                                                    />
                                                    {airfareErrors[budgetKey]?.transport_mode && (
                                                      <p className="mt-1.5 text-sm text-error-500">
                                                        {airfareErrors[budgetKey]?.transport_mode}
                                                      </p>
                                                    )}
                                                  </div>

                                                  <div>
                                                    <label className="input-label">Informasi Bagasi</label>
                                                    <Input
                                                      type="text"
                                                      placeholder="Informasi Bagasi"
                                                      value={editingAirfare.item?.luggage_info || ''}
                                                      onChange={(e) => {
                                                        if (editingAirfare.item) {
                                                          setEditingAirfare((prev) => ({
                                                            ...prev,
                                                            item: prev.item
                                                              ? {
                                                                  ...prev.item,
                                                                  luggage_info: e.target.value,
                                                                }
                                                              : null,
                                                          }))
                                                        }
                                                      }}
                                                    />
                                                  </div>

                                                  <Button
                                                    type="button"
                                                    btnType="normal"
                                                    variant="secondary-gray"
                                                    size="md"
                                                    className="w-full"
                                                    onClick={() => {
                                                      // Validate required fields
                                                      const errors: {
                                                        name?: string
                                                        origin?: string
                                                        destination?: string
                                                        date?: string
                                                        time?: string
                                                        transport_mode?: string
                                                      } = {}

                                                      const currentItem = editingAirfare.item

                                                      if (!currentItem?.name || currentItem.name.trim() === '') {
                                                        errors.name = 'Name is required'
                                                      }
                                                      if (!currentItem?.origin || currentItem.origin.trim() === '') {
                                                        errors.origin = 'Origin is required'
                                                      }
                                                      if (
                                                        !currentItem?.destination ||
                                                        currentItem.destination.trim() === ''
                                                      ) {
                                                        errors.destination = 'Destination is required'
                                                      }
                                                      if (!currentItem?.date) {
                                                        errors.date = 'Date is required'
                                                      }
                                                      if (!currentItem?.time) {
                                                        errors.time = 'Time is required'
                                                      }
                                                      if (
                                                        !currentItem?.transport_mode ||
                                                        currentItem.transport_mode.trim() === ''
                                                      ) {
                                                        errors.transport_mode = 'Transport mode is required'
                                                      }

                                                      // If there are errors, set them and return
                                                      if (Object.keys(errors).length > 0) {
                                                        setAirfareErrors((prev) => ({
                                                          ...prev,
                                                          [budgetKey]: errors,
                                                        }))
                                                        return
                                                      }

                                                      // Ensure we have an item to work with
                                                      if (!editingAirfare.item) {
                                                        return
                                                      }

                                                      // Clear errors if validation passes
                                                      setAirfareErrors((prev) => ({
                                                        ...prev,
                                                        [budgetKey]: {},
                                                      }))

                                                      const isEditing = items.some(
                                                        (i) => i.id === editingAirfare.item?.id,
                                                      )

                                                      if (isEditing) {
                                                        // Update existing item
                                                        setAirfareList((prev) => ({
                                                          ...prev,
                                                          [budgetKey]: prev[budgetKey].map((i) =>
                                                            i.id === editingAirfare.item?.id ? editingAirfare.item : i,
                                                          ),
                                                        }))
                                                      } else {
                                                        // Add new item
                                                        setAirfareList((prev) => ({
                                                          ...prev,
                                                          [budgetKey]: [
                                                            ...(prev[budgetKey] || []),
                                                            editingAirfare.item!,
                                                          ],
                                                        }))
                                                      }

                                                      // Reset form for new entry
                                                      setEditingAirfare({
                                                        budgetKey: budgetKey,
                                                        item: {
                                                          id: '',
                                                          name: '',
                                                          origin: '',
                                                          destination: '',
                                                          date: null,
                                                          time: null,
                                                          transport_mode: '',
                                                          luggage_info: '',
                                                        },
                                                      })
                                                    }}
                                                  >
                                                    <div className="flex items-center justify-center gap-2">
                                                      <span>
                                                        {editingAirfare.item &&
                                                        items.some((i) => i.id === editingAirfare.item?.id)
                                                          ? 'Update Airfare Information'
                                                          : 'Add as Airfare Information'}
                                                      </span>
                                                      <FilePlus02Icon className="h-5 w-5 stroke-gray-700" />
                                                    </div>
                                                  </Button>

                                                  {editingAirfare.item &&
                                                    items.some((i) => i.id === editingAirfare.item?.id) && (
                                                      <Button
                                                        type="button"
                                                        btnType="normal"
                                                        variant="secondary"
                                                        size="md"
                                                        className="w-full"
                                                        onClick={() => {
                                                          setEditingAirfare({
                                                            budgetKey: '',
                                                            item: null,
                                                          })
                                                        }}
                                                      >
                                                        Cancel
                                                      </Button>
                                                    )}
                                                </div>
                                              </>
                                            )
                                          })()}
                                        </div>
                                        <SheetFooter>
                                          <SheetPrimitive.Close asChild>
                                            <Button type="button" btnType="normal" variant="secondary-gray" size="md">
                                              Cancel
                                            </Button>
                                          </SheetPrimitive.Close>
                                          <SheetPrimitive.Close asChild>
                                            <Button type="button" btnType="normal" variant="primary" size="md">
                                              Save
                                            </Button>
                                          </SheetPrimitive.Close>
                                        </SheetFooter>
                                      </SheetContent>
                                    </Sheet>
                                  </>
                                ) : (
                                  <>
                                    <p className="mb-2 text-xs font-bold text-gray-500">
                                      {budget.vendor_category_information.name} Information
                                    </p>
                                    <Popover>
                                      <PopoverTrigger className="w-full" id="timelineTrigger">
                                        <Button
                                          btnType="div"
                                          size="md"
                                          variant="secondary-gray"
                                          className="w-full justify-center text-sm font-semibold text-gray-500"
                                        >
                                          <div className="shrink-0">
                                            <CalendarIcon className="h-5 w-5 stroke-gray-600" />
                                          </div>
                                          {timelineDate &&
                                          timelineDate[
                                            `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`
                                          ]?.start &&
                                          timelineDate[
                                            `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`
                                          ]?.end ? (
                                            <p className="flex items-center gap-2">
                                              {dayjs(
                                                timelineDate[
                                                  `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`
                                                ]?.start,
                                              ).format('MMM DD, YYYY')}{' '}
                                              -
                                              {dayjs(
                                                timelineDate[
                                                  `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`
                                                ]?.end,
                                              ).format('MMM DD, YYYY')}
                                              <CheckCircleIcon className="h-5 w-5 stroke-primary-500" />
                                            </p>
                                          ) : (
                                            `Date range for ${budget.vendor_category_information.name.toLowerCase()}`
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent align="start" className="pt-1.5">
                                        <Controller
                                          control={control}
                                          name={
                                            `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range` as any // This is because additional_data type on SDK is string event was modify the type
                                          }
                                          rules={{
                                            required: `${budget.vendor_category_information.name} information is required field`,
                                          }}
                                          render={({ field: { onChange }, fieldState: { invalid } }) => (
                                            <DatePickerCalendar
                                              isUsingCustomHeader={true}
                                              typeYears="future"
                                              selectsRange
                                              inline
                                              startDate={
                                                timelineDate
                                                  ? timelineDate[
                                                      `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`
                                                    ]?.start
                                                  : null
                                              }
                                              endDate={
                                                timelineDate
                                                  ? timelineDate[
                                                      `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`
                                                    ]?.end
                                                  : null
                                              }
                                              id="timelineDateRange"
                                              selected={
                                                timelineDate
                                                  ? timelineDate[
                                                      `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`
                                                    ]?.start
                                                  : null
                                              }
                                              onChange={(value: any) => {
                                                handleTimelineChange(
                                                  value,
                                                  `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.additional_data.travel_information.vendor_date_range`,
                                                )
                                                onChange({
                                                  start: value[0],
                                                  end: value[1],
                                                })
                                              }}
                                              error={invalid}
                                            />
                                          )}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div key={activity.id} className="border-b border-b-gray-200 py-6">
                          <div className="mb-6 flex w-full items-center gap-4">
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
                                    watch(`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`) *
                                      watch(`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) *
                                      watch(
                                        `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                      ),
                                    true,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="table-container">
                            <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                            <div className="table-wrapper overflow-x-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                              {activity.budgets?.length > 0 ? (
                                <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                                  <div className="border-y border-y-gray-200 bg-gray-50">
                                    <div className="flex items-center">
                                      <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                        No
                                      </div>
                                      <div className="w-52 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                        Description
                                      </div>
                                      <div className="w-24 px-2 py-3.5 text-left text-xs font-medium text-gray-600">
                                        Qty
                                      </div>
                                      <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                        Unit
                                      </div>
                                      <div className="w-24 px-2 py-3.5 text-left text-xs font-medium text-gray-600">
                                        Pckg Qty
                                      </div>
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
                                    <div className="flex items-center" key={budget.code}>
                                      <div className="w-32 p-4 pl-6 2xl:px-6">{budget.code}</div>
                                      <div className="w-52 p-4 2xl:px-6">{budget.description}</div>
                                      <div className="w-24 px-2 py-2.5">
                                        <Controller
                                          control={control}
                                          rules={{
                                            required: 'Qty is required field',
                                          }}
                                          name={`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`}
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
                                              {errors.budgets?.[budgetIndex]?.qty && (
                                                <span className="input-hint-text error">
                                                  {errors.budgets?.[budgetIndex]?.qty?.message}
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
                                          name={`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`}
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
                                              {errors.budgets?.[budgetIndex]?.pkg_qty && (
                                                <span className="input-hint-text error">
                                                  {errors.budgets?.[budgetIndex]?.pkg_qty?.message}
                                                </span>
                                              )}
                                            </>
                                          )}
                                        />
                                      </div>
                                      <div className="w-28 p-4 lowercase 2xl:px-6">{budget.pkg_unit}</div>
                                      <div className="w-48 px-2 py-2.5">
                                        <div className="flex items-center gap-3">
                                          <p className="text-gray-500">Rp</p>
                                          <div>
                                            <Controller
                                              control={control}
                                              rules={{
                                                required: 'Unit cost is required field',
                                              }}
                                              name={`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`}
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
                                                  {errors.budgets?.[budgetIndex]?.unit_cost_value && (
                                                    <span className="input-hint-text error">
                                                      {errors.budgets?.[budgetIndex]?.unit_cost_value?.message}
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
                                                watch(
                                                  `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`,
                                                ) || 0,
                                              ) *
                                                Number(
                                                  watch(
                                                    `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                                  ) || 0,
                                                ) *
                                                convertStringCurrency(
                                                  watch(
                                                    `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                                  ) || 0,
                                                ),
                                              true,
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="w-48 bg-white p-4 2xl:px-6">
                                        <div className="flex items-center justify-between gap-3">
                                          <p>Rp</p>
                                          <p>
                                            {formatCurrency(
                                              'IDR',
                                              !isEditForm
                                                ? remainingBudgetRf(
                                                    budget,
                                                    watch(
                                                      `activities_adjustment.${activityIndex}.budgets.${budgetIndex}`,
                                                    ),
                                                  )
                                                : budget.remaining -
                                                    Number(
                                                      watch(
                                                        `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`,
                                                      ) || 0,
                                                    ) *
                                                      Number(
                                                        watch(
                                                          `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                                        ) || 0,
                                                      ) *
                                                      convertStringCurrency(
                                                        watch(
                                                          `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                                        ) || 0,
                                                      ),
                                              true,
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </Fragment>
                ))}
              </Fragment>
            </div>
          ) : null,
        )}

        {/* ACTION_BY_TRAVELLER */}
        {budgetProcurementModified?.map((activity, activityIndex) =>
          activity.budgets.filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER')
            .length > 0 ? (
            <div className="mt-11" key={activityIndex}>
              {activityIndex === 0 ? (
                <div className="relative flex justify-center py-6">
                  <div className="absolute inset-x-0 top-1/2 z-0 h-px bg-gray-200"></div>
                  <div className="relative z-10 bg-white px-6">
                    <span className="inline-block rounded-full bg-rose-400 px-10 py-2 text-xs font-bold uppercase text-white">
                      ACTION BY TRAVELLER
                    </span>
                  </div>
                </div>
              ) : null}
              <div className="flex w-full flex-col border-l-4 border-l-rose-400 pl-6">
                <div className="border-b border-b-gray-200 py-6" key={activityIndex}>
                  <div className="mb-6 flex w-full items-center gap-4">
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
                            calculatePureTotalBudget(
                              watch(`activities_adjustment.${activityIndex}`)?.budgets.filter(
                                (budget) => budget.vendor_category_information?.action_by === 'ACTION_BY_TRAVELLER',
                              ) ||
                                activity?.budgets.filter(
                                  (budget) => budget.vendor_category_information?.action_by === 'ACTION_BY_TRAVELLER',
                                ),
                            ),
                            true,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="table-container">
                    <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                    <div className="table-wrapper overflow-x-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                      {activity.budgets.length > 0 ? (
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
                                Vendor Category
                              </div>
                              <div className="w-24 px-2 py-3.5 text-left text-xs font-medium text-gray-600">Qty</div>
                              <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                Unit
                              </div>
                              <div className="w-24 px-2 py-3.5 text-left text-xs font-medium text-gray-600">
                                Pckg Qty
                              </div>
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
                              <Fragment key={budgetIndex}>
                                {budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER' ? (
                                  <div className="flex items-center">
                                    <div className="w-32 p-4 pl-6 2xl:px-6">{budget.code}</div>
                                    <div className="w-52 p-4 2xl:px-6">{budget.description}</div>
                                    <div className="w-48 p-4 capitalize 2xl:px-6">
                                      {budget.vendor_category_information.name}
                                    </div>
                                    <div className="w-24 px-2 py-2.5">
                                      <Controller
                                        control={control}
                                        rules={{
                                          required: 'Qty is required field',
                                        }}
                                        name={`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`}
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
                                            {errors.budgets?.[budgetIndex]?.qty && (
                                              <span className="input-hint-text error">
                                                {errors.budgets?.[budgetIndex]?.qty?.message}
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
                                        name={`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`}
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
                                            {errors.budgets?.[budgetIndex]?.pkg_qty && (
                                              <span className="input-hint-text error">
                                                {errors.budgets?.[budgetIndex]?.pkg_qty?.message}
                                              </span>
                                            )}
                                          </>
                                        )}
                                      />
                                    </div>
                                    <div className="w-28 p-4 lowercase 2xl:px-6">{budget.pkg_unit}</div>
                                    <div className="w-48 px-2 py-2.5">
                                      <div className="flex items-center gap-3">
                                        <p className="text-gray-500">Rp</p>
                                        <div>
                                          <Controller
                                            control={control}
                                            rules={{
                                              required: 'Unit cost is required field',
                                            }}
                                            name={`activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`}
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
                                                  readonly={
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
                                                {errors.budgets?.[budgetIndex]?.unit_cost_value && (
                                                  <span className="input-hint-text error">
                                                    {errors.budgets?.[budgetIndex]?.unit_cost_value?.message}
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
                                              watch(
                                                `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`,
                                              ) || 0,
                                            ) *
                                              Number(
                                                watch(
                                                  `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                                ) || 0,
                                              ) *
                                              convertStringCurrency(
                                                watch(
                                                  `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                                ) || 0,
                                              ),
                                            true,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="w-48 bg-white p-4 2xl:px-6">
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>
                                          {formatCurrency(
                                            'IDR',
                                            !isEditForm
                                              ? remainingBudgetRf(
                                                  budget,
                                                  watch(
                                                    `activities_adjustment.${activityIndex}.budgets.${budgetIndex}`,
                                                  ),
                                                )
                                              : budget.remaining -
                                                  Number(
                                                    watch(
                                                      `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.qty`,
                                                    ) || 0,
                                                  ) *
                                                    Number(
                                                      watch(
                                                        `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                                      ) || 0,
                                                    ) *
                                                    convertStringCurrency(
                                                      watch(
                                                        `activities_adjustment.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`,
                                                      ) || 0,
                                                    ),
                                            true,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </Fragment>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null,
        )}
      </div>

      {/* Travel Information */}
      <Drawer
        drawerWidth="w-[28rem]"
        isOpen={travelInformationDrawer}
        setIsOpen={setTravelInformationDrawer}
        title="Travel Information"
        description={programDetail.program_name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeTravelInformationDrawer}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button type="button" btnType="normal" variant="primary" size="md" onClick={closeTravelInformationDrawer}>
              Save
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="personal_hire_information.type_hire" className="input-label">
              Organizer
            </label>
            <div className="grid grid-cols-2 items-center gap-2">
              {travellingOptions.map((aboutProgram) => (
                <div key={`${snakeCase(aboutProgram.text)}_organizer`}>
                  <input
                    {...register('travel_detail.additional_data.travel_organizer')}
                    className="select-multiple standart hidden"
                    id={`${snakeCase(aboutProgram.text)}_organizer`}
                    value={snakeCase(aboutProgram.text)}
                    type="radio"
                    name="travel_detail.additional_data.travel_organizer"
                    defaultChecked={snakeCase(aboutProgram.text) === 'puskapa' ? true : false}
                  />
                  <label
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    htmlFor={`${snakeCase(aboutProgram.text)}_organizer`}
                  >
                    <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300 bg-white bg-center bg-no-repeat duration-300"></span>
                    <p className="font-medium text-gray-700 duration-300">{aboutProgram.text}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="location" className="input-label">
              Location
            </label>
            <Controller
              control={control}
              rules={{
                required: 'Location is required field',
              }}
              name="travel_detail.additional_data.location"
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <>
                  <Input
                    type="text"
                    id="location"
                    placeholder="Location"
                    value={value || ''}
                    onChange={onChange}
                    error={invalid}
                  />
                  {errors.travel_detail?.additional_data.location && (
                    <span className="input-hint-text error">
                      {errors.travel_detail?.additional_data.location.message}
                    </span>
                  )}
                </>
              )}
            />
          </div>
          <SwitchableUploadField
            name="travel_detail.additional_data.invitation_path"
            label="Invitation Documents"
            fieldKey="invitation_path"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.invitation_document}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                invitation_document: !prev.invitation_document,
              }))
            }}
            bucketName={BucketsEnum.rf_doc}
            uploadProgress={tempProgressUpload}
            uploadedFiles={invitationDocuments}
            setUploadedFiles={setInvitationDocuments}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteInvitationFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={existdocumentsPath?.['invitation_path']?.[0] || null}
            handleDeleteExistingFile={() => {
              setExistDocumentsPath((prev) => ({
                ...prev,
                invitation_path: null,
              }))
            }}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />
          <div className="h-px w-full bg-gray-200"></div>
          <div className="flex flex-col gap-6">
            <SwitchableUploadField
              name="travel_detail.additional_data.tor_path"
              label="ToR"
              fieldKey="tor_path"
              control={control}
              errors={errors}
              setValue={setValue}
              isLinkMode={switchTogglableButton.tor}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  tor: !prev.tor,
                }))
              }}
              bucketName={BucketsEnum.rf_doc}
              uploadProgress={tempProgressUpload}
              uploadedFiles={torDocuments}
              setUploadedFiles={setTorDocuments}
              handleUploadFile={handleUploadFile}
              deleteFilePath={deleteTorFile}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={existdocumentsPath?.['tor_path']?.[0] || null}
              handleDeleteExistingFile={() => {
                setExistDocumentsPath((prev) => ({
                  ...prev,
                  tor_path: null,
                }))
              }}
              isEditMode={router.query.slug[1] === 'edit'}
              isRequired={false}
            />
            <SwitchableUploadField
              name="travel_detail.additional_data.assignment_letter_path"
              label="Assigment Letter"
              fieldKey="assignment_letter_path"
              control={control}
              errors={errors}
              setValue={setValue}
              isLinkMode={switchTogglableButton.assignment_letter}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  assignment_letter: !prev.assignment_letter,
                }))
              }}
              bucketName={BucketsEnum.rf_doc}
              uploadProgress={tempProgressUpload}
              uploadedFiles={assignmentDocuments}
              setUploadedFiles={setAssignmentDocuments}
              handleUploadFile={handleUploadFile}
              deleteFilePath={deleteAssignmentFile}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={existdocumentsPath?.['assignment_letter_path']?.[0] || null}
              handleDeleteExistingFile={() => {
                setExistDocumentsPath((prev) => ({
                  ...prev,
                  assignment_letter_path: null,
                }))
              }}
              isEditMode={router.query.slug[1] === 'edit'}
              isRequired={false}
            />
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label htmlFor="travel_detail.additional_data.notes" className="input-label">
                Notes (Optional)
              </label>
              <textarea
                {...register('travel_detail.additional_data.notes')}
                id="travel_detail.additional_data.notes"
                className="textarea-input resize-none"
                rows={5}
                placeholder="Write notes about this travel"
              ></textarea>
            </div>
          </div>
        </div>
      </Drawer>
    </form>
  )
}
