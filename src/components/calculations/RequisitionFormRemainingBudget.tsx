/* eslint-disable @typescript-eslint/no-unused-vars */
import { programApi, requisitionFormApi } from '@/utils/apiRequestHelper'
import { LazyCalculationWidget, LazyCalculationWidgetProps } from './LazyCalculationWidget'

export class RequisitionFormRemainingBudgetCalculationParam {
  rfId: string
  budgetId: string
}

export class RequisitionFormRemainingBudget extends LazyCalculationWidget {
  /*
   * this class calculate `Remaining Budget` on rf budget list
   * this calculation is acrros all rf contains same budget
   * identified by budget id
   * */
  constructor(props: LazyCalculationWidgetProps) {
    super(props)
    this.setCalculationParam(this.props.calculationProp)
  }

  async calculate(): Promise<number> {
    const calcParam = this.calculationParam as RequisitionFormRemainingBudgetCalculationParam

    const response = await requisitionFormApi.rFControllerCalculateRfRemainingBudget(calcParam.rfId, calcParam.budgetId)
    return response.data.data as unknown as number
  }

  static async getRemainingBudget(budgetId: string): Promise<number> {
    const response = await requisitionFormApi.rFControllerCalculateRfRemainingBudget('', budgetId)
    return response.data.data as unknown as number
  }

  static async getPendingRequested(budgetId: string, label: string): Promise<number> {
    const response = await programApi.programControllerGetPendingRequestedBudget(budgetId)
    // console.log('pending_requested', label, response.data)
    return response.data.data as unknown as number
  }
  static async getPaidBudget(budgetId: string, label: string): Promise<number> {
    const response = await programApi.programControllerGetPaidBudget(budgetId)
    // console.log('paid_budget', label, response.data)
    return response.data.data as unknown as number
  }
}
