import { Button } from '@/components/Button'
import { ComboboxAutocomplete } from '@/components/ComboboxAutocomplete'
import { Input } from '@/components/Input'
import { ListboxSelect } from '@/components/ListboxSelect'
import { SwitchableUploadFieldMultiple } from '@/components/SwitchableUploadFieldMultiple'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { User01Icon } from '@/components/icon/User01Icon'
import { cn } from '@/lib/utils'
import { useAddProgramFormWizardProvider } from '@/providers/AddProgramFormWizardProvider'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { BucketsUnion, ComboboxType, DynamicProgressType } from '@/types/global'
import {
  employeeApi,
  fileApi,
  getProgramDetail,
  partnerApi,
  programApi,
  supervisorByEmployee,
} from '@/utils/apiRequestHelper'
import { MONTHS } from '@/utils/constant'
import {
  getMonthDuration,
  monthNumberToString,
  monthStringToNumber,
  removeSpecialChars,
  slugify,
  snakeCase,
  titleCase,
} from '@/utils/globalHelper'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import 'react-circular-progressbar/dist/styles.css'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import 'react-tagsinput/react-tagsinput.css'
import { toast } from 'react-toastify'
import { ProgramCreateRequest, ProgramCreateRequestProgramOwnershipTypeEnum, ProgramDetail } from 'sdk/api'
import { useSWRConfig } from 'swr'
import useSWRImmutable from 'swr/immutable'
import useSWRMutation from 'swr/mutation'
import { v4 as uuidv4 } from 'uuid'

dayjs.extend(utc)

type RefReferenceType = {
  submitReference: React.RefObject<HTMLButtonElement>
}

export const AddProgramWizard = () => {
  const router = useRouter()
  const submitRef = useRef(null)

  const { formWizardCurrentState, stepFormWizardHistory } = useAddProgramFormWizardProvider()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [formWizardCurrentState])

  return (
    <>
      <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {router?.query?.id ? 'Edit Project' : 'Add New Project'}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Button
            type="button"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => {
              router.replace('/dashboard/project')
            }}
          >
            {router?.query?.id ? 'Back (Cancel Edit)' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            btnType="normal"
            size="md"
            variant="primary"
            onClick={() => {
              submitRef.current.click()
            }}
          >
            {router?.query?.id ? 'Update Project' : 'Submit New Project'}
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
                formWizardCurrentState === 'aboutProgram' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'aboutProgram').status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'aboutProgram').percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">About Project</p>
              <span className="stepper-description">Detailed info about project</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${
                        router?.query?.id
                          ? 100
                          : stepFormWizardHistory?.find((item) => item.identifier === 'aboutProgram').percentage
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {router?.query?.id
                    ? 100
                    : stepFormWizardHistory
                        ?.find((item) => item.identifier === 'aboutProgram')
                        .percentage?.toFixed(0) || 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {formWizardCurrentState === 'aboutProgram' && <AboutProgramSubPage submitReference={submitRef} />}
      </div>
    </>
  )
}

/*  ===========================================================================
Vendor Type
===========================================================================  */

type AboutProgramOptionType = {
  text: string
}

const aboutProgramData: AboutProgramOptionType[] = [
  {
    text: 'New',
  },
  {
    text: 'Existing',
  },
]

const getAllPuskapaEmployees = async () => {
  const employee = await employeeApi.employeeControllerGetAllEmployee()
  const getEmployees = employee?.data?.data?.map((item: any) => ({
    id: item.id,
    name: item.full_name,
    avatarUrl: item.pass_photo_path,
  }))

  return getEmployees
}

const getAllPartners = async () => {
  const partners = await partnerApi.partnerControllerGetPartnerList()
  const getPartners = partners?.data?.data?.map((item: any) => ({
    id: item.id,
    name: item.name,
    avatarUrl: '',
  }))

  return getPartners
}

