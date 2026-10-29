import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { getMetadataFinanceDashboard } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import { checkIsItemExist, formatCurrency } from '@/utils/globalHelper'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import useSWRMutation from 'swr/mutation'

dayjs.extend(relativeTime)

const Loader: any = dynamic(() => import('@/components/Loader').then((mod) => mod.Loader))
const YearPickerCalendar: any = dynamic(() =>
  import('@/components/YearPickerCalendar').then((mod) => mod.YearPickerCalendar),
)
const LinkExternal02Icon: any = dynamic(() =>
  import('@/components/icon/LinkExternal02Icon').then((mod) => mod.LinkExternal02Icon),
)
const Repeat03Icon: any = dynamic(() => import('@/components/icon/Repeat03Icon').then((mod) => mod.Repeat03Icon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const Popover: any = dynamic(() => import('@/components/ui/popover').then((mod) => mod.Popover))
const PopoverContent: any = dynamic(() => import('@/components/ui/popover').then((mod) => mod.PopoverContent))
const PopoverTrigger: any = dynamic(() => import('@/components/ui/popover').then((mod) => mod.PopoverTrigger))

const Reporting = () => {
  const { userLoggedinInformation } = useDashboardContext()

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const breadcrumbUrl = useMemo(() => {
    const allowedRoles = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM, RoleDefinition.SUPERADMIN]
    return allowedRoles.includes(userLoggedinInformation?.role) ? '' : ''
  }, [userLoggedinInformation])

  const {
    data: reporting,
    trigger: reportingTrigger,
    isMutating,
  } = useSWRMutation([selectedDate ? dayjs(selectedDate).format('YYYY') : ''], ([year]) =>
    getMetadataFinanceDashboard(year),
  )

  useEffect(() => {
    reportingTrigger()
  }, [selectedDate])

  if (!userLoggedinInformation) {
    return <></>
  }

  if (isMutating) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader customText="Please wait, loading report..." />
      </div>
    )
  }

  return (
    <>
      <NextSeo title="Reporting" canonical={`${MAIN_URL_FE}dashboard/finance/reporting`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Finance', url: breadcrumbUrl },
          { title: 'Reporting', url: '' },
        ]}
      >
        <div className="p-7 xl:p-10">
          <div className="rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-b-gray-200 px-6 py-5">
              <div className="inline-flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">Finance Recapitulation Report</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-6 p-6">
              <div className="rounded-xl border border-gray-200">
                <div className="p-6">
                  <p className="mb-2 text-sm font-medium text-gray-600">Year</p>
                  <p className="text-4xl font-semibold text-gray-900">{dayjs(selectedDate).format('YYYY')}</p>
                </div>
                <div className="flex justify-end border-t border-t-gray-200 px-6 py-4">
                  <Popover>
                    <PopoverTrigger className="!ring-0">
                      <div className="inline-flex items-center gap-2">
                        <p className="font-semibold text-primary-700">Change Year</p>
                        <Repeat03Icon className="h-5 w-5 stroke-primary-700" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-60 pt-3">
                      <YearPickerCalendar
                        selected={selectedDate}
                        onChange={(date: Date) => {
                          setSelectedDate(date)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200">
                <div className="p-6">
                  <p className="mb-2 text-sm font-medium text-gray-600">Total Ongoing Project</p>
                  {reporting ? (
                    <p className="text-4xl font-semibold text-gray-900">{reporting?.total_ongoing}</p>
                  ) : (
                    <div className="animate-pulse">
                      <div className="h-10 w-40 grow rounded-sm bg-gray-300/70"></div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end border-t border-t-gray-200 px-6 py-4">
                  <Link href="/dashboard/project" className="inline-flex items-center gap-2">
                    <p className="font-semibold text-primary-700">Project List</p>
                    <LinkExternal02Icon className="h-5 w-5 stroke-primary-700" />
                  </Link>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200">
                <div className="p-6">
                  <p className="mb-2 text-sm font-medium text-gray-600">Total Payment Request</p>
                  {reporting ? (
                    <p className="text-4xl font-semibold text-gray-900">{reporting?.total_payment_request}</p>
                  ) : (
                    <div className="animate-pulse">
                      <div className="h-10 w-40 grow rounded-sm bg-gray-300/70"></div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end border-t border-t-gray-200 px-6 py-4">
                  <Link href="/dashboard/finance/payment-request" className="inline-flex items-center gap-2">
                    <p className="font-semibold text-primary-700">Payment Request</p>
                    <LinkExternal02Icon className="h-5 w-5 stroke-primary-700" />
                  </Link>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200">
                <div className="p-6">
                  <p className="mb-2 text-sm font-medium text-gray-600">Pending Payment Request</p>
                  {reporting ? (
                    <p className="text-4xl font-semibold text-gray-900">{reporting?.pending_payment_request}</p>
                  ) : (
                    <div className="animate-pulse">
                      <div className="h-10 w-40 grow rounded-sm bg-gray-300/70"></div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end border-t border-t-gray-200 px-6 py-4">
                  <Link
                    href="/dashboard/finance/payment-request?tab=pending"
                    className="inline-flex items-center gap-2"
                  >
                    <p className="font-semibold text-primary-700">Payment Request</p>
                    <LinkExternal02Icon className="h-5 w-5 stroke-primary-700" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 p-6 pt-0">
              <div className="rounded-xl border border-gray-200 p-6">
                <p className="mb-2 text-sm font-medium text-gray-600">Total Budget Allocation</p>
                {reporting ? (
                  <p className="text-4xl font-semibold text-gray-900">
                    {formatCurrency('IDR', reporting?.total_budget_allocation_amount)}
                  </p>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-10 w-72 grow rounded-sm bg-gray-300/70"></div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-6">
                <p className="mb-2 text-sm font-medium text-gray-600">Total Remaining Budget</p>
                {reporting ? (
                  <p className="text-4xl font-semibold text-gray-900">
                    {formatCurrency('IDR', reporting?.total_remaining_budget_amount)}
                  </p>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-10 w-72 grow rounded-sm bg-gray-300/70"></div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-6">
                <p className="mb-2 text-sm font-medium text-gray-600">Total Paid Payment</p>
                {reporting ? (
                  <p className="text-4xl font-semibold text-gray-900">
                    {formatCurrency('IDR', reporting?.total_paid_payment_amount)}
                  </p>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-10 w-72 grow rounded-sm bg-gray-300/70"></div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-6">
                <p className="mb-2 text-sm font-medium text-gray-600">Total Pending Requested (RF + PR)</p>
                {reporting ? (
                  <p className="text-4xl font-semibold text-gray-900">
                    {formatCurrency('IDR', reporting?.total_pending_requested_amount)}
                  </p>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-10 w-72 grow rounded-sm bg-gray-300/70"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Dashboard>
    </>
  )
}

export default Reporting

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const authTokenJWT = safeDecodeJwt(auth_token)
  if (!authTokenJWT) {
    return { redirect: { destination: '/refresh', permanent: false } }
  }
  if (
    !checkIsItemExist(authTokenJWT['payload']['role'], [
      RoleDefinition.HEAD_OF_FINANCE,
      RoleDefinition.FINANCE_TEAM,
      RoleDefinition.SUPERADMIN,
    ])
  ) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      activeSidebar: 'Reporting',
    },
  }
}
