import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ComboboxAutocomplete } from '@/components/ComboboxAutocomplete'
import { DatePickerCalendar } from '@/components/DatePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { Input } from '@/components/Input'
import { ListboxSelect } from '@/components/ListboxSelect'
import { SwitchableUploadField } from '@/components/SwitchableUploadField'
import { TableCore } from '@/components/TableCore'
import { AlarmClockOffIcon } from '@/components/icon/AlarmClockOffIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { User01Icon } from '@/components/icon/User01Icon'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { BucketsEnum } from '@/shared/file.system'
import { RoleDefinition } from '@/shared/role.access'
import { ComboboxType, DynamicProgressType, TimeoffStatusType } from '@/types/global'
import { employeeApi, employeeTimeOffApi, fileApi, getAllPics, getEmployeeTimeoff } from '@/utils/apiRequestHelper'
import {
  firstDayInWeekday,
  firstDayIndexWeek,
  lastDayInWeekday,
  lastDayIndexWeek,
  leaveTypeList,
} from '@/utils/constant'
import { snakeCase, titleCase } from '@/utils/globalHelper'
import { createColumnHelper } from '@tanstack/react-table'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { TimeOffRow, TimeOffRowStatusEnum, TimeOffUpdateStatusDtoStatusEnum } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
dayjs.extend(utc)

type Props = {
  status: TimeoffStatusType
}

const columnHelperEmploymentTimeoff = createColumnHelper<TimeOffRow>()

