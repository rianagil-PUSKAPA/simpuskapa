import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Button } from '@/components/Button'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { TableCore } from '@/components/TableCore'
import { AlarmClockOffIcon } from '@/components/icon/AlarmClockOffIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { getEmployeeTimeoff } from '@/utils/apiRequestHelper'
import { firstDayInWeekday, firstDayIndexWeek, lastDayInWeekday, lastDayIndexWeek } from '@/utils/constant'
import { titleCase } from '@/utils/globalHelper'
import { createColumnHelper } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { TimeOffRow } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

const columnHelperEmploymentTimeoff = createColumnHelper<TimeOffRow>()

export const CollectiveLeave = () => {
  const { userLoggedinInformation } = useDashboardContext()
  const [filtrationDate, setFiltrationDate] = useState<Date[]>([
    new Date(new Date().setDate(firstDayIndexWeek + 1)),
    new Date(new Date().setDate(lastDayIndexWeek - 1)),
  ])
  const [timeoffDrawer, setTimeoffDrawer] = useState<boolean>(false)
  const [timeoffDataDetail, setTimeoffDataDetail] = useState<TimeOffRow | null>(null)

  const [wallFilterStart, wallFilterEnd] = [
    dayjs(filtrationDate[0]).format('YYYY-MM-DD'),
    dayjs(filtrationDate[1]).format('YYYY-MM-DD'),
  ]

  // console.log('wallFilterStart', wallFilterStart)
  // console.log('wallFilterEnd', wallFilterEnd)

  const {
    data: employeeTimeoffData,
    error: employeeTimeoffError,
    trigger: employeeTimeoffTrigger,
  } = useSWRMutation(
    `wall/${wallFilterStart}/${wallFilterEnd}/true/joint_holiday/${
      userLoggedinInformation?.role?.includes(RoleDefinition.SUPERVISOR)
        ? userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN)
          ? 'undefined'
          : userLoggedinInformation?.employee_id
        : ''
    }`,
    getEmployeeTimeoff,
  )

  /* Drawer: Time Off */
  const openTimeOffDrawer = () => {
    setTimeoffDrawer(true)
  }
  const closeTimeOffDrawer = () => {
    setTimeoffDrawer(false)
  }
  const handleOpenTimeoffDetail = (parameter: TimeOffRow) => {
    setTimeoffDataDetail(parameter)
    openTimeOffDrawer()
  }

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

  const columnsEmployeeTrainingTable = useMemo(
    () => [
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
      columnHelperEmploymentTimeoff.accessor((row) => row.notes, {
        id: 'notes',
        header: 'Notes',
        size: 180,
        cell: (info) => (
          <p className="inline-block font-medium capitalize text-gray-900">{titleCase(info.renderValue())}</p>
        ),
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.start_date, {
        id: 'start_date',
        header: 'Start Date',
        size: 180,
        cell: (info) => <p className="inline-block">{dayjs(info.renderValue()).format('dddd, DD MMM YYYY')}</p>,
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.end_date, {
        id: 'end_date',
        header: 'End Date',
        size: 180,
        cell: (info) => <p className="inline-block">{dayjs(info.renderValue()).format('dddd, DD MMM YYYY')}</p>,
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.duration, {
        id: 'duration',
        header: 'Total Days',
        size: 110,
      }),
      columnHelperEmploymentTimeoff.accessor((row) => row.id, {
        id: 'actions',
        header: () => '',
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
    employeeTimeoffTrigger()
  }, [filtrationDate])

  useEffect(() => {
    if (!timeoffDrawer) {
      closeTimeOffDrawer()
    }
  }, [timeoffDrawer])

  if (employeeTimeoffError) {
    return <pre>Error: {JSON.stringify(employeeTimeoffError, null, 2)}</pre>
  }

  return (
    <>
      <TableCore
        data={employeeTimeoffData}
        columns={columnsEmployeeTrainingTable}
        supportTableType="normal"
        useFilterCalendar={true}
        useResetButon={true}
        dateFiltration={filtrationDate}
        handleDateFiltration={handleDateRangePicker}
        handleWeekShifting={handleShiftWeekday}
        useFooter={true}
        initialRows={20}
        buttons={[]}
      />
      {/* Timeoff : Read Form */}
      <Drawer
        isOpen={timeoffDrawer}
        setIsOpen={setTimeoffDrawer}
        title="Time Off"
        description={timeoffDataDetail?.notes}
        icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
        usingFooter={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="input-label gap-wide">Type of Leave</label>
            <div>
              <p className="capitalize text-gray-600">
                {/* {titleCase(timeoffDataDetail?.leave_type)} */}
                Bulk Time Off (Cuti Bersama)
              </p>
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
              <label className="input-label">Bulk Time Off Submit Date</label>
              <p className="text-gray-600">{dayjs(timeoffDataDetail?.created_at).format('dddd, DD MMMM YYYY')}</p>
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div>
            <label className="input-label gap-wide block w-full">Person in Charge</label>
            <AvatarLabelGroup
              size={'sm'}
              image={timeoffDataDetail?.pic_employee?.pass_photo_path?.[0]}
              text={timeoffDataDetail?.pic_employee?.full_name}
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
    </>
  )
}
