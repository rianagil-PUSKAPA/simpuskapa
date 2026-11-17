import { createAPIConfig, createAxiosInstance } from '@/utils/apiAuthToken'
import { ProgramApi } from 'sdk/api'
import { LazyCalculationWidget, LazyCalculationWidgetProps } from './LazyCalculationWidget'

export class RemainingBudgetByActivityIdParam {
  totalBudgetCost: number
  activity: string
}

export class RemainingBudgetByActivityId extends LazyCalculationWidget {
  /*
   * this class calculate `Remaining Budget` on rf budget list
   * this calculation is acrros all rf contains same budget
   * identified by activity id
   * */
  api = new ProgramApi(createAPIConfig(), '', createAxiosInstance())
  constructor(props: LazyCalculationWidgetProps) {
    super(props)
    this.setCalculationParam(this.props.calculationProp)
  }

  async calculate(): Promise<number> {
    // const calcParam = this.calculationParam as RemainingBudgetByActivityIdParam

    return 0
  }
}
