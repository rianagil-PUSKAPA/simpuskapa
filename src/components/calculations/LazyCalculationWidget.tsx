import { CurrencyUnion } from '@/types/global'
import { formatCurrency } from '@/utils/globalHelper'
import { Component } from 'react'

export class LazyCalculationWidgetState {
  isLoading: boolean
  totalAmount: number
}

export class LazyCalculationWidgetProps {
  currency: CurrencyUnion
  calculationProp: any
}

export class LazyCalculationWidget extends Component<LazyCalculationWidgetProps, LazyCalculationWidgetState> {
  /*
   * this is view handler to display preloading while calculation
   * calculation results are cached in the api for 5s TTL
   * */
  calculationParam: any
  state: LazyCalculationWidgetState = {
    isLoading: false,
    totalAmount: 0,
  }
  constructor(props: LazyCalculationWidgetProps) {
    super(props)
    this.setIsLoading(true)
    this.calculateHandler()
  }

  setCalculationParam(param: any) {
    this.calculationParam = param
  }

  setIsLoading(state: boolean): void {
    this.state.isLoading = state
  }

  setTotalAmount(total: number): void {
    this.state.totalAmount = total
  }

  async calculate(): Promise<number> {
    return 0
  }

  async calculateHandler(): Promise<void> {
    setTimeout(() => {
      this.calculate()
        .then((total) => {
          // console.log('calculation done')
          this.setTotalAmount(total)
        })
        .catch((err) => {
          console.error('calculation error', err)
          console.error(err)
        })
        .finally(() => {
          this.setIsLoading(false)
          this.forceUpdate()
        })
    }, 2000)
  }

  render() {
    if (this.state.isLoading) {
      return 'Loading...'
    } else {
      return formatCurrency(this.props.currency, this.state.totalAmount, true)
    }
  }
}
