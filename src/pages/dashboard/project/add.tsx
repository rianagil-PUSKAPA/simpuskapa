import { AddProgramFormWizardProvider } from '@/providers/AddProgramFormWizardProvider'
import { MAIN_URL_FE } from '@/utils/constant'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const AddProgramWizard: any = dynamic(() =>
  import('@/layout/form-wizard/AddProgramWizard').then((mod) => mod.AddProgramWizard),
)

const AddProgram = () => {
  return (
    <>
      <NextSeo title="Add New Project" canonical={`${MAIN_URL_FE}dashboard/project/add`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Project List', url: '/dashboard/project' },
          { title: 'Add New Project', url: '' },
        ]}
      >
        <AddProgramFormWizardProvider>
          <AddProgramWizard />
        </AddProgramFormWizardProvider>
      </Dashboard>
    </>
  )
}

export default AddProgram

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      activeSidebar: 'Project List',
    },
  }
}
