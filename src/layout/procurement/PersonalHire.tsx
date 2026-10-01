/* eslint-disable tailwindcss/no-custom-classname */
import { Button } from '@/components/Button'
import { ComboboxAutocomplete } from '@/components/ComboboxAutocomplete'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { Input } from '@/components/Input'
import { Loader } from '@/components/Loader'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { SwitchableUploadFieldMultiple } from '@/components/SwitchableUploadFieldMultiple'
import { RequisitionFormRemainingBudget } from '@/components/calculations/RequisitionFormRemainingBudget'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { FileSearch02Icon } from '@/components/icon/FileSearch02Icon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { User01Icon } from '@/components/icon/User01Icon'
import { ProjectActivityModified } from '@/layout/program/budget-needs/BudgetNeedsList'
import { cn } from '@/lib/utils'
import { ProjectWithoutActivitiesType, useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { BucketsUnion, ComboboxType, CurrencyUnion, DynamicProgressType } from '@/types/global'
import {
  fileApi,
  getAllEmployeeCombobox,
  getAllVendorsCombobox,
  getOpenUrl,
  getProcurementBasedOnBudgetCode,
  programApi,
  requisitionFormApi,
  supervisorByEmployee,
} from '@/utils/apiRequestHelper'
import {
  calculateUnitCostPerActivity,
  convertStringCurrency,
  dateFormatToISO,
  formatCurrency,
  isValidUrl,
  remainingBudgetRf,
  slugify,
} from '@/utils/globalHelper'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { ActivityBudgetList, CreatePersonalHireRfApiRequest, ProgramDetail } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'

dayjs.extend(utc)

type Props = {
  programDetail: ProgramDetail
  projectDetail: ProjectWithoutActivitiesType
  budgetProcurement: ProjectActivityModified[]
}

type ActivityBudgetListImproved = ActivityBudgetList & {
  remaining: number
}

type CreatePersonalHireType = {
  project_activities: {
    id: number
    budgets: ActivityBudgetListImproved[]
  }[]
} & CreatePersonalHireRfApiRequest

export const PersonalHire = (props: Props) => {
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

  const [personnelHireInformationDrawer, setPersonnelHireInformationDrawer] = useState<boolean>(false)
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null)
  const [employee, setEmployee] = useState<ComboboxType[]>([])
  const [consultants, setConsultants] = useState<ComboboxType[]>([])
  const [recommendedVendor, setRecommendedVendor] = useState<ComboboxType[]>([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})

  const [documentsPath, setDocumentsPath] = useState<object | null>(null)
  const [existdocumentsPath, setExistDocumentsPath] = useState<object | null>(null)
  const [backgroundDocuments, setBackgroundDocuments] = useState([])
  const [hireProcessDocuments, setHireProcessDocuments] = useState([])
  const [offerPageDocuments, setOfferPageDocuments] = useState([])
  const [otherDocuments, setOtherDocuments] = useState([])

  const [requestedByAvatar, setReqestedByAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [supervisorAvatar, setSupervisorAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [programManagerAvatar, setProgramManagerAvatar] = useState(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [actionByAvatar, setActionByAvatar] = useState(`${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`)
  const [totalRequestValue, setTotalRequestValue] = useState(0)
  const [budgetProcurementModified, setBudgetProcurementModified] = useState<ProjectActivityModified[] | []>([])
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    ph: boolean
  }>({
    ph: false,
  })
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    backgroundDocuments: boolean
    hireProcessDocuments: boolean
    offerPageDocuments: boolean
    otherDocuments: boolean
  }>({
    backgroundDocuments: false,
    hireProcessDocuments: false,
    offerPageDocuments: false,
    otherDocuments: false,
  })
  const [isEditForm, setIsEditForm] = useState<boolean>(false)
  const [renderForm, setRenderForm] = useState<boolean>(false)
  const [linkCollections, setLinkCollections] = useState([])

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
  } = useForm<CreatePersonalHireType>()

  const submitPersonalHireRequest: SubmitHandler<CreatePersonalHireType> = async (formInput) => {
    setLoadingButtonStatement((prev) => ({ ...prev, ph: true }))
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
      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
      return false
    }

    const actionBy = formInput.action_by as unknown as ComboboxType
    const vendor = formInput.personal_hire_information.vendor_id as unknown as ComboboxType

    // Check is there any remaining RF
    const remainingRFs = await getProcurementBasedOnBudgetCode(programDetail.id, projectDetail?.id, budgetProcurement)

    const submitValues = {
      deadline: dateFormatToISO(
        dayjs(formInput.deadline as unknown as string)
          .utc()
          .format(),
      ) as unknown as object,
      action_by: `employee:${actionBy.id}`,
      about_request: formInput.about_request,
      budgets: formInput.project_activities.flatMap((item, activityIndex) => {
        return item.budgets.map((budget, budgetIndex) => ({
          ...budget,
          recommended_vendor:
            String(recommendedVendor.find((vendor) => vendor.name === budget.recommended_vendor)?.id || '') || null,
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

      personal_hire_information: {
        vendor_id: String(vendor.id),
        type_hire: formInput.personal_hire_information.type_hire,
        primary_division: formInput.personal_hire_information.primary_division,
        notes: formInput.personal_hire_information.notes,
        background_docs: switchTogglableButton.backgroundDocuments
          ? [`${formInput.personal_hire_information.background_docs}`]
          : documentsPath?.['background_docs'] || existdocumentsPath?.['background_docs'],
        hire_process_docs: switchTogglableButton.hireProcessDocuments
          ? [`${formInput.personal_hire_information.hire_process_docs}`]
          : documentsPath?.['hire_process_docs'] || existdocumentsPath?.['hire_process_docs'],
        offer_page_docs: switchTogglableButton.offerPageDocuments
          ? [`${formInput.personal_hire_information.offer_page_docs}`]
          : documentsPath?.['offer_page_docs'] || existdocumentsPath?.['offer_page_docs'],

        other_docs: switchTogglableButton.otherDocuments
          ? linkCollections
          : [
              ...((documentsPath && documentsPath['other_docs']) || []),
              ...((existdocumentsPath && existdocumentsPath['other_docs']) || []),
            ],
      },
    }

    for (const budget of submitValues.budgets) {
      const remaining = await RequisitionFormRemainingBudget.getRemainingBudget(budget.id)

      if (remaining < 0) {
        toast.warning(
          `Can't create PH, negative remaining budget is found at budget needs number ${budget.code.replace(
            /\.(\d+)$/,
            '-$1',
          )}, please re-check your budget needs`,
          {
            icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
            autoClose: 5000,
          },
        )
        setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
        return false
      }
    }

    // Validation for link upload that are required
    if (switchTogglableButton.backgroundDocuments && !submitValues.personal_hire_information.background_docs[0]) {
      toast.warning('Background link is required field', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })

      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
      setError('personal_hire_information.background_docs', {
        type: 'required',
        message: 'Background link is required field',
      })
      openPersonnelHireDrawer()
      return false
    }
    if (switchTogglableButton.hireProcessDocuments && !submitValues.personal_hire_information.hire_process_docs[0]) {
      toast.warning('Hire process link is required field', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })

      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
      setError('personal_hire_information.hire_process_docs', {
        type: 'required',
        message: 'Hire process link is required field',
      })
      openPersonnelHireDrawer()
      return false
    }
    if (switchTogglableButton.offerPageDocuments && !submitValues.personal_hire_information.offer_page_docs[0]) {
      toast.warning('Principal of offer page link is required field', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })

      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
      setError('personal_hire_information.offer_page_docs', {
        type: 'required',
        message: 'Principal of offer page link is required field',
      })
      openPersonnelHireDrawer()
      return false
    }

    // Case to handle if user in edit page and delete file and forget to upload new file
    if (
      isEditForm &&
      !switchTogglableButton.backgroundDocuments &&
      !submitValues.personal_hire_information.background_docs[0]
    ) {
      toast.warning('Background document file is required field', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })

      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
      setError('personal_hire_information.background_docs', {
        type: 'required',
        message: 'Background document file is required field',
      })
      openPersonnelHireDrawer()
      return false
    }
    if (
      isEditForm &&
      !switchTogglableButton.hireProcessDocuments &&
      !submitValues.personal_hire_information.hire_process_docs[0]
    ) {
      toast.warning('Hire process document file is required field', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })

      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
      setError('personal_hire_information.hire_process_docs', {
        type: 'required',
        message: 'Hire process document file is required field',
      })
      openPersonnelHireDrawer()
      return false
    }
    if (
      isEditForm &&
      !switchTogglableButton.offerPageDocuments &&
      !submitValues.personal_hire_information.offer_page_docs[0]
    ) {
      toast.warning('Principal of offer page document file is required field', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })

      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
      setError('personal_hire_information.offer_page_docs', {
        type: 'required',
        message: 'Principal of offer page document file is required field',
      })
      openPersonnelHireDrawer()
      return false
    }

    // console.log('submitValues', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
    // return false

    if (isEditForm) {
      const submitRequisitionForm = requisitionFormApi.rFControllerUpdateRFTPersonalHire(
        router.query.slug[0],
        router.query.slug[2],
        router.query.slug[3],
        submitValues,
      )

      toast.promise(submitRequisitionForm, {
        pending: 'Updating personnel hire...',
        success: 'Personnel hire updated successfully',
        error: 'Promise rejected 🤯',
      })

      submitRequisitionForm.then((success) => {
        router.replace(`/dashboard/procurement/${programDetail.id}/detail/${projectDetail.id}/${success.data.data}`)
        removeCookie('budget_needs_to_procurements')
        removeCookie('project_to_procurements')
        removeCookie('requisition_type')
      })
    } else {
      const submitRequisitionForm = requisitionFormApi.rFControllerCreateRFTPersonalHire(
        programDetail.id,
        projectDetail.id,
        submitValues,
      )

      toast.promise(submitRequisitionForm, {
        pending: 'Requesting personal hire',
        success: 'Personnel hire requested',
        error: 'Promise rejected 🤯',
      })

      submitRequisitionForm.then((success) => {
        router.replace(`/dashboard/procurement/${programDetail.id}/detail/${projectDetail.id}/${success.data.data}`)
        removeCookie('budget_needs_to_procurements')
        removeCookie('project_to_procurements')
        removeCookie('requisition_type')
      })
    }
  }

  const openPersonnelHireDrawer = () => {
    setPersonnelHireInformationDrawer(true)
  }

  const closePersonnelHireDrawer = useCallback(() => {
    setPersonnelHireInformationDrawer(false)
  }, [])

  const errorSubmitPersonalHireRequest = async (error: any) => {
    if (
      error.personal_hire_information?.type_hire ||
      error.personal_hire_information?.primary_division ||
      error.personal_hire_information?.background_docs ||
      error.personal_hire_information?.hire_process_docs ||
      error.personal_hire_information?.offer_page_docs
    ) {
      openPersonnelHireDrawer()
    } else {
      if (error) {
        toast.warning('Check empty field and please fill the required field', {
          autoClose: 10000,
        })
      }
    }
  }

  let temporaryMultipleFileUpload = []
  const handleUploadFile = async (
    fileObjects: File[],
    fileUploadType: 'background_docs' | 'hire_process_docs' | 'offer_page_docs' | 'other_docs',
  ) => {
    const bucketName = BucketsEnum.rf_doc
    if (!Array.isArray(fileObjects)) return
    fileObjects.map(async (fileObject) => {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)

      let identifier = null
      if (fileUploadType === 'other_docs') {
        identifier = `${slugify(fileObject.name)}-${fileObject.lastModified}`
      } else {
        identifier = fileUploadType
      }

      const fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
        headers: {
          'Content-Type': fileObject.type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          if (fileUploadType === 'other_docs') {
            setTempProgressUpload((prev) => {
              if (!prev[identifier] || percentCompleted > prev[identifier]?.progress) {
                return {
                  ...prev,
                  [identifier]: {
                    bucketName,
                    progress: percentCompleted,
                    identifier,
                  },
                }
              }

              return prev
            })
          } else {
            setTempProgressUpload((prev) => ({
              ...prev,
              [identifier]: {
                bucketName,
                progress: percentCompleted,
                identifier,
              },
            }))
          }
        },
      })

      switch (fileUploadType) {
        case 'background_docs':
          const backgroundDocs = [`${BucketsEnum.rf_doc}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            background_docs: backgroundDocs,
          }))
          break
        case 'hire_process_docs':
          const hireProcessDocs = [`${BucketsEnum.rf_doc}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            hire_process_docs: hireProcessDocs,
          }))
          break
        case 'offer_page_docs':
          const offerPageDocs = [`${BucketsEnum.rf_doc}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            offer_page_docs: offerPageDocs,
          }))
          break
        case 'other_docs':
          const otherDocs = [`${BucketsEnum.rf_doc}/${fileNameS3}`]

          // const otherPath = vendorDetailData.vendor_information['other_path']
          //   ? vendorDetailData.vendor_information['other_path']
          //   : []

          temporaryMultipleFileUpload = [
            ...temporaryMultipleFileUpload,
            // ...otherPath,
            ...otherDocs,
          ]

          const uniqueMultipleFileUpload = [...new Set(temporaryMultipleFileUpload)]
          setDocumentsPath((prev) => ({
            ...prev,
            other_docs: [...uniqueMultipleFileUpload],
          }))
          break

        default:
          break
      }
    })
  }

  const deleteBackgroundDocuments = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['background_docs'] = prev['background_docs'].filter((path) => !path.includes(filename))
      return prev
    })
    setBackgroundDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteHireProcessDocuments = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['hire_process_docs'] = prev['hire_process_docs'].filter((path) => !path.includes(filename))
      return prev
    })
    setHireProcessDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteOfferPageDocuments = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['offer_page_docs'] = prev['offer_page_docs'].filter((path) => !path.includes(filename))
      return prev
    })
    setOfferPageDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteOtherDocuments = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['other_docs'] = prev['other_docs'].filter((path) => !path.includes(filename))
      return prev
    })
    setOtherDocuments((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    const getEmployee = async () => {
      const pic = await getAllEmployeeCombobox()
      setEmployee(pic)
    }
    getEmployee()

    const getVendorConsultant = async () => {
      const consultant = await getAllVendorsCombobox('consultant')
      setConsultants(consultant)
    }
    getVendorConsultant()

    const getVendorRecommendedVendor = async () => {
      const recommendedVendor = await getAllVendorsCombobox()
      setRecommendedVendor(recommendedVendor)
    }
    getVendorRecommendedVendor()
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

    if (programDetail?.program_manager?.pass_photo_path?.[0]) {
      const approverPhotoPath = programDetail.program_manager.pass_photo_path[0]
      const [bucketName, fileName] = approverPhotoPath.split('/')

      if (bucketName && fileName && fileName !== 'undefined') {
        getOpenUrl(bucketName as BucketsUnion, fileName, 3600 * 24)
          .then((file) => {
            setProgramManagerAvatar(file.url)
          })
          .catch((err) => console.error(err))
      }
    }
  }, [watch('action_by'), userLoggedinInformation, programDetail])

  useEffect(() => {
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
  }, [budgetProcurementModified])

  useEffect(() => {
    const subscription = watch((value) => {
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
  }, [budgetProcurement, programDetail?.id, projectDetail?.id && isEditForm])

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
  }, [budgetProcurementModified, userLoggedinInformation, programDetail, totalRequestValue])

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
        if (consultants.length > 0) {
          setValue(
            'personal_hire_information.vendor_id',
            consultants.find(
              (consultant) => consultant.id === rfResult.rf_attributes['vendor_id'],
            ) as unknown as string,
          )
        }
        setValue('about_request', rfResult.about_request as string)
        setValue('personal_hire_information.type_hire', rfResult.rf_attributes['type_hire'])
        setValue('personal_hire_information.primary_division', rfResult.rf_attributes['primary_division'])
        setValue('personal_hire_information.notes', rfResult.rf_attributes['notes'])

        // Background Documents
        if (isValidUrl(rfResult.rf_attributes['background_docs'][0])) {
          setSwitchTogglableButton((prev) => ({
            ...prev,
            backgroundDocuments: true,
          }))
          setValue(
            'personal_hire_information.background_docs',
            rfResult.rf_attributes['background_docs'] as unknown as string[],
          )
        } else {
          if (rfResult.rf_attributes['background_docs'].length > 0) {
            setExistDocumentsPath((prev) => ({
              ...prev,
              background_docs: rfResult.rf_attributes['background_docs'],
            }))
          }
        }

        // Hire Process Documents
        if (isValidUrl(rfResult.rf_attributes['hire_process_docs'][0])) {
          setSwitchTogglableButton((prev) => ({
            ...prev,
            hireProcessDocuments: true,
          }))
          setValue(
            'personal_hire_information.hire_process_docs',
            rfResult.rf_attributes['hire_process_docs'] as unknown as string[],
          )
        } else {
          if (rfResult.rf_attributes['hire_process_docs'].length > 0) {
            setExistDocumentsPath((prev) => ({
              ...prev,
              hire_process_docs: rfResult.rf_attributes['hire_process_docs'],
            }))
          }
        }

        // Offer Page Documents
        if (isValidUrl(rfResult.rf_attributes['offer_page_docs'][0])) {
          setSwitchTogglableButton((prev) => ({
            ...prev,
            offerPageDocuments: true,
          }))
          setValue(
            'personal_hire_information.offer_page_docs',
            rfResult.rf_attributes['offer_page_docs'] as unknown as string[],
          )
        } else {
          if (rfResult.rf_attributes['offer_page_docs'].length > 0) {
            setExistDocumentsPath((prev) => ({
              ...prev,
              offer_page_docs: rfResult.rf_attributes['offer_page_docs'],
            }))
          }
        }

        // Other Documents
        if (isValidUrl(rfResult.rf_attributes['other_docs'][0])) {
          setSwitchTogglableButton((prev) => ({
            ...prev,
            otherDocuments: true,
          }))
          setLinkCollections(rfResult.rf_attributes['other_docs'])
        } else {
          if (rfResult.rf_attributes['other_docs'].length > 0) {
            setExistDocumentsPath((prev) => ({
              ...prev,
              other_docs: rfResult.rf_attributes['other_docs'],
            }))
          }
        }

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
  }, [router.query.slug[1], consultants])

  useEffect(() => {
    return () => {
      setLoadingButtonStatement((prev) => ({ ...prev, ph: false }))
    }
  }, [])

  if (!renderForm) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading personal hire form..." />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(submitPersonalHireRequest, errorSubmitPersonalHireRequest)}>
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
          <Button type="submit" btnType="normal" size="md" variant="primary" isLoading={loadingButtonStatement['ph']}>
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
                <h2 className="text-lg font-semibold text-gray-900">Personnel Hire (PH)</h2>
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
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
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
                      error={invalid}
                    />
                    {errors.action_by && <span className="input-hint-text error">{errors.action_by?.message}</span>}
                  </>
                )}
              />
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-6">
            <div>
              <p className="mb-2 text-xs font-bold text-gray-500">Total Request</p>
              <div className="inline-flex items-center gap-2">
                <p className="pb-1 text-4xl font-semibold tracking-tight text-gray-900">
                  {formatCurrency(programDetail.currency as unknown as CurrencyUnion, totalRequestValue || 0)}
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
          <div className="flex flex-col gap-6">
            <div>
              <label
                htmlFor="personal_hire_information.vendor_id"
                className="mb-2 block text-xs font-bold text-gray-500"
              >
                Consultant
              </label>
              <Controller
                control={control}
                name="personal_hire_information.vendor_id"
                rules={{
                  required: 'Please choose consultant',
                }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <>
                    <ComboboxAutocomplete
                      icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                      id="personal_hire_information.vendor_id"
                      size="sm"
                      placeholder="Select Consultant"
                      value={value as unknown as ComboboxType}
                      handleChange={(consultant) => {
                        onChange(consultant)
                      }}
                      listData={consultants}
                      others="none"
                      error={invalid}
                    />
                    {errors?.personal_hire_information?.vendor_id && (
                      <span className="input-hint-text error">
                        {errors?.personal_hire_information.vendor_id?.message}
                      </span>
                    )}
                  </>
                )}
              />
              <p className="mt-2 text-sm text-gray-600">
                Make sure already add the consultant on External (Vendor) Administration
              </p>
            </div>
            <div>
              <label htmlFor="action_by" className="mb-2 block text-xs font-bold text-gray-500">
                Personnel Hire Information
              </label>
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                className="w-full justify-center"
                onClick={openPersonnelHireDrawer}
              >
                Add Information
              </Button>
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
            <p className="mb-2 text-xs font-bold text-gray-500">{isInternal ? 'General Manager' : 'Project Manager'}</p>
            <div className="flex items-center gap-2.5">
              <Image
                src={programManagerAvatar}
                width={32}
                height={24}
                alt={programManagerAvatar}
                className="h-6 w-8 shrink-0 rounded-[200px] object-cover"
              />
              <p className="font-semibold text-gray-700">{programDetail?.program_manager?.full_name}</p>
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
              <div className="border-b border-b-gray-200 py-0" key={activity.id}>
                <div className="flex w-full items-center gap-4 py-6">
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
                        {formatCurrency(
                          'IDR',
                          calculateUnitCostPerActivity(watch(`project_activities.${activityIndex}`) || activity),
                          true,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="table-container">
                  <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                  <div className="table-wrapper overflow-x-auto py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
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
                              Vendor Category
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
                                {budget.vendor_category_information.name}
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
                                      name={`project_activities.${activityIndex}.budgets.${budgetIndex}.unit_cost_value`}
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
                              <div className="w-48 bg-white p-4 2xl:px-6">
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
      <Drawer
        drawerWidth="w-[28rem]"
        isOpen={personnelHireInformationDrawer}
        setIsOpen={setPersonnelHireInformationDrawer}
        title="Personnel Hire Information"
        description={programDetail.program_name}
        icon={<FileSearch02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closePersonnelHireDrawer}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button type="button" btnType="normal" variant="primary" size="md" onClick={closePersonnelHireDrawer}>
              Save
            </Button>
          </>,
        ]}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="personal_hire_information.type_hire" className="input-label">
              Type of Hire
            </label>
            <Controller
              control={control}
              name="personal_hire_information.type_hire"
              rules={{ required: 'Type of hire is required field' }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <Input
                  type="text"
                  id="personal_hire_information.type_hire"
                  placeholder="Type of hire this consultant"
                  onChange={onChange}
                  value={value || ''}
                  error={invalid}
                />
              )}
            />
            {errors.personal_hire_information?.type_hire && (
              <span className="input-hint-text error">{errors.personal_hire_information.type_hire?.message}</span>
            )}
          </div>
          <div>
            <label htmlFor="personal_hire_information.primary_division" className="input-label">
              Primary Division
            </label>
            <Controller
              control={control}
              name="personal_hire_information.primary_division"
              rules={{ required: 'Primary division is required field' }}
              render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                <Input
                  type="text"
                  id="personal_hire_information.primary_division"
                  placeholder="Division of this consultant"
                  onChange={onChange}
                  value={value || ''}
                  error={invalid}
                />
              )}
            />
            {errors.personal_hire_information?.primary_division && (
              <span className="input-hint-text error">
                {errors.personal_hire_information.primary_division?.message}
              </span>
            )}
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label htmlFor="personal_hire_information.notes" className="input-label">
              Notes (Optional)
            </label>
            <textarea
              {...register('personal_hire_information.notes')}
              id="personal_hire_information.notes"
              className="textarea-input resize-none"
              rows={5}
              placeholder="Write notes about this personnel hire"
            ></textarea>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div className="flex flex-col gap-6">
            <SwitchableUploadField
              name="personal_hire_information.background_docs"
              label="Background Documents"
              fieldKey="background_docs"
              control={control}
              errors={errors}
              setValue={setValue}
              isLinkMode={switchTogglableButton.backgroundDocuments}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  backgroundDocuments: !prev.backgroundDocuments,
                }))
              }}
              bucketName={BucketsEnum.rf_doc}
              uploadProgress={tempProgressUpload}
              uploadedFiles={backgroundDocuments}
              setUploadedFiles={setBackgroundDocuments}
              handleUploadFile={handleUploadFile}
              deleteFilePath={deleteBackgroundDocuments}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={existdocumentsPath?.['background_docs']?.[0] || null}
              handleDeleteExistingFile={() => {
                setExistDocumentsPath((prev) => ({
                  ...prev,
                  background_docs: null,
                }))
              }}
              isEditMode={router.query.slug[1] === 'edit'}
              isRequired={true}
            />

            <SwitchableUploadField
              name="personal_hire_information.hire_process_docs"
              label="Hire Process Documents"
              fieldKey="hire_process_docs"
              control={control}
              errors={errors}
              setValue={setValue}
              isLinkMode={switchTogglableButton.hireProcessDocuments}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  hireProcessDocuments: !prev.hireProcessDocuments,
                }))
              }}
              bucketName={BucketsEnum.rf_doc}
              uploadProgress={tempProgressUpload}
              uploadedFiles={hireProcessDocuments}
              setUploadedFiles={setHireProcessDocuments}
              handleUploadFile={handleUploadFile}
              deleteFilePath={deleteHireProcessDocuments}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={existdocumentsPath?.['hire_process_docs']?.[0] || null}
              handleDeleteExistingFile={() => {
                setExistDocumentsPath((prev) => ({
                  ...prev,
                  hire_process_docs: null,
                }))
              }}
              isEditMode={router.query.slug[1] === 'edit'}
              isRequired={true}
            />

            <SwitchableUploadField
              name="personal_hire_information.offer_page_docs"
              label="Principal of Offer Page Documents"
              fieldKey="offer_page_docs"
              control={control}
              errors={errors}
              setValue={setValue}
              isLinkMode={switchTogglableButton.offerPageDocuments}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  offerPageDocuments: !prev.offerPageDocuments,
                }))
              }}
              bucketName={BucketsEnum.rf_doc}
              uploadProgress={tempProgressUpload}
              uploadedFiles={offerPageDocuments}
              setUploadedFiles={setOfferPageDocuments}
              handleUploadFile={handleUploadFile}
              deleteFilePath={deleteOfferPageDocuments}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={existdocumentsPath?.['offer_page_docs']?.[0] || null}
              handleDeleteExistingFile={() => {
                setExistDocumentsPath((prev) => ({
                  ...prev,
                  offer_page_docs: null,
                }))
              }}
              isEditMode={router.query.slug[1] === 'edit'}
              isRequired={true}
            />

            <SwitchableUploadFieldMultiple
              name="personal_hire_information.other_docs"
              label="Other Documents (Optional)"
              control={control}
              errors={errors}
              setValue={setValue}
              isLinkMode={switchTogglableButton.otherDocuments}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  otherDocuments: !prev.otherDocuments,
                }))
                setOtherDocuments([])
                setLinkCollections([])
              }}
              linkCollections={linkCollections}
              setLinkCollections={setLinkCollections}
              bucketName={BucketsEnum.rf_doc}
              uploadProgress={tempProgressUpload}
              uploadedFiles={otherDocuments}
              setUploadedFiles={setOtherDocuments}
              handleUploadFile={(files) => handleUploadFile(files, 'other_docs')}
              deleteFilePath={deleteOtherDocuments}
              maxFiles={10}
              informationText="IMAGE or DOCUMENTS (max 5MB each file)"
              existingFiles={existdocumentsPath?.['other_docs']}
              handleDeleteExistingFile={(file) => {
                const result = existdocumentsPath['other_docs'].filter((item) => item !== file)
                setExistDocumentsPath((prev) => ({
                  ...prev,
                  other_docs: result,
                }))
              }}
              existingFileBucketCheck={BucketsEnum.rf_doc}
              isEditMode={router.query.slug[1] === 'edit'}
              isRequired={false}
            />
          </div>
        </div>
      </Drawer>
    </form>
  )
}
