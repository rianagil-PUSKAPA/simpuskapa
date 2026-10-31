import { ActivityBudgetListImproved } from '@/layout/procurement/ProcurementRequest'
import { ActivityBudgetListModified, ProjectBudgetsImproved } from '@/layout/program/budget-needs/BudgetNeedsList'
import { RequisitionFormEnum, RequisitionIdentifierType } from '@/shared/rf.type'
import { BucketsUnion, CurrencyUnion } from '@/types/global'
import { BudgetPayment } from '@/types/payment-request'
import { RolesAnnonateType, VendorAnnonateType } from '@/types/vendor'
import { BudgetProgramProjectListResponse } from '@sdk'
import dayjs from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { getCookie } from 'typescript-cookie'
import { getOpenUrl } from './apiRequestHelper'
import { ADMIN, HR_TEAM, STAFF, SUPERADMIN, SUPERVISOR, VENDOR_TYPES } from './constant'

dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)
dayjs.extend(dayOfYear)

export const slugify = <T>(text: T) => {
  return text
    ?.toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const convertBodyAPI = <T>(body: T) => JSON.parse(JSON.stringify(body))

export const getLocalCookie = (value: string) => {
  if (typeof document !== 'undefined') {
    return getCookie(value)
  } else {
    return null
  }
}
export const getLocalSession = (value: string) => {
  if (typeof document !== 'undefined') {
    return sessionStorage.getItem(value)
  } else {
    return ''
  }
}

export const snakeCase = (value: string) => {
  if (!value) return ''
  return value
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('_')
}

export const titleCase = (s: string) =>
  (s && String(s))?.replace(/^_*(.)|_+(.)/g, (s, c, d) => (c ? c.toUpperCase() : ' ' + d.toUpperCase()))

export const dateFormatToISO = (value: string) => new Date(value).toISOString()

export const generateArrayOfYears = (type: 'past' | 'future') => {
  let max = null
  let min = null
  const years = []

  switch (type) {
    case 'past':
      max = new Date().getFullYear()
      min = max - 70

      for (let i = max; i >= min; i--) {
        years.push(i)
      }
      break
    case 'future':
      min = new Date().getFullYear()
      max = min + 70

      for (let i = min; i <= max; i++) {
        years.push(i)
      }
      break

    default:
      break
  }

  return years
}

export const capitalizeFirstLetter = (value: string) => {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const getWeekOfYear = (year: number, week: number) => {
  let firstMondayOfYear = dayjs().year(year).isoWeek(week).day(1)

  if (firstMondayOfYear.year() !== year) {
    firstMondayOfYear = firstMondayOfYear.add(7, 'days')
  }
  return new Array(5).fill(firstMondayOfYear).map((day, idx) => day.add(idx, 'day').format('dddd, DD MMMM YYYY'))
}

export const handleFilterDate = (isWeekday: boolean, date: Date) => {
  const day = dayjs(date).day()

  if (isWeekday) {
    return day !== 0 && day !== 6
  } else {
    return true
  }
}

export const generateDates = (startDate: Date, endDate: Date) => {
  const dates = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

export const checkIsLoggedInRoleAll = (role: string) => {
  let result = true

  switch (role) {
    case STAFF:
      result = false
      break
    case SUPERVISOR:
      result = false
      break
    case HR_TEAM:
      result = true
      break
    case ADMIN:
      result = true
      break
    case SUPERADMIN:
      result = true
      break
    default:
      break
  }

  return result
}

export const vendorBadgeColor = (parameter: VendorAnnonateType) => {
  let theme = null
  switch (parameter) {
    case 'insurance':
      theme = 'success'
      break
    case 'auditor':
      theme = 'blue'
      break
    case 'contractor':
      theme = 'pink'
      break
    case 'other':
      theme = 'blue-gray'
      break
    case 'translator':
      theme = 'success'
      break
    case 'interpreter':
      theme = 'success'
      break
    case 'sign-language':
      theme = 'success'
      break
    case 'transcriber':
      theme = 'blue'
      break
    case 'notulen':
      theme = 'blue'
      break
    case 'proofreader':
      theme = 'blue'
      break
    case 'mc':
      theme = 'pink'
      break
    case 'key-person':
      theme = 'pink'
      break
    case 'moderator':
      theme = 'pink'
      break
    case 'designer':
      theme = 'purple'
      break
    case 'editor':
      theme = 'purple'
      break
    case 'photographer':
      theme = 'orange'
      break
    case 'videographer':
      theme = 'orange'
      break
    case 'consultant':
      theme = 'success'
      break
    case 'online-services':
      theme = 'success'
      break
    case 'software':
      theme = 'blue'
      break
    case 'food-services':
      theme = 'blue'
      break
    case 'room-rental':
      theme = 'pink'
      break
    case 'transportation':
      theme = 'purple'
      break
    case 'itemtools-rental':
      theme = 'orange'
      break
    case 'travel-agent':
      theme = 'indigo'
      break
    case 'event-organizer':
      theme = 'indigo'
      break
    case 'atk':
      theme = 'success'
      break
    case 'itperipherals':
      theme = 'blue'
      break
    case 'printing':
      theme = 'pink'
      break
    case 'equipment':
      theme = 'purple'
      break
    case 'vehicle-rental':
      theme = 'purple'
      break
    case 'airfare':
      theme = 'success'
      break
    case 'perdiem':
      theme = 'blue'
      break
    case 'transportation':
      theme = 'pink'
      break
    case 'accommodation':
      theme = 'orange'
      break
    default:
      theme = 'blue-gray'
      break
  }

  return theme
}
export const rolesBadgeColor = (parameter: RolesAnnonateType) => {
  let theme = null
  switch (parameter) {
    case 'Staff':
      theme = 'success'
      break
    case 'Superadmin':
      theme = 'blue'
      break
    case 'Admin':
      theme = 'pink'
      break
    case 'Supervisor':
      theme = 'orange'
      break
    case 'Ops Team':
      theme = 'indigo'
      break
    case 'Head of Operation':
      theme = 'indigo'
      break
    case 'General Manager':
      theme = 'blue'
      break
    case 'Grant Manager':
      theme = 'blue'
      break
    case 'Program Manager':
      theme = 'blue'
      break
    case 'Program Officer':
      theme = 'orange'
      break
    case 'Head of Finance':
      theme = 'indigo'
      break
    case 'Finance Team':
      theme = 'purple'
      break
    case 'Program Team':
      theme = 'purple'
      break
    case 'Comms Team':
      theme = 'purple'
      break
    case 'Knowledge Team':
      theme = 'gray'
      break
    default:
      theme = 'gray'
      break
  }

  return theme
}

export const formatCurrency = (format: CurrencyUnion, value: number, isRemoveCurrency = false) => {
  if (format === 'IDR') {
    if (isRemoveCurrency) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      })
        .format(value)
        .replace('Rp', '')
        .trim()
    } else {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(value)
    }
  } else if (format === 'USD') {
    if (isRemoveCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      })
        .format(value)
        .replace('$', '')
        .trim()
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value)
    }
  } else if (format === 'AUD') {
    if (isRemoveCurrency) {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
      })
        .format(value)
        .replace('$', '')
        .trim()
    } else {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
      }).format(value)
    }
  }
}

