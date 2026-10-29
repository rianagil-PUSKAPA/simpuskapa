import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { TableCoreSSR } from '@/components/TableCoreSSR'
import { AlertCircleIcon } from '@/components/icon/AlertCircleIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { PlusIcon } from '@/components/icon/PlusIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { useFilter } from '@/hooks/useFilter'
import { usePagination } from '@/hooks/usePagination'
import { useSearch } from '@/hooks/useSearch'
import { useSorting } from '@/hooks/useSorting'
import { Dashboard } from '@/layout/Dashboard'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { ApprovalStatusType, CurrencyUnion, SortType } from '@/types/global'
import { theme } from '@/types/themes'
import { getProgramListSSR, programApi } from '@/utils/apiRequestHelper'
import { MAIN_URL_FE } from '@/utils/constant'
import { formatCurrency, isNumber } from '@/utils/globalHelper'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ProgramCreateRequestProgramOwnershipTypeEnum, ProgramListData } from 'sdk/api'
import useSWRMutation from 'swr/mutation'
import { removeCookie } from 'typescript-cookie'

type Props = {
  program_ownership_type: ProgramCreateRequestProgramOwnershipTypeEnum
}

type ModalStatement = {
  deleteConfirmationModal: boolean
}

const columnHelper = createColumnHelper<ProgramListData>()

