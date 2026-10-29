import { resolveAuthToken } from '@/utils/ssrAuth'
import { ArrowRightIcon } from '@/components/icon/ArrowRightIcon'
import { BankNote01Icon } from '@/components/icon/BankNote01Icon'
import { CalendarIcon } from '@/components/icon/CalendarIcon'
import { File04Icon } from '@/components/icon/File04Icon'
import { LayersThree02Icon } from '@/components/icon/LayersThree02Icon'
import { CheckVerified01Icon } from '@/components/icon/CheckVerified01Icon'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { getEmployeeTimeoff, getPersonalizedNotification } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE, firstDayInWeekday, firstDayIndexWeek, lastDayInWeekday, lastDayIndexWeek } from '@/utils/constant'
import { FilesApi, Log, MetadataApi } from '@sdk'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import useSWRMutation from 'swr/mutation'
dayjs.extend(relativeTime)

const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const Badge: any = dynamic(() => import('@/components/Badge').then((mod) => mod.Badge))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const DaterangePickerCalendar: any = dynamic(() =>
  import('@/components/DaterangePickerCalendar').then((mod) => mod.DaterangePickerCalendar),
)
const LogActivity: any = dynamic(() => import('@/components/LogActivity').then((mod) => mod.LogActivity))
const ChevronLeftIcon: any = dynamic(() =>
  import('@/components/icon/ChevronLeftIcon').then((mod) => mod.ChevronLeftIcon),
)
const ChevronRightIcon: any = dynamic(() =>
  import('@/components/icon/ChevronRightIcon').then((mod) => mod.ChevronRightIcon),
)
const LinkExternal02Icon: any = dynamic(() =>
  import('@/components/icon/LinkExternal02Icon').then((mod) => mod.LinkExternal02Icon),
)
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

type Props = {
  log: Log[]
}

type DashboardMetricCardProps = {
  href: string
  label: string
  value?: number | null
  icon: React.ReactNode
  tone: 'orange' | 'blue' | 'green' | 'purple'
}

const DashboardMetricCard = ({ href, label, value, icon, tone }: DashboardMetricCardProps) => (
  <Link href={href} className={`sim-modern-metric sim-modern-metric--${tone}`}>
    <span className="sim-modern-metric-icon" aria-hidden="true">{icon}</span>
    <span className="sim-modern-metric-body">
      <span className="sim-modern-metric-title">{label}</span>
      <strong className="sim-modern-metric-value">{value === null || value === undefined ? '—' : value}</strong>
    </span>
    <span className="sim-modern-metric-arrow" aria-hidden="true">
      <ArrowRightIcon className="h-4 w-4 stroke-primary-700" />
    </span>
  </Link>
)

