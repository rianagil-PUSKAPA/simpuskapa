import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { ProjectType } from '@/layout/procurement/RequisitionDetail'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { PRTypes } from '@/shared/pr.type'
import { RequisitionFormEnum, RFApprovalBy, RFApprovalStatus } from '@/shared/rf.type'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { MAIN_URL_FE } from '@/utils/constant'
import { Log } from '@sdk'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import {
  EmployeeApi,
  FilesApi,
  MetadataApi,
  PaymentRequestApi,
  ProgramApi,
  ProgramCreateRequestProgramOwnershipTypeEnum,
  ProgramDetail,
  RequisitionFormApi,
  RequisitionFormDetail,
} from 'sdk/api'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const PersonalHire: any = dynamic(() => import('@/layout/procurement/PersonalHire').then((mod) => mod.PersonalHire))
const ProcurementRequest: any = dynamic(() =>
  import('@/layout/procurement/ProcurementRequest').then((mod) => mod.ProcurementRequest),
)
const StaffCost: any = dynamic(() => import('@/layout/procurement/StaffCost').then((mod) => mod.StaffCost))
const TravelRequest: any = dynamic(() => import('@/layout/procurement/TravelRequest').then((mod) => mod.TravelRequest))
const RequisitionDetail: any = dynamic(() =>
  import('@/layout/procurement/RequisitionDetail').then((mod) => mod.RequisitionDetail),
)

type ProcurementDetailType = {
  programDetail: ProgramDetail
  slugIdentifier: string[]
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
      notes: string
      type_hire: string
      vendor_id: string
      other_docs: string[]
      background_docs: string[]
      offer_page_docs: string[]
      primary_division: string
      hire_process_docs: string[]
    }
    projects: ProjectType[]
  }
  procurementIdentifier: string
  programId: string
  projectId: string
  rfId: string
  buttonDisabled: boolean
  buttonHidden: boolean
  requisitionFormLogs: Log[]
  travellerPerdiemTax?: number
  isAllowedToCloseRF?: boolean
}

