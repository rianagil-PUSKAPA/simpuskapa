import { CalculationTaxParam, CalculationTaxResult, PaymentRequestDetail, PRTaxes } from '@/server/types/pr.dto'
import { TaxNationality, TaxParam } from '@/server/types/tax.dto'

/*
 * tax_calculation_type
 *  - CALCULATE
 *  - MANUAL
 *  - SKIP
 */

export class TaxCore {
  calculateTotalPr(pr: PaymentRequestDetail): number {
    let total = 0

    for (const project of pr.projects) {
      for (const activity of project.activities) {
        for (const budget of activity.budgets) {
          total += budget.qty * budget.pkg_qty * budget.unit_cost_value
        }
      }
    }
    return total
  }
}

export class IndividualTaxCalculationWNI extends TaxCore {
  public paymentRequests?: PaymentRequestDetail[]
  public currentPayment?: PaymentRequestDetail

  private static taxTier = [
    {
      tier: 1,
      min_cap: 0,
      max_cap: 60000000,
      tax_npwp: 2.5,
      tax_non_npwp: 3.0,
    },
    {
      tier: 2,
      min_cap: 60000000,
      max_cap: 250000000,
      tax_npwp: 7.5,
      tax_non_npwp: 9.0,
    },
    {
      tier: 3,
      min_cap: 250000000,
      max_cap: 500000000,
      tax_npwp: 12.5,
      tax_non_npwp: 15.0,
    },
    {
      tier: 4,
      min_cap: 500000000,
      max_cap: 5000000000,
      tax_npwp: 15.0,
      tax_non_npwp: 18.0,
    },
    {
      tier: 5,
      min_cap: 5000000000,
      max_cap: Number.MAX_VALUE,
      tax_npwp: 17.5,
      tax_non_npwp: 21.0,
    },
  ]

  findTierByCap(paymentTotal: number): any {
    return IndividualTaxCalculationWNI.taxTier.filter((tier) => {
      return tier.min_cap <= paymentTotal && paymentTotal < tier.max_cap
    })[0]
  }

  findTierByTierNumber(tierNumber: number): any {
    return IndividualTaxCalculationWNI.taxTier.filter((tier) => {
      return tier.tier == tierNumber
    })[0]
  }

  constructor(paymentRequests: PaymentRequestDetail[], currentPr: PaymentRequestDetail) {
    super()
    this.paymentRequests = paymentRequests
    this.currentPayment = currentPr
  }

  countTax(
    x: number,
    y: number,
    xt: string,
    yt: string,
    totalInvoice: number,
    tier: any,
    withNPWP = true,
  ): Array<number> {
    let total = 0
    let totalRequest = 0
    //console.log('TOTAL INVOICE', totalInvoice)
    //console.log('TIER', tier['tier'])

    if (tier['tier'] == 1) {
      const tier = this.findTierByTierNumber(1)
      const percentage = (withNPWP ? tier['tax_npwp'] : tier['tax_non_npwp']) / 100
      const minCap = Number(tier['min_cap'])
      const maxCap = Number(tier['max_cap'])
      console.log('PERCENTAGE', percentage)

      if (xt == '1') {
        total = totalInvoice * percentage
      } else if (xt == '2' && xt == yt) {
        total = 0
      } else if (xt == '2' && xt != yt) {
        total = (maxCap - y) * percentage
      } else {
        total = 0
      }
    } else if (tier['tier'] == 2) {
      const tier = this.findTierByTierNumber(2)
      const percentage = (withNPWP ? tier['tax_npwp'] : tier['tax_non_npwp']) / 100
      const minCap = Number(tier['min_cap'])
      const maxCap = Number(tier['max_cap'])

      if (xt == '1') {
        total = 0
      } else if (xt == '2' && xt == yt) {
        total = totalInvoice * percentage
      } else if (xt == '2' && xt != yt) {
        totalRequest = (x - minCap) * percentage
      } else if (xt == '3' && xt == yt) {
        total = 0
      } else if (xt == '3' && xt != yt) {
        total = (maxCap - y) * percentage
      } else {
        total = 0
      }
    } else if (tier['tier'] == 3) {
      const tier = this.findTierByTierNumber(3)
      const percentage = (withNPWP ? tier['tax_npwp'] : tier['tax_non_npwp']) / 100
      const minCap = Number(tier['min_cap'])
      const maxCap = Number(tier['max_cap'])

      if (xt == '1' || xt == '2') {
        total = 0
      } else if (xt == '3' && xt == yt) {
        total = totalInvoice * percentage
      } else if (xt == '3' && xt != yt) {
        totalRequest = (x - minCap) * percentage
      } else if (xt == '4' && xt == yt) {
        total = 0
      } else if (xt == '4' && xt != yt) {
        total = (maxCap - y) * percentage
      } else {
        total = 0
      }
    } else if (tier['tier'] == 4) {
      const tier = this.findTierByTierNumber(4)
      const percentage = (withNPWP ? tier['tax_npwp'] : tier['tax_non_npwp']) / 100
      const minCap = Number(tier['min_cap'])
      const maxCap = Number(tier['max_cap'])

      if (xt == '1' || xt == '2' || xt == '3') {
        total = 0
      } else if (xt == '4' && xt == yt) {
        total = totalInvoice * percentage
      } else if (xt == '4' && xt != yt) {
        totalRequest = (x - minCap) * percentage
      } else if (xt == '4' && xt == yt) {
        total = 0
      } else if (xt == '5' && xt != yt) {
        total = (maxCap - y) * percentage
      } else {
        total = 0
      }
    } else if (tier['tier'] == 5) {
      const tier = this.findTierByTierNumber(5)
      const percentage = (withNPWP ? tier['tax_npwp'] : tier['tax_non_npwp']) / 100
      const minCap = Number(tier['min_cap'])
      const maxCap = Number(tier['max_cap'])

      if (xt == '1' || xt == '2' || xt == '3' || xt == '4') {
        total = 0
      } else if (xt == '5' && xt == yt) {
        total = totalInvoice * percentage
      } else if (xt == '5' && xt !== yt) {
        totalRequest = (x - minCap) * percentage
        console.log('555555', x, minCap, percentage)
      } else {
        total = 0
      }
    }

    //console.log('=====> TAXES ====>', total, totalRequest)

    return [total != 0 ? total : totalRequest, tier['tier']]
  }

