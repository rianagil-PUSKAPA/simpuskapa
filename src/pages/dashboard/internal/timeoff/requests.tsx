import { resolveAuthToken } from '@/utils/ssrAuth'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { theme } from '@/types/themes'
import { MAIN_URL_FE } from '@/utils/constant'
import { checkIsItemExist } from '@/utils/globalHelper'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const Modal: any = dynamic(() => import('@/components/Modal').then((mod) => mod.Modal))
const AlertTriangleIcon: any = dynamic(() =>
  import('@/components/icon/AlertTriangleIcon').then((mod) => mod.AlertTriangleIcon),
)
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const TimeoffRequest: any = dynamic(() =>
  import('@/layout/timeoff-list/TimeoffRequest').then((mod) => mod.TimeoffRequest),
)

const TimeoffRequests = () => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'pending-request': { index: 0, slug: 'pending-request' },
    accepted: { index: 1, slug: 'accepted' },
    'cancelled-declined': { index: 2, slug: 'cancelled-declined' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'pending-request') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'pending-request'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

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

  if (!checkIsItemExist(userLoggedinInformation?.role, [RoleDefinition.SUPERVISOR, RoleDefinition.SUPERADMIN])) {
    return (
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle={`Can't approve timeoff request`}
        modalDescription=""
        stateModal={true}
        modalSizeStyles="max-w-[25rem]"
        handleCloseModal={() => {
          return
        }}
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>The responsible of this timeoff approval are supervisors</li>
            <li>You're not the one of supervisors</li>
          </ul>
        </div>
      </Modal>
    )
  }

  return (
    <>
      <NextSeo title="Time Off Request" canonical={`${MAIN_URL_FE}dashboard/internal/timeoff/requests`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          { title: 'Time Off Request', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--timeoff">
        <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">Time Off Request</h1>
            <p className="text-base font-normal text-gray-600">
              See pending request, accepted request, cancelled request or declined request
            </p>
          </div>
        </div>
        <HorizontalTabs
          tabLists={['Pending Request', 'Accepted', 'Cancelled / Declined']}
          type="underline"
          size="sm"
          handleIndex={handleIndexTabs}
          index={index}
          gapLayout={true}
        >
          <div>
            <TimeoffRequest status="requested" />
          </div>
          <div>
            <TimeoffRequest status="approved" />
          </div>
          <div>
            <TimeoffRequest status="cancelled|declined" />
          </div>
        </HorizontalTabs>
      </div>
      </Dashboard>
    </>
  )
}

export default TimeoffRequests

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  return {
    props: {
      activeSidebar: 'Time Off Request',
    },
  }
}
