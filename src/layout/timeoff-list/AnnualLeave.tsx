import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Button } from '@/components/Button'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { TableCore } from '@/components/TableCore'
import { PageError } from '@/pages/500'
import { useDashboardContext } from '@/providers/DashboardProvider'
import { AnnualTeamOff } from '@/types/table'
import { getAnnualLeave } from '@/utils/apiRequestHelper'
import { createColumnHelper } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
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
        cell: (info) =>
          info.getValue() === userLoggedinInformation?.employee_id ? (
            <div className="flex justify-end">
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
            </div>
          ) : null,
      }),
    ],
    [],
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
    </>
  )
}
