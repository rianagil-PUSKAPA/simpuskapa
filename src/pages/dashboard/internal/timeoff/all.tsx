import { resolveAuthToken } from '@/utils/ssrAuth'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { AnnualLeave } from '@/layout/timeoff-list/AnnualLeave'
import { CollectiveLeave } from '@/layout/timeoff-list/CollectiveLeave'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { RoleDefinition } from '@/shared/role.access'
import { ComboboxType, DynamicProgressType } from '@/types/global'
import { theme } from '@/types/themes'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { employeeTimeOffApi, fileApi, getAllPics, getEmployeeTimeoff } from '@/utils/apiRequestHelper'
import { APP_ENV, firstDayIndexWeek, lastDayIndexWeek, leaveTypeList, MAIN_URL_FE } from '@/utils/constant'
import { snakeCase, titleCase } from '@/utils/globalHelper'
import { Menu, Transition } from '@headlessui/react'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { EmployeeApi, TimeOffRequestDto, TimeOffRequestDtoStatusEnum } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
dayjs.extend(utc)

const AlertTriangleIcon: any = dynamic(() =>
  import('@/components/icon/AlertTriangleIcon').then((mod) => mod.AlertTriangleIcon),
)
const CalendarCheck02Icon: any = dynamic(() =>
  import('@/components/icon/CalendarCheck02Icon').then((mod) => mod.CalendarCheck02Icon),
)
const ChevronDownIcon: any = dynamic(() =>
  import('@/components/icon/ChevronDownIcon').then((mod) => mod.ChevronDownIcon),
)
const UserPlus01Icon: any = dynamic(() => import('@/components/icon/UserPlus01Icon').then((mod) => mod.UserPlus01Icon))
const UsersPlusIcon: any = dynamic(() => import('@/components/icon/UsersPlusIcon').then((mod) => mod.UsersPlusIcon))
const Modal: any = dynamic(() => import('@/components/Modal').then((mod) => mod.Modal))
const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const ComboboxAutocomplete: any = dynamic(() =>
  import('@/components/ComboboxAutocomplete').then((mod) => mod.ComboboxAutocomplete),
)
const DatePickerCalendar: any = dynamic(() =>
  import('@/components/DatePickerCalendar').then((mod) => mod.DatePickerCalendar),
)
const Drawer: any = dynamic(() => import('@/components/Drawer').then((mod) => mod.Drawer))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const AlarmClockOffIcon: any = dynamic(() =>
  import('@/components/icon/AlarmClockOffIcon').then((mod) => mod.AlarmClockOffIcon),
)
const User01Icon: any = dynamic(() => import('@/components/icon/User01Icon').then((mod) => mod.User01Icon))
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const ListboxSelect: any = dynamic(() => import('@/components/ListboxSelect').then((mod) => mod.ListboxSelect))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const TimeoffCalendarView: any = dynamic(() =>
  import('@/layout/timeoff-list/TimeoffCalendarView').then((mod) => mod.TimeoffCalendarView),
)
const TimeoffListView: any = dynamic(() =>
  import('@/layout/timeoff-list/TimeoffListView').then((mod) => mod.TimeoffListView),
)

type ModalStatement = {
  newTimeoff: boolean
  bulkTimeoff: boolean
  resetTimeoff: boolean
}

