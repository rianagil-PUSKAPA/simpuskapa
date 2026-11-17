/* eslint-disable tailwindcss/no-custom-classname */
import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ComboboxAutocomplete } from '@/components/ComboboxAutocomplete'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { Input } from '@/components/Input'
import { ListboxSelect } from '@/components/ListboxSelect'
import { LoadingTable } from '@/components/LoadingTable'
import { Modal } from '@/components/Modal'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { TableCore } from '@/components/TableCore'
import { AlarmClockOffIcon } from '@/components/icon/AlarmClockOffIcon'
import { AlertCircleIcon } from '@/components/icon/AlertCircleIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { User01Icon } from '@/components/icon/User01Icon'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { RoleDefinition } from '@/shared/role.access'
import { ComboboxType, DynamicProgressType } from '@/types/global'
import { theme } from '@/types/themes'
import { employeeTimeOffApi, fileApi, getAllPics } from '@/utils/apiRequestHelper'
import { leaveTypeList } from '@/utils/constant'
import { checkIsItemExist, snakeCase, titleCase } from '@/utils/globalHelper'
import { createColumnHelper } from '@tanstack/react-table'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Employee, TimeOffRow, TimeOffRowStatusEnum } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
dayjs.extend(utc)

type TimeOffProps = {
  employeeDetail: Employee
}

type ModalStatement = {
  confirmationCancelRequest: boolean
  confirmationRemoveTimeoff: boolean
}

const columnHelperTimeoff = createColumnHelper<TimeOffRow>()

const getEmployeeTimeoffByEmployeeId = async (parameter: string) => {
  const id = parameter.split('/')[1]

  const employeeTimeoffRes = await employeeTimeOffApi.timeOffControllerGetEmployeeTimeOffList(id as string)

  return employeeTimeoffRes.data
}

// const FIRST_DATE_OF_YEAR = dayjs(
//   `01/01/${new Date().getFullYear() - 5}`,
// ).format('YYYY-MM-DD')
// const LAST_DATE_OF_YEAR = dayjs(`12/31/${new Date().getFullYear() + 5}`).format(
//   'YYYY-MM-DD',
// )

