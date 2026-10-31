import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { TableCore } from '@/components/TableCore'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { DynamicProgressType } from '@/types/global'
import { downloadS3File, employeeApi, fileApi } from '@/utils/apiRequestHelper'
import { DEPARTMENT_OPTIONS, MAIN_URL_FE } from '@/utils/constant'
import { dateFormatToISO, isValidUrl } from '@/utils/globalHelper'
import { Menu, Transition } from '@headlessui/react'
import { createColumnHelper } from '@tanstack/react-table'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { CreateEmployeeContractRequest, Employee, EmployeeContract as EmployeeContractType } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

dayjs.extend(utc)

const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const AvatarPlacement: any = dynamic(() => import('@/components/AvatarPlacement').then((mod) => mod.AvatarPlacement))
const Badge: any = dynamic(() => import('@/components/Badge').then((mod) => mod.Badge))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const DatePickerCalendar: any = dynamic(() =>
  import('@/components/DatePickerCalendar').then((mod) => mod.DatePickerCalendar),
)
const Drawer: any = dynamic(() => import('@/components/Drawer').then((mod) => mod.Drawer))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const ListboxSelect: any = dynamic(() => import('@/components/ListboxSelect').then((mod) => mod.ListboxSelect))
const ChevronDownIcon: any = dynamic(() =>
  import('@/components/icon/ChevronDownIcon').then((mod) => mod.ChevronDownIcon),
)
const FileAttachment02Icon: any = dynamic(() =>
  import('@/components/icon/FileAttachment02Icon').then((mod) => mod.FileAttachment02Icon),
)
const FileDownload03Icon: any = dynamic(() =>
  import('@/components/icon/FileDownload03Icon').then((mod) => mod.FileDownload03Icon),
)
const FilePlus02Icon: any = dynamic(() => import('@/components/icon/FilePlus02Icon').then((mod) => mod.FilePlus02Icon))
const User01Icon: any = dynamic(() => import('@/components/icon/User01Icon').then((mod) => mod.User01Icon))
const UserSquareIcon: any = dynamic(() => import('@/components/icon/UserSquareIcon').then((mod) => mod.UserSquareIcon))
const UsersXIcon: any = dynamic(() => import('@/components/icon/UsersXIcon').then((mod) => mod.UsersXIcon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

const columnHelper = createColumnHelper<EmployeeContractType>()

const columnsActiveEmployeeTable = [
  columnHelper.accessor((row) => row.contract_number, {
    id: 'contract_number',
    header: 'Contract Num.',
    size: 170,
    cell: (info) => <p className="break-words text-sm font-medium text-gray-900">{info.renderValue() || '-'}</p>,
  }),
  columnHelper.accessor((row) => `${row.emp_detail.full_name} - ${row.emp_detail.full_name}`, {
    id: 'employee',
    header: 'Employee',
    size: 280,
    cell: (info) => (
      <div className="w-64">
        <AvatarLabelGroup
          light={true}
          size={'sm'}
          image={info.row.original.emp_detail.pass_photo?.[0]}
          text={info.row.original.emp_detail.full_name}
          supportingText={info.row.original.emp_detail.email}
          statusIcon={false}
        />
      </div>
    ),
  }),
  columnHelper.accessor((row) => row.department, {
    id: 'department',
    header: 'Department',
    size: 220,
    cell: (info) => (
      <div>
        <p className="text-sm font-medium text-gray-900">{info.renderValue()}</p>
        <p className="text-sm text-gray-600">{info.row.original.position}</p>
      </div>
    ),
  }),
  columnHelper.accessor((row) => row.position, {
    id: 'position_hidden',
  }),
  columnHelper.accessor((row) => row.spv_name, {
    id: 'supervisor',
    header: 'Supervisor',
    size: 210,
    cell: (info) => (
      <>
        {info.row.original.spv_name ? (
          <AvatarLabelGroup
            size={'sm'}
            image={info.row.original.spv_avatar?.[0]}
            text={info.row.original.spv_name}
            statusIcon={false}
          />
        ) : (
          '-'
        )}
      </>
    ),
  }),
  columnHelper.accessor((row) => row.emp_status, {
    id: 'emp_status',
    header: 'Emp. Status',
    size: 140,
    cell: (info) => (
      <div className="w-24">
        <Badge size="sm" color="blue-light" icon="none">
          {info.getValue()}
        </Badge>
      </div>
    ),
  }),
  columnHelper.accessor((row) => row.contract_started, {
    id: 'contract_started',
    header: 'Effective Day',
    size: 140,
    cell: (info) => (
      <div className="w-28">
        <p className="text-sm text-gray-600">{dayjs(info.renderValue()).format('DD MMM YYYY')}</p>
      </div>
    ),
  }),
  columnHelper.accessor('id', {
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
            size="sm"
            variant="secondary-gray"
            btnFormat="square"
            onClick={() => downloadS3File(info.row.original.doc_path[0])}
          >
            <FileAttachment02Icon className="h-5 w-5 stroke-gray-600" />
          </Button>
        )}
      </div>
    ),
  }),
]