export const getAlphabetLetter = (number: number): string | undefined => {
  if (number >= 1 && number <= 26) {
    // Convert the number to the corresponding alphabet letter.
    const letter = String.fromCharCode(64 + number) // 65 is the ASCII code for 'A'

    return letter
  } else {
    // Handle the case when the number is out of range (1-26).
    return undefined
  }
}

export const monthStringToNumber = (month: string): number | undefined => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const monthIndex = monthNames.findIndex((monthName) => monthName.toLowerCase() === month.toLowerCase())

  if (monthIndex !== -1) {
    // Adding 1 because JavaScript months are 0-based (January is 0).
    return monthIndex + 1
  } else {
    return undefined // Invalid month string
  }
}

export const monthNumberToString = (monthNumber: number): string | undefined => {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  if (monthNumber >= 1 && monthNumber <= 12) {
    return monthNames[monthNumber - 1]
  } else {
    return undefined // Invalid month number
  }
}

export const getMonthDuration = (startDate: Date, endDate: Date): number => {
  const startYear = startDate.getFullYear()
  const startMonth = startDate.getMonth()
  const endYear = endDate.getFullYear()
  const endMonth = endDate.getMonth()

  return (endYear - startYear) * 12 + (endMonth - startMonth)
}

export const calculateUnitCostPerProject = (project) => {
  const activities = project.activities
  const totalUnitCost = activities.reduce((acc, activity) => {
    const budgets = activity.budgets
    const activityUnitCost = budgets?.reduce((activityAcc, budget) => {
      const { unit_cost_value, pkg_qty, qty } = budget
      return activityAcc + unit_cost_value * pkg_qty * qty
    }, 0)
    return acc + activityUnitCost
  }, 0)
  return totalUnitCost
}

