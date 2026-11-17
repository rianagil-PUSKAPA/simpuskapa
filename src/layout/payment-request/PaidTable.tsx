import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Button } from '@/components/Button'
import { AlertCircleIcon } from '@/components/icon/AlertCircleIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { Trash01Icon } from '@/components/icon/Trash01Icon'
import { Loader } from '@/components/Loader'
import { Modal } from '@/components/Modal'
import { TableCore } from '@/components/TableCore'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { PRTypesReadableText } from '@/shared/pr.type'
import { RoleDefinition } from '@/shared/role.access'
import { CurrencyUnion } from '@/types/global'
import { PaymentRequestListType } from '@/types/payment-request'
import { theme } from '@/types/themes'
import { paymentRequestApi } from '@/utils/apiRequestHelper'
import { formatCurrency } from '@/utils/globalHelper'
import { PaymentRequestSimple } from '@sdk'
import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

type Props = {
  paymentList: PaymentRequestSimple[]
  dateRange: Date[]
  setDateRange: (dateRange: Date[]) => void
}
type ModalStatement = {
  deleteConfirmationModal: boolean
}

const columnHelper = createColumnHelper<PaymentRequestListType>()

export const PaidTable = ({ paymentList, dateRange, setDateRange }: Props) => {
  const { userLoggedinInformation } = useDashboardContext()
  const router = useRouter()

  const [isOpenModal, setIsOpenModal] = useState<ModalStatement | null>({
    deleteConfirmationModal: false,
  })
  const [payments, setPayments] = useState<PaymentRequestListType[] | null>(null)
  const [deleteAttribute, setDeleteAttribute] = useState<{
    payment_id: string
  }>({
    payment_id: '',
  })
  const [filteredPayments, setFilteredPayments] = useState<PaymentRequestListType[] | null>(null)

  const columnsPaymentRequestTable = useMemo<ColumnDef<PaymentRequestListType, any>[]>(
    () => [
      columnHelper.accessor((row) => row.program_name, {
        id: 'program_name',
        header: 'Project Name',
        size: 180,
        cell: (info) => <p className="font-medium text-gray-900">{info.getValue() || '-'}</p>,
      }),
      columnHelper.accessor((row) => row.pr_year, {
        id: 'pr_year',
        header: 'Year',
      }),
      columnHelper.accessor((row) => row.pr_type, {
        id: 'pr_type',
        header: 'Type of Payment',
        filterFn: 'equalsString',
        size: 160,
      }),
      columnHelper.accessor((row) => row.description, {
        id: 'description',
        header: 'Activity Name',
        size: 180,
        cell: (info) => <p className="line-clamp-2 text-gray-600">{info.getValue() || '-'}</p>,
      }),
      columnHelper.accessor((row) => row.transfer_amount, {
        id: 'transfer_amount',
        header: 'Transfer Amount',
        size: 180,
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
      columnHelper.accessor((row) => row.processed_by.name, {
        id: 'processed_by',
        header: 'Processed By',
        size: 180,
        cell: (info) => (
          <AvatarLabelGroup
            size="sm"
            image={
              info.row.original.processed_by?.employee_pass_photo
                ? info.row.original.processed_by?.employee_pass_photo?.[0]
                : ''
            }
            text={info.row.original.processed_by?.name || 'Unassigned'}
            statusIcon={false}
          />
        ),
      }),
      columnHelper.accessor((row) => row.paid_at, {
        id: 'paid_at',
        header: 'Paid At',
        size: 120,
        cell: (info) => {
          const date = info.getValue()
          if (!date) return <p className="text-sm text-gray-600">-</p>
          const formattedDate = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
          return <p className="text-sm text-gray-600">{formattedDate}</p>
        },
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
      router.replace(router.asPath)
      closeDeleteConfirmationModal()
    })
  }

  useEffect(() => {
    if (!paymentList) return

    const result = paymentList.map((data) => {
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
    setPayments(result)
  }, [paymentList])

  useEffect(() => {
    if (!payments) return

    const [startDate, endDate] = dateRange

    if (!startDate && !endDate) {
      setFilteredPayments(payments)
      return
    }

    const filtered = payments.filter((payment) => {
      if (!payment.paid_at) return true

      const paymentDate = new Date(payment.paid_at)

      if (startDate && endDate) {
        return paymentDate >= startDate && paymentDate <= endDate
      } else if (startDate) {
        return paymentDate >= startDate
      }

      return true
    })

    setFilteredPayments(filtered)
  }, [payments, dateRange])

  if (payments === null || !userLoggedinInformation || filteredPayments === null) {
    return (
      <div className="flex h-[calc(100vh-4.8rem)] w-full items-center justify-center">
        <Loader customText="Loading payment requests..." />
      </div>
    )
  }

  return (
    <>
      <TableCore
        supportTableType="normal"
        data={filteredPayments || []}
        columns={columnsPaymentRequestTable}
        useSearchBar={true}
        useFilterCalendar={true}
        dateFiltration={dateRange}
        handleDateFiltration={setDateRange}
        hiddenColumns={['pr_year', 'id_hidden']}
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
        handleCloseModal={() => setIsOpenModal({ ...isOpenModal, deleteConfirmationModal: false })}
      />
    </>
  )
}
