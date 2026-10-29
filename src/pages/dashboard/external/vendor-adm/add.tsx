import { AddVendorFormWizardProvider } from '@/providers/AddVendorFormWizardProvider'
import { MAIN_URL_FE } from '@/utils/constant'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const AddVendorWizard: any = dynamic(() =>
  import('@/layout/form-wizard/AddVendorWizard').then((mod) => mod.AddVendorWizard),
)

const AddVendor = () => {
  return (
    <>
      <NextSeo title="Add New Vendor" canonical={`${MAIN_URL_FE}dashboard/external/vendor-adm/add`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'External', url: 'external' },
          { title: 'Vendor Adm', url: 'vendor-adm' },
          { title: 'Add New Vendor', url: 'add-new-vendor' },
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

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      activeSidebar: 'Vendor Adm',
    },
  }
}
