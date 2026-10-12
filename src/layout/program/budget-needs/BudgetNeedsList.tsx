/* eslint-disable tailwindcss/no-custom-classname */
import { Button } from '@/components/Button'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/Modal'
import { RequisitionFormRemainingBudget } from '@/components/calculations/RequisitionFormRemainingBudget'
import { AlertTriangleIcon } from '@/components/icon/AlertTriangleIcon'
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { theme } from '@/types/themes'
import { getBudgetNeeds, getProjectActivity } from '@/utils/apiRequestHelper'
import {
  calculatePaidBudgetPerActivity,
  calculatePaidBudgetPerProject,
  calculatePendingRequestedPerActivity,
  calculatePendingRequestedPerProject,
  calculateRemainingBudgetPerActivity,
  calculateRemainingBudgetPerProject,
  calculateUnitCostPerActivity,
  calculateUnitCostPerProject,
  formatCurrency,
} from '@/utils/globalHelper'
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { resetServerContext } from 'react-beautiful-dnd'
import { ActivityBudgetList, ProgramDetailApprovalEnum, ProjectActivity } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { useRequisitionRequest } from './hooks/useRequisitionRequest'
import { useScrollbarSync } from './hooks/useScrollbarSync'

resetServerContext()

export type BudgetNeedProps = {
  slugIdentifier: string[]
  approval: ProgramDetailApprovalEnum
}

export type ActivityBudgetListModified = ActivityBudgetList & {
  id: string
  is_checked: boolean
  remaining: number
  pending_requested: number
  paid_total: number
  total_expenses?: number
  total_prs: number
  travel_expenses?: {
    perdiem?: number
    total_expenses?: number
  }
  pending_rf?: ActivityBudgetList
}
export type ProjectActivityModified = ProjectActivity & {
  budgets: ActivityBudgetListModified[]
  is_checked: boolean
}

export type ProjectBudgetsImproved = {
  code: string
  description: string
  id: string
  ordering_seq: number
  activities: ProjectActivityModified[]
  is_disabled: boolean
}

