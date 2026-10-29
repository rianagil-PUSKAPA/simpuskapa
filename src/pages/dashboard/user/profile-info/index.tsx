/* SIM PUSKAPA - Account center. Uses existing routes, data and authorization. */
import { AvatarPlacement } from '@/components/AvatarPlacement'
import { Modal } from '@/components/Modal'
import { AlarmClockOffIcon } from '@/components/icon/AlarmClockOffIcon'
import { ArrowRightIcon } from '@/components/icon/ArrowRightIcon'
import { BankNote01Icon } from '@/components/icon/BankNote01Icon'
import { CalendarIcon } from '@/components/icon/CalendarIcon'
import { CheckVerified01Icon } from '@/components/icon/CheckVerified01Icon'
import { File04Icon } from '@/components/icon/File04Icon'
import { HelpCircleIcon } from '@/components/icon/HelpCircleIcon'
import { LockKeyholeCircleIcon } from '@/components/icon/LockKeyholeCircleIcon'
import { LogOut01Icon } from '@/components/icon/LogOut01Icon'
import { Mail02Icon } from '@/components/icon/Mail02Icon'
import { User01Icon } from '@/components/icon/User01Icon'
import { Dashboard } from '@/layout/Dashboard'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { theme } from '@/types/themes'
import { getPersonalizedNotification } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import type { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'

type ProfileRowProps = {
  href: string
  title: string
  description: string
  icon: React.ReactNode
  tone?: 'orange' | 'blue' | 'green' | 'purple'
  count?: number
}

const ProfileRow = ({ href, title, description, icon, tone = 'orange', count }: ProfileRowProps) => (
  <Link href={href} className="sim-profile-link">
    <span className={`sim-profile-row-icon sim-profile-tone-${tone}`} aria-hidden="true">{icon}</span>
    <span className="sim-profile-link-copy">
      <strong>{title}</strong>
      <span>{description}</span>
    </span>
    {count !== undefined && (
      <span className="sim-profile-count" aria-label={`${count} items`}>{count}</span>
    )}
    <ArrowRightIcon className="h-4 w-4 stroke-gray-400" />
  </Link>
)

type ProfileSectionProps = {
  title: string
  description: string
  children: React.ReactNode
  total?: number
}

const ProfileSection = ({ title, description, children, total }: ProfileSectionProps) => (
  <section className="sim-profile-card">
    <div className="sim-profile-card-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {total !== undefined && <span className="sim-profile-total">{total} items</span>}
    </div>
    <div className="sim-profile-rows">{children}</div>
  </section>
)

export default function ProfileInfo() {
  const { userLoggedinInformation: user } = useDashboardContext()
  const router = useRouter()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const {
    data: notification,
    trigger: loadNotifications,
    error: notificationsError,
    isMutating: notificationsLoading,
  } = useSWRMutation(
    'profileInfoNotifications',
    getPersonalizedNotification,
  )

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const notificationReady = notification !== undefined && notification !== null

  const approval = {
    timeoff: Number(notification?.need_approval_timeoff_total || 0),
    budget: Number(notification?.need_approval_program_budget_total || 0),
    requisition: Number(notification?.need_approval_rf_total || 0),
    payment: Number(notification?.need_approval_pr_total || 0),
  }
  const action = {
    requisition: Number(notification?.need_action_rf_total || 0),
    checking: Number(notification?.need_action_pr_check_total || 0),
    payment: Number(notification?.need_action_pr_pay_total || 0),
  }
  const tracking = {
    requisition: Number(notification?.tracking_rf_total || 0),
    payment: Number(notification?.tracking_pr_total || 0),
  }

  const logout = () => {
    removeCookie('auth_token')
    router.replace('/login')
  }

  return (
    <>
      <NextSeo title="Profile Info" canonical={`${MAIN_URL_FE}dashboard/user/profile-info`} />
      <Dashboard breadcrumbLists={[{ title: 'Profile Info', url: '' }]}>
        <div className="sim-profile-page">
          <div className="sim-profile-intro">
            <span>MY ACCOUNT</span>
            <h1>Profile Info</h1>
            <p>Manage your account, check requests, and access the actions you need.</p>
          </div>

          <section className="sim-profile-identity" aria-label="Account information">
            <div className="sim-profile-avatar">
              <AvatarPlacement size="xl" image={user?.avatar} text={user?.employee_name} />
            </div>
            <div className="sim-profile-person">
              <span className="sim-profile-eyebrow">Signed-in account</span>
              <h2>{user?.employee_name || 'PUSKAPA Employee'}</h2>
              <p><Mail02Icon className="h-4 w-4 stroke-gray-500" />{user?.email || '—'}</p>
            </div>
            {user?.employee_id && (
              <Link href={`/dashboard/internal/employee/${user.employee_id}`} className="sim-profile-view-button">
                <User01Icon className="h-4 w-4 stroke-primary-700" />
                View My Profile
                <ArrowRightIcon className="h-4 w-4 stroke-primary-700" />
              </Link>
            )}
          </section>

          {!notificationReady && (
            <div className="sim-profile-notification-state" role="status">
              {notificationsError
                ? 'Unable to load your request counts. This does not mean your request records were removed.'
                : notificationsLoading ? 'Loading request counts for your account...' : 'Preparing request counts...'}
              {notificationsError && (
                <button type="button" onClick={() => loadNotifications()}>Retry</button>
              )}
            </div>
          )}
          <div className="sim-profile-section-grid">
            <ProfileSection title="Account Settings" description="Your personal information and preferences">
              <ProfileRow
                href={`/dashboard/internal/employee/${user?.employee_id || ''}`}
                title="My Profile"
                description="View your personal and employment information"
                icon={<User01Icon className="h-5 w-5 stroke-primary-600" />}
              />
              <ProfileRow
                href="/change-password"
                title="Change Password"
                description="Update your account password securely"
                icon={<LockKeyholeCircleIcon className="h-5 w-5 stroke-primary-600" />}
                tone="blue"
              />
              <ProfileRow
                href={`/dashboard/internal/employee/${user?.employee_id || ''}?tab=timeoff`}
                title="My Time Off"
                description="Review your time-off requests and history"
                icon={<AlarmClockOffIcon className="h-5 w-5 stroke-primary-600" />}
                tone="green"
              />
            </ProfileSection>

            <ProfileSection
              title="Needs Approval"
              description="Requests waiting for your approval"
              total={notificationReady ? approval.timeoff + approval.budget + approval.requisition + approval.payment : undefined}
            >
              <ProfileRow href="/dashboard/user/need-approval?tab=timeoff-request" title="Time Off Request" description="Employee leave approvals" count={notificationReady ? approval.timeoff : undefined} icon={<CalendarIcon className="h-5 w-5 stroke-primary-600" />} />
              <ProfileRow href="/dashboard/user/need-approval?tab=program-budget" title="Project Budget" description="Budget requests to review" count={notificationReady ? approval.budget : undefined} tone="blue" icon={<CheckVerified01Icon className="h-5 w-5 stroke-primary-600" />} />
              <ProfileRow href="/dashboard/user/need-approval?tab=procurement-request" title="Procurement Request" description="Requisition approvals" count={notificationReady ? approval.requisition : undefined} tone="green" icon={<File04Icon className="h-5 w-5 stroke-primary-600" />} />
              <ProfileRow href="/dashboard/user/need-approval?tab=payment-request" title="Payment Request" description="Payment approvals" count={notificationReady ? approval.payment : undefined} tone="purple" icon={<BankNote01Icon className="h-5 w-5 stroke-primary-600" />} />
            </ProfileSection>

            <ProfileSection
              title="Need Action"
              description="Requests requiring your next step"
              total={notificationReady ? action.requisition + action.checking + action.payment : undefined}
            >
              <ProfileRow href="/dashboard/user/need-action?tab=requisition-form" title="Requisition Form" description="Items assigned to you" count={notificationReady ? action.requisition : undefined} tone="green" icon={<File04Icon className="h-5 w-5 stroke-primary-600" />} />
              <ProfileRow href="/dashboard/user/need-action?tab=payment-request-check" title="Payment Request (Check)" description="Payments to verify" count={notificationReady ? action.checking : undefined} tone="blue" icon={<CheckVerified01Icon className="h-5 w-5 stroke-primary-600" />} />
              <ProfileRow href="/dashboard/user/need-action?tab=payment-request-pay" title="Payment Request (Pay)" description="Payments to process" count={notificationReady ? action.payment : undefined} tone="purple" icon={<BankNote01Icon className="h-5 w-5 stroke-primary-600" />} />
            </ProfileSection>

            <ProfileSection
              title="Request Tracking"
              description="Monitor the progress of your submissions"
              total={notificationReady ? tracking.requisition + tracking.payment : undefined}
            >
              <ProfileRow href="/dashboard/user/request-tracking?tab=requisition-form" title="Requisition Form" description="Track submitted requisitions" count={notificationReady ? tracking.requisition : undefined} tone="green" icon={<File04Icon className="h-5 w-5 stroke-primary-600" />} />
              <ProfileRow href="/dashboard/user/request-tracking?tab=payment-request" title="Payment Request" description="Track submitted payments" count={notificationReady ? tracking.payment : undefined} tone="purple" icon={<BankNote01Icon className="h-5 w-5 stroke-primary-600" />} />
            </ProfileSection>
          </div>

          <section className="sim-profile-bottom" aria-label="Help and account security">
            <div className="sim-profile-help">
              <span className="sim-profile-help-icon"><HelpCircleIcon className="h-5 w-5 stroke-gray-600" /></span>
              <div>
                <h2>Need Help?</h2>
                <p>For account or system assistance, contact your PUSKAPA IT administrator.</p>
              </div>
            </div>
            <div className="sim-profile-security">
              <div>
                <h2>Account Security</h2>
                <p>Sign out of your current session.</p>
              </div>
              <button className="sim-profile-logout-button" type="button" onClick={() => setConfirmLogout(true)}>
                <LogOut01Icon className="h-5 w-5 stroke-white" />
                Log out
              </button>
            </div>
          </section>
        </div>
      </Dashboard>
      <Modal
        icon={<LogOut01Icon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle="Log out of SIM PUSKAPA?"
        modalDescription="Are you sure you want to sign out of your account?"
        modalButtons={[
          <button key="cancel" type="button" className="sim-profile-cancel-button" onClick={() => setConfirmLogout(false)}>Cancel</button>,
          <button key="logout" type="button" className="sim-profile-logout-button" onClick={logout}>
            <LogOut01Icon className="h-5 w-5 stroke-white" /> Log out
          </button>,
        ]}
        stateModal={confirmLogout}
        handleCloseModal={() => setConfirmLogout(false)}
      />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => ({
  props: { activeSidebar: 'Profile Info' },
})