const ProcurementDashboard = ({
  slugIdentifier,
  requisitionFormDetail,
  programDetail,
  procurementIdentifier,
  programId,
  projectId,
  rfId,
  buttonDisabled,
  buttonHidden,
  requisitionFormLogs,
  travellerPerdiemTax,
  isAllowedToCloseRF,
}: ProcurementDetailType) => {
  const { budgetsFromProgramToProcurements, requisitionIdentifier, project, handleInternal } = useDashboardContext()

  const [requisitionIdentifierValue, setRequisitionIdentifierValue] = useState<'PC' | 'PH' | 'SC' | 'TR'>()

  const tabTitle = useMemo(() => {
    if (procurementIdentifier === 'detail') {
      if (requisitionFormDetail.rf_type === RequisitionFormEnum.PROCUREMENT) {
        return `PC - ${requisitionFormDetail.about_request}`
      } else if (requisitionFormDetail.rf_type === RequisitionFormEnum.PERSONAL_HIRE) {
        return `PH - ${requisitionFormDetail.about_request}`
      } else if (requisitionFormDetail.rf_type === RequisitionFormEnum.TRAVEL) {
        return `TR - ${requisitionFormDetail.about_request}`
      } else if (requisitionFormDetail.rf_type === RequisitionFormEnum.STAFF_COST) {
        return `SC - ${requisitionFormDetail.about_request}`
      }
    } else {
      if (requisitionIdentifierValue === 'PC') {
        return 'Requisition Form Procurement Request (PC)'
      } else if (requisitionIdentifierValue === 'PH') {
        return 'Requisition Form Personnel Hire (PH)'
      } else if (requisitionIdentifierValue === 'SC') {
        return 'Requisition Form Staff Cost'
      } else if (requisitionIdentifierValue === 'TR') {
        return 'Requisition Form Travel Request (TR)'
      }
    }
  }, [procurementIdentifier, requisitionFormDetail, requisitionIdentifierValue])

  useEffect(() => {
    if (programDetail?.program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Internal) {
      handleInternal(true)
    } else {
      handleInternal(false)
    }
  }, [programDetail?.program_ownership_type])

  useEffect(() => {
    if (procurementIdentifier === 'edit' && requisitionFormDetail?.rf_type) {
      if (requisitionFormDetail.rf_type === RequisitionFormEnum.PROCUREMENT) {
        setRequisitionIdentifierValue('PC')
      } else if (requisitionFormDetail.rf_type === RequisitionFormEnum.PERSONAL_HIRE) {
        setRequisitionIdentifierValue('PH')
      } else if (requisitionFormDetail.rf_type === RequisitionFormEnum.TRAVEL) {
        setRequisitionIdentifierValue('TR')
      } else if (requisitionFormDetail.rf_type === RequisitionFormEnum.STAFF_COST) {
        setRequisitionIdentifierValue('SC')
      }
    }
  }, [procurementIdentifier, requisitionFormDetail?.rf_type])

  useEffect(() => {
    if (requisitionIdentifier) setRequisitionIdentifierValue(requisitionIdentifier)
  }, [requisitionIdentifier])

  return (
    <>
      <NextSeo
        title={tabTitle}
        canonical={`${MAIN_URL_FE}dashboard/procurement/${slugIdentifier[0] ? `${slugIdentifier[0]}/` : ''}/${
          slugIdentifier[1] ? `${slugIdentifier[1]}/` : ''
        }`}
      />
      <Dashboard
        breadcrumbLists={[
          { title: 'Procurement', url: '/dashboard/procurement' },
          {
            title: requisitionFormDetail ? requisitionFormDetail.number.toUpperCase() : programDetail?.program_name,
            url: '',
          },
        ]}
      >
        <div className="sim-modern-forms sim-modern-forms-rf">
          {procurementIdentifier === 'detail' ? (
            <RequisitionDetail
              rfType={requisitionFormDetail.rf_type as RequisitionFormEnum}
              requisitionFormDetail={requisitionFormDetail}
              programDetail={programDetail}
              programId={programId}
              projectId={projectId}
              rfId={rfId}
              buttonDisabled={buttonDisabled}
              buttonHidden={buttonHidden}
              requisitionFormLogs={requisitionFormLogs}
              travellerPerdiemTax={travellerPerdiemTax}
              isAllowedToCloseRF={isAllowedToCloseRF}
            />
          ) : (
            <>
              {requisitionIdentifierValue === 'PC' && (
                <ProcurementRequest
                  programDetail={programDetail}
                  projectDetail={procurementIdentifier == 'edit' ? requisitionFormDetail.projects[0] : project}
                  budgetProcurement={
                    procurementIdentifier == 'edit'
                      ? requisitionFormDetail.projects[0].activities[0]
                      : budgetsFromProgramToProcurements
                  }
                />
              )}
              {requisitionIdentifierValue === 'PH' && (
                <PersonalHire
                  programDetail={programDetail}
                  projectDetail={procurementIdentifier == 'edit' ? requisitionFormDetail.projects[0] : project}
                  budgetProcurement={
                    procurementIdentifier == 'edit'
                      ? requisitionFormDetail.projects[0].activities[0]
                      : budgetsFromProgramToProcurements
                  }
                />
              )}
              {requisitionIdentifierValue === 'SC' && (
                <StaffCost
                  programDetail={programDetail}
                  projectDetail={procurementIdentifier == 'edit' ? requisitionFormDetail.projects[0] : project}
                  budgetProcurement={
                    procurementIdentifier == 'edit'
                      ? requisitionFormDetail.projects[0].activities[0]
                      : budgetsFromProgramToProcurements
                  }
                />
              )}
              {requisitionIdentifierValue === 'TR' && (
                <TravelRequest
                  programDetail={programDetail}
                  projectDetail={procurementIdentifier == 'edit' ? requisitionFormDetail.projects[0] : project}
                  budgetProcurement={
                    procurementIdentifier == 'edit'
                      ? requisitionFormDetail.projects[0].activities[0]
                      : (budgetsFromProgramToProcurements as unknown as any)
                  }
                />
              )}
            </>
          )}
        </div>
      </Dashboard>
    </>
  )
}

export default ProcurementDashboard

