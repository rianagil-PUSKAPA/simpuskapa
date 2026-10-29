import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { TableCore } from '@/components/TableCore'
import { PageError } from '@/pages/500'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { RoleDefinition } from '@/shared/role.access'
import { theme } from '@/types/themes'
import { AnnualTeamOff } from '@/types/table'
import { getAnnualLeave, updateAnnualLeaveQuota } from '@/utils/apiRequestHelper'
import { createColumnHelper } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { useEffect, useMemo, useState } from 'react'
import useSWRMutation from 'swr/mutation'

const columnHelper = createColumnHelper<AnnualTeamOff>()

export const AnnualLeave = () => {
  const router = useRouter()
  const { userLoggedinInformation } = useDashboardContext()

  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())

  const {
    data: annualLeaveData,
    error: annualLeaveError,
    trigger: annualLeaveTrigger,
  } = useSWRMutation(yearFilter.toString(), (year: string) => getAnnualLeave(year))

  // console.log('annualLeaveError', annualLeaveError)

  const handleChangeYear = (year: number) => {
    setYearFilter(year)
  }

  const [editingEmployee, setEditingEmployee] = useState<AnnualTeamOff | null>(null)
  const [quotaInput, setQuotaInput] = useState<string>('')
  const [savingQuota, setSavingQuota] = useState<boolean>(false)
  const canEditQuota =
    userLoggedinInformation?.role?.some(
      (role: string) => role === RoleDefinition.ADMIN || role === RoleDefinition.SUPERADMIN,
    ) ?? false
  const isCurrentYear = yearFilter === new Date().getFullYear()

  const openQuotaEditor = (employee: AnnualTeamOff) => {
    setEditingEmployee(employee)
    setQuotaInput(String(employee.quota ?? 0))
  }

  const closeQuotaEditor = () => {
    if (!savingQuota) {
      setEditingEmployee(null)
    }
  }

  const saveQuota = async () => {
    if (!editingEmployee || !canEditQuota || !isCurrentYear || savingQuota) return

    const quota = Number(quotaInput)
    if (!Number.isInteger(quota) || quota < 0 || quota > 365 || quotaInput.trim() === '') {
      toast.error('Quota must be a whole number between 0 and 365')
      return
    }

    setSavingQuota(true)
    try {
      await updateAnnualLeaveQuota(editingEmployee.employee_id, quota)
      toast.success('Annual leave quota updated successfully')
      setEditingEmployee(null)
      await annualLeaveTrigger()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update annual leave quota')
    } finally {
      setSavingQuota(false)
    }
  }

  const annualLeaveTable = useMemo(
    () => [
      columnHelper.accessor((row) => row.avatar, {
        id: 'name',
        header: 'Name',
        size: 220,
        cell: (info) => (
          <AvatarLabelGroup
            size={'md'}
            image={info.getValue()}
            text={info.row.original.full_name}
            supportingText={info.row.original.email}
            statusIcon={false}
          />
        ),
      }),
      columnHelper.accessor((row) => row.employee_number, {
        id: 'employee_number',
        header: 'ID Number',
        size: 140,
      }),
      columnHelper.accessor((row) => `${row.department} ${row.position}`, {
        id: 'position',
        header: 'Position',
        size: 220,
        cell: (info) => (
          <div>
            <p className="font-medium text-gray-900">{info.row.original.position}</p>
            <p className="text-gray-600">Dept. {info.row.original.department}</p>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.department, {
        id: 'department',
        header: 'Department',
        size: 0,
      }),
      columnHelper.accessor((row) => row.quota, {
        id: 'quota',
        header: 'Quotas',
        size: 80,
      }),
      columnHelper.accessor((row) => row.remaining, {
        id: 'remaining',
        header: 'Remainig',
        size: 80,
      }),
      columnHelper.accessor((row) => row.used, {
        id: 'used',
        header: 'Used',
        size: 80,
      }),
      columnHelper.accessor('employee_id', {
        header: '',
        enableSorting: false,
        size: 72,
        cell: (info) => (
          <div className="flex justify-end gap-2">
            {canEditQuota && isCurrentYear ? (
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                onClick={() => openQuotaEditor(info.row.original)}
              >
                Edit Quota
              </Button>
            ) : null}
            {info.getValue() === userLoggedinInformation?.employee_id ? (
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                btnFormat="square"
                onClick={() => router.push(`/dashboard/internal/employee/${info.getValue()}?tab=timeoff`)}
              >
                <ChevronRightIcon className="h-5 w-5 stroke-gray-600" />
              </Button>
            ) : null}
          </div>
        ),
      }),
    ],
    [canEditQuota, isCurrentYear, userLoggedinInformation?.employee_id],
  )

  useEffect(() => {
    annualLeaveTrigger()
  }, [yearFilter])

  useEffect(() => {
    setYearFilter(dayjs().year())
  }, [dayjs().year()])

  if (annualLeaveError?.statusCode === 500) {
    return <PageError parameter={router.asPath.split('/')[1]} />
  }

  return (
    <>
      <TableCore
        data={annualLeaveData}
        columns={annualLeaveTable}
        supportTableType="normal"
        initialRows={20}
        useSearchBar={true}
        hiddenColumns={['department']}
        manualInputValue={[
          {
            id: 'year',

            yearValue: new Date(`${yearFilter}-01-01`),
            yearHandler: handleChangeYear,
          },
        ]}
        buttons={[
          {
            id: 'position',
            column: 'position',
            label: 'Position',
          },
          {
            id: 'department',
            column: 'department',
            label: 'Department',
          },
        ]}
      />
      {yearFilter !== new Date().getFullYear() ? (
        <p className="mt-3 text-sm text-gray-500">Historical annual leave data is read-only.</p>
      ) : null}
      <Modal
        icon={<span className="text-lg font-semibold text-primary-700">Q</span>}
        theme={theme.PRIMARY}
        modalTitle="Edit Annual Leave Quota"
        modalDescription="Set the current-year annual leave entitlement. Used days are calculated from approved annual leave only."
        stateModal={editingEmployee !== null}
        handleCloseModal={closeQuotaEditor}
        modalButtons={[
          <Button key="cancel" btnType="normal" variant="secondary-gray" className="w-full" onClick={closeQuotaEditor} disabled={savingQuota}>
            Cancel
          </Button>,
          <Button key="save" btnType="normal" variant="primary" className="w-full" onClick={saveQuota} isLoading={savingQuota}>
            Save Quota
          </Button>,
        ]}
      >
        {editingEmployee ? (
          <div className="mt-5 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{editingEmployee.full_name}</p>
              <p className="text-xs text-gray-500">{editingEmployee.email}</p>
            </div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="annual_leave_quota">
              Annual Leave Quota (days)
            </label>
            <input
              id="annual_leave_quota"
              type="number"
              min="0"
              max="365"
              step="1"
              value={quotaInput}
              onChange={(event) => setQuotaInput(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
            />
            <div className="flex justify-between rounded-lg bg-gray-50 p-3 text-sm">
              <span>Used: {editingEmployee.used} day(s)</span>
              <span>Remaining: {Number(quotaInput) - editingEmployee.used} day(s)</span>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
