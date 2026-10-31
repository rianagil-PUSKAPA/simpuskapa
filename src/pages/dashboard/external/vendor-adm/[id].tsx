/* eslint-disable tailwindcss/no-custom-classname */
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { Button } from '@/components/Button'
import { AlertCircleIcon } from '@/components/icon/AlertCircleIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { Modal } from '@/components/Modal'
import { cn } from '@/lib/utils'
import { theme } from '@/types/themes'
import { VendorEnum } from '@/types/vendor'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { vendorExternalApi } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import { checkIsLoggedInRoleAll } from '@/utils/globalHelper'
import { Menu, Transition } from '@headlessui/react'
import { VendorDto, VendorExternalApi } from '@sdk'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { toast } from 'react-toastify'

const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const Briefcase02Icon: any = dynamic(() =>
  import('@/components/icon/Briefcase02Icon').then((mod) => mod.Briefcase02Icon),
)
const ChevronDownIcon: any = dynamic(() =>
  import('@/components/icon/ChevronDownIcon').then((mod) => mod.ChevronDownIcon),
)
const CoinsHandIcon: any = dynamic(() => import('@/components/icon/CoinsHandIcon').then((mod) => mod.CoinsHandIcon))
const Edit03Icon: any = dynamic(() => import('@/components/icon/Edit03Icon').then((mod) => mod.Edit03Icon))
const Globe05Icon: any = dynamic(() => import('@/components/icon/Globe05Icon').then((mod) => mod.Globe05Icon))
const Mail02Icon: any = dynamic(() => import('@/components/icon/Mail02Icon').then((mod) => mod.Mail02Icon))
const PackageCheckIcon: any = dynamic(() =>
  import('@/components/icon/PackageCheckIcon').then((mod) => mod.PackageCheckIcon),
)
const PhoneCall01Icon: any = dynamic(() =>
  import('@/components/icon/PhoneCall01Icon').then((mod) => mod.PhoneCall01Icon),
)
const Repeat03Icon: any = dynamic(() => import('@/components/icon/Repeat03Icon').then((mod) => mod.Repeat03Icon))
const Users03Icon: any = dynamic(() => import('@/components/icon/Users03Icon').then((mod) => mod.Users03Icon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const PaymentRequestList: any = dynamic(() =>
  import('@/layout/program/PaymentRequestList').then((mod) => mod.PaymentRequestList),
)
const VendorInformation: any = dynamic(() =>
  import('@/layout/vendor-detail/Information').then((mod) => mod.VendorInformation),
)

type EmployeeListProps = {
  vendorDetail: VendorDto
}

type ModalStatement = {
  deleteConfirmationModal: boolean
}

const VendorDetailLayout = ({ vendorDetail }: EmployeeListProps) => {
  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    information: { index: 0, slug: 'information' },
    'payment-request': { index: 1, slug: 'payment-request' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'information') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'information'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    deleteConfirmationModal: false,
  })
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    deleteVendor: boolean
  }>({
    deleteVendor: false,
  })

  const openDeleteConfirmationModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      deleteConfirmationModal: true,
    }))
  }

  const closeDeleteConfirmationModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      deleteConfirmationModal: false,
    }))
  }

  const deleteVendor = () => {
    setLoadingButtonStatement((prev) => ({ ...prev, deleteVendor: true }))
    const deteleVendorRes = vendorExternalApi.vendorControllerSoftDeleteVendor(vendorDetail.id)

    toast.promise(deteleVendorRes, {
      pending: 'Deleting payment',
      success: 'Payment deleted successfully',
      error: 'Promise rejected 🤯',
    })

    deteleVendorRes.finally(() => {
      router.replace('/dashboard/external/vendor-adm')

      setTimeout(() => {
        setLoadingButtonStatement((prev) => ({ ...prev, deleteVendor: false }))
      }, 3000)
    })
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

  if (!vendorDetail) {
    return <></>
  }

  return (
    <>
      <NextSeo title="Vendor Detail" canonical={`${MAIN_URL_FE}dashboard/external/vendor-adm/${router.query.id}`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'External', url: 'external' },
          {
            title: 'Vendor Adm',
            url: `/dashboard/external/vendor-adm`,
          },
          {
            title: vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name,
            url: `/dashboard/external/vendor-adm/${vendorDetail?.vendor_type}`,
          },
          {
            title: vendorDetail?.vendor_information['name'],
            url: `/dashboard/external/vendor-adm/${vendorDetail?.vendor_information['name']}`,
          },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--vendor">
        <>
          <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
            <div className="inline-flex items-center gap-3.5 xxs:gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-gray-200 bg-gray-100">
                {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                  VendorEnum.GOODS && <PackageCheckIcon className="h-8 w-8 stroke-gray-600" />}
                {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                  VendorEnum.SUBSCRIPTIONS && <Repeat03Icon className="h-8 w-8 stroke-gray-600" />}
                {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                  VendorEnum.MISC && <Briefcase02Icon className="h-8 w-8 stroke-gray-600" />}
                {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                  VendorEnum.SERVICES && <CoinsHandIcon className="h-8 w-8 stroke-gray-600" />}
                {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                  VendorEnum.TRAVEL && <Globe05Icon className="h-8 w-8 stroke-gray-600" />}
                {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                  VendorEnum.EVENT && <Globe05Icon className="h-8 w-8 stroke-gray-600" />}
                {vendorDetail?.vendor_categories[0]?.vendor_category_info.vendor_type.name.toLowerCase() ===
                  VendorEnum.CONSULTANT && <Users03Icon className="h-8 w-8 stroke-gray-600" />}
              </div>
              <div>
                <h1 className="text-2xl font-semibold capitalize text-gray-900 xxs:mb-1">
                  {vendorDetail?.vendor_information['name']}
                </h1>
                <p className="text-sm font-medium text-gray-400">
                  {vendorDetail?.vendor_categories.map((category) => category.vendor_category_info.name).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 xxs:gap-4">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
                  About Vendor
                  <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="min-w absolute right-0 z-20 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <Menu.Item>
                      <div className="w-full px-6 py-4">
                        <span className="inline-block text-xs font-semibold text-gray-400">Location</span>
                        <p className="text-sm text-gray-600">{vendorDetail?.vendor_information['location']}</p>
                      </div>
                    </Menu.Item>
                    <Menu.Item>
                      <div className="w-full px-6 py-4">
                        <span className="inline-block text-xs font-semibold text-gray-400">Scope of Work</span>
                        <p className="text-sm text-gray-600">{vendorDetail?.vendor_information['description']}</p>
                      </div>
                    </Menu.Item>
                    <Menu.Item>
                      <div className="w-full px-6 py-4">
                        <span className="inline-block text-xs font-semibold text-gray-400">PIC</span>
                        <p className="text-sm text-gray-600">{vendorDetail?.vendor_information['pic']}</p>
                      </div>
                    </Menu.Item>
                    <Menu.Item>
                      <div className="w-full px-6 py-4">
                        <span className="inline-block text-xs font-semibold text-gray-400">Phone Number</span>
                        <p className="text-sm text-gray-600">
                          {vendorDetail?.vendor_information['phone_number']?.replace('_', ' ')}
                        </p>
                      </div>
                    </Menu.Item>
                    <Menu.Item>
                      <div className="w-full px-6 py-4">
                        <span className="inline-block text-xs font-semibold text-gray-400">Email</span>
                        <p className="text-sm text-gray-600">{vendorDetail?.vendor_information['email']}</p>
                      </div>
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>

              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
                  Actions
                  <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-20 mt-2 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    <div className="flex flex-col gap-0.5 px-1.5 py-1">
                      {vendorDetail.vendor_information['phone_number'] ? (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={`https://wa.me/${vendorDetail.vendor_information['phone_number']
                                .split('+')[1]
                                .replace('_', '')}`}
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <PhoneCall01Icon className="h-4 w-4 stroke-gray-700" />
                              Contact via WA
                            </Link>
                          )}
                        </Menu.Item>
                      ) : null}
                      {vendorDetail.vendor_information['email'] ? (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={`mailto:${vendorDetail.vendor_information['email']}`}
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <Mail02Icon className="h-4 w-4 stroke-gray-700" />
                              Contact via EMAIL
                            </Link>
                          )}
                        </Menu.Item>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-0.5 px-1.5 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            className={cn(
                              active ? 'bg-gray-50' : 'text-gray-700',
                              `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                            )}
                            onClick={() => {
                              router.push(`/dashboard/external/vendor-adm/edit/${vendorDetail.id}`)
                            }}
                          >
                            <Edit03Icon className="h-4 w-4 stroke-gray-700" />
                            Edit Vendor
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                    <div className="flex flex-col gap-0.5 px-1.5 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            className={cn(
                              active ? 'bg-gray-50' : 'text-gray-700',
                              `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                            )}
                            onClick={openDeleteConfirmationModal}
                          >
                            <Trash01Icon className="h-4 w-4 stroke-gray-700" />
                            Delete Vendor
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
          <HorizontalTabs
            tabLists={['Information', 'Payment Request']}
            type="underline"
            size="sm"
            handleIndex={handleIndexTabs}
            index={index}
            gapLayout={true}
          >
            <div>
              <VendorInformation vendorDetail={vendorDetail} />
            </div>
            <div>
              <PaymentRequestList
                slugIdentifier={[]}
                isGlobalType={true}
                isGlobalData={true}
                vendorId={vendorDetail.id}
              />
            </div>
          </HorizontalTabs>
        </>

        {/* Delete Modal */}
        <Modal
          icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
          theme={theme.ERROR}
          modalTitle="Are you sure want to delete this vendor?"
          modalDescription="When you delete it, there is no way to undo the action. Please make sure you are aware that it will happen."
          modalButtons={[
            <>
              <Button
                type="button"
                btnType="normal"
                variant="secondary-gray"
                className="w-full justify-center"
                size="lg"
                onClick={closeDeleteConfirmationModal}
              >
                Cancel
              </Button>
            </>,
            <>
              <Button
                type="button"
                btnType="normal"
                variant="error"
                className="w-full justify-center"
                size="lg"
                onClick={deleteVendor}
                isLoading={loadingButtonStatement.deleteVendor}
              >
                Yes, Sure
              </Button>
            </>,
          ]}
          stateModal={isOpenModal.deleteConfirmationModal}
          handleCloseModal={closeDeleteConfirmationModal}
        />
      </div>
      </Dashboard>
    </>
  )
}

export default VendorDetailLayout

export const getServerSideProps: GetServerSideProps = async (context) => {
  const vendorId = context.params.id
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const vendorExternalApi = new VendorExternalApi(createAPIConfig(auth_token as string))

  try {
    const getVendorDetail = await vendorExternalApi.vendorControllerGetVendorDetail(vendorId as string)

    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    const checkUserRole = checkIsLoggedInRoleAll(authTokenJWT.payload['role'])

    if (!checkUserRole || !getVendorDetail.data.data) {
      return {
        notFound: true,
      }
    }

    // Pass data to the page via props
    return {
      props: {
        vendorDetail: getVendorDetail.data.data,
        activeSidebar: 'Vendor Detail',
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