export const TimeoffRequest = ({ status: timeoffStatus }: Props) => {
  const router = useRouter()
  const { userLoggedinInformation } = useDashboardContext()
  const [filtrationDate, setFiltrationDate] = useState<Date[]>([
    new Date(new Date().setDate(firstDayIndexWeek + 1)),
    new Date(new Date().setDate(lastDayIndexWeek - 1)),
  ])

  const [updateTimeOffDrawer, setUpdateTimeOffDrawer] = useState<boolean>(false)
  const [timeoffDrawer, setTimeoffDrawer] = useState<boolean>(false)
  const [timeoffDataDetail, setTimeoffDataDetail] = useState<TimeOffRow | null>(null)

  const [pics, setPics] = useState<ComboboxType[]>([])
  const [requestTimeoffStartDate, setRequestTimeoffStartDate] = useState<Date | null>(null)
  const [requestTimeoffEndDate, setRequestTimeoffEndDate] = useState<Date | null>(null)
  const [timeoffRequestFileUpload, setTimeoffRequestFileUpload] = useState([])
  const [tempProgressUpload, setTempProgressUpload] = useState<DynamicProgressType>({})
  const [switchTogglableButton, setSwitchTogglableButton] = useState<{
    timeoff_document: boolean
  }>({
    timeoff_document: false,
  })

  const [wallFilterStart, wallFilterEnd] = [
    dayjs(filtrationDate[0]).format('YYYY-MM-DD'),
    dayjs(filtrationDate[1]).format('YYYY-MM-DD'),
  ]

  const { data: employeeTimeoffData, trigger: employeeTimeoffTrigger } = useSWRMutation(
    `wall/${wallFilterStart}/${wallFilterEnd}/undefined/undefined/${
      userLoggedinInformation?.role?.includes(RoleDefinition.SUPERVISOR)
        ? userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN)
          ? 'undefined'
          : userLoggedinInformation?.employee_id
        : ''
    }/${timeoffStatus}`,
    getEmployeeTimeoff,
  )

  const handleDateRangePicker = (dateRanger: Date[]) => {
    setFiltrationDate(dateRanger)
  }
  const handleShiftWeekday = (direction: 'previous' | 'next' | 'current-week') => {
    const startDateSelection = filtrationDate[0]?.getDate() || firstDayInWeekday?.getDate()
    const endDateSelection = filtrationDate[1]?.getDate() || lastDayInWeekday?.getDate()

    switch (direction) {
      case 'previous':
        const firstDayOfPreviousWeek = new Date(filtrationDate[0].setDate(startDateSelection - 7))
        const lasttDayOfPreviousWeek = new Date(filtrationDate[1].setDate(endDateSelection - 7))

        const previousDateRanger: Date[] = [firstDayOfPreviousWeek, lasttDayOfPreviousWeek]
        setFiltrationDate(previousDateRanger)
        break

      case 'next':
        const firstDayOfNextWeek = new Date(filtrationDate[0].setDate(startDateSelection + 7))
        const lasttDayOfNextWeek = new Date(filtrationDate[1].setDate(endDateSelection + 7))

        const nextDateRanger: Date[] = [firstDayOfNextWeek, lasttDayOfNextWeek]
        setFiltrationDate(nextDateRanger)
        break

      case 'current-week':
        const currenttDateRanger: Date[] = [
          new Date(new Date().setDate(firstDayIndexWeek + 1)),
          new Date(new Date().setDate(lastDayIndexWeek - 1)),
        ]
        setFiltrationDate(currenttDateRanger)
        break

      default:
        break
    }
  }
  /* Drawer: Time Off */
  const openTimeOffDrawer = () => {
    setTimeoffDrawer(true)
  }
  const closeTimeOffDrawer = () => {
    setTimeoffDrawer(false)
  }

  const closeUpdateTimeOffrequestDrawer = () => {
    setUpdateTimeOffDrawer(false)

    setRequestTimeoffStartDate(null)
    setRequestTimeoffEndDate(null)
    setTimeoffRequestFileUpload([])
    setTempProgressUpload({})

    setValueEditTimeoff('leave_type', null)

    resetEditTimeoff({
      leave_type: '',
      start_date: undefined,
      end_date: undefined,
      duration: 0,
      employee_id: '',
      notes: '',
      doc_path: undefined,
    })
  }
  const openUpdateTimeOffRequestDrawer = () => {
    setUpdateTimeOffDrawer(true)
  }

  const handleOpenTimeoffDetail = (parameter: TimeOffRow) => {
    setTimeoffDataDetail(parameter)
    openTimeOffDrawer()
  }
  const handleOpenTimeoffEdit = (parameter: TimeOffRow) => {
    setTimeoffDataDetail(parameter)
    setValueEditTimeoff('leave_type', parameter.leave_type)
    setValueEditTimeoff('start_date', parameter.start_date)
    setRequestTimeoffStartDate(new Date(parameter.start_date as unknown as string))
    setValueEditTimeoff('end_date', parameter.end_date)
    setRequestTimeoffEndDate(new Date(parameter.end_date as unknown as string))
    setValueEditTimeoff('duration', parameter.duration)
    setValueEditTimeoff('notes', parameter.notes)
    setValueEditTimeoff('doc_path', parameter.doc_path)
    setValueEditTimeoff('pic_employee.full_name', parameter.pic_employee.full_name)
    openUpdateTimeOffRequestDrawer()
  }

  const {
    handleSubmit: handleSubmitEditTimeoff,
    control: controlEditTimeoff,
    setValue: setValueEditTimeoff,
    getValues: getValuesEditTimeoff,
    register: registerEditTimeoff,
    reset: resetEditTimeoff,
    formState: { errors: errorsEditTimeoff },
  } = useForm<TimeOffRow>()

  const handleApproval = async (
    employeeId: string,
    timeoffId: string,
    approvalStatus: TimeOffUpdateStatusDtoStatusEnum,
    action: 'accept' | 'decline' | 'edit' | 'remove',
  ) => {
    if (action === 'accept') {
      const requestTimeoffApprovalStatus = employeeTimeOffApi.timeOffControllerUpdateEmployeeTimeOffStatus(
        employeeId,
        timeoffId,
        { status: approvalStatus },
      )

      toast.promise(requestTimeoffApprovalStatus, {
        pending: 'Accepting Request Timeoff',
        success: 'Timeoff Request Accepted',
        error: 'Promise rejected 🤯',
      })
    }

    if (action === 'decline') {
      const requestTimeoffApprovalStatus = employeeTimeOffApi.timeOffControllerUpdateEmployeeTimeOffStatus(
        employeeId,
        timeoffId,
        { status: approvalStatus },
      )

      toast.promise(requestTimeoffApprovalStatus, {
        pending: 'Declining Request Timeoff',
        success: 'Timeoff Request Declined',
        error: 'Promise rejected 🤯',
      })
    }

    if (action === 'remove') {
      const removeRequestTimeoff = employeeTimeOffApi.timeOffControllerDeleteeEmployeeTimeOffRequest(
        employeeId,
        timeoffId,
      )

      toast.promise(removeRequestTimeoff, {
        pending: 'Removing Time Off Request',
        success: 'Time Off Request Removed',
        error: 'Promise rejected 🤯',
      })
    }

    employeeTimeoffTrigger()

    setTimeout(() => {
      employeeTimeoffTrigger()
    }, 1000)
  }

  const updateTimeoffSubmit: SubmitHandler<TimeOffRow> = async (formInput) => {
    if (dayjs(formInput.start_date).utc().unix() > dayjs(formInput.end_date).utc().unix()) {
      return toast.error('End date must be greater than start date')
    }

    let fileNameS3 = null

    if (timeoffRequestFileUpload.length) {
      const presignUrl = await fileApi.fileControllerGetPresignUrl(
        timeoffRequestFileUpload[0].name,
        BucketsEnum.employee_timeoff,
      )

      fileNameS3 = String(presignUrl.data.data).split('::')[0]
      const identifier = 'doc_path'

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

    const employee = await employeeApi.employeeControllerGetAllEmployee()

    const picEmployee = employee.data.data.find((item) => item.full_name === formInput.pic_employee.full_name)

    const timeoffValues = {
      id: timeoffDataDetail?.employee.id,
      employee_id: timeoffDataDetail?.employee.id,
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
      status: TimeOffRowStatusEnum.Approved,
      pic_employee_id: picEmployee.id,
      direct_approve: false,
    }

    // console.log('timeoffValues', timeoffValues)
    // return false

    const requestTimeoff = employeeTimeOffApi.timeOffControllerUpdateEmployeeTimeOffRequest(
      timeoffDataDetail?.employee.id,
      timeoffDataDetail?.id,
      timeoffValues,
    )

    toast.promise(requestTimeoff, {
      pending: 'Updating Timeoff Request',
      success: 'Timeoff Request Updated',
      error: 'Promise rejected 🤯',
    })

    requestTimeoff.then(() => {
      closeUpdateTimeOffrequestDrawer()
      employeeTimeoffTrigger()
    })

    setTimeout(() => {
      employeeTimeoffTrigger()
    }, 1000)
  }

  const deleteEmployeeTimeoffFile = async (filename: string) => {
    setValueEditTimeoff('doc_path', undefined)
    setTimeoffRequestFileUpload((prev) => prev.filter((item) => item.path !== filename))
  }

  const columnsEmployeeTimeoffRequestTable = useMemo(
    () => [
      columnHelperEmploymentTimeoff.accessor((row) => `${row.employee.full_name} ${row.employee.contract.position}`, {
        id: 'name',
        header: 'Name',
        size: 210,
        cell: (info) => (
          <AvatarLabelGroup
            size={'md'}
            image={info.row.original.employee.pass_photo_path?.[0]}
            text={info.row.original.employee.full_name}
            supportingText={info.row.original.employee.contract.position}
            statusIcon={false}
          />
        ),
      }),
      columnHelperEmploymentTimeoff.accessor(
        (row) => `${row.pic_employee.full_name} ${row.pic_employee.contract.position}`,
        {
          id: 'pic',
          header: 'People in Charge',
          size: 210,
          cell: (info) => (
            <AvatarLabelGroup
              size={'md'}
              image={info.row.original.pic_employee.pass_photo_path?.[0]}
              text={info.row.original.pic_employee.full_name}
              supportingText={info.row.original.pic_employee.contract.position}
              statusIcon={false}
            />
          ),
        },
      ),
      columnHelperEmploymentTimeoff.accessor((row) => row.leave_type, {
        id: 'leave_type',
        header: 'Type of Leave',
        size: 180,
        cell: (info) => (
          <p className="inline-block font-medium capitalize text-gray-900">{titleCase(info.renderValue())}</p>
        ),
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.start_date, {
        id: 'start_date',
        header: 'Start Date',
        size: 180,
        cell: (info) => dayjs(info.renderValue()).format('dddd, DD MMMM YYYY'),
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.end_date, {
        id: 'end_date',
        header: 'End Date',
        size: 180,
        cell: (info) => dayjs(info.renderValue()).format('dddd, DD MMMM YYYY'),
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.duration, {
        id: 'duration',
        header: 'Total Days',
        size: 120,
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.id, {
        id: 'actions',
        header: () => 'Actions',
        enableSorting: false,
        size: 240,
        cell: (info) => (
          <div className="flex items-center justify-end gap-3">
            {timeoffStatus === 'requested' && (
              <>
                <Button
                  type="button"
                  btnType="normal"
                  size="md"
                  variant="secondary"
                  onClick={() =>
                    handleApproval(info.row.original.employee.id, info.row.original.id, 'approved', 'accept')
                  }
                >
                  Accept
                </Button>
                <Button
                  type="button"
                  btnType="normal"
                  size="md"
                  variant="secondary-gray"
                  onClick={() =>
                    handleApproval(info.row.original.employee.id, info.row.original.id, 'declined', 'decline')
                  }
                >
                  Decline
                </Button>
              </>
            )}
            {timeoffStatus === 'approved' && (
              <>
                <Button
                  type="button"
                  btnType="normal"
                  size="md"
                  variant="secondary-gray"
                  onClick={() => handleOpenTimeoffEdit(info.row.original)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  btnType="normal"
                  size="md"
                  variant="secondary-gray"
                  onClick={() =>
                    handleApproval(info.row.original.employee.id, info.row.original.id, 'rejected', 'remove')
                  }
                >
                  Remove
                </Button>
              </>
            )}
            <Button
              type="button"
              btnType="normal"
              size="md"
              variant="secondary-gray"
              btnFormat="square"
              // className={cn(
              //   timeoffStatus === 'cancelled|declined' ? '' : 'ml-4',
              // )}
              onClick={() => handleOpenTimeoffDetail(info.row.original)}
            >
              <ChevronRightIcon className="h-5 w-5 stroke-gray-600" />
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )
  const columnsEmployeeCancelledDeclinedTimeoffTable = useMemo(
    () => [
      columnHelperEmploymentTimeoff.accessor((row) => `${row.employee.full_name} ${row.employee.contract.position}`, {
        id: 'name',
        header: 'Name',
        cell: (info) => (
          <div className="w-52">
            <AvatarLabelGroup
              size={'md'}
              image={info.row.original.employee.pass_photo_path?.[0]}
              text={info.row.original.employee.full_name}
              supportingText={info.row.original.employee.contract.position}
              statusIcon={false}
            />
          </div>
        ),
      }),
      columnHelperEmploymentTimeoff.accessor(
        (row) => `${row.pic_employee.full_name} ${row.pic_employee.contract.position}`,
        {
          id: 'pic',
          header: 'People in Charge',
          size: 210,
          cell: (info) => (
            <AvatarLabelGroup
              size={'md'}
              image={info.row.original.pic_employee.pass_photo_path?.[0]}
              text={info.row.original.pic_employee.full_name}
              supportingText={info.row.original.pic_employee.contract.position}
              statusIcon={false}
            />
          ),
        },
      ),
      columnHelperEmploymentTimeoff.accessor((row) => row.leave_type, {
        id: 'leave_type',
        header: 'Type of Leave',
        size: 180,
        cell: (info) => (
          <p className="inline-block font-medium capitalize text-gray-900">{titleCase(info.renderValue())}</p>
        ),
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.start_date, {
        id: 'start_date',
        header: 'Start Date',
        size: 210,
        cell: (info) => <p className="inline-block">{dayjs(info.renderValue()).format('dddd, DD MMMM YYYY')}</p>,
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.end_date, {
        id: 'end_date',
        header: 'End Date',
        size: 210,
        cell: (info) => <p className="inline-block">{dayjs(info.renderValue()).format('dddd, DD MMMM YYYY')}</p>,
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.duration, {
        id: 'duration',
        header: 'Total Days',
        size: 120,
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.status, {
        id: 'status',
        header: 'Status',
        size: 120,
        cell: (info) => (
          <Badge
            size="md"
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            color={cn(
              info.renderValue().toLocaleLowerCase() === 'requested' && 'blue-light',
              info.renderValue().toLocaleLowerCase() === 'approved' && 'success',
              info.renderValue().toLocaleLowerCase() === 'cancelled' && 'warning',
              info.renderValue().toLocaleLowerCase() === 'declined' && 'error',
            )}
            icon="none"
            className="capitalize"
          >
            {info.renderValue()}
          </Badge>
        ),
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.id, {
        id: 'actions',
        header: () => 'Actions',
        enableSorting: false,
        size: 72,
        cell: (info) => (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              btnType="normal"
              size="md"
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
    [],
  )

  useEffect(() => {
    const getPIC = async () => {
      const pic = await getAllPics(timeoffDataDetail?.employee.full_name)
      setPics(pic)
    }
    getPIC()
  }, [router.isReady, timeoffDataDetail?.employee.full_name])

  useEffect(() => {
    employeeTimeoffTrigger()
  }, [filtrationDate])

  useEffect(() => {
    if (!timeoffDrawer) {
      closeTimeOffDrawer()
    }
  }, [timeoffDrawer])

  return (
    <>
      {timeoffStatus === 'cancelled|declined' ? (
        <TableCore
          data={employeeTimeoffData}
          columns={columnsEmployeeCancelledDeclinedTimeoffTable}
          supportTableType="normal"
          useFilterCalendar={true}
          useResetButon={true}
          dateFiltration={filtrationDate}
          handleDateFiltration={handleDateRangePicker}
          handleWeekShifting={handleShiftWeekday}
          useFooter={true}
          initialRows={20}
          buttons={[
            {
              id: 'name',
              column: 'employee.contract.position',
              label: 'Emp. Position',
            },
            {
              id: 'pic',
              column: 'pic_employee.contract.position',
              label: 'PIC Position',
            },
            {
              id: 'leave_type',
              column: 'leave_type',
              label: 'Type of Leave',
            },
          ]}
        />
      ) : (
        <TableCore
          data={employeeTimeoffData}
          columns={columnsEmployeeTimeoffRequestTable}
          supportTableType="normal"
          useFilterCalendar={true}
          useResetButon={true}
          dateFiltration={filtrationDate}
          handleDateFiltration={handleDateRangePicker}
          handleWeekShifting={handleShiftWeekday}
          useFooter={true}
          initialRows={20}
          buttons={[
            {
              id: 'name',
              column: 'employee.contract.position',
              label: 'Emp. Position',
            },
            {
              id: 'pic',
              column: 'pic_employee.contract.position',
              label: 'PIC Position',
            },
            {
              id: 'leave_type',
              column: 'leave_type',
              label: 'Type of Leave',
            },
          ]}
        />
      )}

      {/* Timeoff : Read Form */}
      <Drawer
        isOpen={timeoffDrawer}
        setIsOpen={setTimeoffDrawer}
        title="Time Off"
        description={timeoffDataDetail?.employee.full_name}
        icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
        usingFooter={false}
      >
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2">
            <div>
              <label className="input-label gap-wide">Type of Leave</label>
              <div>
                <p className="capitalize text-gray-600">{titleCase(timeoffDataDetail?.leave_type)}</p>
              </div>
            </div>
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
                      timeoffDataDetail?.status.toLocaleLowerCase() === 'cancelled' && 'warning',
                      timeoffDataDetail?.status.toLocaleLowerCase() === 'declined' && 'error',
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
          <div className="flex flex-col gap-6">
            <div>
              <label className="input-label">Time Off Request Date</label>
              <p className="text-gray-600">{dayjs(timeoffDataDetail?.created_at).format('dddd, DD MMMM YYYY')}</p>
            </div>
            <div>
              <label className="input-label">Time Off Approved Date</label>
              <p className="text-gray-600">
                {timeoffDataDetail?.approved_at
                  ? dayjs(timeoffDataDetail?.approved_at).format('dddd, DD MMMM YYYY')
                  : '-'}
              </p>
            </div>
          </div>
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
              <p className="text-gray-600">{timeoffDataDetail?.notes}</p>
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
      <form onSubmit={handleSubmitEditTimeoff(updateTimeoffSubmit)}>
        <Drawer
          isOpen={updateTimeOffDrawer}
          setIsOpen={setUpdateTimeOffDrawer}
          title="Request Time Off"
          description={timeoffDataDetail?.employee.full_name}
          icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
          footerButton={[
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className=""
              size="md"
              onClick={closeUpdateTimeOffrequestDrawer}
            >
              Cancel
            </Button>,
            <Button type="submit" btnType="normal" variant="primary" className="" size="md">
              Update
            </Button>,
          ]}
        >
          <div className="flex flex-col gap-6">
            <div>
              <label htmlFor="leave_type" className="input-label">
                Type of Leave
              </label>
              <Controller
                control={controlEditTimeoff}
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
                      value={getValuesEditTimeoff('leave_type')}
                      error={invalid}
                    >
                      Type of Leave
                    </ListboxSelect>
                    {errorsEditTimeoff.leave_type && (
                      <span className="input-hint-text error">{errorsEditTimeoff.leave_type?.message}</span>
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
                  control={controlEditTimeoff}
                  name="start_date"
                  rules={{ required: 'Start date is required field' }}
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <DatePickerCalendar
                        id="start_date"
                        selected={requestTimeoffStartDate}
                        onChange={(date: Date) => {
                          setRequestTimeoffStartDate(date)
                          onChange(date)
                        }}
                        error={invalid}
                        dateFormat="MMM d, yyyy"
                      />
                      {errorsEditTimeoff.start_date && (
                        <span className="input-hint-text error">{errorsEditTimeoff.start_date?.message}</span>
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
                  control={controlEditTimeoff}
                  name="end_date"
                  rules={{ required: 'This is required field' }}
                  render={({ field: { onChange }, fieldState: { invalid } }) => (
                    <>
                      <DatePickerCalendar
                        id="end_date"
                        selected={requestTimeoffEndDate}
                        onChange={(date: Date) => {
                          onChange(date)
                          setRequestTimeoffEndDate(date)
                        }}
                        error={invalid}
                        dateFormat="MMM d, yyyy"
                      />
                      {errorsEditTimeoff.end_date && (
                        <span className="input-hint-text error">{errorsEditTimeoff.end_date?.message}</span>
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
                control={controlEditTimeoff}
                name="duration"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange }, fieldState: { invalid } }) => (
                  <Input
                    type="number"
                    id="duration"
                    placeholder="Total Days (exclude Weekend & Holiday)"
                    onChange={onChange}
                    value={getValuesEditTimeoff('duration') || ''}
                    error={invalid}
                  />
                )}
              />
              {errorsEditTimeoff.duration && (
                <span className="input-hint-text error">{errorsEditTimeoff.duration?.message}</span>
              )}
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <div>
              <label htmlFor="supervisor" className="input-label">
                Person in Charge while Time Off
              </label>
              <Controller
                control={controlEditTimeoff}
                name="pic_employee.full_name"
                rules={{ required: 'This is required field' }}
                render={({ field: { onChange, value }, fieldState: { invalid } }) => (
                  <ComboboxAutocomplete
                    icon={<User01Icon className="h-5 w-5 stroke-gray-500" />}
                    id="pic_employee.full_name"
                    placeholder="Find your PIC"
                    value={value as unknown as ComboboxType}
                    handleChange={(supervisor) => {
                      onChange(supervisor)
                    }}
                    listData={pics}
                    error={invalid}
                  />
                )}
              />
              {errorsEditTimeoff?.pic_employee?.full_name && (
                <span className="input-hint-text error">{errorsEditTimeoff?.pic_employee?.full_name?.message}</span>
              )}
            </div>
            <div>
              <label htmlFor="notes" className="input-label">
                Notes
              </label>
              <textarea
                {...registerEditTimeoff('notes')}
                id="notes"
                className="textarea-input resize-none"
                rows={5}
                placeholder="Write notes about your time off"
              ></textarea>
            </div>
            <div className="h-px w-full bg-gray-200"></div>
            <SwitchableUploadField
              name="doc_path"
              label="Contract Document (Optional)"
              fieldKey="doc_path"
              control={controlEditTimeoff}
              errors={errorsEditTimeoff}
              setValue={setValueEditTimeoff}
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
              deleteFilePath={deleteEmployeeTimeoffFile}
              maxFiles={1}
              informationText="IMAGE or DOCUMENTS (max. 5MB)"
              existingFilePath={timeoffDataDetail?.doc_path?.length > 0 ? timeoffDataDetail?.doc_path[0] : null}
              handleDeleteExistingFile={() => {
                setValueEditTimeoff('doc_path', undefined)
              }}
              isEditMode={!!timeoffDataDetail}
              isRequired={false}
            />
          </div>
        </Drawer>
      </form>
    </>
  )
}
