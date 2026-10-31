import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { TableCore } from '@/components/TableCore'
import { handleFinanceStatusBadgeColor, handleFinanceStatusBadgeText } from '@/layout/program/PaymentRequestList'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { PRTypesReadableText } from '@/shared/pr.type'
import { CurrencyUnion } from '@/types/global'
import { PaymentRequestListType } from '@/types/payment-request'
import { getPersonalizedNotification } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import { formatCurrency } from '@/utils/globalHelper'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { RequisitionFormSimple } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

const Badge: any = dynamic(() => import('@/components/Badge').then((mod) => mod.Badge))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const Loader: any = dynamic(() => import('@/components/Loader').then((mod) => mod.Loader))
const ChevronRightIcon: any = dynamic(() =>
  import('@/components/icon/ChevronRightIcon').then((mod) => mod.ChevronRightIcon),
)
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

const rfColumnHelper = createColumnHelper<RequisitionFormSimple>()
const paymentColumnHelper = createColumnHelper<PaymentRequestListType>()

const NotifiedActionByList = () => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  const [requisitions, setRequisitions] = useState<RequisitionFormSimple[]>([])
  const [paymentList, setPaymentList] = useState<PaymentRequestListType[]>([])

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'requisition-form': { index: 0, slug: 'requisition-form' },
    'payment-request': { index: 1, slug: 'payment-request' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'requisition-form') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([_, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'requisition-form'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const {
    data: personalizedNotifications,
    trigger: personalizedNotificationsTrigger,
    isMutating: personalizedNotificationsIsMutating,
  } = useSWRMutation('personalizedNotifications', getPersonalizedNotification)

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

  const columnsRequisitionTable = useMemo<ColumnDef<RequisitionFormSimple, any>[]>(
    () => [
      rfColumnHelper.accessor((row) => row['rf_type'], {
        id: 'rf_type',
        header: 'RF Type',
        filterFn: 'equalsString',
        size: 210,
      }),
      rfColumnHelper.accessor((row) => row.partner_name, {
        id: 'partner_name',
        header: 'Partner',
        size: 184,
      }),
      rfColumnHelper.accessor((row) => row.rf_number, {
        id: 'rf_number',
        header: 'Request Number',
        size: 210,
        cell: (info) => <p className="break-all font-medium uppercase text-gray-900">{info.getValue()}</p>,
      }),
      rfColumnHelper.accessor((row) => row.program_name, {
        id: 'program_name',
        header: 'Project Name',
        size: 210,
        cell: (info) => <p className="line-clamp-2">{info.getValue()}</p>,
      }),
      rfColumnHelper.accessor((row) => row.about_request, {
        id: 'about_request',
        header: 'Activity Name',
        size: 210,
        cell: (info) => <p className="line-clamp-2">{info.getValue()}</p>,
      }),
      rfColumnHelper.accessor((row) => row.total_request, {
        id: 'total_request',
        header: 'Total Request',
        size: 220,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_request.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_request.split('_')[0] === 'USD' && '$'}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_request.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_request.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      rfColumnHelper.accessor((row) => row.program_manager_approval_status, {
        id: 'program_manager_approval_status',
        header: 'Project Manager Status',
        size: 210,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Badge
              className="capitalize"
              size="sm"
              color={
                {
                  approved: 'success',
                  pending: 'warning',
                  rejected: 'error',
                  revision: 'error',
                }[info.getValue()] || 'blue'
              }
              icon="circle"
            >
              {{
                approved: 'Approved',
                pending: 'Pending Approval',
                rejected: 'Rejected',
                revision: 'Rejected',
              }[info.getValue()] || 'No Status'}
            </Badge>
          </div>
        ),
      }),
      rfColumnHelper.accessor((row) => row.id, {
        id: 'id',
        header: '',
        size: 72,
        enableSorting: false,
        cell: (info) => (
          <div className="flex justify-end">
            <Button
              id={info.getValue()}
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              btnFormat="square"
              onClick={() => {
                router.push(
                  `/dashboard/procurement/${info.row.original.program_id}/detail/${
                    info.row.original.project_id
                  }/${info.getValue()}`,
                )
              }}
            >
              <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const columnsPaymentTable = useMemo<ColumnDef<PaymentRequestListType, any>[]>(
    () => [
      paymentColumnHelper.accessor((row) => row.pr_year, {
        id: 'pr_year',
        header: 'Year',
        filterFn: 'weakEquals',
        size: 210,
      }),
      paymentColumnHelper.accessor((row) => row.program_name, {
        id: 'program_name',
        header: 'Project Name',
        size: 210,
        cell: (info) => <p className="line-clamp-2 font-medium text-gray-900">{info.getValue()}</p>,
      }),
      paymentColumnHelper.accessor((row) => row.pr_type, {
        id: 'pr_type',
        header: 'Type of Payment',
        filterFn: 'equalsString',
        size: 210,
      }),
      paymentColumnHelper.accessor((row) => row.description, {
        id: 'description',
        header: 'Activity Name',
        size: 240,
        cell: (info) => <p className="line-clamp-2 text-gray-600">{info.getValue() || '-'}</p>,
      }),
      paymentColumnHelper.accessor((row) => row.transfer_amount, {
        id: 'transfer_amount',
        header: 'Transfer Amount',
        size: 210,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.transfer_amount.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.transfer_amount.split('_')[0] === 'USD' && '$'}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.transfer_amount.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.transfer_amount.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      paymentColumnHelper.accessor((row) => row.program_manager_approval, {
        id: 'program_manager_approval',
        header: 'Project Manager Status',
        size: 210,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Badge
              size="sm"
              color={
                {
                  approved: 'success',
                  pending: 'warning',
                  rejected: 'error',
                  revision: 'error',
                }[info.getValue()]
              }
              icon="circle"
            >
              {
                {
                  pending: 'Pending Approval',
                  approved: 'Approved',
                  rejected: 'Rejected',
                  revision: 'Rejected',
                }[info.getValue()]
              }
            </Badge>
          </div>
        ),
      }),

      paymentColumnHelper.accessor((row) => row.processed_by, {
        id: 'processed_by',
        header: 'Finance Team Status',
        size: 210,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Badge
              size="sm"
              color={handleFinanceStatusBadgeColor(
                info.getValue() === null ? 'pending' : 'approved',
                info.getValue(),
                info.row.original['paid_at'] as unknown as string,
              )}
              icon="circle"
            >
              {handleFinanceStatusBadgeText(
                info.getValue() === null ? 'pending' : 'approved',
                info.getValue(),
                info.row.original['paid_at'] as unknown as string,
              )}
            </Badge>
          </div>
        ),
      }),
      paymentColumnHelper.accessor('id', {
        id: 'id',
        header: '',
        enableSorting: false,
        size: 72,
        cell: (info) => (
          <>
            {info.row.original.pr_number.includes('APS') ? (
              <Button
                id={info.getValue()}
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                btnFormat="square"
                onClick={() => {
                  router.push(`/dashboard/finance/advance-payment-statement/${info.getValue()}`)
                }}
              >
                <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
              </Button>
            ) : info.row.original.pr_number.includes('APF') ? (
              <Button
                id={info.getValue()}
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                btnFormat="square"
                onClick={() => {
                  router.push(`/dashboard/finance/advance-perdiem-fee/${info.getValue()}`)
                }}
              >
                <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
              </Button>
            ) : info.row.original.pr_number.includes('TE') ? (
              <Button
                id={info.getValue()}
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                btnFormat="square"
                onClick={() => {
                  router.push(`/dashboard/finance/travel-expenses/${info.getValue()}`)
                }}
              >
                <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
              </Button>
            ) : (
              <Button
                id={info.getValue()}
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                btnFormat="square"
                onClick={() => {
                  router.push(`/dashboard/finance/payment-request/${info.getValue()}`)
                }}
              >
                <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
              </Button>
            )}
          </>
        ),
      }),
    ],
    [],
  )

  // Requisition Form
  useEffect(() => {
    if (personalizedNotifications?.tracking_rf) {
      const result = personalizedNotifications?.tracking_rf.map((item) => item.notif_detail).filter(Boolean)
      const manipulation = result.filter(Boolean).map((item) => ({
        ...item,
        rf_type: item['rf_number'].replace(/ /g, '').split('/')[0].split('-')[1],
      }))
      setRequisitions(manipulation as unknown as RequisitionFormSimple[])
    }
  }, [personalizedNotifications?.tracking_rf])

  // Request Payment (Check)
  useEffect(() => {
    if (personalizedNotifications?.tracking_pr) {
      const result = personalizedNotifications?.tracking_pr.map((item) => item.notif_detail).filter(Boolean)

      const manipulation = result.filter(Boolean).map((item) => {
        let prType = ''
        switch (item['pr_number'].replace(/ /g, '').split('/')[0]) {
          case 'PR':
            prType = PRTypesReadableText.PR
            break
          case 'APR':
            prType = PRTypesReadableText.APR
            break
          case 'APS':
            prType = PRTypesReadableText.APS
            break
          case 'TE':
            prType = PRTypesReadableText.TE
            break
          case 'APF':
            prType = PRTypesReadableText.APF
            break
          default:
            prType = PRTypesReadableText.PR
            break
        }
        return {
          ...item,
          pr_type: prType,
          pr_year: item['pr_number'].replace(/ /g, '').split('/')[2],
        }
      })

      setPaymentList(manipulation as unknown as PaymentRequestListType[])
    }
  }, [personalizedNotifications?.tracking_pr])

  useEffect(() => {
    personalizedNotificationsTrigger()
  }, [])

  if (personalizedNotificationsIsMutating) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader customText="Loading need tracking notification, please wait..." />
      </div>
    )
  }

  if (!userLoggedinInformation) {
    return <></>
  }

  return (
    <>
      <NextSeo title="Request Tracking" canonical={`${MAIN_URL_FE}dashboard/user/request-tracking`} />
      <Dashboard breadcrumbLists={[{ title: 'Request Tracking', url: '' }]}>
        <div className="sim-ui-v3 sim-ui-v3--workflow">
          <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-gray-900">Request Tracking</h1>
              <p className="text-sm font-medium text-gray-400">All things that tracking your request.</p>
            </div>
          </div>

          <HorizontalTabs
            tabLists={['Requisition Form', 'Payment Request']}
            numberIndicator={[
              personalizedNotifications?.tracking_rf_total || 0,
              personalizedNotifications?.tracking_pr_total || 0,
            ]}
            type="underline"
            size="sm"
            handleIndex={handleIndexTabs}
            index={index}
            gapLayout={true}
          >
            <div>
              <TableCore
                supportTableType="normal"
                data={requisitions}
                columns={columnsRequisitionTable}
                useSearchBar={true}
                hiddenColumns={['partner_name', 'rf_type']}
                buttons={[
                  {
                    id: 'program_name',
                    column: 'program_name',
                    label: 'Project',
                  },
                  {
                    id: 'partner_name',
                    column: 'partner_name',
                    label: 'Partner',
                  },
                  {
                    id: 'rf_type',
                    column: 'rf_type',
                    label: 'RF Type',
                  },
                ]}
              />
            </div>
            <div>
              <TableCore
                supportTableType="normal"
                data={paymentList}
                columns={columnsPaymentTable}
                useSearchBar={true}
                hiddenColumns={['pr_year']}
                buttons={[
                  {
                    id: 'program_name',
                    column: 'program_name',
                    label: 'Project',
                  },
                  {
                    id: 'pr_type',
                    column: 'pr_type',
                    label: 'Type',
                  },
                  {
                    id: 'pr_year',
                    column: 'pr_year',
                    label: 'Year',
                  },
                ]}
              />
            </div>
          </HorizontalTabs>
        </div>
      </Dashboard>
    </>
  )
}

export default NotifiedActionByList

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
      // draftEmployeeList: draftEmployee.data.data,
      jwtInformation: authTokenJWT,
      activeSidebar: 'Request Tracking',
    },
  }
}
