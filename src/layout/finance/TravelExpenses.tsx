import { Button } from '@/components/Button'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { Input } from '@/components/Input'
import { Loader } from '@/components/Loader'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { ComboboxRadix } from '@/components/radix/ComboboxRadix'
import { ActivityBudgetListModified, ProjectActivityModified } from '@/layout/program/budget-needs/BudgetNeedsList'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { PRTypes } from '@/shared/pr.type'
import { BucketsUnion, DynamicProgressType } from '@/types/global'
import { PaymentRequestListType } from '@/types/payment-request'
import {
  employeeApi,
  fileApi,
  getDetailPayment,
  getOpenUrl,
  getPerdiemSetting,
  paymentRequestApi,
  programApi,
} from '@/utils/apiRequestHelper'
import {
  calculatePureTotalBudget,
  calculateTotalBudget,
  dateFormatToISO,
  formatCurrency,
  isValidUrl,
  slugify,
} from '@/utils/globalHelper'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Controller, FieldErrors, SubmitHandler, useForm } from 'react-hook-form'
import TextareaAutosize from 'react-textarea-autosize'
import { toast } from 'react-toastify'
import {
  BudgetProgramProjectListResponse,
  CreatePaymentRequestApiRequest,
  CreatePaymentRequestApiRequestApsResultEnum,
  CreatePaymentRequestApiRequestPaymentTypeEnum,
  Employee,
  PaymentRequestDetail,
  PRAttachment,
  ProgramDetail,
  RequisitionFormDetail,
} from 'sdk/api'
import { useSWRConfig } from 'swr'
import useSWRImmutable from 'swr/immutable'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'
import { v4 as uuidv4 } from 'uuid'
dayjs.extend(utc)

type PaymentRequestType = {
  programDetail: ProgramDetail
  requisitionFormDetail: RequisitionFormDetail
  paymentRequestIdentifier: 'TE'
  programId: string
  projectId: string
  rfId: string
  finalTravelExpenseList?: PaymentRequestListType[]
  travellerPerdiemTax: number
  totalFundReceived?: number
  budgetNeeds: BudgetProgramProjectListResponse
}

export type CreateTravelExpenseType = CreatePaymentRequestApiRequest & {
  activities: {
    budgets: ActivityBudgetListModified[]
  }[]
  additional_data?: {
    expenses: number
    total_requested_from_tr: number
  }
  additional_attachments?: {
    eticket?: string[]
    boardingPass?: string[]
    transportExpensesReceipt?: string[]
    transportOthersReceipt?: string[]
    invitation?: string[]
    tor?: string[]
    letterAssignment?: string[]
    eventReport?: string[]
  }
}

type PerdiemStaticType = {
  description?: string
  pkg_qty?: number
  total?: number
  tax?: number
}

type OtherDataDynamicType = {
  id: string
  ordering_seq: number
  code: string
  description: string
  qty: number
  unit: string
  pkg_qty: number
  pkg_unit: string
  unit_cost: string
  total_expenses: string
  vendor_category_id: string
  is_checked: boolean
  is_dynamic: boolean
}

const PERDIEM_STATIC_DATA: PerdiemStaticType[] = [
  {
    description: 'Jumlah makan pagi ditanggung',
    pkg_qty: 0,
    tax: -8,
    total: 0,
  },
  {
    description: 'Jumlah makan siang ditanggung',
    pkg_qty: 0,
    tax: -10,
    total: 0,
  },
  {
    description: 'Jumlah makan malam ditanggung',
    pkg_qty: 0,
    tax: -21,
    total: 0,
  },
  {
    description: 'Jumlah malam tidak menginap', // Jumlah hari perjalanan
    pkg_qty: 0,
    tax: -61, // 50
    total: 0,
  },
]

const getDetailEmployee = async (id: string) => {
  const employeeDetail = await employeeApi.employeeControllerGetEmployeeDetail(id)
  return employeeDetail.data.data
}

