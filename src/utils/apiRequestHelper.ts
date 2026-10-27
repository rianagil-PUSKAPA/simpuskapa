import { ProjectActivityModified } from '@/layout/program/budget-needs/BudgetNeedsList'
import { PRTypes, PaymentIdentifierType } from '@/shared/pr.type'
import { ApprovalStatusType, BucketsUnion, FinanceDashboardType, SortType } from '@/types/global'
import { FundReceived } from '@/types/program'
import { AnnualTeamOff } from '@/types/table'
import axios from 'axios'
import file_size_url from 'file_size_url'
import {
  EmployeeApi,
  EmployeePerformanceApi,
  EmployeeTimeOffApi,
  FilesApi,
  IdentityApi,
  MetadataApi,
  PaartnerApi,
  PaymentRequestApi,
  PaymentRequestSimple,
  ProgramApi,
  ProgramPerdiemSettings,
  ProjectApi,
  RequisitionFormApi,
  VendorDto,
  VendorExternalApi,
  VendorType,
} from 'sdk/api'
import { getCookie } from 'typescript-cookie'
import { MAIN_URL_BE } from './constant'
import { createAPIConfig, createAxiosInstance } from './apiAuthToken'

type OpenUrl = {
  url: string
  size: string
}

export const employeeApi = new EmployeeApi(createAPIConfig(), '', createAxiosInstance())

export const requisitionFormApi = new RequisitionFormApi(createAPIConfig(), '', createAxiosInstance())

export const vendorExternalApi = new VendorExternalApi(createAPIConfig(), '', createAxiosInstance())

export const fileApi = new FilesApi(createAPIConfig(), '', createAxiosInstance())

export const identityApi = new IdentityApi(createAPIConfig(), '', createAxiosInstance())

export const programApi = new ProgramApi(createAPIConfig(), '', createAxiosInstance())

