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
import { PRApprovalStatus, PRTypes, PRTypesReadableText } from '@/shared/pr.type'
import { RoleDefinition } from '@/shared/role.access'
import { CurrencyUnion } from '@/types/global'
import { PaymentRequestListType } from '@/types/payment-request'
import { theme } from '@/types/themes'
import { paymentRequestApi } from '@/utils/apiRequestHelper'
import { formatCurrency } from '@/utils/globalHelper'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import useSWRMutation from 'swr/mutation'

type PaymentRequestType = {
  pageScope?: 'index' | 'program_details' | 'requisition_form'
  slugIdentifier: string[]
  isGlobalType?: boolean
  isGlobalData?: boolean
  vendorId?: string
  financeChecker?: string
}
type ModalStatement = {
  deleteConfirmationModal: boolean
}

const columnHelper = createColumnHelper<PaymentRequestListType>()

export const handleFinanceStatusBadgeColor = (financeStatus: string, processedBy: string, paidAt: string) => {
  if (financeStatus !== PRApprovalStatus.APPROVED) {
    return 'blue-gray'
  }
  if (financeStatus === PRApprovalStatus.APPROVED && processedBy === null) {
    return 'warning'
  }
  if (financeStatus === PRApprovalStatus.APPROVED && processedBy !== null && !paidAt) {
    return 'pink'
  }
  if (financeStatus === PRApprovalStatus.APPROVED && processedBy !== null && paidAt) {
    return 'success'
  }
}
export const handleFinanceStatusBadgeText = (financeStatus: string, processedBy: string, paidAt: string) => {
  if (financeStatus !== PRApprovalStatus.APPROVED) {
    return 'Waiting Approval Process'
  }
  if (financeStatus === PRApprovalStatus.APPROVED && processedBy === null) {
    return 'Waiting to be Marked'
  }
  if (financeStatus === PRApprovalStatus.APPROVED && processedBy !== null && !paidAt) {
    return 'Wait for Process Done'
  }
  if (financeStatus === PRApprovalStatus.APPROVED && processedBy !== null && paidAt) {
    return 'Done Process'
  }
}

export const getPaymentRequestList = async (parameter: string) => {
  const [nameParameter, programId, rfId, isGlobalType, vendorId, financeChecker] = parameter.split('/')

  let requestPyamentType: PRTypes = PRTypes.PR

  switch (nameParameter) {
    case PRTypes.PR:
      requestPyamentType = PRTypes.PR
      break
    case PRTypes.APR:
      requestPyamentType = PRTypes.APR
      break
    case PRTypes.APS:
      requestPyamentType = PRTypes.APS
      break
    case PRTypes.TE:
      requestPyamentType = PRTypes.TE
      break
    case PRTypes.APF:
      requestPyamentType = PRTypes.APF
      break

    default:
      break
  }

  const paymentRequestRes = await paymentRequestApi.pRControllerGetListPaymentRequest(
    programId === 'undefined' ? undefined : programId,
    rfId === 'undefined' ? undefined : rfId,
    isGlobalType === 'true' ? undefined : requestPyamentType,
    vendorId === 'undefined' ? undefined : vendorId,
    financeChecker === 'undefined' ? undefined : financeChecker,
  )

  if (!paymentRequestRes.data) {
    return []
  }
  const result = paymentRequestRes.data.data.map((data) => {
    let prType = ''
    switch (data.pr_number.replace(/ /g, '').split('/')[0]) {
      case 'PR':
        prType = PRTypesReadableText.PR
        break
      case 'APR':
        prType = PRTypesReadableText.APR
        break
      case 'APS':
        prType = PRTypesReadableText.APS
        break
      case 'TE':
        prType = PRTypesReadableText.TE
        break
      case 'APF':
        prType = PRTypesReadableText.APF
        break
      default:
        prType = PRTypesReadableText.PR
        break
    }
    return {
      ...data,
      pr_type: prType,
      pr_year: data.pr_number.replace(/ /g, '').split('/')[2],
    }
  })

  return result
}

