import { resolveAuthToken, safeDecodeJwt } from '@/utils/ssrAuth'
import { TableCore } from '@/components/TableCore'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { theme } from '@/types/themes'
import { RolesAnnonateType } from '@/types/vendor'
import { employeeApi, identityApi } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE, PUSKAPA_ROLES } from '@/utils/constant'
import { rolesBadgeColor, slugify, snakeCase, transformToNormalFormat } from '@/utils/globalHelper'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { GetServerSideProps } from 'next'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Employee, UpdateUserRequest } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

const AvatarLabelGroup: any = dynamic(() => import('@/components/AvatarLabelGroup').then((mod) => mod.AvatarLabelGroup))
const Badge: any = dynamic(() => import('@/components/Badge').then((mod) => mod.Badge))
const Button: any = dynamic(() => import('@/components/Button').then((mod) => mod.Button))
const Drawer: any = dynamic(() => import('@/components/Drawer').then((mod) => mod.Drawer))
const Input: any = dynamic(() => import('@/components/Input').then((mod) => mod.Input))
const Modal: any = dynamic(() => import('@/components/Modal').then((mod) => mod.Modal))
const AlertCircleIcon: any = dynamic(() =>
  import('@/components/icon/AlertCircleIcon').then((mod) => mod.AlertCircleIcon),
)
const Edit05Icon: any = dynamic(() => import('@/components/icon/Edit05Icon').then((mod) => mod.Edit05Icon))
const LayersThree02Icon: any = dynamic(() =>
  import('@/components/icon/LayersThree02Icon').then((mod) => mod.LayersThree02Icon),
)
const SearchIcon: any = dynamic(() => import('@/components/icon/SearchIcon').then((mod) => mod.SearchIcon))
const Trash03Icon: any = dynamic(() => import('@/components/icon/Trash03Icon').then((mod) => mod.Trash03Icon))
const Switch: any = dynamic(() => import('@/components/ui/switch').then((mod) => mod.Switch))
const Dashboard: any = dynamic(() => import('@/layout/Dashboard').then((mod) => mod.Dashboard))

type ModalStatement = {
  deleteConfirmationModal: boolean
}

const columnHelper = createColumnHelper<Employee>()

const getAllLocalEmployee = async () => {
  const activeEmployee = await employeeApi.employeeControllerGetAllEmployee('', '', false)

  return activeEmployee?.data?.data
}

