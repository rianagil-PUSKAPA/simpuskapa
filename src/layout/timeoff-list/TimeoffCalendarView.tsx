import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { DaterangePickerCalendar } from '@/components/DaterangePickerCalendar'
import { Drawer } from '@/components/Drawer'
import { FilePreview } from '@/components/FilePreview'
import { AlarmClockOffIcon } from '@/components/icon/AlarmClockOffIcon'
import { CalendarMinus02Icon } from '@/components/icon/CalendarMinus02Icon'
import { CalendarPlus02Icon } from '@/components/icon/CalendarPlus02Icon'
import { ChevronLeftIcon } from '@/components/icon/ChevronLeftIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { CoinsSwap01Icon } from '@/components/icon/CoinsSwap01Icon'
import { Combobox } from '@/components/ui/combobox'
import { cn } from '@/lib/utils'
import { calendarFilterType } from '@/types/calendar'
import {
  DEPARTMENT_OPTIONS,
  LEAVE_TYPE,
  firstDayInWeekday,
  firstDayIndexWeek,
  lastDayInWeekday,
  lastDayIndexWeek,
} from '@/utils/constant'
import { calculateCalendarBarLinePosition, generateDates, titleCase } from '@/utils/globalHelper'
import { Popover, Transition } from '@headlessui/react'
import dayjs from 'dayjs'
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react'
import { TimeOffRow } from 'sdk/api'

type Props = {
  employeeTimeoffData: TimeOffRow[]
  employeeTimeoffIsMutating: boolean
  handleDateRangePicker: (date: Date[]) => void
  filtrationDate: Date[]
  setFiltrationDate: Dispatch<SetStateAction<Date[]>>
  wallFilterStart: string
}

const leaveTypeList: string[] = Object.getOwnPropertyNames(LEAVE_TYPE)

const filterCalendar = (data: TimeOffRow[], position: string, department: string, leave_type: string) => {
  return data?.filter((item: TimeOffRow) => {
    const employee = item.employee
    const contract = employee.contract

    const isPositionMatch = position ? contract.position === position : true
    const isLeaveTypeMatch = leave_type ? item.leave_type === leave_type : true
    const isDepartmentMatch = department ? contract.department === department : true

    return isPositionMatch && isDepartmentMatch && isLeaveTypeMatch
  })
}

