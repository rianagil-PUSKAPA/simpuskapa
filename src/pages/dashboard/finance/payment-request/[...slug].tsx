import { resolveAuthToken } from '@/utils/ssrAuth'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { PaymentRequestListType } from '@/types/payment-request'
import { FundReceived } from '@/types/program'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { FUND_RECEIVED_TYPE, MAIN_URL_FE } from '@/utils/constant'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import {
  BudgetProgramProjectListResponse,
  EmployeeApi,
  PaymentRequestApi,
  ProgramApi,
  ProgramDetail,
  RequisitionFormApi,
  RequisitionFormDetail,
} from 'sdk/api'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const AdvancePaymentRequest: any = dynamic(() =>
  import('@/layout/finance/AdvancePaymentRequest').then((mod) => mod.AdvancePaymentRequest),
)
const AdvancePerdiemFee: any = dynamic(() =>
  import('@/layout/finance/AdvancePerdiemFee').then((mod) => mod.AdvancePerdiemFee),
)
const NormalPaymentRequest: any = dynamic(() =>
  import('@/layout/finance/NormalPaymentRequest').then((mod) => mod.NormalPaymentRequest),
)
const TravelExpenses: any = dynamic(() => import('@/layout/finance/TravelExpenses').then((mod) => mod.TravelExpenses))

type PaymentRequestType = {
  programDetail: ProgramDetail
  requisitionFormDetail: RequisitionFormDetail & {
    rf_attributes: {
      employee_id: string
      additional_data: {
        notes: string
        tor_path: string[]
        invitation_path: string[]
        travel_organizer: string
        assignment_letter_path: string[]
      }
      who_traveling: {
        id: string
        name: string
        pass_photo: string[]
      }
    }
  }
  paymentRequestIdentifier: 'PR' | 'APR' | 'APF' | 'AT'
  programId: string
  projectId: string
  rfId: string
  finalTravelExpenseList: PaymentRequestListType[]
  travellerPerdiemTax: number
  budgetNeeds: BudgetProgramProjectListResponse
  totalFundReceived?: number
}

const PaymentRequest = ({
  programDetail,
  requisitionFormDetail,
  paymentRequestIdentifier,
  programId,
  projectId,
  rfId,
  finalTravelExpenseList,
  travellerPerdiemTax,
  totalFundReceived,
  budgetNeeds,
}: PaymentRequestType) => {
  const { userLoggedinInformation } = useDashboardContext()

  const titleForm = useMemo(() => {
    if (paymentRequestIdentifier.toUpperCase() === 'PR') {
      return 'Payment Request Form'
    }
    if (paymentRequestIdentifier.toUpperCase() === 'APR') {
      return 'Advance Payment Request Form'
    }
    if (paymentRequestIdentifier.toUpperCase() === 'APF') {
      return 'Advance Perdiem Fee Form'
    }
    if (paymentRequestIdentifier.toUpperCase() === 'TE') {
      return 'Travel Expenses Form'
    }
  }, [paymentRequestIdentifier])

  const title = useMemo(() => {
    if (paymentRequestIdentifier.toUpperCase() === 'PR') {
      return 'Payment Request'
    }
    if (paymentRequestIdentifier.toUpperCase() === 'APR') {
      return 'Advance Payment Request'
    }
    if (paymentRequestIdentifier.toUpperCase() === 'APF') {
      return 'Advance Perdiem Fee'
    }
    if (paymentRequestIdentifier.toUpperCase() === 'TE') {
      return 'Travel Expenses'
    }
  }, [paymentRequestIdentifier])

  const breadcrumbUrl = useMemo(() => {
    const allowedRoles = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM, RoleDefinition.SUPERADMIN]
    return allowedRoles.includes(userLoggedinInformation?.role) ? '/dashboard/finance/payment-request' : ''
  }, [userLoggedinInformation])

  return (
    <>
      <NextSeo
        title={titleForm}
        canonical={`${MAIN_URL_FE}dashboard/finance/payment-request/${paymentRequestIdentifier}/${programId}/${projectId}/${rfId}`}
      />
      <Dashboard
        breadcrumbLists={[
          { title: 'Finance', url: breadcrumbUrl },
          { title, url: breadcrumbUrl },
          { title: requisitionFormDetail.number.toUpperCase(), url: '' },
        ]}
      >
        {/* FORMS */}
        <div className="sim-modern-forms sim-modern-forms-payment">
          {paymentRequestIdentifier.toUpperCase() === 'PR' && (
            <NormalPaymentRequest
              programDetail={programDetail}
              requisitionFormDetail={requisitionFormDetail}
              paymentRequestIdentifier="PR"
              programId={programId}
              projectId={projectId}
              rfId={rfId}
              totalFundReceived={totalFundReceived}
              budgetNeeds={budgetNeeds}
            />
          )}
          {paymentRequestIdentifier.toUpperCase() === 'APR' && (
            <AdvancePaymentRequest
              programDetail={programDetail}
              requisitionFormDetail={requisitionFormDetail}
              paymentRequestIdentifier="APR"
              programId={programId}
              projectId={projectId}
              rfId={rfId}
              totalFundReceived={totalFundReceived}
              budgetNeeds={budgetNeeds}
            />
          )}
          {paymentRequestIdentifier.toUpperCase() === 'APF' && (
            <AdvancePerdiemFee
              programDetail={programDetail}
              requisitionFormDetail={requisitionFormDetail}
              paymentRequestIdentifier="APF"
              programId={programId}
              projectId={projectId}
              rfId={rfId}
              totalFundReceived={totalFundReceived}
              budgetNeeds={budgetNeeds}
            />
          )}
          {paymentRequestIdentifier.toUpperCase() === 'TE' && (
            <TravelExpenses
              programDetail={programDetail}
              requisitionFormDetail={requisitionFormDetail}
              paymentRequestIdentifier="TE"
              programId={programId}
              projectId={projectId}
              rfId={rfId}
              totalFundReceived={totalFundReceived}
              budgetNeeds={budgetNeeds}
              finalTravelExpenseList={finalTravelExpenseList}
              travellerPerdiemTax={travellerPerdiemTax}
            />
          )}
        </div>
      </Dashboard>
    </>
  )
}

