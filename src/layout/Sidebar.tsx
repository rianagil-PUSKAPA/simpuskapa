import { BankNote01Icon } from '@/components/icon/BankNote01Icon'
import { Database01Icon } from '@/components/icon/Database01Icon'
import { HomeLineIcon } from '@/components/icon/HomeLineIcon'
import { ImageUserCheckIcon } from '@/components/icon/ImageUserCheckIcon'
import { ImageUserRightIcon } from '@/components/icon/ImageUserRightIcon'
import { LayersThree02Icon } from '@/components/icon/LayersThree02Icon'
import { LockKeyholeCircleIcon } from '@/components/icon/LockKeyholeCircleIcon'
import { Menu02Icon } from '@/components/icon/Menu02Icon'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { checkIsItemExist } from '@/utils/globalHelper'
import { app_version } from '@/version'
import { getPersonalizedNotification } from '@/utils/apiRequestHelper'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getCookie, setCookie } from 'typescript-cookie'

type Props = {
  activeSidebar: string
}

const SidebarNotificationBadge = ({ count }: { count?: number }) => {
  const value = Number(count || 0)

  if (value <= 0) return null

  return (
    <span className="min-w-5 bg-red-500 ml-auto inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none text-white">
      {value > 99 ? '99+' : value}
    </span>
  )
}

