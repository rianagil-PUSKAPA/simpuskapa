import { Button } from '@/components/Button'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { FileUploadDragDrop } from '@/components/FileUploadDragDrop'
import { Input } from '@/components/Input'
import { ListboxSelect } from '@/components/ListboxSelect'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { SwitchableUploadFieldMultiple } from '@/components/SwitchableUploadFieldMultiple'
import { ChevronLeftIcon } from '@/components/icon/ChevronLeftIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { Edit01Icon } from '@/components/icon/Edit01Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { User01Icon } from '@/components/icon/User01Icon'
import { UsersPlusIcon } from '@/components/icon/UsersPlusIcon'
import { cn } from '@/lib/utils'
import {
  EMPLOYMENT_DATA_TOTAL_PAGE,
  IDENTITY_DOCUMENT_TOTAL_PAGE,
  PAYMENT_DATA_TOTAL_PAGE,
  PERSONAL_IDENTITY_TOTAL_PAGE,
  useAddEmployeeFormWizardProvider,
} from '@/providers/AddEmployeeFormWizardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { BucketsUnion, DynamicProgressType } from '@/types/global'
import {
  employeeApi,
  fileApi,
  getAllEmployee,
  getEmployeeDetail,
  getOpenUrl,
  identityApi,
} from '@/utils/apiRequestHelper'
import { DEPARTMENT_OPTIONS } from '@/utils/constant'
import { dateFormatToISO, getLocalSession, isValidUrl, slugify, snakeCase } from '@/utils/globalHelper'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import {
  CreateEmployeeContractRequest,
  Employee,
  EmployeeUpdateRequest,
  EmployeeUpdateRequestGenderEnum,
  EmployeeUpdateRequestMaritalStatusEnum,
  UpdateUserRequest,
} from 'sdk/api'
import { useSWRConfig } from 'swr'
import useSWRImmutable from 'swr/immutable'
import { v4 as uuidv4 } from 'uuid'
dayjs.extend(utc)

type RefReferenceType = {
  submitReference: React.RefObject<HTMLButtonElement>
  employeeIdChecker?: (employeeId: string) => void
}

export const AddEmployeeWizard = () => {
  const router = useRouter()
  const [id, setId] = useState('')

  const submitRef = useRef(null)

  const { formWizardCurrentState, stepFormWizardHistory } = useAddEmployeeFormWizardProvider()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [formWizardCurrentState])

  const checkEmployeeIdIsExist = useCallback(async (employeeId: string) => {
    if (employeeId) {
      toast.success('Employee has been saved')
    }
  }, [])

  useEffect(() => {
    if (router.query?.path?.length) {
      setId(router.query.path[0])
    }
  }, [router.isReady])

  return (
    <>
      <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{id ? 'Edit' : 'Add'} Employee</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <Button
            type="button"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            onClick={() => {
              sessionStorage.removeItem('form_wizard_history_employee')
              sessionStorage.removeItem('employee_id')
              router.replace('/dashboard/internal/employee')
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            btnType="normal"
            size="md"
            variant="secondary"
            onClick={() => {
              sessionStorage.removeItem('form_wizard_history_employee')
              sessionStorage.removeItem('employee_id')
              router.reload()
            }}
          >
            Clear Form
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
            Submit New Employee
            <PlusIcon className="h-5 w-5 stroke-white" />
          </Button>
        </div>
      </div>
      <div className="mt-14 flex gap-10 px-10 align-baseline">
        <div className="w-80 shrink-0">
          <div className="stepper stepper-vertical sticky top-6">
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'employmentData' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'employmentData')?.status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'employmentData')?.percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Employment Data</p>
              <span className="stepper-description">This is your initiation employment data</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${
                        stepFormWizardHistory?.find((item) => item.identifier === 'employmentData')?.percentage
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {stepFormWizardHistory
                    ?.find((item) => item.identifier === 'employmentData')
                    ?.percentage?.toFixed(0) || 0}
                  %
                </span>
              </div>
            </div>
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'personalIdentity' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'personalIdentity')?.status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'personalIdentity')?.percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Personal Identity</p>
              <span className="stepper-description">A few details about yourself</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${
                        stepFormWizardHistory?.find((item) => item.identifier === 'personalIdentity')?.percentage
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {stepFormWizardHistory
                    ?.find((item) => item.identifier === 'personalIdentity')
                    ?.percentage?.toFixed(0) || 0}
                  %
                </span>
              </div>
            </div>
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'identityDocuments' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'identityDocuments')?.status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'identityDocuments')?.percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Identity Documents</p>
              <span className="stepper-description">All documents regarding ID</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${
                        stepFormWizardHistory?.find((item) => item.identifier === 'identityDocuments')?.percentage
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {stepFormWizardHistory
                    ?.find((item) => item.identifier === 'identityDocuments')
                    ?.percentage?.toFixed(0) || 0}
                  %
                </span>
              </div>
            </div>
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'paymentData' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'paymentData')?.status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'paymentData')?.percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Payment Data</p>
              <span className="stepper-description">Your bank account data</span>
              <div className="mt-3 flex items-center gap-3">
                <div className="stepper-progress">
                  <div
                    className="stepper-inner-progress w-0"
                    style={{
                      width: `${stepFormWizardHistory?.find((item) => item.identifier === 'paymentData')?.percentage}%`,
                    }}
                  ></div>
                </div>
                <span className="stepper-percentage w-10 text-gray-700">
                  {stepFormWizardHistory?.find((item) => item.identifier === 'paymentData')?.percentage?.toFixed(0) ||
                    0}
                  %
                </span>
              </div>
            </div>
            <div
              className={cn(
                'stepper-item',
                formWizardCurrentState === 'finalStepOnboarding' && 'active',
                stepFormWizardHistory?.find((item) => item.identifier === 'finalStepOnboarding')?.status && 'visited',
                stepFormWizardHistory?.find((item) => item.identifier === 'finalStepOnboarding')?.percentage === 100 &&
                  'finished',
              )}
            >
              <div className="stepper-line"></div>
              <p className="stepper-title">Final Step Onboarding</p>
              <span className="stepper-description">Share posts to your social accounts</span>
            </div>
          </div>
        </div>

        {/* Show Employment Data */}
        {formWizardCurrentState === 'employmentData' && (
          <EmploymentDataSubPage submitReference={submitRef} employeeIdChecker={checkEmployeeIdIsExist} />
        )}
        {formWizardCurrentState === 'personalIdentity' && (
          <PersonalIdentitySubPage submitReference={submitRef} employeeIdChecker={checkEmployeeIdIsExist} />
        )}
        {formWizardCurrentState === 'identityDocuments' && (
          <IdentityDocumentsSubPage submitReference={submitRef} employeeIdChecker={checkEmployeeIdIsExist} />
        )}
        {formWizardCurrentState === 'paymentData' && (
          <PaymentDataSubPage submitReference={submitRef} employeeIdChecker={checkEmployeeIdIsExist} />
        )}
        {formWizardCurrentState === 'finalStepOnboarding' && (
          <FinalStepOnboardingSubPage submitReference={submitRef} employeeIdChecker={checkEmployeeIdIsExist} />
        )}
      </div>
    </>
  )
}

/*  ===========================================================================
Employment Data
===========================================================================  */

