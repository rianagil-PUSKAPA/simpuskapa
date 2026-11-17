import { Button } from '@/components/Button'
import { FileAttachment02Icon } from '@/components/icon/FileAttachment02Icon'
import { LinkExternal02Icon } from '@/components/icon/LinkExternal02Icon'
import { TableCore } from '@/components/TableCore'
import { downloadS3File } from '@/utils/apiRequestHelper'
import { isValidUrl } from '@/utils/globalHelper'
import { createColumnHelper } from '@tanstack/react-table'
import Link from 'next/link'
import { EmployeePerformanceAggregated } from 'sdk/api'

type PerformanceEvaluationProps = {
  dataTable: EmployeePerformanceAggregated[]
}

const columnHelperEmploymentPerformance = createColumnHelper<EmployeePerformanceAggregated>()

const columnsPerformanceEvaluationTable = [
  columnHelperEmploymentPerformance.accessor((row) => row.year, {
    id: 'year',
    header: 'Year',
    filterFn: 'weakEquals',
    size: 120,
  }),
  columnHelperEmploymentPerformance.accessor((row) => `${row.contract_position} ${row.contract_department}`, {
    id: 'position',
    header: 'Position',
    size: 210,
    cell: (info) => (
      <div>
        <p className="text-sm font-medium text-gray-900">{info.row.original.contract_position as unknown as string}</p>
        <span className="text-sm text-gray-600">
          Dept. {info.row.original.contract_department as unknown as string}
        </span>
      </div>
    ),
  }),
  columnHelperEmploymentPerformance.accessor((row) => row.planning, {
    id: 'planning',
    header: 'Planning',
    size: 160,
    cell: (info) => (
      <>
        {info.row.original.planning ? (
          <>
            {isValidUrl(info.row.original.planning.path) ? (
              <Link href={info.row.original.planning.path} target="_blank" rel="noopener noreferrer">
                <Button btnType="div" size="sm" variant="secondary-gray" className="px-10">
                  <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                className="px-10"
                onClick={() => downloadS3File(info.row.original.planning.path)}
              >
                <FileAttachment02Icon className="h-5 w-5 stroke-gray-600" />
                View
              </Button>
            )}
          </>
        ) : (
          <Button type="button" btnType="normal" size="sm" variant="secondary-gray" className="px-10" disabled>
            <FileAttachment02Icon className="h-5 w-5 stroke-gray-600" />
            Unavailable
          </Button>
        )}
      </>
    ),
  }),
  columnHelperEmploymentPerformance.accessor((row) => row.end_year, {
    id: 'end_year',
    header: 'End Year',
    size: 160,
    cell: (info) => (
      <>
        {info.row.original.end_year ? (
          <>
            {isValidUrl(info.row.original.end_year.path) ? (
              <Link href={info.row.original.end_year.path} target="_blank" rel="noopener noreferrer">
                <Button btnType="div" size="sm" variant="secondary-gray" className="px-10">
                  <LinkExternal02Icon className="h-5 w-5 stroke-gray-700" />
                  View
                </Button>
              </Link>
            ) : (
              <Button
                type="button"
                btnType="normal"
                size="sm"
                variant="secondary-gray"
                className="px-10"
                onClick={() => downloadS3File(info.row.original.end_year.path)}
              >
                <FileAttachment02Icon className="h-5 w-5 stroke-gray-600" />
                View
              </Button>
            )}
          </>
        ) : (
          <Button type="button" btnType="normal" size="sm" variant="secondary-gray" className="px-10" disabled>
            <FileAttachment02Icon className="h-5 w-5 stroke-gray-600" />
            Unavailable
          </Button>
        )}
      </>
    ),
  }),
]

export const PerformanceEvaluation = ({ dataTable }: PerformanceEvaluationProps) => {
  // console.log('dataTable', dataTable)

  return (
    <div>
      <TableCore
        data={dataTable}
        columns={columnsPerformanceEvaluationTable}
        supportTableType="text-filter"
        buttons={[
          {
            id: 'year',
            column: 'year',
            label: 'Periode of Year',
          },
        ]}
        title="Performance Evaluation Report"
        description="Check Performance Evaluation Files from All Periode"
      />
    </div>
  )
}