  calculate(withNPWP: boolean): CalculationTaxResult {
    console.log('CALCULATING INDIVIDUAL WNI')
    console.log(withNPWP)

    /*
     *
     *  IF a and b in the same tier calculate from total invoice
     *
     *
     */

    let num = 1
    let lastRequestTotal = 0

    const taxCalculatedResult = new CalculationTaxResult()
    taxCalculatedResult.calculation_params = new TaxParam()
    taxCalculatedResult.taxes = []

    taxCalculatedResult.calculation_params.nationality = TaxNationality.WNI
    taxCalculatedResult.calculation_params.is_organization = false
    taxCalculatedResult.calculation_params.with_ppn = false
    taxCalculatedResult.calculation_params.with_npwp = withNPWP
    taxCalculatedResult.calculation_params.tier_rule = IndividualTaxCalculationWNI.taxTier

    for (const pr of this.paymentRequests) {
      const totalInvoice = this.calculateTotalPr(pr)
      let totalPaidUpToCurrentInvoice = 0
      let totalRequestUpToCurrentInvoice = 0

      totalPaidUpToCurrentInvoice = lastRequestTotal
      totalRequestUpToCurrentInvoice = totalInvoice + lastRequestTotal

      const tax = {
        total_invoice: totalInvoice,
        tier_paid: this.findTierByCap(totalPaidUpToCurrentInvoice),
        tier_request: this.findTierByCap(totalRequestUpToCurrentInvoice),
        total_paid_invoice: totalPaidUpToCurrentInvoice,
        total_request: totalRequestUpToCurrentInvoice,
      }
      console.log(num, tax)

      const calculatedPaidTax = this.countTax(
        tax['total_request'],
        tax['total_paid_invoice'],
        tax['tier_request']['tier'],
        tax['tier_paid']['tier'],
        totalInvoice,
        tax['tier_paid'],
        withNPWP,
      )

      //console.log(num, '\x1b[33m TAX==> PAID \x1b[0m', calculatedPaidTax)

      const calculatedRequestTax = this.countTax(
        tax['total_request'],
        tax['total_paid_invoice'],
        tax['tier_request']['tier'],
        tax['tier_paid']['tier'],
        totalInvoice,
        tax['tier_request'],
        withNPWP,
      )

      console.log('P=', num, '|', '\x1b[33m CALCULATED TAX==> \x1b[0m', calculatedPaidTax, '|', calculatedRequestTax)

      console.log('=======================')

      // PAID
      if (lastRequestTotal > 0) {
        const paid = new PRTaxes()
        paid.tax_type = `PPH 23 - ${calculatedPaidTax[1]} (P)`

        const tierPaid = this.findTierByTierNumber(calculatedPaidTax[1])
        paid.percentage = tierPaid[withNPWP ? 'tax_npwp' : 'tax_non_npwp']
        paid.total_charged_tax_cap = tax['total_paid_invoice']
        paid.total_tax = calculatedPaidTax[0]

        taxCalculatedResult.taxes.push(paid)
      }

      // REQUEST
      console.log('PEEK', calculatedPaidTax[0], calculatedRequestTax[0], lastRequestTotal)
      if (calculatedPaidTax[0] != calculatedRequestTax[0] || lastRequestTotal == 0) {
        console.log('creating req')
        const req = new PRTaxes()
        req.tax_type = `PPH 23 - ${calculatedRequestTax[1]} (R)`

        const tierRequest = this.findTierByTierNumber(calculatedRequestTax[1])
        req.percentage = tierRequest[withNPWP ? 'tax_npwp' : 'tax_non_npwp']
        req.total_charged_tax_cap = tax['total_request']
        req.total_tax = calculatedRequestTax[0]

        taxCalculatedResult.taxes.push(req)
      }

      lastRequestTotal += totalInvoice

      num++
    }
    console.log(taxCalculatedResult)
    return taxCalculatedResult
  }
}