const AboutProgramSubPage = ({ submitReference }: RefReferenceType) => {
  const { isInternal, userLoggedinInformation } = useDashboardContext()
  const router = useRouter()
  const [currencyCode, setCurrencyCode] = useState<string>('IDR')
  const [puskapaEmployees, setPuskapaEmployees] = useState<ComboboxType[]>([])
  const [partnerList, setPartnerList] = useState<ComboboxType[]>([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})

  const [documentsPath, setDocumentsPath] = useState<object | null>(null) // this line is special for one drag one file upload only!
  const [otherDoc, setOtherDoc] = useState([])
  const [vendorTypeLayout, setVendorTypeLayout] = useState<'new' | 'existing'>('new')
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    project: boolean
  }>({
    project: false,
  })
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    contractDocuments: boolean
  }>({
    contractDocuments: false,
  })
  const [linkCollections, setLinkCollections] = useState([])

  const { mutate } = useSWRConfig()
  const { data: programDetailData } = useSWRImmutable<ProgramDetail, Error>(
    router?.query?.id ? `project/${router.query.id}` : null,
    getProgramDetail,
  )
  const { data: supervisorData, trigger: supervisorTrigger } = useSWRMutation(
    [userLoggedinInformation ? userLoggedinInformation?.employee_id : null],
    ([id]) => supervisorByEmployee(id),
  )

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ProgramCreateRequest>()

  const packageCurrencyHandler = (phoneCode: string) => {
    setCurrencyCode(phoneCode)
  }

  let temporaryMultipleFileUpload = []
  const handleUploadFile = async (fileObjects: File[], bucketName: BucketsUnion) => {
    if (!Array.isArray(fileObjects)) return

    fileObjects.map(async (fileObject) => {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)
      const identifier = `${slugify(fileObject.name)}-${fileObject.lastModified}`

      const fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
        headers: {
          'Content-Type': fileObject.type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

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
        },
      })

      const rulesContractFiles = [`${BucketsEnum.program_contract}/${fileNameS3}`]

      const contractPath = programDetailData?.contract.contract_path ? programDetailData?.contract.contract_path : []

      temporaryMultipleFileUpload = [...temporaryMultipleFileUpload, ...contractPath, ...rulesContractFiles]

      const uniqueMultipleFileUpload = [...new Set(temporaryMultipleFileUpload)]

      setDocumentsPath((prev) => ({
        ...prev,
        contract_path: [...uniqueMultipleFileUpload],
      }))
    })
  }

  const submitAddProgram: SubmitHandler<
    ProgramCreateRequest & {
      grant_manager: {
        id: string
      }
      program_manager: {
        id: string
      }
      program_officer: {
        id: string
      }
    }
  > = async (formInput) => {
    const programId = router?.query?.id as string
    const partnersRes = await partnerApi.partnerControllerGetPartnerList()
    const partners = partnersRes.data.data

    const findName = partners.find((item) => {
      if (typeof formInput.partner_code === 'string') {
        return item.name === formInput.partner_code
      } else if (typeof formInput.partner_code === 'object') {
        return item.name === formInput.partner_code['name']
      } else {
        return null
      }
    })

    let partnerCodeLocal = ''

    if (!isInternal) {
      if (findName) {
        partnerCodeLocal = findName.code
      } else {
        const createPartner = await partnerApi.partnerControllerCreatePartner({
          id: '',
          name: formInput.partner_code,
          code: '',
        })

        const code = createPartner.data.data['code']

        partnerCodeLocal = code
      }
    }

    if (documentsPath !== null) {
      await handleUploadFile(formInput.contract.contract_path as unknown as File[], BucketsEnum.program_contract)
    }

    if (formInput.grant_manager.id === undefined) {
      setError('grant_manager', {
        type: 'manual',
        message: 'Grant Manager is required field',
      })
    }
    if (formInput.program_manager.id === undefined) {
      setError('program_manager', {
        type: 'manual',
        message: 'Project Manager is required field',
      })
    }
    if (formInput.program_officer.id === undefined) {
      setError('program_officer', {
        type: 'manual',
        message: 'Project Officer is required field',
      })
    }

    if (!isInternal) {
      if (
        formInput.grant_manager.id === undefined ||
        formInput.program_manager.id === undefined ||
        formInput.program_officer.id === undefined
      ) {
        setLoadingButtonStatement((prev) => ({ ...prev, project: false }))
        return false
      }
    }

    if (switchTogglableButton.contractDocuments && linkCollections.length === 0) {
      toast.warning('Contract link is required field', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })
      return false
    }

    if (documentsPath === undefined && !switchTogglableButton.contractDocuments) {
      toast.warning('Please wait for file to be uploaded', {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      return false
    }

    const programData = {
      code: String(uuidv4()).slice(0, 6),
      partner_code: partnerCodeLocal || 'IEL', // IEL is a default value for internal project
      program_name: removeSpecialChars(titleCase(formInput.program_name)),
      program_description: formInput.program_description,
      currency: currencyCode,
      estimated_budget: Number(formInput.estimated_budget),
      grant_manager: formInput.grant_manager.id || null,
      program_manager: formInput.program_manager?.id || supervisorData.id,
      program_officer: formInput.program_officer?.id || null,
      budget_controller: null,
      timeline: {
        start_date: {
          month: monthStringToNumber(formInput.timeline.start_date.month as unknown as string),
          year: Number(formInput.timeline.start_date.year),
        },
        end_date: {
          month: monthStringToNumber(formInput.timeline.end_date.month as unknown as string),
          year: Number(formInput.timeline.end_date.year),
        },
      },
      contract: {
        contract_number: formInput.contract.contract_number,
        contract_path: switchTogglableButton.contractDocuments ? linkCollections : documentsPath['contract_path'],
      },
      program_ownership_type: isInternal
        ? ProgramCreateRequestProgramOwnershipTypeEnum.Internal
        : ProgramCreateRequestProgramOwnershipTypeEnum.Program,
    }

    setLoadingButtonStatement((prev) => ({ ...prev, project: true }))

    let programRes = null

    if (programDetailData?.id) {
      programRes = programApi.programControllerUpdateProgram(programId, programData as unknown as ProgramCreateRequest)

      toast.promise(programRes, {
        pending: 'Updating Project',
        success: 'Project Updated',
        error: 'Promise rejected 🤯',
      })
    } else {
      programRes = programApi.programControllerCreateProgram(programData as unknown as ProgramCreateRequest)

      toast.promise(programRes, {
        pending: 'Adding a Project',
        success: 'Project Added',
        error: 'Promise rejected 🤯',
      })
    }

    programRes.then((success) => {
      router.push(`/dashboard/project/${success.data?.data}`)
    })
    programRes.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, project: false }))
    })
  }

  const handleVendorTypeChanges = (e: any) => {
    setValue('partner_code', '')
    setVendorTypeLayout(e.target.value)
  }

  const handleDeleteFile = (file: any) => {
    const fileCollections = programDetailData?.contract?.contract_path

    const filteredContracts = fileCollections.filter((fileCollection) => fileCollection !== file)

    const modifiedProgram = {
      code: programDetailData.program_code,
      partner_code: programDetailData.partner.code,
      program_name: programDetailData.program_name,
      program_description: programDetailData.program_description,
      currency: programDetailData.currency,
      estimated_budget: programDetailData.estimated_budget_value,
      grant_manager: programDetailData.grant_manager.id,
      program_manager: programDetailData.program_manager.id,
      program_officer: programDetailData.program_officer.id,
      timeline: {
        start_date: {
          month: programDetailData.timeline.start_date.month,
          year: programDetailData.timeline.start_date.year,
        },
        end_date: {
          month: programDetailData.timeline.end_date.month,
          year: programDetailData.timeline.end_date.year,
        },
      },
      contract: {
        contract_number: programDetailData.contract.contract_number,
        contract_path: filteredContracts,
      },
      program_ownership_type: programDetailData.program_ownership_type,
    }

    const programRes = programApi.programControllerUpdateProgram(
      programDetailData.id,
      modifiedProgram as unknown as ProgramCreateRequest,
    )

    toast.promise(programRes, {
      pending: `Deleting ${file}`,
      success: `${file} deleted`,
      error: 'Promise rejected 🤯',
    })

    programRes.then(() => {
      mutate(`project/${router.query.id}`)
    })
  }

  const deleteContractFiles = async (filename: string) => {
    setDocumentsPath((prev) => {
      prev['contract_path'] = prev['contract_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setValue('contract.contract_path', undefined)
    setOtherDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    const getPuskapaEmployee = async () => {
      const result = await getAllPuskapaEmployees()
      setPuskapaEmployees(result)
    }
    getPuskapaEmployee()

    const getPartners = async () => {
      const result = await getAllPartners()
      setPartnerList(result as unknown as ComboboxType[])
    }
    getPartners()

    mutate(router?.query?.id as string)
  }, [router])

  useEffect(() => {
    setValue('partner_code', programDetailData?.partner.name)
    setValue('program_name', programDetailData?.program_name)
    setValue('program_description', programDetailData?.program_description)
    setValue('estimated_budget', programDetailData?.estimated_budget_value)
    setValue('grant_manager', {
      id: programDetailData?.grant_manager.id,
      name: programDetailData?.grant_manager.full_name,
      avatarUrl: programDetailData?.grant_manager.pass_photo_path,
    } as unknown as string)
    setValue('program_manager', {
      id: programDetailData?.program_manager.id,
      name: programDetailData?.program_manager.full_name,
      avatarUrl: programDetailData?.program_manager.pass_photo_path,
    } as unknown as string)
    setValue('program_officer', {
      id: programDetailData?.program_officer.id,
      name: programDetailData?.program_officer.full_name,
      avatarUrl: programDetailData?.program_officer.pass_photo_path,
    } as unknown as string)
    setValue('timeline.start_date.year', programDetailData?.timeline.start_date.year)
    setValue(
      'timeline.start_date.month',
      monthNumberToString(programDetailData?.timeline.start_date.month) as unknown as number,
    )
    setValue('timeline.end_date.year', programDetailData?.timeline.end_date.year)
    setValue(
      'timeline.end_date.month',
      monthNumberToString(programDetailData?.timeline.end_date.month) as unknown as number,
    )
    setValue('contract.contract_number', programDetailData?.contract.contract_number)

    if (programDetailData?.contract['contract_path'][0].split(BucketsEnum.program_contract)[0]) {
      setSwitchTogglableButton({
        contractDocuments: true,
      })
      programDetailData?.contract['contract_path'].map((path) => {
        setLinkCollections((prev) => [...prev, path])
      })
    } else {
      setValue('contract.contract_path', programDetailData?.contract.contract_path)
    }
  }, [programDetailData])

  useEffect(() => {
    const exec = async () => {
      if (userLoggedinInformation?.employee_id) {
        supervisorTrigger()
      }
    }
    exec()
  }, [userLoggedinInformation?.employee_id])

  return (
    <form onSubmit={handleSubmit(submitAddProgram)} className="flex-auto">
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">About Project</h2>

        <div className="form-data-container">
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">
                About Partners <span className="text-xs text-error-400">*</span>{' '}
              </p>
            </div>
            <div className="form-data-content">
              {!isInternal ? (
                <div>
                  <label htmlFor="vendor_type" className="input-label">
                    Choose Partners
                  </label>
                  <div className="mt-1.5">
                    <div className="inline-flex items-center gap-2">
                      {aboutProgramData.map((aboutProgram, index) => (
                        <div key={index}>
                          <input
                            className="select-multiple standart hidden"
                            id={snakeCase(aboutProgram.text)}
                            value={snakeCase(aboutProgram.text)}
                            type="radio"
                            name="vendor_type"
                            defaultChecked={index === 0 ? true : false}
                            onChange={(e) => handleVendorTypeChanges(e)}
                          />
                          <label
                            className="flex w-44 cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                            htmlFor={snakeCase(aboutProgram.text)}
                          >
                            <span className="h-4 w-4 shrink-0 rounded-full border border-gray-300 bg-white bg-center bg-no-repeat duration-300"></span>
                            <p className="font-medium text-gray-700 duration-300">{aboutProgram.text}</p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              {!isInternal ? (
                <>
                  {vendorTypeLayout === 'new' && (
                    <>
                      <div>
                        <label htmlFor="partner_code" className="input-label">
                          Name
                        </label>
                        <Controller
                          control={control}
                          rules={{ required: 'Partner name is required field' }}
                          name="partner_code"
                          render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                            <>
                              <Input
                                type="text"
                                id="partner_code"
                                placeholder="Name of partners"
                                value={value || ''}
                                onChange={onChange}
                                error={invalid}
                              />
                              {errors.partner_code && (
                                <span className="input-hint-text error">{errors.partner_code?.message}</span>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </>
                  )}
                  {vendorTypeLayout === 'existing' && (
                    <>
                      <div>
                        <label htmlFor="partner_code" className="input-label">
                          Name
                        </label>
                        <Controller
                          control={control}
                          name="partner_code"
                          render={({ field: { onChange, value } }) => (
                            <>
                              <ComboboxAutocomplete
                                id="partner_code"
                                placeholder="Choose name of partners"
                                value={value as unknown as ComboboxType}
                                handleChange={(partner) => {
                                  onChange(partner)
                                }}
                                listData={partnerList}
                                others="none"
                              />
                              {errors.partner_code && (
                                <span className="input-hint-text error">{errors.partner_code?.message}</span>
                              )}
                            </>
                          )}
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div>
                  <label htmlFor="partner_internal" className="input-label">
                    Name
                  </label>
                  <Input id="partner_internal" type="text" placeholder="Name of partners" value="INTERNAL" disabled />
                </div>
              )}
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">
                About Project <span className="text-xs text-error-400">*</span>{' '}
              </p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="program_name" className="input-label">
                  Project Name
                </label>
                <Controller
                  control={control}
                  rules={{
                    required: 'Project name is required field',
                  }}
                  name="program_name"
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        type="text"
                        id="program_name"
                        placeholder="Name of project"
                        value={value || ''}
                        onChange={onChange}
                        error={invalid}
                      />
                      {errors.program_name && (
                        <span className="input-hint-text error">{errors.program_name?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label htmlFor="program_description" className="input-label">
                  Description of Project
                </label>
                <textarea
                  {...register('program_description', {
                    required: 'Project description is required field',
                  })}
                  id="program_description"
                  className={cn(
                    'form-textarea w-full resize-none rounded-lg border px-3.5 py-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
                    errors.program_description
                      ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
                      : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
                  )}
                  rows={5}
                  placeholder="Please describe this project"
                ></textarea>
                {errors.program_description && (
                  <span className="input-hint-text error">{errors.program_description?.message}</span>
                )}
              </div>
              <div>
                <label htmlFor="estimated_budget" className="input-label">
                  Estimated Budget
                </label>
                <Controller
                  control={control}
                  name="estimated_budget"
                  rules={{ required: 'Estimated budget is required field' }}
                  render={({ field: { onChange, ref, value }, fieldState: { invalid } }) => (
                    <Input
                      inputRef={ref}
                      type="number"
                      id="estimated_budget"
                      placeholder="How much estimated budget of this project"
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
                      error={invalid}
                      value={value || ''}
                    />
                  )}
                />
                {errors.estimated_budget && (
                  <span className="input-hint-text error">{errors.estimated_budget?.message}</span>
                )}
              </div>
            </div>
          </div>
          {!isInternal ? (
            <div className="form-data-item">
              <div className="form-data-information">
                <p className="form-data-title">
                  People <span className="text-xs text-error-400">*</span>{' '}
                </p>
              </div>
              <div className="form-data-content">
                <div>
                  <label htmlFor="grant_manager" className="input-label">
                    Grant Manager
                  </label>
                  <Controller
                    control={control}
                    rules={{ required: 'Grant manager is required field' }}
                    name="grant_manager"
                    render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                      <ComboboxAutocomplete
                        icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                        id="grant_manager"
                        placeholder="Select Puskapa Employee"
                        handleChange={(employee) => {
                          onChange(employee)
                        }}
                        value={value as unknown as ComboboxType}
                        listData={puskapaEmployees}
                        others="none"
                        error={invalid}
                      />
                    )}
                  />
                  {errors.grant_manager && (
                    <span className="input-hint-text error">{errors.grant_manager?.message}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="program_manager" className="input-label">
                    Project Manager
                  </label>
                  <Controller
                    control={control}
                    rules={{
                      required: 'Project manager is required field',
                    }}
                    name="program_manager"
                    render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                      <ComboboxAutocomplete
                        icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                        id="program_manager"
                        placeholder="Select Puskapa Employee"
                        handleChange={(employee) => {
                          onChange(employee)
                        }}
                        value={value as unknown as ComboboxType}
                        listData={puskapaEmployees}
                        others="none"
                        error={invalid}
                      />
                    )}
                  />
                  {errors.program_manager && (
                    <span className="input-hint-text error">{errors.program_manager?.message}</span>
                  )}
                </div>
                <div>
                  <label htmlFor="program_officer" className="input-label">
                    Project Officer
                  </label>
                  <Controller
                    control={control}
                    name="program_officer"
                    rules={{
                      required: 'Project officer is required field',
                    }}
                    render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                      <ComboboxAutocomplete
                        icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                        id="program_officer"
                        placeholder="Select Puskapa Employee"
                        handleChange={(employee) => {
                          onChange(employee)
                        }}
                        value={value as unknown as ComboboxType}
                        listData={puskapaEmployees}
                        others="none"
                        error={invalid}
                      />
                    )}
                  />
                  {errors.program_officer && (
                    <span className="input-hint-text error">{errors.program_officer?.message}</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">
                Timeline <span className="text-xs text-error-400">*</span>{' '}
              </p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="contract" className="input-label">
                  Project Time Span
                </label>
                <Input
                  type="text"
                  id="contract"
                  placeholder="XX Month"
                  value={`${
                    getMonthDuration(
                      new Date(`${watch('timeline.start_date.year')}-${watch('timeline.start_date.month') || '01'}-01`),
                      new Date(`${watch('timeline.end_date.year')}-${watch('timeline.end_date.month') || '01'}-01`),
                    ) < 0
                      ? 0
                      : isNaN(
                          getMonthDuration(
                            new Date(
                              `${watch('timeline.start_date.year')}-${watch('timeline.start_date.month') || '01'}-01`,
                            ),
                            new Date(
                              `${watch('timeline.end_date.year')}-${watch('timeline.end_date.month') || '01'}-01`,
                            ),
                          ),
                        )
                      ? 0
                      : String(
                          getMonthDuration(
                            new Date(
                              `${watch('timeline.start_date.year')}-${watch('timeline.start_date.month') || '01'}-01`,
                            ),
                            new Date(
                              `${watch('timeline.end_date.year')}-${watch('timeline.end_date.month') || '01'}-01`,
                            ),
                          ),
                        ).trim().length === 5
                      ? 0
                      : getMonthDuration(
                          new Date(
                            `${watch('timeline.start_date.year')}-${watch('timeline.start_date.month') || '01'}-01`,
                          ),
                          new Date(`${watch('timeline.end_date.year')}-${watch('timeline.end_date.month') || '01'}-01`),
                        )
                  } ${
                    Number(
                      getMonthDuration(
                        new Date(`${watch('timeline.start_date.year')}-${watch('timeline.start_date.month')}-01`),
                        new Date(`${watch('timeline.end_date.year')}-${watch('timeline.end_date.month')}-01`),
                      ),
                    ) > 1
                      ? 'Months'
                      : 'Month'
                  }`}
                  disabled
                />
              </div>

              <div>
                <label htmlFor="timeline.start_date.year" className="input-label">
                  Project Start
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    control={control}
                    rules={{ required: 'Input project start year' }}
                    name="timeline.start_date.year"
                    render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                      <div>
                        <Input
                          type="text"
                          id="timeline.start_date.year"
                          placeholder="Year"
                          value={value || ''}
                          onChange={onChange}
                          error={invalid}
                          maxLength={4}
                        />
                        {errors.timeline?.start_date?.year && (
                          <span className="input-hint-text error">{errors.timeline.start_date?.year?.message}</span>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    control={control}
                    name="timeline.start_date.month"
                    rules={{ required: 'Input project start month' }}
                    render={({ field: { onChange }, fieldState: { invalid } }) => (
                      <div>
                        <ListboxSelect
                          className="w-full"
                          lists={MONTHS.map((month) => ({
                            name: titleCase(month.name),
                          }))}
                          isPlaceholder={true}
                          handleChange={(monthStart) => {
                            onChange(monthStart)
                          }}
                          id="timeline.start_date.month"
                          value={String(getValues('timeline.start_date.month') || '')}
                          error={invalid}
                        >
                          Month
                        </ListboxSelect>
                        {errors.timeline?.start_date?.month && (
                          <span className="input-hint-text error">{errors.timeline.start_date?.month?.message}</span>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="timeline.end_date.year" className="input-label">
                  Project End
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    control={control}
                    rules={{ required: 'Input project end year' }}
                    name="timeline.end_date.year"
                    render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                      <div>
                        <Input
                          type="text"
                          id="timeline.end_date.year"
                          placeholder="Year"
                          value={value || ''}
                          onChange={onChange}
                          error={invalid}
                          maxLength={4}
                        />
                        {errors.timeline?.end_date?.year && (
                          <span className="input-hint-text error">{errors.timeline.end_date?.year?.message}</span>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    control={control}
                    name="timeline.end_date.month"
                    rules={{ required: 'Input project end month' }}
                    render={({ field: { onChange }, fieldState: { invalid } }) => (
                      <div>
                        <ListboxSelect
                          className="w-full"
                          lists={MONTHS.map((month) => ({
                            name: titleCase(month.name),
                          }))}
                          isPlaceholder={true}
                          handleChange={(contract) => {
                            onChange(contract)
                          }}
                          id="timeline.end_date.month"
                          value={String(getValues('timeline.end_date.month') || '')}
                          error={invalid}
                        >
                          Month
                        </ListboxSelect>
                        {errors.timeline?.end_date?.month && (
                          <span className="input-hint-text error">{errors.timeline.end_date?.month?.message}</span>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Contract</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="contract.contract_number" className="input-label">
                  Contract Number
                </label>
                <Controller
                  control={control}
                  rules={{ required: 'Contract number is required field' }}
                  name="contract.contract_number"
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        type="text"
                        id="contract.contract_number"
                        placeholder="Contract number"
                        value={value || ''}
                        onChange={onChange}
                        error={invalid}
                      />
                      {errors.contract?.contract_number && (
                        <span className="input-hint-text error">{errors.contract.contract_number?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
              <SwitchableUploadFieldMultiple
                name="contract.contract_path"
                label="Documents"
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.contractDocuments}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    contractDocuments: !prev.contractDocuments,
                  }))
                  setDocumentsPath(null)
                  setOtherDoc([])
                  setLinkCollections([])
                }}
                linkCollections={linkCollections}
                setLinkCollections={setLinkCollections}
                bucketName={BucketsEnum.program_contract}
                uploadProgress={tempProgressUpload}
                uploadedFiles={otherDoc}
                setUploadedFiles={setOtherDoc}
                handleUploadFile={handleUploadFile}
                deleteFilePath={deleteContractFiles}
                maxFiles={10}
                informationText="IMAGE or DOCUMENTS (max 5MB each file)"
                existingFiles={programDetailData?.contract?.contract_path}
                handleDeleteExistingFile={handleDeleteFile}
                existingFileBucketCheck={BucketsEnum.program_contract}
                isEditMode={!!router?.query?.id}
                isRequired={true}
              />
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 right-0 z-10 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
          <Button type="submit" btnType="normal" size="md" variant="primary" isLoading={loadingButtonStatement.project}>
            {router?.query?.id ? 'Submit Project' : 'Submit New Project'}
            <ChevronRightIcon className="h-5 w-5 stroke-white" />
          </Button>
          <button type="submit" className="hidden" ref={submitReference}></button>
        </div>
      </div>
    </form>
  )
}