// Function to calculate unit_cost_value per activity
export const calculateUnitCostPerActivity = (activity) => {
  const budgets = activity.budgets
  const activityUnitCost = budgets?.reduce((acc, budget) => {
    const { unit_cost_value, pkg_qty, qty } = budget
    return acc + unit_cost_value * pkg_qty * qty
  }, 0)
  return activityUnitCost
}
export const calculateRemainingBudgetPerActivity = (activity) => {
  const total = activity.budgets?.reduce((acc, budget) => {
    return acc + budget.remaining
  }, 0)
  // console.log('remain', total)
  return total
}
export const calculateRemainingBudgetPerProject = (project: ProjectBudgetsImproved) => {
  const total = project.activities.map((activity) =>
    activity.budgets?.reduce((acc, budget) => {
      return acc + budget.remaining
    }, 0),
  )

  // console.log('remain', total)
  return total.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
}

export const calculatePaidBudgetPerActivity = (activity) => {
  const total = activity.budgets?.reduce((acc, budget) => {
    // console.log('paid activity', budget.paid_total)
    return acc + budget.paid_total
  }, 0)
  return total
}

export const calculatePaidBudgetPerProject = (project: ProjectBudgetsImproved) => {
  const total = project.activities.map((activity) =>
    activity.budgets?.reduce((acc, budget) => {
      return acc + budget.paid_total
    }, 0),
  )

  return total.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
}

export const calculatePendingRequestedPerActivity = (activity) => {
  const total = activity.budgets?.reduce((acc, budget) => {
    return acc + budget.pending_requested
  }, 0)
  return total
}
export const calculatePendingRequestedPerProject = (project: ProjectBudgetsImproved) => {
  const total = project.activities.map((activity) =>
    activity.budgets?.reduce((acc, budget) => {
      if (budget.pending_requested == undefined) {
        return acc + 0
      }
      return acc + budget.pending_requested
    }, 0),
  )

  return total.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
}
export const calculateAdvancePaymentPerActivity = (budgets) => {
  const activityUnitCost = budgets?.reduce((acc, budget) => acc + budget.advance_payment_total, 0)
  return activityUnitCost
}

export const calculateBudgetsEachBudgetActivity = (data) => {
  if (Object.keys(data).length === 0) return false

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const activities = data[key].activities

      for (const activity of activities) {
        const budgets = activity.budgets

        for (const budget of budgets) {
          const qty = parseFloat(budget.qty)
          const pkgQty = parseFloat(budget.pkg_qty)
          const unitCostValue = parseFloat(budget.unit_cost_value)

          if (isNaN(qty) || isNaN(pkgQty) || isNaN(unitCostValue)) {
            return false
          }

          if (qty * pkgQty * unitCostValue === 0) {
            return false
          }
        }
      }
    }
  }

  return true
}

