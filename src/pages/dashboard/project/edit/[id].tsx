import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { AddProgramFormWizardProvider } from '@/providers/AddProgramFormWizardProvider'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { MAIN_URL_FE } from '@/utils/constant'
import { checkIsLoggedInRoleAll } from '@/utils/globalHelper'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { ProgramApi, ProgramDetail } from 'sdk/api'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const AddProgramWizard: any = dynamic(() =>
  import('@/layout/form-wizard/AddProgramWizard').then((mod) => mod.AddProgramWizard),
)

type Props = {
  programDetail: ProgramDetail
}

const EditProgram = ({ programDetail }: Props) => {
  return (
    <>
      <NextSeo title="Edit Project" canonical={`${MAIN_URL_FE}dashboard/project/edit/${programDetail.id}`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Project List', url: '/dashboard/project' },
          { title: 'Edit Project', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--wizard">
        <AddProgramFormWizardProvider>
          <AddProgramWizard />
        </AddProgramFormWizardProvider>
      </div>
      </Dashboard>
    </>
  )
}

export default EditProgram

export const getServerSideProps: GetServerSideProps = async (context) => {
  const programId = context.params.id
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const progranApi = new ProgramApi(createAPIConfig(auth_token as string))

  try {
    const getProgramDetail = await progranApi.programControllerGetProgramDetail(programId as string)

    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    const checkUserRole = checkIsLoggedInRoleAll(authTokenJWT.payload['role'])

    if (!checkUserRole) {
      return {
        notFound: true,
      }
    }

    // Pass data to the page via props
    return {
      props: {
        programDetail: getProgramDetail.data.data,
        activeSidebar: 'Project List',
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