export class IndividualTaxCalculationWNA extends TaxCore {
  calculate(hasCertificateOfDomicile: boolean, payment: PaymentRequestDetail): CalculationTaxResult {
    console.log('CALCULATING EXPAT')

    const tax = new CalculationTaxResult()

    if (hasCertificateOfDomicile) {
    } else {
      tax.calculation_params.nationality = TaxNationality.WNA
      tax.calculation_params.is_organization = false
      tax.taxes = [
        {
          tax_type: 'PPH 26',
          is_tier: false,
          percentage: 20,
          total_charged_tax_cap: this.calculateTotalPr(payment),
          total_tax: this.calculateTotalPr(payment) * (20 / 100),
        } as PRTaxes,
      ]
    }

    return tax
  }
}

export class OrganizationalTaxCalculation extends TaxCore {
  private payment: PaymentRequestDetail

  constructor(currentPr: PaymentRequestDetail) {
    super()
    this.payment = currentPr
  }

  calculate(withNPWP?: boolean, serviceFee?: number): CalculationTaxResult {
    console.log('CALCULATING ORGANIZATION TAX')

    let totalTax = 0
    let totalPayment = this.calculateTotalPr(this.payment)
    let percentage = 0

    // if service fee exist mean we need to
    // 1. calculate ppn add to totalPayment
    // 2. calculate tax
    if (serviceFee) {
      totalPayment += (serviceFee * 11) / 100
      if (withNPWP) {
        totalTax += (serviceFee * 2) / 100
        percentage = 2
      } else {
        totalTax += (serviceFee * 4) / 100
        percentage = 4
      }
    } else {
      if (withNPWP) {
        totalTax += (totalPayment * 2) / 100
        percentage = 2
      } else {
        totalTax += (totalPayment * 4) / 100
        percentage = 4
      }
    }

    return {
      calculation_params: {
        with_ppn: serviceFee ? true : false,
        with_npwp: withNPWP,
        nationality: null,
        is_organization: true,
      } as TaxParam,
      taxes: [
        {
          is_tier: false,
          tax_type: 'Organization PPH 23',
          total_tax: totalTax,
          total_charged_tax_cap: totalPayment,
          percentage: percentage,
        } as PRTaxes,
      ],
    } as CalculationTaxResult
  }
}

export class TaxCalculation {
  public taxParam: TaxParam
  public paymentRequests?: PaymentRequestDetail[]

  constructor(taxParam: TaxParam) {
    this.taxParam = taxParam
  }

  setParam(param: TaxParam): TaxCalculation {
    this.taxParam = param
    return this
  }

  setPaymentRequesstHistory(paymentRequests: PaymentRequestDetail[]): TaxCalculation {
    this.paymentRequests = paymentRequests
    return this
  }

  calculate(currentPr: PaymentRequestDetail): CalculationTaxResult {
    return {
      calculation_params: {} as CalculationTaxParam,
      taxes: [
        {
          tax_type: 'NO TAX',
          total_tax: 0,
          percentage: 0,
          is_tier: false,
        } as PRTaxes,
      ],
    } as CalculationTaxResult
  }
}
