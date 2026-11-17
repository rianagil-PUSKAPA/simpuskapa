import { RequisitionFormRemainingBudget } from '@/components/calculations/RequisitionFormRemainingBudget'
import { useEffect, useState } from 'react'
import { BudgetProgramProjectListResponse } from 'sdk/api'
import { ActivityBudgetListModified } from '../BudgetNeedsList'

type TotalProgramBudget = {
  remaining: number
  pending_requested: number
  paid_total: number
}

type UseBudgetCalculationsReturn = {
  totalProgramBudget: TotalProgramBudget | null
  isCalculating: boolean
}

/**
 * Custom hook to calculate and manage budget data
 * Processes budget needs data to include remaining, pending, and paid amounts
 * @param budgetNeedsData - Raw budget needs data from API
 * @returns Processed budget data with calculations
 */
export const useBudgetCalculations = (
  budgetNeedsData?: BudgetProgramProjectListResponse,
): UseBudgetCalculationsReturn => {
  const [budgetNeedsDataModified, setBudgetNeedsDataModified] = useState<ActivityBudgetListModified[] | null>(null)
  const [totalProgramBudget, setTotalProgramBudget] = useState<TotalProgramBudget | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Process individual budget calculations
  useEffect(() => {
    const preprocessTotalData = async () => {
      if (!budgetNeedsData?.projects) return

      setIsCalculating(true)
      const dispatchers: Promise<ActivityBudgetListModified>[] = []

      for (const project of budgetNeedsData.projects) {
        for (const activity of project.activities) {
          for (const budget of activity.budgets as ActivityBudgetListModified[]) {
            const dispatcher = new Promise<ActivityBudgetListModified>(async (resolve) => {
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
      setBudgetNeedsDataModified(awaiter)
      setIsCalculating(false)
    }

    preprocessTotalData()
  }, [budgetNeedsData])

  // Calculate totals from modified budget data
  useEffect(() => {
    if (budgetNeedsDataModified) {
      const remaining = budgetNeedsDataModified.reduce((acc, cur) => acc + cur.remaining, 0)
      const pending_requested = budgetNeedsDataModified.reduce((acc, cur) => acc + cur.pending_requested, 0)
      const paid_total = budgetNeedsDataModified.reduce((acc, cur) => acc + cur.paid_total, 0)

      setTotalProgramBudget({
        remaining,
        pending_requested,
        paid_total,
      })
    }
  }, [budgetNeedsDataModified])

  return {
    totalProgramBudget,
    isCalculating,
  }
}
