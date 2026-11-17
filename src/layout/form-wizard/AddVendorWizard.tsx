import { Button } from '@/components/Button'
import { ComboboxAutocomplete } from '@/components/ComboboxAutocomplete'
import { Input } from '@/components/Input'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { SwitchableUploadFieldMultiple } from '@/components/SwitchableUploadFieldMultiple'
import { Briefcase02Icon } from '@/components/icon/Briefcase02Icon'
import { ChevronLeftIcon } from '@/components/icon/ChevronLeftIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { CoinsHandIcon } from '@/components/icon/CoinsHandIcon'
import { Edit01Icon } from '@/components/icon/Edit01Icon'
import { Globe05Icon } from '@/components/icon/Globe05Icon'
import { PackageCheckIcon } from '@/components/icon/PackageCheckIcon'
import { PackageIcon } from '@/components/icon/PackageIcon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { Repeat03Icon } from '@/components/icon/Repeat03Icon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { User01Icon } from '@/components/icon/User01Icon'
import { Users03Icon } from '@/components/icon/Users03Icon'
import { XCloseIcon } from '@/components/icon/XCloseIcon'
import { cn } from '@/lib/utils'
import {
  VENDOR_PACKAGES_TOTAL_PAGE,
  VENDOR_PAYMENT_TOTAL_PAGE,
  VENDOR_TYPE_TOTAL_PAGE,
  useAddVendorFormWizardProvider,
} from '@/providers/AddVendorFormWizardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { BucketsUnion, ComboboxType, CurrencyUnion, DynamicProgressType } from '@/types/global'
import { VendorEnum } from '@/types/vendor'
import {
  employeeApi,
  fileApi,
  getCategories,
  getVendorDetail,
  getVendorTypeDetail,
  getVendorTypes,
  vendorExternalApi,
} from '@/utils/apiRequestHelper'
import { UNFIX_TRANSPORT } from '@/utils/constant'
import { convertStringCurrency, formatCurrency, isValidUrl, slugify, snakeCase } from '@/utils/globalHelper'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import 'react-circular-progressbar/dist/styles.css'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import 'react-tagsinput/react-tagsinput.css'
import { toast } from 'react-toastify'
import { VendorCategoryCorelation, VendorDto, VendorPackage, VendorType } from 'sdk/api'
import { useSWRConfig } from 'swr'
import useSWRImmutable from 'swr/immutable'
import { v4 as uuidv4 } from 'uuid'

dayjs.extend(utc)

type RefReferenceType = {
  submitReference: React.RefObject<HTMLButtonElement>
  vendorIdChecker?: (vendorId: string) => void
}

const organizations: { text: string }[] = [
  {
    text: 'Individual',
  },
  {
    text: 'Group',
  },
]
const nationalities: { text: string }[] = [
  {
    text: 'Warga Negara Indonesia',
  },
  {
    text: 'Warga Negara Asing',
  },
]

export const AddVendorWizard = () => {
  const router = useRouter()
  const submitRef = useRef(null)

  const { formWizardCurrentState, stepFormWizardHistory } = useAddVendorFormWizardProvider()

  const checkVendorIdIsExist = useCallback(async (vendorId: string) => {
    if (vendorId) {
      toast.success('Vendor has been saved')
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [formWizardCurrentState])

  return (
    <>
      <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {router?.query?.id ? 'Edit Vendor' : 'Add New Vendor'}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Button
            type="button"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => {
              localStorage.setItem('vendor_id_onprogress', JSON.stringify(null))
              router.replace('/dashboard/external/vendor-adm')
            }}
          >
            {router?.query?.id ? 'Back (Cancel Edit)' : 'Cancel'}
          </Button>
          <Button
            type="button"
            btnType="normal"
            size="md"
            variant="primary"
            onClick={() => {
              submitRef.current.click()
            }}
          >
            {router?.query?.id ? 'Save Vendor' : 'Submit New Vendor'}
            {!router?.query?.id ? <PlusIcon className="h-5 w-5 stroke-white" /> : null}
          </Button>
        </div>
      </div>
      <div className="mt-14 flex gap-10 px-10 align-baseline">
        <div className="w-64 shrink-0 2xl:w-80">
          <div className="stepper stepper-vertical sticky top-6">
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'vendorType' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorType').status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorType').percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Vendor Type</p>
              <span className="stepper-description">Choose the vendor type</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress overflow-hidden">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${stepFormWizardHistory?.find((item) => item.identifier === 'vendorType').percentage}%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {(Number(
                    stepFormWizardHistory?.find((item) => item.identifier === 'vendorType').percentage?.toFixed(),
                  ) > 100
                    ? 105
                    : stepFormWizardHistory?.find((item) => item.identifier === 'vendorType').percentage?.toFixed()) ||
                    0}
                  %
                </span>
              </div>
            </div>
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'vendorInformation' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorInformation').status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorInformation').percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Vendor Information</p>
              <span className="stepper-description">A few details about them</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress overflow-hidden">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${
                        stepFormWizardHistory?.find((item) => item.identifier === 'vendorInformation').percentage
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {(Number(
                    stepFormWizardHistory
                      ?.find((item) => item.identifier === 'vendorInformation')
                      .percentage?.toFixed(),
                  ) > 100
                    ? 105
                    : stepFormWizardHistory
                        ?.find((item) => item.identifier === 'vendorInformation')
                        .percentage?.toFixed()) || 0}
                  %
                </span>
              </div>
            </div>
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'vendorPackages' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorPackages').status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorPackages').percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Vendor Packages</p>
              <span className="stepper-description">Add the offered package</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress overflow-hidden">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${
                        stepFormWizardHistory?.find((item) => item.identifier === 'vendorPackages').percentage
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {(Number(
                    stepFormWizardHistory?.find((item) => item.identifier === 'vendorPackages').percentage?.toFixed(),
                  ) > 100
                    ? 105
                    : stepFormWizardHistory
                        ?.find((item) => item.identifier === 'vendorPackages')
                        .percentage?.toFixed()) || 0}
                  %
                </span>
              </div>
            </div>
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'vendorPayment' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorPayment').status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'vendorPayment').percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Vendor Payment</p>
              <span className="stepper-description">Bank account data</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress overflow-hidden">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${
                        stepFormWizardHistory?.find((item) => item.identifier === 'vendorPayment').percentage
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {(Number(
                    stepFormWizardHistory?.find((item) => item.identifier === 'vendorPayment').percentage?.toFixed(),
                  ) > 100
                    ? 105
                    : stepFormWizardHistory
                        ?.find((item) => item.identifier === 'vendorPayment')
                        .percentage?.toFixed()) || 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {formWizardCurrentState === 'vendorType' && (
          <VendorTypeSubPage submitReference={submitRef} vendorIdChecker={checkVendorIdIsExist} />
        )}
        {formWizardCurrentState === 'vendorInformation' && (
          <VendorInformationSubPage submitReference={submitRef} vendorIdChecker={checkVendorIdIsExist} />
        )}
        {formWizardCurrentState === 'vendorPackages' && (
          <VendorPackagesSubPage submitReference={submitRef} vendorIdChecker={checkVendorIdIsExist} />
        )}
        {formWizardCurrentState === 'vendorPayment' && (
          <VendorPaymentSubPage submitReference={submitRef} vendorIdChecker={checkVendorIdIsExist} />
        )}
      </div>
    </>
  )
}