export const getServerSideProps: GetServerSideProps = async (context) => {
  const [programId, procurementIdentifier, projectId, rfId] = context.params.slug

  // console.log('context.params.slug---xxx', context.params.slug)

  /*
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const programApi = new ProgramApi(createAPIConfig(auth_token as string))
  const requisitionApi = new RequisitionFormApi(createAPIConfig(auth_token as string))
  const metadataApi = new MetadataApi(createAPIConfig(auth_token as string))
  const fileApi = new FilesApi(createAPIConfig(auth_token as string))
  const employeeApi = new EmployeeApi(createAPIConfig(auth_token as string))
  const paymentRequestApi = new PaymentRequestApi(createAPIConfig(auth_token as string))

  try {
    const getProgramDetail = await programApi.programControllerGetProgramDetail(programId as string)

    let getRequisitionFormDetail = null

    if (procurementIdentifier !== undefined) {
      getRequisitionFormDetail = await requisitionApi.rFControllerGetRfDetail(programId, projectId, rfId)
    }

    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    const programDetail = getProgramDetail.data.data
    const requisitionFormDetail = getRequisitionFormDetail
      ? getRequisitionFormDetail.data.data
      : getRequisitionFormDetail

    let buttonHidden = false
    const buttonDisabled = false
    let approvalBy = null

    if (requisitionFormDetail !== null) {
      if (authTokenJWT.payload['employee_id'] == programDetail.program_manager.id) {
        approvalBy = RFApprovalBy.BY_PROGRAM_MANAGER
      }

      if (approvalBy == RFApprovalBy.BY_PROGRAM_MANAGER) {
        if (requisitionFormDetail.program_manager_approval_status === RFApprovalStatus.APPROVED) {
          buttonHidden = true
        } else if (requisitionFormDetail.program_manager_approval_status === RFApprovalStatus.REJECTED) {
          buttonHidden = true
        } else if (requisitionFormDetail.program_manager_approval_status === RFApprovalStatus.REVISION) {
          buttonHidden = true
        }
      }
    }

    // Case for TE (For now the options available is 2, puskapa empl and other, consultant not included yet)
    // If traveller puskapa employee
    let travellerPerdiemTax = 0
    let travellerId: string | undefined = undefined

    if (requisitionFormDetail?.rf_attributes?.['employee_id']?.split(':')[0] === 'employee') {
      travellerId = requisitionFormDetail?.rf_attributes['who_traveling']['id']
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

    // Related to logs and requesting S3 url
    let requisitionFormLogs = []
    if (rfId) {
      const logsRes = await metadataApi.metadataControllerGetLogsFiltered(rfId, 'RequisitionForm')
      const logs = logsRes?.data?.data
      const renderedIds = new Set()

      const uniqueLogs = logs.filter((log) => {
        if (renderedIds.has(log.user.id)) {
          return false
        }
        renderedIds.add(log.user.id)
        return true
      })

      const dispatchers = []
      for (const uniqueLog of uniqueLogs) {
        const [bucketName, fileName] = uniqueLog.user.employee_pass_photo?.split('/')
        const expiry = 3600 * 24

        const dispatcher = new Promise(async (resolve) => {
          const presignUrlRes = await fileApi.fileControllerGetPresignUrlForDownload(
            fileName,
            bucketName as any,
            expiry as number,
          )

          const presignUrl = presignUrlRes?.data.data

          uniqueLog.user['avatar_url'] = presignUrl

          resolve(uniqueLog)
        })

        dispatchers.push(dispatcher)
      }

      const logModified = await Promise.all(dispatchers)

      requisitionFormLogs = logs.map((log) => {
        return {
          ...log,
          user: {
            ...log.user,
            avatar_url: logModified.find((logUnique) => logUnique.user.id === log.user.id)?.user.avatar_url,
          },
        }
      })
    }

    // Check is all existing payment list is paid
    let isAllowedToCloseRF = true
    if (procurementIdentifier === 'detail') {
      const [getListAPRRes, getListPRRes, getListAPFRes, getListAPSRes, getListTERes] = await Promise.all([
        paymentRequestApi.pRControllerGetListPaymentRequest(programId, rfId, PRTypes.APR, undefined, undefined),
        paymentRequestApi.pRControllerGetListPaymentRequest(programId, rfId, PRTypes.PR, undefined, undefined),
        paymentRequestApi.pRControllerGetListPaymentRequest(programId, rfId, PRTypes.APF, undefined, undefined),
        paymentRequestApi.pRControllerGetListPaymentRequest(programId, rfId, PRTypes.APS, undefined, undefined),
        paymentRequestApi.pRControllerGetListPaymentRequest(programId, rfId, PRTypes.TE, undefined, undefined),
      ])

      const prListResults = getListAPRRes.data.data
      const aprListResults = getListPRRes.data.data
      const apfListResults = getListAPFRes.data.data
      const apsListResults = getListAPSRes.data.data
      const teListResults = getListTERes.data.data

      const mergePaymentResults = [
        ...prListResults,
        ...aprListResults,
        ...apfListResults,
        ...apsListResults,
        ...teListResults,
      ]

      mergePaymentResults.forEach((payment) => {
        if (payment?.paid_at === undefined) {
          isAllowedToCloseRF = false
        }
      })
    }

    return {
      props: {
        programDetail,
        activeSidebar: 'Procurement',
        slugIdentifier: context.params.slug,
        requisitionFormDetail,
        procurementIdentifier: procurementIdentifier ? procurementIdentifier : null,
        programId: programId ? programId : null,
        projectId: projectId ? projectId : null,
        rfId: rfId ? rfId : null,
        buttonDisabled,
        buttonHidden,
        requisitionFormLogs,
        travellerPerdiemTax, // This variabel will be used when user download excel, to calculate perdiem at TE
        isAllowedToCloseRF,
      },
    }
  } catch (error) {
    console.error('ERROR', error.message)
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