export const calculateTotalBudget = (budgetNeeds) => {
  let totalBudget = 0
  for (const project of budgetNeeds.projects) {
    for (const activity of project.activities) {
      for (const budget of activity.budgets) {
        totalBudget += budget.qty * budget.pkg_qty * budget.unit_cost_value
      }
    }
  }
  return totalBudget
}

export const calculateTotalAdvancePaymentRequest = (budgetNeeds) => {
  let totalBudget = 0
  for (const project of budgetNeeds.projects) {
    for (const activity of project.activities) {
      for (const budget of activity.budgets) {
        totalBudget += budget.advance_payment_total
      }
    }
  }
  return totalBudget
}

export const copyCheckedBudgetsWithActivities = (projects) => {
  return projects.flatMap((project) =>
    project.activities
      .filter((activity) => activity.budgets.some((budget) => budget.is_checked))
      .map((activity) => ({
        ...activity,
        budgets: activity.budgets.filter((budget) => budget.is_checked),
      })),
  )
}

export const isVendorValueExistInCollection = (value: string) => {
  let mergedArray = []

  for (const key in VENDOR_TYPES) {
    mergedArray = [...mergedArray, ...VENDOR_TYPES[key]]
  }

  if (mergedArray.map((item: string) => item.toLowerCase()).includes(value)) {
    return true
  } else {
    return false
  }
}

export function capitalizeOfString(sentence: string): string {
  if (sentence === '' || sentence === undefined) return sentence

  const lowercaseWords = [
    'a',
    'an',
    'and',
    'as',
    'at',
    'but',
    'by',
    'for',
    'in',
    'nor',
    'of',
    'on',
    'or',
    'so',
    'the',
    'to',
    'up',
    'yet',
  ]

  switch (sentence) {
    case 'Pr':
      return 'PR'
    case 'Apr':
      return 'APR'
    case 'Te':
      return 'TE'
    case 'Apf':
      return 'APF'
    case 'Aps':
      return 'APS'
    case 'Bdo':
      return 'BDO'
    case 'Atk':
      return 'ATK'
    case 'It/peripherals':
      return 'IT/Peripherals'
    case 'Pc':
      return 'PC'
    case 'Ph':
      return 'PH'
    case 'Tr':
      return 'TR'
    case 'Rf type':
      return 'RF Type'
    case 'Idr':
      return 'IDR'
    case 'Usd':
      return 'USD'
    case 'Aud':
      return 'AUD'
    case 'Pic position':
      return 'PIC Position'
  }

  return sentence
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0 || !lowercaseWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      return word
    })
    .join(' ')
}

export const convertStringCurrency = (stringCurrency: string | number) => {
  return Number(String(stringCurrency).replace(/\./g, '').replace(',', '.'))
}

export const calculateTotalBudgetProcurement = (procurements) => {
  if (!procurements) return

  let totalBudget = 0

  for (const procurement of procurements) {
    for (const budget of procurement.budgets) {
      totalBudget += budget.qty * budget.pkg_qty * budget.unit_cost_value
    }
  }

  return totalBudget
}
export const calculateTotalBudgetAdvancePaymentRequest = (procurements) => {
  if (!procurements) return 0

  let totalBudget = 0

  for (const procurement of procurements) {
    for (const budget of procurement.budgets) {
      totalBudget += budget.advance_payment_total || 0
    }
  }

  return totalBudget
}
export const calculatePureTotalBudget = (budgets) => {
  if (budgets.length === 0) return 0

  for (const budget of budgets) {
    if (budget === undefined) return 0
  }

  let totalBudget = 0

  for (const budget of budgets) {
    totalBudget += budget.qty * budget.pkg_qty * budget.unit_cost_value
  }

  return totalBudget
}

export const extractDomainAndPath = (url: string) => {
  if (!/^http/.test(url)) {
    url = 'http://' + url
  }
  const urlObj = new URL(url)
  return `${urlObj.hostname}${urlObj.pathname}`
}