const DashboardIndex = ({ log }: Props) => {
  const { userLoggedinInformation } = useDashboardContext()

  const [filtrationDate, setFiltrationDate] = useState<Date[]>([
    new Date(new Date().setDate(firstDayIndexWeek + 1)),
    new Date(new Date().setDate(lastDayIndexWeek - 1)),
  ])

  const [wallFilterStart, wallFilterEnd] = [
    dayjs(filtrationDate[0]).format('YYYY-MM-DD'),
    dayjs(filtrationDate[1]).format('YYYY-MM-DD'),
  ]

  const {
    data: personalizedNotifications,
    trigger: personalizedNotificationsTrigger,
    error: personalizedNotificationsError,
    isMutating: notificationsLoading,
  } = useSWRMutation(
    'personalizedNotifications',
    getPersonalizedNotification,
  )

  const { data: employeeTimeoffData, trigger: employeeTimeoffTrigger } = useSWRMutation(
    `wall/${wallFilterStart}/${wallFilterEnd}/undefined/undefined/${
      userLoggedinInformation?.role?.includes(RoleDefinition.SUPERVISOR)
        ? userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN)
          ? 'undefined'
          : userLoggedinInformation?.employee_id
        : ''
    }`,
    getEmployeeTimeoff,
  )

  const greeting = useMemo(() => {
    const date = new Date()
    const hour = date.getHours()
    let greet

    if (hour < 12) greet = 'Good Morning'
    else if (hour >= 12 && hour <= 17) greet = 'Good Afternoon'
    else if (hour >= 17 && hour <= 24) greet = 'Good Night'

    return greet
  }, [])

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

  const checkValidWeekDaterange = () => {
    return filtrationDate[1]?.getDate() - filtrationDate[0]?.getDate() > 4
      ? true
      : filtrationDate[1] === null
      ? true
      : false
  }

  // Do not show a false zero while the per-user notification response is unknown.
  const notificationReady = personalizedNotifications !== undefined && personalizedNotifications !== null
  const notificationsUnavailable = !notificationReady && !notificationsLoading && !!personalizedNotificationsError

  const needActionTotal =
    Number(personalizedNotifications?.need_action_rf_total || 0) +
    Number(personalizedNotifications?.need_action_pr_check_total || 0) +
    Number(personalizedNotifications?.need_action_pr_pay_total || 0)

  useEffect(() => {
    personalizedNotificationsTrigger()
  }, [])

  useEffect(() => {
    employeeTimeoffTrigger()
  }, [employeeTimeoffTrigger, filtrationDate])

  return (
    <>
      <NextSeo title="Dashboard" canonical={`${MAIN_URL_FE}dashboard`} />
      <Dashboard breadcrumbLists={[{ title: 'Home', url: '' }]}>
        <div className="sim-modern-home p-5 md:p-7 xl:p-10">
          <div className="sim-modern-greeting mb-8">
            <p className="mb-2 text-2xl font-medium text-gray-700">{greeting},</p>
            <h1 className="text-3xl font-semibold text-primary-700">{userLoggedinInformation?.employee_name}</h1>
          </div>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            <div id="dashboard-left-side" className="flex flex-col gap-6">
              {/* Needs Approval */}
              <div className="sim-modern-panel rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="sim-modern-panel-header flex flex-wrap items-center justify-between gap-3 border-b border-b-gray-200 px-6 py-5">
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">Needs Approval</p>
                    <Badge size="sm" color="primary" icon="none">
                      {notificationReady
                        ? (Number(personalizedNotifications?.need_approval_timeoff_total || 0) +
                           Number(personalizedNotifications?.need_approval_program_budget_total || 0) +
                           Number(personalizedNotifications?.need_approval_rf_total || 0) +
                           Number(personalizedNotifications?.need_approval_pr_total || 0)) + ' items'
                        : notificationsUnavailable ? 'Unavailable' : 'Loading...'}
                    </Badge>
                  </div>
                  <Link href="/dashboard/user/need-approval">
                    <Button btnType="div" size="md" variant="secondary-gray" btnFormat="square">
                      <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
                    </Button>
                  </Link>
                </div>
                {!notificationReady && (
                  <div className="mx-5 mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600" role="status">
                    {notificationsUnavailable
                      ? 'Approval counts could not be loaded. Please retry; your request records have not been changed.'
                      : 'Loading approval counts for your account...'}
                    {notificationsUnavailable && (
                      <button type="button" onClick={() => personalizedNotificationsTrigger()} className="ml-3 font-semibold text-primary-700 underline">
                        Retry
                      </button>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    <DashboardMetricCard
                      href="/dashboard/user/need-approval?tab=timeoff-request"
                      label="Time Off Request"
                      value={notificationReady ? Number(personalizedNotifications?.need_approval_timeoff_total || 0) : undefined}
                      icon={<CalendarIcon className="h-5 w-5 stroke-primary-600" />}
                      tone="orange"
                    />
                    <DashboardMetricCard
                      href="/dashboard/user/need-approval?tab=program-budget"
                      label="Project Budget"
                      value={notificationReady ? Number(personalizedNotifications?.need_approval_program_budget_total || 0) : undefined}
                      icon={<LayersThree02Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="blue"
                    />
                    <DashboardMetricCard
                      href="/dashboard/user/need-approval?tab=procurement-request"
                      label="Requisition Form"
                      value={notificationReady ? Number(personalizedNotifications?.need_approval_rf_total || 0) : undefined}
                      icon={<File04Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="green"
                    />
                    <DashboardMetricCard
                      href="/dashboard/user/need-approval?tab=payment-request"
                      label="Payment Request"
                      value={notificationReady ? Number(personalizedNotifications?.need_approval_pr_total || 0) : undefined}
                      icon={<BankNote01Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="purple"
                    />
                  </div>
              </div>

              {/* Needs Action */}
              <div className="sim-modern-panel rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="sim-modern-panel-header flex flex-wrap items-center justify-between gap-3 border-b border-b-gray-200 px-6 py-5">
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">Need Action</p>
                    <Badge size="sm" color="primary" icon="none">
                      {notificationReady ? needActionTotal + ' items' : notificationsUnavailable ? 'Unavailable' : 'Loading...'}
                    </Badge>
                  </div>
                  <Link href="/dashboard/user/need-action?tab=requisition-form">
                    <Button btnType="div" size="md" variant="secondary-gray" btnFormat="square">
                      <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
                    </Button>
                  </Link>
                </div>
                {notificationReady && needActionTotal === 0 ? (
                  <div className="sim-modern-empty">
                    <span className="sim-modern-empty-icon"><CheckVerified01Icon className="h-7 w-7 stroke-gray-400" /></span>
                    <strong>No items need action right now</strong>
                    <p>You're all caught up! New items will appear here when action is needed.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    <DashboardMetricCard
                      href="/dashboard/user/need-action?tab=requisition-form"
                      label="Requisition Form"
                      value={notificationReady ? Number(personalizedNotifications?.need_action_rf_total || 0) : undefined}
                      icon={<File04Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="green"
                    />
                    <DashboardMetricCard
                      href="/dashboard/user/need-action?tab=payment-request-check"
                      label="Payment Request (Check)"
                      value={notificationReady ? Number(personalizedNotifications?.need_action_pr_check_total || 0) : undefined}
                      icon={<CheckVerified01Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="orange"
                    />
                    <DashboardMetricCard
                      href="/dashboard/user/need-action?tab=payment-request-pay"
                      label="Payment Request (Pay)"
                      value={notificationReady ? Number(personalizedNotifications?.need_action_pr_pay_total || 0) : undefined}
                      icon={<BankNote01Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="purple"
                    />
                  </div>
                )}
              </div>

              {/* Request Tracking */}
              <div className="sim-modern-panel rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="sim-modern-panel-header flex flex-wrap items-center justify-between gap-3 border-b border-b-gray-200 px-6 py-5">
                  <div className="inline-flex items-center gap-2">
                    <p className="text-lg font-semibold text-gray-900">Request Tracking</p>
                    <Badge size="sm" color="primary" icon="none">
                      {notificationReady
                        ? (Number(personalizedNotifications?.tracking_rf_total || 0) +
                           Number(personalizedNotifications?.tracking_pr_total || 0)) + ' items'
                        : notificationsUnavailable ? 'Unavailable' : 'Loading...'}
                    </Badge>
                  </div>
                  <Link href="/dashboard/user/request-tracking">
                    <Button btnType="div" size="md" variant="secondary-gray" btnFormat="square">
                      <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    <DashboardMetricCard
                      href="/dashboard/user/request-tracking?tab=requisition-form"
                      label="Requisition Form"
                      value={notificationReady ? Number(personalizedNotifications?.tracking_rf_total || 0) : undefined}
                      icon={<File04Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="green"
                    />
                    <DashboardMetricCard
                      href="/dashboard/user/request-tracking?tab=payment-request"
                      label="Payment Request"
                      value={notificationReady ? Number(personalizedNotifications?.tracking_pr_total || 0) : undefined}
                      icon={<BankNote01Icon className="h-5 w-5 stroke-primary-600" />}
                      tone="blue"
                    />
                  </div>
              </div>

              {/* Employee Timeoff */}
              <div className="sim-modern-panel rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="sim-modern-panel-header flex flex-wrap items-center justify-between gap-3 border-b border-b-gray-200 px-6 py-5">
                  <p className="text-lg font-semibold text-gray-900">Employee Time Off</p>
                  <div className="inline-flex items-center gap-6">
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
                    <Link href="/dashboard/internal/timeoff/all?tab=calendar-view">
                      <Button btnType="div" size="md" variant="secondary-gray" btnFormat="square">
                        <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-6">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="text-base font-semibold text-gray-900">Date Filter</p>
                    <DaterangePickerCalendar
                      size="md"
                      dateRange={filtrationDate}
                      handleDateRangePicker={(value) => handleDateRangePicker(value)}
                    />
                  </div>
                  {employeeTimeoffData?.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50">
                      No time off employee
                    </div>
                  ) : null}

                  {employeeTimeoffData?.map((timeoff, index) => (
                    <div
                      key={index}
                      className="flex items-center rounded-xl border border-r-gray-200 bg-white px-6 py-4"
                    >
                      <AvatarLabelGroup
                        size="md"
                        image={timeoff.employee.pass_photo_path?.[0]}
                        text={timeoff.employee.full_name}
                        supportingText={timeoff.employee.contract.position}
                        statusIcon={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sim-modern-activity">
              <LogActivity globalLog={log} />
            </div>
          </div>
        </div>
      </Dashboard>
    </>
  )
}

export default DashboardIndex

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  // Related to logs and requesting S3 url
  const metadataApi = new MetadataApi(createAPIConfig(auth_token as string))
  const fileApi = new FilesApi(createAPIConfig(auth_token as string))

  const logsRes = await metadataApi.metadataControllerGetLatestLogs()
  const logs = logsRes?.data?.data

  const renderedIds = new Set()

  const uniqueLogs = logs.filter((log) => {
    if (renderedIds.has(log.user.id)) {
      return false
    }
    renderedIds.add(log.user.id)
    return true
  })

  const dispatchers = []
  for (const uniqueLog of uniqueLogs) {
    const [bucketName, fileName] = uniqueLog.user.employee_pass_photo?.split('/')
    const expiry = 3600 * 24

    const dispatcher = new Promise(async (resolve) => {
      const presignUrlRes = await fileApi.fileControllerGetPresignUrlForDownload(
        fileName,
        bucketName as any,
        expiry as number,
      )

      const presignUrl = presignUrlRes?.data.data

      uniqueLog.user['avatar_url'] = presignUrl

      resolve(uniqueLog)
    })

    dispatchers.push(dispatcher)
  }

  const logModified = await Promise.all(dispatchers)

  const logResult = logs.map((log) => {
    return {
      ...log,
      user: {
        ...log.user,
        avatar_url: logModified.find((logUnique) => logUnique.user.id === log.user.id)?.user.avatar_url,
      },
    }
  })

  return {
    props: {
      activeSidebar: 'Home',
      log: logResult,
    },
  }
}
