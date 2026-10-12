/* eslint-disable tailwindcss/no-custom-classname */

import { cn } from '@/lib/utils'
import { formatColumnValue } from '@/utils/tableHelpers'
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './Button'
import { DaterangePickerCalendar } from './DaterangePickerCalendar'
import { Loader } from './Loader'
import { LoadingTable } from './LoadingTable'
import { ChevronLeftDoubleIcon } from './icon/ChevronLeftDoubleIcon'
import { ChevronLeftIcon } from './icon/ChevronLeftIcon'
import { ChevronRightDoubleIcon } from './icon/ChevronRightDoubleIcon'
import { ChevronRightIcon } from './icon/ChevronRightIcon'
import { SearchIcon } from './icon/SearchIcon'
import { Combobox, ComboboxOption } from './ui/combobox'

type ButtonFilterProps = {
  column: string
  label: string
  id: string
}

type SupportTableTextOnly = {
  supportTableType: 'text-only'
  title: string
  description: string
}

type SupportTableNormal = {
  supportTableType: 'normal'
  buttons: ButtonFilterProps[]
}

type SupportTableTextFilter = {
  supportTableType: 'text-filter'
  buttons: ButtonFilterProps[]
  title: string
  description: string
}

type SupportTableExternal = {
  supportTableType: 'external'
}

type ServerSideTableProps<T extends object> = {
  // Data & columns
  data: T[] | undefined
  columns: ColumnDef<T, any>[]

  // Pagination
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  pageCount: number

  // Sorting
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>

  // Filtering
  globalFilter: string
  onGlobalFilterChange: OnChangeFn<string>
  handleKeywordChange: (keyword: string) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  setEmptyColumnFilters?: () => void // Optional - no longer used internally

  // Loading
  loading?: boolean

  // UI Options
  useFooter?: boolean
  isStickyColumnRow?: boolean
  hiddenColumns?: string[]
  useLoadingAnimation?: boolean
  useSearchBar?: boolean
  useFilterCalendar?: boolean
  useResetButon?: boolean

  // Calendar & week navigation
  dateFiltration?: Date[]
  handleDateFiltration?: (value: Date[]) => void
  handleWeekShifting?: (direction: 'previous' | 'next' | 'current-week') => void
}

type TableCoreSSRProps<T extends object> = ServerSideTableProps<T> &
  (SupportTableTextOnly | SupportTableNormal | SupportTableTextFilter | SupportTableExternal)