export const decideProgramBudgetRevision = async (programId: string, status: 'approved' | 'rejected', notes = '') => {
  const token = getCookie('auth_token')
  return axios.put(
    `${String(MAIN_URL_BE || '').replace(/\/$/, '')}/v1/programs/${encodeURIComponent(
      programId,
    )}/budgets/revision-approval`,
    { status, notes },
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

export const paymentRequestApi = new PaymentRequestApi(createAPIConfig(), '', createAxiosInstance())

export const projectApi = new ProjectApi(createAPIConfig(), '', createAxiosInstance())
export const partnerApi = new PaartnerApi(createAPIConfig(), '', createAxiosInstance())

export const employeeTimeOffApi = new EmployeeTimeOffApi(createAPIConfig(), '', createAxiosInstance())

export const metadataApi = new MetadataApi(createAPIConfig(), '', createAxiosInstance())

export const employeePerformanceApi = new EmployeePerformanceApi(createAPIConfig(), '', createAxiosInstance())

export async function getOpenUrl(bucket: BucketsUnion, key: string, expiry = 500, countSize = false): Promise<OpenUrl> {
  if (!key) return
  if (!bucket) return

  const res = await fileApi.fileControllerGetPresignUrlForDownload(key, bucket as any, expiry as number)

  let sizeRes = '0'
  if (countSize) {
    sizeRes = await file_size_url(res?.data?.data)
  }
  return {
    url: res?.data?.data as any,
    size: sizeRes,
  }
}

export const getEmployeeDetail = async (id: string) => {
  const employeeDetailRes = await employeeApi.employeeControllerGetEmployeeDetail(id as string)

  return employeeDetailRes?.data?.data
}

export const getVendorDetail = async (id: string) => {
  const vendorDetailRes = await vendorExternalApi.vendorControllerGetVendorDetail(id as string)

  return vendorDetailRes?.data?.data
}

export const getVendorDetailDraft = async () => {
  const vendorDetailDraftRes = await vendorExternalApi.vendorControllerGetVendorDetailOnDraftByLogedInuser()
  return vendorDetailDraftRes?.data?.data
}

export const getProgramDetail = async (parameter: string) => {
  const id = parameter.split('/')[1]
  const programDetailRes = await programApi.programControllerGetProgramDetail(id as string)

  return programDetailRes?.data?.data
}

export const getPerdiemSetting = async (id: string) => {
  try {
    const perdiemSettingRes = await programApi.programControllerGetProgramPerdiemSettings(id)

    return perdiemSettingRes?.data?.data as ProgramPerdiemSettings
  } catch (error) {
    return undefined
  }
}

export const getBudgetNeeds = async (parameter: string) => {
  const id = parameter.split('/')[1]
  const budgetNeedsRes = await programApi.programControllerGetProgramBudget(id as string)

  return budgetNeedsRes?.data?.data
}

export const getBudgetList = async (id: string) => {
  const budgetNeedsRes = await programApi.programControllerGetProgramBudget(id)
  return budgetNeedsRes?.data?.data
}

export const getLatestLogs = async () => {
  const logs = await metadataApi.metadataControllerGetLatestLogs()
  return logs?.data?.data
}

export const getPersonalizedNotification = async () => {
  const logs = await metadataApi.metadataControllerGetPersonalizedNotification()
  return logs?.data?.data
}
export const getMetadataFinanceDashboard = async (year: string) => {
  if (!year) return
  const logs = await metadataApi.metadataControllerGetDashoardFinance(year)
  return logs?.data?.data as FinanceDashboardType
}

export const getProjectActivity = async (parameter: string) => {
  const id = parameter.split('/')[1]
  // const projectApi = new ProjectApi(
  //   createAPIConfig(),
  //   '',
  //   createAxiosInstance(),
  // )
  const projectDetailRes = await projectApi.projectControllerGetProjectList(id as string)

  return projectDetailRes?.data?.data
}

export const downloadS3File = async (fileName: string) => {
  const bucketName = fileName.split('/')[0]
  const realFileName = fileName.split('/')[1]

  await getOpenUrl(bucketName as BucketsUnion, realFileName, 3600 * 24, true)
    .then((presignUrl) => {
      window.open(presignUrl.url, '_blank')
    })
    .catch((err) => console.error('File preview error', err))
}

export const getS3HeaderInformation = async (fileName: string) => {
  if (!fileName) return

  const bucketName = fileName.split('/')[0]
  const realFileName = fileName.split('/')[1]

  const presignUrl = await getOpenUrl(bucketName as BucketsUnion, realFileName, 3600 * 24, true)

  const result = await fetch(presignUrl.url).then((response) => {
    const lastModified = response.headers.get('Last-Modified')
    return lastModified
  })

  return result
}

export const getVendorLists = async (parameters: string): Promise<VendorDto[]> => {
  const [order, vedor_type, per_page, page, categoryIds] = parameters.split('/')

  const vendotList = await vendorExternalApi.vendorControllerGetVendorList(
    categoryIds,
    order,
    vedor_type,
    per_page,
    page,
  )

  // filter vendor without type or category
  const filteredData = vendotList?.data?.data?.filter((vendor: VendorDto) => {
    return ['', null, undefined].indexOf(vendor.vendor_type) == -1 && vendor.vendor_categories.length > 0
  })

  return filteredData
}

export const getLocalApi = async (url: string) => {
  const response = await axios.get(url)
  return response.data
}

export const getVendorTypes = async () => {
  const vendorTypes = await vendorExternalApi.vendorControllerGetVendorTypes()
  return vendorTypes?.data?.data as unknown as VendorType[]
}
export const getVendorTypeDetail = async (id: string) => {
  const vendorType = await vendorExternalApi.vendorControllerGetVendorTypeById(id)
  return vendorType?.data?.data as unknown as VendorType
}
export const getCategories = async (type: string) => {
  const categories = await vendorExternalApi.vendorControllerGetVendorCategories(type)
  const getReadyCategories = categories?.data?.data?.map((item) => ({
    id: item.id,
    name: item.name,
  }))

  return getReadyCategories || []
}

export const detailRequisition = async (programId: string, projectId: string, rtfId: string) => {
  // const requisitionFormApi = new RequisitionFormApi(
  //   createAPIConfig(),
  //   '',
  //   createAxiosInstance(),
  // )
  const requisitionRes = await requisitionFormApi.rFControllerGetRfDetail(programId, projectId, rtfId)

  return requisitionRes?.data?.data
}

export const getAllEmployee = async (role?: string) => {
  const employee = await employeeApi.employeeControllerGetAllEmployee(role, '', false)

  return employee?.data?.data
}

// Combobox Ready
export const getAllEmployeeCombobox = async (role?: string, spvId?: string) => {
  const employee = await employeeApi.employeeControllerGetAllEmployee(role, spvId || '', false)
  const getEmployee = employee?.data?.data.map((item: any) => ({
    id: item.id,
    name: item.full_name,
    avatarUrl: item.pass_photo_path,
  }))

  return getEmployee
}

// Used only by Finance PR when Vendor Type = Staff
// and Vendor Category = Internal.
// Returns only active Staff employees and excludes role data from the UI payload.
export const getAllActiveStaffCombobox = async () => {
  const employee = await employeeApi.employeeControllerGetAllEmployee('staff', '', false)

  const staffVendors =
    employee?.data?.data
      ?.filter(
        (item: any) =>
          item?.user?.status === true &&
          Array.isArray(item?.user?.role) &&
          item.user.role.some((role: string) => role.toLowerCase() === 'staff'),
      )
      .map((item: any) => ({
        id: item.id,
        name: item.full_name,
        avatarUrl: item.pass_photo_path,
      })) || []

  return [
    ...staffVendors,
    {
      id: 'fa08d5b8-fcf0-4a07-b730-a3818b6fb9d9',
      name: 'All Employee',
      avatarUrl: [],
    },
  ]
}

export const getAllVendorsCombobox = async (filterType?: string, filterCategoryId?: string) => {
  const vendors = await vendorExternalApi.vendorControllerGetVendorList(filterCategoryId || '', 'ASC', filterType || '')

  // filter vendor without type or category
  const filteredData = vendors?.data?.data
    ?.filter((vendor: VendorDto) => {
      return ['', null, undefined].indexOf(vendor.vendor_type) == -1 && vendor.vendor_categories.length > 0
    })
    .map((item: any) => ({
      id: item.id,
      name: item.vendor_information.name,
    }))

  return filteredData
}

export const handleVendorList = async (type: string, category: string) => {
  const recommendedVendor = await getAllVendorsCombobox(type, category)
  return recommendedVendor
}

export const supervisorByEmployee = async (employeeId: string) => {
  if (!employeeId) return

  const employeeDetail = await employeeApi.employeeControllerGetEmployeeDetail(employeeId)
  const spvId = employeeDetail?.data?.data.employee_contracts[0].supervisor_id
  const spvDetail = await employeeApi.employeeControllerGetEmployeeDetail(spvId)
  return spvDetail?.data?.data
}

export const getEmployeeTimeoff = async (parameter: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, startDate, endDate, groupDate, leaveType, spvId, timeoffStatus] = parameter.split('/')

  const groupDateBool = groupDate === 'true' ? true : false

  const employeeTimeoffRes = await employeeTimeOffApi.timeOffControllerGetAllTimeOffActiveBetweenDates(
    endDate,
    startDate,
    groupDate !== 'undefined' ? groupDateBool : undefined,
    leaveType !== 'undefined' ? leaveType : undefined,
    spvId !== 'undefined' ? spvId : undefined,
    timeoffStatus || undefined,
  )

  return employeeTimeoffRes?.data?.data
}

export const getPaymentList = async (programId: string, rfId: string, paymentIdentifier: PaymentIdentifierType) => {
  const paymentListRes = await paymentRequestApi.pRControllerGetListPaymentRequest(
    programId,
    rfId,
    paymentIdentifier,
    undefined,
    undefined,
  )
  const paymentList = paymentListRes?.data?.data
  return paymentList
}

/*
 * @param {string} programId - The program id
 * @param {string} rfId - The requisition form id
 * @param {string} paymentIdentifier - The payment identifier
 * @param {string} budgetsFromProcurementsToPaymentRequest data from requisition detail
 * @returns {Promise<PaymentRequestSimple[]>} - The list of payment request
 *
 * This function have multiple purpose
 * 1. Get APR based on budget code
 * 2. Get Remaining budget based on budget code
 *
 */
export const getPaymentBasedOnBudgetCode = async (
  programId: string,
  rfId: string,
  paymentIdentifier: PaymentIdentifierType,
  budgetsFromProcurementsToPaymentRequest: ProjectActivityModified[],
) => {
  const paymentListRes = await paymentRequestApi.pRControllerGetListPaymentRequest(
    programId,
    rfId,
    paymentIdentifier,
    undefined,
    undefined,
  )

  const paymentList = paymentListRes?.data?.data

  const getListPaymentIds = paymentList.map((item: PaymentRequestSimple) => item.id)

  const paymentDetails = await Promise.all(
    getListPaymentIds.map(async (id: string) => {
      const paymentDetailRes = await paymentRequestApi.pRControllerGetDetailPaymentRequest(id)

      const paymentDetail = paymentDetailRes?.data?.data

      return paymentDetail.projects
        .map((project) =>
          project.activities.map((activity) =>
            activity.budgets.map((budget) => ({
              ...budget,
              paid_at: paymentDetail.paid_at,
              pr_number: paymentDetail.number,
            })),
          ),
        )
        .flat()
    }),
  )

  const filterPaymentDetails = paymentDetails.flat(2)

  // Index payments by budget id once, so per-budget lookups are O(1) instead of
  // repeated .find()/.filter() scans (previously ~6 .find() per budget = O(n^2)).
  const paymentById = new Map<string, (typeof filterPaymentDetails)[number]>()
  const paymentsById = new Map<string, typeof filterPaymentDetails>()
  for (const payment of filterPaymentDetails) {
    if (!paymentById.has(payment.id)) paymentById.set(payment.id, payment)
    const list = paymentsById.get(payment.id)
    if (list) list.push(payment)
    else paymentsById.set(payment.id, [payment])
  }

  const PERDIEM_CATEGORIES = ['Overseas Perdiem', 'Normal Perdiem', 'Remote Area Perdiem']

  // Single source of truth for the per-budget result object. Both the nested
  // (activity.activities) and flat branches below call this, so the perdiem/tax
  // math cannot diverge again.
  const buildBudgetResult = (budget: { id: string; code: string; vendor_category_information: { name: string } }) => {
    const perdiemBudget = paymentById.get(budget.id)

    let perdiemFinalResult = 0

    if (
      perdiemBudget &&
      PERDIEM_CATEGORIES.includes(perdiemBudget.vendor_category_information.name) &&
      perdiemBudget.additional_data?.['static_data']?.length > 0
    ) {
      const thp =
        perdiemBudget.qty * perdiemBudget.pkg_qty * perdiemBudget.unit_cost_value +
        perdiemBudget.additional_data['static_data'].reduce((a, b) => a + b.total, 0)
      const travellerPerdiemTax = perdiemBudget.additional_data['traveller_perdiem_tax']
      const taxBenchmark = perdiemBudget.additional_data['tax_benchmark']
      const perdiemTax =
        Math.abs(perdiemBudget.additional_data['static_data']['3']['tax']) === Math.abs(taxBenchmark)
          ? perdiemBudget.qty *
            perdiemBudget.unit_cost_value *
            (perdiemBudget.pkg_qty - perdiemBudget.additional_data['static_data']['3']['pkg_qty']) *
            (travellerPerdiemTax / 100)
          : perdiemBudget.qty * perdiemBudget.unit_cost_value * perdiemBudget.pkg_qty * (travellerPerdiemTax / 100)
      const apf = perdiemBudget.additional_data['apf']
      perdiemFinalResult = thp - perdiemTax - apf
    }

    const isPerdiemCategory = perdiemBudget
      ? PERDIEM_CATEGORIES.includes(perdiemBudget.vendor_category_information.name)
      : false

    return {
      id: budget.id,
      code: budget.code,
      vendor_category: budget.vendor_category_information.name,
      advance_payment_total: perdiemBudget?.advance_payment_total || null,
      total_prs: (paymentsById.get(budget.id) || []).reduce((a, b) => a + b.qty * b.pkg_qty * b.unit_cost_value, 0),
      travel_expenses:
        paymentIdentifier === PRTypes.TE
          ? isPerdiemCategory
            ? perdiemFinalResult
            : perdiemBudget?.additional_data['total_expenses_real']
          : null,
    }
  }

  const result = budgetsFromProcurementsToPaymentRequest?.map((activity) => {
    if (activity['activities']) {
      return activity['activities']
        .map((innerActivity: ProjectActivityModified) => innerActivity.budgets.map(buildBudgetResult))
        .flat()
        .flat()
    } else {
      return activity.budgets.map(buildBudgetResult)
    }
  })

  return result
}

export const getProcurementBasedOnBudgetCode = async (
  programId: string,
  projectId: string,
  budgetProcurement: ProjectActivityModified[],
) => {
  const procurementListRes = await requisitionFormApi.rFControllerGetListRf(programId)

  if (!procurementListRes.data) return []

  const procurementList = procurementListRes?.data?.data

  const getListProcurementIds = procurementList.map((item) => item.id)

  const procurementDetails = await Promise.all(
    getListProcurementIds.map(async (id: string) => {
      const procurementDetailRes = await requisitionFormApi.rFControllerGetRfDetail(programId, projectId, id)

      if (!procurementDetailRes.data) return []
      const procurementDetail = procurementDetailRes?.data?.data

      return procurementDetail.projects
        .map((project) =>
          project.activities.map((activity) =>
            activity.budgets.map((budget) => ({
              ...budget,
            })),
          ),
        )
        .flat()
    }),
  )

  const flattenProcurementDetails = [].concat(...[].concat(...procurementDetails))

  const result = budgetProcurement?.map((activity) =>
    activity.budgets.map((budget) => ({
      code: budget.code,
      pending_rf: flattenProcurementDetails
        ? flattenProcurementDetails.find((item) => item.code === budget.code)
        : null,
    })),
  )

  return result
}

export const getDetailPayment = async (id: string) => {
  const result = await paymentRequestApi.pRControllerGetDetailPaymentRequest(id)
  return result?.data?.data
}

export const getProgramListSSR = async (
  programOwnershipType: 'INTERNAL' | 'PROGRAM',
  keyword: string,
  sort: SortType,
  program_manager: string,
  partner_code: string,
  approvalStatus: ApprovalStatusType,
  perPage: number,
  page: number,
) => {
  const programRes = await programApi.programControllerGetProgramList(
    programOwnershipType,
    keyword,
    sort as any,
    program_manager,
    partner_code,
    approvalStatus,
    perPage,
    page,
  )
  return programRes?.data
}

export const getEmployeePerformance = async () => {
  const employeePerformance = await employeePerformanceApi.employeePerformanceControllerGetEmployeePerformanceAll()
  return employeePerformance?.data?.data
}

export const getAllPics = async (currentUser: string) => {
  const employee = await employeeApi.employeeControllerGetAllEmployee()

  const getPICs = employee.data.data
    .map((item: any) => ({
      id: item.id,
      name: item.full_name,
      avatarUrl: item.pass_photo_path,
    }))
    .filter((item) => item.name !== currentUser)

  return getPICs
}

export const getFilteredLogs = async (refId: string, type: 'RequisitionForm' | 'Program' | 'PaymentRequest') => {
  const filteredLogs = await metadataApi.metadataControllerGetLogsFiltered(refId, type)
  return filteredLogs?.data.data
}

export const getSubmittedFundReceived = async (programId: string) => {
  const result = await programApi.programControllerGetSubmittedFundReceived(programId as string)
  return result?.data?.data as FundReceived[]
}

export const getAnnualLeave = async (year: string) => {
  const result = await employeeTimeOffApi.timeOffControllerGetEmployeeAnnualTimeOffList(Number(year))

  if (result['name'] === 'AxiosError') {
    // throw new Error('ss')
    return Promise.reject(result['response'].data)
  }
  return result?.data?.data as unknown as AnnualTeamOff[]
}

export const rfGetRemainingBudget = async (budgetId: string) => {
  const response = await requisitionFormApi.rFControllerCalculateRfRemainingBudget('', budgetId)
  return response.data.data as unknown as number
}
export const rfGetPendingRequested = async (budgetId: string) => {
  const response = await programApi.programControllerGetPendingRequestedBudget(budgetId)
  return response.data.data as unknown as number
}
export const rfGetPaidBudget = async (budgetId: string) => {
  const response = await programApi.programControllerGetPaidBudget(budgetId)
  return response.data.data as unknown as number
}