export const TimeoffCalendarView = ({
  employeeTimeoffData,
  employeeTimeoffIsMutating,
  handleDateRangePicker,
  filtrationDate,
  setFiltrationDate,
  wallFilterStart,
}: Props) => {
  const [empPosition, setEmpPosition] = useState<string[]>([])
  const [timeoffDrawer, setTimeoffDrawer] = useState<boolean>(false)
  const [currentIndexWeek, setCurrentIndexWeek] = useState<number>(0)
  const [timeoffDataDetail, setTimeoffDataDetail] = useState<TimeOffRow | null>(null)

  const [calendarFilter, setCalendarFilter] = useState<calendarFilterType | null>({
    position: '',
    department: '',
    leave_type: '',
  })

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
  const handleOpenTimeoffDetail = (parameter: TimeOffRow) => {
    setTimeoffDataDetail(parameter)
    openTimeOffDrawer()
  }

  const checkValidWeekDaterange = () => {
    return filtrationDate[1]?.getDate() - filtrationDate[0]?.getDate() > 4
      ? true
      : filtrationDate[1] === null
      ? true
      : false
  }

  const handleDepartmentChanges = (value: string) => {
    if (value === '') {
      // Reset to default state
      setEmpPosition([])
      setCalendarFilter((prev) => ({
        ...prev,
        department: '',
        position: '', // Reset position when department is cleared
      }))
    } else {
      // Find the department and set its positions
      const findPosition = DEPARTMENT_OPTIONS.find((item) => item.department === value)

      if (findPosition) {
        setEmpPosition(['Position', ...findPosition.position])
        setCalendarFilter((prev) => {
          // Check if current position exists in new department's positions
          const positionExistsInNewDepartment = findPosition.position.includes(prev.position)

          return {
            ...prev,
            department: value,
            position: positionExistsInNewDepartment ? prev.position : '', // Reset position if not compatible
          }
        })
      }
    }
  }

  useEffect(() => {
    if (!timeoffDrawer) {
      closeTimeOffDrawer()
    }
  }, [timeoffDrawer])

  useEffect(() => {
    setCurrentIndexWeek(dayjs(wallFilterStart).week())
  }, [wallFilterStart])

  if (!employeeTimeoffData) {
    return <></>
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-4">
          <Combobox
            options={[
              ...DEPARTMENT_OPTIONS.map((position) => ({
                value: position.department,
                label: position.department,
              })),
            ]}
            value={calendarFilter.department}
            onValueChange={handleDepartmentChanges}
            placeholder="Department"
            searchPlaceholder="Search department..."
          />
          <Combobox
            options={empPosition.map((item) => ({
              value: item === 'Position' ? '' : item,
              label: item,
            }))}
            value={calendarFilter.position}
            onValueChange={(position) => {
              setCalendarFilter((prev) => ({
                ...prev,
                position: position,
              }))
            }}
            placeholder="Position"
            searchPlaceholder="Search position..."
            disabled={empPosition.length === 0}
          />
          <Combobox
            options={leaveTypeList.map((leaveType) => ({
              value: leaveType,
              label: titleCase(leaveType),
            }))}
            value={calendarFilter.leave_type}
            onValueChange={(leave_type) => {
              setCalendarFilter((prev) => ({ ...prev, leave_type }))
            }}
            placeholder="Type of Leave"
            searchPlaceholder="Search leave type..."
          />
          <DaterangePickerCalendar
            size="md"
            dateRange={filtrationDate}
            handleDateRangePicker={(value) => handleDateRangePicker(value)}
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-2">
            <Button
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              btnFormat="square"
              onClick={() => handleShiftWeekday('previous')}
              disabled={checkValidWeekDaterange()}
            >
              <ChevronLeftIcon className="h-5 w-5 stroke-gray-700" />
            </Button>
            <Button
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              className="px-10"
              onClick={() => handleShiftWeekday('current-week')}
            >
              This Week
            </Button>
            <Button
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              btnFormat="square"
              onClick={() => handleShiftWeekday('next')}
              disabled={checkValidWeekDaterange()}
            >
              <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
            </Button>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'calendar-container relative grid border border-gray-200',
          generateDates(filtrationDate[0], filtrationDate[1]).length === 5 ? 'grid-cols-5' : 'grid-cols-1',
        )}
      >
        {/* Timeline Bar */}
        <div className="calendar-timeline-container">
          <div className={cn('calendar-timeline', employeeTimeoffIsMutating ? 'hidden' : '')}>
            {generateDates(filtrationDate[0], filtrationDate[1]).length === 5 &&
              filterCalendar(
                employeeTimeoffData,
                calendarFilter.position,
                calendarFilter.department,
                calendarFilter.leave_type,
              )?.map((item, index) => (
                <div key={index} className="calendar-timeline-inner">
                  <Popover>
                    {({ open }) => (
                      <>
                        {/* <p className="text-error-600">
                          {' '}
                          {dayjs(item.end_date).date()}
                        </p>
                        -
                        <p className="text-error-600">
                          {' '}
                          {dayjs(item.start_date).date()}
                        </p>
                        <p className="text-indigo-700">
                          {' '}
                          {dayjs(item.end_date).day()}
                        </p>
                        -
                        <p className="text-indigo-700">
                          {' '}
                          {dayjs(item.start_date).day()}
                        </p>
                        <p className="text-success-700">
                          {' '}
                          {dayjs(item.end_date).week()}
                        </p>
                        -
                        <p className="text-success-700">
                          {' '}
                          {dayjs(item.start_date).week()}
                        </p> */}
                        <Popover.Button
                          className={cn(
                            calculateCalendarBarLinePosition(
                              item.start_date,
                              item.end_date,
                              filtrationDate[0],
                              filtrationDate[1],
                            ),
                            // line-clamp-1 truncate
                            'calendar-timeline-item duration-200 focus-visible:outline-primary-500',
                            open ? 'border-primary-300 bg-primary-50' : 'border-gray-300 bg-gray-25',
                            // DON'T REMOVE THIS COMMENTED CODE, THESE CODES ARE TO RECOGNIZE CSS TAILWIND CLASSESS
                            // timeline-start-1 timeline-start-2 timeline-start-3 timeline-start-4 timeline-start-5 timeline-extend-1 timeline-extend-2 timeline-extend-3 timeline-extend-4
                          )}
                        >
                          {item.employee.full_name}
                          {/* {' '}
                          <p className="text-xl font-semibold text-purple-700">
                            {dayjs(item.start_date).format('DD')}
                          </p>{' '}
                          -
                          <p className="text-xl font-semibold text-error-600">
                            {dayjs(item.end_date).format('DD')}
                          </p> */}
                        </Popover.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 translate-y-1"
                        >
                          <Popover.Panel
                            className={cn(
                              'absolute z-10 mt-14 w-full max-w-calendar-popover translate-x-5 rounded-lg border border-primary-300 bg-primary-25 p-4',
                              calculateCalendarBarLinePosition(
                                item.start_date,
                                item.end_date,
                                filtrationDate[0],
                                filtrationDate[1],
                              ),
                            )}
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-400">{titleCase(item.leave_type)}</p>
                                  <span className="block text-xs font-semibold text-gray-400">
                                    {dayjs(item.start_date).format('DD MMM ‘YY')} -{' '}
                                    {dayjs(item.end_date).format('DD MMM ‘YY')}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  btnType="normal"
                                  size="sm"
                                  variant="secondary"
                                  btnFormat="square"
                                  onClick={() => handleOpenTimeoffDetail(item)}
                                >
                                  <ChevronRightIcon className="h-5 w-5 stroke-primary-600" />
                                </Button>
                              </div>
                              <AvatarLabelGroup
                                size={'sm'}
                                image={item.employee.pass_photo_path?.[0]}
                                text={item.employee.full_name}
                                statusIcon={false}
                                supportingText={`${item.employee.contract.position} - ${item.employee.contract.department}`}
                                light={true}
                              />
                              <div className="inline-flex items-center gap-2">
                                <CoinsSwap01Icon className="h-5 w-5 stroke-primary-600" />
                                <p className="text-sm font-medium text-primary-600">{item.pic_employee.full_name}</p>
                              </div>
                            </div>
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                </div>
              ))}
          </div>
        </div>

        {generateDates(filtrationDate[0], filtrationDate[1]).length === 0 && (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
                <CalendarMinus02Icon className="h-5 w-5 stroke-primary-600" />
              </div>
              <p className="mt-4 font-semibold text-gray-900">Timeoff data of selection date is empty</p>
            </div>
          </div>
        )}

        {generateDates(filtrationDate[0], filtrationDate[1]).length > 0 &&
          generateDates(filtrationDate[0], filtrationDate[1]).length < 5 && (
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
                  <CalendarMinus02Icon className="h-5 w-5 stroke-primary-600" />
                </div>
                <p className="mt-4 font-semibold text-gray-900">Please, choose date carefully.</p>
                <p className="text-sm text-gray-600">Not allowed, because you select less than 5 days</p>
              </div>
            </div>
          )}

        {generateDates(filtrationDate[0], filtrationDate[1]).length > 5 && (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
                <CalendarPlus02Icon className="h-5 w-5 stroke-primary-600" />
              </div>
              <p className="mt-4 font-semibold text-gray-900">Please, choose date carefully.</p>
              <p className="text-sm text-gray-600">Not allowed, because you select more than 5 days</p>
            </div>
          </div>
        )}

        {/* Grid looping relative layout */}
        {generateDates(filtrationDate[0], filtrationDate[1]).length === 5 &&
          generateDates(filtrationDate[0], filtrationDate[1]).map((weeklyCalendar, index) => (
            <div key={index} id={`calendar-week-${index}`} className="calendar-grid">
              <div className="border-b border-b-gray-200 bg-gray-50 py-3">
                {/* <p className="text-error-500">{weeklyCalendar}</p> */}
                <p className="mb-1 text-center text-sm font-bold text-gray-600">
                  {dayjs(weeklyCalendar).format('dddd')}
                </p>
                <span className="block text-center text-xs font-medium text-gray-600">
                  {dayjs(weeklyCalendar).format('DD MMMM YYYY')}
                </span>
              </div>
            </div>
          ))}
      </div>

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