export const PaymentRequestList = ({
  slugIdentifier,
  isGlobalType = false,
  isGlobalData = false,
  pageScope = 'index',
  vendorId,
  financeChecker,
}: PaymentRequestType) => {
  const router = useRouter()
  const { userLoggedinInformation } = useDashboardContext()
  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    deleteConfirmationModal: false,
  })
  const [deleteAttribute, setDeleteAttribute] = useState<{
    payment_id: string
  }>({
    payment_id: '',
  })

  const {
    data: paymentRequestData,
    error: paymentRequestError,
    trigger: paymentRequestTrigger,
  } = useSWRMutation(
    slugIdentifier
      ? `${slugIdentifier[2]}/${slugIdentifier[0]}/${slugIdentifier[1]}/${isGlobalType}/${vendorId}/${financeChecker}`
      : null,
    getPaymentRequestList,
  )

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

  const deletePayment = () => {
    const deletedPayment = paymentRequestApi.pRControllerDeletePaymentRequest(deleteAttribute.payment_id)

    toast.promise(deletedPayment, {
      pending: 'Deleting selected payment',
      success: 'Selected payment deleted successfully',
      error: 'Promise rejected 🤯',
    })

    deletedPayment.finally(() => {
      paymentRequestTrigger()
      closeDeleteConfirmationModal()
      router.replace(router.asPath)
    })
  }

  const columnsPaymentRequestTable = useMemo<ColumnDef<PaymentRequestListType, any>[]>(
    () => [
      columnHelper.accessor((row) => row.pr_year, {
        id: 'pr_year',
        header: 'Year',
        size: 210,
      }),
      pageScope === 'index'
        ? columnHelper.accessor((row) => row.program_name, {
            id: 'program_name',
            header: 'Project Name',
            size: 210,
            cell: (info) => <p className="line-clamp-2 font-medium text-gray-900">{info.getValue()}</p>,
          })
        : columnHelper.accessor((row) => row.rf_number.replace(/ /g, ''), {
            id: 'rf_number',
            header: 'RF Number',
            size: 210,
            cell: (info) => <p className="break-all font-medium uppercase text-gray-900">{info.getValue()}</p>,
          }),
      columnHelper.accessor((row) => row.pr_type, {
        id: 'pr_type',
        header: 'Type of Payment',
        filterFn: 'equalsString',
        size: 210,
      }),
      columnHelper.accessor((row) => row.description, {
        id: 'description',
        header: 'Activity Name',
        size: 240,
        cell: (info) => <p className="line-clamp-2 text-gray-600">{info.getValue() || '-'}</p>,
      }),
      columnHelper.accessor((row) => row.transfer_amount, {
        id: 'transfer_amount',
        header: 'Transfer Amount',
        size: 210,
        cell: (info) => (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {info.row.original.transfer_amount.split('_')[0] === 'IDR' && 'Rp'}
              {info.row.original.transfer_amount.split('_')[0] === 'USD' && '$'}
            </p>
            <p className="text-sm text-gray-600">
              {formatCurrency(
                info.row.original.transfer_amount.split('_')[0] as unknown as CurrencyUnion,
                Number(info.row.original.transfer_amount.split('_')[1]),
                true,
              )}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.program_manager_approval, {
        id: 'program_manager_approval',
        header: 'Project Manager Status',
        size: 210,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Badge
              size="sm"
              color={
                {
                  approved: 'success',
                  pending: 'warning',
                  rejected: 'error',
                }[info.getValue()]
              }
              icon="circle"
            >
              {
                {
                  pending: 'Pending Approval',
                  approved: 'Approved',
                  rejected: 'Rejected',
                }[info.getValue()]
              }
            </Badge>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.processed_by, {
        id: 'processed_by',
        header: 'Finance Team Status',
        size: 210,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <Badge
              size="sm"
              color={handleFinanceStatusBadgeColor(
                info.row.original.budget_controller_approval,
                info.getValue(),
                info.row.original['paid_at'],
              )}
              icon="circle"
            >
              {handleFinanceStatusBadgeText(
                info.row.original.budget_controller_approval,
                info.getValue(),
                info.row.original['paid_at'],
              )}
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
                    payment_id: info.getValue(),
                  })
                }}
              >
                <Trash01Icon className="h-5 w-5 stroke-error-700" />
              </Button>
            ) : null}
            {info.row.original.pr_number.includes('APS') ? (
              <Link href={`/dashboard/finance/advance-payment-statement/${info.getValue()}`}>
                <Button type="button" btnType="normal" size="sm" variant="secondary-gray" btnFormat="square">
                  <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </Link>
            ) : null}
            {info.row.original.pr_number.includes('PR') || info.row.original.pr_number.includes('APR') ? (
              <Link href={`/dashboard/finance/payment-request/${info.getValue()}`}>
                <Button type="button" btnType="normal" size="sm" variant="secondary-gray" btnFormat="square">
                  <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </Link>
            ) : null}
            {info.row.original.pr_number.includes('APF') ? (
              <Link href={`/dashboard/finance/advance-perdiem-fee/${info.getValue()}`}>
                <Button type="button" btnType="normal" size="sm" variant="secondary-gray" btnFormat="square">
                  <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </Link>
            ) : null}
            {info.row.original.pr_number.includes('TE') ? (
              <Link href={`/dashboard/finance/travel-expenses/${info.getValue()}`}>
                <Button type="button" btnType="normal" size="sm" variant="secondary-gray" btnFormat="square">
                  <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </Link>
            ) : null}
          </div>
        ),
      }),
    ],
    [userLoggedinInformation],
  )

  useEffect(() => {
    paymentRequestTrigger()
  }, [])

  if (paymentRequestError) {
    return <pre>Error: {JSON.stringify(paymentRequestError, null, 2)}</pre>
  }

  if (!paymentRequestData) {
    return <></>
  }

  if (isGlobalData) {
    return (
      <>
        <TableCore
          supportTableType="normal"
          data={(paymentRequestData as unknown as PaymentRequestListType[]) || []}
          columns={columnsPaymentRequestTable}
          useSearchBar={true}
          hiddenColumns={['pr_year']}
          buttons={[
            {
              id: 'program_name',
              column: 'program_name',
              label: 'Project',
            },
            {
              id: 'pr_type',
              column: 'pr_type',
              label: 'Type',
            },
            {
              id: 'pr_year',
              column: 'pr_year',
              label: 'Year',
            },
          ]}
        />
        <Modal
          icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
          theme={theme.ERROR}
          modalTitle="Are you sure want to delete this payment?"
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
                onClick={deletePayment}
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
      <div>
        <ProgramRoleAccessControlProvider
          programId={slugIdentifier[0]}
          task={programTasks.VIEW_RF_LIST_AND_DETAIL}
          action={accessActionType.READ}
          isActionBy={true}
          replaceWith={ForbiddenAccessDisplay(programTasks.VIEW_RF_LIST_AND_DETAIL)}
        >
          <TableCore
            supportTableType="normal"
            data={(paymentRequestData as unknown as PaymentRequestListType[]) || []}
            columns={columnsPaymentRequestTable}
            useSearchBar={true}
            hiddenColumns={['pr_type', 'pr_year']}
            buttons={[
              {
                id: 'pr_type',
                column: 'pr_type',
                label: 'Type',
              },
              {
                id: 'pr_year',
                column: 'pr_year',
                label: 'Year',
              },
            ]}
          />
        </ProgramRoleAccessControlProvider>
      </div>
      <Modal
        icon={<AlertCircleIcon className="h-6 w-6 stroke-error-500" />}
        theme={theme.ERROR}
        modalTitle="Are you sure want to delete this payment?"
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
              onClick={deletePayment}
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
