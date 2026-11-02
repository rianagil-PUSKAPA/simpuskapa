import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { AvatarPlacement } from '@/components/AvatarPlacement'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { Input } from '@/components/Input'
import { ListboxSelect } from '@/components/ListboxSelect'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { TableCore } from '@/components/TableCore'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { FileAttachment02Icon } from '@/components/icon/FileAttachment02Icon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { User01Icon } from '@/components/icon/User01Icon'
import { UserSquareIcon } from '@/components/icon/UserSquareIcon'
import { BucketsEnum } from '@/shared/file.system'
import { DynamicProgressType } from '@/types/global'
import { downloadS3File, employeeApi, fileApi, supervisorByEmployee } from '@/utils/apiRequestHelper'
import { DEPARTMENT_OPTIONS } from '@/utils/constant'
import { dateFormatToISO, isValidUrl } from '@/utils/globalHelper'
import { createColumnHelper } from '@tanstack/react-table'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import Link from 'next/link'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { checkIsItemExist } from '@/utils/globalHelper'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { CreateEmployeeContractRequest, Employee, EmployeeContract } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
dayjs.extend(utc)

type EmploymentContractProps = {
  employeeDetail: Employee
}

const columnHelperEmploymentContract = createColumnHelper<EmployeeContract>()

