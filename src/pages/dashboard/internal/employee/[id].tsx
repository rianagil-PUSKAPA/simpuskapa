/* eslint-disable tailwindcss/no-custom-classname */
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { cn } from '@/lib/utils'
import { theme } from '@/types/themes'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { employeeApi } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import { checkIsLoggedInRoleAll } from '@/utils/globalHelper'
import { Menu, Transition } from '@headlessui/react'
import {
  Employee,
  EmployeeApi,
  EmployeeContract,
  EmployeePerformanceAggregated,
  EmployeePerformanceApi,
  EmployeeTraining,
  TimeOffRow,
} from '@sdk'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { toast } from 'react-toastify'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const EmploymentContract: any = dynamic(() =>
  import('@/layout/employee-detail/EmploymentContract').then((mod) => mod.EmploymentContract),
)
const PerformanceEvaluation: any = dynamic(() =>
  import('@/layout/employee-detail/PerformanceEvaluation').then((mod) => mod.PerformanceEvaluation),
)
const PersonalIdentity: any = dynamic(() =>
  import('@/layout/employee-detail/PersonalIdentity').then((mod) => mod.PersonalIdentity),
)
const TimeOff: any = dynamic(() => import('@/layout/employee-detail/TimeOff').then((mod) => mod.TimeOff))
const Trainings: any = dynamic(() => import('@/layout/employee-detail/Trainings').then((mod) => mod.Trainings))
const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const AvatarPlacement: any = dynamic(() => import('@/components/AvatarPlacement').then((mod) => mod.AvatarPlacement))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const Modal: any = dynamic(() => import('@/components/Modal').then((mod) => mod.Modal))
const AlarmClockOffIcon: any = dynamic(() =>
  import('@/components/icon/AlarmClockOffIcon').then((mod) => mod.AlarmClockOffIcon),
)
const AlertCircleIcon: any = dynamic(() =>
  import('@/components/icon/AlertCircleIcon').then((mod) => mod.AlertCircleIcon),
)
const Award04Icon: any = dynamic(() => import('@/components/icon/Award04Icon').then((mod) => mod.Award04Icon))
const ChevronDownIcon: any = dynamic(() =>
  import('@/components/icon/ChevronDownIcon').then((mod) => mod.ChevronDownIcon),
)
const Edit03Icon: any = dynamic(() => import('@/components/icon/Edit03Icon').then((mod) => mod.Edit03Icon))
const FilePlus02Icon: any = dynamic(() => import('@/components/icon/FilePlus02Icon').then((mod) => mod.FilePlus02Icon))
const Mail02Icon: any = dynamic(() => import('@/components/icon/Mail02Icon').then((mod) => mod.Mail02Icon))
const PhoneCall01Icon: any = dynamic(() =>
  import('@/components/icon/PhoneCall01Icon').then((mod) => mod.PhoneCall01Icon),
)
const Trash01Icon: any = dynamic(() => import('@/components/icon/Trash01Icon').then((mod) => mod.Trash01Icon))
const UsersXIcon: any = dynamic(() => import('@/components/icon/UsersXIcon').then((mod) => mod.UsersXIcon))
dayjs.extend(utc)
dayjs.extend(relativeTime)

interface EmployeeListProps {
  employeeDetail: Employee
  employeeContracts: EmployeeContract[]
  performanceEvaluations: EmployeePerformanceAggregated[]
  employeeTrainings: EmployeeTraining[]
  employeeTimeoff: TimeOffRow[]
}

type ModalStatement = {
  deleteConfirmationModal: boolean
}

