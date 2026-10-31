import { TableCore } from '@/components/TableCore'
import { checkIsItemExist } from '@/utils/globalHelper'
import { createAPIConfig } from '@/utils/apiAuthToken'
import { employeeApi } from '@/utils/apiRequestHelper'
import { APP_ENV, MAIN_URL_FE } from '@/utils/constant'
import { loginArbitary } from '@/utils/repositories'
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { RoleDefinition } from '@/shared/role.access'
import { Employee, EmployeeApi } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const Badge: any = dynamic(() => import('@/components/Badge').then((mod) => mod.Badge))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const HorizontalTabs: any = dynamic(() => import('@/components/HorizontalTabs').then((mod) => mod.HorizontalTabs))
const ChevronRightIcon: any = dynamic(() =>
  import('@/components/icon/ChevronRightIcon').then((mod) => mod.ChevronRightIcon),
)
const PlusIcon: any = dynamic(() => import('@/components/icon/PlusIcon').then((mod) => mod.PlusIcon))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

const columnHelper = createColumnHelper<Employee>()

const EmployeeList = ({ draftedEmployeeList, jwtInformation }) => {
  const router = useRouter()

  // Tab configuration object for better maintainability
  const TAB_CONFIG = {
    'active-employee': { index: 0, slug: 'active-employee' },
    'inactive-employee': { index: 1, slug: 'inactive-employee' },
    subordinate: { index: 2, slug: 'subordinate' },
    'draft-employee': { index: 3, slug: 'draft-employee' },
  } as const

  type TabSlug = keyof typeof TAB_CONFIG

  // Helper functions
  const getIndexFromTab = (tab: string | string[] | undefined): number => {
    const tabKey = (tab || 'active-employee') as TabSlug
    return TAB_CONFIG[tabKey]?.index ?? 0
  }

  const getTabFromIndex = (indexValue: number): TabSlug => {
    const entry = Object.entries(TAB_CONFIG).find(([, config]) => config.index === indexValue)
    return (entry?.[0] as TabSlug) ?? 'active-employee'
  }

  // Derive index from URL query param (single source of truth)
  const index = getIndexFromTab(router.query.tab)

  const getEmployeeActive = async () => {
    const activeEmployee = await employeeApi.employeeControllerGetAllEmployee('', '', false)

    return activeEmployee.data.data
  }

  const getEmployeeSubordinate = async () => {
    const subordinateEmployee = await employeeApi.employeeControllerGetAllEmployee(
      '',
      jwtInformation.payload.employee_id,
      false,
    )

    return subordinateEmployee.data.data
  }

  const {
    data: employeeListActiveData,
    error: employeeListActiveError,
    trigger: employeeListActiveTrigger,
  } = useSWRMutation(`get-active-employee`, getEmployeeActive)

  const {
    data: subordinateData,
    error: subordinateError,
    trigger: subordinateTrigger,
  } = useSWRMutation(`get-subordinate-employee`, getEmployeeSubordinate)

  const handleIndexTabs = (value: number) => {
    const tab = getTabFromIndex(value)
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        tab,
      },
    })
  }

  const columnsActiveEmployeeTable = useMemo<ColumnDef<Employee, any>[]>(
    () => [
      columnHelper.accessor((row) => `${row.full_name} ${row.user.email}`, {
        id: 'name',
        header: 'Name',
        size: APP_ENV !== 'production' ? 350 : 280,
        cell: (info) => (
          <div className="flex items-center gap-2">
            {APP_ENV !== 'production' ? (
              <Button
                id={info.row.original.user.email}
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                onClick={async () => {
                  const auth = await loginArbitary(info.row.original.user.email)
                  router.push(`/welcome?auth_token=${auth.data.auth_token}&refresh_token=${auth.data.refresh_token}`)
                }}
              >
                Login
              </Button>
            ) : null}

            <AvatarLabelGroup
              size={'md'}
              image={info.row.original.pass_photo_path ? info.row.original.pass_photo_path?.[0] : ''}
              text={info.row.original.full_name}
              supportingText={info.row.original.user.email}
              statusIcon={false}
            />
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.staff_id, {
        id: 'idNumber',
        header: 'ID Number',
        size: 140,
      }),
      columnHelper.accessor((row) => row.employee_contracts[0]?.position, {
        id: 'position',
        header: 'Position',
        size: 220,
      }),
      columnHelper.accessor((row) => row.employee_contracts[0]?.department, {
        id: 'department',
        header: 'Department',
        size: 130,
      }),
      columnHelper.accessor((row) => row.employee_contracts[0]?.emp_status, {
        id: 'emp_status',
        header: 'Emp. Status',
        size: 130,
        cell: (info) => (
          <Badge size="sm" color="blue-light" icon="none">
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('id', {
        id: 'viewEmployeeDetail',
        header: '',
        enableSorting: false,
        size: 72,
        cell: (info) =>
          checkIsItemExist(jwtInformation?.payload?.role, [
            RoleDefinition.HEAD_OF_OPERATION,
            RoleDefinition.ADMIN,
            RoleDefinition.SUPERADMIN,
          ]) || info.row.original.id === jwtInformation.payload.employee_id ? (
            <Link href={`/dashboard/internal/employee/${info.getValue()}`}>
              <Button type="button" btnType="normal" size="sm" variant="secondary-gray" btnFormat="square">
                <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
              </Button>
            </Link>
          ) : null,
      }),
    ],
    [],
  )

  const columnsDraftEmployeeTable = useMemo<ColumnDef<Employee, any>[]>(
    () => [
      columnHelper.accessor((row) => `${row.full_name} ${row.user.email}`, {
        id: 'name',
        header: 'Name',
        cell: (info) => (
          <AvatarLabelGroup
            size={'md'}
            image={info.row.original.pass_photo_path ? info.row.original.pass_photo_path?.[0] : ''}
            text={info.row.original.full_name}
            supportingText={info.row.original.user.email}
            statusIcon={false}
          />
        ),
      }),
      columnHelper.accessor((row) => row.form_progress, {
        id: 'formProgress',
        header: 'Progress',
        cell: (info) => <span className="font-semibold">{info.getValue()}%</span>,
      }),
      columnHelper.accessor((row) => row.created_at, {
        id: 'createdAt',
        header: 'Created at',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        cell: (info) => dayjs(info.renderValue()).format('DD MMMM YYYY'),
      }),
      columnHelper.accessor((row) => row.updated_at, {
        id: 'updatedAt',
        header: 'Updated at',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        cell: (info) => dayjs(info.renderValue()).format('DD MMMM YYYY'),
      }),
      columnHelper.accessor('id', {
        header: '',
        enableSorting: false,
        cell: (info) => (
          <Button
            type="button"
            btnType="normal"
            size="sm"
            variant="secondary-gray"
            btnFormat="square"
            onClick={() => {
              sessionStorage.setItem('employee_id', info.row.original.id)
              sessionStorage.setItem('form_wizard_history_employee', info.row.original.form_state)
              router.push(`/dashboard/internal/employee/edit/${info.row.original.id}`)
            }}
          >
            <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
          </Button>
        ),
      }),
    ],
    [],
  )

  useEffect(() => {
    employeeListActiveTrigger()
    subordinateTrigger()
  }, [employeeListActiveTrigger, subordinateTrigger])

  if (employeeListActiveError) {
    return <pre>Error: {JSON.stringify(employeeListActiveError, null, 2)}</pre>
  }
  if (subordinateError) {
    return <pre>Error: {JSON.stringify(subordinateError, null, 2)}</pre>
  }

  return (
    <>
      <NextSeo title="Employee List" canonical={`${MAIN_URL_FE}dashboard/internal/employee`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Internal', url: '' },
          { title: 'Employee List', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--people">
        <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">Employee List</h1>
            <p className="text-base font-normal text-gray-600">
              Manage your employee and their account permissions here.
            </p>
          </div>
          {/* <RoleFilterProvider features="Add new employee data">
          </RoleFilterProvider> */}
          <div className="flex shrink-0 items-center gap-4">
            {checkIsItemExist(jwtInformation?.payload?.role, [
              RoleDefinition.HEAD_OF_OPERATION,
              'general_manager',
              RoleDefinition.ADMIN,
              RoleDefinition.SUPERADMIN,
            ]) ? (
              <Link href={`${router.pathname}/add`} passHref>
                <Button type="button" btnType="normal" size="md" variant="primary">
                  Add Employee
                  <PlusIcon className="h-5 w-5 stroke-white" />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <HorizontalTabs
          tabLists={['Active Employee', 'Inactive Employee', 'Subordinate', 'Draft Employee']}
          type="underline"
          size="sm"
          handleIndex={handleIndexTabs}
          index={index}
          gapLayout={true}
        >
          <div>
            <TableCore
              supportTableType="normal"
              data={employeeListActiveData}
              columns={columnsActiveEmployeeTable}
              useSearchBar={true}
              buttons={[
                {
                  id: 'position',
                  column: 'employee_contracts[].position',
                  label: 'Position',
                  isArray: true,
                },
                {
                  id: 'department',
                  column: 'employee_contracts[].department',
                  label: 'Department',
                  isArray: true,
                },
                {
                  id: 'emp_status',
                  column: 'employee_contracts[].emp_status',
                  label: 'Emp. Status',
                  isArray: true,
                },
              ]}
            />
          </div>
          <div>
            <TableCore supportTableType="external" data={[]} columns={columnsActiveEmployeeTable} />
          </div>
          <div>
            <TableCore
              supportTableType="normal"
              data={subordinateData}
              columns={columnsActiveEmployeeTable}
              useSearchBar={true}
              buttons={[
                {
                  id: 'position',
                  column: 'employee_contracts[].position',
                  label: 'Position',
                  isArray: true,
                },
                {
                  id: 'department',
                  column: 'employee_contracts[].department',
                  label: 'Department',
                  isArray: true,
                },
                {
                  id: 'emp_status',
                  column: 'employee_contracts[].emp_status',
                  label: 'Emp. Status',
                  isArray: true,
                },
              ]}
            />
          </div>
          <div>
            <TableCore supportTableType="external" data={draftedEmployeeList} columns={columnsDraftEmployeeTable} />
          </div>
        </HorizontalTabs>
      </div>
      </Dashboard>
    </>
  )
}

export default EmployeeList

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
    const draftEmployee = await employeeApi.employeeControllerGetAllEmployee('', '', true)

    const authTokenJWT = safeDecodeJwt(auth_token)

    if (!authTokenJWT) {
      return { redirect: { destination: '/refresh', permanent: false } }
    }
    return {
      props: {
        draftedEmployeeList: draftEmployee.data.data,
        jwtInformation: authTokenJWT,
        activeSidebar: 'Employee List',
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