const UserManegement = () => {
  const { userLoggedinInformation } = useDashboardContext()
  const [editRoleDrawer, setEditRoleDrawer] = useState<boolean>(false)
  const [userInformation, setUserInformation] = useState<Employee | null>(null)
  const [checkedRoles, setCheckedRoles] = useState<string[] | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    deleteConfirmationModal: false,
  })
  const [userId, setUserId] = useState<string>('')

  const { data: employeeListData, trigger: employeeListTrigger } = useSWRMutation('employee', getAllLocalEmployee)

  const handleEmployeeStatus = useCallback(async (id: string, inputUpdateUser: UpdateUserRequest) => {
    const identityApiRes = identityApi.userControllerUpdateUsers(id, inputUpdateUser)

    toast.promise(identityApiRes, {
      pending: 'Updating user status',
      success: 'User status updated',
      error: 'Promise rejected 🤯',
    })

    identityApiRes.then(() => {
      employeeListTrigger()
    })
  }, [])

  const submitRolesSetting = async () => {
    const submitvalue = {
      status: userInformation.user.status,
      email: userInformation.user.email,
      role: checkedRoles,
      acl: [''],
    }
    // console.log('submitvalue', submitvalue)
    // return false
    const identityApiRes = identityApi.userControllerUpdateUsers(userInformation.user_id, submitvalue)

    toast.promise(identityApiRes, {
      pending: 'Updating user role',
      success: 'User role updated',
      error: 'Promise rejected 🤯',
    })

    identityApiRes.then(() => {
      closeEditUserRoleDrawer()
      employeeListTrigger()
    })
  }

  const openDeleteConfirmationModal = (id: string) => {
    setUserId(id)
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      deleteConfirmationModal: true,
    }))
  }

  const closeDeleteConfirmationModal = () => {
    setIsOpenModal((prev: ModalStatement) => ({
      ...prev,
      deleteConfirmationModal: false,
    }))
  }

  const deleteUser = async () => {
    const deleteUserRes = identityApi.userControllerDeleteUserById(userId)

    toast.promise(deleteUserRes, {
      pending: 'Deleting user...',
      success: 'User deleted successfully',
      error: 'Promise rejected 🤯',
    })

    deleteUserRes.finally(() => {
      employeeListTrigger()
    })
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const openEditUserRoleDrawer = (user: Employee) => {
    setUserInformation(user)
    setEditRoleDrawer(true)
  }

  const closeEditUserRoleDrawer = () => {
    setEditRoleDrawer(false)
  }

  const columnsEmployeeTable = useMemo<ColumnDef<Employee, any>[]>(
    () => [
      columnHelper.accessor((row) => `${row.full_name} ${row.user.email}`, {
        id: 'name',
        header: 'Name',
        size: 324,
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
      columnHelper.accessor((row) => row.employee_contracts[0]?.position, {
        id: 'position',
        header: 'Position',
        size: 210,
      }),
      columnHelper.accessor((row) => row.employee_contracts[0]?.department, {
        id: 'department',
        header: 'Department',
        size: 170,
      }),
      columnHelper.accessor((row) => row.user.role?.join(', '), {
        id: 'roles',
        header: 'Roles',
        enableSorting: false,
        size: 265,
        cell: (info) => (
          <div className="inline-flex gap-1">
            {info.getValue()?.length ? (
              info
                .getValue()
                .split(',')
                .slice(0, 2)
                .map((item: string) => (
                  <Badge
                    key={slugify(item)}
                    size="sm"
                    color={rolesBadgeColor(transformToNormalFormat(item) as RolesAnnonateType)}
                    icon="none"
                  >
                    {item ? transformToNormalFormat(item) : 'Unset Role'}
                  </Badge>
                ))
            ) : (
              <Badge key={info.row.original.user_id} size="sm" color="gray" icon="none">
                Unset Role
              </Badge>
            )}
            {info.getValue()?.length
              ? info.getValue().split(',').length > 2 && (
                  <Badge size="sm" color="blue-gray" icon="none">
                    +{Number(info.getValue().split(',').length - 2)}
                  </Badge>
                )
              : null}
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.user.status, {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        size: 130,
        cell: (info) => (
          <div className="inline-flex items-center gap-3 hover:cursor-pointer">
            <Switch
              checked={info.getValue()}
              onCheckedChange={() =>
                handleEmployeeStatus(info.row.original.user_id, {
                  status: !info.getValue(),
                  email: info.row.original.user.email,
                  role: info.row.original.user.role ? [...info.row.original.user.role] : [],
                  acl: [''],
                })
              }
            />
            <p className="text-sm text-gray-900">{info.getValue() ? 'Active' : 'Inactive'}</p>
          </div>
        ),
      }),
      columnHelper.accessor('id', {
        id: 'viewEmployeeDetail',
        header: '',
        enableSorting: false,
        size: 116,
        cell: (info) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              btnFormat="square"
              onClick={() => openEditUserRoleDrawer(info.row.original)}
            >
              <Edit05Icon className="h-5 w-5 stroke-gray-700" />
            </Button>
            <Button
              type="button"
              btnType="normal"
              size="sm"
              variant="secondary-gray"
              btnFormat="square"
              onClick={() => openDeleteConfirmationModal(info.row.original.user_id)}
            >
              <Trash03Icon className="h-5 w-5 stroke-gray-700" />
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  useEffect(() => {
    if (editRoleDrawer === false) {
      setTimeout(() => {
        setUserInformation(null)
        setCheckedRoles(null)
        setInputValue('')
        setDebouncedValue('')
        setSearchResults([])
      }, 300)
    }
  }, [editRoleDrawer])

  useEffect(() => {
    if (userInformation) {
      setCheckedRoles([...(userInformation?.user.role ?? [])])
    }
  }, [userInformation])

  useEffect(() => {
    employeeListTrigger()
  }, [])

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(inputValue)
    }, 500) // 500ms delay

    return () => {
      clearTimeout(timerId)
    }
  }, [inputValue])

  useEffect(() => {
    // Assuming `dataArray` is your array of data
    const results = PUSKAPA_ROLES.filter((item) => item.toLowerCase().includes(debouncedValue.toLowerCase()))
    setSearchResults(results)
  }, [debouncedValue, editRoleDrawer])

  if (!userLoggedinInformation) {
    return <></>
  }

  return (
    <>
      <NextSeo title="User Management" canonical={`${MAIN_URL_FE}dashboard/user-management/user`} />
      <Dashboard
        breadcrumbLists={[
          { title: 'Admin Zone', url: '' },
          { title: 'User Management', url: '' },
        ]}
      >
        <div className="sim-ui-v3 sim-ui-v3--admin">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-10 py-5 sm:flex-row sm:items-center sm:gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">SIMPUSKAPA User List</h1>
            </div>
          </div>
          <div className="p-7 xl:p-10">
            <TableCore
              supportTableType="normal"
              data={employeeListData}
              columns={columnsEmployeeTable}
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
                  id: 'roles',
                  column: 'user.role',
                  label: 'Roles',
                  isArray: true,
                },
              ]}
            />
          </div>
        </div>
      </Dashboard>
      <Drawer
        isOpen={editRoleDrawer}
        setIsOpen={setEditRoleDrawer}
        title={userInformation?.full_name}
        description="Edit Roles"
        icon={<LayersThree02Icon className="h-5 w-5 stroke-primary-600" />}
        footerButton={[
          <Button
            key={0}
            type="button"
            btnType="normal"
            variant="secondary-gray"
            size="md"
            onClick={closeEditUserRoleDrawer}
          >
            Cancel
          </Button>,
          <Button
            key={1}
            type="submit"
            btnType="normal"
            variant="primary"
            size="md"
            onClick={submitRolesSetting}
            disabled={checkedRoles?.length === 0}
          >
            Apply
          </Button>,
        ]}
      >
        <div>
          <Input
            type="text"
            placeholder="Search for roles"
            primaryIcon={<SearchIcon />}
            className="mb-6"
            value={inputValue}
            onChange={(e: any) => handleInputChange(e.target.value)}
          />
          <p className="mb-4 text-sm font-medium text-gray-700">SIMPUSKAPA Roles</p>
          <ul className="flex flex-col gap-3">
            {searchResults.map((role) => (
              <li key={snakeCase(role)}>
                <div className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={snakeCase(role)}
                    name={snakeCase(role)}
                    value={snakeCase(role)}
                    className="input-checkbox"
                    checked={checkedRoles?.includes(snakeCase(role))}
                    onChange={() => {
                      if (checkedRoles?.includes(snakeCase(role))) {
                        setCheckedRoles(checkedRoles?.filter((item) => item !== snakeCase(role)))
                      } else {
                        setCheckedRoles([...(checkedRoles ?? []), snakeCase(role)])
                      }
                    }}
                  />
                  <label htmlFor={snakeCase(role)} className="select-none hover:cursor-pointer">
                    <Badge key={slugify(role)} size="md" color={rolesBadgeColor(role as RolesAnnonateType)} icon="none">
                      {role}
                    </Badge>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Drawer>
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Are you sure want to delete this user?"
        modalDescription="When you delete it, there is no way to undo the action. Please make sure you are aware that it will happen."
        modalButtons={[
          <>
            <Button
              type="button"
              btnType="normal"
              variant="secondary-gray"
              className="w-full justify-center"
              size="lg"
              onClick={closeDeleteConfirmationModal}
            >
              Cancel
            </Button>
          </>,
          <>
            <Button
              type="button"
              btnType="normal"
              variant="error"
              className="w-full justify-center"
              size="lg"
              onClick={deleteUser}
            >
              Yes, Sure
            </Button>
          </>,
        ]}
        stateModal={isOpenModal.deleteConfirmationModal}
        handleCloseModal={closeDeleteConfirmationModal}
      />
    </>
  )
}

export default UserManegement

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
  if (!authTokenJWT['payload']['role'].includes(RoleDefinition.SUPERADMIN)) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      jwtInformation: authTokenJWT,
      activeSidebar: 'User Management',
    },
  }
}