export const isEmpty = (obj) => {
  return JSON.stringify(obj) === '{}'
}

export const isNumber = (value: any) => {
  return typeof value === 'number'
}

export const slugToCamelCase = (slug) => {
  const words = slug.split('-').map((word, index) => {
    if (index === 0) {
      return word
    } else {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }
  })

  return words.join('')
}

export const isMoreThan24Hours = (inputTime) => {
  const now = dayjs()
  const inputDateTime = dayjs(inputTime)

  const diffInHours = now.diff(inputDateTime, 'hour')

  return diffInHours > 24
}

export const removeSpecialChars = (str: string) => {
  const removeSpecialChar = str.replace(/[^a-zA-Z0-9 ]/g, '')
  const removeWhiteSpaces = removeSpecialChar.trim().replace(/\s+/g, ' ')
  return removeWhiteSpaces
}

export const remainingValueCalculation = (
  realValue: number,
  remainingValue: number,
  multiplyQtyPkgQty?: number, // Special for unit_cost_value
) => {
  // Calculation special for unit_cost_value if remaining budghet exist
  if (multiplyQtyPkgQty) {
    return remainingValue / multiplyQtyPkgQty
  } else {
    // Special for qty and pkg_qty
    const checkValue = realValue - remainingValue

    if (checkValue > 0) {
      return checkValue
    } else {
      return realValue
    }
  }
}

export const isString = (data: any) => {
  return typeof data === 'string'
}

export const requisitionType = (parameter: RequisitionIdentifierType) => {
  let value = ''
  switch (parameter) {
    case RequisitionFormEnum.PERSONAL_HIRE:
      value = 'Personnel Hire (PH)'
      break
    case RequisitionFormEnum.PROCUREMENT:
      value = 'Procurement Request (PC)'
      break
    case RequisitionFormEnum.STAFF_COST:
      value = 'Staff Cost'
      break
    case RequisitionFormEnum.TRAVEL:
      value = 'Travel Request (TR)'
      break
    default:
      break
  }
  return value
}

export const getOriginalUrlFile = async (fileName: string) => {
  if (fileName === undefined) return

  const bucketName = fileName.split('/')[0]
  const realFileName = fileName.split('/')[1]

  try {
    const result = await getOpenUrl(bucketName as BucketsUnion, realFileName, 3600 * 24, true)
    return result.url
  } catch (error) {
    return error
  }
}

export const checkIsItemExist = (arr: string[], elements: string[]) => {
  return elements.some((element) => arr?.includes(element))
}

export const transformToNormalFormat = (text: string): string => {
  if (text === '') return text

  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .split('_') // Split by underscore
    .map((word) => {
      const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      return capitalized === 'Of' ? 'of' : capitalized // Convert "Of" to "of"
    })
    .join(' ') // Join words with spaces
}

export const toCapitalizedText = (input: string): string => {
  let spaced = input.replace(/[-_]/g, ' ')

  spaced = spaced.replace(/([a-z])([A-Z])/g, '$1 $2')
  spaced = spaced.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // Handle acronyms

  return spaced
    .toLowerCase()
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')
}

export const calculateCalendarBarLinePosition = (
  startDate: string,
  endDate: string,
  rangeStart: Date,
  rangeEnd: Date,
) => {
  const timelineEndDate = Number(dayjs(endDate).format('DD'))
  const rangeStartDate = Number(dayjs(rangeStart).format('DD'))

  const startTimelineIndex = () => {
    const timelineStartDays = dayjs(startDate).dayOfYear()
    const rangeStartDays = dayjs(rangeStart).dayOfYear()

    return timelineStartDays - rangeStartDays + 1
  }

  const extendFormula = () => {
    const timelineStartDays = dayjs(startDate).dayOfYear()
    const timelineEndDays = dayjs(endDate).dayOfYear()
    const rangeStartDays = dayjs(rangeStart).dayOfYear()
    const rangeEndDays = dayjs(rangeEnd).dayOfYear()

    if (timelineEndDays >= rangeStartDays && timelineEndDays <= rangeEndDays) {
      if (startTimelineIndex() < 1) {
        // Mean from previous week
        return timelineEndDate - rangeStartDate
      } else {
        // Mean from current week
        return timelineEndDays - timelineStartDays
      }
    } else {
      // Mean out of range
      return 5 - startTimelineIndex()
    }
  }

  return `timeline-start-${startTimelineIndex()} timeline-extend-${extendFormula()}`
}

