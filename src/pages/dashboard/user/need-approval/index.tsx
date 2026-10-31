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
import { ProgramListData, RequisitionFormSimple } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const Badge: any = dynamic(() => import('@/components/Badge').then((mod) => mod.Badge))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const Loader: any = dynamic(() => import('@/components/Loader').then((mod) => mod.Loader))
const ChevronRightIcon: any = dynamic(() =>
  import('@/components/icon/ChevronRightIcon').then((mod) => mod.ChevronRightIcon),
)
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const TimeoffRequest: any = dynamic(() =>
  import('@/layout/timeoff-list/TimeoffRequest').then((mod) => mod.TimeoffRequest),
)

const programColumnHelper = createColumnHelper<ProgramListData>()
const rfColumnHelper = createColumnHelper<RequisitionFormSimple>()
const paymentColumnHelper = createColumnHelper<PaymentRequestListType>()

const NeedApprovalList = () => {
  const { isInternal, handleInternal, userLoggedinInformation } = useDashboardContext()

  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'timeoff-request': { index: 0, slug: 'timeoff-request' },
    'program-budget': { index: 1, slug: 'program-budget' },
    'procurement-request': { index: 2, slug: 'procurement-request' },
    'payment-request': { index: 3, slug: 'payment-request' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'timeoff-request') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([_, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'timeoff-request'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const [programBudgets, setProgramBudgets] = useState<ProgramListData[]>([])
  const [requisitions, setRequisitions] = useState<RequisitionFormSimple[]>([])
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequestListType[]>([])

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

  const columnsProgramTable = useMemo<ColumnDef<ProgramListData, any>[]>(
    () => [
      programColumnHelper.accessor((row) => row.program_name, {
        id: 'program_name',
        header: 'Project Name',
        size: 210,
        cell: (info) => <p className="line-clamp-2 font-medium text-gray-900">{info.getValue()}</p>,
      }),
      !isInternal
        ? programColumnHelper.accessor((row) => row.partner_name, {
            id: 'partner_name',
            header: 'Partner',
            size: 184,
          })
        : programColumnHelper.accessor((row) => row.partner_name, {
            id: 'partner_name_hidden',
          }),
      programColumnHelper.accessor((row) => row.revision_path, {
        id: 'revision_path',
        header: 'Submission Type',
        size: 184,
        cell: (info) => (
          <p>
            {(info.row.original as any).isBudgetRevisionApproval
              ? 'Request Project Revision'
              : (info.getValue() || []).length > 0
              ? 'Revision'
              : info.row.original.approval === 'revision'
              ? 'Request To Revise'
              : 'First Time Submit'}
          </p>
        ),
      }),
      programColumnHelper.accessor((row) => row.created_by.name, {
        id: 'created_by',
        header: 'Requested By',
        size: 220,
        cell: (info) => (
          <AvatarLabelGroup
            size={'sm'}
            image={
              info.row.original.created_by?.employee_pass_photo || info.row.original.created_by?.employee_pass_photo
            }
            text={info.row.original.created_by?.name}
            statusIcon={false}
          />
        ),
      }),
      programColumnHelper.accessor((row) => row.program_manager.full_name, {
        id: 'program_manager',
        header: !isInternal ? 'Project Manager' : 'Supervisor',
        size: 210,
        cell: (info) => (
          <AvatarLabelGroup
            size={'sm'}
            image={
              info.row.original.program_manager?.pass_photo_path?.[0] || info.row.original.program_manager?.avatar[0]
            }
            text={info.row.original.program_manager?.full_name}
            statusIcon={false}
          />
        ),
      }),
      programColumnHelper.accessor((row) => row.total_budget, {
        id: 'total_budget',
        header: 'Total Budget',
        size: 170,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_budget.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_budget.split('_')[0] !== 'IDR' && info.row.original.total_budget.split('_')[0]}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_budget.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_budget.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      programColumnHelper.accessor((row) => row.id, {
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
                router.push(`/dashboard/project/${info.getValue()}?tab=budget-needs`)
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
      rfColumnHelper.accessor((row) => row.requested_by.name, {
        id: 'requested_by',
        header: 'Requested By',
        size: 220,
        cell: (info) => (
          <AvatarLabelGroup
            size={'sm'}
            image={
              info.row.original.requested_by?.pass_photo?.[0] ||
              info.row.original.requested_by?.['employee_pass_photo']?.[0]
            }
            text={info.row.original.requested_by?.name}
            statusIcon={false}
          />
        ),
      }),
      rfColumnHelper.accessor((row) => row.program_manager_approval_status, {
        id: 'program_manager_approval_status',
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
                handleInternal(isInternal)
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
    [isInternal, handleInternal],
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
      paymentColumnHelper.accessor((row) => row.requested_by.name, {
        id: 'created_by',
        header: 'Requested By',
        size: 220,
        cell: (info) => (
          <AvatarLabelGroup
            size={'sm'}
            image={info.row.original.requested_by?.employee_pass_photo[0]}
            text={info.row.original.requested_by?.name}
            statusIcon={false}
          />
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
          <div className="flex justify-end">
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
          </div>
        ),
      }),
    ],
    [],
  )

  useEffect(() => {
    personalizedNotificationsTrigger()
  }, [])

  // Project Budget
  useEffect(() => {
    if (personalizedNotifications?.need_approval_program_budget) {
      const result = personalizedNotifications?.need_approval_program_budget
        .map((item) =>
          item.notif_detail
            ? { ...item.notif_detail, isBudgetRevisionApproval: item.ref_type === 'APPROVAL_PROGRAM_BUDGET_REVISION' }
            : null,
        )
        .filter(Boolean)
      setProgramBudgets(result as unknown as ProgramListData[])
    }
  }, [personalizedNotifications?.need_approval_program_budget])

  // Requisition Form
  useEffect(() => {
    if (personalizedNotifications?.need_approval_rf) {
      const result = personalizedNotifications?.need_approval_rf.map((item) => item.notif_detail).filter(Boolean)
      const manipulation = result.map((item) => ({
        ...item,
        rf_type: item['rf_number'].replace(/ /g, '').split('/')[0].split('-')[1],
      }))
      setRequisitions(manipulation as unknown as RequisitionFormSimple[])
    }
  }, [personalizedNotifications?.need_approval_rf])

  // Request Payment
  useEffect(() => {
    if (personalizedNotifications?.need_approval_pr) {
      const result = personalizedNotifications?.need_approval_pr.map((item) => item.notif_detail).filter(Boolean)

      const manipulation = result.map((item) => {
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

      setPaymentRequest(manipulation as unknown as PaymentRequestListType[])
    }
  }, [personalizedNotifications?.need_approval_pr])

  if (personalizedNotificationsIsMutating) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader customText="Loading need approval notification, please wait..." />
      </div>
    )
  }

  if (!userLoggedinInformation && !personalizedNotifications) {
    return <></>
  }

  return (
    <>
      <NextSeo title="Need Approval" canonical={`${MAIN_URL_FE}dashboard/user/need-approval`} />
      <Dashboard breadcrumbLists={[{ title: 'Need Approval', url: '' }]}>
        <div className="sim-ui-v3 sim-ui-v3--workflow">
        <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">Need Approval</h1>
            <p className="text-sm font-medium text-gray-400">
              All things that need your approval. Please review, check and approve it.
            </p>
          </div>
        </div>

        <HorizontalTabs
          tabLists={[`Time Off Request`, `Project Budget`, `Requisition Form`, `Payment Request`]}
          numberIndicator={[
            personalizedNotifications?.need_approval_timeoff_total || 0,
            personalizedNotifications?.need_approval_program_budget_total || 0,
            personalizedNotifications?.need_approval_rf_total || 0,
            personalizedNotifications?.need_approval_pr_total || 0,
          ]}
          type="underline"
          size="sm"
          handleIndex={handleIndexTabs}
          index={index}
          gapLayout={true}
        >
          {/* Time Off Request */}
          <TimeoffRequest status="requested" />
          {/* Program Budgets */}
          <div>
            <TableCore
              supportTableType="normal"
              data={programBudgets}
              columns={columnsProgramTable}
              useSearchBar={true}
              hiddenColumns={['created_by_hidden', 'partner_name_hidden']}
              buttons={
                !isInternal
                  ? [
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
                    ]
                  : []
              }
            />
          </div>
          {/* Requisition Form */}
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
          {/* Payment Request */}
          <div>
            <TableCore
              supportTableType="normal"
              data={paymentRequest}
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

export default NeedApprovalList

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      activeSidebar: 'Need Approval',
    },
  }
}