export const Sidebar = ({ activeSidebar }: Props) => {
  const { handleSidebarToggle, isCollapsed, handleInternal, userLoggedinInformation } = useDashboardContext()

  const router = useRouter()

  const [personalizedNotifications, setPersonalizedNotifications] = useState<any>(null)

  useEffect(() => {
    let mounted = true

    const loadNotifications = async () => {
      try {
        const data = await getPersonalizedNotification()

        if (mounted) {
          setPersonalizedNotifications(data)
        }
      } catch {
        // Badge notification tidak boleh membuat Sidebar rusak.
      }
    }

    loadNotifications()

    const interval = window.setInterval(loadNotifications, 30000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  const requisitionNotificationCount = Number(personalizedNotifications?.need_approval_rf_total || 0)

  const paymentRequestNotificationCount = Number(personalizedNotifications?.need_approval_pr_total || 0)

  const handleShrinkSidebar = () => {
    handleSidebarToggle(!isCollapsed)
    setCookie('puskapa_sidebar_toggle', !isCollapsed)
  }

  const removeDashboardActiveState = () => {
    document.querySelector('.hamburger-menu').classList.remove('active')
    document.querySelector('.sidebar-dashboard').classList.remove('active')
    document.querySelector('body').classList.remove('overflow-hidden')
    document.querySelector('.overlay-dashboard').classList.remove('active')
  }

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
    const aside = document.querySelector('aside')

    setTimeout(() => {
      if (aside) {
        aside.style.transitionDuration = '0.3s'
      }
    }, 3000)
  }, [])

  return (
    <>
      <div className="overlay-dashboard" onClick={removeDashboardActiveState}></div>
      <aside className={cn('sidebar-dashboard group hover:w-60 xl:hover:w-64', isCollapsed ? 'collapsed w-24' : '')}>
        <div
          className={cn(
            'fixed left-0 top-0 z-10 flex items-center border-b border-r border-b-gray-200 border-r-gray-200 bg-white px-6 py-5 duration-300 group-hover:w-60 group-hover:justify-between xl:group-hover:w-64',
            isCollapsed ? 'w-24 justify-center' : 'w-60 justify-between xl:w-64',
          )}
        >
          <Link href="/dashboard" className="relative inline-flex items-center gap-1 duration-300">
            <Image
              width={32}
              height={32}
              src={`${process.env.NEXT_PUBLIC_ASSETS}/images/logo-simpuskapa.png`}
              alt="SIM Puskapa Logo"
              className="h-12 w-12 shrink-0 duration-300 xxs:h-8 xxs:w-8"
            />
            <p
              className={cn(
                isCollapsed ? 'w-0' : 'w-auto',
                'overflow-hidden font-bold uppercase text-gray-600 duration-300 group-hover:w-auto',
              )}
            >
              simpuskapa
            </p>
            <span
              className={cn(
                'absolute -bottom-2.5 right-0 text-[10px] font-bold text-primary-700 duration-200',
                isCollapsed ? 'opacity-0' : 'opacity-100',
              )}
            >
              {app_version}
            </span>
          </Link>
          <button
            id="sidebar-toggle"
            type="button"
            onClick={handleShrinkSidebar}
            className={cn(
              'absolute top-5 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white duration-150 focus:ring-0',
              isCollapsed ? '-right-4' : 'right-6',
            )}
          >
            <Menu02Icon className="h-4 w-4 stroke-gray-500" />
          </button>
        </div>
        <div className="mt-16 overflow-y-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50 2xl:mt-[4.5rem]">
          <ul className={cn('flex flex-col p-6 group-hover:gap-9', isCollapsed ? 'gap-6' : 'gap-9')}>
            <li>
              <div
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                  isCollapsed ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200' : 'mb-3 border-transparent',
                )}
              >
                <div className="shrink-0">
                  <HomeLineIcon className={cn(isCollapsed ? 'h-5 w-5 stroke-gray-500' : 'h-4 w-4 stroke-gray-400')} />
                </div>
                <p
                  className={cn(
                    'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                    isCollapsed && 'hidden',
                  )}
                >
                  Dashboard
                </p>
              </div>
              <div className={cn('flex flex-col gap-1 duration-300 group-hover:flex', isCollapsed && 'hidden')}>
                <Link
                  href={'/dashboard'}
                  className={cn(
                    'cursor-pointer whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Home' && 'bg-gray-50 text-gray-700',
                  )}
                >
                  Home
                </Link>
              </div>
            </li>
            <li>
              <div
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                  isCollapsed ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200' : 'mb-3 border-transparent',
                )}
              >
                <div className="shrink-0">
                  <LayersThree02Icon
                    className={cn(isCollapsed ? 'h-5 w-5 stroke-gray-500' : 'h-4 w-4 stroke-gray-400')}
                  />
                </div>
                <p
                  className={cn(
                    'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                    isCollapsed && 'hidden',
                  )}
                >
                  Project
                </p>
              </div>
              <div className={cn('flex flex-col gap-1 duration-300 group-hover:flex', isCollapsed && 'hidden')}>
                <div
                  onClick={() => {
                    handleInternal(false)
                    router.push('/dashboard/project')
                  }}
                  className={cn(
                    'cursor-pointer whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Project List' && 'bg-gray-50 text-gray-700',
                  )}
                >
                  Project List
                </div>
              </div>
            </li>
            {checkIsItemExist(userLoggedinInformation?.role, [
              RoleDefinition.HEAD_OF_FINANCE,
              RoleDefinition.FINANCE_TEAM,
              RoleDefinition.SUPERADMIN,
            ]) ? (
              <li>
                <div
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                    isCollapsed ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200' : 'mb-3 border-transparent',
                  )}
                >
                  <div className="shrink-0">
                    <BankNote01Icon
                      className={cn(isCollapsed ? 'h-5 w-5 stroke-gray-500' : 'h-4 w-4 stroke-gray-400')}
                    />
                  </div>
                  <p
                    className={cn(
                      'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                      isCollapsed && 'hidden',
                    )}
                  >
                    Finance
                  </p>
                </div>
                <div className={cn('flex flex-col gap-1 duration-300 group-hover:flex', isCollapsed && 'hidden')}>
                  <Link
                    href="/dashboard/finance/reporting"
                    className={cn(
                      'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                      activeSidebar === 'Reporting' && 'bg-gray-50 text-gray-700',
                    )}
                  >
                    Reporting
                  </Link>
                  <Link
                    href="/dashboard/finance/payment-request"
                    className={cn(
                      'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                      activeSidebar === 'Payment Request' && 'bg-gray-50 text-gray-700',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-center">
                      Payment Request
                      <SidebarNotificationBadge count={paymentRequestNotificationCount} />
                    </span>
                  </Link>
                  {checkIsItemExist(userLoggedinInformation?.role, [
                    RoleDefinition.HEAD_OF_FINANCE,
                    RoleDefinition.SUPERADMIN,
                  ]) ? (
                    <Link
                      href="/dashboard/finance/employees-tax"
                      className={cn(
                        'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                        activeSidebar === 'Employee’s Tax' && 'bg-gray-50 text-gray-700',
                      )}
                    >
                      Employee’s Tax
                    </Link>
                  ) : null}
                </div>
              </li>
            ) : null}
            <li>
              <div
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                  isCollapsed ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200' : 'mb-3 border-transparent',
                )}
              >
                <div className="shrink-0">
                  <Database01Icon className={cn(isCollapsed ? 'h-5 w-5 stroke-gray-500' : 'h-4 w-4 stroke-gray-400')} />
                </div>
                <p
                  className={cn(
                    'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                    isCollapsed && 'hidden',
                  )}
                >
                  Procurement
                </p>
              </div>
              <div className={cn('flex flex-col gap-1 duration-300 group-hover:flex', isCollapsed && 'hidden')}>
                <Link
                  href="/dashboard/procurement"
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Requisition Form' && 'bg-gray-50 text-gray-700',
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center">
                    Requisition Form
                    <SidebarNotificationBadge count={requisitionNotificationCount} />
                  </span>
                </Link>
                {/* <Link
                  href="/"
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Assets List' &&
                      'bg-gray-50 text-gray-700',
                  )}
                >
                  Assets List
                </Link> */}
              </div>
            </li>
            <li>
              <div
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                  isCollapsed ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200' : 'mb-3 border-transparent',
                )}
              >
                <div className="shrink-0">
                  <ImageUserRightIcon
                    className={cn(isCollapsed ? 'h-5 w-5 stroke-gray-500' : 'h-4 w-4 stroke-gray-400')}
                  />
                </div>
                <p
                  className={cn(
                    'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                    isCollapsed && 'hidden',
                  )}
                >
                  External
                </p>
              </div>
              <div className={cn('flex flex-col gap-1 duration-300 group-hover:flex', isCollapsed && 'hidden')}>
                <Link
                  href="/dashboard/external/vendor-adm"
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Vendor Adm' && 'bg-gray-50 text-gray-700',
                  )}
                >
                  Vendor Adm
                </Link>
                {/* <Link
                  href="/"
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Personal Hire Adm' &&
                      'bg-gray-50 text-gray-700',
                  )}
                >
                  Personal Hire Adm
                </Link> */}
              </div>
            </li>
            <li>
              <div
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                  isCollapsed ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200' : 'mb-3 border-transparent',
                )}
              >
                <div className="shrink-0">
                  <ImageUserCheckIcon
                    className={cn(isCollapsed ? 'h-5 w-5 stroke-gray-500' : 'h-4 w-4 stroke-gray-400')}
                  />
                </div>
                <p
                  className={cn(
                    'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                    isCollapsed && 'hidden',
                  )}
                >
                  Internal
                </p>
              </div>
              <div className={cn('flex flex-col gap-1 duration-300 group-hover:flex', isCollapsed && 'hidden')}>
                {checkIsItemExist(userLoggedinInformation?.role, [
                  RoleDefinition.ADMIN,
                  RoleDefinition.SUPERADMIN,
                  'finance_team',
                  'head_of_finance',
                  RoleDefinition.HEAD_OF_OPERATION,
                  'supervisor',
                  'general_manager',
                ]) ? (
                  <div
                    onClick={() => {
                      handleInternal(true)
                      router.push('/dashboard/internal-needs')
                    }}
                    className={cn(
                      'cursor-pointer whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                      activeSidebar === 'Internal Needs' && 'bg-gray-50 text-gray-700',
                    )}
                  >
                    Internal Needs
                  </div>
                ) : null}
                <Link
                  href="/dashboard/internal/employee"
                  onClick={() => handleInternal(false)}
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Employee List' && 'bg-gray-50 text-gray-700',
                  )}
                >
                  Employee List
                </Link>
                {checkIsItemExist(userLoggedinInformation?.role, [
                  RoleDefinition.ADMIN,
                  RoleDefinition.SUPERADMIN,
                  'general_manager',
                  RoleDefinition.HEAD_OF_OPERATION,
                ]) ? (
                  <Link
                    href="/dashboard/internal/employment-contract"
                    className={cn(
                      'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                      activeSidebar === 'Employee Contract' && 'bg-gray-50 text-gray-700',
                    )}
                  >
                    Employee Contract
                  </Link>
                ) : null}
                {checkIsItemExist(userLoggedinInformation?.role, [
                  RoleDefinition.ADMIN,
                  RoleDefinition.SUPERADMIN,
                  'general_manager',
                  RoleDefinition.HEAD_OF_OPERATION,
                ]) ? (
                  <Link
                    href="/dashboard/internal/evaluation"
                    className={cn(
                      'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                      activeSidebar === 'Perf. Evaluation' && 'bg-gray-50 text-gray-700',
                    )}
                  >
                    Perf. Evaluation
                  </Link>
                ) : null}
                <Link
                  href="/dashboard/internal/timeoff/all?tab=calendar-view"
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Time Off' && 'bg-gray-50 text-gray-700',
                  )}
                >
                  Time Off
                </Link>
                {checkIsItemExist(userLoggedinInformation?.role, [
                  RoleDefinition.SUPERVISOR,
                  RoleDefinition.SUPERADMIN,
                ]) ? (
                  <Link
                    href="/dashboard/internal/timeoff/requests"
                    className={cn(
                      'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                      activeSidebar === 'Time Off Request' && 'bg-gray-50 text-gray-700',
                    )}
                  >
                    Time Off Request
                  </Link>
                ) : null}
              </div>
            </li>
            {/* <li>
              <div
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                  isCollapsed
                    ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200'
                    : 'mb-3 border-transparent',
                )}
              >
                <div className="shrink-0">
                  <BookOpen01Icon
                    className={cn(
                      isCollapsed
                        ? 'h-5 w-5 stroke-gray-500'
                        : 'h-4 w-4 stroke-gray-400',
                    )}
                  />
                </div>
                <p
                  className={cn(
                    'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                    isCollapsed && 'hidden',
                  )}
                >
                  Knowledge
                </p>
              </div>
              <div
                className={cn(
                  'flex flex-col gap-1 duration-300 group-hover:flex',
                  isCollapsed && 'hidden',
                )}
              >
                <Link
                  href="/"
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Rules & Terms' &&
                      'bg-gray-50 text-gray-700',
                  )}
                >
                  Rules & Terms
                </Link>
                <Link
                  href="/"
                  className={cn(
                    'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                    activeSidebar === 'Tutorial' && 'bg-gray-50 text-gray-700',
                  )}
                >
                  Tutorial
                </Link>
              </div>
            </li> */}
            {userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN) ? (
              <li>
                <div
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-md border duration-300 group-hover:mb-3 group-hover:mr-auto group-hover:h-auto group-hover:w-auto group-hover:justify-start group-hover:border-transparent',
                    isCollapsed ? 'mx-auto mb-0 h-11 w-11 justify-center border-gray-200' : 'mb-3 border-transparent',
                  )}
                >
                  <div className="shrink-0">
                    <LockKeyholeCircleIcon
                      className={cn(isCollapsed ? 'h-5 w-5 stroke-gray-500' : 'h-4 w-4 stroke-gray-400')}
                    />
                  </div>
                  <p
                    className={cn(
                      'text-sm font-bold uppercase text-gray-400 duration-300 group-hover:block',
                      isCollapsed && 'hidden',
                    )}
                  >
                    Admin Zone
                  </p>
                </div>
                <div className={cn('flex flex-col gap-1 duration-300 group-hover:flex', isCollapsed && 'hidden')}>
                  <Link
                    href="/dashboard/admin-zone/user-management"
                    className={cn(
                      'whitespace-nowrap rounded-md px-3.5 py-2.5 font-semibold text-gray-500 duration-300 hover:bg-gray-50 hover:text-gray-700',
                      activeSidebar === 'User Management' && 'bg-gray-50 text-gray-700',
                    )}
                  >
                    User Management
                  </Link>
                </div>
              </li>
            ) : null}
          </ul>
        </div>
      </aside>
    </>
  )
}