const getEmploymentContract = async (spvId: string) => {
  const employemntContract = await employeeApi.employeeControllerGetAllEmployeeContract(spvId)

  return employemntContract.data.data
}

const getAllEmployee = async () => {
  const allEmployee = await employeeApi.employeeControllerGetAllEmployee()
  return allEmployee.data.data
}

const EmployeeContract = ({ spv_id }) => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'active-employee': { index: 0, slug: 'active-employee' },
    subordinate: { index: 1, slug: 'subordinate' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'active-employee') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'active-employee'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const [addContractDrawer, setAddContractDrawer] = useState<boolean>(false)
  const [resignLayoffDrawer, setResignLayoffDrawer] = useState<boolean>(false)
  const [empPosition, setEmpPosition] = useState<string[]>([])
  const [supervisors, setSupervisors] = useState<Employee[]>([])
  const [allEmployee, setAllEmployee] = useState<Employee[]>([])
  const [employeeContractDetail, setEmployeeContractDetail] = useState<EmployeeContractType | null>(null)
  const [joinedDate, setJoinedDate] = useState<Date | null>(null)
  const [terminationDate, setTerminationDate] = useState<Date | null>(null)
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [contractDocument, setContractDocument] = useState([])
  const [documentsPath, setDocumentsPath] = useState<object | null>(null)
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    contractDocuments: boolean
  }>({
    contractDocuments: false,
  })

  const {
    data: employmentContractData,
    error: employmentContractError,
    trigger: employmentContractTrigger,
  } = useSWRMutation([null], ([spv_id]) => getEmploymentContract(spv_id))

  const { data: employmentContractSpvData, trigger: employmentContractSpvTrigger } = useSWRMutation(
    [userLoggedinInformation ? userLoggedinInformation.employee_id : null],
    ([spv_id]) => getEmploymentContract(spv_id),
  )

  const {
    data: employeeData,
    error: employeeError,
    trigger: employeeTrigger,
  } = useSWRMutation(`employees`, getAllEmployee)

  const {
    handleSubmit: handleSubmitAddContract,
    control: controlAddContract,
    getValues: getValuesAddContract,
    setValue: setValuesAddContract,
    reset: resetAddContract,
    formState: { errors: errorsAddContract },
  } = useForm<CreateEmployeeContractRequest>()

  const {
    handleSubmit: handleSubmitResignLayoff,
    control: controlResignLayoff,
    getValues: getValuesResignLayoff,
    setValue: setValueResignLayoff,
    reset: resetResignLayoff,
    formState: { errors: errorsResignLayoff, isSubmitting: isSubmittingResignLayoff },
  } = useForm<CreateEmployeeContractRequest>()

  const openAddContractDrawer = () => {
    setAddContractDrawer(true)
  }

  const closeAddContractDrawer = useCallback(() => {
    setAddContractDrawer(false)
    setJoinedDate(null)
    setContractDocument([])
    setTempProgressUpload({})
    resetAddContract({
      employee_id: '',
      department: '',
      position: '',
      emp_status: '',
      supervisor_id: '',
      contract_started: '',
      contract_number: '',
      doc_path: null,
    })
    setSwitchTogglableButton((prev) => ({
      ...prev,
      contractDocuments: false,
    }))
  }, [resetAddContract])

  const openResignLayoffDrawer = () => {
    setResignLayoffDrawer(true)
  }
  const closeResignLayoffDrawer = useCallback(() => {
    setResignLayoffDrawer(false)
    setTerminationDate(null)
    setEmployeeContractDetail(null)
    setContractDocument([])
    setTempProgressUpload({})
    resetResignLayoff({
      emp_status: '',
      contract_started: '',
      contract_number: '',
      doc_path: null,
    })
    setSwitchTogglableButton((prev) => ({
      ...prev,
      contractDocuments: false,
    }))
  }, [resetResignLayoff])

  const addContract: SubmitHandler<CreateEmployeeContractRequest> = async (formInput) => {
    let fileNameS3 = ''

    if (!switchTogglableButton.contractDocuments) {
      const identifier = 'add_contract'
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

    const supervisor = employeeData.find((employee: Employee) => employee.full_name === formInput.supervisor_id)
    const selectedEmployee = employeeData.find((employee: Employee) => employee.full_name === formInput.employee_id)

    if (!documentsPath && !switchTogglableButton.contractDocuments) {
      toast.warning('Please wait for file to be uploaded', {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      return false
    }

    const createEmployeeContractRequest: CreateEmployeeContractRequest = {
      id: '',
      contract_number: formInput.contract_number,
      supervisor_id: supervisor?.id,
      employee_id: selectedEmployee?.id,
      contract_name: '',
      position: formInput.position,
      department: formInput.department,
      emp_status: formInput.emp_status,
      contract_started: formInput.contract_started
        ? dateFormatToISO(dayjs(formInput.contract_started).utc().format())
        : dateFormatToISO(dayjs().utc().format()),
      contract_ended: null,
      doc_path: switchTogglableButton.contractDocuments
        ? [`${formInput.doc_path}`]
        : [`${BucketsEnum.employee_contract}/${fileNameS3}`],
    }

    // console.log('createEmployeeContractRequest', createEmployeeContractRequest)
    // return false

    const createEmployeeContracts = employeeApi.employeeControllerCreateEmployeeContracts(
      selectedEmployee?.id,
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
      employmentContractTrigger()
      employmentContractSpvTrigger()
    })
  }

  const resignLayoff: SubmitHandler<CreateEmployeeContractRequest> = async (formInput) => {
    let fileNameS3 = ''

    if (!switchTogglableButton.contractDocuments) {
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

    if (!employeeContractDetail?.employee_id) {
      toast.warning('Please select an employee', {
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
        autoClose: 10000,
      })
      return false
    }

    const createEmployeeResignRequest: CreateEmployeeContractRequest = {
      id: '',
      contract_number: formInput.contract_number,
      supervisor_id: employeeContractDetail.supervisor_id,
      employee_id: employeeContractDetail?.employee_id,
      contract_name: '',
      position: employeeContractDetail.position,
      department: employeeContractDetail.department,
      emp_status: 'Resign',
      contract_started: formInput.contract_started
        ? dateFormatToISO(dayjs(formInput.contract_started).utc().format())
        : dateFormatToISO(dayjs().utc().format()),
      contract_ended: null,
      doc_path: switchTogglableButton.contractDocuments
        ? [`${formInput.doc_path}`]
        : [`${BucketsEnum.employee_contract}/${fileNameS3}`],
    }

    const createEmployeeResignContracts = employeeApi.employeeControllerCreateEmployeeContracts(
      employeeContractDetail.employee_id,
      createEmployeeResignRequest,
      false,
    )

    toast.promise(createEmployeeResignContracts, {
      pending: `Adding ${formInput.emp_status} Contract`,
      success: `${formInput.emp_status} Contract Addedd`,
      error: 'Promise rejected 🤯',
    })

    createEmployeeResignContracts.then(() => {
      closeResignLayoffDrawer()
      employmentContractTrigger()
      employmentContractSpvTrigger()
    })
  }

  const handleDepartmentChanges = (value: string) => {
    const findPosition = DEPARTMENT_OPTIONS.find((item) => item.department === value)

    setEmpPosition(findPosition.position)
  }

  const handleExportContract = async () => {
    const exportContract = await employeeApi.employeeControllerExportEmployeeContract()

    const link = document.createElement('a')
    const fileName = `contracts_${dayjs().format('DD/MM/YYYY')}.xls`
    link.setAttribute('download', fileName)
    link.href = URL.createObjectURL(new Blob([exportContract as undefined as BlobPart]))

    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const generateRestResignInformation = (employee_name: string) => {
    const employmentContract = employmentContractData.find((item) => item.emp_detail.full_name === employee_name)
    setEmployeeContractDetail(employmentContract)
  }

  const handleIndexTabs = (value: number) => {
    const tab = getTabFromIndex(value)
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab,
      },
    })
  }

  // DELETE FILE : Multiple files upload on change
  const deleteAddContractDocument = async (filename: string) => {
    setValuesAddContract('doc_path', null)
    setDocumentsPath((prev) => {
      prev['doc_path'] = prev['doc_path'].filter((path) => !path.includes(filename))
      return prev
    })
    setContractDocument((prev) => prev.filter((item) => item.path !== filename))
  }

  // DELETE FILE : Single files upload on submit
  const deleteResignLayoffDocument = async (filename: string) => {
    setValueResignLayoff('doc_path', null)
    setContractDocument((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    if (!employeeData) return

    const getAllSupervisors = async () => {
      const supervisors = employeeData?.filter((employee: Employee) => employee.user?.role.includes('supervisor'))

      setSupervisors(supervisors)
    }

    getAllSupervisors()
  }, [employeeData])

  useEffect(() => {
    employeeTrigger()
    employmentContractTrigger()
    employmentContractSpvTrigger()
  }, [router.isReady])

  useEffect(() => {
    if (!addContractDrawer) {
      closeAddContractDrawer()
    }
    if (!resignLayoffDrawer) {
      closeResignLayoffDrawer()
    }
  }, [addContractDrawer, closeAddContractDrawer, closeResignLayoffDrawer, resignLayoffDrawer])

  useEffect(() => {
    setAllEmployee(employeeData?.filter((item) => item.user_id !== spv_id))
  }, [employeeData, spv_id])

  if (employeeError) {
    return <pre>Error: {JSON.stringify(employeeError, null, 2)}</pre>
  }

  if (employmentContractError) {
    return <pre>Error: {JSON.stringify(employmentContractError, null, 2)}</pre>
  }

  return (
    <>
      <NextSeo title="Employee List" canonical={`${MAIN_URL_FE}dashboard/internal/employee/contract`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          { title: 'Employment & Contract', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--people">
        <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">Employment & Contract</h1>
            <p className="text-base font-normal text-gray-600">
              Manage your team members and their account permissions here.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
                Actions
                <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-700">Employment & Contract</p>
                  </div>
                  <div className="flex flex-col gap-0.5 px-1.5 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          className={cn(
                            active ? 'bg-gray-50' : 'text-gray-700',
                            `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                          )}
                          onClick={openAddContractDrawer}
                        >
                          <FilePlus02Icon className="h-4 w-4 stroke-gray-700" />
                          Add New Contract
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          className={cn(
                            active ? 'bg-gray-50' : 'text-gray-700',
                            `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                          )}
                          onClick={openResignLayoffDrawer}
                        >
                          <UsersXIcon className="h-4 w-4 stroke-gray-700" />
                          Resign / Layoff
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="flex flex-col gap-0.5 px-1.5 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="button"
                          className={cn(
                            active ? 'bg-gray-50' : 'text-gray-700',
                            `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                          )}
                          onClick={handleExportContract}
                        >
                          <FileDownload03Icon className="h-4 w-4 stroke-gray-700" />
                          Export All Contract
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
        <HorizontalTabs
          tabLists={['Active Employee', 'Subordinate']}
          type="underline"
          size="sm"
          handleIndex={handleIndexTabs}
          index={index}
          gapLayout={true}
        >
          <div>
            <TableCore
              supportTableType="normal"
              data={employmentContractData}
              columns={columnsActiveEmployeeTable}
              useSearchBar={true}
              hiddenColumns={['position_hidden']}
              buttons={[
                {
                  id: 'department',
                  column: 'department',
                  label: 'Department',
                },
                {
                  id: 'position_hidden',
                  column: 'position',
                  label: 'Position',
                },
                {
                  id: 'emp_status',
                  column: 'emp_status',
                  label: 'Emp. Status',
                },
              ]}
            />
          </div>
          <div>
            <TableCore
              supportTableType="normal"
              data={employmentContractSpvData}
              columns={columnsActiveEmployeeTable}
              useSearchBar={true}
              hiddenColumns={['position_hidden']}
              buttons={[
                {
                  id: 'department',
                  column: 'department',
                  label: 'Department',
                },
                {
                  id: 'position_hidden',
                  column: 'position',
                  label: 'Position',
                },
                {
                  id: 'emp_status',
                  column: 'emp_status',
                  label: 'Emp. Status',
                },
              ]}
            />
          </div>
        </HorizontalTabs>
      </div>
      </Dashboard>

      {/* Add Contract */}
      <form onSubmit={handleSubmitAddContract(addContract)}>
        <Drawer
          isOpen={addContractDrawer}
          setIsOpen={setAddContractDrawer}
          title="Add New Contract"
          description="Employment Contract"
          icon={<UserSquareIcon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <Button
              key={0}
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeAddContractDrawer}
            >
              Cancel
            </Button>,
            <Button key={1} type="submit" btnType="normal" variant="primary" size="md">
              Add Contract
            </Button>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="supervisor" className="input-label">
                Employee Name
              </label>
              <Controller
                control={controlAddContract}
                name="employee_id"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <ListboxSelect
                    icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                    className="w-full"
                    lists={allEmployee?.map((employee) => ({
                      name: employee.full_name,
                      avatarUrl: employee.pass_photo_path[0] || employee.employee_contracts[0]?.emp_detail.pass_photo,
                    }))}
                    isPlaceholder={true}
                    handleChange={(employee) => {
                      onChange(employee)
                    }}
                    id="employee_id"
                    value={getValuesAddContract('employee_id')}
                    error={invalid}
                  >
                    Select Employee
                  </ListboxSelect>
                )}
              />
              {errorsAddContract.supervisor_id && (
                <span className="input-hint-text error">{errorsAddContract.supervisor_id?.message}</span>
              )}
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
                    lists={DEPARTMENT_OPTIONS?.map((departmentItem) => ({
                      name: departmentItem.department,
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
                    lists={['Full Time', 'Part Time', 'Intern', 'Freelance']?.map((empStatus) => ({
                      name: empStatus,
                    }))}
                    empPosition
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
                    lists={supervisors?.map((supervisor) => ({
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
              label="Contract Document"
              fieldKey="add_contract"
              control={controlAddContract}
              errors={errorsAddContract}
              setValue={setValuesAddContract}
              isLinkMode={switchTogglableButton.contractDocuments}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  contractDocuments: !prev.contractDocuments,
                }))
                setTempProgressUpload({})
                setContractDocument([])
              }}
              bucketName={BucketsEnum.employee_contract}
              uploadProgress={tempProgressUpload}
              uploadedFiles={contractDocument}
              setUploadedFiles={setContractDocument}
              handleUploadFile={(files) => setContractDocument(files)}
              deleteFilePath={deleteAddContractDocument}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
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
            <Button
              key={0}
              type="button"
              btnType="normal"
              variant="secondary-gray"
              size="md"
              onClick={closeResignLayoffDrawer}
            >
              Cancel
            </Button>,
            <Button
              key={1}
              type="submit"
              btnType="normal"
              variant="primary"
              className=""
              size="md"
              isLoading={isSubmittingResignLayoff}
            >
              Finish Resign / Layoff
            </Button>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="employee" className="input-label">
                Employee Name
              </label>
              <Controller
                control={controlAddContract}
                name="employee_id"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <ListboxSelect
                    icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                    className="w-full"
                    lists={allEmployee?.map((employee) => ({
                      name: employee.full_name,
                      avatarUrl: employee.pass_photo_path[0] || employee.employee_contracts[0]?.emp_detail.pass_photo,
                    }))}
                    isPlaceholder={true}
                    handleChange={(employee) => {
                      onChange(employee)
                      generateRestResignInformation(employee)
                    }}
                    id="employee_id"
                    value={getValuesAddContract('employee_id')}
                    error={invalid}
                  >
                    Select Employee
                  </ListboxSelect>
                )}
              />
              {errorsAddContract.supervisor_id && (
                <span className="input-hint-text error">{errorsAddContract.supervisor_id?.message}</span>
              )}
            </div>

            {employeeContractDetail?.department && (
              <div>
                <label htmlFor="department" className="input-label">
                  Current Department
                </label>
                <div className="rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-500 shadow-xs">
                  {employeeContractDetail?.department} Department
                </div>
              </div>
            )}
            {employeeContractDetail?.position && (
              <div>
                <label htmlFor="position" className="input-label">
                  Current Department
                </label>
                <div className="rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-500 shadow-xs">
                  {employeeContractDetail?.position}
                </div>
              </div>
            )}
            {employeeContractDetail?.emp_status && (
              <div>
                <label htmlFor="emp_status" className="input-label">
                  Current Department
                </label>
                <div className="rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-gray-500 shadow-xs">
                  {employeeContractDetail?.emp_status}
                </div>
              </div>
            )}
            {employeeContractDetail?.spv_name && (
              <div>
                <label className="input-label">Current Supervisor</label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2.5 shadow-xs">
                  <AvatarPlacement
                    size="xs"
                    image={employeeContractDetail?.spv_avatar}
                    text={employeeContractDetail?.spv_name}
                  />
                  <p className="capitalize text-gray-500">{employeeContractDetail?.spv_name}</p>
                </div>
              </div>
            )}

            <div className="h-px w-full bg-gray-200"></div>
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
                Termination Number
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
              label="Contract Document"
              fieldKey="resign_layoff"
              control={controlResignLayoff}
              errors={errorsResignLayoff}
              setValue={setValueResignLayoff}
              isLinkMode={switchTogglableButton.contractDocuments}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  contractDocuments: !prev.contractDocuments,
                }))
                setTempProgressUpload({})
                setContractDocument([])
              }}
              bucketName={BucketsEnum.employee_contract}
              uploadProgress={tempProgressUpload}
              uploadedFiles={contractDocument}
              setUploadedFiles={setContractDocument}
              handleUploadFile={(files) => setContractDocument(files)}
              deleteFilePath={deleteResignLayoffDocument}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={null}
              handleDeleteExistingFile={() => {}}
              isEditMode={false}
              isRequired={true}
            />
          </div>
        </Drawer>
      </form>
    </>
  )
}

export default EmployeeContract

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const authTokenJWT = safeDecodeJwt(auth_token)

  if (!authTokenJWT) {
    return { redirect: { destination: '/refresh', permanent: false } }
  }
  return {
    props: {
      spv_id: authTokenJWT.payload['id'],
      activeSidebar: 'Employee Contract',
    },
  }
}
