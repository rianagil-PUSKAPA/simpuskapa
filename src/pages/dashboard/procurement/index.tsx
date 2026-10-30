import { resolveAuthToken } from '@/utils/ssrAuth'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { MAIN_URL_FE } from '@/utils/constant'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { RequisitionFormApi } from 'sdk/api'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const RequisitionList: any = dynamic(() =>
  import('@/layout/program/RequisitionList').then((mod) => mod.RequisitionList),
)

const ProcurementListIndex = () => {
  return (
    <>
      <NextSeo title="List of Requisition Form" canonical={`${MAIN_URL_FE}dashboard/project`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Procurement', url: '' },
          { title: 'List of Requisition Form', url: '' },
        ]}
      >
        <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">Requisition Form</h1>
          </div>
        </div>
        <div className="p-7 xl:p-10">
          <RequisitionList slugIdentifier={[]} isGlobal={true} />
        </div>
      </Dashboard>
    </>
  )
}

export default ProcurementListIndex

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const requisitionApi = new RequisitionFormApi(createAPIConfig(auth_token as string))
  try {
    const requisitionApiRes = await requisitionApi.rFControllerGetListRfAll()

    const requisitionAllData = requisitionApiRes.data.data.map((data) => ({
      ...data,
      rf_year: data.rf_number.replace(/ /g, '').split('/')[2],
    }))

    return {
      props: {
        activeSidebar: 'Requisition Form',
        requisitionAllData,
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