const EmployeeDetail = ({ employeeDetail, performanceEvaluations }: EmployeeListProps) => {
  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'personal-identity': { index: 0, slug: 'personal-identity' },
    'employment-contract': { index: 1, slug: 'employment-contract' },
    'performance-evaluation': { index: 2, slug: 'performance-evaluation' },
    trainings: { index: 3, slug: 'trainings' },
    timeoff: { index: 4, slug: 'timeoff' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'personal-identity') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'personal-identity'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    deleteConfirmationModal: false,
  })

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

  const openDeleteConfirmationModal = () => {
    // const haha = budgetNeedsData
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

  const deleteEmployee = async () => {
    const deleteEmployeeRes = employeeApi.employeeControllerDeleteEmployee(router.query.id as string)

    toast.promise(deleteEmployeeRes, {
      pending: 'Deleting employee...',
      success: 'Employee deleted successfully',
      error: 'Promise rejected 🤯',
    })

    deleteEmployeeRes.finally(() => {
      router.replace(`/dashboard/internal/employee`)
    })
  }

  return (
    <>
      <NextSeo title="Employee List" canonical={`${MAIN_URL_FE}dashboard/internal/employee/${router.query.id}`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          {
            title: 'Employee List',
            url: `/dashboard/internal/employee`,
          },
          { title: employeeDetail?.full_name, url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--people sim-ui-v3--detail-employee">
          <>
            <div className="mb-1 mt-5 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 pb-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
              <div className="inline-flex items-center gap-3.5 xxs:gap-5">
                <AvatarPlacement
                  size="xl"
                  image={
                    employeeDetail.pass_photo_path ? employeeDetail.pass_photo_path?.[0] : employeeDetail.user.avatar
                  }
                  text={employeeDetail.full_name}
                />
                <div>
                  <h1 className="text-2xl font-semibold capitalize text-gray-900 xxs:mb-1">
                    {employeeDetail.full_name}
                  </h1>
                  <p className="text-base font-normal text-gray-600">
                    {employeeDetail.staff_id} - {employeeDetail.employee_contracts[0].position} - Joined since{' '}
                    {dayjs(employeeDetail.employee_contracts[0].contract_started).local().format('DD MMM YYYY')}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 xxs:gap-4">
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
                    About Employee
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
                    <Menu.Items className="min-w absolute right-0 z-20 mt-2 w-60 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                      <div className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-700">ID: {employeeDetail.staff_id}</p>
                      </div>
                      <Menu.Item>
                        <div className="w-full px-6 py-4">
                          <span className="inline-block text-xs font-semibold text-gray-400">Employment Type</span>
                          <p className="text-sm text-gray-600">Employee</p>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="w-full px-6 py-4">
                          <span className="inline-block text-xs font-semibold text-gray-400">Employment Status</span>
                          <p className="text-sm text-gray-600">{employeeDetail.employee_contracts[0].emp_status}</p>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="w-full px-6 py-4">
                          <span className="inline-block text-xs font-semibold text-gray-400">Position</span>
                          <p className="text-sm text-gray-600">{employeeDetail.employee_contracts[0].position}</p>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="w-full px-6 py-4">
                          <span className="inline-block text-xs font-semibold text-gray-400">Department</span>
                          <p className="text-sm text-gray-600">{employeeDetail.employee_contracts[0].department}</p>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="w-full px-6 py-4">
                          <span className="inline-block text-xs font-semibold text-gray-400">Joined since</span>
                          <p className="text-sm text-gray-600">
                            {dayjs(employeeDetail.employee_contracts[0].created_at).local().format('DD MMM YYYY')}
                          </p>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="w-full px-6 py-4">
                          <span className="inline-block text-xs font-semibold text-gray-400">Phone Number</span>
                          <p className="text-sm text-gray-600">{employeeDetail.phone_number.replace('_', ' ')}</p>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="w-full px-6 py-4">
                          <span className="inline-block text-xs font-semibold text-gray-400">Email</span>
                          <p className="text-sm text-gray-600">{employeeDetail.user.email}</p>
                        </div>
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>

                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="button secondary grow justify-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300 xxs:justify-start">
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
                    <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                      <div className="px-4 py-3">
                        <AvatarLabelGroup
                          size={'md'}
                          image={
                            employeeDetail.pass_photo_path
                              ? employeeDetail.pass_photo_path?.[0]
                              : employeeDetail.user.avatar
                          }
                          text={employeeDetail.full_name}
                          supportingText={employeeDetail.user.email}
                          statusIcon={true}
                        />
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
                              <FilePlus02Icon className="h-4 w-4 stroke-gray-700" />
                              Add New Contract
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <UsersXIcon className="h-4 w-4 stroke-gray-700" />
                              Resign / Layoff
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
                            >
                              <Award04Icon className="h-4 w-4 stroke-gray-700" />
                              Add New Training
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <AlarmClockOffIcon className="h-4 w-4 stroke-gray-700" />
                              Request Time Off
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
                            >
                              <PhoneCall01Icon className="h-4 w-4 stroke-gray-700" />
                              Contact via WA
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              className={cn(
                                active ? 'bg-gray-50' : 'text-gray-700',
                                `group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium duration-300`,
                              )}
                            >
                              <Mail02Icon className="h-4 w-4 stroke-gray-700" />
                              Contact via EMAIL
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
                              onClick={() => {
                                sessionStorage.setItem('employee_id', employeeDetail.id)
                                sessionStorage.setItem('form_wizard_history_employee', employeeDetail.form_state)
                                router.replace(`/dashboard/internal/employee/edit/${employeeDetail.id}`)
                              }}
                            >
                              <Edit03Icon className="h-4 w-4 stroke-gray-700" />
                              Edit Employee
                            </button>
                          )}
                        </Menu.Item>
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
                              Delete Employee
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
              tabLists={[
                'Personal Identity',
                'Employment & Contract',
                'Performance Evaluation',
                'Trainings',
                'Time Off',
              ]}
              type="underline"
              size="sm"
              handleIndex={handleIndexTabs}
              index={index}
              gapLayout={true}
            >
              {/* Personal Identity */}
              <PersonalIdentity employeeDetail={employeeDetail} />
              {/* Employment & Contract */}
              <EmploymentContract employeeDetail={employeeDetail} />
              {/* Performance Evaluation */}
              <PerformanceEvaluation dataTable={performanceEvaluations} />
              {/* Trainings */}
              <Trainings employeeDetail={employeeDetail} />
              {/* Time Off */}
              <TimeOff employeeDetail={employeeDetail} />
            </HorizontalTabs>
          </>
        </div>
      </Dashboard>

      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Are you sure want to delete this employee?"
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
              onClick={deleteEmployee}
            >
              Yes, Sure
            </Button>
          </>,
        ]}
        stateModal={isOpenModal.deleteConfirmationModal}
        handleCloseModal={closeDeleteConfirmationModal}
      />
    </>
  )
}

export default EmployeeDetail

export const getServerSideProps: GetServerSideProps = async (context) => {
  const employeeId = context.params.id
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const employeeApi = new EmployeeApi(createAPIConfig(auth_token as string))
  const EmployeePerformanceConfig = new EmployeePerformanceApi(createAPIConfig(auth_token as string))
  try {
    const getEmployeeDetail = await employeeApi.employeeControllerGetEmployeeDetail(employeeId as string)

    const getEmployeeContracts = await employeeApi.employeeControllerGetEmployeeContracts(employeeId as string)

    const getPerformanceEvaluations =
      await EmployeePerformanceConfig.employeePerformanceControllerGetEmployeePerformanceAllByEmployeeId(
        employeeId as string,
      )

    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    const checkUserRole = checkIsLoggedInRoleAll(authTokenJWT.payload['role'])

    if (!checkUserRole) {
      return {
        notFound: true,
      }
    }

    // Pass data to the page via props
    return {
      props: {
        employeeDetail: getEmployeeDetail.data.data,
        employeeContracts: getEmployeeContracts.data.data,
        performanceEvaluations: getPerformanceEvaluations.data.data,
        activeSidebar: 'Employee Detail',
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
