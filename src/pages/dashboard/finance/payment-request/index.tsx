import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { CoinsStacked03Icon } from '@/components/icon/CoinsStacked03Icon'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { paymentRequestApi } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import { checkIsItemExist } from '@/utils/globalHelper'
import { saveExcelPaidPayments } from '@/utils/saveExcelPaidPayments'
import { saveExcelPaymentRequest } from '@/utils/saveExcelPaymentRequest'
import { saveExcelTaxPayments } from '@/utils/saveExcelTaxPayments'
import { PaymentRequestApi, PRListResponse } from '@sdk'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const TableIcon: any = dynamic(() => import('@/components/icon/TableIcon').then((mod) => mod.TableIcon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const FinanceCheckerTable: any = dynamic(() =>
  import('@/layout/payment-request/FinanceCheckerTable').then((mod) => mod.FinanceCheckerTable),
)
const PaidTable: any = dynamic(() => import('@/layout/payment-request/PaidTable').then((mod) => mod.PaidTable))
const PendingTable: any = dynamic(() => import('@/layout/payment-request/PendingTable').then((mod) => mod.PendingTable))
const ReadyToProcessTable: any = dynamic(() =>
  import('@/layout/payment-request/ReadyToProcessTable').then((mod) => mod.ReadyToProcessTable),
)

type Props = {
  readyToProcessPayments: PRListResponse
  readyToCheckPayments: PRListResponse
  pendingPayments: PRListResponse
  paidPayments: PRListResponse
  employeeId: string
}

const PaymentRequestListIndex = ({
  readyToProcessPayments,
  readyToCheckPayments,
  pendingPayments,
  paidPayments,
  employeeId,
}: Props) => {
  const router = useRouter()
  const { userLoggedinInformation } = useDashboardContext()

  const breadcrumbUrl = useMemo(() => {
    const allowedRoles = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM, RoleDefinition.SUPERADMIN]
    return allowedRoles.includes(userLoggedinInformation?.role) ? '/dashboard/finance/payment-request' : ''
  }, [userLoggedinInformation])

  const [isBulkProcessFormEnabled, setIsBulkProcessFormEnabled] = useState(false)

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'ready-to-process': { index: 0, slug: 'ready-to-process' },
    'ready-to-check': { index: 1, slug: 'ready-to-check' },
    pending: { index: 2, slug: 'pending' },
    paid: { index: 3, slug: 'paid' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'ready-to-process') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([_, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'ready-to-process'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    bulkPayment: boolean
    downloadMyResponsibility: boolean
    downloadPaidPayment: boolean
    downloadTaxPayments: boolean
  }>({
    bulkPayment: false,
    downloadMyResponsibility: false,
    downloadPaidPayment: false,
    downloadTaxPayments: false,
  })
  const [selectedRows, setSelectedRows] = useState([])
  const [readyToProcessDateRange, setReadyToProcessDateRange] = useState<Date[]>([null, null])
  const [filteredReadyToProcessPayments, setFilteredReadyToProcessPayments] = useState(readyToProcessPayments.data)
  const [paidDateRange, setPaidDateRange] = useState<Date[]>([null, null])
  const [filteredPaidPayments, setFilteredPaidPayments] = useState(paidPayments.data)

  // Filter payments based on readyToProcessDateRange
  useEffect(() => {
    const [startDate, endDate] = readyToProcessDateRange

    if (!startDate && !endDate) {
      setFilteredReadyToProcessPayments(readyToProcessPayments.data)
      return
    }

    const filtered = readyToProcessPayments.data.filter((payment: any) => {
      if (!payment.expected_payment_date) return true

      const paymentDate = new Date(payment.expected_payment_date)

      if (startDate && endDate) {
        return paymentDate >= startDate && paymentDate <= endDate
      } else if (startDate) {
        return paymentDate >= startDate
      }

      return true
    })

    setFilteredReadyToProcessPayments(filtered)
  }, [readyToProcessPayments.data, readyToProcessDateRange])

  // Filter paid payments based on paidDateRange
  useEffect(() => {
    const [startDate, endDate] = paidDateRange

    if (!startDate && !endDate) {
      setFilteredPaidPayments(paidPayments.data)
      return
    }

    const filtered = paidPayments.data.filter((payment: any) => {
      if (!payment.paid_at) return true

      const paymentDate = new Date(payment.paid_at)

      if (startDate && endDate) {
        return paymentDate >= startDate && paymentDate <= endDate
      } else if (startDate) {
        return paymentDate >= startDate
      }

      return true
    })

    setFilteredPaidPayments(filtered)
  }, [paidPayments.data, paidDateRange])

  const handleRowSelection = (rowId, isSelected) => {
    setSelectedRows((prevSelected) => {
      if (isSelected) {
        return [...prevSelected, rowId] // Add row ID
      } else {
        return prevSelected.filter((id) => id !== rowId) // Remove row ID
      }
    })
  }

  const handleBulkForm = () => {
    setIsBulkProcessFormEnabled((prev) => !prev)
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

  const generateBulkPayment = async () => {
    setLoadingButtonStatement((prev) => ({ ...prev, bulkPayment: true }))

    const payment_requests = selectedRows.map((pr_id) => ({
      employee_id: employeeId,
      pr_id,
    }))

    const paymentBulkResponse = paymentRequestApi.pRControllerSetFinanceReadyToProcessBulk({
      payment_requests,
    })

    toast.promise(paymentBulkResponse, {
      pending: `Generating bulk process...`,
      success: `Bulk process generated successfully`,
      error: 'Failed to generate bulk process',
    })

    paymentBulkResponse.finally(() => {
      router.replace(router.asPath)
      setLoadingButtonStatement((prev) => ({
        ...prev,
        bulkPayment: false,
      }))
      handleBulkForm()
    })
  }

  const downloadTransferList = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      downloadMyResponsibility: true,
    }))

    try {
      // Use filteredReadyToProcessPayments instead of readyToProcessPayments.data
      const myPaymentResponsibiltyIds = filteredReadyToProcessPayments
        .filter((payment) => {
          return payment.processed_by !== null
        })
        .filter((payment) => {
          if (payment.processed_by.id === employeeId) {
            return payment.id
          }
        })

      if (myPaymentResponsibiltyIds.length === 0) {
        toast.error('You have no payment responsibility')
        setLoadingButtonStatement((prev) => ({
          ...prev,
          downloadMyResponsibility: false,
        }))
        return
      }

      // Fetch all payment details in parallel using Promise.all
      const detailPayments = await Promise.all(
        myPaymentResponsibiltyIds.map(async (payment) => {
          const response = await paymentRequestApi.pRControllerGetDetailPaymentRequest(payment.id)
          return response.data
        }),
      )

      // Generate and download Excel file
      await saveExcelPaymentRequest(detailPayments)
      toast.success('Payment list downloaded successfully')
    } catch (error) {
      console.error('Failed to fetch payment details:', error)
      toast.error('Failed to download payment list')
    } finally {
      setLoadingButtonStatement((prev) => ({
        ...prev,
        downloadMyResponsibility: false,
      }))
    }
  }

  const downloadPaidPayments = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      downloadPaidPayment: true,
    }))

    try {
      // Use filteredPaidPayments to get filtered paid payments
      if (filteredPaidPayments.length === 0) {
        toast.error('No paid payments available to download')
        setLoadingButtonStatement((prev) => ({
          ...prev,
          downloadPaidPayment: false,
        }))
        return
      }

      // Fetch all payment details in parallel using Promise.all
      const detailPayments = await Promise.all(
        filteredPaidPayments.map(async (payment) => {
          const response = await paymentRequestApi.pRControllerGetDetailPaymentRequest(payment.id)
          return response.data
        }),
      )

      // Generate and download Excel file
      await saveExcelPaidPayments(detailPayments)
      toast.success('Paid payment list downloaded successfully')
    } catch (error) {
      console.error('Failed to fetch payment details:', error)
      toast.error('Failed to download paid payment list')
    } finally {
      setLoadingButtonStatement((prev) => ({
        ...prev,
        downloadPaidPayment: false,
      }))
    }
  }

  const downloadTaxPayments = async () => {
    setLoadingButtonStatement((prev) => ({
      ...prev,
      downloadTaxPayments: true,
    }))

    try {
      // Use filteredPaidPayments to get filtered paid payments
      if (filteredPaidPayments.length === 0) {
        toast.error('No paid payments available to download')
        setLoadingButtonStatement((prev) => ({
          ...prev,
          downloadTaxPayments: false,
        }))
        return
      }

      // Fetch all payment details in parallel using Promise.all
      const detailPayments = await Promise.all(
        filteredPaidPayments.map(async (payment) => {
          const response = await paymentRequestApi.pRControllerGetDetailPaymentRequest(payment.id)
          return response.data
        }),
      )

      // Generate and download Excel file
      await saveExcelTaxPayments(detailPayments, filteredPaidPayments)
      toast.success('Tax payment list downloaded successfully')
    } catch (error) {
      console.error('Failed to fetch payment details:', error)
      toast.error('Failed to download tax payment list')
    } finally {
      setLoadingButtonStatement((prev) => ({
        ...prev,
        downloadTaxPayments: false,
      }))
    }
  }

  return (
    <>
      <NextSeo title="Payment Request" canonical={`${MAIN_URL_FE}dashboard/finance/payment-request`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Finance', url: breadcrumbUrl },
          { title: 'List of Payment Request', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--finance">
          <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-gray-900">Payment Request</h1>
            </div>

            {index === 0 ? (
              <div className="flex shrink-0 items-center gap-3">
                {isBulkProcessFormEnabled ? (
                  <>
                    <Button
                      type="button"
                      btnType="normal"
                      size="sm"
                      variant="secondary-gray"
                      onClick={() => setIsBulkProcessFormEnabled(!isBulkProcessFormEnabled)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      btnType="normal"
                      size="sm"
                      variant="primary"
                      isLoading={loadingButtonStatement.bulkPayment}
                      onClick={generateBulkPayment}
                    >
                      Generate Bulk Process
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      btnType="normal"
                      size="sm"
                      variant="secondary-gray"
                      onClick={() => setIsBulkProcessFormEnabled(!isBulkProcessFormEnabled)}
                    >
                      Bulk Process
                    </Button>
                    <Button
                      btnType="div"
                      size="sm"
                      variant="secondary-gray"
                      onClick={downloadTransferList}
                      isLoading={loadingButtonStatement.downloadMyResponsibility}
                    >
                      <TableIcon className="h-5 w-5 stroke-gray-700" />
                      Download Payment List
                    </Button>
                  </>
                )}
              </div>
            ) : null}
            {index === 3 ? (
              <div className="flex shrink-0 items-center gap-3">
                <Button
                  btnType="div"
                  size="sm"
                  variant="secondary-gray"
                  onClick={downloadPaidPayments}
                  isLoading={loadingButtonStatement.downloadPaidPayment}
                >
                  <TableIcon className="h-5 w-5 stroke-gray-700" />
                  Download Payment List
                </Button>
                <Button
                  btnType="div"
                  size="sm"
                  variant="secondary-gray"
                  onClick={downloadTaxPayments}
                  isLoading={loadingButtonStatement.downloadTaxPayments}
                >
                  <CoinsStacked03Icon className="h-5 w-5 stroke-gray-700" />
                  Download Tax List
                </Button>
              </div>
            ) : null}
          </div>
          <HorizontalTabs
            tabLists={['Ready to Process', 'Finance Checker', 'Pending', 'Paid']}
            numberIndicator={[
              readyToProcessPayments.data.length || 0,
              readyToCheckPayments.data.length || 0,
              pendingPayments.data.length || 0,
              paidPayments.data.length || 0,
            ]}
            type="underline"
            size="sm"
            handleIndex={handleIndexTabs}
            index={index}
            gapLayout={true}
          >
            <div>
              <ReadyToProcessTable
                paymentList={readyToProcessPayments.data}
                isBulkProcessFormEnabled={isBulkProcessFormEnabled}
                selectedRows={selectedRows}
                onRowSelect={handleRowSelection}
                dateRange={readyToProcessDateRange}
                setDateRange={setReadyToProcessDateRange}
              />
            </div>
            <div>
              <FinanceCheckerTable paymentList={readyToCheckPayments.data} />
            </div>
            <div>
              <PendingTable paymentList={pendingPayments.data} />
            </div>
            <div>
              <PaidTable paymentList={paidPayments.data} dateRange={paidDateRange} setDateRange={setPaidDateRange} />
            </div>
          </HorizontalTabs>
        </div>
      </Dashboard>
    </>
    // <>Payment Request List</>
  )
}

export default PaymentRequestListIndex

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
    Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
    https://github.com/vercel/next.js/issues/36049
    */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const paymentRequestApi = new PaymentRequestApi(createAPIConfig(auth_token as string))

  const authTokenJWT = safeDecodeJwt(auth_token)

  if (!authTokenJWT) {
    return { redirect: { destination: '/refresh', permanent: false } }
  }
  const employeeId = authTokenJWT.payload['employee_id']

  try {
    const [getReadyToProcessPayments, getReadyToCheckPayments, getPendingPayments, getPaidPayments] = await Promise.all(
      [
        paymentRequestApi.pRControllerGetListPaymentRequest(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'ready_to_process',
        ),
        paymentRequestApi.pRControllerGetListPaymentRequest(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'ready_to_check',
        ),
        paymentRequestApi.pRControllerGetListPaymentRequest(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'pending',
        ),
        paymentRequestApi.pRControllerGetListPaymentRequest(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'paid',
        ),
      ],
    )

    const readyToProcessPayments = getReadyToProcessPayments.data
    const readyToCheckPayments = getReadyToCheckPayments.data
    const pendingPayments = getPendingPayments.data
    const paidPayments = getPaidPayments.data

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
        activeSidebar: 'Payment Request',
        readyToProcessPayments,
        readyToCheckPayments,
        pendingPayments,
        paidPayments,
        employeeId,
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
