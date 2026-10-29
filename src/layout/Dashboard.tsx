/* eslint-disable tailwindcss/no-custom-classname */
import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { AvatarPlacement } from '@/components/AvatarPlacement'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { AlarmClockOffIcon } from '@/components/icon/AlarmClockOffIcon'
import { Bell01Icon } from '@/components/icon/Bell01Icon'
import { SearchIcon } from '@/components/icon/SearchIcon'
import { CheckVerified01Icon } from '@/components/icon/CheckVerified01Icon'
import { HelpCircleIcon } from '@/components/icon/HelpCircleIcon'
import { LockKeyholeCircleIcon } from '@/components/icon/LockKeyholeCircleIcon'
import { LogOut01Icon } from '@/components/icon/LogOut01Icon'
import { User01Icon } from '@/components/icon/User01Icon'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { theme } from '@/types/themes'
import { getPersonalizedNotification } from '@/utils/apiRequestHelper'
import { Menu, Transition } from '@headlessui/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'
import useSWRMutation from 'swr/mutation'
import { getCookie, removeCookie, setCookie } from 'typescript-cookie'

type DashboardProps = {
  children?: React.ReactNode
  breadcrumbLists: BreadcrumbList[]
}

type ModalStatement = {
  logout: boolean
}

type BreadcrumbList = {
  title: string
  url: string
}