export const ProgramList = ({ program_ownership_type }: Props) => {
  const router = useRouter()
  const { userLoggedinInformation } = useDashboardContext()
  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    deleteConfirmationModal: false,
  })
  const [deleteAttribute, setDeleteAttribute] = useState<{
    program_id: string
  }>({
    program_id: '',
  })
  const openDeleteConfirmationModal = () => {
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

  const { limit, onPaginationChange, pagination } = usePagination()
  const { sorting, onSortingChange, field, order } = useSorting()
  const { globalFilter, onGlobalFilterChange, handleKeywordChange } = useSearch()
  const { columnFilters, onColumnFiltersChange, setEmptyColumnFilters } = useFilter()

  const {
    data: programData,
    trigger: programTrigger,
    isMutating: externalIsMutating,
  } = useSWRMutation(
    [
      'PROGRAM',
      globalFilter,
      field !== 'created_at' ? `${field}|${order}` : 'created_at|desc',
      columnFilters.find((item) => item.id === 'program_manager')?.value || '',
      columnFilters.find((item) => item.id === 'partner_code')?.value || '',
      '',
      pagination.pageSize,
      pagination.pageIndex + 1,
    ],
    ([programOwnershipType, keyword, sort, program_manager, partner_code, approvalStatus, perPage, page]) =>
      getProgramListSSR(
        programOwnershipType as ProgramCreateRequestProgramOwnershipTypeEnum,
        keyword,
        sort as unknown as SortType,
        program_manager as unknown as string,
        partner_code as unknown as string,
        approvalStatus as unknown as ApprovalStatusType,
        perPage,
        page,
      ),
  )

  const {
    data: internalData,
    trigger: internalTrigger,
    isMutating: internalIsMutating,
  } = useSWRMutation(
    [
      'INTERNAL',
      globalFilter,
      // field !== 'id' ? `${field}|${order}` : '',
      field !== 'created_at' ? `${field}|${order}` : 'created_at|desc',
      columnFilters.find((item) => item.id === 'general_manager')?.value || '',
      columnFilters.find((item) => item.id === 'partner_code')?.value || '',
      '',
      pagination.pageSize,
      pagination.pageIndex + 1,
    ],
    ([programOwnershipType, keyword, sort, general_manager, partner_code, approvalStatus, perPage, page]) =>
      getProgramListSSR(
        programOwnershipType as ProgramCreateRequestProgramOwnershipTypeEnum,
        keyword,
        sort as unknown as SortType,
        general_manager as unknown as string,
        partner_code as unknown as string,
        approvalStatus as unknown as ApprovalStatusType,
        perPage,
        page,
      ),
  )

  const columnsProgramTable = useMemo<ColumnDef<ProgramListData, any>[]>(
    () => [
      columnHelper.accessor((row) => row.program_name, {
        id: 'program_name',
        header: 'Project Name',
        size: 210, // 240
        cell: (info) => <p className="line-clamp-3 font-medium text-gray-900">{info.getValue()}</p>,
      }),
      columnHelper.accessor((row) => row.partner_name, {
        id: 'partner_name',
        header: 'Partner',
        size: 200, // 160
      }),
      columnHelper.accessor((row) => row.program_manager.full_name, {
        id: 'program_manager',
        header: 'Project Manager',
        size: 210, // 240
        cell: (info) => (
          <AvatarLabelGroup
            size={'sm'}
            image={
              info.row.original.program_manager?.pass_photo_path?.[0] || info.row.original.program_manager?.avatar[0]
            }
            text={info.row.original.program_manager?.full_name}
            statusIcon={false}
          />
        ),
      }),
      columnHelper.accessor((row) => row.finance_progress, {
        id: 'finance_progress',
        header: 'Finance Progress',
        size: 130, // 160
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="stepper-progress flex-1">
              <div
                className={cn(
                  'stepper-inner-progress w-0',
                  info.getValue() <= 50 && 'bg-success-600',
                  info.getValue() >= 51 && info.getValue() <= 99 && 'bg-warning-600',
                  info.getValue() === 100 && 'bg-primary-600',
                  info.getValue() >= 101 && 'bg-error-400',
                )}
                style={{
                  width: `${isNumber(info.getValue()) ? info.getValue() : 0}%`,
                }}
              ></div>
            </div>
            <span className="stepper-percentage w-10 text-gray-700">{info.getValue() || 0}%</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.total_budget, {
        id: 'total_budget',
        header: 'Total Budget',
        size: 170, // 200
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_budget.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_budget.split('_')[0] !== 'IDR' && info.row.original.total_budget.split('_')[0]}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_budget.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_budget.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.total_expenses, {
        id: 'total_expenses',
        header: 'Total Expenses',
        size: 170, // 200
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_expenses.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_expenses.split('_')[0] !== 'IDR' &&
                info.row.original.total_expenses.split('_')[0]}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_expenses.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_expenses.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('id', {
        id: 'id',
        header: '',
        size: userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN) ? 105 : 62, // 120 / 72
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-end gap-3">
            {userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN) ? (
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="error-secondary"
                btnFormat="square"
                onClick={() => {
                  openDeleteConfirmationModal()
                  setDeleteAttribute({
                    program_id: info.getValue(),
                  })
                }}
              >
                <Trash01Icon className="h-5 w-5 stroke-error-700" />
              </Button>
            ) : null}
            <Link data-testid={info.getValue()} href={`/dashboard/project/${info.getValue()}`}>
              <Button btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
                <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
              </Button>
            </Link>
          </div>
        ),
      }),
    ],
    [userLoggedinInformation],
  )

  type InternalProgramListData = ProgramListData & {
    general_manager?: {
      id?: string
      full_name?: string
      pass_photo_path?: string[]
      avatar?: string[]
    }
  }
  const getInternalGeneralManager = (row: ProgramListData) => row.program_manager

  const columnsInternalTable = useMemo<ColumnDef<ProgramListData, any>[]>(
    () => [
      columnHelper.accessor((row) => row.program_name, {
        id: 'program_name',
        header: 'Project Name',
        size: 210,
        cell: (info) => <p className="line-clamp-2">{info.getValue()}</p>,
      }),
      columnHelper.accessor((row) => getInternalGeneralManager(row)?.full_name, {
        id: 'program_manager',
        header: 'General Manager',
        size: 210,
        enableSorting: false,
        cell: (info) => {
          const generalManager = getInternalGeneralManager(info.row.original)

          return (
            <AvatarLabelGroup
              size="sm"
              image={generalManager?.pass_photo_path?.[0] || generalManager?.avatar?.[0]}
              text={generalManager?.full_name}
              statusIcon={false}
            />
          )
        },
      }),
      columnHelper.accessor((row) => row.created_by.name, {
        id: 'created_by',
        header: 'Created By',
        size: 210,
        enableSorting: false,
        cell: (info) => (
          <AvatarLabelGroup
            size={'sm'}
            image={info.row.original.created_by.employee_pass_photo}
            text={info.row.original.created_by?.name}
            statusIcon={false}
          />
        ),
      }),
      columnHelper.accessor((row) => row.finance_progress, {
        id: 'finance_progress',
        header: 'Finance Progress',
        size: 130,
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="stepper-progress flex-1">
              <div
                className={cn(
                  'stepper-inner-progress w-0',
                  info.getValue() <= 50 && 'bg-success-600',
                  info.getValue() >= 51 && info.getValue() <= 99 && 'bg-warning-600',
                  info.getValue() === 100 && 'bg-primary-600',
                  info.getValue() >= 101 && 'bg-error-400',
                )}
                style={{
                  width: `${isNumber(info.getValue()) ? info.getValue() : 0}%`,
                }}
              ></div>
            </div>
            <span className="stepper-percentage w-10 text-gray-700">{info.getValue() || 0}%</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.total_budget, {
        id: 'total_budget',
        header: 'Total Budget',
        size: 170,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_budget.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_budget.split('_')[0] !== 'IDR' && info.row.original.total_budget.split('_')[0]}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_budget.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_budget.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.total_expenses, {
        id: 'total_expenses',
        header: 'Total Expenses',
        size: 170,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_expenses.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_expenses.split('_')[0] !== 'IDR' &&
                info.row.original.total_expenses.split('_')[0]}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_expenses.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_expenses.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('id', {
        id: 'id',
        header: '',
        size: userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN) ? 105 : 72,
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-end gap-3">
            {userLoggedinInformation?.role?.includes(RoleDefinition.SUPERADMIN) ? (
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="error-secondary"
                btnFormat="square"
                onClick={() => {
                  openDeleteConfirmationModal()
                  setDeleteAttribute({
                    program_id: info.getValue(),
                  })
                }}
              >
                <Trash01Icon className="h-5 w-5 stroke-error-700" />
              </Button>
            ) : null}
            <Link href={`/dashboard/project/${info.getValue()}`}>
              <Button data-testid={info.getValue()} btnType="div" size="sm" variant="secondary-gray" btnFormat="square">
                <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
              </Button>
            </Link>
          </div>
        ),
      }),
    ],
    [userLoggedinInformation],
  )

  const deleteProgram = () => {
    const deletedProgram = programApi.programControllerDeleteProgram(deleteAttribute.program_id)

    toast.promise(deletedProgram, {
      pending: 'Deleting selected project',
      success: 'Selected project deleted successfully',
      error: 'Promise rejected 🤯',
    })

    deletedProgram.finally(() => {
      closeDeleteConfirmationModal()
      programTrigger()
      internalTrigger()

      router.replace(router.asPath)
    })
  }

  useEffect(() => {
    if (program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program) {
      programTrigger()
    } else if (program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Internal) {
      internalTrigger()
    }
  }, [pagination, field, order, globalFilter, columnFilters, program_ownership_type])

  // console.log('qwerty-====================================')
  // console.log('qwerty-limit, pagination', limit, pagination)
  // console.log('qwerty-sorting, field, order', sorting, field, order)
  // console.log('qwerty-globalFilter', globalFilter)
  // console.log('qwerty-columnFilters', columnFilters)
  // console.log('qwerty-programLength', programLength)
  // console.log('qwerty-programListData', programListData)
  // console.log('qwerty-programData', programData)

  // console.log('count', programLength)
  // console.log('limit', limit)
  // console.log('data', programData)

  // console.log('qwerty-++++++++++++++++++++++++++++++++++++')
  // console.log('berapa ini ', Math.round(programLength / limit))

  // if(externalIsMutating || internalIsMutating) {
  //   return <></>
  // }

  return (
    <>
      <NextSeo
        title={
          program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
            ? 'Project List'
            : 'Internal Needs'
        }
        canonical={`${MAIN_URL_FE}dashboard/project`}
      />
      <Dashboard
        breadcrumbLists={[
          {
            title:
              program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program ? 'Project' : 'Internal',
            url: '',
          },
          {
            title:
              program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? 'Project List'
                : 'Internal Needs',
            url: '',
          },
        ]}
      >
        <div className={cn('sim-project-list-v2', program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Internal && 'sim-internal-needs-v2')}>
        <div className="mb-1 flex flex-col items-start justify-between gap-4 border-b border-b-gray-200 px-7 py-5 sm:flex-row sm:items-center sm:gap-2 xl:px-10">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-gray-900">
              {program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? 'Project List'
                : 'Internal Needs'}
            </h1>
            <p className="sim-project-list-description">
              {program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? 'Explore your projects, monitor financial progress, and manage project information.'
                : 'Manage internal operational needs, track budgets, and monitor payment progress.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link href={'/dashboard/project/add'} passHref>
              <Button
                type="button"
                btnType="normal"
                size="md"
                variant="primary"
                onClick={() => {
                  removeCookie('form_wizard_history_add_program')
                  removeCookie('program_id')
                }}
              >
                Add New Project
                <PlusIcon className="h-5 w-5 stroke-white" />
              </Button>
            </Link>
          </div>
        </div>
        <div className="p-7 xl:p-10">
          <TableCoreSSR
            loading={
              program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? externalIsMutating
                : internalIsMutating
            }
            onPaginationChange={onPaginationChange}
            onSortingChange={onSortingChange}
            pageCount={
              program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? Math.round(programData?.total_data / limit)
                : Math.round(internalData?.total_data / limit)
            }
            pagination={pagination}
            sorting={sorting}
            globalFilter={globalFilter}
            onGlobalFilterChange={onGlobalFilterChange}
            handleKeywordChange={handleKeywordChange}
            columnFilters={columnFilters}
            onColumnFiltersChange={onColumnFiltersChange}
            setEmptyColumnFilters={setEmptyColumnFilters}
            useLoadingAnimation={true}
            supportTableType="normal"
            data={
              program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? programData?.data
                : internalData?.data
            }
            columns={
              program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? columnsProgramTable
                : columnsInternalTable
            }
            useSearchBar={true}
            buttons={
              program_ownership_type === ProgramCreateRequestProgramOwnershipTypeEnum.Program
                ? [
                    {
                      id: 'partner_name',
                      column: 'partner_name',
                      label: 'Partner',
                    },
                    {
                      id: 'program_manager',
                      column: 'program_manager.full_name',
                      label: 'Project Manager',
                    },
                  ]
                : [
                    {
                      id: 'program_manager',
                      column: 'program_manager.full_name',
                      label: 'General Manager',
                    },
                    {
                      id: 'created_by',
                      column: 'created_by.name',
                      label: 'Created By',
                    },
                  ]
            }
          />
        </div>
        </div>
      </Dashboard>
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Are you sure want to delete this project?"
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
              onClick={deleteProgram}
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