export const BudgetNeedsList = ({ slugIdentifier, approval }: BudgetNeedProps) => {
  const [programId] = slugIdentifier

  const { handleBudgetsToProcurements, handleRequisitionIdentifier, handleProjectToProcurement } = useDashboardContext()

  const { data: projectActivityDetailData, trigger: projectActivityDetailTrigger } = useSWRMutation(
    `projects/${programId}`,
    getProjectActivity,
  )

  const { data: budgetNeedsData, trigger: budgetNeedsTrigger } = useSWRMutation(
    `budget-needs/${programId}`,
    getBudgetNeeds,
  )

  const [projectBudgets, setProjectBudgets] = useState<ProjectBudgetsImproved[]>([])

  const [awaitCalculationDataIsDone, setAwaitCalculationDataIsDone] = useState(false)

  // Use custom hook for requisition request handling
  const { loadingButtonStatement, isOpenModal, setIsOpenModal, handleRequisitionRequest } = useRequisitionRequest({
    programId,
    projectBudgets,
    handleBudgetsToProcurements,
    handleProjectToProcurement,
    handleRequisitionIdentifier,
  })

  // Use custom hook for scrollbar synchronization
  useScrollbarSync(awaitCalculationDataIsDone)

  const handleActivityChange = (activityId: string, isChecked: boolean) => {
    const newBudgetNeeds = projectBudgets.map((item) => {
      if (item.activities.some((activity) => activity.id === activityId)) {
        item.activities = item.activities.map((activity) => {
          if (activity.id === activityId) {
            activity.is_checked = isChecked
            activity.budgets = activity.budgets.map((budget) => {
              budget.is_checked = isChecked
              return budget
            })
          }
          return activity
        })
      }
      return item
    })
    setProjectBudgets(newBudgetNeeds)
  }

  const handleBudgetChange = (activityId: string, budgetId: string, isChecked: boolean) => {
    let isAllChecked = true
    const newBudgetNeeds = projectBudgets.map((item) => {
      if (item.activities.some((activity) => activity.id === activityId)) {
        item.activities = item.activities.map((activity) => {
          if (activity.id === activityId) {
            activity.budgets = activity.budgets.map((budget) => {
              if (budget.id === budgetId) {
                budget.is_checked = isChecked
              }
              if (!budget.is_checked) {
                isAllChecked = false
              }
              return budget
            })
            activity.is_checked = isAllChecked
          }
          return activity
        })
      }
      return item
    })
    setProjectBudgets(newBudgetNeeds)
  }

  const updateDataSample = useCallback((dataSample: ProjectBudgetsImproved[]): ProjectBudgetsImproved[] => {
    if (!dataSample || dataSample.length === 0) {
      return []
    }

    return dataSample.map((item) => {
      const hasCheckedBudget = item.activities.some((activity) => activity.budgets.some((budget) => budget.is_checked))

      return {
        ...item,
        is_disabled: !hasCheckedBudget,
      }
    })
  }, [])

  useEffect(() => {
    projectActivityDetailTrigger()
    budgetNeedsTrigger()
  }, [])

  useEffect(() => {
    const initialProjectBudgets = projectActivityDetailData?.map((project, projectIndex) => ({
      ...project,
      is_checked: false,
      is_disabled: false,
      activities: project.activities.map((activity, activityIndex) => {
        const pureBudgetNeeds = budgetNeedsData?.projects[projectIndex].activities[activityIndex].budgets
          .filter((budget) => budget.ordering_seq !== 0)
          .map((budget) => ({
            ...budget,
            is_checked: false,
            remaining: 0,
          }))

        return {
          ...activity,
          is_checked: false,
          budgets: budgetNeedsData ? [...pureBudgetNeeds] : [],
        }
      }),
    }))
    preprocessTotalData(initialProjectBudgets as unknown as any)
  }, [projectActivityDetailData, budgetNeedsData])

  const preprocessTotalData = async (projects: ProjectBudgetsImproved[]) => {
    if (projects == undefined) return

    const dispatchers = []
    for (const project of projects) {
      for (const activity of project.activities) {
        for (const budget of activity.budgets) {
          const dispatcher = new Promise(async (resolve) => {
            const remaining = await RequisitionFormRemainingBudget.getRemainingBudget(budget.id)
            budget.remaining = remaining

            const pendingRequested = await RequisitionFormRemainingBudget.getPendingRequested(
              budget.id,
              budget.description,
            )
            budget.pending_requested = pendingRequested

            const paidTotal = await RequisitionFormRemainingBudget.getPaidBudget(budget.id, budget.description)
            budget.paid_total = paidTotal
            resolve(budget)
          })
          dispatchers.push(dispatcher)
        }
      }
    }

    const awaiter = await Promise.all(dispatchers)

    if (awaiter.length === 0) {
      setAwaitCalculationDataIsDone(false)
    } else {
      setAwaitCalculationDataIsDone(true)
    }

    setProjectBudgets(projects)
  }

  useEffect(() => {
    setProjectBudgets((prev) => updateDataSample(prev))
  }, [updateDataSample])

  if (awaitCalculationDataIsDone === false) {
    return (
      <div className="mt-10 flex items-center justify-center">
        <Loader customText="Loading budget calculation..." />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-9">
        {projectBudgets?.map((projectActivity) => (
          <div key={projectActivity.id}>
            <div className="flex items-center justify-between border-b border-b-gray-200 py-3">
              <div className="flex flex-col gap-1">
                <span className="block text-xs font-bold text-gray-500">Activity ({projectActivity.code})</span>
                <p className="text-xl font-semibold capitalize text-gray-900">{projectActivity.description}</p>
              </div>
              {approval !== null ? (
                <div className="inline-flex items-center gap-6">
                  <p>Total Budget</p>
                  <Menu as="div" className="relative inline-block w-[22rem] text-left">
                    <Menu.Button className="button secondary w-full grow justify-between gap-2 border border-gray-300 bg-white px-4 py-1.5 text-base !font-extrabold text-gray-600 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300">
                      <div className="inline-flex grow items-center gap-3">
                        <p className="font-extrabold">Rp</p>
                        <p className="w-56 text-right text-2xl">
                          {formatCurrency('IDR', calculateUnitCostPerProject(projectActivity), true)}
                        </p>
                      </div>
                      <div className="shrink-0 p-2">
                        <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
                      </div>
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
                        <Menu.Item>
                          <div className="w-full p-4 2xl:px-6">
                            <span className="mb-1 block text-xs font-semibold text-gray-400">Total Budget Cost</span>
                            <div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Rp</p>
                                <p className="text-sm font-bold text-gray-600">
                                  {formatCurrency('IDR', calculateUnitCostPerProject(projectActivity), true)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div className="w-full p-4 2xl:px-6">
                            <span className="mb-1 block text-xs font-semibold text-gray-400">
                              Total Remaining Budget
                            </span>
                            <div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Rp</p>
                                <p className="text-sm font-bold text-gray-600">
                                  {formatCurrency('IDR', calculateRemainingBudgetPerProject(projectActivity), true)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div className="w-full p-4 2xl:px-6">
                            <span className="mb-1 block text-xs font-semibold text-gray-400">
                              Total Pending Requested
                            </span>
                            <div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Rp</p>
                                <p className="text-sm font-bold text-gray-600">
                                  {formatCurrency('IDR', calculatePendingRequestedPerProject(projectActivity), true)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Menu.Item>
                        <Menu.Item>
                          <div className="w-full p-4 2xl:px-6">
                            <span className="mb-1 block text-xs font-semibold text-gray-400">Total Payment</span>
                            <div>
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Rp</p>
                                <p className="text-sm font-bold text-gray-600">
                                  {formatCurrency('IDR', calculatePaidBudgetPerProject(projectActivity), true)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              ) : (
                <div className="inline-flex items-center gap-6">
                  <p>Total</p>
                  <div className="w-56">
                    <p className="text-end text-2xl font-extrabold text-gray-600">
                      {formatCurrency('IDR', calculateUnitCostPerProject(projectActivity))}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {approval === 'success' ? (
              <div className="sticky top-0 z-10 flex justify-end border-b border-b-gray-200 bg-white py-[18px]">
                <div className="inline-flex items-center gap-3">
                  <p className="mr-9 text-gray-600">Create Request Form</p>
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="secondary-gray"
                    isLoading={loadingButtonStatement.pc}
                    onClick={() => handleRequisitionRequest('PC', projectActivity.code)}
                  >
                    Procurement Req (PC)
                  </Button>
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="secondary-gray"
                    isLoading={loadingButtonStatement.tr}
                    onClick={() => handleRequisitionRequest('TR', projectActivity.code)}
                  >
                    Travel Req (TR)
                  </Button>
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="secondary-gray"
                    isLoading={loadingButtonStatement.ph}
                    onClick={() => handleRequisitionRequest('PH', projectActivity.code)}
                  >
                    Personnel Hire Req (PH)
                  </Button>
                  <Button
                    type="button"
                    btnType="normal"
                    size="md"
                    variant="secondary-gray"
                    isLoading={loadingButtonStatement.sc}
                    onClick={() => handleRequisitionRequest('SC', projectActivity.code)}
                  >
                    Staff Cost
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="mt-6 border-l-4 border-l-primary-300 pb-3 pl-10 pt-4">
              <Accordion
                type="multiple"
                className="flex w-full flex-col"
                defaultValue={[...projectActivity.activities.map((activity) => activity.id)]}
              >
                {projectActivity.activities.map((activity) => (
                  <AccordionItem key={activity.id} value={activity.id} className="border-b border-b-gray-200 py-0">
                    <div className="flex w-full items-center gap-4 py-6">
                      <span className="rounded bg-gray-100 px-8 py-0.5 font-semibold leading-6 text-gray-900">
                        {activity.code}
                      </span>
                      <div className="flex grow flex-wrap">
                        <p className="text-left font-semibold text-gray-900">{activity.description}</p>
                      </div>
                      <Menu as="div" className="relative inline-block w-72 text-left">
                        <Menu.Button className="button secondary w-full grow justify-between gap-2 border border-gray-300 bg-white px-4 py-1.5 text-base !font-extrabold text-gray-600 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300">
                          <div className="inline-flex grow items-center gap-3">
                            <p>Rp</p>
                            <p className="w-40 text-right">
                              {formatCurrency('IDR', calculateUnitCostPerActivity(activity), true)}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
                          </div>
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
                            <Menu.Item>
                              <div className="w-full p-4 2xl:px-6">
                                <span className="mb-1 block text-xs font-semibold text-gray-400">
                                  Total Budget Cost
                                </span>
                                <div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">Rp</p>
                                    <p className="text-sm font-bold text-gray-600">
                                      {formatCurrency('IDR', calculateUnitCostPerActivity(activity), true)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div className="w-full p-4 2xl:px-6">
                                <span className="mb-1 block text-xs font-semibold text-gray-400">
                                  Total Remaining Budget
                                </span>
                                <div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">Rp</p>
                                    <p className="text-sm font-bold text-gray-600">
                                      {formatCurrency('IDR', calculateRemainingBudgetPerActivity(activity), true)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div className="w-full p-4 2xl:px-6">
                                <span className="mb-1 block text-xs font-semibold text-gray-400">
                                  Total Pending Requested
                                </span>
                                <div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">Rp</p>
                                    <p className="text-sm font-bold text-gray-600">
                                      {formatCurrency('IDR', calculatePendingRequestedPerActivity(activity), true)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Menu.Item>
                            <Menu.Item>
                              <div className="w-full p-4 2xl:px-6">
                                <span className="mb-1 block text-xs font-semibold text-gray-400">Total Payment</span>
                                <div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">Rp</p>
                                    <p className="text-sm font-bold text-gray-600">
                                      {formatCurrency('IDR', calculatePaidBudgetPerActivity(activity), true)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Menu.Item>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                      <AccordionTrigger>
                        <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
                          <div className="transition-transform duration-200 group-data-[state=open]:rotate-180">
                            <ChevronDownIcon className="h-5 w-5 stroke-gray-700" />
                          </div>
                        </Button>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <div className="table-container">
                        <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                        <div className="table-wrapper overflow-x-auto py-0 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                          {activity.budgets.length > 0 && (
                            <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                              <div className="border-y border-y-gray-200 bg-gray-50">
                                <div className="flex items-center">
                                  {approval === 'success' ? (
                                    <div className="flex w-16 justify-center">
                                      <input
                                        type="checkbox"
                                        value="parent"
                                        className="input-checkbox"
                                        checked={activity.is_checked || false}
                                        onChange={(e) => handleActivityChange(activity.id, e.target.checked)}
                                        disabled={
                                          activity.budgets
                                            .map((budget) =>
                                              budget.qty * budget.pkg_qty * budget.unit_cost_value -
                                                budget.paid_total <=
                                              0
                                                ? true
                                                : false,
                                            )
                                            .includes(true)
                                            ? true
                                            : false
                                        }
                                      />
                                    </div>
                                  ) : null}
                                  <div
                                    className={cn(
                                      'sticky left-0 w-28 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6',
                                      approval === 'success' ? '' : 'pl-6',
                                    )}
                                  >
                                    No
                                  </div>
                                  <div className="sticky left-28 w-52 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Description
                                  </div>
                                  <div className="w-40 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Vendor Type
                                  </div>
                                  <div className="w-40 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Vendor Category
                                  </div>
                                  <div className="w-20 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Qty
                                  </div>
                                  <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Unit
                                  </div>
                                  <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Pckg Qty
                                  </div>
                                  <div className="w-28 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Pckg Unit
                                  </div>
                                  <div className="w-48 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Unit Cost
                                  </div>
                                  <div className="sticky right-0 w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Total Budget Cost
                                  </div>
                                  <div className="sticky right-0 w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Remaining Budget
                                  </div>
                                  <div className="sticky right-0 w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Pending Requested
                                  </div>
                                  <div className="sticky right-0 w-48 bg-gray-50 px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6">
                                    Total Payment
                                  </div>
                                </div>
                              </div>
                              <div className="divide-y divide-gray-200">
                                {activity.budgets?.map((budget, budgetIndex) => (
                                  <div
                                    className={cn(
                                      'flex items-center',
                                      budget.remaining != null && budget.remaining <= 0 ? 'bg-error-200' : '',
                                    )}
                                    key={budget.id}
                                  >
                                    {approval === 'success' ? (
                                      <div className="flex w-16 justify-center">
                                        <input
                                          type="checkbox"
                                          id={budget.id}
                                          data-testid={budget.code}
                                          checked={budget?.is_checked || false}
                                          value="child"
                                          className="input-checkbox disabled:cursor-not-allowed"
                                          onChange={(e) => handleBudgetChange(activity.id, budget.id, e.target.checked)}
                                          disabled={!budget.remaining}
                                        />
                                      </div>
                                    ) : null}
                                    <div
                                      className={cn(
                                        'sticky left-0 w-28 p-4 2xl:px-6',
                                        approval === 'success' ? '' : 'pl-6',
                                        budget.remaining != null && budget.remaining <= 0 ? 'bg-error-200' : 'bg-white',
                                      )}
                                    >
                                      {`${activity.code}-${budgetIndex < 9 ? 0 : ''}${budgetIndex + 1}`}
                                    </div>
                                    <div
                                      className={cn(
                                        'sticky left-28 w-52 p-4 2xl:px-6',
                                        budget.remaining != null && budget.remaining <= 0 ? 'bg-error-200' : 'bg-white',
                                      )}
                                    >
                                      <p>{budget.description}</p>
                                    </div>
                                    <div className="w-40 p-4 capitalize 2xl:px-6">
                                      {budget.vendor_category_information.vendor_type.name}
                                    </div>
                                    <div className="w-40 p-4 capitalize 2xl:px-6">
                                      {budget.vendor_category_information.name}
                                    </div>
                                    <div className="w-20 p-4 2xl:px-6">{budget.qty}</div>
                                    <div className="w-28 p-4 lowercase 2xl:px-6">{budget.unit}</div>
                                    <div className="w-28 p-4 2xl:px-6">{budget.pkg_qty}</div>
                                    <div className="w-28 p-4 lowercase 2xl:px-6">{budget.pkg_unit}</div>
                                    <div className="w-48 p-4 2xl:px-6">
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>{formatCurrency('IDR', budget.unit_cost_value, true)}</p>
                                      </div>
                                    </div>
                                    <div className="w-48 p-4 2xl:px-6">
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>
                                          {formatCurrency(
                                            'IDR',
                                            budget.qty * budget.pkg_qty * budget.unit_cost_value,
                                            true,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="w-48 p-4 2xl:px-6">
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>{formatCurrency('IDR', budget.remaining, true)}</p>
                                      </div>
                                    </div>
                                    <div className="w-48 p-4 2xl:px-6">
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>{formatCurrency('IDR', budget.pending_requested, true)}</p>
                                      </div>
                                    </div>
                                    <div
                                      className={cn(
                                        'sticky right-0 w-48 p-4 2xl:px-6',
                                        budget.remaining != null && budget.remaining <= 0 ? 'bg-error-200' : 'bg-white',
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <p>Rp</p>
                                        <p>{formatCurrency('IDR', budget.paid_total, true)}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>

      {/* Procurement Request Modal */}
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle="Can't make Procurement Request"
        modalDescription=""
        stateModal={isOpenModal.procurementRequest}
        modalSizeStyles="max-w-[25rem]"
        handleCloseModal={() =>
          setIsOpenModal((prev) => ({
            ...prev,
            procurementRequest: false,
          }))
        }
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>Your request have budget need items that contain wrong vendor type.</li>
            <li>Procurement request Can't process budget needs that have “Consultant” category.</li>
            <li>If want to make request for consultant please make “Personnel Hire Request”</li>
          </ul>
        </div>
        <Button
          type="button"
          btnType="normal"
          variant="secondary-gray"
          className="mt-8 w-full justify-center"
          size="lg"
          onClick={() =>
            setIsOpenModal((prev) => ({
              ...prev,
              procurementRequest: false,
            }))
          }
        >
          Back to Budget Needs
        </Button>
      </Modal>

      {/* Travel Request Modal */}
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle="Can't make Travel Request"
        modalDescription=""
        stateModal={isOpenModal.travelRequest}
        modalSizeStyles="max-w-[25rem]"
        handleCloseModal={() =>
          setIsOpenModal((prev) => ({
            ...prev,
            travelRequest: false,
          }))
        }
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>Your request have budget need items that contain wrong category.</li>
            <li>Travel request only can created with budget needs that have “Travels” category only.</li>
          </ul>
        </div>
        <Button
          type="button"
          btnType="normal"
          variant="secondary-gray"
          className="mt-8 w-full justify-center"
          size="lg"
          onClick={() =>
            setIsOpenModal((prev) => ({
              ...prev,
              travelRequest: false,
            }))
          }
        >
          Back to Budget Needs
        </Button>
      </Modal>

      {/* Personal Hire Request Modal */}
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle="Can't make Personnel Hire Request"
        modalDescription=""
        stateModal={isOpenModal.personalHireRequest}
        modalSizeStyles="max-w-[25rem]"
        handleCloseModal={() =>
          setIsOpenModal((prev) => ({
            ...prev,
            personalHireRequest: false,
          }))
        }
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>Your request have budget need items that contain wrong type.</li>
            <li>Personnel hire request only can created with budget needs that have “Consultant” type only</li>
          </ul>
        </div>
        <Button
          type="button"
          btnType="normal"
          variant="secondary-gray"
          className="mt-8 w-full justify-center"
          size="lg"
          onClick={() =>
            setIsOpenModal((prev) => ({
              ...prev,
              personalHireRequest: false,
            }))
          }
        >
          Back to Budget Needs
        </Button>
      </Modal>

      {/* Staff Cost Request Modal */}
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle="Can't make Staff Cost"
        modalDescription=""
        stateModal={isOpenModal.staffCost}
        modalSizeStyles="max-w-[25rem]"
        handleCloseModal={() =>
          setIsOpenModal((prev) => ({
            ...prev,
            staffCost: false,
          }))
        }
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>Your request have budget need items that contain wrong type.</li>
            <li>Staff cost only can created with budget needs that have “Staff Cost” type only</li>
          </ul>
        </div>
        <Button
          type="button"
          btnType="normal"
          variant="secondary-gray"
          className="mt-8 w-full justify-center"
          size="lg"
          onClick={() =>
            setIsOpenModal((prev) => ({
              ...prev,
              staffCost: false,
            }))
          }
        >
          Back to Budget Needs
        </Button>
      </Modal>

      {/* Multiple Perdiem Error Modal */}
      <Modal
        icon={<AlertTriangleIcon className="h-6 w-6 stroke-error-600" />}
        theme={theme.ERROR}
        modalTitle="Choose only one perdiem or one others"
        modalDescription=""
        stateModal={isOpenModal.doublePerdiem}
        modalSizeStyles="max-w-[25rem]"
        handleCloseModal={() =>
          setIsOpenModal((prev) => ({
            ...prev,
            doublePerdiem: false,
          }))
        }
      >
        <div className="mt-1 text-sm text-gray-600">
          <ul className="flex list-disc flex-col gap-0.5 px-6">
            <li>Can't create more than one perdiem, because it's not allowed</li>
            <li>Can't create more than one other category, because it's not allowed</li>
          </ul>
        </div>
        <Button
          type="button"
          btnType="normal"
          variant="secondary-gray"
          className="mt-8 w-full justify-center"
          size="md"
          onClick={() =>
            setIsOpenModal((prev) => ({
              ...prev,
              doublePerdiem: false,
            }))
          }
        >
          Close
        </Button>
      </Modal>
    </>
  )
}