export const Dashboard = ({ children, breadcrumbLists }: DashboardProps) => {
  const { isCollapsed, isFixedExpand, handleSidebarToggle, userLoggedinInformation } = useDashboardContext()

  const router = useRouter()
  const [pageSearch, setPageSearch] = useState('')
  const quickPages = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Project List', href: '/dashboard/project' },
    { label: 'Requisition Form', href: '/dashboard/procurement' },
    { label: 'Vendor Adm', href: '/dashboard/external/vendor-adm' },
    { label: 'Employee List', href: '/dashboard/internal/employee' },
    { label: 'Time Off', href: '/dashboard/internal/timeoff/all?tab=calendar-view' },
  ]
  const filteredPages = pageSearch.trim()
    ? quickPages.filter((page) => page.label.toLowerCase().includes(pageSearch.trim().toLowerCase()))
    : []
  const pendingApprovalCount =
    Number(personalizedNotifications?.need_approval_timeoff_total || 0) +
    Number(personalizedNotifications?.need_approval_program_budget_total || 0) +
    Number(personalizedNotifications?.need_approval_rf_total || 0) +
    Number(personalizedNotifications?.need_approval_pr_total || 0)

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    logout: false,
  })

  const {
    data: personalizedNotifications,
    error: personalizedNotificationsError,
    trigger: personalizedNotificationsTrigger,
  } = useSWRMutation('personalizedNotifications', getPersonalizedNotification)

  const closeLogOutModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({ ...prev, logout: false }))
  }

  const openLogOutModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({ ...prev, logout: true }))
  }

  const handleLogout = () => {
    removeCookie('auth_token')
    router.replace('/login')
  }

  useEffect(() => {
    const parentMenu = router.asPath.split('/')[2]
    const childMemu = router.asPath.split('/')[3]
    const childInnerMemu = router.asPath.split('/')[4]

    const parentMenuEl = document.querySelector(`[data-sidebar-parent='${parentMenu}']`)
    parentMenuEl?.classList.add('active')

    let sidebarChild = null
    const queryParam3 = document.querySelector(`[data-sidebar-child='${childMemu}']`)
    const queryParam4 = document.querySelector(`[data-sidebar-child='${childInnerMemu}']`)

    if (queryParam3) {
      sidebarChild = queryParam3
    } else if (queryParam4) {
      sidebarChild = queryParam4
    }

    sidebarChild?.classList.add('active')

    const accordionChild = sidebarChild?.closest('.accordion-child')
    if (accordionChild) {
      accordionChild.style.maxHeight = `${accordionChild.scrollHeight}px`
      accordionChild.classList.add('active')
    }
  }, [router])

  useEffect(() => {
    const puskapaSidebarToggle = getCookie('puskapa_sidebar_toggle')
    handleSidebarToggle(puskapaSidebarToggle === 'true' ? true : false)

    const handleResize = () => {
      if (window.matchMedia('(max-width: 1280px)').matches) {
        handleSidebarToggle(true)
        setCookie('puskapa_sidebar_toggle', true)
      } else {
        handleSidebarToggle(false)
        setCookie('puskapa_sidebar_toggle', false)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const main = document.querySelector('.main-dashboard') as HTMLElement

    setTimeout(() => {
      if (main) {
        main.style.transitionDuration = '0.3s'
      }
    }, 3000)

    personalizedNotificationsTrigger()
  }, [])

  useEffect(() => {
    document.body.style.overflowY = 'auto'
  }, [router.isReady])

  if (!personalizedNotifications && personalizedNotificationsError) {
    return (
      <section className="main-dashboard">
        <p>{personalizedNotificationsError.message}</p>
      </section>
    )
  }

  return (
    <>
      <section className={cn('main-dashboard sim-modern-shell', isFixedExpand ? 'ml-24' : isCollapsed ? 'ml-24' : 'ml-60 xl:ml-64')}>
        <div className="sim-modern-topbar flex items-center justify-between gap-3 px-5 py-4 md:px-7 xl:px-10">
          <Breadcrumb type="arrow" activeState="badge" breadcrumbLists={breadcrumbLists} />
          <div className="sim-modern-header-tools">
            <div className="sim-modern-search">
              <SearchIcon className="sim-modern-search-icon h-5 w-5" />
              <input
                type="search"
                aria-label="Search pages"
                autoComplete="off"
                className="sim-modern-search-input"
                placeholder="Search pages..."
                value={pageSearch}
                onChange={(event) => setPageSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setPageSearch('')
                  if (event.key === 'Enter' && filteredPages[0]) {
                    router.push(filteredPages[0].href)
                    setPageSearch('')
                  }
                }}
              />
              {pageSearch.trim() && (
                <div className="sim-modern-search-results" aria-label="Matching pages">
                  {filteredPages.length ? (
                    filteredPages.map((page) => (
                      <Link key={page.href} href={page.href} onClick={() => setPageSearch('')}>
                        {page.label}
                      </Link>
                    ))
                  ) : (
                    <p>No matching pages</p>
                  )}
                </div>
              )}
            </div>
            <Link
              href="/dashboard/user/need-approval"
              aria-label={pendingApprovalCount ? String(pendingApprovalCount) + ' pending approvals' : 'View approvals'}
              title="View pending approvals"
              className="sim-modern-icon-button"
            >
              <Bell01Icon className="h-5 w-5" />
              {pendingApprovalCount > 0 && <span className="sim-modern-notification-dot" />}
            </Link>
            <Menu as="div" className="relative ml-1 inline-block text-left">
              {({ open }) => (
                <>
                  <Menu.Button
                    className={cn(
                      'relative flex before:absolute before:-left-1 before:-top-1 before:-z-10 before:h-12 before:w-12 before:rounded-full before:bg-primary-100 before:transition before:duration-300 before:ease-out before:content-[""]',
                      open ? 'before:opacity-100' : 'before:opacity-0',
                    )}
                  >
                    <AvatarPlacement size="md" image={userLoggedinInformation?.avatar} text={''} />
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
                    <Menu.Items className="absolute right-0 z-30 mt-3 w-[15rem] origin-top-right divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl focus:outline-none xl:w-[18rem]">
                      <div className="px-4 py-3">
                        <AvatarLabelGroup
                          size="md"
                          image={userLoggedinInformation?.avatar}
                          text={userLoggedinInformation?.employee_name}
                          supportingText={userLoggedinInformation?.email}
                          statusIcon="online"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 px-1.5 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={`/dashboard/internal/employee/${userLoggedinInformation?.employee_id}`}
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <User01Icon className="h-4 w-4 stroke-gray-700" />
                              My Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/change-password"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                'group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300',
                              )}
                            >
                              <LockKeyholeCircleIcon className="h-4 w-4" />
                              Change Password
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={`/dashboard/internal/employee/${userLoggedinInformation?.employee_id}?tab=timeoff`}
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <AlarmClockOffIcon className="h-4 w-4 stroke-gray-700" />
                              My Time Off
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                      <div className="flex flex-col gap-0.5 px-1.5 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-approval"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <CheckVerified01Icon className="h-4 w-4 stroke-gray-700" />
                              Need Approval:
                            </Link>
                          )}
                        </Menu.Item>
                        {/* {checkIsItemExist(userLoggedinInformation?.role, [
                          RoleDefinition.SUPERVISOR,
                          RoleDefinition.SUPERADMIN,
                        ]) ? (
                        ) : null} */}
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-approval?tab=timeoff-request"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Time Off Req
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.need_approval_timeoff_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-approval?tab=program-budget"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Project Budget
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.need_approval_program_budget_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-approval?tab=procurement-request"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Procurement Request
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.need_approval_rf_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-approval?tab=payment-request"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Payment Request
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.need_approval_pr_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                      <div className="flex flex-col gap-0.5 px-1.5 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-action"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <CheckVerified01Icon className="h-4 w-4 stroke-gray-700" />
                              Need Action:
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-action?tab=requisition-form"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Requisition Form
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.need_action_rf_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-action?tab=payment-request-check"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Payment Request (Check)
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.need_action_pr_check_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/need-action?tab=payment-request-pay"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Payment Request (Pay)
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.need_action_pr_pay_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                      </div>
                      <div className="flex flex-col gap-0.5 px-1.5 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/request-tracking"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <CheckVerified01Icon className="h-4 w-4 stroke-gray-700" />
                              Request Tracking:
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/request-tracking?tab=requisition-form"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Requisition Form
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.tracking_rf_total || 0}
                              </div>
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/dashboard/user/request-tracking?tab=payment-request"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-500',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-semibold duration-300`,
                              )}
                            >
                              <div className="h-4 w-4"></div>
                              Payment Request
                              <div className="rounded-2xl bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 mix-blend-multiply">
                                {personalizedNotifications?.tracking_pr_total || 0}
                              </div>
                            </Link>
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
                            >
                              <HelpCircleIcon className="h-4 w-4 stroke-gray-700" />
                              Support
                            </button>
                          )}
                        </Menu.Item>
                        {/* <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <Settings01Icon className="h-4 w-4 stroke-gray-700" />
                              Setting
                            </button>
                          )}
                        </Menu.Item> */}
                      </div>
                      <div className="flex flex-col gap-0.5 px-1.5 py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={openLogOutModal}
                              type="button"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <LogOut01Icon className="h-4 w-4 stroke-gray-700" />
                              Log out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </>
              )}
            </Menu>
          </div>
        </div>
        {children}
      </section>
      {/* Modal Logout Confirmation */}
      <Modal
        icon={<LogOut01Icon className="h-6 w-6 stroke-primary-500" />}
        theme={theme.PRIMARY}
        modalTitle="Logout from your account?"
        modalDescription="Are you sure you want to logout? You should re-login when want access SIMPUSKAPA dashboard."
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeLogOutModal}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button
              type="button"
              btnType="normal"
              variant="primary"
              className="w-full justify-center"
              size="lg"
              onClick={handleLogout}
            >
              Yes, Sure
            </Button>
          </>,
        ]}
        stateModal={isOpenModal.logout}
        handleCloseModal={closeLogOutModal}
      />
    </>
  )
}
