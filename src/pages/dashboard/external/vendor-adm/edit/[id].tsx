import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { AddVendorFormWizardProvider } from '@/providers/AddVendorFormWizardProvider'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { MAIN_URL_FE } from '@/utils/constant'
import { checkIsLoggedInRoleAll } from '@/utils/globalHelper'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { VendorDto, VendorExternalApi } from 'sdk/api'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const AddVendorWizard: any = dynamic(() =>
  import('@/layout/form-wizard/AddVendorWizard').then((mod) => mod.AddVendorWizard),
)

type Props = {
  vendorDetail: VendorDto
}

const AddVendor = ({ vendorDetail }: Props) => {
  return (
    <>
      <NextSeo
        title="Update Vendor"
        canonical={`${MAIN_URL_FE}dashboard/external/vendor-adm/edit/${vendorDetail.id}`}
      />
      <Dashboard
        breadcrumbLists={[
          { title: 'External', url: '/dashboard/external/vendor-adm' },
          { title: 'Vendor Adm', url: '/dashboard/external/vendor-adm' },
          { title: 'Edit', url: '' },
        ]}
      >
        <AddVendorFormWizardProvider>
          <AddVendorWizard />
        </AddVendorFormWizardProvider>
      </Dashboard>
    </>
  )
}

export default AddVendor

export const getServerSideProps: GetServerSideProps = async (context) => {
  const vendorId = context.params.id
  /* 
  Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
  https://github.com/vercel/next.js/issues/36049
  */
  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const vendorExternalApi = new VendorExternalApi(createAPIConfig(auth_token as string))
  try {
    const getVendorDetail = await vendorExternalApi.vendorControllerGetVendorDetail(vendorId as string)

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
        vendorDetail: getVendorDetail.data.data,
        activeSidebar: 'Vendor Adm',
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
