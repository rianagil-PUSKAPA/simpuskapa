import { MAIN_URL_FE } from '@/utils/constant'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'

const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const PlusIcon: any = dynamic(() => import('@/components/icon/PlusIcon').then((mod) => mod.PlusIcon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const ConsultantTable: any = dynamic(() =>
  import('@/layout/external/ConsultantTable').then((mod) => mod.ConsultantTable),
)
const EventTable: any = dynamic(() => import('@/layout/external/EventTable').then((mod) => mod.EventTable))
const GoodsTable: any = dynamic(() => import('@/layout/external/GoodsTable').then((mod) => mod.GoodsTable))
const MiscellaneousTable: any = dynamic(() =>
  import('@/layout/external/MiscellaneousTable').then((mod) => mod.MiscellaneousTable),
)
const ServicesTable: any = dynamic(() => import('@/layout/external/ServicesTable').then((mod) => mod.ServicesTable))
const SubscriptionTable: any = dynamic(() =>
  import('@/layout/external/SubscriptionTable').then((mod) => mod.SubscriptionTable),
)
const TravelTable: any = dynamic(() => import('@/layout/external/TravelTable').then((mod) => mod.TravelTable))

const VendorListAdministration = () => {
  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    goods: { index: 0, slug: 'goods' },
    services: { index: 1, slug: 'services' },
    subscription: { index: 2, slug: 'subscription' },
    travel: { index: 3, slug: 'travel' },
    event: { index: 4, slug: 'event' },
    misc: { index: 5, slug: 'misc' },
    consultant: { index: 6, slug: 'consultant' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'goods') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'goods'
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

  return (
    <>
      <NextSeo title="Vendor Administration" canonical={`${MAIN_URL_FE}dashboard/external/vendor-adm`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'External', url: '' },
          { title: 'List of Vendor', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--vendor">
        <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">Vendor Administration</h1>
          </div>
          {/* <RoleFilterProvider features="Add new employee data">
          </RoleFilterProvider> */}
          <div className="flex shrink-0 items-center gap-4">
            <Link href={`${router.pathname}/add`} passHref>
              <Button type="button" btnType="normal" size="md" variant="primary">
                Add New Vendor
                <PlusIcon className="h-5 w-5 stroke-white" />
              </Button>
            </Link>
          </div>
        </div>

        <HorizontalTabs
          tabLists={['Goods', 'Services', 'Subscription', 'Travel', 'Event', 'Misc', 'Consultant']}
          type="underline"
          size="sm"
          handleIndex={handleIndexTabs}
          index={index}
          gapLayout={true}
        >
          <div>
            <GoodsTable />
          </div>
          <div>
            <ServicesTable />
          </div>
          <div>
            <SubscriptionTable />
          </div>
          <div>
            <TravelTable />
          </div>
          <div>
            <EventTable />
          </div>
          <div>
            <MiscellaneousTable />
          </div>
          <div>
            <ConsultantTable />
          </div>
        </HorizontalTabs>
      </div>
      </Dashboard>
    </>
  )
}

export default VendorListAdministration

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      activeSidebar: 'Vendor Adm',
    },
  }
}