export const TravelExpenses = ({
  programDetail,
  requisitionFormDetail,
  programId,
  projectId,
  rfId,
  travellerPerdiemTax,
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
  const [apfTotal, setApfTotal] = useState<number>(0)
  const [spendingDeadlinePayment, setSpendingDeadlinePayment] = useState<Date | null>(null)
  const [bankAccountDrawer, setBankAccountDrawer] = useState(false)
  const [attachmentDrawer, setAttachmentDrawer] = useState(false)
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [boardingPass, setBoardingPass] = useState([])
  const [eticket, setEticket] = useState([])
  const [transportExpenses, setTransportExpenses] = useState([])
  const [otherExpenses, setOtherExpenses] = useState([])
  const [invitation, setInvitation] = useState([])
  const [tor, setTor] = useState([])
  const [assignmentLetter, setAssignmentLetter] = useState([])
  const [eventReport, setEventReport] = useState([])
  const [documentsPath, setDocumentsPath] = useState<object | null>(null)
  const [existingAttachments, setExistingAttachments] = useState<PRAttachment[]>([])
  const [perdiemStatic, setPerdiemStatic] = useState<PerdiemStaticType[]>(PERDIEM_STATIC_DATA)
  const [detailApf, setDetailApf] = useState<PaymentRequestDetail | null>(null)
  const [renderForm, setRenderForm] = useState<boolean>(false)
  const [taxBenchmark, setTaxBenchmark] = useState<number>(0)
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    submitTravelExpense: boolean
  }>({
    submitTravelExpense: false,
  })
  // DYNAMIC DATA CALCULATION
  const [transportationTECalculation, setTransportationTECalculation] = useState<
    {
      id: string
      total: number
    }[]
  >([])
  const [transportationTECalculationFinal, setTransportationTECalculationFinal] = useState<number[][]>([])
  const [otherTECalculation, setOtherTECalculation] = useState<
    {
      id: string
      total: number
    }[]
  >([])
  const [perdiemTECalculation, setPerdiemTECalculation] = useState<
    {
      id: string
      total: number
    }[]
  >([])
  const [otherDataDynamic, setOtherDataDynamic] = useState<OtherDataDynamicType[][]>([[]])
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    eticket_upload: boolean
    boarding_pass_upload: boolean
    bundling_transport_expense_upload: boolean
    bundling_others_expense_upload: boolean
    invitation_upload: boolean
    tor_upload: boolean
    assignment_letter_upload: boolean
    event_report_upload: boolean
  }>({
    eticket_upload: false,
    boarding_pass_upload: false,
    bundling_transport_expense_upload: false,
    bundling_others_expense_upload: false,
    invitation_upload: false,
    tor_upload: false,
    assignment_letter_upload: false,
    event_report_upload: false,
  })

  const { data: perdiemSettingData, trigger: perdiemSettingTrigger } = useSWRMutation(`${programId}`, getPerdiemSetting)

  const {
    data: paymentDetailData,
    trigger: paymentDetailTrigger,
    isMutating: paymentDetailIsMutating,
  } = useSWRMutation(router.query.edit ? router.query.edit : null, (paymentId: string) => getDetailPayment(paymentId))

  const openBankInformationDrawer = () => {
    setBankAccountDrawer(true)
  }
  const closeBankInformationDrawer = () => {
    setBankAccountDrawer(false)
  }
  const openAttachmentDrawer = () => {
    setAttachmentDrawer(true)
  }
  const closeAttachmentDrawer = () => {
    setAttachmentDrawer(false)
  }

  const handleInputQtyStaticData =
    (index: number, budgetQty: number, pkgQty: number, tax: number, defaultValuePckgNumber: number) => (event) => {
      // If more than default value
      if (Number(event.target.value) > defaultValuePckgNumber) {
        document.getElementById(`perdiem_static_text_${index}`).style.display = 'block'
        document.getElementById(
          `perdiem_static_text_${index}`,
        ).innerHTML = `Value can't be greater than default value (${defaultValuePckgNumber})`
        const perdiemNewData = [...perdiemStatic]
        const totalCalculation = budgetQty * pkgQty * Number(event.target.value) * tax
        perdiemNewData[index].pkg_qty = Number(event.target.value)
        perdiemNewData[index].total = Math.round(totalCalculation)
        setPerdiemStatic(perdiemNewData)
        return false
      }
      // If negative value
      if (Number(event.target.value) < 0) {
        document.getElementById(`perdiem_static_text_${index}`).style.display = 'block'
        document.getElementById(`perdiem_static_text_${index}`).innerHTML = "Value can't be negative"
        const perdiemNewData = [...perdiemStatic]
        const totalCalculation = budgetQty * pkgQty * Number(event.target.value) * tax
        perdiemNewData[index].pkg_qty = Number(event.target.value)
        perdiemNewData[index].total = Math.round(totalCalculation)
        setPerdiemStatic(perdiemNewData)
        return false
      }
      // If in allowed range
      if (Number(event.target.value) <= defaultValuePckgNumber && Number(event.target.value) >= 0) {
        document.getElementById(`perdiem_static_text_${index}`).style.display = 'none'
        document.getElementById(`perdiem_static_text_${index}`).innerHTML = ''
      }
      const perdiemNewData = [...perdiemStatic]
      const totalCalculation = budgetQty * pkgQty * Number(event.target.value) * tax
      perdiemNewData[index].pkg_qty = Number(event.target.value)
      perdiemNewData[index].total = Math.round(totalCalculation)

      setPerdiemStatic(perdiemNewData)
    }

  const handleDynamicPerdiemCalculation = (index: number, budgetQty: number, pkgQty: number, perdiem: string) => {
    if (perdiem.toLowerCase() === 'jumlah hari perjalanan') {
      const perdiemNewData = [...perdiemStatic]
      perdiemNewData[index].tax = perdiemSettingData.travel_expense_percentages.travel_days
      const totalCalculation = budgetQty * pkgQty * perdiemNewData[index].pkg_qty * (perdiemNewData[index].tax / 100)
      perdiemNewData[index].total = Math.round(totalCalculation)
      perdiemNewData[index].description = 'Jumlah hari perjalanan'
      setPerdiemStatic(perdiemNewData)
    } else {
      const perdiemNewData = [...perdiemStatic]
      perdiemNewData[index].tax = -perdiemSettingData.travel_expense_percentages.non_overnight
      const totalCalculation = budgetQty * pkgQty * perdiemNewData[index].pkg_qty * (perdiemNewData[index].tax / 100)
      perdiemNewData[index].total = Math.round(totalCalculation)
      perdiemNewData[index].description = 'Jumlah malam tidak menginap'
      setPerdiemStatic(perdiemNewData)
    }
  }

  const handleUploadFile = async (
    fileObjects: File[],
    identifier:
      | 'eticket'
      | 'boarding_pass'
      | 'transport_expenses_receipt'
      | 'other_expenses_receipt'
      | 'invitation'
      | 'tor'
      | 'assignment_letter'
      | 'event_report',
  ) => {
    const bucketName = BucketsEnum.pr_attachment
    if (!Array.isArray(fileObjects)) return

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
        case 'eticket':
          const eticket = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            eticket,
          }))
          break
        case 'boarding_pass':
          const boarding_pass = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            boarding_pass,
          }))
          break
        case 'transport_expenses_receipt':
          const transport_expenses_receipt = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            transport_expenses_receipt,
          }))
          break
        case 'other_expenses_receipt':
          const other_expenses_receipt = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            other_expenses_receipt,
          }))
          break
        case 'invitation':
          const invitation = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            invitation,
          }))
          break
        case 'tor':
          const tor = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            tor,
          }))
          break
        case 'assignment_letter':
          const assignment_letter = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            assignment_letter,
          }))
          break
        case 'event_report':
          const event_report = [`${bucketName}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            event_report,
          }))
          break
        default:
          break
      }
    })
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    getValues,
    setError,
    formState: { errors },
  } = useForm<CreateTravelExpenseType>({
    mode: 'onChange',
    defaultValues: {
      description: !router.query.edit ? requisitionFormDetail.about_request : undefined,
    },
  })

  const { mutate } = useSWRConfig()
  const { data: employeeDetailData } = useSWRImmutable<Employee, Error>(
    userLoggedinInformation ? userLoggedinInformation.employee_id : null,
    getDetailEmployee,
  )

  const addNewOtherEntry = (activityIndex: number, activity: ProjectActivityModified) => {
    const findLastOtherItem = activity.budgets?.filter((budget) => budget.vendor_category_information.name === 'Other')

    const initialData = {
      id: uuidv4(),
      ordering_seq: 0,
      code: findLastOtherItem[findLastOtherItem.length - 1].code,
      description: '',
      qty: 0,
      unit: '',
      pkg_qty: 0,
      pkg_unit: '',
      unit_cost: '',
      total_expenses: '',
      vendor_category_id: findLastOtherItem[findLastOtherItem.length - 1].vendor_category_id,
      is_checked: false,
      activity_id: activity.id,
      is_dynamic: true,
    }

    setOtherDataDynamic((prevState) => {
      const newState = [...prevState] // Copy the current state
      if (!newState[activityIndex]) {
        // If there is no array at the given index, create one
        newState[activityIndex] = []
      }
      newState[activityIndex].push(initialData) // Push the data into the array at the given index
      return newState // Return the new state
    })
  }

  const updateOtherEntry = (vendorCategoryId: string, activityIndex: number, otherDatIndex: number, event: any) => {
    const { name, value } = event.target

    setOtherDataDynamic((prevState) => {
      // Create a copy of the current state
      const newState = [...prevState]

      // Check if the array at the parent index exists, if not, create it
      if (!newState[activityIndex]) {
        newState[activityIndex] = []
      }

      // Check if the object at the child index exists, if not, create it
      if (!newState[activityIndex][otherDatIndex]) {
        newState[activityIndex][otherDatIndex] = {
          id: uuidv4(),
          ordering_seq: 0,
          code: newState[activityIndex][otherDatIndex].code,
          description: '',
          qty: 0,
          unit: '',
          pkg_qty: 0,
          pkg_unit: '',
          unit_cost: '',
          total_expenses: '',
          vendor_category_id: newState[activityIndex][otherDatIndex].vendor_category_id,
          is_checked: false,
          is_dynamic: true,
        }
      }

      // Update the object with the new value
      newState[activityIndex][otherDatIndex] = {
        ...newState[activityIndex][otherDatIndex],
        [name]: value,
        // name === 'is_checked' ? (value === 'false' ? false : true) : value,
      }

      return newState // Return the new state
    })
  }
  const deleteOtherEntry = (activityIndex: number) => {
    setOtherDataDynamic((prevState) => {
      // Create a copy of the current state
      const newState = [...prevState]

      // Filter out the child data that is not checked
      newState[activityIndex] = newState[activityIndex].filter((childData) => !childData.is_checked)

      return newState // Return the new state
    })
  }

  const totalBudgetTraveller = useMemo(() => {
    if (!budgetsFromProcurementsToPaymentRequest) return
    return calculatePureTotalBudget(
      budgetsFromProcurementsToPaymentRequest?.flatMap((activity) =>
        activity.budgets?.filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER'),
      ),
    )
  }, [budgetsFromProcurementsToPaymentRequest])

  const submitTravelExpenses: SubmitHandler<CreateTravelExpenseType> = async (formInput) => {
    // Check is invitation toggle link is active? Is active please check the link url validation
    if (
      switchTogglableButton.invitation_upload &&
      String(formInput.additional_attachments?.invitation || '').trim() !== '' &&
      !isValidUrl(formInput.additional_attachments?.invitation as unknown as string)
    ) {
      setError('additional_attachments.invitation', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })

      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
      openAttachmentDrawer()
      return false
    }

    // Check is eticket toggle link is active? Is active please check the link url validation
    if (
      switchTogglableButton.eticket_upload &&
      String(formInput.additional_attachments?.eticket || '').trim() !== '' &&
      !isValidUrl(formInput.additional_attachments?.eticket as unknown as string)
    ) {
      setError('additional_attachments.eticket', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })

      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
      openAttachmentDrawer()
      return false
    }

    // Check is transport expenses toggle link is active? Is active please check the link url validation
    if (
      switchTogglableButton.bundling_transport_expense_upload &&
      String(formInput.additional_attachments?.transportExpensesReceipt || '').trim() !== '' &&
      !isValidUrl(formInput.additional_attachments?.transportExpensesReceipt as unknown as string)
    ) {
      setError('additional_attachments.transportExpensesReceipt', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })

      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
      openAttachmentDrawer()
      return false
    }

    // Check is others expenses toggle link is active? Is active please check the link url validation
    if (
      switchTogglableButton.bundling_others_expense_upload &&
      String(formInput.additional_attachments?.transportOthersReceipt || '').trim() !== '' &&
      !isValidUrl(formInput.additional_attachments?.transportOthersReceipt as unknown as string)
    ) {
      setError('additional_attachments.transportOthersReceipt', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })

      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
      openAttachmentDrawer()
      return false
    }

    // Travel Expenses attachments are optional.

    setLoadingButtonStatement((prev) => ({
      ...prev,
      submitTravelExpense: true,
    }))

    const requestToExpenseData = budgetsFromProcurementsToPaymentRequest.flatMap((activity) =>
      activity.budgets
        .filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER')
        .flatMap((budget) => budget),
    )

    const isOtherExist = formInput.activities.flatMap((activity) => {
      activity.budgets.find((budget) => budget.vendor_category_information.name.toLowerCase() === 'other')
    })[0]

    // Others Data Dynamic Modified
    const otherDataDynamicUpdated = otherDataDynamic.flatMap((activity) =>
      activity.flatMap((other) => {
        return {
          ...other,
          pkg_qty: Number(other.pkg_qty),
          qty: Number(other.qty),
          unit_cost_value: Number(other.unit_cost),
          total_expenses: Number(other.qty) * Number(other.pkg_qty) * Number(other.unit_cost),
          unit_cost: `IDR_${other.unit_cost}`,
          additional_data: {},
          action_by: '',
          advance_payment_total: null,
        }
      }),
    )
    let isThereStaticPerdiemMoreThanDefaultPerdiem = false
    let advancePerdiemFeeCalculation = 0

    if (isOtherExist !== undefined) {
      if (otherDataDynamicUpdated.length === 0) {
        toast.warning('Please specify other expenses, at least one other budget information.', {
          autoClose: 5000,
        })
        setLoadingButtonStatement((prev) => ({
          ...prev,
          submitTravelExpense: false,
        }))
        return false
      }
    }

    const totalTravelExpenses =
      // Perdiem Total Requested
      perdiemTECalculation.reduce((accumulator, currentValue) => accumulator + currentValue.total, 0) +
        // Transportation Total Requested
        transportationTECalculation.reduce((accumulator, currentValue) => accumulator + currentValue.total, 0) +
        // Other Total Requested (Dynamic)
        otherDataDynamic
          .flatMap((item) => item)
          .flatMap((item) => Number(item.qty) * Number(item.pkg_qty) * Number(item.unit_cost))
          .reduce((accumulator, currentValue) => accumulator + currentValue, 0) || 0

    if (totalTravelExpenses > calculateTotalBudget(budgetNeeds)) {
      toast.error('Total travel expenses is more than total project budget!', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-error-500" />,
        autoClose: 5000,
      })
      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
      return false
    }

    const submitValues = {
      rf_id: rfId,
      vendor_id: null,
      description: formInput.description || '',
      payment_type: CreatePaymentRequestApiRequestPaymentTypeEnum.TravelExpense,
      expected_payment_date: dateFormatToISO(dayjs(formInput.expected_payment_date).utc().format()),
      attachments: [
        {
          key: 'eticket',
          file_path: switchTogglableButton.eticket_upload
            ? String(formInput.additional_attachments?.eticket || '').trim()
              ? [String(formInput.additional_attachments?.eticket).trim()]
              : []
            : documentsPath?.['eticket'] || existingAttachments.find((file) => file.key === 'eticket')?.file_path || [],
        },
        {
          key: 'boarding_pass',
          file_path: switchTogglableButton.boarding_pass_upload
            ? String(formInput.additional_attachments?.boardingPass || '').trim()
              ? [String(formInput.additional_attachments?.boardingPass).trim()]
              : []
            : documentsPath?.['boarding_pass'] ||
              existingAttachments.find((file) => file.key === 'boarding_pass')?.file_path ||
              [],
        },
        {
          key: 'transport_expenses_receipt',
          file_path: switchTogglableButton.bundling_transport_expense_upload
            ? String(formInput.additional_attachments?.transportExpensesReceipt || '').trim()
              ? [String(formInput.additional_attachments?.transportExpensesReceipt).trim()]
              : []
            : documentsPath?.['transport_expenses_receipt'] ||
              existingAttachments.find((file) => file.key === 'transport_expenses_receipt')?.file_path ||
              [],
        },
        {
          key: 'other_expenses_receipt',
          file_path: switchTogglableButton.bundling_others_expense_upload
            ? String(formInput.additional_attachments?.transportOthersReceipt || '').trim()
              ? [String(formInput.additional_attachments?.transportOthersReceipt).trim()]
              : []
            : documentsPath?.['other_expenses_receipt'] ||
              existingAttachments.find((file) => file.key === 'other_expenses_receipt')?.file_path ||
              [],
        },
        {
          key: 'invitation',
          file_path: switchTogglableButton.invitation_upload
            ? String(formInput.additional_attachments?.invitation || '').trim()
              ? [String(formInput.additional_attachments?.invitation).trim()]
              : []
            : documentsPath?.['invitation'] ||
              existingAttachments.find((file) => file.key === 'invitation')?.file_path ||
              [],
        },
        {
          key: 'tor',
          file_path: switchTogglableButton.tor_upload
            ? String(formInput.additional_attachments?.tor || '').trim()
              ? [String(formInput.additional_attachments?.tor).trim()]
              : []
            : documentsPath?.['tor'] || existingAttachments.find((file) => file.key === 'tor')?.file_path || [],
        },
        {
          key: 'assignment_letter',
          file_path: switchTogglableButton.assignment_letter_upload
            ? String(formInput.additional_attachments?.letterAssignment || '').trim()
              ? [String(formInput.additional_attachments?.letterAssignment).trim()]
              : []
            : documentsPath?.['assignment_letter'] ||
              existingAttachments.find((file) => file.key === 'assignment_letter')?.file_path ||
              [],
        },
        {
          key: 'event_report',
          file_path: switchTogglableButton.event_report_upload
            ? String(formInput.additional_attachments?.eventReport || '').trim()
              ? [String(formInput.additional_attachments?.eventReport).trim()]
              : []
            : documentsPath?.['event_report'] ||
              existingAttachments.find((file) => file.key === 'event_report')?.file_path ||
              [],
        },
      ].filter((attachment) => attachment.file_path.length > 0),
      with_ppn: false,
      budgets: formInput.activities.flatMap((activity) =>
        activity.budgets
          .filter((budget) => budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER')
          .flatMap((budget, budgetIndex) => {
            advancePerdiemFeeCalculation += Number(budget.advance_payment_total)

            if (
              budget.vendor_category_information.name === 'Overseas Perdiem' ||
              budget.vendor_category_information.name === 'Normal Perdiem' ||
              budget.vendor_category_information.name === 'Remote Area Perdiem'
            ) {
              isThereStaticPerdiemMoreThanDefaultPerdiem = perdiemStatic.some(
                (perdiem) => perdiem.pkg_qty < 0 || perdiem.pkg_qty > budget.pkg_qty,
              )
            }

            return {
              ...budget,
              ordering_seq: 0,
              description: budget.description,
              qty: budget.qty,
              unit: budget.unit,
              pkg_qty: budget.pkg_qty,
              pkg_unit: budget.pkg_unit,
              total_expenses: Number(budget.qty) * Number(budget.pkg_qty) * Number(budget.unit_cost_value),
              unit_cost: `IDR_${Number(budget.unit_cost_value)}`,
              unit_cost_value: Number(budget.unit_cost_value),
              additional_data:
                budget.vendor_category_information.name === 'Overseas Perdiem' ||
                budget.vendor_category_information.name === 'Normal Perdiem' ||
                budget.vendor_category_information.name === 'Remote Area Perdiem'
                  ? ({
                      static_data: perdiemStatic,
                      apf: apfTotal,
                      traveller_perdiem_tax: Number(travellerPerdiemTax),
                      tax_benchmark: taxBenchmark,
                    } as unknown as any)
                  : budget.vendor_category_information.name === 'Transportation'
                  ? ({
                      total_expenses_real: Number(budget.total_expenses),
                      total_requested_from_tr: calculatePureTotalBudget(
                        activity.budgets?.filter(
                          (budget) => budget.vendor_category_information.name === 'Transportation',
                        ),
                      ),
                    } as unknown as any)
                  : budget.vendor_category_information.name === 'Other'
                  ? ({
                      total_expenses_real: otherDataDynamicUpdated.reduce((a, b) => a + Number(b.total_expenses), 0),
                      total_requested_from_tr:
                        Number(requestToExpenseData[budgetIndex].qty) *
                        Number(requestToExpenseData[budgetIndex].pkg_qty) *
                        Number(requestToExpenseData[budgetIndex].unit_cost_value),
                      detail_other: otherDataDynamicUpdated,
                    } as unknown as any)
                  : (null as unknown as any),
              action_by: '',
              advance_payment_total: Number(budget.advance_payment_total || 0),
            }
          }),
      ),
      spending_deadline: null,
      aps_related_pr_id: null,
      aps_result: null as unknown as CreatePaymentRequestApiRequestApsResultEnum,
      travel_end_date_estimation: dateFormatToISO(dayjs(formInput.travel_end_date_estimation).utc().format()),
      created_by: null,
    }

    // const submitValuesResult = {
    //   ...submitValues,
    //   budgets: [...submitValues.budgets, ...otherDataDynamicUpdated],
    // }

    if (isThereStaticPerdiemMoreThanDefaultPerdiem) {
      toast.warning('Please re-check your perdiem', {
        autoClose: 10000,
      })
      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
      return false
    }

    if (advancePerdiemFeeCalculation > totalBudgetTraveller / 2) {
      toast.warning('Budget calculation exceeds limit', {
        autoClose: 10000,
      })
      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
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
      totalTravelExpenses + paidTotal >
      totalFundReceived
    ) {
      toast.error(
        `Sorry, the travel expenses cannot be submitted due to the total of this request (${formatCurrency(
          'IDR',
          totalTravelExpenses,
        )}) + total payment (${formatCurrency(
          'IDR',
          paidTotal,
        )}) are more than this project’s fund received (${formatCurrency('IDR', totalFundReceived)}).`,
        {
          icon: <AlertTriangleIcon className="h-5 w-5 stroke-error-500" />,
          autoClose: 5000,
        },
      )
      setLoadingButtonStatement((prev) => ({
        ...prev,
        submitTravelExpense: false,
      }))
      return false
    }

    // console.log('submitValues', submitValues)
    // setLoadingButtonStatement((prev) => ({
    //   ...prev,
    //   submitTravelExpense: false,
    // }))
    // return false

    // If update action
    if (router.query.edit) {
      const submitPaymentRequest = paymentRequestApi.pRControllerUpdatePaymentRequest(
        router.query.edit as unknown as string,
        submitValues as unknown as any,
      )
      toast.promise(submitPaymentRequest, {
        pending: 'Updating travel expense',
        success: 'Travel expense updated 🎉',
        error: 'Promise rejected 🤯',
      })

      submitPaymentRequest.then((success) => {
        router.replace(`/dashboard/finance/travel-expenses/${success.data.data}`)
        removeCookie('budget_needs_to_payment_request')
        removeCookie('project_to_payment_request')
        removeCookie('payment_request_type')
      })
    } else {
      const submitTravelExpenses = paymentRequestApi.pRControllerCreatePaymentRequest(submitValues as unknown as any)

      toast.promise(submitTravelExpenses, {
        pending: 'Creating travel expenses',
        success: 'Travel expenses created 🎉',
        error: 'Promise rejected 🤯',
      })

      submitTravelExpenses.then((success) => {
        router.replace(`/dashboard/finance/travel-expenses/${success.data.data}`)
        setLoadingButtonStatement((prev) => ({
          ...prev,
          submitTravelExpense: false,
        }))
        removeCookie('budget_needs_to_payment_request')
        removeCookie('project_to_payment_request')
        removeCookie('payment_request_type')
      })
    }
  }

  const errorAdvanceSubmitPerdiemFee = async (error: FieldErrors<CreateTravelExpenseType>) => {
    if (
      error?.additional_attachments?.eventReport ||
      error?.additional_attachments?.invitation ||
      error?.additional_attachments?.letterAssignment ||
      error?.additional_attachments?.tor
    ) {
      openAttachmentDrawer()
    }
  }

  const deleteEticketFile = async (filename: string) => {
    setValue('additional_attachments.eticket', undefined)
    setDocumentsPath((prev) => {
      prev['eticket'] = prev['eticket'].filter((path) => !path.includes(filename))
      return prev
    })
    setEticket((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteBoardingPassFile = async (filename: string) => {
    setValue('additional_attachments.boardingPass', undefined)
    setDocumentsPath((prev) => {
      prev['boarding_pass'] = prev['boarding_pass'].filter((path) => !path.includes(filename))
      return prev
    })
    setBoardingPass((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteTransportExpensesFile = async (filename: string) => {
    setValue('additional_attachments.transportExpensesReceipt', undefined)
    setDocumentsPath((prev) => {
      prev['transport_expenses_receipt'] = prev['transport_expenses_receipt'].filter((path) => !path.includes(filename))
      return prev
    })
    setTransportExpenses((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteOtherTransportReceiptFile = async (filename: string) => {
    setValue('additional_attachments.transportOthersReceipt', undefined)
    setDocumentsPath((prev) => {
      prev['other_expenses_receipt'] = prev['other_expenses_receipt'].filter((path) => !path.includes(filename))
      return prev
    })
    setOtherExpenses((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteInvitationFile = async (filename: string) => {
    setValue('additional_attachments.invitation', undefined)
    setDocumentsPath((prev) => {
      prev['invitation'] = prev['invitation'].filter((path) => !path.includes(filename))
      return prev
    })
    setInvitation((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteTorFile = async (filename: string) => {
    setValue('additional_attachments.tor', undefined)
    setDocumentsPath((prev) => {
      prev['tor'] = prev['tor'].filter((path) => !path.includes(filename))
      return prev
    })
    setTor((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteAssignmentLetterFile = async (filename: string) => {
    setValue('additional_attachments.letterAssignment', undefined)
    setDocumentsPath((prev) => {
      prev['assignment_letter'] = prev['assignment_letter'].filter((path) => !path.includes(filename))
      return prev
    })
    setAssignmentLetter((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteEventReportFile = async (filename: string) => {
    setValue('additional_attachments.eventReport', undefined)
    setDocumentsPath((prev) => {
      prev['event_report'] = prev['event_report'].filter((path) => !path.includes(filename))
      return prev
    })
    setEventReport((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    const modifiedActivityBudgetProvider = budgetsFromProcurementsToPaymentRequest?.map((activity) => {
      return {
        ...activity,
        budgets: activity.budgets?.map((budget) => {
          return {
            ...budget,
            total_expenses: '',
            recommended_vendor: '',
          }
        }),
      }
    })

    // const perdiemStaticData = [...perdiemStatic]

    modifiedActivityBudgetProvider?.map((activity, activityIndex) =>
      activity.budgets?.map((budget, index) => {
        setValue(`activities.${activityIndex}.budgets.${index}.id`, budget.id)
        setValue(`activities.${activityIndex}.budgets.${index}.ordering_seq`, budget.ordering_seq)
        setValue(`activities.${activityIndex}.budgets.${index}.code`, budget.code)
        setValue(`activities.${activityIndex}.budgets.${index}.vendor_category_id`, budget.vendor_category_id)
        setValue(`budgets.${index}.vendor_category_id`, budget.vendor_category_information.id)
        setValue(
          `activities.${activityIndex}.budgets.${index}.vendor_category_information.name`,
          budget.vendor_category_information.name,
        )
        setValue(
          `activities.${activityIndex}.budgets.${index}.vendor_category_information.action_by`,
          budget.vendor_category_information.action_by,
        )
        setValue(`activities.${activityIndex}.budgets.${index}.description`, budget.description)
        setValue(`activities.${activityIndex}.budgets.${index}.qty`, budget.qty)
        setValue(`activities.${activityIndex}.budgets.${index}.unit`, budget.unit)
        setValue(`activities.${activityIndex}.budgets.${index}.pkg_unit`, budget.pkg_unit)
        setValue(`activities.${activityIndex}.budgets.${index}.pkg_qty`, budget.pkg_qty)
        setValue(`activities.${activityIndex}.budgets.${index}.unit_cost_value`, budget.unit_cost_value)
        setValue(
          `activities.${activityIndex}.budgets.${index}.total_expenses`,
          budget.qty * budget.pkg_qty * budget.unit_cost_value,
        )
        setValue(`activities.${activityIndex}.budgets.${index}.advance_payment_total`, budget.advance_payment_total)

        setPerdiemStatic((prev) => {
          return prev.map((perdiem, index) => {
            switch (index) {
              case 0:
                perdiem.tax = -perdiemSettingData?.travel_expense_percentages?.breakfast
                break
              case 1:
                perdiem.tax = -perdiemSettingData?.travel_expense_percentages?.lunch
                break
              case 2:
                perdiem.tax = -perdiemSettingData?.travel_expense_percentages?.dinner
                break
              case 3:
                perdiem.tax = -perdiemSettingData?.travel_expense_percentages?.non_overnight
                break

              default:
                break
            }

            perdiem.total = Math.round(budget.qty * perdiem.pkg_qty * budget.unit_cost_value * (perdiem.tax / 100))

            return perdiem
          })
        })
      }),
    )
  }, [budgetsFromProcurementsToPaymentRequest, perdiemSettingData])

  useEffect(() => {
    if (perdiemSettingData?.travel_expense_percentages.non_overnight) {
      setTaxBenchmark(perdiemSettingData?.travel_expense_percentages.non_overnight)
    }
  }, [perdiemSettingData?.travel_expense_percentages.non_overnight])

  useEffect(() => {
    const subscription = watch((value) => {
      const travelExpense = value.activities?.map((activity) => activity.budgets).flatMap((budget) => budget) || []

      // TRANSPORTATION
      const totalsTransportation = travelExpense.map((item) => {
        let total = 0
        let id = ''

        if (item?.vendor_category_information?.name === 'Transportation') {
          total = Number(item.total_expenses)
          id = item.id
        }
        return {
          total,
          id,
        }
      })

      setTransportationTECalculation(totalsTransportation)

      // OTHER
      const totalsOther = travelExpense.map((item) => {
        let total = 0
        let id = ''

        if (item?.vendor_category_information?.name === 'Other') {
          total = Number(item.unit_cost_value) * Number(item.pkg_qty) * Number(item.qty)
          id = item.id
        }
        return {
          total,
          id,
        }
      })
      setOtherTECalculation(totalsOther)
    })

    return () => subscription.unsubscribe()
  }, [watch, perdiemStatic, apfTotal, budgetsFromProcurementsToPaymentRequest, detailApf])

  useEffect(() => {
    // SPECIAL FOR PERDIEM
    const travelExpense =
      getValues()
        .activities?.map((activity) => activity.budgets)
        .flatMap((budget) => budget) || []

    const totalsPerdiem = travelExpense.map((item) => {
      let total = 0
      let id = ''

      if (
        item.vendor_category_information.name === 'Overseas Perdiem' ||
        item.vendor_category_information.name === 'Normal Perdiem' ||
        item.vendor_category_information.name === 'Remote Area Perdiem'
      ) {
        const perdiemData = budgetsFromProcurementsToPaymentRequest
          ?.map((item) =>
            item.budgets.find(
              (budget) =>
                budget.vendor_category_information.name === 'Overseas Perdiem' ||
                budget.vendor_category_information.name === 'Normal Perdiem' ||
                budget.vendor_category_information.name === 'Remote Area Perdiem',
            ),
          )
          .filter(Boolean)

        const perdiemTotal = perdiemData[0]?.qty * item.pkg_qty * perdiemData[0]?.unit_cost_value

        if (taxBenchmark === 0) return { total, id }

        const taxInput = () => {
          if (Math.abs(perdiemStatic[3].tax) === Math.abs(taxBenchmark)) {
            return (
              perdiemData[0]?.qty *
              perdiemData[0]?.unit_cost_value *
              (Number(item.pkg_qty || 0) - perdiemStatic[3].pkg_qty) *
              (travellerPerdiemTax / 100)
            )
          } else {
            return (
              perdiemData[0]?.qty *
              perdiemData[0]?.unit_cost_value *
              Number(item.pkg_qty || 0) *
              (travellerPerdiemTax / 100)
            )
          }
        }

        const apf = apfTotal
        const thp = perdiemTotal + perdiemStatic.reduce((a, b) => a + b.total, 0) || 0

        total = thp - (taxInput() + apf)

        id = item.id
      }

      return {
        total,
        id,
      }
    })

    // console.log('totalsPerdiem', totalsPerdiem)

    setPerdiemTECalculation(totalsPerdiem)
  }, [
    perdiemStatic,
    getValues,
    apfTotal,
    budgetsFromProcurementsToPaymentRequest,
    detailApf,
    taxBenchmark,
    travellerPerdiemTax,
  ])

  useEffect(() => {
    // TRANSPORTATION
    const transportationResult = budgetsFromProcurementsToPaymentRequest?.map((resource) => {
      return resource.budgets.map((budget) => {
        if (budget.vendor_category_information.name === 'Transportation') {
          const anchor = transportationTECalculation.find((anchor) => anchor.id === budget.id)
          return anchor ? anchor.total : 0
        }
      })
    })
    setTransportationTECalculationFinal(transportationResult)
  }, [transportationTECalculation, otherTECalculation, perdiemTECalculation])

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
    if (userLoggedinInformation) {
      mutate(userLoggedinInformation.employee_id)
    }
  }, [userLoggedinInformation])

  // =============== UPDATE PAYMENT ===============
  useEffect(() => {
    if (!paymentDetailData || !router.query.edit || budgetsFromProcurementsToPaymentRequest?.length === 0) return

    if (router.query.edit) {
      const existingAttachmentsLocal = JSON.parse(paymentDetailData.attachments as unknown as string)
      setExistingAttachments(existingAttachmentsLocal)
      setValue('description', paymentDetailData.description)

      // Travel Date End
      const travelEndDate = new Date(paymentDetailData.travel_end_date_estimation)
      setValue('travel_end_date_estimation', travelEndDate as unknown as string)
      setSpendingDeadlinePayment(travelEndDate)

      // Estimated Payment Date
      const expectedPaymentDate = new Date(paymentDetailData.expected_payment_date)
      setValue('expected_payment_date', expectedPaymentDate as unknown as string)
      setPaymentDate(expectedPaymentDate)

      // Re assign static perdiem
      const perdiemStaticData = paymentDetailData.projects.flatMap((project) =>
        project.activities.flatMap((activity) =>
          activity.budgets.find((budget) => budget.additional_data['static_data']),
        ),
      )[0]['additional_data']?.['static_data']
      setPerdiemStatic(perdiemStaticData)

      // Reassign budget items
      paymentDetailData.projects.map((project) =>
        project.activities.map((activity) =>
          activity.budgets.map((budget) => {
            budgetsFromProcurementsToPaymentRequest.map((innerActivity, innerActivityIndex) => {
              innerActivity.budgets.map((innerBudget, innerBudgetIndex) => {
                if (budget.id === innerBudget.id) {
                  setValue(
                    `activities.${innerActivityIndex}.budgets.${innerBudgetIndex}.total_expenses`,
                    budget.additional_data['total_expenses_real'],
                  )
                }
              })
            })
          }),
        ),
      )

      paymentDetailData.projects.map((project) =>
        project.activities.map((activity) =>
          activity.budgets.map((budget) => {
            if (budget.vendor_category_information.name === 'Other') {
              setOtherDataDynamic([budget.additional_data?.['detail_other']])
            }
          }),
        ),
      )

      // Switch toggle button and set value
      const eticketAsset = existingAttachmentsLocal.find((item) => item.key === 'eticket')
        ?.file_path as unknown as string
      if (isValidUrl(eticketAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          eticket_upload: true,
        }))
        setValue('additional_attachments.eticket', eticketAsset as unknown as string[])
      }
      const boardingPassAsset = existingAttachmentsLocal.find((item) => item.key === 'boarding_pass')
        ?.file_path as unknown as string
      if (isValidUrl(boardingPassAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          boarding_pass_upload: true,
        }))
        setValue('additional_attachments.boardingPass', boardingPassAsset as unknown as string[])
      }
      const transportExpensesReceiptAsset = existingAttachmentsLocal.find(
        (item) => item.key === 'transport_expenses_receipt',
      )?.file_path as unknown as string
      if (isValidUrl(transportExpensesReceiptAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          bundling_transport_expense_upload: true,
        }))
        setValue(
          'additional_attachments.transportExpensesReceipt',
          transportExpensesReceiptAsset as unknown as string[],
        )
      }
      const transportOthersReceiptAsset = existingAttachmentsLocal.find((item) => item.key === 'other_expenses_receipt')
        ?.file_path as unknown as string
      if (isValidUrl(transportOthersReceiptAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          bundling_others_expense_upload: true,
        }))
        setValue('additional_attachments.transportOthersReceipt', transportOthersReceiptAsset as unknown as string[])
      }
      const invitationAsset = existingAttachmentsLocal.find((item) => item.key === 'invitation')
        ?.file_path as unknown as string
      if (isValidUrl(invitationAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          invitation_upload: true,
        }))
        setValue('additional_attachments.invitation', invitationAsset as unknown as string[])
      }
      const torAsset = existingAttachmentsLocal.find((item) => item.key === 'tor')?.file_path as unknown as string
      if (isValidUrl(torAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          tor_upload: true,
        }))
        setValue('additional_attachments.tor', torAsset as unknown as string[])
      }
      const assignmentLetterAsset = existingAttachmentsLocal.find((item) => item.key === 'assignment_letter')
        ?.file_path as unknown as string
      if (isValidUrl(assignmentLetterAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          assignment_letter_upload: true,
        }))
        setValue('additional_attachments.letterAssignment', assignmentLetterAsset as unknown as string[])
      }
      const eventTargetAsset = existingAttachmentsLocal.find((item) => item.key === 'event_report')
        ?.file_path as unknown as string
      if (isValidUrl(eventTargetAsset)) {
        setSwitchTogglableButton((prev) => ({
          ...prev,
          event_report_upload: true,
        }))
        setValue('additional_attachments.eventReport', eventTargetAsset as unknown as string[])
      }
    }
  }, [paymentDetailData, router.query.edit, budgetsFromProcurementsToPaymentRequest])

  useEffect(() => {
    if (router.query.edit) {
      paymentDetailTrigger()
    }
  }, [router.query.edit])

  useEffect(() => {
    const exec = async () => {
      const getListAPFResult = await paymentRequestApi.pRControllerGetListPaymentRequest(
        programId,
        rfId,
        PRTypes.APF,
        undefined,
        undefined,
      )

      const getAPFList = getListAPFResult.data.data

      const apfId = getAPFList[0]?.id

      if (apfId) {
        const detailApf = await paymentRequestApi.pRControllerGetDetailPaymentRequest(apfId)
        const detailAPFResult = detailApf.data.data
        setApfTotal(detailAPFResult.projects[0].activities[0].budgets[0].advance_payment_total)
        setDetailApf(detailAPFResult)
      } else {
        setDetailApf(null)
      }
    }
    exec()

    const clearInitialTO = setTimeout(() => {
      setRenderForm(true)
    }, 2000)

    perdiemSettingTrigger()

    return () => {
      clearTimeout(clearInitialTO)
    }
  }, [])

  if (!renderForm || !budgetNeeds || paymentDetailIsMutating) {
    return (
      <div className="flex h-[calc(100vh-76px)] w-full items-center justify-center">
        <Loader customText="Loading travel expense form..." />
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(submitTravelExpenses, errorAdvanceSubmitPerdiemFee)}>
        <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">Submit Travel Expenses Form</h1>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="inline-flex gap-3">
              <Button type="button" btnType="normal" size="sm" variant="secondary-gray" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                btnType="normal"
                size="sm"
                variant="primary"
                isLoading={loadingButtonStatement.submitTravelExpense}
              >
                Submit Form
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
                <p className="mb-2 text-xs font-bold text-gray-500">Advance Perdiem Fee</p>
                {detailApf ? (
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold uppercase text-gray-900">
                      {detailApf?.number.replace(/\s/g, '')}
                    </p>
                    <Link href={`/dashboard/finance/advance-perdiem-fee/${detailApf?.id}`}>
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
                <label htmlFor="travel_end_date_estimation" className="mb-2 block text-xs font-bold text-gray-500">
                  Travel Date End
                </label>
                <Controller
                  control={control}
                  name="travel_end_date_estimation"
                  rules={{
                    required: 'Travel date end is required field',
                  }}
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <DatePickerCalendar
                        isUsingCustomHeader={true}
                        typeYears="future"
                        id="travel_end_date_estimation"
                        size="sm"
                        dateFormat="eee, dd MMM yyyy"
                        selected={spendingDeadlinePayment}
                        onChange={(date: Date) => {
                          setSpendingDeadlinePayment(date)
                          onChange(date)
                        }}
                        error={invalid}
                      />
                      {errors.travel_end_date_estimation && (
                        <span className="input-hint-text error">{errors.travel_end_date_estimation?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label htmlFor="deadline" className="mb-2 block text-xs font-bold text-gray-500">
                  Estimated Payment Date
                </label>
                <Controller
                  control={control}
                  name="expected_payment_date"
                  rules={{
                    required: 'Estimated payment date date is required field',
                  }}
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
                  onClick={openAttachmentDrawer}
                >
                  Additional Attachment for Payment Request
                </Button>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold text-gray-500">Requester Bank Information</p>
                <Button
                  type="button"
                  btnType="normal"
                  size="sm"
                  variant="secondary-gray"
                  className="inline-flex w-full justify-center gap-2"
                  onClick={openBankInformationDrawer}
                >
                  <FileSearch02Icon className="h-5 w-5 stroke-white" />
                  View Requester Bank Information
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5 border-b border-b-gray-200 py-6">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Total Travel Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(
                  'IDR',
                  // Perdiem Total Requested
                  perdiemTECalculation.reduce((accumulator, currentValue) => accumulator + currentValue.total, 0) +
                    // Transportation Total Requested
                    transportationTECalculation.reduce(
                      (accumulator, currentValue) => accumulator + currentValue.total,
                      0,
                    ) +
                    // Other Total Requested (Dynamic)
                    otherDataDynamic
                      .flatMap((item) => item)
                      .flatMap((item) => Number(item.qty) * Number(item.pkg_qty) * Number(item.unit_cost))
                      .reduce((accumulator, currentValue) => accumulator + currentValue, 0) || 0,
                )}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Perdiem</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(
                  'IDR',
                  perdiemTECalculation.reduce((accumulator, currentValue) => accumulator + currentValue.total, 0),
                )}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Transport</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(
                  'IDR',
                  transportationTECalculation.reduce(
                    (accumulator, currentValue) => accumulator + currentValue.total,
                    0,
                  ),
                )}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Others</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(
                  'IDR',
                  otherDataDynamic
                    .flatMap((item) => item)
                    .flatMap((item) => Number(item.qty) * Number(item.pkg_qty) * Number(item.unit_cost))
                    .reduce((accumulator, currentValue) => accumulator + currentValue, 0) || 0,
                )}
              </p>
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

          <div className="mt-5 flex w-full flex-col">
            {budgetsFromProcurementsToPaymentRequest?.map((activity, activityIndex) => {
              if (
                activity.budgets
                  .map((budget) => budget.vendor_category_information.action_by)
                  .includes('ACTION_BY_TRAVELLER')
              ) {
                return (
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
                      {activity.budgets?.map((budget, budgetIndex) => (
                        <Fragment key={budgetIndex}>
                          {budget.vendor_category_information.action_by === 'ACTION_BY_TRAVELLER' ? (
                            <div
                              key={`perdiem_${budgetIndex}`}
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
                                          Number(budget.qty || 0) *
                                            Number(
                                              watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) || 0,
                                            ) *
                                            budget.unit_cost_value +
                                            perdiemStatic.reduce((a, b) => a + b.total, 0),
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">
                                        Pajak (
                                        {Math.abs(perdiemStatic[3].tax) === Math.abs(taxBenchmark)
                                          ? 'Menginap'
                                          : 'Perjalanan'}
                                        ) - {travellerPerdiemTax}%
                                      </p>
                                      {/* TRACKING LOG FOR TESTING DEV */}
                                      {/* <p className="text-primary-500">
                                          Perdiem static{' '}
                                          {Math.abs(perdiemStatic[3].tax)}
                                        </p>
                                        <p className="mb-3 text-primary-500">
                                          Tax Benchmarking{' '}
                                          {Math.abs(taxBenchmark)}
                                        </p>
                                        <p className="text-blue-light-700">
                                          {Number(
                                            watch(
                                              `activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                            ) || 0,
                                          )}
                                        </p>
                                        <p className="text-blue-light-700">
                                          {perdiemStatic[3].pkg_qty}
                                        </p>
                                        <p className="text-pink-500">
                                          {Math.abs(perdiemStatic[3].tax) ===
                                          Math.abs(taxBenchmark)
                                            ? 'Jumlah malam tidak menginap'
                                            : 'Jumlah hari perjalanan'}
                                        </p>

                                        {Math.abs(perdiemStatic[3].tax) ===
                                        Math.abs(taxBenchmark) ? (
                                          <p className="text-error-600">
                                            {budget.unit_cost_value} * (
                                            {Number(
                                              watch(
                                                `activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                              ) || 0,
                                            ) - perdiemStatic[3].pkg_qty}
                                            ) * {travellerPerdiemTax / 100}
                                          </p>
                                        ) : (
                                          <p className="text-blue-500">
                                            {budget.unit_cost_value} * (
                                            {Number(
                                              watch(
                                                `activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`,
                                              ) || 0,
                                            )}
                                            ) * {travellerPerdiemTax / 100}
                                          </p>
                                        )} */}

                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {Math.abs(perdiemStatic[3].tax) === Math.abs(taxBenchmark) ? (
                                          <>
                                            {formatCurrency(
                                              'IDR',
                                              budget.qty *
                                                budget.unit_cost_value *
                                                (Number(
                                                  watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) ||
                                                    0,
                                                ) -
                                                  perdiemStatic[3].pkg_qty) *
                                                (travellerPerdiemTax / 100),
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            {formatCurrency(
                                              'IDR',
                                              budget.qty *
                                                budget.unit_cost_value *
                                                Number(
                                                  watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) ||
                                                    0,
                                                ) *
                                                (travellerPerdiemTax / 100),
                                            )}
                                          </>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Advance Perdiem Fee</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency('IDR', apfTotal)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Terima Bersih</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          // THP
                                          Number(budget.qty || 0) *
                                            Number(
                                              watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) || 0,
                                            ) *
                                            budget.unit_cost_value +
                                            perdiemStatic.reduce((a, b) => a + b.total, 0) -
                                            // Tax
                                            (Math.abs(perdiemStatic[3].tax) === Math.abs(taxBenchmark)
                                              ? budget.qty *
                                                budget.unit_cost_value *
                                                (Number(
                                                  watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) ||
                                                    0,
                                                ) -
                                                  perdiemStatic[3].pkg_qty) *
                                                (travellerPerdiemTax / 100)
                                              : budget.qty *
                                                budget.unit_cost_value *
                                                Number(
                                                  watch(`activities.${activityIndex}.budgets.${budgetIndex}.pkg_qty`) ||
                                                    0,
                                                ) *
                                                (travellerPerdiemTax / 100)) -
                                            apfTotal,
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
                                            activity.budgets?.filter(
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
                                          transportationTECalculationFinal?.[activityIndex]
                                            ?.filter((num) => num !== undefined)
                                            .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
                                        )}
                                      </p>
                                    </div>
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
                                          calculatePureTotalBudget(
                                            activity.budgets?.filter(
                                              (budget) =>
                                                budget.vendor_category_information.name.toLowerCase() === 'other',
                                            ),
                                          ),
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="mb-2 text-xs font-bold text-gray-500">Total Others Expenses</p>
                                      <p className="text-lg font-semibold capitalize text-gray-900">
                                        {formatCurrency(
                                          'IDR',
                                          otherDataDynamic?.[activityIndex]
                                            ?.flatMap(
                                              (item) =>
                                                Number(item.qty) * Number(item.pkg_qty) * Number(item.unit_cost),
                                            )
                                            .reduce((accumulator, currentValue) => accumulator + currentValue, 0) || 0,
                                        )}
                                      </p>
                                    </div>
                                  </>
                                ) : null}
                              </div>

                              {/* Special For perdiem */}
                              {budget.vendor_category_information.name === 'Overseas Perdiem' ||
                              budget.vendor_category_information.name === 'Normal Perdiem' ||
                              budget.vendor_category_information.name === 'Remote Area Perdiem' ? (
                                <div className="overflow-x-auto border-b border-b-gray-200 py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                                  {activity.budgets?.length > 0 && (
                                    <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                                      <div className="border-y border-y-gray-200 bg-gray-50">
                                        <div className="flex items-center">
                                          <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">
                                            No
                                          </div>
                                          <div className="w-80 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Description
                                          </div>
                                          <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Qty
                                          </div>
                                          <div className="w-32 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Unit
                                          </div>
                                          <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Pckg Qty
                                          </div>
                                          <div className="w-32 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Pckg Unit
                                          </div>
                                          <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Unit Cost (Perdiem)
                                          </div>
                                          <div className="w-20 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            %
                                          </div>
                                          <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Total
                                          </div>
                                        </div>
                                      </div>
                                      <div className="divide-y divide-gray-200 text-sm">
                                        <>
                                          {activity.budgets?.map((budgetPerdiem, budgetPerdiemIndex) => (
                                            <Fragment key={`perdiem_${budgetPerdiem.code}`}>
                                              {budgetPerdiem.vendor_category_information.action_by ===
                                                'ACTION_BY_TRAVELLER' &&
                                              budget.vendor_category_information.name ===
                                                budgetPerdiem.vendor_category_information.name ? (
                                                <div className="flex items-center">
                                                  <div className="w-32 p-4 pl-6">
                                                    {budgetPerdiem.code.replace(/\.(\d+)$/, '-$1')}
                                                  </div>
                                                  <div className="w-80 p-4">{budgetPerdiem.description}</div>
                                                  <div className="w-24 px-4 py-2.5">{budgetPerdiem.qty}</div>
                                                  <div className="w-32 p-4 lowercase">{budgetPerdiem.unit}</div>
                                                  <div className="w-24 px-4 py-2.5">
                                                    <Controller
                                                      control={control}
                                                      rules={{
                                                        required: 'Pckg Qty is required field',
                                                        max: {
                                                          value: budgetPerdiem.pkg_qty,
                                                          message: `Pckg Qty must be less than or equal to ${budgetPerdiem.pkg_qty}`,
                                                        },
                                                        min: {
                                                          value: 1,
                                                          message: 'Pckg Qty must be greater than or equal to 0',
                                                        },
                                                      }}
                                                      name={`activities.${activityIndex}.budgets.${budgetPerdiemIndex}.pkg_qty`}
                                                      render={({
                                                        field: { onChange, value },
                                                        fieldState: { invalid },
                                                      }) => (
                                                        <>
                                                          <Input
                                                            type="number"
                                                            value={value || ''}
                                                            placeholder="Qty"
                                                            onChange={onChange}
                                                            size="sm"
                                                            error={invalid}
                                                          />
                                                          {errors.activities?.[activityIndex].budgets?.[
                                                            budgetPerdiemIndex
                                                          ]?.pkg_qty && (
                                                            <span className="input-hint-text error">
                                                              {
                                                                errors.activities?.[activityIndex].budgets?.[
                                                                  budgetPerdiemIndex
                                                                ]?.pkg_qty?.message
                                                              }
                                                            </span>
                                                          )}
                                                        </>
                                                      )}
                                                    />
                                                  </div>
                                                  <div className="w-32 p-4 lowercase">{budgetPerdiem.pkg_unit}</div>
                                                  <div className="w-48 px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p className="text-gray-500">Rp</p>
                                                      <p>
                                                        {formatCurrency('IDR', budgetPerdiem.unit_cost_value, true)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  <div className="w-20 px-4 py-2.5">100%</div>
                                                  <div className="w-48 p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p>Rp</p>
                                                      <p>
                                                        {formatCurrency(
                                                          'IDR',
                                                          Number(budgetPerdiem.qty || 0) *
                                                            Number(
                                                              watch(
                                                                `activities.${activityIndex}.budgets.${budgetPerdiemIndex}.pkg_qty`,
                                                              ) || 0,
                                                            ) *
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
                                        </>
                                        {perdiemStatic.map((staticData, staticDataIndex) => {
                                          if (staticDataIndex === perdiemStatic.length - 1) {
                                            return (
                                              // SPECIAL FOR THE LAST ONE, BECAUSE THERE A SELECT OPTION INSIDE
                                              <div
                                                className="flex items-center"
                                                key={`perdiem_static_${staticDataIndex}`}
                                              >
                                                <div className="w-32 p-4 pl-6">-</div>
                                                <div className="w-80 p-4">
                                                  <ComboboxRadix
                                                    widthControllerStyles="w-[17rem]"
                                                    value={staticData.description}
                                                    placeholder="Optional perdiem"
                                                    listData={[
                                                      {
                                                        id: slugify('Jumlah malam tidak menginap'),
                                                        name: 'Jumlah malam tidak menginap',
                                                      },
                                                      {
                                                        id: slugify('Jumlah hari perjalanan'),
                                                        name: 'Jumlah hari perjalanan',
                                                      },
                                                    ]}
                                                    handleChange={(perdiem) =>
                                                      handleDynamicPerdiemCalculation(
                                                        staticDataIndex,
                                                        budget.qty,
                                                        budget.unit_cost_value,
                                                        perdiem,
                                                      )
                                                    }
                                                  />
                                                </div>
                                                <div className="w-24 px-4 py-2.5">
                                                  {detailApf
                                                    ? detailApf.projects[0].activities[0].budgets[0].qty
                                                    : budget.qty}
                                                </div>
                                                <div className="w-32 p-4 lowercase">
                                                  {detailApf
                                                    ? detailApf.projects[0].activities[0].budgets[0].unit
                                                    : budget.unit}
                                                </div>
                                                <div className="w-24 px-4 py-2.5">
                                                  <Input
                                                    type="number"
                                                    value={staticData.pkg_qty || undefined}
                                                    placeholder="Qty"
                                                    onChange={handleInputQtyStaticData(
                                                      staticDataIndex,
                                                      budget.qty,
                                                      budget.unit_cost_value,
                                                      staticData.tax / 100,
                                                      budget.pkg_qty,
                                                    )}
                                                    size="sm"
                                                  />
                                                  <span
                                                    id={`perdiem_static_text_${staticDataIndex}`}
                                                    className="input-hint-text-content error"
                                                  ></span>
                                                </div>
                                                <div className="w-32 p-4 lowercase">{budget.pkg_unit}</div>
                                                <div className="w-48 px-4 py-2.5">
                                                  <div className="flex items-center justify-between gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <p>{formatCurrency('IDR', budget.unit_cost_value, true)}</p>
                                                  </div>
                                                </div>
                                                <div className="w-20 px-4 py-2.5">{staticData.tax}%</div>
                                                <div className="w-48 p-4">
                                                  <div className="flex items-center justify-between gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <p>{formatCurrency('IDR', staticData.total, true)}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          } else {
                                            return (
                                              <div
                                                className="flex items-center"
                                                key={`perdiem_static_${staticDataIndex}`}
                                              >
                                                <div className="w-32 p-4 pl-6">-</div>
                                                <div className="w-80 p-4">{staticData.description}</div>
                                                <div className="w-24 px-4 py-2.5">
                                                  {detailApf
                                                    ? detailApf.projects[0].activities[0].budgets[0].qty
                                                    : budget.qty}
                                                </div>
                                                <div className="w-32 p-4 lowercase">
                                                  {detailApf
                                                    ? detailApf.projects[0].activities[0].budgets[0].unit
                                                    : budget.unit}
                                                </div>
                                                <div className="w-24 px-4 py-2.5">
                                                  <Input
                                                    type="number"
                                                    value={staticData.pkg_qty || undefined}
                                                    placeholder="Qty"
                                                    onChange={handleInputQtyStaticData(
                                                      staticDataIndex,
                                                      budget.qty,
                                                      budget.unit_cost_value,
                                                      staticData.tax / 100,
                                                      budget.pkg_qty,
                                                    )}
                                                    size="sm"
                                                  />
                                                  <span
                                                    id={`perdiem_static_text_${staticDataIndex}`}
                                                    className="input-hint-text-content error"
                                                  ></span>
                                                </div>
                                                <div className="w-32 p-4 lowercase">{budget.pkg_unit}</div>
                                                <div className="w-48 px-4 py-2.5">
                                                  <div className="flex items-center justify-between gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <p>{formatCurrency('IDR', budget.unit_cost_value, true)}</p>
                                                  </div>
                                                </div>
                                                <div className="w-20 px-4 py-2.5">{staticData.tax}%</div>
                                                <div className="w-48 p-4">
                                                  <div className="flex items-center justify-between gap-3">
                                                    <p className="text-gray-500">Rp</p>
                                                    <p>{formatCurrency('IDR', staticData.total, true)}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          }
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              {/* Special For Transportation */}
                              {budget.vendor_category_information.name.toLowerCase() === 'transportation' ? (
                                <div className="overflow-x-auto border-b border-b-gray-200 py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                                  {activity.budgets?.length > 0 && (
                                    <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                                      <div className="border-y border-y-gray-200 bg-gray-50">
                                        <div className="flex items-center">
                                          <div className="w-32 px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">
                                            No
                                          </div>
                                          <div className="w-80 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Description
                                          </div>
                                          <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Qty
                                          </div>
                                          <div className="w-32 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Unit
                                          </div>
                                          <div className="w-24 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Pckg Qty
                                          </div>
                                          <div className="w-32 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Pckg Unit
                                          </div>
                                          <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Unit Cost
                                          </div>
                                          <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Total Requested
                                          </div>
                                          <div className="w-56 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Total Expenses (Real)
                                          </div>
                                        </div>
                                      </div>
                                      <div className="divide-y divide-gray-200 text-sm">
                                        {activity.budgets?.map((budgetTransportation, budgetTransportationIndex) => (
                                          <Fragment key={`transportation_${budgetTransportation.code}`}>
                                            {budgetTransportation.vendor_category_information.action_by ===
                                              'ACTION_BY_TRAVELLER' &&
                                            budget.vendor_category_information.name ===
                                              budgetTransportation.vendor_category_information.name ? (
                                              <div className="flex items-center">
                                                <div className="w-32 p-4 pl-6">
                                                  {budgetTransportation.code.replace(/\.(\d+)$/, '-$1')}
                                                </div>
                                                <div className="w-80 p-4">{budgetTransportation.description}</div>
                                                <div className="w-24 px-4 py-2.5">{budgetTransportation.qty}</div>
                                                <div className="w-32 p-4 lowercase">{budgetTransportation.unit}</div>
                                                <div className="w-24 px-4 py-2.5">{budgetTransportation.pkg_qty}</div>
                                                <div className="w-32 p-4 lowercase">
                                                  {budgetTransportation.pkg_unit}
                                                </div>
                                                <div className="w-48 px-4 py-2.5">
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
                                                <div className="w-48 px-4 py-2.5">
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
                                                    <div>
                                                      <Controller
                                                        control={control}
                                                        name={`activities.${activityIndex}.budgets.${budgetTransportationIndex}.total_expenses`}
                                                        render={({ field: { onChange, value } }) => (
                                                          <>
                                                            <Input
                                                              type="number"
                                                              align="end"
                                                              value={value || ''}
                                                              isCurrency={true}
                                                              inputSelectionInit="IDR"
                                                              onChange={onChange}
                                                              size="sm"
                                                            />
                                                            {errors.activities?.[activityIndex].budgets?.[
                                                              budgetTransportationIndex
                                                            ].total_expenses && (
                                                              <span className="input-hint-text error">
                                                                {
                                                                  errors.activities?.[activityIndex].budgets?.[
                                                                    budgetTransportationIndex
                                                                  ].total_expenses?.message
                                                                }
                                                              </span>
                                                            )}
                                                          </>
                                                        )}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ) : null}
                                          </Fragment>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : null}

                              {/* Special For Other */}
                              {budget.vendor_category_information.name.toLowerCase() === 'other' ? (
                                <div className="overflow-x-auto border-b border-b-gray-200 py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                                  {activity.budgets?.length > 0 && (
                                    <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                                      <div className="border-y border-y-gray-200 bg-gray-50">
                                        <div className="flex items-center">
                                          <div className="w-16 px-4 py-2.5 text-center">
                                            <input type="checkbox" value="parent" className="input-checkbox" disabled />
                                          </div>
                                          <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                                            No
                                          </div>
                                          <div className="w-80 px-2.5 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Description
                                          </div>
                                          <div className="w-24 px-2.5 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Qty
                                          </div>
                                          <div className="w-32 px-2.5 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Unit
                                          </div>
                                          <div className="w-24 px-2.5 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Pckg Qty
                                          </div>
                                          <div className="w-32 px-2.5 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Pckg Unit
                                          </div>
                                          <div className="w-48 px-2.5 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Unit Cost
                                          </div>
                                          <div className="w-48 bg-gray-50 px-2 py-3.5 text-left text-xs font-medium text-gray-600">
                                            Total Expenses
                                          </div>
                                        </div>
                                      </div>
                                      {activity.budgets?.length > 0 ? (
                                        <>
                                          {/* <div className="divide-y divide-gray-200 text-sm">
                                              {activity.budgets?.map(
                                                (
                                                  budgetOther,
                                                  budgetOtherIndex,
                                                ) => (
                                                  <Fragment
                                                    key={`other_${budgetOther.code}`}
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
                                                        <div className="w-16 px-4 py-2.5 text-center">
                                                          <input
                                                            type="checkbox"
                                                            value="parent"
                                                            className="input-checkbox"
                                                            disabled
                                                          />
                                                        </div>
                                                        <div className="w-28 px-4 py-2.5">
                                                          {budgetOther.code.replace(
                                                            /\.(\d+)$/,
                                                            '-$1',
                                                          )}
                                                        </div>
                                                        <div className="w-80 px-4 py-2.5">
                                                          <Controller
                                                            control={control}
                                                            name={`activities.${activityIndex}.budgets.${budgetOtherIndex}.description`}
                                                            render={({
                                                              field: {
                                                                onChange,
                                                                value,
                                                              },
                                                            }) => (
                                                              <TextareaAutosize
                                                                onChange={
                                                                  onChange
                                                                }
                                                                value={
                                                                  value || ''
                                                                }
                                                                placeholder="Projects Description"
                                                                className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                              />
                                                            )}
                                                          />
                                                        </div>
                                                        <div className="w-24 px-4 py-2.5">
                                                          <Controller
                                                            control={control}
                                                            name={`activities.${activityIndex}.budgets.${budgetOtherIndex}.qty`}
                                                            render={({
                                                              field: {
                                                                onChange,
                                                                value,
                                                              },
                                                            }) => (
                                                              <Input
                                                                type="number"
                                                                value={
                                                                  value || ''
                                                                }
                                                                placeholder="Qty"
                                                                onChange={
                                                                  onChange
                                                                }
                                                                size="sm"
                                                              />
                                                            )}
                                                          />
                                                        </div>
                                                        <div className="w-32 px-4 py-2.5 lowercase">
                                                          <Controller
                                                            control={control}
                                                            name={`activities.${activityIndex}.budgets.${budgetOtherIndex}.unit`}
                                                            render={({
                                                              field: {
                                                                onChange,
                                                                value,
                                                              },
                                                            }) => (
                                                              <TextareaAutosize
                                                                onChange={
                                                                  onChange
                                                                }
                                                                value={value}
                                                                placeholder="Unit"
                                                                className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                              />
                                                            )}
                                                          />
                                                        </div>
                                                        <div className="w-24 px-4 py-2.5">
                                                          <Controller
                                                            control={control}
                                                            name={`activities.${activityIndex}.budgets.${budgetOtherIndex}.pkg_qty`}
                                                            render={({
                                                              field: {
                                                                onChange,
                                                                value,
                                                              },
                                                            }) => (
                                                              <Input
                                                                type="number"
                                                                value={
                                                                  value || ''
                                                                }
                                                                placeholder="Qty"
                                                                onChange={
                                                                  onChange
                                                                }
                                                                size="sm"
                                                              />
                                                            )}
                                                          />
                                                        </div>
                                                        <div className="w-32 px-4 py-2.5 lowercase">
                                                          <Controller
                                                            control={control}
                                                            name={`activities.${activityIndex}.budgets.${budgetOtherIndex}.pkg_unit`}
                                                            render={({
                                                              field: {
                                                                onChange,
                                                                value,
                                                              },
                                                            }) => (
                                                              <TextareaAutosize
                                                                onChange={
                                                                  onChange
                                                                }
                                                                value={value}
                                                                placeholder="Unit"
                                                                className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                              />
                                                            )}
                                                          />
                                                        </div>
                                                        <div className="w-48 px-4 py-2.5">
                                                          <div className="flex items-center gap-3">
                                                            <p className="text-gray-500">
                                                              Rp
                                                            </p>
                                                            <div>
                                                              <Controller
                                                                control={
                                                                  control
                                                                }
                                                                name={`activities.${activityIndex}.budgets.${budgetOtherIndex}.unit_cost_value`}
                                                                render={({
                                                                  field: {
                                                                    onChange,
                                                                    value,
                                                                  },
                                                                }) => (
                                                                  <Input
                                                                    size="sm"
                                                                    type="number"
                                                                    align="end"
                                                                    placeholder="0"
                                                                    value={
                                                                      value ||
                                                                      ''
                                                                    }
                                                                    isCurrency={
                                                                      true
                                                                    }
                                                                    inputSelectionInit="IDR"
                                                                    onChange={
                                                                      onChange
                                                                    }
                                                                  />
                                                                )}
                                                              />
                                                            </div>
                                                          </div>
                                                        </div>
                                                        <div className="w-48 px-4 py-2.5">
                                                          <div className="flex items-center justify-between gap-3">
                                                            <p className="text-gray-500">
                                                              Rp
                                                            </p>

                                                            <p>
                                                              {formatCurrency(
                                                                'IDR',
                                                                Number(
                                                                  watch(
                                                                    `activities.${activityIndex}.budgets.${budgetOtherIndex}.qty`,
                                                                  ) || 0,
                                                                ) *
                                                                  Number(
                                                                    watch(
                                                                      `activities.${activityIndex}.budgets.${budgetOtherIndex}.pkg_qty`,
                                                                    ) || 0,
                                                                  ) *
                                                                  Number(
                                                                    watch(
                                                                      `activities.${activityIndex}.budgets.${budgetOtherIndex}.unit_cost_value`,
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
                                                ),
                                              )}
                                            </div> */}
                                          {otherDataDynamic.length && otherDataDynamic?.[activityIndex]?.length ? (
                                            <div className="divide-y divide-gray-200 border-t border-t-gray-200 text-sm">
                                              {otherDataDynamic[activityIndex]?.map((otherData, otherDataIndex) => (
                                                <div key={otherDataIndex} className="flex items-center">
                                                  <div className="w-16 px-4 py-2.5 text-center">
                                                    <input
                                                      type="checkbox"
                                                      className="input-checkbox"
                                                      checked={otherData.is_checked}
                                                      onChange={() =>
                                                        updateOtherEntry(
                                                          activity.budgets?.find(
                                                            (budget) =>
                                                              budget.vendor_category_information.name === 'Other',
                                                          ).vendor_category_id,
                                                          activityIndex,
                                                          otherDataIndex,
                                                          {
                                                            target: {
                                                              name: 'is_checked',
                                                              value: !otherData.is_checked,
                                                            },
                                                          },
                                                        )
                                                      }
                                                      name="is_checked"
                                                    />
                                                  </div>
                                                  <div className="w-28 px-4 py-2.5">
                                                    {/* {otherData.code.replace(
                                                          /\.(\d+)$/,
                                                          '-$1',
                                                        )} */}
                                                    -
                                                  </div>
                                                  <div className="w-80 p-2.5">
                                                    <TextareaAutosize
                                                      value={otherData.description || ''}
                                                      placeholder="Other Travel Expenses"
                                                      className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                      name="description"
                                                      onChange={(e) =>
                                                        updateOtherEntry(
                                                          activity.budgets?.find(
                                                            (budget) =>
                                                              budget.vendor_category_information.name === 'Other',
                                                          ).vendor_category_id,
                                                          activityIndex,
                                                          otherDataIndex,
                                                          e,
                                                        )
                                                      }
                                                    />
                                                  </div>
                                                  <div className="w-24 p-2.5">
                                                    <Input
                                                      type="number"
                                                      name="qty"
                                                      value={otherData.qty || ''}
                                                      placeholder="Qty"
                                                      onChange={(e) =>
                                                        updateOtherEntry(
                                                          activity.budgets?.find(
                                                            (budget) =>
                                                              budget.vendor_category_information.name === 'Other',
                                                          ).vendor_category_id,
                                                          activityIndex,
                                                          otherDataIndex,
                                                          e,
                                                        )
                                                      }
                                                      size="sm"
                                                    />
                                                  </div>
                                                  <div className="w-32 p-2.5 lowercase">
                                                    <TextareaAutosize
                                                      value={otherData.unit || ''}
                                                      onChange={(e) =>
                                                        updateOtherEntry(
                                                          activity.budgets?.find(
                                                            (budget) =>
                                                              budget.vendor_category_information.name === 'Other',
                                                          ).vendor_category_id,
                                                          activityIndex,
                                                          otherDataIndex,
                                                          e,
                                                        )
                                                      }
                                                      name="unit"
                                                      placeholder="Unit"
                                                      className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                    />
                                                  </div>
                                                  <div className="w-24 p-2.5">
                                                    <Input
                                                      type="number"
                                                      value={otherData.pkg_qty || ''}
                                                      onChange={(e) =>
                                                        updateOtherEntry(
                                                          activity.budgets?.find(
                                                            (budget) =>
                                                              budget.vendor_category_information.name === 'Other',
                                                          ).vendor_category_id,
                                                          activityIndex,
                                                          otherDataIndex,
                                                          e,
                                                        )
                                                      }
                                                      name="pkg_qty"
                                                      placeholder="Qty"
                                                      size="sm"
                                                    />
                                                  </div>
                                                  <div className="w-32 p-2.5 lowercase">
                                                    <TextareaAutosize
                                                      value={otherData.pkg_unit || ''}
                                                      onChange={(e) =>
                                                        updateOtherEntry(
                                                          activity.budgets?.find(
                                                            (budget) =>
                                                              budget.vendor_category_information.name === 'Other',
                                                          ).vendor_category_id,
                                                          activityIndex,
                                                          otherDataIndex,
                                                          e,
                                                        )
                                                      }
                                                      name="pkg_unit"
                                                      placeholder="Unit"
                                                      className="form-textarea w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                                                    />
                                                  </div>
                                                  <div className="w-48 p-2.5">
                                                    <div className="flex items-center gap-3">
                                                      <p className="text-gray-500">Rp</p>
                                                      <div>
                                                        <Input
                                                          size="sm"
                                                          type="number"
                                                          align="end"
                                                          placeholder="0"
                                                          value={otherData.unit_cost || ''}
                                                          onChange={(e) =>
                                                            updateOtherEntry(
                                                              activity.budgets?.find(
                                                                (budget) =>
                                                                  budget.vendor_category_information.name === 'Other',
                                                              ).vendor_category_id,
                                                              activityIndex,
                                                              otherDataIndex,
                                                              {
                                                                target: {
                                                                  name: 'unit_cost',
                                                                  value: e,
                                                                },
                                                              },
                                                            )
                                                          }
                                                          name="unit_cost"
                                                          isCurrency={true}
                                                          inputSelectionInit="IDR"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="w-48 px-4 py-2.5">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <p className="text-gray-500">Rp</p>

                                                      <p>
                                                        {formatCurrency(
                                                          'IDR',
                                                          Number(otherData.qty) *
                                                            Number(otherData.pkg_qty) *
                                                            Number(otherData.unit_cost),
                                                          true,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                          <div className="border-t border-t-gray-200 px-2 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                              <div className="inline-flex items-center gap-3">
                                                <Button
                                                  type="button"
                                                  btnType="normal"
                                                  size="md"
                                                  variant="secondary-gray"
                                                  onClick={() => addNewOtherEntry(activityIndex, activity)}
                                                >
                                                  <PlusIcon className="h-5 w-5 stroke-gray-700" />
                                                  Add New Entry
                                                </Button>
                                                <Button
                                                  type="button"
                                                  btnType="normal"
                                                  size="md"
                                                  variant="secondary-gray"
                                                  onClick={() => deleteOtherEntry(activityIndex)}
                                                >
                                                  <Trash01Icon className="h-5 w-5 stroke-gray-700" />
                                                  Delete Selected
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </Fragment>
                      ))}
                    </div>
                  </div>
                )
              }
            })}
          </div>
        </div>
      </form>

      {/* Additional Attachment */}
      <Drawer
        isOpen={attachmentDrawer}
        setIsOpen={setAttachmentDrawer}
        title="Attachments"
        description="Travel Expenses"
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button type="button" btnType="normal" variant="secondary-gray" size="md" onClick={closeAttachmentDrawer}>
              Cancel
            </Button>
          </>,
          <>
            <Button type="button" btnType="normal" variant="primary" size="md" onClick={closeAttachmentDrawer}>
              Save
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <SwitchableUploadField
            name="additional_attachments.eticket"
            label="E-ticket"
            fieldKey="eticket"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.eticket_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                eticket_upload: !prev.eticket_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={eticket}
            setUploadedFiles={setEticket}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteEticketFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={existingAttachments?.find((a) => a.key === 'eticket')?.file_path?.[0] || null}
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />

          <SwitchableUploadField
            name="additional_attachments.boardingPass"
            label="Boarding Pass"
            fieldKey="boarding_pass"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.boarding_pass_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                boarding_pass_upload: !prev.boarding_pass_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={boardingPass}
            setUploadedFiles={setBoardingPass}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteBoardingPassFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={existingAttachments?.find((a) => a.key === 'boarding_pass')?.file_path?.[0] || null}
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />

          <SwitchableUploadField
            name="additional_attachments.transportExpensesReceipt"
            label="Receipt Bundle for Transport Expenses"
            fieldKey="transport_expenses_receipt"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.bundling_transport_expense_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                bundling_transport_expense_upload: !prev.bundling_transport_expense_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={transportExpenses}
            setUploadedFiles={setTransportExpenses}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteTransportExpensesFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={
              existingAttachments?.find((a) => a.key === 'transport_expenses_receipt')?.file_path?.[0] || null
            }
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />

          <SwitchableUploadField
            name="additional_attachments.transportOthersReceipt"
            label="Receipt Bundle for Others Expenses"
            fieldKey="other_expenses_receipt"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.bundling_others_expense_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                bundling_others_expense_upload: !prev.bundling_others_expense_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={otherExpenses}
            setUploadedFiles={setOtherExpenses}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteOtherTransportReceiptFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={
              existingAttachments?.find((a) => a.key === 'other_expenses_receipt')?.file_path?.[0] || null
            }
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />
          <div className="h-px w-full bg-gray-200"></div>
          <SwitchableUploadField
            name="additional_attachments.invitation"
            label="Undangan"
            fieldKey="invitation"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.invitation_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                invitation_upload: !prev.invitation_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={invitation}
            setUploadedFiles={setInvitation}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteInvitationFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={existingAttachments?.find((a) => a.key === 'invitation')?.file_path?.[0] || null}
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />
          <SwitchableUploadField
            name="additional_attachments.tor"
            label="Term of References (ToR)"
            fieldKey="tor"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.tor_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                tor_upload: !prev.tor_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={tor}
            setUploadedFiles={setTor}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteTorFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={existingAttachments?.find((a) => a.key === 'tor')?.file_path?.[0] || null}
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />
          <SwitchableUploadField
            name="additional_attachments.letterAssignment"
            label="Surat Tugas"
            fieldKey="assignment_letter"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.assignment_letter_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                assignment_letter_upload: !prev.assignment_letter_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={assignmentLetter}
            setUploadedFiles={setAssignmentLetter}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteAssignmentLetterFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={existingAttachments?.find((a) => a.key === 'assignment_letter')?.file_path?.[0] || null}
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />

          <div className="h-px w-full bg-gray-200"></div>

          <SwitchableUploadField
            name="additional_attachments.eventReport"
            label="Event Report (AAR)"
            fieldKey="event_report"
            control={control}
            errors={errors}
            setValue={setValue}
            isLinkMode={switchTogglableButton.event_report_upload}
            onToggle={() => {
              setSwitchTogglableButton((prev) => ({
                ...prev,
                event_report_upload: !prev.event_report_upload,
              }))
            }}
            bucketName={BucketsEnum.pr_attachment}
            uploadProgress={tempProgressUpload}
            uploadedFiles={eventReport}
            setUploadedFiles={setEventReport}
            handleUploadFile={handleUploadFile}
            deleteFilePath={deleteEventReportFile}
            maxFiles={1}
            informationText="IMAGE or DOCUMENTS (max. 5MB)"
            existingFilePath={existingAttachments?.find((a) => a.key === 'event_report')?.file_path?.[0] || null}
            handleDeleteExistingFile={() => {}}
            isEditMode={router.query.slug[1] === 'edit'}
            isRequired={false}
          />
        </div>
      </Drawer>

      {/* Bank Account */}
      <Drawer
        isOpen={bankAccountDrawer}
        setIsOpen={setBankAccountDrawer}
        title="Bank Account"
        description=""
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
          <div>
            <label className="input-label">Requester Name</label>
            <p className="text-lg font-semibold text-gray-900">{employeeDetailData?.full_name}</p>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">Beneficiary Name</label>
            <p className="text-lg font-semibold text-gray-900">{employeeDetailData?.bank_acc_name}</p>
          </div>
          <div>
            <label className="input-label">Bank Name</label>
            <p className="text-lg font-semibold text-gray-900">{employeeDetailData?.bank_name}</p>
          </div>
          <div>
            <label className="input-label">Bank Account Number</label>
            <p className="text-lg font-semibold text-gray-900">{employeeDetailData?.bank_acc_number}</p>
          </div>
        </div>
      </Drawer>
    </>
  )
}
