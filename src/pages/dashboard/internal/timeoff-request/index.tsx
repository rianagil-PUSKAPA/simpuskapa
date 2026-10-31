import { resolveAuthToken } from '@/utils/ssrAuth'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { MAIN_URL_FE } from '@/utils/constant'
import { EmployeeApi } from '@sdk'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

const Timeoffrequest = () => {
  return (
    <>
      <NextSeo title="Employee List" canonical={`${MAIN_URL_FE}dashboard/employee`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          { title: 'Timeoff request', url: '' },
        ]}
      >
        <div className="h-screen-calculation flex h-full items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Timeoff Request</h1>
            <p>Empty page - under development</p>
          </div>
        </div>
      </Dashboard>
    </>
  )
}

export default Timeoffrequest

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const employeeApi = new EmployeeApi(createAPIConfig(auth_token as string))
  try {
    const employee = await employeeApi.employeeControllerGetAllEmployee()

    return {
      props: {
        employeeList: employee.data.data,
        activeSidebar: 'Timeoff request',
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
