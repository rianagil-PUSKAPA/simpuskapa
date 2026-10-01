import { AddEmployeeFormWizardProvider } from '@/providers/AddEmployeeFormWizardProvider'
import { MAIN_URL_FE } from '@/utils/constant'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))
const AddEmployeeWizard: any = dynamic(() =>
  import('@/layout/form-wizard/AddEmployeeWizard').then((mod) => mod.AddEmployeeWizard),
)

const AddEmployee = ({ employeeId }) => {
  return (
    <>
      <NextSeo
        title={`${employeeId ? 'Edit' : 'Add'} Employee`}
        canonical={
          employeeId
            ? `${MAIN_URL_FE}dashboard/internal/employee/add/`
            : `${MAIN_URL_FE}dashboard/internal/employee/edit/${employeeId}`
        }
      />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          { title: `${employeeId ? 'Edit' : 'Add'} Employee`, url: '' },
        ]}
      >
        <AddEmployeeFormWizardProvider>
          <AddEmployeeWizard />
        </AddEmployeeFormWizardProvider>
      </Dashboard>
    </>
  )
}

export default AddEmployee

export const getServerSideProps: GetServerSideProps = async (context) => {
  let employeeId = null
  if (context?.query?.path) {
    employeeId = context.query.path[0]
  }

  return {
    props: {
      activeSidebar: 'Employee List',
      employeeId,
    },
  }
}