const TimeoffAll = () => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'calendar-view': { index: 0, slug: 'calendar-view' },
    'list-view': { index: 1, slug: 'list-view' },
    '': { index: 2, slug: '' },
    'annual-leave': { index: 3, slug: 'annual-leave' },
    'collective-leave': { index: 4, slug: 'collective-leave' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'calendar-view') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const entry = Object.entries(TAB_CONFIG).find(([_, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'calendar-view'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    newTimeoff: false,
    bulkTimeoff: false,
    resetTimeoff: false,
  })
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    newTimeoff: boolean
    bulkTimeoff: boolean
    resetTimeoff: boolean
  }>({
    newTimeoff: false,
    bulkTimeoff: false,
    resetTimeoff: false,
  })
  const [titleListBox, setTitleListBox] = useState<{ typeOfLeave: string }>({
    typeOfLeave: 'Type of Leave',
  })
  const [pics, setPics] = useState<ComboboxType[]>([])
  const [requestTimeoffStartDate, setRequestTimeoffStartDate] = useState<Date | null>(null)
  const [requestTimeoffEndDate, setRequestTimeoffEndDate] = useState<Date | null>(null)
  const [requestBulkTimeoffStartDate, setRequestBulkTimeoffStartDate] = useState<Date | null>(null)
  const [requestBulkTimeoffEndDate, setRequestBulkTimeoffEndDate] = useState<Date | null>(null)
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [timeoffRequestFileUpload, setTimeoffRequestFileUpload] = useState([])
  const [resetDate, setResetDate] = useState<Date | null>(new Date())
  const [filtrationDate, setFiltrationDate] = useState<Date[]>([
    new Date(new Date().setDate(firstDayIndexWeek + 1)),
    new Date(new Date().setDate(lastDayIndexWeek - 1)),
  ])
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    single_timeoff_document: boolean
    bulk_timeoff_document: boolean
  }>({
    single_timeoff_document: false,
    bulk_timeoff_document: false,
  })

  const [wallFilterStart, wallFilterEnd] = [
    dayjs(filtrationDate[0]).format('YYYY-MM-DD'),
    dayjs(filtrationDate[1]).format('YYYY-MM-DD'),
  ]

  const {
    data: employeeTimeoffData,
    trigger: employeeTimeoffTrigger,
    isMutating: employeeTimeoffIsMutating,
  } = useSWRMutation(
    `wall/${wallFilterStart}/${wallFilterEnd}/undefined/undefined/${
      userLoggedinInformation?.role?.includes(RoleDefinition.SUPERVISOR)
        ? userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN)
          ? 'undefined'
          : userLoggedinInformation?.employee_id
        : ''
    }`,
    getEmployeeTimeoff,
  )

  const handleDateRangePicker = (dateRanger: Date[]) => {
    setFiltrationDate(dateRanger)
  }

  const {
    handleSubmit: handleSubmitRequestNewTimeoff,
    control: controlRequestNewTimeoff,
    setValue: setValueRequestNewTimeoff,
    register: registerRequestNewTimeoff,
    reset: resetRequestTimeoff,
    formState: { errors: errorsRequestNewTimeoff },
  } = useForm<TimeOffRequestDto>()

  const {
    handleSubmit: handleSubmitRequestBulkTimeoff,
    control: controlRequestBulkTimeoff,
    setValue: setValueRequestBulkTimeoff,
    register: registerRequestBulkTimeoff,
    reset: resetRequestBulkTimeoff,
    formState: { errors: errorsRequestBulkTimeoff },
  } = useForm<TimeOffRequestDto>()

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

  const openNewTimeoff = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      newTimeoff: true,
    }))
  }

  const closeNewTimeoff = () => {
    setTempProgressUpload({})
    setRequestTimeoffStartDate(null)
    setRequestTimeoffEndDate(null)
    setTimeoffRequestFileUpload([])
    resetRequestTimeoff({
      id: undefined,
      pic_employee_id: undefined,
      leave_type: '',
      start_date: undefined,
      end_date: undefined,
      duration: 0,
      notes: '',
      doc_path: undefined,
      direct_approve: true,
    })

    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      newTimeoff: false,
    }))
  }

  const openResetTimeoffModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      resetTimeoff: true,
    }))
  }

  const closeResetTimeoffModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      resetTimeoff: false,
    }))
  }

  const resetTimeoffAction = async () => {
    const resetDateValue = dayjs(resetDate).format('YYYY-MM-DD HH:mm:ss')

    setLoadingButtonStatement((prev) => ({ ...prev, resetTimeoff: true }))

    const resetTimeoff = employeeTimeOffApi
      .timeOffControllerResetEmployeeAnnualTimeOffList({
        reset_date: resetDateValue,
      })
      .then((res) => {
        if (res['response'].status === 400) {
          return Promise.reject(res)
        }
        return res
      })
      .catch((err) => {
        if (err['response'].status === 400) {
          return Promise.reject(err['response'].data.message)
        }
        return err
      })

    toast.promise(resetTimeoff, {
      pending: 'Resetting timeoff',
      success: 'Timeoff reset successfully',
      error: {
        render({ data }) {
          return `${data}`
        },
      },
    })

    resetTimeoff.finally(() => {
      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({ ...prev, resetTimeoff: false }))
        closeResetTimeoffModal()
        router.replace(router.asPath)
      }, 2000)
    })
  }

  const requestNewTimeoffSubmit: SubmitHandler<TimeOffRequestDto> = async (formInput) => {
    let fileNameS3 = ''

    if (dayjs(formInput.start_date).utc().unix() > dayjs(formInput.end_date).utc().unix()) {
      toast.error('End date must be greater than start date')
      return false
    }

    setLoadingButtonStatement((prev) => ({ ...prev, newTimeoff: true }))

    if (!switchTogglableButton.single_timeoff_document && formInput.doc_path) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        timeoffRequestFileUpload[0].name,
        BucketsEnum.employee_timeoff,
      )
      const identifier = 'single_timeoff_document'

      fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], timeoffRequestFileUpload[0], {
        headers: {
          'Content-Type': timeoffRequestFileUpload[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName: BucketsEnum.employee_timeoff,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })
    }

    const submitValues = {
      id: formInput.id['id'],
      employee_id: formInput.id['id'],
      leave_type: snakeCase(formInput.leave_type),
      start_date: dayjs(formInput.start_date).utc().format(),
      duration: Number(formInput.duration),
      end_date: dayjs(formInput.end_date).utc().format(),
      notes: formInput.notes,
      doc_path: switchTogglableButton.single_timeoff_document
        ? [`${formInput.doc_path}`]
        : fileNameS3
        ? [`${BucketsEnum.employee_timeoff}/${fileNameS3}`]
        : undefined,
      status: TimeOffRequestDtoStatusEnum.Approved,
      pic_employee_id: formInput.pic_employee_id['id'],
      direct_approve: true,
    }

    // console.log('submitValues - Normal: ', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, newTimeoff: false }))
    // return false

    const requestTimeoff = employeeTimeOffApi.timeOffControllerCreateEmployeeTimeOffRequest(
      submitValues.id as string,
      submitValues,
    )

    toast.promise(requestTimeoff, {
      pending: 'Applying timeoff',
      success: 'Timeoff applied',
      error: 'Promise rejected 🤯',
    })

    requestTimeoff.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, newTimeoff: false }))
      closeNewTimeoff()
      employeeTimeoffTrigger()
      router.replace(router.asPath)
    })
  }

  const requestBulkTimeoffSubmit: SubmitHandler<TimeOffRequestDto> = async (formInput) => {
    let fileNameS3 = ''

    if (dayjs(formInput.start_date).utc().unix() > dayjs(formInput.end_date).utc().unix()) {
      toast.error('End date must be greater than start date')
      return false
    }

    setLoadingButtonStatement((prev) => ({ ...prev, bulkTimeoff: true }))

    if (!switchTogglableButton.bulk_timeoff_document && formInput.doc_path) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        timeoffRequestFileUpload[0].name,
        BucketsEnum.employee_timeoff,
      )
      const identifier = 'bulk_timeoff_document'

      fileNameS3 = String(presignUrl.data.data).split('::')[0]

      await axios.put(String(presignUrl.data.data).split('::')[1], timeoffRequestFileUpload[0], {
        headers: {
          'Content-Type': timeoffRequestFileUpload[0].type,
        },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total)

          setTempProgressUpload((prev) => ({
            ...prev,
            [identifier]: {
              bucketName: BucketsEnum.employee_timeoff,
              progress: percentCompleted,
              identifier,
            },
          }))
        },
      })
    }

    const submitValues = {
      id: userLoggedinInformation?.employee_id,
      employee_id: userLoggedinInformation?.employee_id,
      leave_type: 'joint_holiday',
      start_date: dayjs(formInput.start_date).utc().format(),
      duration: Number(formInput.duration),
      end_date: dayjs(formInput.end_date).utc().format(),
      notes: formInput.notes,
      doc_path: switchTogglableButton.bulk_timeoff_document
        ? [`${formInput.doc_path}`]
        : fileNameS3
        ? [`${BucketsEnum.employee_timeoff}/${fileNameS3}`]
        : undefined,
      status: TimeOffRequestDtoStatusEnum.Approved,
      pic_employee_id: userLoggedinInformation?.employee_id,
      direct_approve: true,
    }

    // console.log('submitValues - Bulk: ', submitValues)
    // setLoadingButtonStatement((prev) => ({ ...prev, bulkTimeoff: false }))
    // return false

    const requestTimeoff = employeeTimeOffApi.timeOffControllerCreateBulkTimeOffEmployeeTimeOffRequest(submitValues)

    toast.promise(requestTimeoff, {
      pending: 'Requesting bulk timeoff',
      success: 'Bulk timeoff requested',
      error: 'Promise rejected 🤯',
    })

    requestTimeoff.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, bulkTimeoff: false }))
      closeBulkTimeoff()
      router.replace(router.asPath)
    })
  }

  const openBulkTimeoff = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      bulkTimeoff: true,
    }))
  }

  const closeBulkTimeoff = () => {
    setTempProgressUpload({})
    setRequestBulkTimeoffStartDate(null)
    setRequestBulkTimeoffEndDate(null)
    setTimeoffRequestFileUpload([])
    resetRequestBulkTimeoff({
      leave_type: '',
      start_date: undefined,
      end_date: undefined,
      duration: 0,
      notes: '',
      doc_path: undefined,
      direct_approve: false,
    })

    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      bulkTimeoff: false,
    }))
  }

  const deleteTimeoffRequestFileUpload = async (filename: string) => {
    setValueRequestNewTimeoff('doc_path', undefined)
    setTimeoffRequestFileUpload((prev) => prev.filter((item) => item.path !== filename))
  }

  useEffect(() => {
    if (!isOpenModal) {
      setTitleListBox((prev: any) => ({ ...prev, typeOfLeave: '' }))
      setValueRequestNewTimeoff('leave_type', null)
      setValueRequestBulkTimeoff('leave_type', null)
    } else {
      setTitleListBox((prev: any) => ({
        ...prev,
        typeOfLeave: 'Type of Leave',
      }))
    }
  }, [isOpenModal, setValueRequestNewTimeoff, setValueRequestBulkTimeoff])

  useEffect(() => {
    if (userLoggedinInformation?.employee_name) {
      const getPIC = async () => {
        const pic = await getAllPics(userLoggedinInformation.employee_name)
        setPics(pic)
      }
      getPIC()
    }
  }, [userLoggedinInformation?.employee_name])

  useEffect(() => {
    employeeTimeoffTrigger()
  }, [filtrationDate])

  return (
    <>
      <NextSeo title="Time Off" canonical={`${MAIN_URL_FE}dashboard/internal/timeoff/all`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          { title: 'Time Off', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--timeoff">
          <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-gray-900">Time Off</h1>
              <p className="text-base font-normal text-gray-400">
                See who on their time off in Calendar Format or List Format
              </p>
            </div>
            {userLoggedinInformation?.role.includes(RoleDefinition.SUPERADMIN) ? (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
                  Menu
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
                  <Menu.Items className="absolute right-0 z-20 mt-2 w-80 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="flex flex-col gap-0.5 px-1.5 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            className={cn(
                              active ? 'bg-gray-50' : 'text-gray-700',
                              `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                            )}
                            onClick={openNewTimeoff}
                          >
                            <UserPlus01Icon className="h-4 w-4 stroke-gray-700" />
                            Add New Time Off
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            className={cn(
                              active ? 'bg-gray-50' : 'text-gray-700',
                              `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                            )}
                            onClick={openBulkTimeoff}
                          >
                            <UsersPlusIcon className="h-4 w-4 stroke-gray-700" />
                            Add Bulk Time Off (Cuti Bersama)
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
                              `group flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-start text-sm font-medium duration-300`,
                            )}
                            onClick={openResetTimeoffModal}
                          >
                            <CalendarCheck02Icon className="h-4 w-4 stroke-gray-700" />
                            Start New Year Cycle
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : null}
          </div>
          <HorizontalTabs
            tabLists={['Calendar View', 'List View', '|', 'Annual Leaves', 'Cuti Bersama']}
            disabled={['|']}
            type="underline"
            size="sm"
            handleIndex={handleIndexTabs}
            index={index}
            gapLayout={true}
          >
            <div>
              <TimeoffCalendarView
                employeeTimeoffData={employeeTimeoffData}
                employeeTimeoffIsMutating={employeeTimeoffIsMutating}
                handleDateRangePicker={handleDateRangePicker}
                filtrationDate={filtrationDate}
                setFiltrationDate={setFiltrationDate}
                wallFilterStart={wallFilterStart}
              />
            </div>
            <div>
              <TimeoffListView
                employeeTimeoffData={employeeTimeoffData}
                handleDateRangePicker={handleDateRangePicker}
                filtrationDate={filtrationDate}
                setFiltrationDate={setFiltrationDate}
              />
            </div>
            <div>|</div>
            <div>
              <AnnualLeave />
            </div>
            <div>
              <CollectiveLeave />
            </div>
          </HorizontalTabs>
        </div>
      </Dashboard>

      {/* Request New Timeoff : Create Form */}
      <form onSubmit={handleSubmitRequestNewTimeoff(requestNewTimeoffSubmit)}>
        <Drawer
          isOpen={isOpenModal.newTimeoff}
          setIsOpen={closeNewTimeoff}
          title="New Time Off"
          description="Employee Time Off"
          icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
          drawerWidth="w-[28rem]"
          footerButton={[
            <>
              <Button type="button" btnType="normal" variant="secondary-gray" size="md" onClick={closeNewTimeoff}>
                Cancel
              </Button>
            </>,
            <>
              <Button
                type="submit"
                btnType="normal"
                variant="primary"
                size="md"
                isLoading={loadingButtonStatement.newTimeoff}
              >
                Submit
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="target_employee" className="input-label">
                Who the employee?
              </label>
              <Controller
                control={controlRequestNewTimeoff}
                name="id"
                rules={{ required: 'Who the employee is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <ComboboxAutocomplete
                    id="target_employee"
                    placeholder="PUSKAPA Employee"
                    icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                    value={value}
                    handleChange={(target_employee) => {
                      onChange(target_employee)
                    }}
                    listData={pics}
                    error={invalid}
                  />
                )}
              />
              {errorsRequestNewTimeoff?.id && (
                <span className="input-hint-text error">{errorsRequestNewTimeoff?.id?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="leave_type" className="input-label">
                Type of Leave
              </label>
              <Controller
                control={controlRequestNewTimeoff}
                name="leave_type"
                rules={{ required: 'Leave of type is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <>
                    <ListboxSelect
                      className="w-full"
                      lists={leaveTypeList.map((leaveType) => ({
                        name: titleCase(leaveType),
                      }))}
                      isPlaceholder={true}
                      handleChange={(leave_type) => {
                        onChange(leave_type)
                      }}
                      id="leave_type"
                      value={value || ''}
                      error={invalid}
                    >
                      {titleListBox?.typeOfLeave}
                    </ListboxSelect>
                    {errorsRequestNewTimeoff.leave_type && (
                      <span className="input-hint-text error">{errorsRequestNewTimeoff.leave_type?.message}</span>
                    )}
                  </>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="input-label">
                  Start Date
                </label>
                <Controller
                  control={controlRequestNewTimeoff}
                  name="start_date"
                  rules={{ required: 'Start date is required field' }}
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <DatePickerCalendar
                        size="sm"
                        id="start_date"
                        selected={requestTimeoffStartDate}
                        onChange={(date: Date) => {
                          setRequestTimeoffStartDate(date)
                          onChange(date)
                        }}
                        error={invalid}
                        dateFormat="MMM d, yyyy"
                        isCurrentYear={APP_ENV === 'production' ? true : false}
                      />
                      {errorsRequestNewTimeoff.start_date && (
                        <span className="input-hint-text error">{errorsRequestNewTimeoff.start_date?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label htmlFor="end_date" className="input-label">
                  End Date
                </label>
                <Controller
                  control={controlRequestNewTimeoff}
                  name="end_date"
                  rules={{ required: 'This is required field' }}
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <DatePickerCalendar
                        size="sm"
                        id="end_date"
                        selected={requestTimeoffEndDate}
                        onChange={(date: Date) => {
                          onChange(date)
                          setRequestTimeoffEndDate(date)
                        }}
                        error={invalid}
                        dateFormat="MMM d, yyyy"
                        isCurrentYear={APP_ENV === 'production' ? true : false}
                      />
                      {errorsRequestNewTimeoff.end_date && (
                        <span className="input-hint-text error">{errorsRequestNewTimeoff.end_date?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="duration-normal-timeoff" className="input-label">
                Total Days
              </label>
              <Controller
                control={controlRequestNewTimeoff}
                name="duration"
                rules={{ required: 'This is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <Input
                    type="number"
                    id="duration-normal-timeoff"
                    placeholder="Total Days (exclude Weekend & Holiday)"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                  />
                )}
              />
              {errorsRequestNewTimeoff.duration && (
                <span className="input-hint-text error">{errorsRequestNewTimeoff.duration?.message}</span>
              )}
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label htmlFor="supervisor" className="input-label">
                Person in Charge while Time Off
              </label>
              <Controller
                control={controlRequestNewTimeoff}
                name="pic_employee_id"
                rules={{ required: 'This is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <ComboboxAutocomplete
                    id="pic_employee_id"
                    placeholder="Select PIC while your time-off"
                    icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                    value={value}
                    handleChange={(supervisor) => {
                      onChange(supervisor)
                    }}
                    listData={pics}
                    error={invalid}
                  />
                )}
              />
              {errorsRequestNewTimeoff?.pic_employee_id && (
                <span className="input-hint-text error">{errorsRequestNewTimeoff?.pic_employee_id?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="notes" className="input-label">
                Notes (Optional)
              </label>
              <textarea
                {...registerRequestNewTimeoff('notes')}
                id="notes"
                className="textarea-input resize-none"
                rows={5}
                placeholder="Write notes about your time off"
              ></textarea>
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <SwitchableUploadField
              name="doc_path"
              label="Files (Optional)"
              fieldKey="single_timeoff_document"
              control={controlRequestNewTimeoff}
              errors={errorsRequestNewTimeoff}
              setValue={setValueRequestNewTimeoff}
              isLinkMode={switchTogglableButton.single_timeoff_document}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  single_timeoff_document: !prev.single_timeoff_document,
                }))
                setTimeoffRequestFileUpload([])
              }}
              bucketName={BucketsEnum.employee_timeoff}
              uploadProgress={tempProgressUpload}
              uploadedFiles={timeoffRequestFileUpload}
              setUploadedFiles={setTimeoffRequestFileUpload}
              handleUploadFile={(files: File[]) => {
                setTimeoffRequestFileUpload(files as any)
              }}
              deleteFilePath={deleteTimeoffRequestFileUpload}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={null}
              handleDeleteExistingFile={() => {}}
              isEditMode={false}
              isRequired={false}
            />
          </div>
        </Drawer>
      </form>

      {/* Request Bulk Timeoff : Create Form */}
      <form onSubmit={handleSubmitRequestBulkTimeoff(requestBulkTimeoffSubmit)}>
        <Drawer
          isOpen={isOpenModal.bulkTimeoff}
          setIsOpen={closeBulkTimeoff}
          title="New Bulk Time Off"
          description="Cuti Bersama"
          icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
          drawerWidth="w-[28rem]"
          footerButton={[
            <>
              <Button type="button" btnType="normal" variant="secondary-gray" size="md" onClick={closeBulkTimeoff}>
                Cancel
              </Button>
            </>,
            <>
              <Button
                type="submit"
                btnType="normal"
                variant="primary"
                size="md"
                isLoading={loadingButtonStatement.bulkTimeoff}
              >
                Submit
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="input-label">
                  Start Date
                </label>
                <Controller
                  control={controlRequestBulkTimeoff}
                  name="start_date"
                  rules={{ required: 'Start date is required field' }}
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <DatePickerCalendar
                        size="sm"
                        id="start_date"
                        selected={requestBulkTimeoffStartDate}
                        onChange={(date: Date) => {
                          setRequestBulkTimeoffStartDate(date)
                          onChange(date)
                        }}
                        error={invalid}
                        dateFormat="MMM d, yyyy"
                        isCurrentYear={APP_ENV === 'production' ? true : false}
                      />
                      {errorsRequestBulkTimeoff.start_date && (
                        <span className="input-hint-text error">{errorsRequestBulkTimeoff.start_date?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label htmlFor="end_date" className="input-label">
                  End Date
                </label>
                <Controller
                  control={controlRequestBulkTimeoff}
                  name="end_date"
                  rules={{ required: 'This is required field' }}
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <DatePickerCalendar
                        size="sm"
                        id="end_date"
                        selected={requestBulkTimeoffEndDate}
                        onChange={(date: Date) => {
                          onChange(date)
                          setRequestBulkTimeoffEndDate(date)
                        }}
                        error={invalid}
                        dateFormat="MMM d, yyyy"
                        isCurrentYear={APP_ENV === 'production' ? true : false}
                      />
                      {errorsRequestBulkTimeoff.end_date && (
                        <span className="input-hint-text error">{errorsRequestBulkTimeoff.end_date?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="duration-bulk-timeoff" className="input-label">
                Total Days
              </label>
              <Controller
                control={controlRequestBulkTimeoff}
                name="duration"
                rules={{ required: 'This is required field' }}
                render={({ field: { value, onChange }, fieldState: { invalid } }) => (
                  <Input
                    type="number"
                    id="duration-bulk-timeoff"
                    placeholder="Total Days (exclude Weekend & Holiday)"
                    onChange={onChange}
                    value={value || ''}
                    error={invalid}
                  />
                )}
              />
              {errorsRequestBulkTimeoff.duration && (
                <span className="input-hint-text error">{errorsRequestBulkTimeoff.duration?.message}</span>
              )}
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label className="input-label gap-wide block w-full">Person in Charge</label>
              <AvatarLabelGroup
                size={'sm'}
                image={userLoggedinInformation?.avatar}
                text={userLoggedinInformation?.employee_name}
                supportingText={userLoggedinInformation?.email}
                statusIcon={false}
              />
            </div>
            <div>
              <label htmlFor="notes" className="input-label">
                Notes (Optional)
              </label>
              <textarea
                {...registerRequestBulkTimeoff('notes')}
                id="notes"
                className="textarea-input resize-none"
                rows={5}
                placeholder="Write notes about your time off"
              ></textarea>
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <SwitchableUploadField
              name="doc_path"
              label="Files (Optional)"
              fieldKey="bulk_timeoff_document"
              control={controlRequestBulkTimeoff}
              errors={errorsRequestBulkTimeoff}
              setValue={setValueRequestBulkTimeoff}
              isLinkMode={switchTogglableButton.bulk_timeoff_document}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  bulk_timeoff_document: !prev.bulk_timeoff_document,
                }))
                setTimeoffRequestFileUpload([])
              }}
              bucketName={BucketsEnum.employee_timeoff}
              uploadProgress={tempProgressUpload}
              uploadedFiles={timeoffRequestFileUpload}
              setUploadedFiles={setTimeoffRequestFileUpload}
              handleUploadFile={(files: File[]) => {
                setTimeoffRequestFileUpload(files as any)
              }}
              deleteFilePath={deleteTimeoffRequestFileUpload}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={null}
              handleDeleteExistingFile={() => {}}
              isEditMode={false}
              isRequired={false}
            />
          </div>
        </Drawer>
      </form>

      {/* Reset Timeoff Modal */}
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle=""
        modalDescription=""
        stateModal={isOpenModal.resetTimeoff}
        modalSizeStyles="max-w-sm"
        handleCloseModal={() =>
          setIsOpenModal((prev: ModalStatement) => ({
            ...prev,
            resetTimeoff: false,
          }))
        }
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className="w-full justify-center"
              size="md"
              onClick={closeResetTimeoffModal}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button
              type="button"
              btnType="normal"
              variant="primary"
              className="w-full justify-center"
              size="md"
              onClick={resetTimeoffAction}
              isLoading={loadingButtonStatement.resetTimeoff}
            >
              Start Here
            </Button>
          </>,
        ]}
        isSeamless={true}
      >
        <div className="flex justify-center">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <label htmlFor="department" className="input-label !mb-px">
                  Start New Year Cycle at:
                </label>
                <div className="text-gray-500">{dayjs(resetDate).format('MMM DD, YYYY')}</div>
              </div>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                size="sm"
                onClick={() => setResetDate(new Date())}
              >
                Today
              </Button>
            </div>
            <DatePickerCalendar
              id="reset_date"
              selected={resetDate}
              onChange={(date: Date) => {
                setResetDate(date)
              }}
              isUsingCustomHeader={true}
              inline={true}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default TimeoffAll

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const employeeApi = new EmployeeApi(createAPIConfig(auth_token as string))
  try {
    const draftEmployee = await employeeApi.employeeControllerGetAllEmployee(true)

    return {
      props: {
        draftEmployeeList: draftEmployee.data.data,
        activeSidebar: 'Time Off',
      },
    }
  } catch (error) {
    if (error.message === 'Request failed with status code 500') {
      return {
        notFound: true,
      }
    }

    if (error.message === 'Request failed with status code 401') {
      return {
        redirect: {
          destination: '/refresh',
          permanent: false,
        },
      }
    }
  }
}
