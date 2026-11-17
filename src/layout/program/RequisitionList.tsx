import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { TableCore } from '@/components/TableCore'
import { AlertCircleIcon } from '@/components/icon/AlertCircleIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { useDashboardContext } from '@/providers/DashboardProvider'
import ProgramRoleAccessControlProvider, {
  ForbiddenAccessDisplay,
  accessActionType,
  programTasks,
} from '@/providers/ProgramRoleAccessControl'
import { RoleDefinition } from '@/shared/role.access'
import { CurrencyUnion } from '@/types/global'
import { theme } from '@/types/themes'
import { requisitionFormApi } from '@/utils/apiRequestHelper'
import { formatCurrency } from '@/utils/globalHelper'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { RequisitionFormSimple } from 'sdk/api'
import useSWRMutation from 'swr/mutation'

type RequisitionListType = {
  slugIdentifier: string[]
  isGlobal?: boolean
}

type ModalStatement = {
  deleteConfirmationModal: boolean
}

const columnHelper = createColumnHelper<RequisitionFormSimple>()

export const getProcurementList = async (parameter: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, programId, userLoggedId] = parameter.split('/')

  if (programId === 'undefined') {
    const requisitionAllRes = await requisitionFormApi.rFControllerGetListRfAll()

    const result = requisitionAllRes.data.data.map((data) => ({
      ...data,
      rf_type: data.rf_number.replace(/ /g, '').split('/')[0].split('-')[1],
      rf_year: data.rf_number.replace(/ /g, '').split('/')[2],
    }))

    return result
  } else {
    const hasRequisitionRes = await requisitionFormApi.rFControllerCheckLogedinUserHasRfInProgram(programId)

    const requisitionRes = await requisitionFormApi.rFControllerGetListRf(
      programId === 'undefined' ? undefined : programId,
      hasRequisitionRes.data.data ? userLoggedId : '',
    )

    const result = requisitionRes.data.data.map((data) => ({
      ...data,
      rf_type: data.rf_number.replace(/ /g, '').split('/')[0].split('-')[1],
      rf_year: data.rf_number.replace(/ /g, '').split('/')[2],
    }))

    return result
  }
}

