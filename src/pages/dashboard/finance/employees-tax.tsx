/* eslint-disable tailwindcss/no-custom-classname */
import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { TableCore } from '@/components/TableCore'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { employeeApi, getAllEmployee } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import { Employee } from '@sdk'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import useSWRMutation from 'swr/mutation'

const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const AlertTriangleIcon: any = dynamic(() =>
  import('@/components/icon/AlertTriangleIcon').then((mod) => mod.AlertTriangleIcon),
)
const Pencil01Icon: any = dynamic(() => import('@/components/icon/Pencil01Icon').then((mod) => mod.Pencil01Icon))
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const Loader: any = dynamic(() => import('@/components/Loader').then((mod) => mod.Loader))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

const columnHelper = createColumnHelper<Employee>()

const EmployeesTax = () => {
  const router = useRouter()
  const { userLoggedinInformation } = useDashboardContext()
  const [isEditTax, setisEditTax] = useState(false)
  const [employeeLists, setEmployeeLists] = useState<Employee[]>([])
  const [loadingButtonStatement, setLoadingButtonStatement] = useState<{
    updateTaxExployee: boolean
  }>({
    updateTaxExployee: false,
  })

  const {
    data: employeeData,
    trigger: employeeTrigger,
    isMutating: employeeIsMutating,
  } = useSWRMutation([null], ([role]) => getAllEmployee(role))

  const { handleSubmit } = useForm<Employee>()

  const breadcrumbUrl = useMemo(() => {
    const allowedRoles = [RoleDefinition.HEAD_OF_FINANCE, RoleDefinition.FINANCE_TEAM, RoleDefinition.SUPERADMIN]
    return allowedRoles.includes(userLoggedinInformation?.role) ? '' : ''
  }, [userLoggedinInformation])

  const columnsEmployeeTable = useMemo<ColumnDef<Employee, any>[]>(
    () => [
      columnHelper.accessor((row) => `${row.full_name} ${row.user.email}`, {
        id: 'name',
        header: 'Name',
        size: 288,
        cell: (info) => (
          <AvatarLabelGroup
            size={'md'}
            image={info.row.original.pass_photo_path?.[0]}
            text={info.row.original.full_name}
            supportingText={info.row.original.user.email}
            statusIcon={false}
          />
        ),
      }),
      columnHelper.accessor((row) => row.staff_id, {
        id: 'staff_id',
        header: 'ID Number',
        size: 144,
      }),
      columnHelper.accessor((row) => row.employee_contracts[0]?.position, {
        id: 'position',
        header: 'Position',
        size: 288,
      }),
      columnHelper.accessor((row) => row.employee_contracts[0]?.department, {
        id: 'department',
        header: 'Department',
        size: 150,
      }),
      columnHelper.accessor((row) => row.perdiem_tax_percentage, {
        id: 'perdiem_tax_percentage',
        header: 'Employee’s Tax',
        size: 208,
        cell: (info) => <p>{info.getValue() ? `${info.getValue()}%` : '0%'}</p>,
      }),
    ],
    [],
  )

  const handleInputChange = (employeeId: string, event: any) => {
    const { name, value } = event.target

    if (value > 100) {
      toast.warning('Tax percentage cannot be greater than 100%', {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      return false
    }

    if (value < 0) {
      toast.warning('Tax percentage cannot be less than 0%', {
        autoClose: 10000,
        icon: <AlertTriangleIcon className="h-5 w-5 stroke-warning-500" />,
      })
      return false
    }

    setEmployeeLists((prevEmp) => {
      return prevEmp.map((emp) => {
        if (emp.id === employeeId) {
          return { ...emp, [name]: value }
        }
        return emp
      })
    })
  }

  const updateEmployeeTaxSubmit: SubmitHandler<Employee> = async () => {
    setLoadingButtonStatement((prev) => ({ ...prev, updateTaxExployee: true }))
    const perdiemTax = employeeApi.employeeControllerSetPerdiemTax({
      employees: employeeLists.map((emp) => ({
        employee_id: emp.id,
        perdiem_tax_percentage: Number(emp.perdiem_tax_percentage || 0),
      })),
    })

    toast.promise(perdiemTax, {
      pending: `Saving employee tax update...`,
      success: `Employee tax updated successfully`,
      error: 'Failed to save employee tax update',
    })

    perdiemTax.finally(() => {
      router.replace(router.asPath)
      setLoadingButtonStatement((prev) => ({
        ...prev,
        updateTaxExployee: false,
      }))
      setisEditTax(false)
    })
  }

  useEffect(() => {
    if (employeeData?.length > 0) {
      setEmployeeLists(employeeData)
    }
  }, [employeeData])

  useEffect(() => {
    employeeTrigger()
  }, [])

  if (employeeIsMutating) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader customText="Loading employee’s tax..." />
      </div>
    )
  }

  return (
    <>
      <NextSeo title="Employee’s Tax" canonical={`${MAIN_URL_FE}dashboard/finance/employees-tax`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Finance', url: breadcrumbUrl },
          {
            title: "Employee's Tax",
            url: '',
          },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--finance">
          <form onSubmit={handleSubmit(updateEmployeeTaxSubmit)}>
            <div className="flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-10 py-5 sm:flex-row sm:items-center sm:gap-2">
              <div>
                <h1 className="mb-1 text-2xl font-semibold text-gray-900">Employee’s Tax</h1>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {isEditTax ? (
                  <>
                    <Button
                      type="button"
                      btnType="normal"
                      size="md"
                      variant="secondary-gray"
                      onClick={() => setisEditTax(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      btnType="normal"
                      size="md"
                      variant="primary"
                      isLoading={loadingButtonStatement.updateTaxExployee}
                    >
                      Submit Changes
                    </Button>
                  </>
                ) : (
                  <Button btnType="div" size="md" variant="secondary-gray" onClick={() => setisEditTax(true)}>
                    <Pencil01Icon className="h-5 w-5 stroke-gray-700" />
                    Edit Employee’s Tax
                  </Button>
                )}
              </div>
            </div>
            <div className="my-4 px-10 xs:my-6 sm:my-8">
              {!isEditTax ? (
                <TableCore
                  supportTableType="normal"
                  useSearchBar={true}
                  data={employeeLists}
                  columns={columnsEmployeeTable}
                  initialRows={employeeLists?.length || 0}
                  useFooter={false}
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
                  ]}
                />
              ) : (
                <div className="table-container">
                  <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
                  <div className="table-wrapper overflow-x-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
                    <div className="table-selection w-full min-w-fit table-fixed text-gray-600">
                      <div className="border-y border-y-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="w-72 max-w-full px-4 py-3.5 pl-6 text-left text-xs font-medium text-gray-600">
                            Name
                          </div>
                          <div className="w-36 max-w-full px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                            ID Number
                          </div>
                          <div className="w-72 max-w-full px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                            Position
                          </div>
                          <div className="w-32 max-w-full px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                            Department
                          </div>
                          <div className="w-52 max-w-full px-4 py-3.5 text-left text-xs font-medium text-gray-600">
                            Employee’s Tax
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-200 text-sm">
                        {employeeLists?.map((employee) => (
                          <div className="flex items-center justify-between" key={employee.id}>
                            <div className="w-72 p-4 pl-6">
                              <AvatarLabelGroup
                                size={'md'}
                                image={employee.pass_photo_path ? employee.pass_photo_path?.[0] : ''}
                                text={employee.full_name}
                                supportingText={employee.user.email}
                                statusIcon={false}
                              />
                            </div>
                            <div className="w-36 p-4">{employee.staff_id}</div>
                            <div className="w-72 p-4 capitalize">{employee.employee_contracts[0]?.position}</div>
                            <div className="w-32 p-4">{employee.employee_contracts[0]?.department}</div>
                            <div className="w-52 p-4 lowercase">
                              {isEditTax ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    name="perdiem_tax_percentage"
                                    type="number"
                                    value={employee.perdiem_tax_percentage || ''}
                                    placeholder="0"
                                    onChange={(e) => handleInputChange(employee.id, e)}
                                    size="sm"
                                  />
                                  <p>%</p>
                                </div>
                              ) : (
                                <p>{employee.perdiem_tax_percentage ? `${employee.perdiem_tax_percentage}%` : '0%'}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </Dashboard>
    </>
  )
}

export default EmployeesTax

export const getServerSideProps: GetServerSideProps = async (context) => {
  /* 
    Quite weird and tricky case, because cookies at next server won't get updated cookies (refresh_token) from middleware in normal way, so i found this amazing hint from next's github issus, finally after hour :))
    https://github.com/vercel/next.js/issues/36049
    */

  const getUpdatedCookiesFromMiddleware = context.res.getHeader('set-cookie')
  // parseAuthToken handled by resolveAuthToken helper

  const auth_token = resolveAuthToken(getUpdatedCookiesFromMiddleware, context.req.cookies.auth_token)

  const authTokenJWT = safeDecodeJwt(auth_token)

  if (!authTokenJWT) {
    return { redirect: { destination: '/refresh', permanent: false } }
  }
  if (
    !authTokenJWT['payload']['role'].includes(RoleDefinition.HEAD_OF_FINANCE) &&
    !authTokenJWT['payload']['role'].includes(RoleDefinition.SUPERADMIN)
  ) {
    return {
      notFound: true,
    }
  }

  try {
    return {
      props: {
        activeSidebar: 'Employee’s Tax',
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
