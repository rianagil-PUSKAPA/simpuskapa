/* eslint-disable tailwindcss/no-custom-classname */
import { AvatarPlacement } from '@/components/AvatarPlacement'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Bell01Icon } from '@/components/icon/Bell01Icon'
import { SearchIcon } from '@/components/icon/SearchIcon'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { getPersonalizedNotification } from '@/utils/apiRequestHelper'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import useSWRMutation from 'swr/mutation'
import { getCookie, setCookie } from 'typescript-cookie'

type DashboardProps = {
  children?: React.ReactNode
  breadcrumbLists: BreadcrumbList[]
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
    { label: 'Profile Info', href: '/dashboard/user/profile-info' },
    { label: 'Project List', href: '/dashboard/project' },
    { label: 'Requisition Form', href: '/dashboard/procurement' },
    { label: 'Vendor Adm', href: '/dashboard/external/vendor-adm' },
    { label: 'Employee List', href: '/dashboard/internal/employee' },
    { label: 'Time Off', href: '/dashboard/internal/timeoff/all?tab=calendar-view' },
  ]
  const filteredPages = pageSearch.trim()
    ? quickPages.filter((page) => page.label.toLowerCase().includes(pageSearch.trim().toLowerCase()))
    : []

  const {
    data: personalizedNotifications,
    error: personalizedNotificationsError,
    trigger: personalizedNotificationsTrigger,
  } = useSWRMutation('personalizedNotifications', getPersonalizedNotification)

  const pendingApprovalCount =
    Number(personalizedNotifications?.need_approval_timeoff_total || 0) +
    Number(personalizedNotifications?.need_approval_program_budget_total || 0) +
    Number(personalizedNotifications?.need_approval_rf_total || 0) +
    Number(personalizedNotifications?.need_approval_pr_total || 0)

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
      <section
        className={cn(
          'main-dashboard sim-modern-shell',
          isFixedExpand ? 'ml-24' : isCollapsed ? 'ml-24' : 'ml-60 xl:ml-64',
        )}
      >
        <div className="sim-modern-topbar flex items-center justify-between gap-3 px-5 py-4 md:px-7 xl:px-10">
          <Breadcrumb type="arrow" activeState="badge" breadcrumbLists={breadcrumbLists} />
          <div className="sim-modern-header-tools">
            <div className="sim-modern-search">
              <span className="sim-modern-search-icon">
                <SearchIcon className="h-5 w-5 stroke-gray-500" />
              </span>
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
              <Bell01Icon className="h-5 w-5 stroke-gray-600" />
              {pendingApprovalCount > 0 && <span className="sim-modern-notification-dot" />}
            </Link>
            <Link
              href="/dashboard/user/profile-info"
              className="sim-modern-profile-entry"
              title="Open Profile Info"
              aria-label="Open Profile Info"
            >
              <AvatarPlacement size="md" image={userLoggedinInformation?.avatar} text="" />
            </Link>
          </div>
        </div>
        {children}
      </section>
    </>
  )
}