export const RequisitionList = ({ slugIdentifier, isGlobal = false }: RequisitionListType) => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  const [deleteAttribute, setDeleteAttribute] = useState<{
    program_id: string
    project_id: string
    rf_id: string
  }>({
    program_id: '',
    project_id: '',
    rf_id: '',
  })

  // console.log('deleteAttribute', deleteAttribute)

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    deleteConfirmationModal: false,
  })

  const { data: requisitionData, trigger: requisitionTrigger } = useSWRMutation(
    `requisition/${slugIdentifier[0]}`,
    getProcurementList,
  )

  // console.log('requisitionData', requisitionData)

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

  const deleteRF = async () => {
    // console.log('popopo')
    // console.log('deleteAttribute', deleteAttribute)

    const deletedRf = requisitionFormApi.rFControllerDeleteRFById(
      deleteAttribute.program_id,
      deleteAttribute.project_id,
      deleteAttribute.rf_id,
    )

    toast.promise(deletedRf, {
      pending: 'Deleting selected RF',
      success: 'Selected RF deleted successfully',
      error: 'Promise rejected 🤯',
    })

    deletedRf.finally(() => {
      closeDeleteConfirmationModal()
      router.replace(router.asPath)
      requisitionTrigger()
    })
  }

  const columnsRequisitionTableInner = useMemo<ColumnDef<RequisitionFormSimple, any>[]>(
    () => [
      columnHelper.accessor((row) => row['rf_type'], {
        id: 'rf_type',
        header: 'RF Type',
        filterFn: 'equalsString',
      }),
      columnHelper.accessor((row) => row.rf_number, {
        id: 'rf_number',
        header: 'RF Number',
        size: 210,
        cell: (info) => <p className="break-all font-medium uppercase text-gray-900">{info.getValue()}</p>,
      }),
      columnHelper.accessor((row) => row.about_request, {
        id: 'about_request',
        header: 'Activity Name',
        size: 210,
        cell: (info) => <p className="line-clamp-2">{info.getValue()}</p>,
      }),
      columnHelper.accessor((row) => row.total_request, {
        id: 'total_request',
        header: 'Total Request',
        size: 210,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_request.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_request.split('_')[0] === 'USD' && '$'}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_request.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_request.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.program_manager_approval_status, {
        id: 'program_manager_approval_status',
        header: 'Project Manager Status',
        size: 190,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Badge
              size="sm"
              color={
                {
                  approved: 'success',
                  pending: 'warning',
                  rejected: 'error',
                  revision: 'error',
                }[info.getValue()]
              }
              icon="circle"
            >
              {
                {
                  pending: 'Pending Approval',
                  approved: 'Approved',
                  rejected: 'Rejected',
                  revision: 'Rejected',
                }[info.getValue()]
              }
            </Badge>
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
                    program_id: info.row.original.program_id,
                    project_id: info.row.original.project_id,
                    rf_id: info.getValue(),
                  })
                }}
              >
                <Trash01Icon className="h-5 w-5 stroke-error-700" />
              </Button>
            ) : null}
            <Link
              href={`/dashboard/procurement/${router.query.slug?.[0] || info.row.original.program_id}/detail/${
                info.row.original.project_id
              }/${info.getValue()}`}
            >
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

  const columnsRequisitionTableGlobal = useMemo<ColumnDef<RequisitionFormSimple, any>[]>(
    () => [
      columnHelper.accessor((row) => row['program_name'], {
        id: 'program_name',
        header: 'Project Name',
        filterFn: 'equalsString',
        size: 210,
      }),
      columnHelper.accessor((row) => row['rf_type'], {
        id: 'rf_type',
        header: 'RF Type',
        filterFn: 'equalsString',
      }),
      columnHelper.accessor((row) => row['rf_year'], {
        id: 'rf_year',
      }),
      columnHelper.accessor((row) => row.partner_name, {
        id: 'partner_name',
        header: 'Partner Name',
        filterFn: 'equalsString',
      }),
      columnHelper.accessor((row) => row.rf_number, {
        id: 'rf_number',
        header: 'RF Number',
        size: 210,
        cell: (info) => <p className="break-all font-medium uppercase text-gray-900">{info.getValue()}</p>,
      }),
      columnHelper.accessor((row) => row.about_request, {
        id: 'about_request',
        header: 'Activity Name',
        size: 210,
        cell: (info) => <p className="line-clamp-2">{info.getValue()}</p>,
      }),
      columnHelper.accessor((row) => row.total_request, {
        id: 'total_request',
        header: 'Total Request',
        size: 210,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.total_request.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.total_request.split('_')[0] === 'USD' && '$'}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.total_request.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.total_request.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.program_manager_approval_status, {
        id: 'program_manager_approval_status',
        header: 'Project Manager Status',
        size: 190,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Badge
              size="sm"
              color={
                {
                  approved: 'success',
                  pending: 'warning',
                  rejected: 'error',
                  revision: 'error',
                }[info.getValue()]
              }
              icon="circle"
            >
              {
                {
                  pending: 'Pending Approval',
                  approved: 'Approved',
                  rejected: 'Rejected',
                  revision: 'Rejected',
                }[info.getValue()]
              }
            </Badge>
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
                    program_id: info.row.original.program_id,
                    project_id: info.row.original.project_id,
                    rf_id: info.getValue(),
                  })
                }}
              >
                <Trash01Icon className="h-5 w-5 stroke-error-700" />
              </Button>
            ) : null}
            <Link
              href={`/dashboard/procurement/${router.query.slug?.[0] || info.row.original.program_id}/detail/${
                info.row.original.project_id
              }/${info.getValue()}`}
            >
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

  useEffect(() => {
    requisitionTrigger()
  }, [])

  if (isGlobal) {
    return (
      <>
        <TableCore
          supportTableType="normal"
          data={requisitionData as unknown as RequisitionFormSimple[]}
          columns={columnsRequisitionTableGlobal}
          useSearchBar={true}
          hiddenColumns={['program_name', 'partner_name', 'rf_year', 'rf_type']}
          buttons={[
            {
              id: 'program_name',
              column: 'program_name',
              label: 'Project',
            },
            {
              id: 'partner_name',
              column: 'partner_name',
              label: 'Partner',
            },
            {
              id: 'rf_year',
              column: 'rf_year',
              label: 'Year',
            },
          ]}
        />
        <Modal
          icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
          theme={theme.ERROR}
          modalTitle="Are you sure want to delete this RF?"
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
                onClick={deleteRF}
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

  return (
    <>
      <ProgramRoleAccessControlProvider
        programId={slugIdentifier[0]}
        task={programTasks.VIEW_RF_LIST_AND_DETAIL}
        action={accessActionType.READ}
        isActionBy={true}
        replaceWith={ForbiddenAccessDisplay(programTasks.VIEW_RF_LIST_AND_DETAIL)}
      >
        <TableCore
          supportTableType="normal"
          data={requisitionData as unknown as RequisitionFormSimple[]}
          columns={columnsRequisitionTableInner}
          useSearchBar={true}
          hiddenColumns={['rf_type', 'rf_year', 'partner_name']}
          buttons={[
            {
              id: 'rf_type',
              column: 'rf_type',
              label: 'RF Type',
            },
          ]}
        />
      </ProgramRoleAccessControlProvider>
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Are you sure want to delete this RF?"
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
              onClick={deleteRF}
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