export const formatTimeLeft = (seconds) => {
  const duration = dayjs.duration(seconds, 'seconds')
  const minutes = duration.minutes()
  const secs = duration.seconds()
  return `${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} ` : ''}${
    secs > 0 ? `${secs} second${secs > 1 ? 's' : ''}` : ''
  }`.trim()
}

export const programDataBadgeStatus = (approval: string) => {
  let status = ''
  switch (approval) {
    case 'cancelled':
    case null:
      status = 'Draft'
      break
    case 'rejected':
    case 'revision':
      status = 'On Revision'
      break
    case 'pending':
      status = 'Submitted'
      break
    case 'success':
      status = 'Submitted'
      break
  }

  return status
}

export const programDataBadgeColor = (approval: string) => {
  let status = ''
  switch (approval) {
    case 'cancelled':
    case null:
      status = 'blue'
      break
    case 'rejected':
    case 'revision':
      status = 'warning'
      break
    case 'pending':
      status = 'success'
      break
    case 'success':
      status = 'success'
      break
  }

  return status
}

export const remainingBudgetRf = (
  initialBudget: ActivityBudgetListModified,
  updatedBudget: ActivityBudgetListImproved,
) => {
  // console.log('initialBudget', initialBudget)
  // console.log('updatedBudget', updatedBudget)

  return (
    initialBudget.remaining -
    Number(updatedBudget?.qty || 0) * Number(updatedBudget?.pkg_qty || 0) * Number(updatedBudget?.unit_cost_value || 0)
  )
}

export const remainingBudgetPayment = (
  isEdit: string | string[] | undefined,
  initialBudget: BudgetPayment,
  updatedBudget: ActivityBudgetListModified,
) => {
  // console.log('xx-isEdit', isEdit)
  // console.log('xx-initialBudget', initialBudget)
  // console.log('xx-updatedBudget', updatedBudget)

  if (!isEdit) {
    const calculation = initialBudget.qty * initialBudget.pkg_qty * initialBudget.unit_cost_value

    const initialBudgetCalculation =
      initialBudget.total_prs > 0
        ? calculation - (initialBudget.total_prs + initialBudget.advance_payment_total)
        : calculation - initialBudget.advance_payment_total

    return (
      initialBudgetCalculation -
      Number(updatedBudget?.qty || 0) *
        Number(updatedBudget?.pkg_qty || 0) *
        Number(updatedBudget?.unit_cost_value || 0)
    )
  } else {
    const initialBudgetCalculation =
      Number(initialBudget.qty) * Number(initialBudget.pkg_qty) * Number(initialBudget.unit_cost_value) +
      initialBudget['additional_data']['remaining_budget']

    return (
      initialBudgetCalculation -
      Number(updatedBudget?.qty || 0) *
        Number(updatedBudget?.pkg_qty || 0) *
        Number(updatedBudget?.unit_cost_value || 0)
    )
  }
}

export const translateAttachmentKey = (parameter: string) => {
  let result = ''
  switch (parameter) {
    case 'invoice':
      result = 'Invoice'
      break
    case 'receipt':
      result = 'Receipt (Kuitansi / Bukti Pembayaran)'
      break
    case 'offering_letter':
      result = 'Surat Penawaran'
      break
    case 'invitation':
      result = 'Undangan'
      break
    case 'undangan':
      result = 'Undangan'
      break
    case 'tor':
      result = 'Term of References (ToR)'
      break
    case 'contract':
      result = 'Contract'
      break
    case 'kontrak':
      result = 'Contract'
      break
    case 'spk':
      result = 'SPK'
      break
    case 'bidding_doc':
      result = 'Dokumen Bidding'
      break
    case 'timesheet':
      result = 'Timesheet'
      break
    case 'work_result':
      result = 'Hasil Kerja'
      break
    case 'news_proof_handover':
      result = 'Bukti Serah Terima / Berita Acara'
      break
    case 'presentation_materials':
      result = 'Materi Presentasi'
      break
    case 'event_report':
      result = 'Event Report (AAR)'
      break
    case 'event-report-aar':
      result = 'Event Report (AAR)'
      break
    case 'attendees':
      result = 'Daftar Hadir'
      break
    case 'hasilluaran':
      result = 'Hasil Luaran'
      break
    case 'bukti-serah-terimaberita-acara':
      result = 'Bukti Serah Terima Berita Acara'
      break
    case 'receipt':
      result = 'Receipt'
      break
    case 'surat-tugas':
      result = 'Surat Tugas'
      break
    case 'e-ticket-boarding-pass':
      result = 'E ticket & Boarding Pass'
      break
    case 'e-ticket':
      result = 'E ticket'
      break
    case 'boarding-pass':
      result = 'Boarding Pass'
      break
    case 'receipt-bundle-for-transport-expenses':
      result = 'Receipt Bundle for Transport Expenses'
      break
    case 'eticket':
      result = 'E-ticket'
      break
    case 'boarding_pass':
      result = 'Boarding Pass'
      break
    case 'transport_expenses_receipt':
      result = 'Receipt Bundle for Transport Expenses'
      break
    case 'other_expenses_receipt':
      result = 'Receipt Bundle for Others Expenses'
      break
    case 'assignment_letter':
      result = 'Surat Tugas'
      break
    default:
      result = parameter
      break
  }

  return result
}

export const paymentTitle = (parameter: string) => {
  let textMessage = ''
  switch (parameter) {
    case 'APF':
      textMessage = 'Advance Perdiem Fee'
      break
    case 'APR':
      textMessage = 'Advance Payment Request'
      break
    case 'APS':
      textMessage = 'Advance Payment Statement'
      break
    case 'PR':
      textMessage = 'Payment Request'
      break
    case 'TE':
      textMessage = 'Travel Expense'
      break
    default:
      textMessage = 'Payment Request'
      break
  }

  return textMessage
}

export const getTotalBudgetCost = (budgetNeeds: BudgetProgramProjectListResponse, id: string) => {
  const budgetResult = budgetNeeds?.projects
    .flatMap((project) => project.activities.flatMap((activity) => activity.budgets.find((budget) => budget.id === id)))
    .find((item) => item?.id === id)

  if (!budgetResult) return 0

  return budgetResult.qty * budgetResult.pkg_qty * budgetResult.unit_cost_value
}

export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false

  const urlPattern = new RegExp(
    '^' +
      // protocol identifier (http, https, ftp)
      '(?:(?:https?|ftp)://)' +
      // authentication (optional)
      '(?:\\S+(?::\\S*)?@)?' +
      // hostname or IP
      '(?:' +
      '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' + // domain name
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' + // domain extension
      '(?:\\.[a-z\\u00a1-\\uffff]{2,})' + // TLD
      '|' +
      // OR IPv4 address
      '(?:\\d{1,3}\\.){3}\\d{1,3}' +
      ')' +
      // port (optional)
      '(?::\\d{2,5})?' +
      // path, query string, and fragment (optional)
      '(?:/[^\\s]*)?' +
      '$',
    'i',
  )

  return urlPattern.test(url)
}

export const deduplicateByKey = (arr) => {
  const map = new Map()
  for (const item of arr) {
    map.set(item.key, item)
  }
  return Array.from(map.values())
}