export default PaymentRequest

export const getServerSideProps: GetServerSideProps = async (context) => {
  const [paymentRequestIdentifier, programId, projectId, rfId] = context.params.slug

  // console.log('paymentRequestIdentifier', paymentRequestIdentifier)
  // console.log('programId', programId)
  // console.log('projectId', projectId)
  // console.log('rfId', rfId)

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const programApi = new ProgramApi(createAPIConfig(auth_token as string))
  const employeeApi = new EmployeeApi(createAPIConfig(auth_token as string))
  const requisitionApi = new RequisitionFormApi(createAPIConfig(auth_token as string))
  const paymentRequestApi = new PaymentRequestApi(createAPIConfig(auth_token as string))
  try {
    const getProgramDetail = await programApi.programControllerGetProgramDetail(programId as string)

    const travelExpenseList = await paymentRequestApi.pRControllerGetListPaymentRequest(
      programId,
      rfId,
      'advance-perdiem-fee',
      undefined,
      undefined,
    )

    const finalTravelExpenseList = travelExpenseList.data.data

    let getRequisitionFormDetail = null

    if (paymentRequestIdentifier !== undefined) {
      getRequisitionFormDetail = await requisitionApi.rFControllerGetRfDetail(programId, projectId, rfId)
    }

    const requisitionFormDetail = getRequisitionFormDetail
      ? getRequisitionFormDetail.data.data
      : getRequisitionFormDetail

    // Case for TE (For now the options available is 2, puskapa empl and other, consultant not included yet)
    // If traveller puskapa employee
    let travellerPerdiemTax = 0
    let travellerId: string | undefined = undefined

    if (requisitionFormDetail.rf_attributes?.['employee_id']?.split(':')[0] === 'employee') {
      travellerId = requisitionFormDetail.rf_attributes['who_traveling']['id']
    } else {
      // get tax another puspaka employee is not handled yet
      travellerId = undefined
    }

    if (travellerId !== undefined) {
      const travellerResponse = await employeeApi.employeeControllerGetEmployeeDetail(travellerId)
      const traveller = travellerResponse?.data.data

      travellerPerdiemTax = traveller.perdiem_tax_percentage
    } else {
      travellerPerdiemTax = 2.5
    }

    // Get total fund received
    let totalFundReceived = 0
    const fundReceivedTotalResponse = await programApi.programControllerGetSubmittedFundReceived(programId as string)
    const fundReceivedTotalData = fundReceivedTotalResponse?.data?.data as FundReceived[]

    const puskapaTotal =
      fundReceivedTotalData
        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.PUSKAPA)
        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
    const donorTotal =
      fundReceivedTotalData
        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR)
        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0
    const donorReimburseTotal =
      fundReceivedTotalData
        ?.filter((item) => item.source === FUND_RECEIVED_TYPE.DONOR_REIMBURSE)
        ?.reduce((acc, curr) => acc + curr.amount, 0) || 0

    totalFundReceived =
      donorTotal +
      donorReimburseTotal +
      (puskapaTotal - donorReimburseTotal < 0 ? 0 : puskapaTotal - donorReimburseTotal)

    // Budget needs at project level
    const budgetNeedsRes = await programApi.programControllerGetProgramBudget(programId as string)

    const budgetNeeds = budgetNeedsRes?.data?.data

    return {
      props: {
        activeSidebar: 'Payment Request',
        paymentRequestIdentifier: paymentRequestIdentifier ? paymentRequestIdentifier : null,
        programId: programId ? programId : null,
        projectId: projectId ? projectId : null,
        rfId: rfId ? rfId : null,
        programDetail: getProgramDetail.data.data,
        requisitionFormDetail,
        finalTravelExpenseList,
        travellerPerdiemTax: travellerPerdiemTax || 0,
        totalFundReceived,
        budgetNeeds,
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