export const TimeOff = ({ employeeDetail }: TimeOffProps) => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  const [timeoffDrawer, setTimeoffDrawer] = useState<boolean>(false)
  const [pics, setPics] = useState<ComboboxType[]>([])
  const [requestTimeOff, setRequestTimeOff] = useState<boolean>(false)
  const [timeoffDataDetail, setTimeoffDataDetail] = useState<TimeOffRow | null>(null)
  const [requestTimeoffStartDate, setRequestTimeoffStartDate] = useState<Date | null>(null)
  const [requestTimeoffEndDate, setRequestTimeoffEndDate] = useState<Date | null>(null)
  const [titleListBox, setTitleListBox] = useState<{ typeOfLeave: string }>({
    typeOfLeave: 'Type of Leave',
  })
  const [timeoffRequestFileUpload, setTimeoffRequestFileUpload] = useState([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    confirmationCancelRequest: false,
    confirmationRemoveTimeoff: false,
  })
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    timeoff: boolean
    forceTimeoff: boolean
  }>({
    timeoff: false,
    forceTimeoff: false,
  })
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    timeoff_document: boolean
  }>({
    timeoff_document: false,
  })

  const {
    handleSubmit: handleSubmitRequestTimeoff,
    control: controlRequestTimeoff,
    setValue: setValueRequestTimeoff,
    getValues: getValuesRequestTimeoff,
    register: registerRequestTimeoff,
    reset: resetRequestTimeoff,
    formState: { errors: errorsRequestTimeoff },
  } = useForm<TimeOffRow>()

  const {
    data: timeoffData,
    error: timeoffError,
    trigger: timeOffTrigger,
  } = useSWRMutation(router.query.id ? `timeoff/${router.query.id}` : null, getEmployeeTimeoffByEmployeeId)

  const [timeOffRef] = useKeenSlider<HTMLDivElement>({
    slides: {
      perView: 4.2,
      spacing: 15,
    },
  })

  // console.log('timeoffData', timeoffData)

  const handleOpenTimeoffDetail = useCallback((parameter: TimeOffRow) => {
    setTimeoffDataDetail(parameter)
    openTimeOffDrawer()
  }, [])

  /* Drawer: Time Off */
  const openTimeOffDrawer = () => {
    setTimeoffDrawer(true)
  }
  const closeTimeOffDrawer = () => {
    setTimeoffDrawer(false)
  }
  /* Drawer: Request Time Off */
  const closeRequestTimeOffDrawer = useCallback(() => {
    setRequestTimeOff(false)
    setTempProgressUpload({})
    setRequestTimeoffStartDate(null)
    setRequestTimeoffEndDate(null)
    setTimeoffRequestFileUpload([])
    setValueRequestTimeoff('leave_type', null)

    resetRequestTimeoff({
      leave_type: '',
      start_date: undefined,
      end_date: undefined,
      duration: 0,
      employee_id: '',
      notes: '',
      doc_path: undefined,
      direct_approve: false,
    })
  }, [resetRequestTimeoff, setValueRequestTimeoff])
  const openRequestTimeOffDrawer = () => {
    setRequestTimeOff(true)
  }

  const closeConfirmationCancelRequestModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      confirmationCancelRequest: false,
    }))
  }

  const openConfirmationCancelRequestModal = () => {
    closeTimeOffDrawer()
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      confirmationCancelRequest: true,
    }))
  }

  const closeConfirmationRemoveTimeoffModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      confirmationRemoveTimeoff: false,
    }))
  }

  const openConfirmationRemoveTimeoffModal = () => {
    closeTimeOffDrawer()
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      confirmationRemoveTimeoff: true,
    }))
  }

  const executeCancelRequest = async () => {
    setLoadingButtonStatement((prev) => ({ ...prev, timeoff: true }))

    const cancelRequestTimeoff = employeeTimeOffApi.timeOffControllerCancelTimeOffRequest(
      router.query.id as string,
      timeoffDataDetail.id,
    )

    toast.promise(cancelRequestTimeoff, {
      pending: 'Cancelling Time Off Request',
      success: 'You have cancelled your time off request',
      error: 'Promise rejected 🤯',
    })

    cancelRequestTimeoff.then(() => {
      closeConfirmationCancelRequestModal()
      timeOffTrigger()
    })

    cancelRequestTimeoff.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, timeoff: false }))
    })

    setTimeout(() => {
      timeOffTrigger()
    }, 1000)
  }

  const forceRemoveTimeoff = async () => {
    setLoadingButtonStatement((prev) => ({ ...prev, forceTimeoff: true }))

    const removeRequestTimeoff = employeeTimeOffApi.timeOffControllerDeleteeEmployeeTimeOffRequest(
      router.query.id as string,
      timeoffDataDetail.id,
    )

    toast.promise(removeRequestTimeoff, {
      pending: 'Removing Time Off',
      success: 'Time off removed successfully',
      error: 'Promise rejected 🤯',
    })

    removeRequestTimeoff.then(() => {
      closeConfirmationRemoveTimeoffModal()
      timeOffTrigger()
    })

    removeRequestTimeoff.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, forceTimeoff: false }))
    })

    setTimeout(() => {
      timeOffTrigger()
    }, 1000)
  }

  const requestTimeoffSubmit: SubmitHandler<TimeOffRow> = async (formInput) => {
    let fileNameS3 = ''

    if (dayjs(formInput.start_date).utc().unix() > dayjs(formInput.end_date).utc().unix()) {
      toast.error('End date must be greater than start date')
      return false
    }

    setLoadingButtonStatement((prev) => ({ ...prev, timeoff: true }))

    if (!switchTogglableButton.timeoff_document && formInput.doc_path) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        timeoffRequestFileUpload[0].name,
        BucketsEnum.employee_timeoff,
      )
      const identifier = `${BucketsEnum.employee_timeoff}-doc_path`

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

    const timeoffValues = {
      id: employeeDetail.id,
      employee_id: employeeDetail.id,
      leave_type: snakeCase(formInput.leave_type),
      start_date: dayjs(formInput.start_date).utc().format(),
      duration: Number(formInput.duration),
      end_date: dayjs(formInput.end_date).utc().format(),
      notes: formInput.notes,
      doc_path: switchTogglableButton.timeoff_document
        ? [`${formInput.doc_path}`]
        : fileNameS3
        ? [`${BucketsEnum.employee_timeoff}/${fileNameS3}`]
        : undefined,
      status: TimeOffRowStatusEnum.Requested,
      pic_employee_id: formInput.pic_employee.full_name['id'],
      direct_approve: false,
    }

    const requestTimeoff = employeeTimeOffApi.timeOffControllerCreateEmployeeTimeOffRequest(
      router.query.id as string,
      timeoffValues,
    )

    toast.promise(requestTimeoff, {
      pending: 'Requesting timeoff',
      success: 'Timeoff requested',
      error: 'Promise rejected 🤯',
    })

    requestTimeoff.then(() => {
      closeRequestTimeOffDrawer()
      timeOffTrigger()
    })

    requestTimeoff.finally(() => {
      setLoadingButtonStatement((prev) => ({ ...prev, timeoff: false }))
    })

    setTimeout(() => {
      timeOffTrigger()
    }, 1000)
  }

  const deleteTimeoffRequestFileUpload = async (filename: string) => {
    setValueRequestTimeoff('doc_path', undefined)
    setTimeoffRequestFileUpload((prev) => prev.filter((item) => item.path !== filename))
  }

  const columnsTimeOffTable = useMemo(
    () => [
      columnHelperTimeoff.accessor((row) => row.leave_type, {
        id: 'leave_type',
        header: 'Type of Leave',
        size: 180,
        cell: (info) => <span className="font-medium capitalize text-gray-900">{titleCase(info.renderValue())}</span>,
      }),
      columnHelperTimeoff.accessor((row) => row.start_date, {
        id: 'start_date',
        header: 'Start Date',
        size: 180,
        cell: (info) => dayjs(info.renderValue()).format('dddd, DD MMMM YYYY'),
      }),
      columnHelperTimeoff.accessor((row) => row.end_date, {
        id: 'end_date',
        header: 'End Date',
        size: 180,
        cell: (info) => dayjs(info.renderValue()).format('dddd, DD MMMM YYYY'),
      }),
      columnHelperTimeoff.accessor((row) => row.duration, {
        id: 'duration',
        header: 'Days',
        size: 80,
      }),
      columnHelperTimeoff.accessor((row) => row.status, {
        id: 'status',
        header: 'Status',
        size: 120,
        cell: (info) => (
          <>
            {info.getValue() ? (
              <Badge
                size="sm"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                color={cn(
                  info.getValue()?.toLocaleLowerCase() === 'requested' && 'blue-light',
                  info.getValue()?.toLocaleLowerCase() === 'approved' && 'success',
                  info.getValue()?.toLocaleLowerCase() === 'declined' && 'error',
                  info.getValue()?.toLocaleLowerCase() === 'rejected' && 'error',
                  info.getValue()?.toLocaleLowerCase() === 'cancelled' && 'warning',
                )}
                icon="none"
                className="capitalize"
              >
                {info.getValue()}
              </Badge>
            ) : (
              '-'
            )}
          </>
        ),
      }),
      columnHelperTimeoff.accessor('id', {
        header: '',
        enableSorting: false,
        size: 72,
        cell: (info) => (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              btnFormat="square"
              onClick={() => handleOpenTimeoffDetail(info.row.original)}
            >
              <ChevronRightIcon className="h-5 w-5 stroke-gray-600" />
            </Button>
          </div>
        ),
      }),
    ],
    [handleOpenTimeoffDetail],
  )

  useEffect(() => {
    if (!requestTimeOff) {
      setTitleListBox((prev: any) => ({ ...prev, typeOfLeave: '' }))
      setValueRequestTimeoff('leave_type', null)
    } else {
      setTitleListBox((prev: any) => ({
        ...prev,
        typeOfLeave: 'Type of Leave',
      }))
    }
  }, [requestTimeOff, setValueRequestTimeoff])

  useEffect(() => {
    timeOffTrigger()
  }, [])

  useEffect(() => {
    const getPIC = async () => {
      const pic = await getAllPics(employeeDetail.full_name)
      setPics(pic)
    }
    getPIC()
  }, [employeeDetail.full_name])

  useEffect(() => {
    if (!requestTimeOff) {
      closeRequestTimeOffDrawer()
    }
  }, [closeRequestTimeOffDrawer, requestTimeOff])

  if (timeoffError) {
    return <pre>Error: {JSON.stringify(timeoffError, null, 2)}</pre>
  }

  if (!timeoffData) {
    return <LoadingTable />
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-lg font-semibold text-gray-900">Time Off</p>
          <p className="text-sm font-normal text-gray-600 ">Description about Time Off (if needed)</p>
        </div>
        <div className="inline-flex items-center gap-4">
          <Button type="button" btnType="normal" size="md" variant="primary" onClick={openRequestTimeOffDrawer}>
            <AlarmClockOffIcon className="h-5 w-5 stroke-white" />
            Request Time Off
          </Button>
        </div>
      </div>
      <div className="w-full">
        <div ref={timeOffRef} className="keen-slider mb-10">
          {timeoffData?.summary.map((timeOffCard) => (
            <div key={snakeCase(timeOffCard.title)} className="keen-slider__slide px-px py-1.5">
              <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <span className="mb-1.5 inline-block text-sm font-medium text-gray-600">
                  {titleCase(timeOffCard.title)}
                </span>
                <p className="text-4xl font-semibold text-gray-900 ">{timeOffCard.totalDays} days</p>
              </div>
            </div>
          ))}
        </div>
        <TableCore
          supportTableType="normal"
          data={timeoffData?.data}
          columns={columnsTimeOffTable}
          useSearchBar={true}
          buttons={[
            {
              id: 'leave_type',
              column: 'leave_type',
              label: 'Type of Leave',
            },
            {
              id: 'status',
              column: 'status',
              label: 'Status',
            },
          ]}
        />
      </div>
      {/* Timeoff : Read Form */}
      <Drawer
        isOpen={timeoffDrawer}
        setIsOpen={setTimeoffDrawer}
        title="Time Off"
        description={employeeDetail.full_name}
        icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
        usingFooter={
          timeoffDataDetail?.status.toLocaleLowerCase() === 'requested' ||
          checkIsItemExist(userLoggedinInformation?.role, [RoleDefinition.SUPERADMIN])
            ? true
            : false
        }
        footerButton={[
          <>
            {timeoffDataDetail?.status.toLocaleLowerCase() === 'requested' ? (
              <Button
                type="button"
                btnType="normal"
                variant="primary"
                className=""
                size="md"
                onClick={openConfirmationCancelRequestModal}
              >
                Cancel Request
              </Button>
            ) : null}
          </>,
          <>
            {checkIsItemExist(userLoggedinInformation?.role, [RoleDefinition.SUPERADMIN]) ? (
              <Button
                type="button"
                btnType="normal"
                variant="error"
                className=""
                size="md"
                onClick={openConfirmationRemoveTimeoffModal}
              >
                Force Remove Time Off
              </Button>
            ) : null}
          </>,
        ]}
        drawerWidth={
          timeoffDataDetail?.status.toLocaleLowerCase() === 'requested' &&
          checkIsItemExist(userLoggedinInformation?.role, [RoleDefinition.SUPERADMIN])
            ? 'w-[28rem]'
            : 'w-[25rem]'
        }
      >
        <div className="flex flex-col gap-6">
          <div className={cn(timeoffDataDetail?.leave_type !== 'joint_holiday' ? 'grid grid-cols-2' : '')}>
            <div>
              <label className="input-label gap-wide">Type of Leave</label>
              <div>
                <p className="capitalize text-gray-600">
                  {timeoffDataDetail?.leave_type === 'joint_holiday'
                    ? 'Bulk Time Off (Cuti Bersama)'
                    : titleCase(timeoffDataDetail?.leave_type)}
                </p>
              </div>
            </div>
            {timeoffDataDetail?.leave_type !== 'joint_holiday' ? (
              <div>
                <label className="input-label gap-wide">Status</label>
                <div>
                  {timeoffDataDetail?.status ? (
                    <Badge
                      size="md"
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      color={cn(
                        timeoffDataDetail?.status.toLocaleLowerCase() === 'requested' && 'blue-light',
                        timeoffDataDetail?.status.toLocaleLowerCase() === 'approved' && 'success',
                        timeoffDataDetail?.status.toLocaleLowerCase() === 'rejected' && 'error',
                        timeoffDataDetail?.status.toLocaleLowerCase() === 'declined' && 'error',
                        timeoffDataDetail?.status.toLocaleLowerCase() === 'cancelled' && 'warning',
                      )}
                      icon="none"
                      className="capitalize"
                    >
                      {timeoffDataDetail?.status}
                    </Badge>
                  ) : (
                    <em className="text-gray-400">No Status</em>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <div className="mb-6 grid grid-cols-2">
              <div>
                <label className="input-label">Start Date</label>
                <div>
                  <p className="w-36 text-gray-600">
                    {dayjs(timeoffDataDetail?.start_date).format('dddd, DD MMMM YYYY')}
                  </p>
                </div>
              </div>
              <div>
                <label className="input-label">End Date</label>
                <div>
                  <p className="w-36 text-gray-600">
                    {dayjs(timeoffDataDetail?.end_date).format('dddd, DD MMMM YYYY')}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="input-label">Total Days (exclude Weekends + Holidays)</label>
              <p className="text-gray-600">{timeoffDataDetail?.duration} days</p>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label">
              {timeoffDataDetail?.leave_type !== 'joint_holiday'
                ? 'Time Off Request Date'
                : 'Bulk Time Off Submit Date'}
            </label>
            <p className="text-gray-600">{dayjs(timeoffDataDetail?.created_at).format('dddd, DD MMMM YYYY')}</p>
          </div>
          {timeoffDataDetail?.leave_type !== 'joint_holiday' ? (
            <div>
              <label className="input-label">Time Off Approved Date</label>
              <p className="text-gray-600">
                {timeoffDataDetail?.approved_at
                  ? dayjs(timeoffDataDetail?.approved_at).format('dddd, DD MMMM YYYY')
                  : '-'}
              </p>
            </div>
          ) : null}
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label gap-wide block w-full">Person in Charge</label>
            <AvatarLabelGroup
              size={'sm'}
              image={timeoffDataDetail?.pic_employee.pass_photo_path?.[0]}
              text={timeoffDataDetail?.pic_employee.full_name}
              supportingText={timeoffDataDetail?.pic_employee.email}
              statusIcon={false}
            />
          </div>
          <div>
            <label className="input-label gap-wide">Notes</label>
            <div>
              <p className="text-gray-600">{timeoffDataDetail?.notes || '-'}</p>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label gap-wide">Files</label>
            {timeoffDataDetail?.doc_path?.length > 0 ? (
              <FilePreview fileName={timeoffDataDetail?.doc_path[0]} />
            ) : (
              <p>
                <em className="text-gray-400">No file attached</em>
              </p>
            )}
          </div>
        </div>
      </Drawer>

      {/* Request Timeoff : Create Form */}
      <form onSubmit={handleSubmitRequestTimeoff(requestTimeoffSubmit)}>
        <Drawer
          isOpen={requestTimeOff}
          setIsOpen={setRequestTimeOff}
          title="Request Time Off"
          description={employeeDetail.full_name}
          icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                className=""
                size="md"
                onClick={closeRequestTimeOffDrawer}
              >
                Cancel
              </Button>
            </>,
            <>
              <Button
                type="submit"
                btnType="normal"
                variant="primary"
                size="md"
                isLoading={loadingButtonStatement.timeoff}
              >
                Submit
              </Button>
            </>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="leave_type" className="input-label">
                Type of Leave
              </label>
              <Controller
                control={controlRequestTimeoff}
                name="leave_type"
                rules={{ required: 'Leave of type is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
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
                      value={getValuesRequestTimeoff('leave_type')}
                      error={invalid}
                    >
                      {titleListBox?.typeOfLeave}
                    </ListboxSelect>
                    {errorsRequestTimeoff.leave_type && (
                      <span className="input-hint-text error">{errorsRequestTimeoff.leave_type?.message}</span>
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
                  control={controlRequestTimeoff}
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
                        isCurrentYear={true}
                      />
                      {errorsRequestTimeoff.start_date && (
                        <span className="input-hint-text error">{errorsRequestTimeoff.start_date?.message}</span>
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
                  control={controlRequestTimeoff}
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
                        isCurrentYear={true}
                      />
                      {errorsRequestTimeoff.end_date && (
                        <span className="input-hint-text error">{errorsRequestTimeoff.end_date?.message}</span>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="duration" className="input-label">
                Total Days
              </label>
              <Controller
                control={controlRequestTimeoff}
                name="duration"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <Input
                    type="number"
                    id="duration"
                    placeholder="Total Days (exclude Weekend & Holiday)"
                    onChange={onChange}
                    value={getValuesRequestTimeoff('duration') || ''}
                    error={invalid}
                  />
                )}
              />
              {errorsRequestTimeoff.duration && (
                <span className="input-hint-text error">{errorsRequestTimeoff.duration?.message}</span>
              )}
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label htmlFor="supervisor" className="input-label">
                Person in Charge while Time Off
              </label>
              <Controller
                control={controlRequestTimeoff}
                name="pic_employee.full_name"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <ComboboxAutocomplete
                    icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                    id="pic_employee.full_name"
                    placeholder="Select PIC while your time-off"
                    value={getValuesRequestTimeoff('pic_employee.full_name') as unknown as ComboboxType}
                    handleChange={(supervisor) => {
                      onChange(supervisor)
                    }}
                    listData={pics}
                    error={invalid}
                  />
                )}
              />
              {errorsRequestTimeoff?.pic_employee?.full_name && (
                <span className="input-hint-text error">{errorsRequestTimeoff?.pic_employee?.full_name?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="notes" className="input-label">
                Notes
              </label>
              <textarea
                {...registerRequestTimeoff('notes')}
                id="notes"
                className="textarea-input resize-none"
                rows={5}
                placeholder="Write notes about your time off"
              ></textarea>
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <SwitchableUploadField
              name="doc_path"
              label="Document"
              fieldKey="doc_path"
              control={controlRequestTimeoff}
              errors={errorsRequestTimeoff}
              setValue={setValueRequestTimeoff}
              isLinkMode={switchTogglableButton.timeoff_document}
              onToggle={() => {
                setSwitchTogglableButton((prev) => ({
                  ...prev,
                  timeoff_document: !prev.timeoff_document,
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

      {/* Modal Remove Timeoff Confirmation */}
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Remove Time Off"
        modalDescription="Are you sure you want to force remove related time off? If so you will not be able to undo this action."
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeConfirmationRemoveTimeoffModal}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button
              type="button"
              btnType="normal"
              variant="error"
              className="w-full justify-center"
              size="lg"
              isLoading={loadingButtonStatement.forceTimeoff}
              onClick={forceRemoveTimeoff}
            >
              Yes, Sure
            </Button>
          </>,
        ]}
        stateModal={isOpenModal.confirmationRemoveTimeoff}
        handleCloseModal={closeConfirmationRemoveTimeoffModal}
      />

      {/* Modal Cancel Request Confirmation */}
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-primary-500" />}
        theme={theme.PRIMARY}
        modalTitle="Cancel Time Off Request?"
        modalDescription="You will remove your pending time off request. If you want to request again, you need to re-submit from start"
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeConfirmationCancelRequestModal}
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
              size="lg"
              isLoading={loadingButtonStatement.timeoff}
              onClick={executeCancelRequest}
            >
              Yes, Sure
            </Button>
          </>,
        ]}
        stateModal={isOpenModal.confirmationCancelRequest}
        handleCloseModal={closeConfirmationCancelRequestModal}
      />
    </>
  )
}