/*  ===========================================================================
Vendor Type
===========================================================================  */
const VendorTypeSubPage = ({ submitReference, vendorIdChecker }: RefReferenceType) => {
  const router = useRouter()
  const { handleFormWizardHistory } = useAddVendorFormWizardProvider()
  const [vendorDetailData, setVendorDetailData] = useState<VendorDto | null>(null)

  const { mutate } = useSWRConfig()
  const { data: vendorTypesData } = useSWRImmutable<VendorType[], Error>('vendor-types', getVendorTypes)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VendorDto>()

  const submitVendorType: SubmitHandler<VendorDto> = async (formInput) => {
    const vendorId = vendorDetailData?.id
    let isResetVendor = false

    const vendorData = {
      id: vendorId,
      vendor_type: formInput.vendor_type,
      vendor_categories: [],
      vendor_information: {},
      vendor_packages: [],
      form_state: '',
      form_progress: 0,
      vendor_payment: {
        bank_name: '',
        bank_branch: '',
        bank_acc_number: '',
        bank_acc_name: '',
        swift_code: '',
      },
    }

    if (vendorId) {
      if (vendorDetailData.vendor_type !== formInput.vendor_type) {
        isResetVendor = true
        await vendorExternalApi.vendorControllerUpdateVendor(vendorId, {
          ...vendorDetailData,
          vendor_type: formInput.vendor_type,
          vendor_categories: [],
          vendor_information: {},
          vendor_packages: [],
          form_state: '',
          form_progress: 0,
          vendor_payment: {
            bank_name: '',
            bank_branch: '',
            bank_acc_number: '',
            bank_acc_name: '',
            swift_code: '',
          },
        })
      } else {
        await vendorExternalApi.vendorControllerUpdateVendor(vendorId, {
          ...vendorDetailData,
          vendor_type: formInput.vendor_type,
          vendor_categories: vendorDetailData.vendor_categories.map((item) => item.vendor_category_info_id),
        })
      }
      vendorIdChecker(vendorId)
    } else {
      const createVendor = await vendorExternalApi.vendorControllerCreateVendor({
        ...vendorData,
        vendor_type: formInput.vendor_type,
      })
      localStorage.setItem('vendor_id_onprogress', JSON.stringify(createVendor.data.data))
      vendorIdChecker((createVendor.data.data as undefined as string) || vendorId)
    }

    gotoNext(isResetVendor)
  }

  const gotoNext = (isReset: boolean) => {
    handleFormWizardHistory('vendorType', 'vendorInformation', VENDOR_TYPE_TOTAL_PAGE, isReset)
  }

  useEffect(() => {
    setValue('vendor_type', vendorDetailData?.vendor_type)

    if (vendorDetailData?.vendor_type) {
      const evaluationradioType = document.getElementById(vendorDetailData?.vendor_type) as HTMLInputElement
      if (evaluationradioType) {
        evaluationradioType.checked = true
      }
    }
  }, [vendorDetailData])

  useEffect(() => {
    mutate('vendor-draft')
  }, [])

  useEffect(() => {
    const exec = async () => {
      if (router?.query?.id) {
        const result = await getVendorDetail(router.query.id as string)
        setVendorDetailData(result)
      } else {
        const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
        if (vendorIdOnprogress) {
          const result = await getVendorDetail(vendorIdOnprogress)
          setVendorDetailData(result)
        }
      }
    }
    exec()

    setTimeout(() => {
      const triggerButton = document.getElementById('triggerRevalidateVendorDetail')
      if (triggerButton) {
        triggerButton.click()
      }
    }, 600)
  }, [router])

  return (
    <form onSubmit={handleSubmit(submitVendorType)} className="flex-auto">
      <button
        type="button"
        id="triggerRevalidateVendorDetail"
        onClick={async () => {
          if (router?.query?.id) {
            const result = await getVendorDetail(router.query.id as string)
            setVendorDetailData(result)
          } else {
            const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
            if (vendorIdOnprogress) {
              const result = await getVendorDetail(vendorIdOnprogress)
              setVendorDetailData(result)
            }
          }
        }}
      ></button>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Vendor Type</h2>

        <div className="form-data-container">
          <div className="grid grid-cols-2 gap-5">
            {vendorTypesData
              ?.filter(
                (vendorType) =>
                  vendorType.name.toLowerCase() !== 'staff cost' && vendorType.name.toLowerCase() !== 'staff',
              )
              ?.map((vendorType) => (
                <div key={`${vendorType.id}-${slugify(vendorType.name)}`}>
                  <input
                    {...register('vendor_type', {
                      required: "Choose one of vendor type, it's required.",
                    })}
                    className="select-multiple hidden"
                    id={vendorType.id}
                    value={vendorType.id}
                    type="radio"
                    name="vendor_type"
                  />
                  <label
                    className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
                    htmlFor={vendorType.id}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100 mix-blend-multiply">
                      {vendorType.name.toLowerCase() === VendorEnum.GOODS ? (
                        <PackageCheckIcon className="h-4 w-4 stroke-primary-600" />
                      ) : null}
                      {vendorType.name.toLowerCase() === VendorEnum.SUBSCRIPTIONS ? (
                        <Repeat03Icon className="h-4 w-4 stroke-primary-600" />
                      ) : null}
                      {vendorType.name.toLowerCase() === VendorEnum.MISC ? (
                        <Briefcase02Icon className="h-4 w-4 stroke-primary-600" />
                      ) : null}
                      {vendorType.name.toLowerCase() === VendorEnum.SERVICES ? (
                        <CoinsHandIcon className="h-4 w-4 stroke-primary-600" />
                      ) : null}
                      {vendorType.name.toLowerCase() === VendorEnum.TRAVEL ? (
                        <Globe05Icon className="h-4 w-4 stroke-primary-600" />
                      ) : null}
                      {vendorType.name.toLowerCase() === VendorEnum.EVENT ? (
                        <Globe05Icon className="h-4 w-4 stroke-primary-600" />
                      ) : null}
                      {vendorType.name.toLowerCase() === VendorEnum.CONSULTANT ? (
                        <Users03Icon className="h-4 w-4 stroke-primary-600" />
                      ) : null}
                    </div>
                    <p className="font-semibold capitalize text-gray-700 duration-300">{vendorType.name}</p>
                    <span className="ms-auto h-4 w-4 shrink-0 rounded-full border border-gray-300 bg-white bg-center bg-no-repeat duration-300"></span>
                  </label>
                </div>
              ))}
          </div>
          {errors?.vendor_type?.message && (
            <span className="input-hint-text error">{errors?.vendor_type?.message}</span>
          )}
        </div>

        <div className="sticky bottom-0 right-0 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
          <Button type="submit" btnType="normal" size="md" variant="secondary-gray">
            Next
            <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
          </Button>
          <button type="submit" className="hidden" ref={submitReference}></button>
        </div>
      </div>
    </form>
  )
}

/*  ===========================================================================
Vendor Information
===========================================================================  */

const getAllPics = async () => {
  const employee = await employeeApi.employeeControllerGetAllEmployee()
  const getPICs = employee.data.data.map((item: any) => ({
    id: item.id,
    name: item.full_name,
    avatarUrl: item.pass_photo_path,
  }))

  return getPICs
}

const getDetailEmployee = async (id: string) => {
  const employeeDetail = await employeeApi.employeeControllerGetEmployeeDetail(id)
  return employeeDetail.data.data
}