export const TableCoreSSR = <T extends object>(props: TableCoreSSRProps<T>) => {
  const {
    data,
    columns,
    useFooter = true,
    isStickyColumnRow = true,
    hiddenColumns = [],
    useLoadingAnimation = true,
    // ========
    loading,
    onPaginationChange,
    onSortingChange,
    pageCount,
    pagination,
    sorting,
    globalFilter,
    handleKeywordChange,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
  } = props

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const topScrollbarRef = useRef<HTMLDivElement>(null)
  const tableWrapperRef = useRef<HTMLDivElement>(null)

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
    },
    enableFilters: true,
    enableColumnFilters: true,
    onGlobalFilterChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: true,
    onPaginationChange,
    pageCount,
  })

  // Memoize filter options using TanStack's built-in faceting
  const filterOptions = useMemo(() => {
    if (!data || props.supportTableType === 'external' || props.supportTableType === 'text-only') {
      return {}
    }

    const buttons = props.buttons || []

    return buttons.reduce((acc, { id }) => {
      const column = table.getColumn(id)
      const uniqueValues = column?.getFacetedUniqueValues()

      const options: ComboboxOption[] = [
        // { value: '', label }, // "All" option
        ...Array.from(uniqueValues?.keys() || [])
          .filter((val) => val !== null && val !== undefined)
          .map((val) => ({
            value: String(val),
            label: formatColumnValue(String(val)),
          })),
      ]

      acc[id] = options
      return acc
    }, {} as Record<string, ComboboxOption[]>)
  }, [data, table, props.supportTableType, 'buttons' in props ? props.buttons : undefined])

  const getFilterValue = (columnId: string): string => {
    const filterValue = table.getColumn(columnId)?.getFilterValue()
    return filterValue ? String(filterValue) : ''
  }

  const handleFilterChange = (columnId: string, value: string) => {
    const column = table.getColumn(columnId)
    if (value === '') {
      column?.setFilterValue(undefined)
    } else {
      column?.setFilterValue(value)
    }
  }

  const checkValidWeekDaterange = () => {
    if (props.useFilterCalendar && props.dateFiltration) {
      return props.dateFiltration[1]?.getDate() - props.dateFiltration[0]?.getDate() > 4
        ? true
        : props.dateFiltration[1] === null
        ? true
        : false
    }
    return false
  }

  useEffect(() => {
    if (hiddenColumns.length > 0) {
      const result = hiddenColumns.reduce((obj, key) => {
        obj[key] = false
        return obj
      }, {})
      setColumnVisibility((prev) => ({ ...prev, ...result }))
    }
  }, [hiddenColumns])

  // Replace DOM manipulation with React refs and ResizeObserver
  useEffect(() => {
    const topScrollbar = topScrollbarRef.current
    const tableWrapper = tableWrapperRef.current

    if (!topScrollbar || !tableWrapper || !data) return

    const resizeObserver = new ResizeObserver(() => {
      if (tableWrapper.scrollWidth > tableWrapper.clientWidth) {
        const scrollContent = document.createElement('div')
        scrollContent.style.width = `${tableWrapper.scrollWidth}px`
        scrollContent.style.height = '1px'
        topScrollbar.innerHTML = ''
        topScrollbar.appendChild(scrollContent)
      }
    })

    resizeObserver.observe(tableWrapper)

    const handleTopScroll = () => {
      tableWrapper.scrollLeft = topScrollbar.scrollLeft
    }
    const handleTableScroll = () => {
      topScrollbar.scrollLeft = tableWrapper.scrollLeft
    }

    topScrollbar.addEventListener('scroll', handleTopScroll)
    tableWrapper.addEventListener('scroll', handleTableScroll)

    return () => {
      resizeObserver.disconnect()
      topScrollbar.removeEventListener('scroll', handleTopScroll)
      tableWrapper.removeEventListener('scroll', handleTableScroll)
    }
  }, [data])

  if (!data) {
    return useLoadingAnimation ? <LoadingTable totalRows={10} /> : null
  }

  return (
    <>
      <div className="w-full">
        {props.supportTableType === 'normal' && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {props.buttons?.map(({ id, label }) => (
                <Combobox
                  key={id}
                  options={filterOptions[id] || []}
                  value={getFilterValue(id)}
                  onValueChange={(value) => handleFilterChange(id, value)}
                  placeholder={label}
                  searchPlaceholder={`Search ${label.toLowerCase()}...`}
                  disabled={!filterOptions[id] || filterOptions[id].length === 0}
                />
              ))}
              {props.useFilterCalendar && (
                <DaterangePickerCalendar
                  size="md"
                  dateRange={props.dateFiltration}
                  handleDateRangePicker={(value) => props.handleDateFiltration(value)}
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              {props.useSearchBar && (
                <DebouncedInput
                  value={globalFilter ?? ''}
                  onChange={(value) => handleKeywordChange(String(value))}
                  className="shadow shrink grow-0 border p-2 font-semibold"
                  placeholder="Search all columns..."
                />
              )}
              {props.useResetButon && (
                <div className="inline-flex items-center gap-2">
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    variant="secondary-gray"
                    btnFormat="square"
                    onClick={() => props.handleWeekShifting('previous')}
                    disabled={checkValidWeekDaterange()}
                  >
                    <ChevronLeftIcon className="h-5 w-5 stroke-gray-700" />
                  </Button>
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    variant="secondary-gray"
                    className="px-10"
                    onClick={() => props.handleWeekShifting('current-week')}
                  >
                    This Week
                  </Button>
                  <Button
                    type="button"
                    btnType="normal"
                    size="sm"
                    variant="secondary-gray"
                    btnFormat="square"
                    onClick={() => props.handleWeekShifting('next')}
                    disabled={checkValidWeekDaterange()}
                  >
                    <ChevronRightIcon className="h-5 w-5 stroke-gray-700" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        {props.supportTableType === 'text-only' && (
          <div className="mb-6">
            <p className="mb-1 text-lg font-semibold text-gray-900">{props.title}</p>
            <p className="text-sm font-normal text-gray-600 ">{props.description}</p>
          </div>
        )}
        {props.supportTableType === 'text-filter' && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="mb-1 text-lg font-semibold text-gray-900">{props.title}</p>
              <p className="text-sm font-normal text-gray-600 ">{props.description}</p>
            </div>
            <div className="inline-flex items-center gap-4">
              {props.buttons?.map(({ id, label }) => (
                <Combobox
                  key={id}
                  options={filterOptions[id] || []}
                  value={getFilterValue(id)}
                  onValueChange={(value) => handleFilterChange(id, value)}
                  placeholder={label}
                  searchPlaceholder={`Search ${label.toLowerCase()}...`}
                  disabled={!filterOptions[id] || filterOptions[id].length === 0}
                />
              ))}
            </div>
          </div>
        )}
        <div className="table-container">
          <div
            ref={topScrollbarRef}
            className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"
          ></div>
          <div
            ref={tableWrapperRef}
            className="table-wrapper overflow-x-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"
          >
            <table className={cn('w-full', table.getRowModel().rows.length === 0 ? 'table-auto' : 'table-fixed')}>
              <thead className="border-b border-gray-200 bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={cn(
                          'group px-4 py-3.5 text-left text-xs font-medium text-gray-600 2xl:px-6',
                          headerGroup.headers[0] === header && 'pl-5 xl:pl-6',
                          isStickyColumnRow &&
                            headerGroup.headers.length - 1 === header.index &&
                            'sticky right-0 bg-gray-50',
                        )}
                        style={{
                          width: header.column.columnDef.size,
                          minWidth: header.column.columnDef.minSize,
                          maxWidth: header.column.columnDef.maxSize,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <>
                            {header.column.getCanSort() ? (
                              <div
                                {...{
                                  className: header.column.getCanSort()
                                    ? 'cursor-pointer select-none inline-flex items-center gap-1.5'
                                    : '',
                                  onClick: header.column.getToggleSortingHandler(),
                                }}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {(header.column.getCanSort() &&
                                  {
                                    asc: <SortUpIcon />,
                                    desc: <SortDownIcon />,
                                  }[header.column.getIsSorted() as string]) ?? <SortIcon />}
                              </div>
                            ) : (
                              <>{flexRender(header.column.columnDef.header, header.getContext())}</>
                            )}
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={table.getAllFlatColumns().length} className="relative h-56">
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <Loader size="sm" customText="Loading data..." />
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && table.getRowModel().rows.length === 0 && (
                  <tr key="empty-data">
                    <td colSpan={table.getAllFlatColumns().length} className="py-8 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">No data found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} tabIndex={0} role="row">
                      {row.getVisibleCells().map((cell, index) => (
                        <td
                          key={cell.id}
                          className={cn(
                            'p-4 text-sm text-gray-600 2xl:px-6',
                            index === 0 && 'pl-5 xl:pl-6',
                            isStickyColumnRow &&
                              row.getVisibleCells().length - 1 === index &&
                              'sticky-right-col sticky right-0 bg-white',
                          )}
                          style={{
                            width: cell.column.columnDef.size,
                            minWidth: cell.column.columnDef.minSize,
                            maxWidth: cell.column.columnDef.maxSize,
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        {useFooter ? (
          <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-5">
            {data.length > 0 ? (
              <>
                <div className="inline-flex items-center gap-4">
                  <div className="inline-flex items-center gap-8 text-sm font-semibold text-gray-400">
                    <div className="relative inline-flex items-center gap-2 after:absolute after:inset-y-1.5 after:-right-4 after:w-0.5 after:bg-gray-400 after:content-['']">
                      <label htmlFor="page-input" className="sr-only">
                        Current page number
                      </label>
                      <p aria-hidden="true">Page</p>
                      <input
                        id="page-input"
                        type="number"
                        min={1}
                        max={table.getPageCount()}
                        value={table.getState().pagination.pageIndex + 1}
                        onChange={(e) => {
                          const page = e.target.value ? Number(e.target.value) - 1 : 0
                          table.setPageIndex(page)
                        }}
                        aria-label={`Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
                        aria-valuemin={1}
                        aria-valuemax={table.getPageCount()}
                        aria-valuenow={table.getState().pagination.pageIndex + 1}
                        className="form-input w-10 rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                      />
                      <p aria-hidden="true">of {table.getPageCount()} page</p>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <label htmlFor="rows-per-page" className="sr-only">
                        Rows per page
                      </label>
                      <p aria-hidden="true">Show</p>
                      <select
                        id="rows-per-page"
                        aria-label="Rows per page"
                        className="form-select w-14 rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => table.setPageSize(Number(e.target.value))}
                      >
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <option key={pageSize} value={pageSize}>
                            {pageSize}
                          </option>
                        ))}
                      </select>
                      <p aria-hidden="true">data</p>
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center divide-x rounded-md border border-gray-200">
                  <button
                    aria-label="Go to first page"
                    className="flex h-8 w-8 items-center justify-center focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeftDoubleIcon className="h-5 w-5 stroke-gray-600" />
                  </button>
                  <button
                    aria-label="Go to previous page"
                    className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-gray-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeftIcon className="h-4 w-4 stroke-gray-600" />
                  </button>
                  <button
                    aria-label="Go to next page"
                    className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-gray-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRightIcon className="h-4 w-4 stroke-gray-600" />
                  </button>
                  <button
                    aria-label="Go to last page"
                    className="flex h-8 w-8 items-center justify-center focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRightDoubleIcon className="h-5 w-5 stroke-gray-600" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [debounce, onChange, value])

  return (
    <div className="relative w-80 grow">
      <span className="absolute inset-y-0 left-3 my-auto inline-flex h-full items-center">
        <SearchIcon />
      </span>
      <input
        {...props}
        type="text"
        className="form-input w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
        placeholder="Search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}

const SortIcon = () => {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_658_4)">
        <path
          d="M7 20V4M7 4L3 8M7 4L11 8"
          className="stroke-gray-300"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 4V20M17 20L13 16M17 20L21 16"
          className="stroke-gray-300"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_658_4">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

const SortUpIcon = () => {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_658_4)">
        <path
          d="M7 20V4M7 4L3 8M7 4L11 8"
          className="stroke-gray-600"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 4V20M17 20L13 16M17 20L21 16"
          className="stroke-gray-300"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_658_4">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

const SortDownIcon = () => {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_658_4)">
        <path
          d="M7 20V4M7 4L3 8M7 4L11 8"
          className="stroke-gray-300"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 4V20M17 20L13 16M17 20L21 16"
          className="stroke-gray-600"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_658_4">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