const columnsContractTable = [
  columnHelperEmploymentContract.accessor((row) => row.department, {
    id: 'department',
    header: 'Department',
    size: 160,
    cell: (info) => <p className="font-medium text-gray-900">{info.getValue()}</p>,
  }),
  columnHelperEmploymentContract.accessor((row) => row.position, {
    id: 'position',
    header: 'Position & Department',
    size: 210,
  }),
  columnHelperEmploymentContract.accessor((row) => row.spv_name, {
    id: 'supervisor',
    header: 'Supervisor',
    size: 170,
    cell: (info) => (
      <AvatarLabelGroup
        size={'sm'}
        image={info.row.original.spv_avatar}
        text={info.row.original.spv_name || 'No supervisor for supervisor'}
        statusIcon={false}
      />
    ),
  }),
  columnHelperEmploymentContract.accessor((row) => row.emp_status, {
    id: 'emp_status',
    header: 'Emp. Status',
    size: 140,
    cell: (info) => (
      <Badge size="sm" color="blue-light" icon="none">
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelperEmploymentContract.accessor((row) => row.contract_started, {
    id: 'joinedDate',
    header: 'Joined Date',
    size: 140,
    cell: (info) => dayjs(info.renderValue()).format('DD MMMM YYYY'),
  }),
  columnHelperEmploymentContract.accessor('id', {
    header: '',
    enableSorting: false,
    size: 72,
    cell: (info) => (
      <div className="flex items-center justify-end">
        {isValidUrl(info.row.original.doc_path && info.row.original.doc_path[0]) ? (
          <Link href={info.row.original.doc_path[0]} target="_blank" rel="noopener noreferrer">
            <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
              <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
            </Button>
          </Link>
        ) : (
          <Button
            type="button"
            btnType="normal"
            size="md"
            variant="secondary-gray"
            btnFormat="square"
            onClick={() => {
              if (info.row.original.doc_path[0]) {
                downloadS3File(info.row.original.doc_path[0])
              } else {
                toast.warning(`Employee contract not found, not uploaded yet`, {
                  autoClose: 10000,
                  icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
                })
              }
            }}
          >
            <FileAttachment02Icon className="h-5 w-5 stroke-gray-600" />
          </Button>
        )}
      </div>
    ),
  }),
]

const getEmployee = async (parameter: string) => {
  const id = parameter.split('/')[1]

  const contractEmployeeRes = await employeeApi.employeeControllerGetEmployeeContracts(id as string)

  return contractEmployeeRes.data
}

export const EmploymentContract = ({ employeeDetail }: EmploymentContractProps) => {
  const router = useRouter()
  const { userLoggedinInformation } = useDashboardContext()

  const [addContractDrawer, setAddContractDrawer] = useState<boolean>(false)
  const [resignLayoffDrawer, setResignLayoffDrawer] = useState<boolean>(false)
  const [empPosition, setEmpPosition] = useState<string[]>([])
  const [supervisors, setSupervisors] = useState<Employee[]>([])
  const [supervisor, setSupervisor] = useState<Employee | null>(null)
  const [joinedDate, setJoinedDate] = useState<Date | null>(null)
  const [terminationDate, setTerminationDate] = useState<Date | null>(null)
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [contractDocument, setContractDocument] = useState([])
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    training_certificate: boolean
    resign_document: boolean
  }>({
    training_certificate: false,
    resign_document: false,
  })

  const {
    data: employeeContractData,
    error: employeeContractError,
    trigger: employeeContractTrigger,
  } = useSWRMutation(router.query.id ? `${BucketsEnum.employee_contract}/${router.query.id}` : null, getEmployee)

  const {
    handleSubmit: handleSubmitAddContract,
    control: controlAddContract,
    getValues: getValuesAddContract,
    setValue: setValueAddContract,
    reset: resetAddContract,
    formState: { errors: errorsAddContract },
  } = useForm<CreateEmployeeContractRequest>()

  const {
    handleSubmit: handleSubmitResignLayoff,
    control: controlResignLayoff,
    getValues: getValuesResignLayoff,
    setValue: setValueResignLayoff,
    reset: resetResignLayoff,
    formState: { errors: errorsResignLayoff },
  } = useForm<CreateEmployeeContractRequest>()

  const handleDepartmentChanges = (value: string) => {
    const findPosition = DEPARTMENT_OPTIONS.find((item) => item.department === value)

    setEmpPosition(findPosition.position)
  }

  const openAddContractDrawer = () => {
    setAddContractDrawer(true)
  }
  const closeAddContractDrawer = useCallback(() => {
    setAddContractDrawer(false)
    setJoinedDate(null)
    setContractDocument([])
    setTempProgressUpload({})
    resetAddContract({
      department: '',
      position: '',
      emp_status: '',
      supervisor_id: '',
      contract_started: '',
      contract_number: '',
      doc_path: null,
    })
  }, [resetAddContract])
  const openResignLayoffDrawer = () => {
    setResignLayoffDrawer(true)
  }
  const closeResignLayoffDrawer = useCallback(() => {
    setResignLayoffDrawer(false)
    setTerminationDate(null)
    setContractDocument([])
    setTempProgressUpload({})
    resetResignLayoff({
      emp_status: '',
      contract_started: '',
      contract_number: '',
      doc_path: null,
    })
  }, [resetResignLayoff])

  const addContract: SubmitHandler<CreateEmployeeContractRequest> = async (formInput) => {
    const identifier = 'add_contract'
    const employee = await employeeApi.employeeControllerGetAllEmployee()
    const employeeList = employee.data.data
    const supervisor = employeeList.find((employee: Employee) => employee.full_name === formInput.supervisor_id)

    let fileNameS3 = ''

    if (!switchTogglableButton.training_certificate) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        contractDocument[0].name,
        BucketsEnum.employee_contract,
      )

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

    const createEmployeeContractRequest: CreateEmployeeContractRequest = {
      id: '', // better ngga usah disubmit
      contract_number: formInput.contract_number,
      supervisor_id: supervisor?.id,
      employee_id: employeeDetail?.id,
      contract_name: '',
      position: formInput.position,
      department: formInput.department,
      emp_status: formInput.emp_status,
      contract_started: formInput.contract_started
        ? dateFormatToISO(dayjs(formInput.contract_started).utc().format())
        : dateFormatToISO(dayjs().utc().format()),
      contract_ended: null,
      doc_path: switchTogglableButton.training_certificate
        ? [`${formInput.doc_path}`]
        : [`${BucketsEnum.employee_contract}/${fileNameS3}`],
    }

    const createEmployeeContracts = employeeApi.employeeControllerCreateEmployeeContracts(
      employeeDetail.id,
      createEmployeeContractRequest,
      false,
    )

    toast.promise(createEmployeeContracts, {
      pending: 'Adding New Contract',
      success: 'New Contract Addedd',
      error: 'Promise rejected 🤯',
    })

    createEmployeeContracts.then(() => {
      closeAddContractDrawer()
      employeeContractTrigger()
    })
  }

  const resignLayoff: SubmitHandler<CreateEmployeeContractRequest> = async (formInput) => {
    let fileNameS3 = ''

    if (!switchTogglableButton.resign_document) {
      const identifier = 'resign_layoff'
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        contractDocument[0].name,
        BucketsEnum.employee_contract,
      )
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

    const createEmployeeResignRequest: CreateEmployeeContractRequest = {
      id: '', // better ngga usah disubmit
      contract_number: formInput.contract_number,
      supervisor_id: supervisor?.id,
      employee_id: employeeDetail?.id,
      contract_name: '',
      position: employeeDetail.employee_contracts[0].position,
      department: employeeDetail.employee_contracts[0].department,
      emp_status: formInput.emp_status,
      contract_started: formInput.contract_started
        ? dateFormatToISO(dayjs(formInput.contract_started).utc().format())
        : dateFormatToISO(dayjs().utc().format()),
      contract_ended: formInput.contract_started
        ? dateFormatToISO(dayjs(formInput.contract_started).utc().format())
        : dateFormatToISO(dayjs().utc().format()),
      doc_path: switchTogglableButton.resign_document
        ? [`${formInput.doc_path}`]
        : [`${BucketsEnum.employee_contract}/${fileNameS3}`],
    }

    const createEmployeeContracts = employeeApi.employeeControllerCreateEmployeeContracts(
      employeeDetail.id,
      createEmployeeResignRequest,
      false,
    )

    toast.promise(createEmployeeContracts, {
      pending: `Adding ${formInput.emp_status} Contract`,
      success: `${formInput.emp_status} Contract Addedd`,
      error: 'Promise rejected 🤯',
    })

    createEmployeeContracts.then(() => {
      closeResignLayoffDrawer()
      employeeContractTrigger()
    })
  }

  // DELETE FILE : Single file upload on submit
  const deleteAddContractDocument = async (filename: string) => {
    setValueAddContract('doc_path', undefined)
    setContractDocument((prev) => prev.filter((item) => item.path !== filename))
  }

  // DELETE FILE : Single files upload on submit
  const deleteResignLayoffDocument = async (filename: string) => {
    setValueResignLayoff('doc_path', undefined)
    setContractDocument((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    const getAllSupervisors = async () => {
      const employee = await employeeApi.employeeControllerGetAllEmployee()

      const employeeList = employee.data.data

      const supervisors = employeeList?.filter((employee: Employee) => employee.user?.role.includes('supervisor'))

      setSupervisors(supervisors)
    }

    getAllSupervisors()

    const getSupervisor = async () => {
      const getSupervisorOfCurrentUser = await supervisorByEmployee(employeeDetail.employee_contracts[0].supervisor_id)
      setSupervisor(getSupervisorOfCurrentUser)
    }
    getSupervisor()
  }, [employeeDetail?.employee_contracts])

  useEffect(() => {
    employeeContractTrigger()
  }, [employeeContractTrigger])

  useEffect(() => {
    if (!resignLayoffDrawer) {
      closeResignLayoffDrawer()
    }
    if (!addContractDrawer) {
      closeAddContractDrawer()
    }
  }, [resignLayoffDrawer, addContractDrawer, closeResignLayoffDrawer, closeAddContractDrawer])

  if (employeeContractError) {
    return <pre>Error: {JSON.stringify(employeeContractError, null, 2)}</pre>
  }

  if (!employeeContractData) {
    return <></>
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-lg font-semibold text-gray-900">Employment & Contract</p>
          <p className="text-sm font-normal text-gray-600 ">
            All contract related employment data, sorted chronologically
          </p>
        </div>
        <div className="inline-flex items-center gap-4">
          {checkIsItemExist(userLoggedinInformation?.role, [
            RoleDefinition.HEAD_OF_OPERATION,
            'general_manager',
            RoleDefinition.ADMIN,
            RoleDefinition.SUPERADMIN,
          ]) ? (
            <Button type="button" btnType="normal" size="md" variant="secondary-gray" onClick={openResignLayoffDrawer}>
              Resign / Layoff Employee
            </Button>
          ) : null}
          {checkIsItemExist(userLoggedinInformation?.role, [
            RoleDefinition.HEAD_OF_OPERATION,
            'general_manager',
            RoleDefinition.ADMIN,
            RoleDefinition.SUPERADMIN,
          ]) ? (
            <Button type="button" btnType="normal" size="md" variant="primary" onClick={openAddContractDrawer}>
              Add New Contract
              <PlusIcon className="h-5 w-5 stroke-white" />
            </Button>
          ) : null}
        </div>
      </div>
      <TableCore data={employeeContractData?.data} columns={columnsContractTable} supportTableType="external" />

      {/* Add Contract */}
      <form onSubmit={handleSubmitAddContract(addContract)}>
        <Drawer
          isOpen={addContractDrawer}
          setIsOpen={setAddContractDrawer}
          title="Add New Contract"
          description="Employment Contract"
          icon={<UserSquareIcon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                className=""
                size="md"
                onClick={closeAddContractDrawer}
              >
                Cancel
              </Button>
            </>,
            <>
              <Button type="submit" btnType="normal" variant="primary" className="" size="md">
                Add Contract
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label className="input-label">Employee Name</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 shadow-xs">
                <AvatarPlacement
                  size="xs"
                  image={employeeDetail?.pass_photo_path?.[0]}
                  text={employeeDetail?.full_name}
                />
                <p className="capitalize text-gray-500">{employeeDetail?.full_name}</p>
              </div>
            </div>
            <div>
              <label htmlFor="department" className="input-label">
                Department
              </label>
              <Controller
                control={controlAddContract}
                name="department"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <ListboxSelect
                    className="w-full"
                    lists={DEPARTMENT_OPTIONS.map(({ department }) => ({
                      name: department,
                    }))}
                    isPlaceholder={true}
                    handleChange={(department) => {
                      handleDepartmentChanges(department)
                      onChange(department)
                    }}
                    id="department"
                    value={getValuesAddContract('department')}
                    error={invalid}
                  >
                    Select Department
                  </ListboxSelect>
                )}
              />
              {errorsAddContract.department && (
                <span className="input-hint-text error">{errorsAddContract.department?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="position" className="input-label">
                Position
              </label>
              <Controller
                control={controlAddContract}
                name="position"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <ListboxSelect
                    className="w-full"
                    lists={empPosition?.map((emp) => ({
                      name: emp,
                    }))}
                    isPlaceholder={true}
                    handleChange={(position) => {
                      onChange(position)
                    }}
                    id="position"
                    value={getValuesAddContract('position')}
                    error={invalid}
                  >
                    Select position
                  </ListboxSelect>
                )}
              />
              {errorsAddContract.position && (
                <span className="input-hint-text error">{errorsAddContract.position?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="emp_status" className="input-label">
                Employment Status
              </label>
              <Controller
                control={controlAddContract}
                name="emp_status"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <ListboxSelect
                    className="w-full"
                    lists={['Full Time', 'Part Time', 'Intern', 'Freelance'].map((emp_status) => ({
                      name: emp_status,
                    }))}
                    isPlaceholder={true}
                    handleChange={(emp_status) => {
                      onChange(emp_status)
                    }}
                    id="emp_status"
                    value={getValuesAddContract('emp_status')}
                    error={invalid}
                  >
                    Select employment status
                  </ListboxSelect>
                )}
              />
              {errorsAddContract.emp_status && (
                <span className="input-hint-text error">{errorsAddContract.emp_status?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="supervisor" className="input-label">
                Supervisor
              </label>
              <Controller
                control={controlAddContract}
                name="supervisor_id"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
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
                    id="supervisor_id"
                    value={getValuesAddContract('supervisor_id')}
                    error={invalid}
                  >
                    Select Supervisor
                  </ListboxSelect>
                )}
              />
              {errorsAddContract.supervisor_id && (
                <span className="input-hint-text error">{errorsAddContract.supervisor_id?.message}</span>
              )}
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label htmlFor="contract_started" className="input-label">
                Contract Effective Date
              </label>
              <Controller
                control={controlAddContract}
                name="contract_started"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <DatePickerCalendar
                    id="contract_started"
                    selected={joinedDate}
                    onChange={(date: Date) => {
                      setJoinedDate(date)
                      onChange(date)
                    }}
                    useArrow={true}
                    placeholder="When employee started working"
                    isUsingCustomHeader={true}
                    error={invalid}
                  />
                )}
              />
              {errorsAddContract.contract_started && (
                <span className="input-hint-text error">{errorsAddContract.contract_started?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="contract_number" className="input-label">
                Contract Number
              </label>
              <Controller
                control={controlAddContract}
                name="contract_number"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <Input
                    type="text"
                    id="contract_number"
                    placeholder="Contract Documents Number"
                    onChange={onChange}
                    value={getValuesAddContract('contract_number') || ''}
                    error={invalid}
                  />
                )}
              />
              {errorsAddContract.contract_number && (
                <span className="input-hint-text error">{errorsAddContract.contract_number?.message}</span>
              )}
            </div>
            <SwitchableUploadField
              name="doc_path"
              label="Training Certificate"
              fieldKey="add_contract"
              control={controlAddContract}
              errors={errorsAddContract}
              setValue={setValueAddContract}
              isLinkMode={switchTogglableButton.training_certificate}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  training_certificate: !prev.training_certificate,
                }))
                setContractDocument([])
              }}
              bucketName={BucketsEnum.employee_contract}
              uploadProgress={tempProgressUpload}
              uploadedFiles={contractDocument}
              setUploadedFiles={setContractDocument}
              handleUploadFile={(files) => {
                setContractDocument(files as any)
              }}
              deleteFilePath={deleteAddContractDocument}
              existingFilePath={null}
              handleDeleteExistingFile={() => {}}
              isEditMode={false}
              isRequired={true}
            />
          </div>
        </Drawer>
      </form>

      {/* Resign / Layoff */}
      <form onSubmit={handleSubmitResignLayoff(resignLayoff)}>
        <Drawer
          isOpen={resignLayoffDrawer}
          setIsOpen={setResignLayoffDrawer}
          title="Resign / Layoff"
          description="Contract Termination"
          icon={<UserSquareIcon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                size="md"
                onClick={closeResignLayoffDrawer}
              >
                Cancel
              </Button>
            </>,
            <>
              <Button type="submit" btnType="normal" variant="primary" className="" size="md">
                Finish Resign / Layoff
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label className="input-label">Employee Name</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 shadow-xs">
                <AvatarPlacement
                  size="xs"
                  image={employeeDetail?.pass_photo_path?.[0]}
                  text={employeeDetail?.full_name}
                />
                <p className="capitalize text-gray-500">{employeeDetail?.full_name}</p>
              </div>
            </div>
            <div>
              <label htmlFor="department" className="input-label">
                Current Department
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-500 shadow-xs">
                {employeeDetail?.employee_contracts[0].department}
              </div>
            </div>
            <div>
              <label htmlFor="position" className="input-label">
                Current Position
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-500 shadow-xs">
                {employeeDetail?.employee_contracts[0].position}
              </div>
            </div>
            <div>
              <label htmlFor="emp_status" className="input-label">
                Current Employment Status
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-500 shadow-xs">
                {employeeDetail?.employee_contracts[0].emp_status}
              </div>
            </div>
            <div>
              <label htmlFor="supervisor" className="input-label">
                Supervisor
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 shadow-xs">
                <AvatarPlacement
                  size="xs"
                  image={supervisor?.pass_photo_path?.[0] || ''}
                  text={supervisor?.full_name}
                />
                <p className="capitalize text-gray-500">{supervisor?.full_name || 'No supervisor for supervisor'}</p>
              </div>
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label htmlFor="emp_status" className="input-label">
                Reason
              </label>
              <Controller
                control={controlResignLayoff}
                name="emp_status"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <ListboxSelect
                    className="w-full"
                    lists={['Resign', 'Layoff'].map((item) => ({
                      name: item,
                    }))}
                    isPlaceholder={true}
                    handleChange={(emp_status) => {
                      onChange(emp_status)
                    }}
                    id="emp_status"
                    value={getValuesResignLayoff('emp_status')}
                    error={invalid}
                  >
                    Select Reason
                  </ListboxSelect>
                )}
              />
              {errorsResignLayoff.emp_status && (
                <span className="input-hint-text error">{errorsResignLayoff.emp_status?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="contract_started" className="input-label">
                Termination Date
              </label>
              <Controller
                control={controlResignLayoff}
                name="contract_started"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <DatePickerCalendar
                    id="contract_started"
                    selected={terminationDate}
                    onChange={(date: Date) => {
                      setTerminationDate(date)
                      onChange(date)
                    }}
                    useArrow={true}
                    placeholder="When employee stop working"
                    isUsingCustomHeader={true}
                    error={invalid}
                  />
                )}
              />
              {errorsResignLayoff.contract_started && (
                <span className="input-hint-text error">{errorsResignLayoff.contract_started?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="contract_number" className="input-label">
                Contract Number
              </label>
              <Controller
                control={controlResignLayoff}
                name="contract_number"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <Input
                    type="text"
                    id="contract_number"
                    placeholder="Contract Documents Number"
                    onChange={onChange}
                    value={getValuesResignLayoff('contract_number') || ''}
                    error={invalid}
                  />
                )}
              />
              {errorsResignLayoff.contract_number && (
                <span className="input-hint-text error">{errorsResignLayoff.contract_number?.message}</span>
              )}
            </div>
            <SwitchableUploadField
              name="doc_path"
              label="Documents"
              fieldKey="resign_layoff"
              control={controlResignLayoff}
              errors={errorsResignLayoff}
              setValue={setValueResignLayoff}
              isLinkMode={switchTogglableButton.resign_document}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  resign_document: !prev.resign_document,
                }))
                setContractDocument([])
              }}
              bucketName={BucketsEnum.employee_contract}
              uploadProgress={tempProgressUpload}
              uploadedFiles={contractDocument}
              setUploadedFiles={setContractDocument}
              handleUploadFile={(files) => {
                setContractDocument(files as any)
              }}
              deleteFilePath={deleteResignLayoffDocument}
              existingFilePath={null}
              handleDeleteExistingFile={() => {}}
              isEditMode={false}
              isRequired={true}
              // linkPlaceholder="Insert external link here"
              // linkHintText='Make sure the file is "Anyone with Link can view"'
            />
          </div>
        </Drawer>
      </form>
    </>
  )
}