const VendorInformationSubPage = ({ submitReference, vendorIdChecker }: RefReferenceType) => {
  const router = useRouter()
  const { handleFormWizardHistory } = useAddVendorFormWizardProvider()
  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)
  const [pics, setPics] = useState<ComboboxType[]>([])
  const [categories, setCategories] = useState<ComboboxType[]>([])
  const [typeCategory, setTypeCategory] = useState<string | null>(null)
  const [categoriesValue, setCategoriesValue] = useState<ComboboxType[]>([])
  const [recommendedEmployee, setRecommendedEmployee] = useState<ComboboxType | null>(null)
  const [documentsPath, setDocumentsPath] = useState<object | null>(null)
  const [phoneNumberCode, setPhoneNumberCode] = useState<string>('+62')
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [choosenType, setChoosenType] = useState<VendorType>()
  const [nationalityIDDoc, setNationalityIDDoc] = useState([])
  const [otherDoc, setOtherDoc] = useState([])
  const [npwpDoc, setNpwpDoc] = useState([])
  const [cvDoc, setCVDoc] = useState([])
  const [codDoc, setCODDoc] = useState([])
  const [drivingLicenseDoc, setDrivingLicenseDoc] = useState([])
  const [vechileRegustrationDoc, setVechileRegustrationDoc] = useState([])
  const [vendorDetailData, setVendorDetailData] = useState<VendorDto | null>(null)
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    identity_path: boolean
    npwp_path: boolean
    cv_path: boolean
    cod_path: boolean
    other_path: boolean
    driving_license_path: boolean
    vechile_registration_path: boolean
  }>({
    identity_path: false,
    npwp_path: false,
    cv_path: false,
    cod_path: false,
    other_path: false,
    driving_license_path: false,
    vechile_registration_path: false,
  })
  const [linkCollections, setLinkCollections] = useState([])

  const {
    handleSubmit,
    register,
    control,
    setValue,
    getValues,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<
    VendorDto & {
      vendor_information: {
        name?: string
        description?: string
        location?: string
        website?: string
        organization_type?: string
        nationality?: string
        recommended_by?: ComboboxType
        pic?: string
        phone_number?: string
        email?: string
        identity_path?: string[]
        npwp_path?: string[]
        cv_path?: string[]
        cod_path?: string[]
        other_path?: string[]
        driving_license_path?: string[]
        vechile_registration_path?: string[]
      }
    }
  >({
    defaultValues: {
      vendor_information: {
        organization_type: 'individual',
        nationality: 'warga_negara_indonesia',
      },
    },
  })

  const phoneNumberhandler = (phoneCode: string) => {
    setPhoneNumberCode(phoneCode)
  }

  const gotoPrev = (totalSection: number) => {
    handleFormWizardHistory('vendorInformation', 'vendorType', totalSection)
  }

  const gotoNext = (totalSection: number) => {
    handleFormWizardHistory('vendorInformation', 'vendorPackages', totalSection)
  }

  let temporaryMultipleFileUpload = []
  const handleUploadFile = async (
    fileObjects: File[],
    bucketName: BucketsUnion,
    pathName?:
      | 'cod_path'
      | 'driving_license_path'
      | 'vechile_registration_path'
      | 'identity_path'
      | 'npwp_path'
      | 'cv_path'
      | 'other_path',
  ) => {
    const vendorId = vendorDetailData.id
    if (!Array.isArray(fileObjects)) return
    fileObjects.map(async (fileObject) => {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)
      let identifier = null

      if (pathName === 'other_path') {
        identifier = `${slugify(fileObject.name)}-${fileObject.lastModified}`
      } else {
        identifier = `${bucketName}-${pathName}`
      }

      const fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
        headers: {
          'Content-Type': fileObject.type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          // Mean if can upload more than one file
          if (pathName === 'other_path') {
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

      let vendorInformationUpdate = null

      switch (bucketName) {
        case BucketsEnum.employee_identity_card:
          const rulesIdentityPath = [`${BucketsEnum.employee_identity_card}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            identity_path: rulesIdentityPath,
          }))

          vendorInformationUpdate = {
            ...vendorDetailData,
            vendor_information: {
              identity_path: rulesIdentityPath,
            },
          }

          break
        case BucketsEnum.employee_npwp:
          const rulesEmployeeNPWP = [`${BucketsEnum.employee_npwp}/${fileNameS3}`]

          setDocumentsPath((prev) => ({
            ...prev,
            npwp_path: rulesEmployeeNPWP,
          }))

          vendorInformationUpdate = {
            ...vendorDetailData,
            vendor_information: {
              npwp_path: rulesEmployeeNPWP,
            },
          }
          break
        case BucketsEnum.employee_cv:
          const rulesEmployeeCV = [`${BucketsEnum.employee_cv}/${fileNameS3}`]

          setDocumentsPath((prev) => ({ ...prev, cv_path: rulesEmployeeCV }))

          vendorInformationUpdate = {
            ...vendorDetailData,
            vendor_information: {
              cv_path: rulesEmployeeCV,
            },
          }
          break
        case BucketsEnum.vendor_files:
          // THIS LINE EXCEPT ELSE COME BECAUSE OF NEW REQUIREMENT FROM DESIGN BUT INSERTED TO VENDOR FILES (NOT PROVIDE SPECIFIC BUCKET)
          if (pathName === 'cod_path') {
            const rulesCOD = [`${BucketsEnum.vendor_files}/${fileNameS3}`]

            setDocumentsPath((prev) => ({ ...prev, [pathName]: rulesCOD }))

            vendorInformationUpdate = {
              ...vendorDetailData,
              vendor_information: {
                [pathName]: rulesCOD,
              },
            }
            break
          } else if (pathName === 'driving_license_path') {
            const rulesDrivingLicense = [`${BucketsEnum.vendor_files}/${fileNameS3}`]

            setDocumentsPath((prev) => ({
              ...prev,
              [pathName]: rulesDrivingLicense,
            }))

            vendorInformationUpdate = {
              ...vendorDetailData,
              vendor_information: {
                [pathName]: rulesDrivingLicense,
              },
            }
            break
          } else if (pathName === 'vechile_registration_path') {
            const rulesVechileRegistration = [`${BucketsEnum.vendor_files}/${fileNameS3}`]

            setDocumentsPath((prev) => ({
              ...prev,
              [pathName]: rulesVechileRegistration,
            }))

            vendorInformationUpdate = {
              ...vendorDetailData,
              vendor_information: {
                [pathName]: rulesVechileRegistration,
              },
            }
            break
          } else {
            // SPECIAL FOR MULTIPLE FILE UPLOAD IN ONE DRAG
            const rulesVendorFiles = [`${BucketsEnum.vendor_files}/${fileNameS3}`]

            const otherPath = vendorDetailData.vendor_information['other_path']
              ? vendorDetailData.vendor_information['other_path']
              : []

            temporaryMultipleFileUpload = [...temporaryMultipleFileUpload, ...otherPath, ...rulesVendorFiles]

            const uniqueMultipleFileUpload = [...new Set(temporaryMultipleFileUpload)]

            setDocumentsPath((prev) => ({
              ...prev,
              other_path: [...uniqueMultipleFileUpload],
            }))

            vendorInformationUpdate = {
              ...vendorDetailData,
              vendor_information: {
                other_path: [...uniqueMultipleFileUpload],
              },
            }
            break
          }

        default:
          break
      }

      await vendorExternalApi.vendorControllerUpdateVendor(vendorId, {
        ...vendorInformationUpdate,
        vendor_categories: vendorDetailData.vendor_categories.map((item) => item.vendor_category_info_id),
      })
    })
  }

  const submitVendorInformation: SubmitHandler<VendorDto> = async (formInput) => {
    // Variable declration for radio button (because woth trigger a validation)
    let organization_type = undefined
    let nationality = undefined

    // Valdiation for categories
    if (categoriesValue.length === 0) {
      setError('vendor_categories', {
        type: 'required',
        message: 'Please select at least one category',
      })
      document.getElementById('vendor_categories').scrollIntoView({ behavior: 'smooth' })
      return false
    }
    // Validation for organization type
    if (typeCategory?.toLowerCase() !== VendorEnum.SUBSCRIPTIONS) {
      if (formInput.vendor_information['organization_type'] === undefined) {
        organization_type = 'individual' // fill with desired default value
      }
    }

    // Validation for nationality
    if (typeCategory?.toLowerCase() === VendorEnum.MISC || typeCategory?.toLowerCase() === VendorEnum.CONSULTANT) {
      if (formInput.vendor_information['nationality'] === undefined) {
        nationality = 'warga_negara_indonesia' // fill with desired default value
      }
    }

    if (
      switchTogglableButton.identity_path &&
      formInput.vendor_information['identity_path'] &&
      !isValidUrl(formInput.vendor_information['identity_path'] as unknown as string)
    ) {
      setError('vendor_information.identity_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.npwp_path &&
      formInput.vendor_information['npwp_path'] &&
      !isValidUrl(formInput.vendor_information['npwp_path'] as unknown as string)
    ) {
      setError('vendor_information.npwp_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.cv_path &&
      formInput.vendor_information['cv_path'] &&
      !isValidUrl(formInput.vendor_information['cv_path'] as unknown as string)
    ) {
      setError('vendor_information.cv_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.cod_path &&
      formInput.vendor_information['cod_path'] &&
      !isValidUrl(formInput.vendor_information['cod_path'] as unknown as string)
    ) {
      setError('vendor_information.cod_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.other_path &&
      formInput.vendor_information['other_path'] &&
      !isValidUrl(formInput.vendor_information['other_path'] as unknown as string)
    ) {
      setError('vendor_information.other_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.driving_license_path &&
      formInput.vendor_information['driving_license_path'] &&
      !isValidUrl(formInput.vendor_information['driving_license_path'] as unknown as string)
    ) {
      setError('vendor_information.driving_license_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.vechile_registration_path &&
      formInput.vendor_information['vechile_registration_path'] &&
      !isValidUrl(formInput.vendor_information['vechile_registration_path'] as unknown as string)
    ) {
      setError('vendor_information.vechile_registration_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }

    const vendorId = vendorDetailData?.id

    const vendorInformation = {
      name: formInput.vendor_information['name'],
      description: formInput.vendor_information['description'],
      organization_type: formInput.vendor_information['organization_type'] || organization_type,
      nationality: formInput.vendor_information['nationality'] || nationality,
      location: formInput.vendor_information['location'],
      recommended_by: formInput.vendor_information['recommended_by']?.id,
      pic: formInput.vendor_information['pic'],
      website: formInput.vendor_information['website'],
      phone_number: formInput.vendor_information['phone_number']
        ? `${phoneNumberCode}_${formInput.vendor_information['phone_number']}`
        : vendorDetailData.vendor_information['phone_number']?.split('_')[1] || null,
      email: formInput.vendor_information['email'],
      identity_path: switchTogglableButton.identity_path
        ? [`${formInput.vendor_information['identity_path']}`]
        : documentsPath
        ? documentsPath['identity_path'] || vendorDetailData.vendor_information['identity_path']
        : vendorDetailData.vendor_information['identity_path'],
      npwp_path: switchTogglableButton.npwp_path
        ? [`${formInput.vendor_information['npwp_path']}`]
        : documentsPath
        ? documentsPath['npwp_path'] || vendorDetailData.vendor_information['npwp_path']
        : vendorDetailData.vendor_information['npwp_path'],
      cv_path: switchTogglableButton.cv_path
        ? [`${formInput.vendor_information['cv_path']}`]
        : documentsPath
        ? documentsPath['cv_path'] || vendorDetailData.vendor_information['cv_path']
        : vendorDetailData.vendor_information['cv_path'],
      other_path: switchTogglableButton.other_path
        ? linkCollections
        : documentsPath
        ? documentsPath['other_path'] || vendorDetailData.vendor_information['other_path']
        : vendorDetailData.vendor_information['other_path'],
      cod_path: switchTogglableButton.cod_path
        ? [`${formInput.vendor_information['cod_path']}`]
        : documentsPath
        ? documentsPath['cod_path'] || vendorDetailData.vendor_information['cod_path']
        : vendorDetailData.vendor_information['cod_path'],
      driving_license_path: switchTogglableButton.driving_license_path
        ? [`${formInput.vendor_information['driving_license_path']}`]
        : documentsPath
        ? documentsPath['driving_license_path'] || vendorDetailData.vendor_information['driving_license_path']
        : vendorDetailData.vendor_information['driving_license_path'],
      vechile_registration_path: switchTogglableButton.vechile_registration_path
        ? [`${formInput.vendor_information['vechile_registration_path']}`]
        : documentsPath
        ? documentsPath['vechile_registration_path'] || vendorDetailData.vendor_information['vechile_registration_path']
        : vendorDetailData.vendor_information['vechile_registration_path'],
    }

    let totalDynamicField = 0
    switch (typeCategory?.toLowerCase()) {
      case VendorEnum.GOODS:
        totalDynamicField = 10
        if (
          categoriesValue.find((category) => category.name === 'IT/Peripherals') ||
          categoriesValue.find((category) => category.name === 'Equipment')
        ) {
          totalDynamicField++
        }
        break
      case VendorEnum.TRAVEL:
        totalDynamicField = 10
        break
      case VendorEnum.EVENT:
        totalDynamicField = 10
        if (
          categoriesValue.find((category) => category.name === UNFIX_TRANSPORT) ||
          categoriesValue.find((category) => category.name === 'Food Services') ||
          categoriesValue.find((category) => category.name === 'Event Organizer')
        ) {
          totalDynamicField++
        }
        // For Surat Izin Mengemudi (SIM)
        if (categoriesValue.find((category) => category.name === UNFIX_TRANSPORT)) {
          totalDynamicField++
        }
        // For Surat Tanda Nomor Kendaraan (STNK)
        if (categoriesValue.find((category) => category.name === UNFIX_TRANSPORT)) {
          totalDynamicField++
        }
        // For Curriculum Vitate (CV)
        if (categoriesValue.find((category) => category.name === 'Event Organizer')) {
          totalDynamicField++
        }
        break
      case VendorEnum.SUBSCRIPTIONS:
        totalDynamicField = 7
        break
      case VendorEnum.MISC:
        totalDynamicField = 11
        if (
          categoriesValue.find((category) => category.name === 'Auditor') ||
          categoriesValue.find((category) => category.name === 'Contractor')
        ) {
          totalDynamicField++
        }
        break
      case VendorEnum.CONSULTANT:
        totalDynamicField = 13
        if (vendorInformation.nationality === 'warga_negara_asing') {
          totalDynamicField++
        }
        break
      case VendorEnum.SERVICES:
        totalDynamicField = 13
        if (
          categoriesValue.find((category) => category.name === 'Key Person') ||
          categoriesValue.find((category) => category.name === 'Moderator')
        ) {
          totalDynamicField++
        }
        if (vendorInformation.nationality === 'warga_negara_asing') {
          totalDynamicField++
        }
        break
      default:
        break
    }

    // console.log('totalDynamicField', totalDynamicField)
    // return false

    const vendorValues = {
      ...vendorDetailData,
      vendor_categories: categoriesValue.map((item) => String(item.id)),
      vendor_information: vendorInformation,
    }

    await vendorExternalApi.vendorControllerUpdateVendor(vendorId, vendorValues)

    vendorIdChecker(vendorId)

    if (direction === 'next') {
      // Parameter inside gotoNext() special for vendor information because of dynamic type and category
      gotoNext(totalDynamicField)
    } else if (direction === 'prev') {
      // Parameter inside gotoPrev() special for vendor information because of dynamic type and category
      gotoPrev(totalDynamicField)
    }
  }

  const handleDeleteFile = (file: any, identifier: string) => {
    const fileCollections = vendorDetailData.vendor_information?.[identifier]

    const filteredFiles = fileCollections.filter((fileCollection) => fileCollection !== file)

    const vendorInformation = {
      ...vendorDetailData.vendor_information,
      [identifier]: filteredFiles,
    }

    const vendorValues = {
      ...vendorDetailData,
      vendor_categories: categoriesValue.map((item) => String(item.id)),
      vendor_information: vendorInformation,
    }

    const vendorRes = vendorExternalApi.vendorControllerUpdateVendor(vendorDetailData?.id, vendorValues)

    toast.promise(vendorRes, {
      pending: `Deleting ${file}`,
      success: `${isValidUrl(file) ? file : file.split('/').pop()} deleted`,
      error: 'Promise rejected 🤯',
    })

    vendorRes.then(() => {
      router.replace(router.asPath)
    })
  }

  const deleteNationalityIdentityFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['identity_path'] = prev['identity_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setNationalityIDDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteNpwpFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['npwp_path'] = prev['npwp_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setNpwpDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteDrivingLicenseFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['driving_license_path'] = prev['driving_license_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setDrivingLicenseDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteVechileRegistrationFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['vechile_registration_path'] = prev['vechile_registration_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setVechileRegustrationDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteCVFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['cv_path'] = prev['cv_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setCVDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteCODFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['cod_path'] = prev['cod_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setCODDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const deleteOtherFile = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['other_path'] = prev['other_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setOtherDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    setValue(
      'vendor_categories',
      vendorDetailData?.vendor_categories.map(
        (category) => category.vendor_category_info.name,
      ) as unknown as VendorCategoryCorelation[],
    )
    setCategoriesValue(
      vendorDetailData?.vendor_categories.map((item) => ({
        id: item.vendor_category_info_id,
        name: item.vendor_category_info.name,
      })),
    )
    setValue('vendor_information.name', vendorDetailData?.vendor_information['name'])
    setValue('vendor_information.description', vendorDetailData?.vendor_information['description'])
    setValue('vendor_information.organization_type', vendorDetailData?.vendor_information['organization_type'])
    const organization_type = document.getElementById(
      snakeCase(vendorDetailData?.vendor_information['organization_type'] || 'individual'),
    ) as HTMLInputElement

    if (organization_type !== null) {
      organization_type.checked = true
    }

    setValue('vendor_information.nationality', vendorDetailData?.vendor_information['nationality'])
    const nationality = document.getElementById(
      snakeCase(vendorDetailData?.vendor_information['nationality'] || 'warna_negara_indonesia'),
    ) as HTMLInputElement
    if (nationality !== null) {
      nationality.checked = true
    }

    setValue('vendor_information.location', vendorDetailData?.vendor_information['location'])
    setValue('vendor_information.recommended_by', recommendedEmployee)
    setValue('vendor_information.pic', vendorDetailData?.vendor_information['pic'])
    setValue('vendor_information.phone_number', vendorDetailData?.vendor_information['phone_number']?.split('_')[1])
    setPhoneNumberCode(vendorDetailData?.vendor_information['phone_number']?.split('_')[0] || phoneNumberCode)
    setValue('vendor_information.email', vendorDetailData?.vendor_information['email'])
    setValue('vendor_information.website', vendorDetailData?.vendor_information['website'])

    if (isValidUrl(vendorDetailData?.vendor_information?.['identity_path']?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        identity_path: true,
      }))
      setValue('vendor_information.identity_path', vendorDetailData.vendor_information?.['identity_path'])
    }
    if (isValidUrl(vendorDetailData?.vendor_information?.['npwp_path']?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        npwp_path: true,
      }))
      setValue('vendor_information.npwp_path', vendorDetailData.vendor_information?.['npwp_path'])
    }
    if (isValidUrl(vendorDetailData?.vendor_information?.['cv_path']?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        cv_path: true,
      }))
      setValue('vendor_information.cv_path', vendorDetailData.vendor_information?.['cv_path'])
    }
    if (isValidUrl(vendorDetailData?.vendor_information?.['cod_path']?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        cod_path: true,
      }))
      setValue('vendor_information.cod_path', vendorDetailData.vendor_information?.['cod_path'])
    }
    if (isValidUrl(vendorDetailData?.vendor_information?.['other_path']?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        other_path: true,
      }))
      // setValue(
      //   'vendor_information.other_path',
      //   vendorDetailData.vendor_information?.['other_path'],
      // )
      setLinkCollections(vendorDetailData.vendor_information?.['other_path'])
    }
    if (isValidUrl(vendorDetailData?.vendor_information?.['driving_license_path']?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        driving_license_path: true,
      }))
      setValue('vendor_information.driving_license_path', vendorDetailData.vendor_information?.['driving_license_path'])
    }
    if (isValidUrl(vendorDetailData?.vendor_information?.['vechile_registration_path']?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        vechile_registration_path: true,
      }))
      setValue(
        'vendor_information.vechile_registration_path',
        vendorDetailData.vendor_information?.['vechile_registration_path'],
      )
    }
  }, [vendorDetailData, setValue, recommendedEmployee])

  useEffect(() => {
    const getPIC = async () => {
      const pic = await getAllPics()
      setPics(pic)
    }
    getPIC()

    const getCategoriesRes = async () => {
      if (vendorDetailData?.id) {
        const categoriesRes = await getCategories(vendorDetailData?.vendor_type)
        setCategories(categoriesRes)
      }
    }
    getCategoriesRes()

    const getTypeDetail = async () => {
      if (vendorDetailData?.vendor_type) {
        const typeRes = await getVendorTypeDetail(vendorDetailData.vendor_type)
        setTypeCategory(typeRes.name)
      }
    }
    getTypeDetail()
  }, [vendorDetailData])

  useEffect(() => {
    const checkValue = vendorDetailData?.vendor_information['recommended_by']
    if (checkValue) {
      const getEmployee = async () => {
        const employeeDetail = await getDetailEmployee(vendorDetailData?.vendor_information['recommended_by'])
        setRecommendedEmployee({
          id: employeeDetail.id,
          name: employeeDetail.full_name,
          avatarUrl: employeeDetail.pass_photo_path,
        })
      }
      getEmployee()
    }
    // console.log('vendorInformation-data', vendorDetailData)
  }, [vendorDetailData])

  // useEffect(() => {
  //   vendorDetailTrigger()
  // }, [])

  useEffect(() => {
    if (categoriesValue?.length > 0) {
      clearErrors('vendor_categories')
    }
  }, [categoriesValue])

  useEffect(() => {
    const exec = async () => {
      if (vendorDetailData?.vendor_type) {
        const typeResult = await getVendorTypeDetail(vendorDetailData?.vendor_type)
        setChoosenType(typeResult)
      }
    }
    exec()
  }, [vendorDetailData])

  useEffect(() => {
    const exec = async () => {
      if (router?.query?.id) {
        const result = await getVendorDetail(router.query.id as string)
        setVendorDetailData(result)
      } else {
        const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
        if (vendorIdOnprogress) {
          const result = await getVendorDetail(vendorIdOnprogress)
          setVendorDetailData(result)
        }
      }
    }
    exec()

    // Notes: This is not a proper way to solve the problem, but for now the important things is solved for achieve a deadline
    setTimeout(() => {
      const triggerRevalidateVendorDetail = document.getElementById('triggerRevalidateVendorDetail')
      if (triggerRevalidateVendorDetail) {
        triggerRevalidateVendorDetail.click()
      }
    }, 600)
  }, [router])

  if (!vendorDetailData) {
    return <></>
  }

  return (
    <form onSubmit={handleSubmit(submitVendorInformation, errorSubmitData)} className="flex-auto">
      <button
        type="button"
        id="triggerRevalidateVendorDetail"
        onClick={async () => {
          if (router?.query?.id) {
            const result = await getVendorDetail(router.query.id as string)
            setVendorDetailData(result)
          } else {
            const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
            if (vendorIdOnprogress) {
              const result = await getVendorDetail(vendorIdOnprogress)
              setVendorDetailData(result)
            }
          }
        }}
      ></button>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Vendor Information</h2>

        <div className="form-data-container">
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">
                Vendor Type <span className="text-sm text-error-400">*</span>
              </p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="vendor_type" className="input-label">
                  Type
                </label>
                <div>
                  <label className="flex items-center gap-4 rounded-xl border border-gray-300 bg-gray-50 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100 mix-blend-multiply">
                      {typeCategory?.toLowerCase() === VendorEnum.GOODS && (
                        <PackageCheckIcon className="h-4 w-4 stroke-primary-600" />
                      )}
                      {typeCategory?.toLowerCase() === VendorEnum.SUBSCRIPTIONS && (
                        <Repeat03Icon className="h-4 w-4 stroke-primary-600" />
                      )}
                      {typeCategory?.toLowerCase() === VendorEnum.MISC && (
                        <Briefcase02Icon className="h-4 w-4 stroke-primary-600" />
                      )}
                      {typeCategory?.toLowerCase() === VendorEnum.SERVICES && (
                        <CoinsHandIcon className="h-4 w-4 stroke-primary-600" />
                      )}
                      {typeCategory?.toLowerCase() === VendorEnum.TRAVEL && (
                        <Globe05Icon className="h-4 w-4 stroke-primary-600" />
                      )}
                      {typeCategory?.toLowerCase() === VendorEnum.EVENT && (
                        <Globe05Icon className="h-4 w-4 stroke-primary-600" />
                      )}
                      {typeCategory?.toLowerCase() === VendorEnum.CONSULTANT && (
                        <Users03Icon className="h-4 w-4 stroke-primary-600" />
                      )}
                    </div>
                    <p className="font-semibold capitalize text-gray-700 duration-300">{typeCategory}</p>
                  </label>
                </div>
              </div>
              <div id="vendor_categories">
                <label htmlFor="vendor_categories" className="input-label">
                  Category
                </label>
                {categoriesValue?.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 shadow-xs">
                    {categoriesValue.map((item) => (
                      <div
                        key={`${item.id}-${slugify(item.name)}-${uuidv4()}`}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white py-0.5 pl-2 pr-1"
                      >
                        <p className="block text-sm font-medium capitalize text-gray-700">{item.name}</p>
                        <span
                          className="hover:cursor-pointer"
                          onClick={() => setCategoriesValue((prev) => prev.filter((i) => i.id !== item.id))}
                        >
                          <XCloseIcon className="h-3 w-3 stroke-gray-400" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <ComboboxAutocomplete
                  id="category"
                  placeholder="Choose one or more category"
                  handleChange={(category) => {
                    setCategoriesValue((prev) => {
                      const findDuplicateData = prev.find((item) => item.name === category.name)
                      if (findDuplicateData) return prev
                      return [...prev, category]
                    })
                  }}
                  listData={categories}
                  others="none"
                />
                {errors.vendor_categories && (
                  <p className="input-hint-text error !block">{errors.vendor_categories?.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">
                About Vendor <span className="text-sm text-error-400">*</span>
              </p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="vendor_information.name" className="input-label">
                  Name
                </label>
                <Controller
                  control={control}
                  rules={{ required: 'Vendor name is required field' }}
                  name="vendor_information.name"
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        type="text"
                        id="vendor_information.name"
                        placeholder="Name of vendor"
                        value={getValues('vendor_information.name') || ''}
                        onChange={onChange}
                        error={invalid}
                      />
                      {errors.vendor_information?.name && (
                        <span className="input-hint-text error">{errors.vendor_information?.name?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
              {choosenType?.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS && (
                <div>
                  <label htmlFor="vendor_information.organization_type" className="input-label">
                    Type of Organization
                  </label>
                  <div className="grid grid-cols-2 items-center gap-2">
                    {organizations.map((organization, index) => (
                      <div key={`${index}-${slugify(organization.text)}`}>
                        <input
                          {...register('vendor_information.organization_type', {
                            required: 'Organization type is required field',
                          })}
                          className="select-multiple standart hidden"
                          id={`${snakeCase(organization.text)}`}
                          value={`${snakeCase(organization.text)}`}
                          type="radio"
                          name="vendor_information.organization_type"
                        />
                        <label
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          htmlFor={`${snakeCase(organization.text)}`}
                        >
                          <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300 bg-white bg-center bg-no-repeat duration-300"></span>
                          <p className="font-medium text-gray-700 duration-300">{organization.text}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.vendor_information?.organization_type && (
                    <span className="input-hint-text error">
                      {errors.vendor_information?.organization_type?.message}
                    </span>
                  )}
                </div>
              )}

              {(choosenType?.name.toLowerCase() === VendorEnum.SERVICES ||
                choosenType?.name.toLowerCase() === VendorEnum.MISC ||
                choosenType?.name.toLowerCase() === VendorEnum.CONSULTANT) && (
                <div>
                  <label htmlFor="vendor_information.nationality" className="input-label">
                    Nationality
                  </label>
                  <div className="grid grid-cols-2 items-center gap-2">
                    {nationalities.map((nationality, index) => (
                      <div key={`${index}-${slugify(nationality.text)}`}>
                        <input
                          {...register('vendor_information.nationality', {
                            required: 'Nationality is required field',
                          })}
                          className="select-multiple standart hidden"
                          id={`${snakeCase(nationality.text)}`}
                          value={`${snakeCase(nationality.text)}`}
                          type="radio"
                          name="vendor_information.nationality"
                        />
                        <label
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          htmlFor={`${snakeCase(nationality.text)}`}
                        >
                          <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300 bg-white bg-center bg-no-repeat duration-300"></span>
                          <p className="font-medium text-gray-700 duration-300">{nationality.text}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.vendor_information?.nationality && (
                    <span className="input-hint-text error">{errors.vendor_information?.nationality?.message}</span>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="vendor_information.description" className="input-label">
                  Description / Scope of Work
                </label>
                <textarea
                  {...register('vendor_information.description', {
                    required: 'Vendor description is required field',
                  })}
                  id="notes"
                  className="textarea-input resize-none"
                  rows={5}
                  placeholder="Please describe the description or scope of work from this vendor"
                ></textarea>
                {errors.vendor_information?.description && (
                  <span className="input-hint-text error">{errors.vendor_information?.description?.message}</span>
                )}
              </div>
              {choosenType?.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS && (
                <div className="-mt-1">
                  <label htmlFor="vendor_information.location" className="input-label">
                    Location
                  </label>
                  <Controller
                    control={control}
                    name="vendor_information.location"
                    rules={{ required: 'Vendor location is required field' }}
                    render={({ field: { onChange } }) => (
                      <>
                        <Input
                          type="text"
                          id="vendor_information.location"
                          placeholder="Where the vendor located"
                          value={getValues('vendor_information.location') || ''}
                          onChange={onChange}
                        />
                        {errors.vendor_information?.location && (
                          <span className="input-hint-text error">{errors.vendor_information?.location?.message}</span>
                        )}
                      </>
                    )}
                  />
                </div>
              )}
              <div>
                <label htmlFor="vendor_information.recommended_by" className="input-label">
                  Recommended by
                </label>
                <Controller
                  control={control}
                  name="vendor_information.recommended_by"
                  rules={{
                    required: 'Vendor recommended by is required field',
                  }}
                  render={({ field: { onChange } }) => (
                    <>
                      <ComboboxAutocomplete
                        icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                        id="vendor_information.recommended_by"
                        placeholder="Select Puskapa Employee"
                        value={getValues('vendor_information.recommended_by')}
                        handleChange={(supervisor) => {
                          onChange(supervisor)
                        }}
                        listData={pics}
                        others="none"
                      />
                      {errors.vendor_information?.recommended_by && (
                        <span className="input-hint-text error">
                          {errors.vendor_information?.recommended_by?.message}
                        </span>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">About Partners</p>
            </div>
            <div className="form-data-content">
              {choosenType?.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS ? (
                <>
                  {choosenType?.name.toLowerCase() !== VendorEnum.CONSULTANT && (
                    <div>
                      <label htmlFor="vendor_information.pic" className="input-label">
                        PIC
                      </label>
                      <Controller
                        control={control}
                        name="vendor_information.pic"
                        render={({ field: { onChange } }) => (
                          <Input
                            type="text"
                            id="vendor_information.pic"
                            placeholder="Name of person in charge of this vendor"
                            value={getValues('vendor_information.pic') || ''}
                            onChange={onChange}
                          />
                        )}
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="vendor_information.phone_number" className="input-label">
                      Phone Number
                    </label>
                    <Controller
                      control={control}
                      name="vendor_information.phone_number"
                      render={({ field: { onChange } }) => (
                        <Input
                          type="number"
                          id="vendor_information.phone_number"
                          placeholder="Phone number to contact this vendor"
                          inputGroup={true}
                          inputSelectionHandler={phoneNumberhandler}
                          inputSelectionInit={phoneNumberCode}
                          inputSelectionValues={[
                            {
                              id: 'indonesia',
                              value: '+62',
                            },
                            {
                              id: 'united_kingdom',
                              value: '+44',
                            },
                          ]}
                          fixedWidthMenu="w-20"
                          onChange={onChange}
                          isPlaceholder={true}
                          value={
                            getValues('vendor_information.phone_number') ||
                            vendorDetailData?.vendor_information['phone_number'] ||
                            ''
                          }
                        />
                      )}
                    />
                  </div>
                </>
              ) : null}
              {choosenType?.name.toLowerCase() === VendorEnum.SUBSCRIPTIONS && (
                <>
                  <div>
                    <label htmlFor="vendor_information.website" className="input-label">
                      Location (Website)
                    </label>
                    <Controller
                      control={control}
                      name="vendor_information.website"
                      render={({ field: { onChange } }) => (
                        <Input
                          type="text"
                          groupText="https://"
                          groupTextPosition="start"
                          groupTextXAxisStyles="pl-[6.6rem]"
                          groupStyles="text-gray-600"
                          id="vendor_information.website"
                          placeholder="Subscription Vendor Website"
                          value={getValues('vendor_information.website') || ''}
                          onChange={onChange}
                        />
                      )}
                    />
                  </div>
                </>
              )}
              <div>
                <label htmlFor="vendor_information.email" className="input-label">
                  Email
                </label>
                <Controller
                  control={control}
                  name="vendor_information.email"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="email"
                      id="vendor_information.email"
                      placeholder="Email address to contact this vendor"
                      value={getValues('vendor_information.email') || ''}
                      onChange={onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Documents</p>
            </div>
            <div className="form-data-content">
              {(choosenType?.name.toLowerCase() === VendorEnum.SERVICES ||
                choosenType?.name.toLowerCase() === VendorEnum.CONSULTANT) && (
                <>
                  {choosenType?.name.toLowerCase() === VendorEnum.SERVICES ? (
                    <>
                      {categoriesValue?.some(
                        (category) => category.name === 'Key Person' || category.name === 'Moderator',
                      ) && (
                        <SwitchableUploadField
                          name="vendor_information.identity_path"
                          label="Nationality Identity Card"
                          fieldKey={BucketsEnum.employee_identity_card}
                          control={control}
                          errors={errors}
                          setValue={setValue}
                          isLinkMode={switchTogglableButton.identity_path}
                          onToggle={() => {
                            setSwitchTogglableButton((prev) => ({
                              ...prev,
                              identity_path: !prev.identity_path,
                            }))
                          }}
                          bucketName={BucketsEnum.employee_identity_card}
                          uploadProgress={tempProgressUpload}
                          uploadedFiles={nationalityIDDoc}
                          setUploadedFiles={setNationalityIDDoc}
                          handleUploadFile={(files, fieldKey) => {
                            handleUploadFile(files, fieldKey as BucketsUnion, 'identity_path')
                          }}
                          deleteFilePath={deleteNationalityIdentityFile}
                          existingFilePath={vendorDetailData?.vendor_information?.['identity_path']?.[0] || null}
                          handleDeleteExistingFile={() => {
                            const file = vendorDetailData?.vendor_information?.['identity_path']?.[0]
                            if (file) handleDeleteFile(file, 'identity_path')
                          }}
                          isEditMode={router.query?.path?.length > 0}
                          isRequired={false}
                        />
                      )}
                    </>
                  ) : (
                    <SwitchableUploadField
                      name="vendor_information.identity_path"
                      label="Nationality Identity Card"
                      fieldKey={BucketsEnum.employee_identity_card}
                      control={control}
                      errors={errors}
                      setValue={setValue}
                      isLinkMode={switchTogglableButton.identity_path}
                      onToggle={() => {
                        setSwitchTogglableButton((prev) => ({
                          ...prev,
                          identity_path: !prev.identity_path,
                        }))
                      }}
                      bucketName={BucketsEnum.employee_identity_card}
                      uploadProgress={tempProgressUpload}
                      uploadedFiles={nationalityIDDoc}
                      setUploadedFiles={setNationalityIDDoc}
                      handleUploadFile={(files, fieldKey) => {
                        handleUploadFile(files, fieldKey as BucketsUnion, 'identity_path')
                      }}
                      deleteFilePath={deleteNationalityIdentityFile}
                      existingFilePath={vendorDetailData?.vendor_information?.['identity_path']?.[0] || null}
                      handleDeleteExistingFile={() => {
                        const file = vendorDetailData?.vendor_information?.['identity_path']?.[0]
                        if (file) handleDeleteFile(file, 'identity_path')
                      }}
                      isEditMode={router.query?.path?.length > 0}
                      isRequired={false}
                    />
                  )}
                </>
              )}
              {choosenType?.name.toLowerCase() !== VendorEnum.TRAVEL &&
                choosenType?.name.toLowerCase() !== VendorEnum.SUBSCRIPTIONS && (
                  <>
                    {choosenType?.name.toLowerCase() === VendorEnum.GOODS ||
                    choosenType?.name.toLowerCase() === VendorEnum.EVENT ||
                    choosenType?.name.toLowerCase() === VendorEnum.MISC ? (
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
                          <SwitchableUploadField
                            name="vendor_information.npwp_path"
                            label="NPWP"
                            fieldKey={BucketsEnum.employee_npwp}
                            control={control}
                            errors={errors}
                            setValue={setValue}
                            isLinkMode={switchTogglableButton.npwp_path}
                            onToggle={() => {
                              setSwitchTogglableButton((prev) => ({
                                ...prev,
                                npwp_path: !prev.npwp_path,
                              }))
                            }}
                            bucketName={BucketsEnum.employee_npwp}
                            uploadProgress={tempProgressUpload}
                            uploadedFiles={npwpDoc}
                            setUploadedFiles={setNpwpDoc}
                            handleUploadFile={(files, fieldKey) => {
                              handleUploadFile(files, fieldKey as BucketsUnion, 'npwp_path')
                            }}
                            deleteFilePath={deleteNpwpFile}
                            existingFilePath={vendorDetailData?.vendor_information?.['npwp_path']?.[0] || null}
                            handleDeleteExistingFile={() => {
                              const file = vendorDetailData?.vendor_information?.['npwp_path']?.[0]
                              if (file) handleDeleteFile(file, 'npwp_path')
                            }}
                            isEditMode={router.query?.path?.length > 0}
                            isRequired={false}
                          />
                        )}
                      </>
                    ) : (
                      <SwitchableUploadField
                        name="vendor_information.npwp_path"
                        label="NPWP"
                        fieldKey={BucketsEnum.employee_npwp}
                        control={control}
                        errors={errors}
                        setValue={setValue}
                        isLinkMode={switchTogglableButton.npwp_path}
                        onToggle={() => {
                          setSwitchTogglableButton((prev) => ({
                            ...prev,
                            npwp_path: !prev.npwp_path,
                          }))
                        }}
                        bucketName={BucketsEnum.employee_npwp}
                        uploadProgress={tempProgressUpload}
                        uploadedFiles={npwpDoc}
                        setUploadedFiles={setNpwpDoc}
                        handleUploadFile={(files, fieldKey) => {
                          handleUploadFile(files, fieldKey as BucketsUnion, 'npwp_path')
                        }}
                        deleteFilePath={deleteNpwpFile}
                        existingFilePath={vendorDetailData?.vendor_information?.['npwp_path']?.[0] || null}
                        handleDeleteExistingFile={() => {
                          const file = vendorDetailData?.vendor_information?.['npwp_path']?.[0]
                          if (file) handleDeleteFile(file, 'npwp_path')
                        }}
                        isEditMode={router.query?.path?.length > 0}
                        isRequired={false}
                      />
                    )}
                  </>
                )}

              {choosenType?.name.toLowerCase() === VendorEnum.EVENT && (
                <>
                  {categoriesValue?.some((category) => category.name === 'Transportation') && (
                    <>
                      <SwitchableUploadField
                        name="vendor_information.driving_license_path"
                        label="Surat Izin Mengemudi (SIM)"
                        fieldKey={BucketsEnum.vendor_files}
                        control={control}
                        errors={errors}
                        setValue={setValue}
                        isLinkMode={switchTogglableButton.driving_license_path}
                        onToggle={() => {
                          setSwitchTogglableButton((prev) => ({
                            ...prev,
                            driving_license_path: !prev.driving_license_path,
                          }))
                        }}
                        bucketName={BucketsEnum.vendor_files}
                        uploadProgress={tempProgressUpload}
                        uploadedFiles={drivingLicenseDoc}
                        setUploadedFiles={setDrivingLicenseDoc}
                        handleUploadFile={(files, fieldKey) => {
                          handleUploadFile(files, fieldKey as BucketsUnion, 'driving_license_path')
                        }}
                        deleteFilePath={deleteDrivingLicenseFile}
                        existingFilePath={vendorDetailData?.vendor_information?.['driving_license_path']?.[0] || null}
                        handleDeleteExistingFile={() => {
                          const file = vendorDetailData?.vendor_information?.['driving_license_path']?.[0]
                          if (file) handleDeleteFile(file, 'driving_license_path')
                        }}
                        isEditMode={router.query?.path?.length > 0}
                        isRequired={false}
                      />
                      <SwitchableUploadField
                        name="vendor_information.vechile_registration_path"
                        label="Surat Tanda Nomor Kendaraan (STNK)"
                        fieldKey={BucketsEnum.vendor_files}
                        control={control}
                        errors={errors}
                        setValue={setValue}
                        isLinkMode={switchTogglableButton.vechile_registration_path}
                        onToggle={() => {
                          setSwitchTogglableButton((prev) => ({
                            ...prev,
                            vechile_registration_path: !prev.vechile_registration_path,
                          }))
                        }}
                        bucketName={BucketsEnum.vendor_files}
                        uploadProgress={tempProgressUpload}
                        uploadedFiles={vechileRegustrationDoc}
                        setUploadedFiles={setVechileRegustrationDoc}
                        handleUploadFile={(files, fieldKey) => {
                          handleUploadFile(files, fieldKey as BucketsUnion, 'vechile_registration_path')
                        }}
                        deleteFilePath={deleteVechileRegistrationFile}
                        existingFilePath={
                          vendorDetailData?.vendor_information?.['vechile_registration_path']?.[0] || null
                        }
                        handleDeleteExistingFile={() => {
                          const file = vendorDetailData?.vendor_information?.['vechile_registration_path']?.[0]
                          if (file) handleDeleteFile(file, 'vechile_registration_path')
                        }}
                        isEditMode={router.query?.path?.length > 0}
                        isRequired={false}
                      />
                    </>
                  )}
                </>
              )}

              {choosenType?.name.toLowerCase() === VendorEnum.EVENT &&
                categoriesValue?.some((category) => category.name === 'Event Organizer') && (
                  <SwitchableUploadField
                    name="vendor_information.cv_path"
                    label="Curriculum Vitae (CV)"
                    fieldKey={BucketsEnum.employee_cv}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    isLinkMode={switchTogglableButton.cv_path}
                    onToggle={() => {
                      setSwitchTogglableButton((prev) => ({
                        ...prev,
                        cv_path: !prev.cv_path,
                      }))
                    }}
                    bucketName={BucketsEnum.employee_cv}
                    uploadProgress={tempProgressUpload}
                    uploadedFiles={cvDoc}
                    setUploadedFiles={setCVDoc}
                    handleUploadFile={(files, fieldKey) => {
                      handleUploadFile(files, fieldKey as BucketsUnion, 'cv_path')
                    }}
                    deleteFilePath={deleteCVFile}
                    existingFilePath={vendorDetailData?.vendor_information?.['cv_path']?.[0] || null}
                    handleDeleteExistingFile={() => {
                      const file = vendorDetailData?.vendor_information?.['cv_path']?.[0]
                      if (file) handleDeleteFile(file, 'cv_path')
                    }}
                    isEditMode={router.query?.path?.length > 0}
                    isRequired={false}
                  />
                )}

              {(choosenType?.name.toLowerCase() === VendorEnum.SERVICES ||
                choosenType?.name.toLowerCase() === VendorEnum.CONSULTANT) && (
                <>
                  <SwitchableUploadField
                    name="vendor_information.cv_path"
                    label="Curriculum Vitae (CV)"
                    fieldKey={BucketsEnum.employee_cv}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    isLinkMode={switchTogglableButton.cv_path}
                    onToggle={() => {
                      setSwitchTogglableButton((prev) => ({
                        ...prev,
                        cv_path: !prev.cv_path,
                      }))
                    }}
                    bucketName={BucketsEnum.employee_cv}
                    uploadProgress={tempProgressUpload}
                    uploadedFiles={cvDoc}
                    setUploadedFiles={setCVDoc}
                    handleUploadFile={(files, fieldKey) => {
                      handleUploadFile(files, fieldKey as BucketsUnion, 'cv_path')
                    }}
                    deleteFilePath={deleteCVFile}
                    existingFilePath={vendorDetailData?.vendor_information?.['cv_path']?.[0] || null}
                    handleDeleteExistingFile={() => {
                      const file = vendorDetailData?.vendor_information?.['cv_path']?.[0]
                      if (file) handleDeleteFile(file, 'cv_path')
                    }}
                    isEditMode={router.query?.path?.length > 0}
                    isRequired={false}
                  />

                  {watch('vendor_information.nationality') === 'warga_negara_asing' ? (
                    <SwitchableUploadField
                      name="vendor_information.cod_path"
                      label="Certificate of Domicile (CoD)"
                      fieldKey={BucketsEnum.vendor_files}
                      control={control}
                      errors={errors}
                      setValue={setValue}
                      isLinkMode={switchTogglableButton.cod_path}
                      onToggle={() => {
                        setSwitchTogglableButton((prev) => ({
                          ...prev,
                          cod_path: !prev.cod_path,
                        }))
                      }}
                      bucketName={BucketsEnum.vendor_files}
                      uploadProgress={tempProgressUpload}
                      uploadedFiles={codDoc}
                      setUploadedFiles={setCODDoc}
                      handleUploadFile={(files, fieldKey) => {
                        handleUploadFile(files, fieldKey as BucketsUnion, 'cod_path')
                      }}
                      deleteFilePath={deleteCODFile}
                      existingFilePath={vendorDetailData?.vendor_information?.['cod_path']?.[0] || null}
                      handleDeleteExistingFile={() => {
                        const file = vendorDetailData?.vendor_information?.['cod_path']?.[0]
                        if (file) handleDeleteFile(file, 'cod_path')
                      }}
                      isEditMode={router.query?.path?.length > 0}
                      isRequired={false}
                    />
                  ) : null}
                </>
              )}

              <SwitchableUploadFieldMultiple
                name="vendor_information.other_path"
                label={`${
                  choosenType?.name.toLowerCase() === VendorEnum.SERVICES ||
                  choosenType?.name.toLowerCase() === VendorEnum.CONSULTANT
                    ? 'Other '
                    : ''
                }Supporting Documents (Optional)`}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.other_path}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    other_path: !prev.other_path,
                  }))
                  setOtherDoc([])
                  setLinkCollections([])
                }}
                linkCollections={linkCollections}
                setLinkCollections={setLinkCollections}
                bucketName={BucketsEnum.vendor_files}
                uploadProgress={tempProgressUpload}
                uploadedFiles={otherDoc}
                setUploadedFiles={setOtherDoc}
                handleUploadFile={(files) => handleUploadFile(files, BucketsEnum.vendor_files, 'other_path')}
                deleteFilePath={deleteOtherFile}
                maxFiles={10}
                informationText="IMAGE or DOCUMENTS (max 5MB each file)"
                existingFiles={vendorDetailData?.vendor_information?.['other_path']}
                handleDeleteExistingFile={(file) => handleDeleteFile(file, 'other_path')}
                existingFileBucketCheck={BucketsEnum.vendor_files}
                isEditMode={!!router?.query?.id}
                isRequired={false}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 right-0 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
          <Button
            type="submit"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => setDirection('prev')}
          >
            <ChevronLeftIcon className="h-5 w-5 stroke-gray-700" />
            Back
          </Button>
          <Button
            type="submit"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => setDirection('next')}
          >
            Next
            <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
          </Button>
          <button type="submit" className="hidden" ref={submitReference} onClick={() => setDirection(null)}></button>
        </div>
      </div>
    </form>
  )
}

/*  ===========================================================================
Vendor Packages
===========================================================================  */

type VendorPackageCustom = {
  package_currency_price?: string
} & VendorPackage

const VendorPackagesSubPage = ({ submitReference, vendorIdChecker }: RefReferenceType) => {
  const router = useRouter()
  const { handleFormWizardHistory } = useAddVendorFormWizardProvider()
  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)
  const [vendorPackages, setVendorPackages] = useState<VendorPackageCustom[]>([])
  // console.log('vendorPackages-xxxx', vendorPackages)

  const [currencyCode, setCurrencyCode] = useState<string>('IDR')

  // const [vendorPackage, setVendorPackage] =
  //   useState<VendorPackageCustom | null>(null)

  const gotoPrev = () => {
    handleFormWizardHistory('vendorPackages', 'vendorInformation', VENDOR_PACKAGES_TOTAL_PAGE)
  }

  const gotoNext = () => {
    handleFormWizardHistory('vendorPackages', 'vendorPayment', VENDOR_PACKAGES_TOTAL_PAGE)
  }
  const [vendorDetailData, setVendorDetailData] = useState<VendorDto | null>(null)
  const { handleSubmit, control, setValue, getValues } = useForm<VendorDto & VendorPackageCustom>()

  const packageCurrencyHandler = (currencyCode: string) => {
    setCurrencyCode(currencyCode)
  }

  const submitVendorPackages: SubmitHandler<VendorDto> = async () => {
    const vendorId = vendorDetailData?.id

    const vendorValues = {
      ...vendorDetailData,
      vendor_categories: vendorDetailData.vendor_categories.map((category) => category.vendor_category_info_id),
      vendor_packages: vendorPackages,
    }

    await vendorExternalApi.vendorControllerUpdateVendor(vendorId, vendorValues)

    vendorIdChecker(vendorId)

    if (direction === 'next') {
      gotoNext()
    } else if (direction === 'prev') {
      gotoPrev()
    }
  }

  const handleEmergencyContactAction = (contactId: string, action: string) => {
    const packageName = document.getElementById('name') as HTMLInputElement
    const packageUnit = document.getElementById('unit') as HTMLInputElement
    const priceCurrency = document.getElementById('package_currency_price') as HTMLInputElement
    if (action === 'edit') {
      document.querySelector('#vendor-button-text').innerHTML = 'Update Vendor Package'
      const contactDetail = vendorPackages.find((item) => item.id === contactId)
      packageName.value = contactDetail.name
      packageUnit.value = contactDetail.unit
      priceCurrency.value = contactDetail.package_currency_price
        ? contactDetail.package_currency_price?.split('_')[1]
        : String(contactDetail.price)

      setValue('id', contactDetail.id)
      setValue('name', contactDetail.name)
      setValue('unit', contactDetail.unit)
      setValue('currency', contactDetail.currency)
      setValue('price', contactDetail.price)
      setValue(
        'package_currency_price',
        contactDetail.package_currency_price
          ? contactDetail.package_currency_price?.split('_')[1]
          : String(contactDetail.price),
      )
      packageCurrencyHandler(
        contactDetail.package_currency_price
          ? contactDetail.package_currency_price?.split('_')[0]
          : contactDetail.currency,
      )
    }
    if (action === 'delete') {
      setVendorPackages((prev) => prev.filter((item) => item.id !== contactId))
    }
  }

  const addDynamicEmergencyContacts = () => {
    if (!getValues('name') || !getValues('unit') || !getValues('package_currency_price')) {
      toast.warning('Please fill all emergency contact information')
      return false
    }
    const packageName = document.getElementById('name') as HTMLInputElement
    const packageUnit = document.getElementById('unit') as HTMLInputElement
    const priceCurrency = document.getElementById('package_currency_price') as HTMLInputElement

    const newEmergencyContact = {
      id: getValues('id') || String(uuidv4()),
      name: getValues('name'),
      unit: getValues('unit'),
      price: Number(getValues('package_currency_price')),
      currency: currencyCode,
      package_currency_price: `${currencyCode}_${convertStringCurrency(getValues('package_currency_price'))}`,
    }

    const cleanData: VendorPackageCustom[] = Object.values(
      [...vendorPackages, newEmergencyContact].reduce((acc, cur) => Object.assign(acc, { [cur.id]: cur }), {}),
    )

    setVendorPackages(cleanData)

    packageName.value = null
    packageUnit.value = null
    priceCurrency.value = null

    setValue('id', null)
    setValue('name', null)
    setValue('unit', null)
    setValue('price', null)
    setValue('currency', null)
    setValue('package_currency_price', null)

    packageCurrencyHandler('IDR')
    document.querySelector('#vendor-button-text').innerHTML = 'Add as Vendor Package'
  }

  useEffect(() => {
    if (vendorDetailData?.vendor_packages) {
      setVendorPackages(vendorDetailData?.vendor_packages)
    }
  }, [vendorDetailData, setValue])

  useEffect(() => {
    const exec = async () => {
      if (router?.query?.id) {
        const result = await getVendorDetail(router.query.id as string)
        setVendorDetailData(result)
      } else {
        const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
        if (vendorIdOnprogress) {
          const result = await getVendorDetail(vendorIdOnprogress)
          setVendorDetailData(result)
        }
      }
    }
    exec()

    setTimeout(() => {
      document.getElementById('triggerRevalidateVendorDetail').click()
    }, 600)
  }, [router])

  if (!vendorDetailData) {
    return <></>
  }

  return (
    <form onSubmit={handleSubmit(submitVendorPackages, errorSubmitData)} className="flex-auto">
      <button
        type="button"
        id="triggerRevalidateVendorDetail"
        onClick={async () => {
          if (router?.query?.id) {
            const result = await getVendorDetail(router.query.id as string)
            setVendorDetailData(result)
          } else {
            const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
            if (vendorIdOnprogress) {
              const result = await getVendorDetail(vendorIdOnprogress)
              setVendorDetailData(result)
            }
          }
        }}
      ></button>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Vendor Package</h2>

        <div className="form-data-container">
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Vendor Type</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="vendor_type" className="input-label">
                  Type
                </label>
                <div>
                  <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-300 bg-gray-50 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100 mix-blend-multiply">
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.GOODS && <PackageCheckIcon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.SUBSCRIPTIONS && <Repeat03Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.MISC && <Briefcase02Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.SERVICES && <CoinsHandIcon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.TRAVEL && <Globe05Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.EVENT && <Globe05Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.CONSULTANT && <Users03Icon className="h-4 w-4 stroke-primary-600" />}
                    </div>
                    <p className="font-semibold capitalize text-gray-700 duration-300">
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name}
                    </p>
                  </label>
                </div>
              </div>
              <div id="vendor_categories">
                <label htmlFor="vendor_categories" className="input-label">
                  Category
                </label>
                {vendorDetailData?.vendor_categories?.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 shadow-xs">
                    {vendorDetailData?.vendor_categories.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-0.5"
                      >
                        <span className="block select-none text-sm font-medium capitalize text-gray-700">
                          {item.vendor_category_info.name}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="form-data-item items-start">
            <div className="form-data-information">
              <p className="form-data-title">Package</p>
            </div>
            <div className="form-data-content">
              {vendorPackages.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-gray-300 py-4 pl-6 pr-4"
                >
                  <div className="inline-flex items-center gap-6">
                    <span className="text-sm font-medium text-gray-900">{index < 9 ? `0${++index}` : ++index}</span>
                    <p className="w-44 text-sm font-medium text-gray-900">{item.name}</p>
                    <span className="text-sm font-medium text-gray-900">/{item.unit}</span>
                  </div>
                  <div className="flex items-center text-right">
                    <p className="mr-6 text-sm font-medium text-gray-900">
                      {item.package_currency_price
                        ? formatCurrency(
                            item.package_currency_price.split('_')[0] as CurrencyUnion,
                            Number(item.package_currency_price.split('_')[1]),
                          )
                        : formatCurrency(item.currency as CurrencyUnion, Number(item.price))}{' '}
                      {item.currency !== 'IDR' ? `(${item.currency})` : null}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        btnType="normal"
                        size="sm"
                        variant="secondary-gray"
                        btnFormat="square"
                        onClick={() => handleEmergencyContactAction(item.id, 'delete')}
                      >
                        <Trash01Icon className="h-5 w-5 stroke-gray-700" />
                      </Button>
                      <Button
                        type="button"
                        btnType="normal"
                        size="sm"
                        variant="secondary-gray"
                        btnFormat="square"
                        onClick={() => handleEmergencyContactAction(item.id, 'edit')}
                      >
                        <Edit01Icon className="h-5 w-5 stroke-gray-700" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="flex flex-col gap-6 rounded-lg border border-gray-300 p-6"
                id="dynamic-emergency-contacts"
              >
                <div>
                  <label htmlFor="name" className="input-label">
                    Package Name
                  </label>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange } }) => (
                      <Input
                        type="text"
                        id="name"
                        placeholder="Name"
                        value={getValues('name') || ''}
                        onChange={onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="unit" className="input-label">
                    Package Unit
                  </label>
                  <Controller
                    control={control}
                    name="unit"
                    render={({ field: { onChange } }) => (
                      <Input
                        type="text"
                        groupText="/"
                        groupTextPosition="start"
                        groupTextXAxisStyles="pl-[3.2rem]"
                        groupStyles="text-gray-600"
                        id="unit"
                        placeholder="Unit"
                        value={getValues('unit') || ''}
                        onChange={onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="package_currency_price" className="input-label">
                    Price
                  </label>
                  <Controller
                    control={control}
                    name="package_currency_price"
                    render={({ field: { onChange, ref, value } }) => (
                      <Input
                        inputRef={ref}
                        type="number"
                        id="package_currency_price"
                        placeholder="Price"
                        isCurrency={true}
                        inputGroup={true}
                        inputSelectionHandler={packageCurrencyHandler}
                        inputSelectionInit={currencyCode}
                        inputSelectionValues={[
                          {
                            id: 'id',
                            value: 'IDR',
                          },
                          {
                            id: 'us',
                            value: 'USD',
                          },
                          {
                            id: 'au',
                            value: 'AUD',
                          },
                        ]}
                        fixedWidthMenu="w-20"
                        onChange={onChange}
                        isPlaceholder={true}
                        value={value}
                      />
                    )}
                  />
                </div>
                <Button
                  type="button"
                  btnType="normal"
                  size="sm"
                  variant="secondary-gray"
                  // eslint-disable-next-line tailwindcss/no-custom-classname
                  className="submit-contact justify-center"
                  onClick={addDynamicEmergencyContacts}
                >
                  <p id="vendor-button-text">Add as Vendor Package</p>
                  <PackageIcon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 right-0 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
          <Button
            type="submit"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => setDirection('prev')}
          >
            <ChevronLeftIcon className="h-5 w-5 stroke-gray-700" />
            Back
          </Button>
          <Button
            type="submit"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => setDirection('next')}
          >
            Next
            <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
          </Button>
          <button type="submit" className="hidden" ref={submitReference} onClick={() => setDirection(null)}></button>
        </div>
      </div>
    </form>
  )
}

/*  ===========================================================================
Vendor Payment
===========================================================================  */

const VendorPaymentSubPage = ({ submitReference, vendorIdChecker }: RefReferenceType) => {
  const router = useRouter()
  const { handleFormWizardHistory } = useAddVendorFormWizardProvider()
  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)
  const [vendorDetailData, setVendorDetailData] = useState<VendorDto | null>(null)

  const { handleSubmit, control, setValue, getValues } = useForm<VendorDto>()

  const submitPaymentData: SubmitHandler<VendorDto> = async (formInput) => {
    const vendorId = vendorDetailData?.id

    const vendorPayment = {
      ...vendorDetailData,
      vendor_payment: {
        bank_name: formInput.vendor_payment.bank_name,
        bank_branch: formInput.vendor_payment.bank_branch,
        bank_acc_number: formInput.vendor_payment.bank_acc_number,
        bank_acc_name: formInput.vendor_payment.bank_acc_name,
        swift_code: formInput.vendor_payment.swift_code,
      },
      vendor_categories: vendorDetailData.vendor_categories.map((category) => category.vendor_category_info_id),
    }

    await vendorExternalApi.vendorControllerUpdateVendor(vendorId, vendorPayment)

    vendorIdChecker(vendorId)

    if (direction === 'next') {
      gotoNext()
    } else if (direction === 'prev') {
      gotoPrev()
    }
  }

  const gotoPrev = () => {
    handleFormWizardHistory('vendorPayment', 'vendorPackages', VENDOR_PAYMENT_TOTAL_PAGE)
  }

  const gotoNext = () => {
    handleFormWizardHistory('vendorPayment', 'vendorPayment', VENDOR_PAYMENT_TOTAL_PAGE)
    localStorage.setItem('vendor_id_onprogress', JSON.stringify(null))
    router.replace('/dashboard/external/vendor-adm')
  }

  useEffect(() => {
    setValue('vendor_payment.bank_name', vendorDetailData?.vendor_payment.bank_name)
    setValue('vendor_payment.bank_branch', vendorDetailData?.vendor_payment.bank_branch)
    setValue('vendor_payment.bank_acc_number', vendorDetailData?.vendor_payment.bank_acc_number)
    setValue('vendor_payment.bank_acc_name', vendorDetailData?.vendor_payment.bank_acc_name)
    setValue('vendor_payment.swift_code', vendorDetailData?.vendor_payment.swift_code)
  }, [vendorDetailData, setValue])

  useEffect(() => {
    const exec = async () => {
      if (router?.query?.id) {
        const result = await getVendorDetail(router.query.id as string)
        setVendorDetailData(result)
      } else {
        const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
        if (vendorIdOnprogress) {
          const result = await getVendorDetail(vendorIdOnprogress)
          setVendorDetailData(result)
        }
      }
    }
    exec()

    setTimeout(() => {
      document.getElementById('triggerRevalidateVendorDetail').click()
    }, 600)
  }, [router])

  if (!vendorDetailData) {
    return <></>
  }

  return (
    <form onSubmit={handleSubmit(submitPaymentData, errorSubmitData)} className="flex-auto">
      <button
        type="button"
        id="triggerRevalidateVendorDetail"
        onClick={async () => {
          if (router?.query?.id) {
            const result = await getVendorDetail(router.query.id as string)
            setVendorDetailData(result)
          } else {
            const vendorIdOnprogress = JSON.parse(localStorage.getItem('vendor_id_onprogress'))
            if (vendorIdOnprogress) {
              const result = await getVendorDetail(vendorIdOnprogress)
              setVendorDetailData(result)
            }
          }
        }}
      ></button>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Vendor Package</h2>

        <div className="form-data-container">
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Vendor Type</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="vendor_type" className="input-label">
                  Type
                </label>
                <div>
                  <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-300 bg-gray-50 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100 mix-blend-multiply">
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.GOODS && <PackageCheckIcon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.SUBSCRIPTIONS && <Repeat03Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.MISC && <Briefcase02Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.SERVICES && <CoinsHandIcon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.TRAVEL && <Globe05Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.EVENT && <Globe05Icon className="h-4 w-4 stroke-primary-600" />}
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                        VendorEnum.CONSULTANT && <Users03Icon className="h-4 w-4 stroke-primary-600" />}
                    </div>
                    <p className="font-semibold capitalize text-gray-700 duration-300">
                      {vendorDetailData?.vendor_categories[0]?.vendor_category_info.vendor_type.name}
                    </p>
                  </label>
                </div>
              </div>
              <div id="vendor_categories">
                <label htmlFor="vendor_categories" className="input-label">
                  Category
                </label>
                {vendorDetailData?.vendor_categories?.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 shadow-xs">
                    {vendorDetailData?.vendor_categories.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-0.5"
                      >
                        <span className="block select-none text-sm font-medium capitalize text-gray-700">
                          {item.vendor_category_info.name}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="form-data-item items-start">
            <div className="form-data-information">
              <p className="form-data-title">Bank Data</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="vendor_payment.bank_acc_name" className="input-label">
                  Account Holder Name
                </label>
                <Controller
                  control={control}
                  name="vendor_payment.bank_acc_name"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="vendor_payment.bank_acc_name"
                      placeholder="Account Holder Name"
                      onChange={onChange}
                      value={getValues('vendor_payment.bank_acc_name') || ''}
                    />
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label htmlFor="vendor_payment.bank_name" className="input-label">
                    Bank Name
                  </label>
                  <Controller
                    control={control}
                    name="vendor_payment.bank_name"
                    render={({ field: { onChange } }) => (
                      <Input
                        type="text"
                        id="vendor_payment.bank_name"
                        placeholder="Bank Name"
                        onChange={onChange}
                        value={getValues('vendor_payment.bank_name') || ''}
                      />
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="vendor_payment.bank_branch" className="input-label">
                    Branch Name
                  </label>
                  <Controller
                    control={control}
                    name="vendor_payment.bank_branch"
                    render={({ field: { onChange } }) => (
                      <Input
                        type="text"
                        id="vendor_payment.bank_branch"
                        placeholder="Bank Branch Name"
                        onChange={onChange}
                        value={getValues('vendor_payment.bank_branch') || ''}
                      />
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="vendor_payment.bank_acc_number" className="input-label">
                    Bank Number
                  </label>
                  <Controller
                    control={control}
                    name="vendor_payment.bank_acc_number"
                    render={({ field: { onChange } }) => (
                      <Input
                        type="number"
                        id="vendor_payment.bank_acc_number"
                        placeholder="Bank Number"
                        onChange={onChange}
                        value={getValues('vendor_payment.bank_acc_number') || ''}
                      />
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="vendor_payment.swift_code" className="input-label">
                    SWIFT Code
                  </label>
                  <Controller
                    control={control}
                    name="vendor_payment.swift_code"
                    render={({ field: { onChange } }) => (
                      <Input
                        type="text"
                        id="vendor_payment.swift_code"
                        placeholder="SWIFT Code"
                        onChange={onChange}
                        value={getValues('vendor_payment.swift_code') || ''}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 right-0 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
          <Button
            type="submit"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => setDirection('prev')}
          >
            <ChevronLeftIcon className="h-5 w-5 stroke-gray-700" />
            Back
          </Button>
          <Button type="submit" btnType="normal" size="md" variant="secondary" onClick={() => setDirection('next')}>
            Submit New Vendor
            <ChevronRightIcon className="h-5 w-5 stroke-primary-700" />
          </Button>
          <button type="submit" className="hidden" ref={submitReference} onClick={() => setDirection(null)}></button>
        </div>
      </div>
    </form>
  )
}

const errorSubmitData = (errors: any) => {
  for (const error of Object.values(errors)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (error.ref) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const elementReference = error.ref.name

      document.getElementById(elementReference).closest('div').scrollIntoView({ behavior: 'smooth' })
      break
    }
  }
}