const EmploymentDataSubPage = ({ submitReference, employeeIdChecker }: RefReferenceType) => {
  const { handleFormWizardHistory } = useAddEmployeeFormWizardProvider()
  const router = useRouter()
  const [empPositionLists, setEmpPositionLists] = useState<string[]>([])
  const [profilePhoto, setProfilePhoto] = useState([])
  const [contractDocument, setContractDocument] = useState([])
  const [supervisors, setSupervisors] = useState<Employee[]>([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [avatarPhotoProfile, setAvatarPhotoProfile] = useState<string>(
    `${process.env.NEXT_PUBLIC_ASSETS}/svg/avatar-placeholder.svg`,
  )
  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    contract_document: boolean
  }>({
    contract_document: false,
  })

  const { mutate } = useSWRConfig()
  const { data: employeeDetailData, error: employeeDetailError } = useSWRImmutable<Employee, Error>(
    getLocalSession('employee_id') ? getLocalSession('employee_id') : null,
    getEmployeeDetail,
  )

  // console.log('EMPLOYMENT DATA SUBPAGE', employeeDetailData)

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<Employee>()

  const handleDepartmentChanges = (value: string) => {
    const findPosition = DEPARTMENT_OPTIONS.find((item) => item.department === value)
    setValue('employee_contracts.0.position', null)
    setEmpPositionLists(findPosition.position)
  }

  const submitEmploymentData: SubmitHandler<Employee> = async (formInput) => {
    let initEmployee = null
    let employeeId = null

    const createEmployeeData = {
      full_name: formInput.full_name,
      email: `${formInput.user.email}@puskapa.org`,
      form_progress: 0,
      is_lock: false,
      staff_id: String(uuidv4()).replaceAll('-', '').toUpperCase().slice(0, 6),
      form_state: '',
    }

    /* Name & Username */
    if (!employeeDetailData?.full_name && !employeeDetailData?.user.email) {
      try {
        initEmployee = await employeeApi.employeeControllerCreateEmployeeAndUser(createEmployeeData)
        employeeId = initEmployee.data.data
      } catch (error) {
        if (error.response.status === 400) {
          toast.error('User was exist in the system')
          document.getElementById('name-username').scrollIntoView({ behavior: 'smooth' })
          return false
        }
      }
    }

    if (employeeDetailData?.id) {
      const employeeUpdate = {} as EmployeeUpdateRequest
      const userUpdate = {} as UpdateUserRequest

      await employeeApi.employeeControllerUpdateEmployee(employeeDetailData?.id || employeeId, {
        ...employeeUpdate,
        full_name: formInput.full_name,
      })

      await identityApi.userControllerUpdateUsers(employeeDetailData?.user_id, {
        ...userUpdate,
        email: `${formInput.user.email}@puskapa.org`,
      })
    }

    /* Profile Photo */
    if (formInput?.pass_photo_path && formInput?.pass_photo_path?.[0]) {
      const id = employeeDetailData?.id || employeeId
      const file = formInput.pass_photo_path?.[0] as unknown as File

      await handleUploadFile(file, BucketsEnum.employee_pass_photo, id)
    }

    /* Employment */
    const checkEmployeeContractValue = !Object.values(formInput.employee_contracts[0]).every((o) => o === undefined)

    if (checkEmployeeContractValue) {
      let fileNameS3 = ''
      const employee = await employeeApi.employeeControllerGetAllEmployee()
      const employeeList = employee.data.data
      const supervisor = employeeList.find(
        (employee: Employee) => employee.full_name === formInput.employee_contracts[0].supervisor_id,
      )

      if (!switchTogglableButton.contract_document && formInput?.employee_contracts[0].doc_path) {
        if (contractDocument.length) {
          const presignUrl = await fileApi.fileControllerGetPresignUrl(
            contractDocument[0].name,
            BucketsEnum.employee_contract,
          )

          const identifier = BucketsEnum.employee_contract

          fileNameS3 = String(presignUrl.data.data).split('::')[0]

          await axios.put(String(presignUrl.data.data).split('::')[1], contractDocument[0], {
            headers: {
              'Content-Type': contractDocument[0].type,
            },
            onUploadProgress: (e) => {
              const percentCompleted = Math.round((e.loaded * 100) / e.total)

              setTempProgressUpload((prev) => ({
                ...prev,
                [identifier]: {
                  bucketName: BucketsEnum.employee_contract,
                  progress: percentCompleted,
                  identifier,
                },
              }))
            },
          })
        }
      }

      if (
        switchTogglableButton.contract_document &&
        formInput?.employee_contracts[0].doc_path &&
        !isValidUrl(formInput?.employee_contracts[0].doc_path as unknown as string)
      ) {
        setError('employee_contracts.0.doc_path', {
          message: 'Please enter a valid URL',
          type: 'custom',
        })
        return
      }

      const createEmployeeContractRequest: CreateEmployeeContractRequest = {
        id: '', // better ngga usah disubmit
        contract_number: formInput.employee_contracts[0].contract_number || '',
        supervisor_id: supervisor?.id || '',
        employee_id: employeeDetailData?.id || employeeId,
        contract_name: '',
        position: formInput.employee_contracts[0].position || '',
        department: formInput.employee_contracts[0].department || '',
        emp_status: formInput.employee_contracts[0].emp_status || '',
        contract_started: formInput.employee_contracts[0].contract_started
          ? dateFormatToISO(dayjs(formInput.employee_contracts[0].contract_started).utc().format())
          : dateFormatToISO(dayjs().utc().format()),
        contract_ended: null,
        doc_path: switchTogglableButton.contract_document
          ? formInput?.employee_contracts[0].doc_path
            ? [`${formInput?.employee_contracts[0].doc_path}`]
            : employeeDetailData?.employee_contracts[0]?.doc_path
          : fileNameS3
          ? [`${BucketsEnum.employee_contract}/${fileNameS3}`]
          : employeeDetailData?.employee_contracts[0]?.doc_path || [],
      }
      await employeeApi.employeeControllerCreateEmployeeContracts(
        employeeDetailData?.id || employeeId,
        createEmployeeContractRequest,
        true,
      )
    }

    employeeIdChecker(employeeDetailData?.id || employeeId)

    sessionStorage.setItem('employee_id', employeeDetailData?.id || employeeId)
    mutate(employeeDetailData?.id || employeeId)

    if (direction === 'next') {
      gotoNext()
    }
  }

  const gotoNext = () => {
    handleFormWizardHistory('employmentData', 'personalIdentity', EMPLOYMENT_DATA_TOTAL_PAGE)
  }

  const handleUploadFile = async (fileObject: File, bucketName: BucketsUnion, employeeId: string) => {
    const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)

    const fileNameS3 = String(presignUrl.data.data).split('::')[0]
    const identifier = bucketName

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

    const employeeUpdate = {} as EmployeeUpdateRequest

    switch (bucketName) {
      case BucketsEnum.employee_pass_photo:
        employeeUpdate.pass_photo_path = [`${BucketsEnum.employee_pass_photo}/${fileNameS3}`]
        break
      default:
        break
    }

    employeeApi.employeeControllerUpdateEmployee(employeeId, employeeUpdate as EmployeeUpdateRequest)
  }

  const handleDeleteFile = (file: any) => {
    const fileCollections = employeeDetailData?.employee_contracts[0]?.doc_path

    const filteredContracts = fileCollections.filter((fileCollection) => fileCollection !== file)

    const createEmployeeContractRequest: CreateEmployeeContractRequest = {
      ...employeeDetailData?.employee_contracts[0],
      doc_path: filteredContracts,
    }

    const employeeRes = employeeApi.employeeControllerCreateEmployeeContracts(
      employeeDetailData?.id,
      createEmployeeContractRequest,
      true,
    )

    toast.promise(employeeRes, {
      pending: `Deleting ${file}`,
      success: `${file} deleted`,
      error: 'Promise rejected 🤯',
    })

    employeeRes.then(() => {
      setValue('employee_contracts.0.doc_path', null)
      mutate(getLocalSession('employee_id'))
    })
  }

  const deletePassPhotoFile = async (filename: string) => {
    setValue('pass_photo_path', undefined)
    setProfilePhoto((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteEmployeeContractFile = async (filename: string) => {
    setValue('employee_contracts.0.doc_path', undefined)
    setContractDocument((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    setValue('full_name', employeeDetailData?.full_name)
    setValue('user.email', employeeDetailData?.user.email.split('@')[0])
    setValue('employee_contracts.0.contract_number', employeeDetailData?.employee_contracts[0]?.contract_number)
    setValue('employee_contracts.0.department', employeeDetailData?.employee_contracts[0]?.department)
    setValue('employee_contracts.0.department', employeeDetailData?.employee_contracts[0]?.department)
    setValue('employee_contracts.0.position', employeeDetailData?.employee_contracts[0]?.position)
    setValue('employee_contracts.0.contract_started', employeeDetailData?.employee_contracts[0]?.contract_started)
    if (isValidUrl(employeeDetailData?.employee_contracts[0]?.doc_path?.[0])) {
      setSwitchTogglableButton({
        contract_document: true,
      })
      setValue('employee_contracts.0.doc_path', employeeDetailData?.employee_contracts[0].doc_path)
    }

    const getSupervisor = async () => {
      const employee = await employeeApi.employeeControllerGetAllEmployee()
      const employeeList = employee.data.data
      const supervisor = employeeList?.find(
        (employee: Employee) => employee.id === employeeDetailData?.employee_contracts[0]?.supervisor_id,
      )

      setValue('employee_contracts.0.supervisor_id', supervisor?.full_name)
    }
    getSupervisor()
    setValue('employee_contracts.0.emp_status', employeeDetailData?.employee_contracts[0]?.emp_status)

    // Preview avatar
    if (employeeDetailData?.pass_photo_path) {
      getOpenUrl(BucketsEnum.employee_pass_photo, employeeDetailData?.pass_photo_path?.[0].split('/')[1], 3600 * 24)
        .then((file) => {
          setAvatarPhotoProfile(file.url)
        })
        .catch((err) => console.error(err))
    }
  }, [employeeDetailData, setValue])

  useEffect(() => {
    const getAllSupervisors = async () => {
      const supervisors = await getAllEmployee('supervisor')
      setSupervisors(supervisors)
    }

    getAllSupervisors()
  }, [])

  useEffect(() => {
    mutate(getLocalSession('employee_id'))
  }, [mutate])

  if (employeeDetailError) {
    return <pre>Error: {JSON.stringify(employeeDetailError, null, 2)}</pre>
  }

  return (
    <form onSubmit={handleSubmit(submitEmploymentData, errorSubmitData)} className="flex-auto">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Employment Initiation Data</h2>
        <p className="mb-5 text-sm text-gray-600">
          Please input your new employee information regarding employment in PUSKAPA
        </p>

        <div className="form-data-container">
          <div className="form-data-item" id="name-username">
            <div className="form-data-information">
              <p className="form-data-title">Name & Username</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="full_name" className="input-label">
                  Name <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="full_name"
                  rules={{ required: 'Name is required field' }}
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        type="text"
                        id="full_name"
                        placeholder="Name of New Employee"
                        onChange={onChange}
                        error={invalid}
                        value={value || ''}
                      />
                      {errors.full_name && <span className="input-hint-text error">{errors.full_name?.message}</span>}
                    </>
                  )}
                />
              </div>
              <div>
                <label htmlFor="email" className="input-label">
                  Email <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="user.email"
                  rules={{
                    required: 'Email is required field',
                  }}
                  render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                    <>
                      <Input
                        type="text"
                        id="email"
                        placeholder="Username"
                        onChange={onChange}
                        groupText="@puskapa.org"
                        groupTextXAxisStyles="pr-36"
                        groupTextPosition="end"
                        groupStyles="font-semibold text-gray-700"
                        error={invalid}
                        // value={getValues('user.email') || ''}
                        value={value || ''}
                        // disabled={employeeDetailData?.user.email ? true : false}
                      />
                      {errors.user?.email.message && (
                        <span className="input-hint-text error">{errors.user?.email.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Profile Photo</p>
              <span className="form-data-description">This will be displayed across SIMPUSKAPA</span>
            </div>
            <div className="form-data-content">
              <div className="flex items-start gap-6">
                <div>
                  <label className="input-label">Photo Preview</label>
                  {profilePhoto.length ? (
                    <Image
                      width={64}
                      height={64}
                      src={profilePhoto[0].preview}
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gray-100 object-cover shadow-md"
                      alt="Preview photo"
                    />
                  ) : (
                    <>
                      {employeeDetailData?.pass_photo_path ? (
                        <Image
                          width={64}
                          height={64}
                          src={avatarPhotoProfile}
                          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gray-100 object-cover shadow-md"
                          alt={`${getValues('full_name')} avatar image`}
                        />
                      ) : (
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gray-100 shadow-md">
                          <User01Icon className="h-9 w-9 stroke-gray-600" />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="grow">
                  <label className="input-label">Upload Photo</label>
                  <Controller
                    control={control}
                    name="pass_photo_path"
                    render={({ field: { onChange } }) => (
                      <FileUploadDragDrop
                        id={BucketsEnum.employee_pass_photo}
                        bucketName={BucketsEnum.employee_pass_photo}
                        progress={tempProgressUpload}
                        setUploadedFile={setProfilePhoto}
                        stateUploadedFile={profilePhoto}
                        onChange={(file) => {
                          if (employeeDetailData) {
                            handleUploadFile(file[0], BucketsEnum.employee_pass_photo, employeeDetailData.id)
                          }
                          onChange(file)
                        }}
                        maxFiles={1}
                        informationText="Image Only (max 4MB)"
                        allowedDataType={['images']}
                        maxSize={4194304}
                        deleteFilePath={deletePassPhotoFile}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Employment</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="department" className="input-label">
                  Department <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="employee_contracts.0.department"
                  render={({ field: { onChange, value } }) => (
                    <ListboxSelect
                      className="w-full"
                      lists={DEPARTMENT_OPTIONS.map((item) => ({
                        name: item.department,
                      }))}
                      isPlaceholder={true}
                      handleChange={(department) => {
                        handleDepartmentChanges(department)
                        onChange(department)
                      }}
                      id="department"
                      value={value || ''}
                    >
                      Select Department
                    </ListboxSelect>
                  )}
                />
              </div>
              <div>
                <label htmlFor="position" className="input-label">
                  Position <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="employee_contracts.0.position"
                  render={({ field: { onChange, value } }) => (
                    <ListboxSelect
                      className="w-full"
                      lists={empPositionLists.map((item) => ({
                        name: item,
                      }))}
                      isPlaceholder={true}
                      handleChange={(position) => {
                        onChange(position)
                      }}
                      id="position"
                      // value={getValues('employee_contracts.0.position') || ''}
                      value={value || ''}
                      emptyMessage="Choose departement first"
                    >
                      Select position
                    </ListboxSelect>
                  )}
                />
              </div>
              <div>
                <label htmlFor="supervisor" className="input-label">
                  Supervisor <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="employee_contracts.0.supervisor_id"
                  render={({ field: { onChange, value } }) => (
                    <ListboxSelect
                      icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                      className="w-full"
                      lists={supervisors.map((supervisor) => ({
                        name: supervisor.full_name,
                        avatarUrl:
                          supervisor.pass_photo_path[0] || supervisor.employee_contracts[0]?.emp_detail.pass_photo,
                      }))}
                      isPlaceholder={true}
                      handleChange={(supervisor) => {
                        onChange(supervisor)
                      }}
                      id="supervisor"
                      // value={
                      //   getValues('employee_contracts.0.supervisor_id') || ''
                      // }
                      value={value || ''}
                    >
                      Select Supervisor
                    </ListboxSelect>
                  )}
                />
              </div>
              <div>
                <label htmlFor="emp_status" className="input-label">
                  Employee Status <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="employee_contracts.0.emp_status"
                  render={({ field: { onChange, value } }) => (
                    <ListboxSelect
                      className="w-full"
                      lists={['Full Time', 'Part Time', 'Intern', 'Freelance'].map((item) => ({
                        name: item,
                      }))}
                      isPlaceholder={true}
                      handleChange={(emp_status) => {
                        onChange(emp_status)
                      }}
                      id="emp_status"
                      // value={getValues('employee_contracts.0.emp_status') || ''}
                      value={value || ''}
                    >
                      Select employment status
                    </ListboxSelect>
                  )}
                />
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Contract</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="contract_started" className="input-label">
                  Effective Date
                </label>
                <Controller
                  control={control}
                  name="employee_contracts.0.contract_started"
                  render={({ field: { onChange, value } }) => (
                    <DatePickerCalendar
                      id="contract_started"
                      selected={value ? new Date(value) : null}
                      onChange={(date: Date) => {
                        onChange(date)
                      }}
                      useArrow={true}
                      placeholder="When the employee joined"
                      isUsingCustomHeader={true}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="contract_number" className="input-label">
                  Contract Number
                </label>
                <Controller
                  control={control}
                  name="employee_contracts.0.contract_number"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      type="text"
                      id="contract_number"
                      placeholder="Contract Number"
                      onChange={onChange}
                      value={value || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="employee_contracts.0.doc_path"
                label="Upload Contract Documents"
                fieldKey={BucketsEnum.employee_contract}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.contract_document}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    contract_document: !prev.contract_document,
                  }))
                }}
                bucketName={BucketsEnum.employee_contract}
                uploadProgress={tempProgressUpload}
                uploadedFiles={contractDocument}
                setUploadedFiles={setContractDocument}
                handleUploadFile={(files, fieldKey) => {
                  handleUploadFile(files[0], fieldKey as BucketsUnion, employeeDetailData.id)
                }}
                deleteFilePath={deleteEmployeeContractFile}
                existingFilePath={employeeDetailData?.employee_contracts?.[0]?.doc_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.employee_contracts?.[0]?.doc_path?.[0]
                  if (file) handleDeleteFile(file)
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
              {/* <div>
                <label className="input-label">Upload Contract Documents</label>
                <div
                  className={cn(
                    'flex flex-col gap-4',
                    employeeDetailData?.employee_contracts?.length > 0 &&
                      'mb-4',
                  )}
                >
                  {employeeDetailData?.employee_contracts[0]?.doc_path.map(
                    (item, index) => (
                      <FilePreview key={index} fileName={item} />
                    ),
                  )}
                </div>
                <Controller
                  control={control}
                  name="employee_contracts.0.doc_path"
                  render={({ field: { onChange } }) => (
                    <FileUploadDragDrop
                      id={BucketsEnum.employee_contract}
                      bucketName={BucketsEnum.employee_contract}
                      progress={tempProgressUpload}
                      setUploadedFile={setContractDocument}
                      stateUploadedFile={contractDocument}
                      onChange={(file) => {
                        onChange(file)
                      }}
                      maxFiles={1}
                      informationText="IMAGE or DOCUMENTS (max. 5MB)"
                      deleteFilePath={deleteEmployeeContractFile}
                    />
                  )}
                />
              </div> */}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 right-0 z-10 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
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
Personal Identity
===========================================================================  */

type EmergencyContact = {
  emergency_id: string
  emergency_name: string
  emergency_relationship: string
  emergency_phone_number: string
}

const PersonalIdentitySubPage = ({ submitReference, employeeIdChecker }: RefReferenceType) => {
  const { handleFormWizardHistory } = useAddEmployeeFormWizardProvider()

  const [birthdate, setBirthdate] = useState<Date | null>(null)
  const [emergencyContactNumberCode, setEmergencyContactNumberCode] = useState<string>('+62')
  const [phoneNumberCode, setPhoneNumberCode] = useState<string>('+62')
  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)
  const [isForeignRendered, setIsForeignRendered] = useState<boolean>(false)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])

  const [emergencyContact, setEmergencyContact] = useState<{
    emergency_id: string
    emergency_name: string
    emergency_relationship: string
    emergency_phone_number: string
  } | null>(null)

  const { mutate } = useSWRConfig()
  const { data: employeeDetailData, error: employeeDetailError } = useSWRImmutable<Employee, Error>(
    getLocalSession('employee_id') ? getLocalSession('employee_id') : null,
    getEmployeeDetail,
  )

  const {
    handleSubmit,
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<
    Employee &
      EmergencyContact & {
        foreign_nationality_text: string
      }
  >()

  const gotoPrev = () => {
    handleFormWizardHistory('personalIdentity', 'employmentData', PERSONAL_IDENTITY_TOTAL_PAGE)
  }

  const gotoNext = () => {
    handleFormWizardHistory('personalIdentity', 'identityDocuments', PERSONAL_IDENTITY_TOTAL_PAGE)
  }

  const phoneNumberhandler = (phoneCode: string) => {
    setPhoneNumberCode(phoneCode)
  }
  const emergencyContactNumberHandler = (phoneCode: string) => {
    setEmergencyContactNumberCode(phoneCode)
  }

  const addDynamicEmergencyContacts = () => {
    if (!getValues('emergency_name') || !getValues('emergency_relationship') || !getValues('emergency_phone_number')) {
      toast.warning('Please fill all emergency contact information')
      return false
    }
    const emergencyName = document.getElementById('emergency_name') as HTMLInputElement
    const emergencyRelationship = document.getElementById('emergency_relationship') as HTMLInputElement
    const emergencyPhone = document.getElementById('emergency_phone_number') as HTMLInputElement

    const newEmergencyContact = {
      emergency_id: getValues('emergency_id') || String(uuidv4()),
      emergency_name: getValues('emergency_name'),
      emergency_relationship: getValues('emergency_relationship'),
      emergency_phone_number: `${emergencyContactNumberCode}_${getValues('emergency_phone_number')}`,
    }

    const cleanData: EmergencyContact[] = Object.values(
      [...emergencyContacts, newEmergencyContact].reduce(
        (acc, cur) => Object.assign(acc, { [cur.emergency_id]: cur }),
        {},
      ),
    )

    setEmergencyContacts(cleanData)

    emergencyName.value = null
    emergencyRelationship.value = null
    emergencyPhone.value = null

    setValue('emergency_id', null)
    setValue('emergency_name', null)
    setValue('emergency_relationship', null)
    setValue('emergency_phone_number', null)

    emergencyContactNumberHandler('+62')
    setEmergencyContact(null)
    document.querySelector('#emergency-button-text').innerHTML = 'Add as Emergency Contact'
  }

  const handleEmergencyContactAction = (contactId: string, action: string) => {
    const emergencyName = document.getElementById('emergency_name') as HTMLInputElement
    const emergencyRelationship = document.getElementById('emergency_relationship') as HTMLInputElement
    const emergencyPhone = document.getElementById('emergency_phone_number') as HTMLInputElement

    if (action === 'edit') {
      document.querySelector('#emergency-button-text').innerHTML = 'Update Emergency Contact'
      const contactDetail = emergencyContacts.find((item) => item.emergency_id === contactId)

      setEmergencyContact({
        emergency_id: contactDetail.emergency_id,
        emergency_name: contactDetail.emergency_name,
        emergency_relationship: contactDetail.emergency_relationship,
        emergency_phone_number: contactDetail.emergency_phone_number,
      })

      emergencyName.value = contactDetail.emergency_name
      emergencyRelationship.value = contactDetail.emergency_relationship
      emergencyPhone.value = contactDetail.emergency_phone_number?.split('_')[1]

      setValue('emergency_id', contactDetail.emergency_id)
      setValue('emergency_name', contactDetail.emergency_name)
      setValue('emergency_relationship', contactDetail.emergency_relationship)
      setValue('emergency_phone_number', contactDetail.emergency_phone_number?.split('_')[1])

      emergencyContactNumberHandler(contactDetail.emergency_phone_number?.split('_')[0])
    }

    if (action === 'delete') {
      setEmergencyContacts((prev) => prev.filter((item) => item.emergency_id !== contactId))
    }
  }

  const submitPersonalIdentity: SubmitHandler<Employee & { foreign_nationality_text: string }> = async (formInput) => {
    if (formInput.nationality === 'wna' && !formInput.foreign_nationality_text) {
      toast.warning('Please specify foreign nationality country')
      return false
    }
    const employeeUpdateRequest = {} as EmployeeUpdateRequest
    // Gender
    employeeUpdateRequest.gender =
      (formInput.gender?.toLowerCase() as EmployeeUpdateRequestGenderEnum) || employeeDetailData.gender
    // Religion
    employeeUpdateRequest.religion = formInput.religion || employeeDetailData.religion
    // Marital Status
    employeeUpdateRequest.marital_status =
      ((formInput.marital_status && snakeCase(formInput.marital_status)) as EmployeeUpdateRequestMaritalStatusEnum) ||
      employeeDetailData.marital_status
    // Nationality
    employeeUpdateRequest.nationality =
      (formInput.nationality === 'wni' ? 'wni' : formInput.foreign_nationality_text) ||
      employeeDetailData.nationality ||
      'wni'
    // POB
    employeeUpdateRequest.pob = formInput.pob || employeeDetailData.pob
    // DOB
    employeeUpdateRequest.dob = (formInput.dob && dayjs(formInput.dob).utc().format()) || employeeDetailData.dob
    // Phone Number
    employeeUpdateRequest.phone_number = formInput.phone_number
      ? `${phoneNumberCode}_${formInput.phone_number}`
      : employeeDetailData?.phone_number?.split('_')[1] || null
    // Address (based on ID)
    employeeUpdateRequest.id_card_address = formInput.id_card_address || employeeDetailData.id_card_address
    // Address (Domicile)
    employeeUpdateRequest.residence_address = formInput.residence_address || employeeDetailData.residence_address
    // Emergency Contacts
    employeeUpdateRequest.emergency_contacts = JSON.stringify(emergencyContacts)
    // Lock Status
    employeeUpdateRequest.is_lock = false

    await employeeApi.employeeControllerUpdateEmployee(employeeDetailData?.id, employeeUpdateRequest)

    employeeIdChecker(employeeDetailData?.id)
    if (direction === 'next') {
      gotoNext()
    } else if (direction === 'prev') {
      gotoPrev()
    }
  }

  useEffect(() => {
    setValue('gender', employeeDetailData?.gender)
    setValue('religion', employeeDetailData?.religion)
    setValue('marital_status', employeeDetailData?.marital_status)
    setValue('foreign_nationality_text', employeeDetailData?.nationality)
    setValue('nationality', employeeDetailData?.nationality)
    setValue('pob', employeeDetailData?.pob)
    if (employeeDetailData?.dob) {
      setBirthdate(new Date(employeeDetailData?.dob))
    }
    setValue('phone_number', employeeDetailData?.phone_number?.split('_')[1])
    setPhoneNumberCode(employeeDetailData?.phone_number?.split('_')[0] || phoneNumberCode)
    setValue('id_card_address', employeeDetailData?.id_card_address)
    setValue('residence_address', employeeDetailData?.residence_address)

    employeeDetailData?.emergency_contacts &&
      setEmergencyContacts(JSON.parse(employeeDetailData?.emergency_contacts as unknown as string))

    if (employeeDetailData?.nationality === 'wni' || employeeDetailData?.nationality === null) {
      setIsForeignRendered(false)
      const evaluationradioType = document.getElementById(`wni`) as HTMLInputElement
      evaluationradioType.checked = true
    } else {
      setIsForeignRendered(true)
      const evaluationradioType = document.getElementById(`wna`) as HTMLInputElement
      const foreignTextInput = document.getElementById(`foreign_nationality_text`) as HTMLInputElement
      evaluationradioType.checked = true
      if (foreignTextInput) {
        setTimeout(() => {
          foreignTextInput.value = employeeDetailData?.nationality
        }, 200)
      }
    }
  }, [employeeDetailData, setValue])

  useEffect(() => {
    mutate(getLocalSession('employee_id'))
  }, [mutate])

  if (employeeDetailError) {
    return <pre>Error: {JSON.stringify(employeeDetailError, null, 2)}</pre>
  }

  return (
    <form onSubmit={handleSubmit(submitPersonalIdentity, errorSubmitData)} className="flex-auto">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Personal Identity</h2>
        <p className="mb-5 text-sm text-gray-600">Please input your new employee personal identity information</p>

        <div className="form-data-container">
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Personal Data</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="gender" className="input-label">
                  Gender <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange } }) => (
                    <>
                      <ListboxSelect
                        className="w-full"
                        lists={['Male', 'Female'].map((item) => ({
                          name: item,
                        }))}
                        isPlaceholder={true}
                        handleChange={(position) => {
                          onChange(position)
                        }}
                        id="gender"
                        value={getValues('gender') || ''}
                      >
                        Select gender
                      </ListboxSelect>
                    </>
                  )}
                />
              </div>
              <div>
                <label htmlFor="religion" className="input-label">
                  Religion <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="religion"
                  render={({ field: { onChange } }) => (
                    <ListboxSelect
                      className="w-full"
                      lists={['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Konghucu', 'Lain-lain'].map((item) => ({
                        name: item,
                      }))}
                      isPlaceholder={true}
                      handleChange={(religion) => {
                        onChange(religion)
                      }}
                      id="religion"
                      value={getValues('religion') || ''}
                    >
                      Select religion
                    </ListboxSelect>
                  )}
                />
              </div>
              <div>
                <label htmlFor="marital_status" className="input-label">
                  Marital Status <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="marital_status"
                  render={({ field: { onChange } }) => (
                    <ListboxSelect
                      className="w-full"
                      lists={['Single', 'Married'].map((item) => ({
                        name: item,
                      }))}
                      isPlaceholder={true}
                      handleChange={(marital_status) => {
                        onChange(marital_status)
                      }}
                      id="marital_status"
                      value={getValues('marital_status') || ''}
                    >
                      Select marital status
                    </ListboxSelect>
                  )}
                />
              </div>
              <div>
                <label htmlFor="nationality" className="input-label">
                  Nationality <span className="text-sm text-error-400">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2" onClick={() => setIsForeignRendered(false)}>
                    <input
                      {...register('nationality')}
                      type="radio"
                      id="wni"
                      value="wni"
                      className="radio-button"
                      defaultChecked
                    />
                    <label htmlFor="wni" className="font-medium text-gray-700 hover:cursor-pointer">
                      Warga Negara Indonesia
                    </label>
                  </div>
                  <div className="inline-flex items-center gap-2" onClick={() => setIsForeignRendered(true)}>
                    <input {...register('nationality')} type="radio" id="wna" value="wna" className="radio-button" />
                    <label htmlFor="wna" className="font-medium text-gray-700 hover:cursor-pointer">
                      Warga Negara Asing
                    </label>
                  </div>
                </div>
                {isForeignRendered ? (
                  <div className="mt-6">
                    <label htmlFor="foreign_nationality_text" className="input-label">
                      Nationality Country (if WNA)
                    </label>
                    <Controller
                      control={control}
                      name="foreign_nationality_text"
                      rules={{
                        required: 'Please specify foreign nationality country',
                      }}
                      render={({ field: { onChange }, fieldState: { invalid } }) => (
                        <>
                          <Input
                            type="text"
                            id="foreign_nationality_text"
                            placeholder="Nationality Country"
                            onChange={onChange}
                            value={
                              getValues('foreign_nationality_text') === 'wni'
                                ? ''
                                : getValues('foreign_nationality_text')
                            }
                            error={invalid}
                          />
                          {errors.foreign_nationality_text && (
                            <span className="input-hint-text error">{errors.foreign_nationality_text?.message}</span>
                          )}
                        </>
                      )}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Birth Information</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="birthplace" className="input-label">
                  Birthplace
                </label>
                <Controller
                  control={control}
                  name="pob"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="pob"
                      placeholder="Where the employee born"
                      onChange={onChange}
                      value={getValues('pob') || ''}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="dob" className="input-label">
                  Birthdate
                </label>
                <Controller
                  control={control}
                  name="dob"
                  render={({ field: { onChange } }) => (
                    <DatePickerCalendar
                      isUsingCustomHeader={true}
                      id="dob"
                      selected={birthdate}
                      onChange={(date: Date) => {
                        onChange(date)
                        setBirthdate(date)
                      }}
                      useArrow={true}
                      placeholder="When the employee born"
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Contacts</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="phone_number" className="input-label">
                  Phone Number <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="phone_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="number"
                      id="phone_number"
                      placeholder="Write phone number"
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
                      value={getValues('phone_number') || employeeDetailData?.phone_number || undefined}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Address</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="id_card_address" className="input-label">
                  Address (based on ID)
                </label>
                <textarea
                  {...register(`id_card_address`)}
                  id="id_card_address"
                  className="textarea-input"
                  rows={5}
                  placeholder="Write employee address based on their main identity documents"
                ></textarea>
              </div>
              <div>
                <label htmlFor="residence_address" className="input-label">
                  Address (Domicile)
                </label>
                <textarea
                  {...register(`residence_address`)}
                  id="residence_address"
                  className="textarea-input"
                  rows={5}
                  placeholder="Write employee domicile address (where they are currently located)"
                ></textarea>
              </div>
            </div>
          </div>
          <div className="form-data-item items-start">
            <div className="form-data-information">
              <p className="form-data-title">
                Emergency
                <br />
                Contacts
              </p>
            </div>
            <div className="form-data-content">
              {emergencyContacts.map((item, index) => (
                <div
                  key={item.emergency_id}
                  className="flex items-center justify-between rounded-lg border border-gray-300 py-4 pl-6 pr-4"
                >
                  <span className="text-sm font-medium text-gray-900">{index < 9 ? `0${++index}` : ++index}</span>
                  <div className="ml-6 mr-auto flex flex-col">
                    <p className="truncate text-sm font-medium text-gray-900">{item.emergency_name}</p>
                    <span className="text-sm text-gray-600">{item.emergency_relationship}</span>
                  </div>
                  <div className="flex items-center text-right">
                    <p className="mr-6 text-sm font-medium text-gray-900">
                      {item.emergency_phone_number.replace('_', '')}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        btnType="normal"
                        size="sm"
                        variant="secondary-gray"
                        btnFormat="square"
                        onClick={() => handleEmergencyContactAction(item.emergency_id, 'delete')}
                      >
                        <Trash01Icon className="h-5 w-5 stroke-gray-700" />
                      </Button>
                      <Button
                        type="button"
                        btnType="normal"
                        size="sm"
                        variant="secondary-gray"
                        btnFormat="square"
                        onClick={() => handleEmergencyContactAction(item.emergency_id, 'edit')}
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
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="emergency_name" className="input-label">
                      Name
                    </label>
                    <Controller
                      control={control}
                      name="emergency_name"
                      render={({ field: { onChange } }) => (
                        <Input
                          type="text"
                          id="emergency_name"
                          placeholder="Name"
                          value={getValues('emergency_name') || ''}
                          onChange={onChange}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label htmlFor="emergency_relationship" className="input-label">
                      Relationship
                    </label>
                    <Controller
                      control={control}
                      name="emergency_relationship"
                      render={({ field: { onChange } }) => (
                        <Input
                          type="text"
                          id="emergency_relationship"
                          placeholder="e.g “Spouse”"
                          value={getValues('emergency_relationship') || ''}
                          onChange={onChange}
                        />
                      )}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="emergency_phone_number" className="input-label">
                    Number
                  </label>
                  <Controller
                    control={control}
                    name="emergency_phone_number"
                    render={({ field: { onChange } }) => (
                      <Input
                        type="number"
                        id="emergency_phone_number"
                        placeholder="Emergency contact number"
                        inputGroup={true}
                        inputSelectionHandler={emergencyContactNumberHandler}
                        inputSelectionInit={emergencyContactNumberCode}
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
                          getValues('emergency_phone_number') || emergencyContact?.emergency_phone_number || undefined
                        }
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
                  <p id="emergency-button-text">Add as Emergency Contact</p>
                  <UsersPlusIcon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 right-0 z-10 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
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
Identity Document
===========================================================================  */

const IdentityDocumentsSubPage = ({ submitReference, employeeIdChecker }: RefReferenceType) => {
  const { handleFormWizardHistory } = useAddEmployeeFormWizardProvider()
  const router = useRouter()
  const [nationalityIDDoc, setNationalityIDDoc] = useState([])
  const [npwpDoc, setNpwpDoc] = useState([])
  const [cvDoc, setCVDoc] = useState([])
  const [bpjsHealthDoc, setBPJSHealthDoc] = useState([])
  const [bpjsWorkerDoc, setBPJSWorkerDoc] = useState([])
  const [healthInsuranceDoc, setHealthInsuranceDoc] = useState([])
  const [passportDoc, setPassportDoc] = useState([])
  const [familyIDCardDoc, setFamilyIDCardDoc] = useState([])
  const [recruitmentDocumentsDoc, setRecruitmentDocumentsDoc] = useState([])
  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)
  const [passportExpiry, setPassportExpiry] = useState<Date | null>(null)
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    identity_path: boolean
    npwp_path: boolean
    bpjs_path: boolean
    bpjs_emp_path: boolean
    passport_path: boolean
    kk_path: boolean
    insurance_path: boolean
    cv_path: boolean
    recruitment_documents: boolean
  }>({
    identity_path: false,
    npwp_path: false,
    bpjs_path: false,
    bpjs_emp_path: false,
    passport_path: false,
    kk_path: false,
    insurance_path: false,
    cv_path: false,
    recruitment_documents: false,
  })
  const [linkCollections, setLinkCollections] = useState([])

  const gotoPrev = () => {
    handleFormWizardHistory('identityDocuments', 'personalIdentity', IDENTITY_DOCUMENT_TOTAL_PAGE)
  }

  const gotoNext = () => {
    handleFormWizardHistory('identityDocuments', 'paymentData', IDENTITY_DOCUMENT_TOTAL_PAGE)
  }

  const { mutate } = useSWRConfig()
  const { data: employeeDetailData, error: employeeDetailError } = useSWRImmutable<Employee, Error>(
    getLocalSession('employee_id') ? getLocalSession('employee_id') : null,
    getEmployeeDetail,
  )

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<Employee>()

  let temporaryMultipleFileUpload = []
  const handleUploadFile = async (fileObjects: File[], bucketName: BucketsUnion) => {
    if (!Array.isArray(fileObjects)) return

    const employeeId = employeeDetailData.id
    fileObjects.map(async (fileObject) => {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)

      let identifier = null
      if (bucketName === BucketsEnum.employee_recruitment_docs) {
        identifier = `${slugify(fileObject.name)}-${fileObject.lastModified}`
      } else {
        identifier = bucketName
      }

      const fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], fileObject, {
        headers: {
          'Content-Type': fileObject.type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          if (bucketName === BucketsEnum.employee_recruitment_docs) {
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

      const employeeUpdate = {} as EmployeeUpdateRequest

      switch (bucketName) {
        case BucketsEnum.employee_pass_photo:
          employeeUpdate.pass_photo_path = [`${BucketsEnum.employee_pass_photo}/${fileNameS3}`]
          break
        case BucketsEnum.employee_identity_card:
          employeeUpdate.identity_path = [`${BucketsEnum.employee_identity_card}/${fileNameS3}`]
          break
        case BucketsEnum.employee_npwp:
          employeeUpdate.npwp_path = [`${BucketsEnum.employee_npwp}/${fileNameS3}`]
          break
        case BucketsEnum.employee_bpjs:
          employeeUpdate.bpjs_path = [`${BucketsEnum.employee_bpjs}/${fileNameS3}`]
          break
        case BucketsEnum.employee_bpjs_emp:
          employeeUpdate.bpjs_emp_path = [`${BucketsEnum.employee_bpjs_emp}/${fileNameS3}`]
          break
        case BucketsEnum.employee_passport:
          employeeUpdate.passport_path = [`${BucketsEnum.employee_passport}/${fileNameS3}`]
          break
        case BucketsEnum.employee_kk:
          employeeUpdate.kk_path = [`${BucketsEnum.employee_kk}/${fileNameS3}`]
          break
        case BucketsEnum.employee_insurance:
          employeeUpdate.health_insurance_path = [`${BucketsEnum.employee_insurance}/${fileNameS3}`]
          break
        case BucketsEnum.employee_cv:
          employeeUpdate.cv_path = [`${BucketsEnum.employee_cv}/${fileNameS3}`]
          break
        case BucketsEnum.employee_recruitment_docs:
          const rulesEmployeeRecruitmentDocs = [`${BucketsEnum.employee_recruitment_docs}/${fileNameS3}`]

          const otherPath = employeeDetailData?.recruitment_documents_path
            ? employeeDetailData.recruitment_documents_path
            : []

          temporaryMultipleFileUpload = [...temporaryMultipleFileUpload, ...otherPath, ...rulesEmployeeRecruitmentDocs]

          const uniqueMultipleFileUpload = [...new Set(temporaryMultipleFileUpload)]

          const recruitmentDocumentReady = [...uniqueMultipleFileUpload]

          // Delete links, because file is already uploaded
          const filesOnlyNoLinksInside = recruitmentDocumentReady
            .map((item) => {
              if (item.includes(BucketsEnum.employee_recruitment_docs)) {
                return item
              }
            })
            .filter(Boolean)

          employeeUpdate.recruitment_documents_path = filesOnlyNoLinksInside
          break
        case BucketsEnum.employee_bank:
          employeeUpdate.bank_path = [`${BucketsEnum.employee_bank}/${fileNameS3}`]
          break
        default:
          break
      }

      await employeeApi.employeeControllerUpdateEmployee(employeeId, employeeUpdate as EmployeeUpdateRequest)
    })
  }

  const submitIdentityDocument: SubmitHandler<Employee> = async (formInput) => {
    if (
      switchTogglableButton.identity_path &&
      formInput.identity_path &&
      !isValidUrl(formInput.identity_path as unknown as string)
    ) {
      setError('identity_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.npwp_path &&
      formInput.npwp_path &&
      !isValidUrl(formInput.npwp_path as unknown as string)
    ) {
      setError('npwp_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }

    if (
      switchTogglableButton.bpjs_path &&
      formInput.bpjs_path &&
      !isValidUrl(formInput.bpjs_path as unknown as string)
    ) {
      setError('bpjs_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.bpjs_emp_path &&
      formInput.bpjs_emp_path &&
      !isValidUrl(formInput.bpjs_emp_path as unknown as string)
    ) {
      setError('bpjs_emp_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.passport_path &&
      formInput.passport_path &&
      !isValidUrl(formInput.passport_path as unknown as string)
    ) {
      setError('passport_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (switchTogglableButton.kk_path && formInput.kk_path && !isValidUrl(formInput.kk_path as unknown as string)) {
      setError('kk_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (
      switchTogglableButton.insurance_path &&
      formInput.insurance_path &&
      !isValidUrl(formInput.insurance_path as unknown as string)
    ) {
      setError('insurance_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }
    if (switchTogglableButton.cv_path && formInput.cv_path && !isValidUrl(formInput.cv_path as unknown as string)) {
      setError('cv_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }

    const employeeUpdateRequest = {} as EmployeeUpdateRequest

    // Nationality Identity Card
    employeeUpdateRequest.identity_number = formInput.identity_number || employeeDetailData.identity_number
    // NPWP
    employeeUpdateRequest.npwp_number = formInput.npwp_number || employeeDetailData.npwp_number
    // BPJS
    employeeUpdateRequest.bpjs_number = formInput.bpjs_number || employeeDetailData.bpjs_number
    // BPJS Employment
    employeeUpdateRequest.bpjs_tkn_number = formInput.bpjs_tkn_number || employeeDetailData.bpjs_tkn_number
    // Passport Number
    employeeUpdateRequest.passport_number = formInput.passport_number || employeeDetailData.passport_number
    // Passport Expiry
    employeeUpdateRequest.passport_expiry = formInput.passport_expiry || employeeDetailData.passport_expiry
    // Family Identity Card
    employeeUpdateRequest.kk_number = formInput.kk_number || employeeDetailData.kk_number
    // Health Insurance
    employeeUpdateRequest.health_insurance_number =
      formInput.health_insurance_number || employeeDetailData.health_insurance_number
    // CV
    employeeUpdateRequest.cv_title = formInput.cv_title || employeeDetailData.cv_title
    // Recruitment Documents
    employeeUpdateRequest.recruitment_documents_title =
      formInput.recruitment_documents_title || employeeDetailData.recruitment_documents_title
    // Lock Status
    employeeUpdateRequest.is_lock = false

    if (switchTogglableButton.identity_path) {
      employeeUpdateRequest.identity_path = formInput.identity_path
        ? [`${formInput.identity_path}`]
        : employeeDetailData.identity_path
    }
    if (switchTogglableButton.npwp_path) {
      employeeUpdateRequest.npwp_path = formInput.npwp_path ? [`${formInput.npwp_path}`] : employeeDetailData.npwp_path
    }
    if (switchTogglableButton.bpjs_path) {
      employeeUpdateRequest.bpjs_path = formInput.bpjs_path ? [`${formInput.bpjs_path}`] : employeeDetailData.bpjs_path
    }
    if (switchTogglableButton.bpjs_emp_path) {
      employeeUpdateRequest.bpjs_emp_path = formInput.bpjs_emp_path
        ? [`${formInput.bpjs_emp_path}`]
        : employeeDetailData.bpjs_emp_path
    }
    if (switchTogglableButton.passport_path) {
      employeeUpdateRequest.passport_path = formInput.passport_path
        ? [`${formInput.passport_path}`]
        : employeeDetailData.passport_path
    }
    if (switchTogglableButton.kk_path) {
      employeeUpdateRequest.kk_path = formInput.kk_path ? [`${formInput.kk_path}`] : employeeDetailData.kk_path
    }
    if (switchTogglableButton.insurance_path) {
      employeeUpdateRequest.insurance_path = formInput.insurance_path
        ? [`${formInput.insurance_path}`]
        : employeeDetailData.insurance_path
    }
    if (switchTogglableButton.cv_path) {
      employeeUpdateRequest.cv_path = formInput.cv_path ? [`${formInput.cv_path}`] : employeeDetailData.cv_path
    }
    if (switchTogglableButton.recruitment_documents) {
      employeeUpdateRequest.recruitment_documents_path = linkCollections
    }

    await employeeApi.employeeControllerUpdateEmployee(employeeDetailData?.id, employeeUpdateRequest)

    employeeIdChecker(employeeDetailData?.id)
    if (direction === 'next') {
      gotoNext()
    } else if (direction === 'prev') {
      gotoPrev()
    }
  }

  const deleteIdentityFile = async (filename: string) => {
    setValue('identity_path', undefined)
    setNationalityIDDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteNpwpFile = async (filename: string) => {
    setValue('npwp_path', undefined)
    setNpwpDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteBpjsFile = async (filename: string) => {
    setValue('bpjs_path', undefined)
    setBPJSHealthDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteBpjsWorkerFile = async (filename: string) => {
    setValue('bpjs_emp_path', undefined)
    setBPJSWorkerDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deletePassportFile = async (filename: string) => {
    setValue('passport_path', undefined)
    setPassportDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteFamilyIDCardFile = async (filename: string) => {
    setValue('kk_path', undefined)
    setFamilyIDCardDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteHealthInsuranceFile = async (filename: string) => {
    setValue('insurance_path', undefined)
    setHealthInsuranceDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteCVFile = async (filename: string) => {
    setValue('cv_path', undefined)
    setCVDoc((prev) => prev.filter((item) => item.path !== filename))
  }
  const deleteRecruitmentDocumentsFile = async (filename: string) => {
    setValue('recruitment_documents_path', undefined)
    setRecruitmentDocumentsDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const handleDeleteFile = (file: any, identifier: string) => {
    const employeeUpdate = {} as EmployeeUpdateRequest

    const fileCollections = employeeDetailData?.[identifier]

    const filteredContracts = fileCollections.filter((fileCollection) => fileCollection !== file)

    employeeUpdate[identifier] = filteredContracts

    const employeeRes = employeeApi.employeeControllerUpdateEmployee(
      employeeDetailData?.id,
      employeeUpdate as EmployeeUpdateRequest,
    )

    toast.promise(employeeRes, {
      pending: `Deleting ${file}`,
      success: `${file} deleted`,
      error: 'Promise rejected 🤯',
    })

    employeeRes.then(() => {
      mutate(getLocalSession('employee_id'))
    })
  }

  useEffect(() => {
    setValue('identity_number', employeeDetailData?.identity_number)
    setValue('npwp_number', employeeDetailData?.npwp_number)
    setValue('bpjs_number', employeeDetailData?.bpjs_number)
    setValue('bpjs_tkn_number', employeeDetailData?.bpjs_tkn_number)
    setValue('passport_number', employeeDetailData?.passport_number)
    setValue('passport_expiry', employeeDetailData?.passport_expiry)
    if (employeeDetailData?.passport_expiry) {
      setPassportExpiry(new Date(employeeDetailData?.passport_expiry))
    }
    setValue('kk_number', employeeDetailData?.kk_number)
    setValue('health_insurance_number', employeeDetailData?.health_insurance_number)
    setValue('cv_title', employeeDetailData?.cv_title)
    setValue('recruitment_documents_title', employeeDetailData?.recruitment_documents_title)

    if (isValidUrl(employeeDetailData.identity_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        identity_path: true,
      }))
      setValue('identity_path', employeeDetailData?.identity_path)
    }
    if (isValidUrl(employeeDetailData.npwp_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        npwp_path: true,
      }))
      setValue('npwp_path', employeeDetailData?.npwp_path)
    }
    if (isValidUrl(employeeDetailData.bpjs_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        bpjs_path: true,
      }))
      setValue('bpjs_path', employeeDetailData?.bpjs_path)
    }
    if (isValidUrl(employeeDetailData.bpjs_emp_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        bpjs_emp_path: true,
      }))
      setValue('bpjs_emp_path', employeeDetailData?.bpjs_emp_path)
    }
    if (isValidUrl(employeeDetailData.passport_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        passport_path: true,
      }))
      setValue('passport_path', employeeDetailData?.passport_path)
    }
    if (isValidUrl(employeeDetailData.kk_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        kk_path: true,
      }))
      setValue('kk_path', employeeDetailData?.kk_path)
    }
    if (isValidUrl(employeeDetailData.insurance_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        insurance_path: true,
      }))
      setValue('insurance_path', employeeDetailData?.insurance_path)
    }
    if (isValidUrl(employeeDetailData.cv_path?.[0])) {
      setSwitchTogglableButton((prev) => ({
        ...prev,
        cv_path: true,
      }))
      setValue('cv_path', employeeDetailData?.cv_path)
    }

    if (
      employeeDetailData.recruitment_documents_path.length > 0 &&
      !employeeDetailData.recruitment_documents_path[0]?.includes(BucketsEnum.employee_recruitment_docs)
    ) {
      setSwitchTogglableButton({
        ...switchTogglableButton,
        recruitment_documents: true,
      })
      setLinkCollections(employeeDetailData.recruitment_documents_path)
    }
  }, [employeeDetailData, setValue])

  useEffect(() => {
    mutate(getLocalSession('employee_id'))
  }, [mutate])

  if (employeeDetailError) {
    return <pre>Error: {JSON.stringify(employeeDetailError, null, 2)}</pre>
  }

  return (
    <form onSubmit={handleSubmit(submitIdentityDocument, errorSubmitData)} className="flex-auto">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Identity Documents</h2>
        <p className="mb-5 text-sm text-gray-600">Please upload your new employee identity document files</p>

        <div className="form-data-container">
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">
                Nationality
                <br /> Identity Card
              </p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="identity_number" className="input-label">
                  ID Number <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="identity_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="identity_number"
                      placeholder="National Identity Number"
                      onChange={onChange}
                      value={getValues('identity_number') || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="identity_path"
                label="Documents Upload"
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
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deleteIdentityFile}
                existingFilePath={employeeDetailData?.identity_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.identity_path?.[0]
                  if (file) handleDeleteFile(file, 'identity_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">NPWP</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="npwp_number" className="input-label">
                  ID Number <span className="text-sm text-error-400">*</span>
                </label>
                <Controller
                  control={control}
                  name="npwp_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="npwp_number"
                      placeholder="NPWP Number"
                      onChange={onChange}
                      value={getValues('npwp_number') || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="npwp_path"
                label="Documents Upload"
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
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deleteNpwpFile}
                existingFilePath={employeeDetailData?.npwp_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.npwp_path?.[0]
                  if (file) handleDeleteFile(file, 'npwp_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">BPJS Kesehatan</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="bpjs_number" className="input-label">
                  ID Number
                </label>
                <Controller
                  control={control}
                  name="bpjs_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="bpjs_number"
                      placeholder="BPJS-Kesehatan Number"
                      onChange={onChange}
                      value={getValues('bpjs_number') || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="bpjs_path"
                label="Documents Upload"
                fieldKey={BucketsEnum.employee_bpjs}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.bpjs_path}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    bpjs_path: !prev.bpjs_path,
                  }))
                }}
                bucketName={BucketsEnum.employee_bpjs}
                uploadProgress={tempProgressUpload}
                uploadedFiles={bpjsHealthDoc}
                setUploadedFiles={setBPJSHealthDoc}
                handleUploadFile={(files, fieldKey) => {
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deleteBpjsFile}
                existingFilePath={employeeDetailData?.bpjs_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.bpjs_path?.[0]
                  if (file) handleDeleteFile(file, 'bpjs_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">BPJS Ketenagakerjaan</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="bpjs_tkn_number" className="input-label">
                  ID Number
                </label>
                <Controller
                  control={control}
                  name="bpjs_tkn_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="bpjs_tkn_number"
                      placeholder="BPJS-Ketenagakerjaan Number"
                      onChange={onChange}
                      value={getValues('bpjs_tkn_number') || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="bpjs_emp_path"
                label="Documents Upload"
                fieldKey={BucketsEnum.employee_bpjs_emp}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.bpjs_emp_path}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    bpjs_emp_path: !prev.bpjs_emp_path,
                  }))
                }}
                bucketName={BucketsEnum.employee_bpjs_emp}
                uploadProgress={tempProgressUpload}
                uploadedFiles={bpjsWorkerDoc}
                setUploadedFiles={setBPJSWorkerDoc}
                handleUploadFile={(files, fieldKey) => {
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deleteBpjsWorkerFile}
                existingFilePath={employeeDetailData?.bpjs_emp_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.bpjs_emp_path?.[0]
                  if (file) handleDeleteFile(file, 'bpjs_emp_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Passport</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="passport_number" className="input-label">
                  ID Number
                </label>
                <Controller
                  control={control}
                  name="passport_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="passport_number"
                      placeholder="Passport Number"
                      onChange={onChange}
                      value={getValues('passport_number') || ''}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="passport_expiry" className="input-label">
                  Expiry Date
                </label>
                <Controller
                  control={control}
                  name="passport_expiry"
                  render={({ field: { onChange } }) => (
                    <DatePickerCalendar
                      id="passport_expiry"
                      selected={passportExpiry}
                      onChange={(date: Date) => {
                        setPassportExpiry(date)
                        onChange(date)
                      }}
                      useArrow={true}
                      placeholder="Expiry Date"
                      isUsingCustomHeader={true}
                      typeYears="future"
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="passport_path"
                label="Documents Upload"
                fieldKey={BucketsEnum.employee_passport}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.passport_path}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    passport_path: !prev.passport_path,
                  }))
                }}
                bucketName={BucketsEnum.employee_passport}
                uploadProgress={tempProgressUpload}
                uploadedFiles={passportDoc}
                setUploadedFiles={setPassportDoc}
                handleUploadFile={(files, fieldKey) => {
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deletePassportFile}
                existingFilePath={employeeDetailData?.passport_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.passport_path?.[0]
                  if (file) handleDeleteFile(file, 'passport_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Family Identity Card</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="kk_number" className="input-label">
                  ID Number
                </label>
                <Controller
                  control={control}
                  name="kk_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="kk_number"
                      placeholder="Family Identity Card"
                      onChange={onChange}
                      value={getValues('kk_number') || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="kk_path"
                label="Documents Upload"
                fieldKey={BucketsEnum.employee_kk}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.kk_path}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    kk_path: !prev.kk_path,
                  }))
                }}
                bucketName={BucketsEnum.employee_kk}
                uploadProgress={tempProgressUpload}
                uploadedFiles={familyIDCardDoc}
                setUploadedFiles={setFamilyIDCardDoc}
                handleUploadFile={(files, fieldKey) => {
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deleteFamilyIDCardFile}
                existingFilePath={employeeDetailData?.kk_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.kk_path?.[0]
                  if (file) handleDeleteFile(file, 'kk_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Health Insurance</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="health_insurance_number" className="input-label">
                  ID Number
                </label>
                <Controller
                  control={control}
                  name="health_insurance_number"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      type="text"
                      id="health_insurance_number"
                      placeholder="Health Insurance"
                      onChange={onChange}
                      value={value || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="insurance_path"
                label="Documents Upload"
                fieldKey={BucketsEnum.employee_insurance}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.insurance_path}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    insurance_path: !prev.insurance_path,
                  }))
                }}
                bucketName={BucketsEnum.employee_insurance}
                uploadProgress={tempProgressUpload}
                uploadedFiles={healthInsuranceDoc}
                setUploadedFiles={setHealthInsuranceDoc}
                handleUploadFile={(files, fieldKey) => {
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deleteHealthInsuranceFile}
                existingFilePath={employeeDetailData?.insurance_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.insurance_path?.[0]
                  if (file) handleDeleteFile(file, 'insurance_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">CV</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="cv_title" className="input-label">
                  CV Title
                </label>
                <Controller
                  control={control}
                  name="cv_title"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="cv_title"
                      placeholder="Title of CV (recommend to state the year of the CV)"
                      onChange={onChange}
                      value={getValues('cv_title') || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadField
                name="cv_path"
                label="Documents Upload"
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
                  handleUploadFile(files, fieldKey as BucketsUnion)
                }}
                deleteFilePath={deleteCVFile}
                existingFilePath={employeeDetailData?.cv_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.cv_path?.[0]
                  if (file) handleDeleteFile(file, 'cv_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Recruitment Documents</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="recruitment_documents_title" className="input-label">
                  Documents Title
                </label>
                <Controller
                  control={control}
                  name="recruitment_documents_title"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="recruitment_documents_title"
                      placeholder="Title of Documents"
                      onChange={onChange}
                      value={getValues('recruitment_documents_title') || ''}
                    />
                  )}
                />
              </div>
              <SwitchableUploadFieldMultiple
                name="recruitment_documents_path"
                label="Documents Upload"
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.recruitment_documents}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    recruitment_documents: !prev.recruitment_documents,
                  }))
                  setRecruitmentDocumentsDoc([])
                  setLinkCollections([])
                }}
                linkCollections={linkCollections}
                setLinkCollections={setLinkCollections}
                bucketName={BucketsEnum.employee_recruitment_docs}
                uploadProgress={tempProgressUpload}
                uploadedFiles={recruitmentDocumentsDoc}
                setUploadedFiles={setRecruitmentDocumentsDoc}
                handleUploadFile={handleUploadFile}
                deleteFilePath={deleteRecruitmentDocumentsFile}
                maxFiles={10}
                informationText="IMAGE or DOCUMENTS (max 5MB each file)"
                existingFiles={employeeDetailData?.recruitment_documents_path}
                handleDeleteExistingFile={(file) => handleDeleteFile(file, 'recruitment_documents_path')}
                existingFileBucketCheck={BucketsEnum.employee_recruitment_docs}
                isEditMode={!!router?.query?.id}
                isRequired={false}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 right-0 z-10 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
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
Payment Data
===========================================================================  */

const PaymentDataSubPage = ({ submitReference, employeeIdChecker }: RefReferenceType) => {
  const { handleFormWizardHistory } = useAddEmployeeFormWizardProvider()
  const router = useRouter()
  const [bankDoc, setBankDoc] = useState([])
  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    bankDocument: boolean
  }>({
    bankDocument: false,
  })

  const { mutate } = useSWRConfig()
  const { data: employeeDetailData, error: employeeDetailError } = useSWRImmutable<Employee, Error>(
    getLocalSession('employee_id') ? getLocalSession('employee_id') : null,
    getEmployeeDetail,
  )

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<Employee>()

  const submitPaymentData: SubmitHandler<Employee> = async (formInput) => {
    if (!switchTogglableButton.bankDocument && formInput?.bank_path) {
      const id = employeeDetailData?.id
      const file = formInput.bank_path[0] as unknown as File

      handleUploadFile(file, BucketsEnum.employee_bank, id)
    }

    if (
      switchTogglableButton.bankDocument &&
      formInput.bank_path &&
      !isValidUrl(formInput.bank_path as unknown as string)
    ) {
      setError('bank_path', {
        message: 'Please enter a valid URL',
        type: 'custom',
      })
      return
    }

    const employeeUpdateRequest = {} as EmployeeUpdateRequest

    employeeUpdateRequest.bank_name = formInput.bank_name || employeeDetailData.bank_name
    employeeUpdateRequest.bank_branch = formInput.bank_branch || employeeDetailData.bank_branch
    employeeUpdateRequest.bank_acc_number = formInput.bank_acc_number || employeeDetailData.bank_acc_number
    employeeUpdateRequest.bank_acc_name = formInput.bank_acc_name || employeeDetailData.bank_acc_name
    employeeUpdateRequest.swift_code = formInput.swift_code || employeeDetailData.swift_code
    if (switchTogglableButton.bankDocument) {
      employeeUpdateRequest.bank_path = formInput.bank_path ? [`${formInput.bank_path}`] : employeeDetailData.bank_path
    }
    employeeUpdateRequest.is_lock = false

    await employeeApi.employeeControllerUpdateEmployee(employeeDetailData?.id, employeeUpdateRequest)

    employeeIdChecker(employeeDetailData?.id)
    if (direction === 'next') {
      gotoNext()
    } else if (direction === 'prev') {
      gotoPrev()
    }
  }

  const handleUploadFile = async (fileObject: File, bucketName: BucketsUnion, employeeId: string) => {
    const presignUrl = await fileApi.fileControllerGetPresignUrl(fileObject.name, bucketName)

    const fileNameS3 = String(presignUrl.data.data).split('::')[0]
    const identifier = bucketName

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

    const employeeUpdateRequest = {} as EmployeeUpdateRequest

    switch (bucketName) {
      case BucketsEnum.employee_bank:
        employeeUpdateRequest.bank_path = [`${BucketsEnum.employee_bank}/${fileNameS3}`]
        break
      default:
        break
    }

    employeeApi.employeeControllerUpdateEmployee(employeeId, employeeUpdateRequest as EmployeeUpdateRequest)
  }

  const deleteBankFile = async (filename: string) => {
    setValue('bank_path', undefined)
    setBankDoc((prev) => prev.filter((item) => item.path !== filename))
  }

  const handleDeleteFile = (file: any, identifier: string) => {
    const employeeUpdate = {} as EmployeeUpdateRequest

    const fileCollections = employeeDetailData?.[identifier]

    const filteredContracts = fileCollections.filter((fileCollection) => fileCollection !== file)

    employeeUpdate[identifier] = filteredContracts

    const employeeRes = employeeApi.employeeControllerUpdateEmployee(
      employeeDetailData?.id,
      employeeUpdate as EmployeeUpdateRequest,
    )

    toast.promise(employeeRes, {
      pending: `Deleting ${file}`,
      success: `${file} deleted`,
      error: 'Promise rejected 🤯',
    })

    employeeRes.then(() => {
      mutate(getLocalSession('employee_id'))
    })
  }

  const gotoPrev = () => {
    handleFormWizardHistory('paymentData', 'identityDocuments', PAYMENT_DATA_TOTAL_PAGE)
  }

  const gotoNext = () => {
    handleFormWizardHistory('paymentData', 'finalStepOnboarding', PAYMENT_DATA_TOTAL_PAGE)
  }

  useEffect(() => {
    setValue('bank_name', employeeDetailData?.bank_name)
    setValue('bank_branch', employeeDetailData?.bank_branch)
    setValue('bank_acc_number', employeeDetailData?.bank_acc_number)
    setValue('bank_acc_name', employeeDetailData?.bank_acc_name)
    setValue('swift_code', employeeDetailData?.swift_code)
    if (isValidUrl(employeeDetailData.bank_path?.[0])) {
      setSwitchTogglableButton({
        bankDocument: true,
      })
      setValue('bank_path', employeeDetailData?.bank_path)
    }
  }, [employeeDetailData, setValue])

  useEffect(() => {
    mutate(getLocalSession('employee_id'))
  }, [mutate])

  if (employeeDetailError) {
    return <pre>Error: {JSON.stringify(employeeDetailError, null, 2)}</pre>
  }

  return (
    <form onSubmit={handleSubmit(submitPaymentData, errorSubmitData)} className="flex-auto">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Payment Data</h2>
        <p className="mb-5 text-sm text-gray-600">
          Please upload your new employee documents regarding to their payment
        </p>

        <div className="form-data-container">
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Bank Data</p>
            </div>
            <div className="form-data-content">
              <div>
                <label htmlFor="bank_name" className="input-label">
                  Bank Name
                </label>
                <Controller
                  control={control}
                  name="bank_name"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="bank_name"
                      placeholder="Bank Name"
                      onChange={onChange}
                      value={getValues('bank_name') || ''}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="bank_branch" className="input-label">
                  Branch Name
                </label>
                <Controller
                  control={control}
                  name="bank_branch"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="bank_branch"
                      placeholder="Bank Branch Name"
                      onChange={onChange}
                      value={getValues('bank_branch') || ''}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="bank_acc_number" className="input-label">
                  Bank Number
                </label>
                <Controller
                  control={control}
                  name="bank_acc_number"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="number"
                      id="bank_acc_number"
                      placeholder="Bank Number"
                      onChange={onChange}
                      value={getValues('bank_acc_number') || ''}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="accountHolderName" className="input-label">
                  Account Holder Name
                </label>
                <Controller
                  control={control}
                  name="bank_acc_name"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="bank_acc_name"
                      placeholder="Account Holder Name"
                      onChange={onChange}
                      value={getValues('bank_acc_name') || ''}
                    />
                  )}
                />
              </div>
              <div>
                <label htmlFor="swift_code" className="input-label">
                  SWIFT Code
                </label>
                <Controller
                  control={control}
                  name="swift_code"
                  render={({ field: { onChange } }) => (
                    <Input
                      type="text"
                      id="swift_code"
                      placeholder="SWIFT Code"
                      onChange={onChange}
                      value={getValues('swift_code') || ''}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="form-data-item">
            <div className="form-data-information">
              <p className="form-data-title">Bank Documents</p>
            </div>
            <div className="form-data-content">
              <SwitchableUploadField
                name="bank_path"
                label="Documents Upload"
                fieldKey={BucketsEnum.employee_bank}
                control={control}
                errors={errors}
                setValue={setValue}
                isLinkMode={switchTogglableButton.bankDocument}
                onToggle={() => {
                  setSwitchTogglableButton((prev) => ({
                    ...prev,
                    bankDocument: !prev.bankDocument,
                  }))
                }}
                bucketName={BucketsEnum.employee_bank}
                uploadProgress={tempProgressUpload}
                uploadedFiles={bankDoc}
                setUploadedFiles={setBankDoc}
                handleUploadFile={(files, fieldKey) => {
                  if (employeeDetailData) {
                    handleUploadFile(files[0], fieldKey as BucketsUnion, employeeDetailData.id)
                  }
                }}
                deleteFilePath={deleteBankFile}
                existingFilePath={employeeDetailData?.bank_path?.[0] || null}
                handleDeleteExistingFile={() => {
                  const file = employeeDetailData?.bank_path?.[0]
                  if (file) handleDeleteFile(file, 'bank_path')
                }}
                isEditMode={router.query?.path?.length > 0}
                isRequired={false}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 right-0 z-10 mt-12 flex items-center justify-end gap-3 border-t border-t-gray-200 bg-white py-4">
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
Final Step On Boarding
===========================================================================  */

const FinalStepOnboardingSubPage = ({ submitReference, employeeIdChecker }: RefReferenceType) => {
  const { mutate } = useSWRConfig()
  const router = useRouter()
  const { handleFormWizardHistory } = useAddEmployeeFormWizardProvider()

  const [direction, setDirection] = useState<'prev' | 'next' | null>(null)

  const gotoPrev = () => {
    handleFormWizardHistory('finalStepOnboarding', 'paymentData', 0)
  }

  const gotoNext = () => {
    router.replace('/dashboard/internal/employee')
  }

  const { data: employeeDetailData, error: employeeDetailError } = useSWRImmutable<Employee, Error>(
    getLocalSession('employee_id') ? getLocalSession('employee_id') : null,
    getEmployeeDetail,
  )

  // console.log('FINAL STEP DATA', employeeDetailData)

  const { handleSubmit } = useForm<Employee>()

  const submitFinalStep: SubmitHandler<Employee> = async () => {
    // const employeeUpdateRequest = {} as EmployeeUpdateRequest
    // if (employeeDetailData?.form_progress? < 100) {
    //   employeeUpdateRequest.is_lock = false
    // } else {
    //   employeeUpdateRequest.is_lock = true
    // }

    // await employeeApi.employeeControllerUpdateEmployee(
    //   employeeDetailData?.id,
    //   employeeUpdateRequest,
    // )
    employeeIdChecker(employeeDetailData?.id)
    if (direction === 'next') {
      gotoNext()
    } else if (direction === 'prev') {
      gotoPrev()
    }
  }

  useEffect(() => {
    mutate(getLocalSession('employee_id'))
  }, [mutate])

  if (employeeDetailError) {
    return <pre>Error: {JSON.stringify(employeeDetailError, null, 2)}</pre>
  }

  if (employeeDetailError) {
    return <pre>Error: {JSON.stringify(employeeDetailError, null, 2)}</pre>
  }

  return (
    <form onSubmit={handleSubmit(submitFinalStep, errorSubmitData)} className="flex-auto">
      <div className="flex-auto">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Final Step Onboarding</h2>
        <p className="mb-5 text-sm text-gray-600">Please check again all the necessary information</p>

        <div className="form-data-container">
          <div className="mx-auto max-w-[552px] text-center">
            <div className="mx-auto mb-9 h-20 w-20">
              <CircularProgressbar
                value={employeeDetailData.form_progress}
                text={`${employeeDetailData.form_progress}%`}
                styles={buildStyles({
                  pathTransitionDuration: 0.5,
                  pathColor: `#FF7B00`,
                  textColor: '#344054',
                  trailColor: '#EAECF0',
                  backgroundColor: '#fff',
                })}
              />
            </div>
            <p className="mb-1 font-semibold text-gray-900">Confirmation</p>
            <span className="inline-block text-sm text-gray-600">Are you sure you want to submit this employee?</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 border-b border-b-gray-200 pb-6">
          <Button type="button" btnType="normal" size="md" variant="secondary-gray" onClick={gotoPrev}>
            <ChevronLeftIcon className="h-5 w-5 stroke-gray-700" />
            Back
          </Button>
          <Button type="submit" btnType="normal" size="md" variant="secondary" onClick={() => setDirection('next')}>
            Submit New Employee
            <ChevronRightIcon className="h-5 w-5 stroke-primary-700" />
          </Button>
          <button type="submit" className="hidden" ref={submitReference} onClick={() => setDirection(null)}></button>
        </div>
      </div>
    </form>
  )
}

const errorSubmitData = (errors: any) => {
  // console.log('errorSubmitData', errors)

  for (const error of Object.values(errors)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (error.ref) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const elementReference = error.ref.name

      document.getElementById(elementReference)?.closest('div')?.scrollIntoView({ behavior: 'smooth' })
      break
    }
  }
}
