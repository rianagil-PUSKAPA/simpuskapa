/* eslint-disable tailwindcss/no-custom-classname */
import { cn } from '@/lib/utils'
import { capitalizeFirstLetter, capitalizeOfString, snakeCase, transformToNormalFormat } from '@/utils/globalHelper'
import {
  ColumnDef,
  ColumnFiltersState,
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
import { useEffect, useMemo, useState } from 'react'
import { Button } from './Button'
import { DaterangePickerCalendar } from './DaterangePickerCalendar'
import { ChevronLeftDoubleIcon } from './icon/ChevronLeftDoubleIcon'
import { ChevronLeftIcon } from './icon/ChevronLeftIcon'
import { ChevronRightDoubleIcon } from './icon/ChevronRightDoubleIcon'
import { ChevronRightIcon } from './icon/ChevronRightIcon'
import { SearchIcon } from './icon/SearchIcon'
import { LoadingTable } from './LoadingTable'
import { Combobox, ComboboxOption } from './ui/combobox'
import { YearPickerCalendar } from './YearPickerCalendar'

type ButtonFilterProps = {
  column: string
  label: string
  id: string
  isArray?: boolean
}

type ManualInputValueProps = {
  id: string
  yearHandler?: (year: number) => void | undefined
  yearValue?: any
}

type SupportTableTextOnly = {
  supportTableType: 'text-only'
  title: string
  description: string
}

type SupportTableNormal = {
  supportTableType: 'normal'
  buttons: ButtonFilterProps[]
  manualInputValue?: ManualInputValueProps[]
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

type NewType<T extends object> = {
  data: T[] | undefined
  columns: ColumnDef<T, any>[]
  useFooter?: boolean
  initialRows?: number
  dateFiltration?: Date[]
  handleDateFiltration?: (value: Date[]) => void
  useSearchBar?: boolean
  useFilterCalendar?: boolean
  useResetButon?: boolean
  handleWeekShifting?: (direction: 'previous' | 'next' | 'current-week') => void
  isStickyColumnRow?: boolean
  hiddenColumns?: string[]
  useLoadingAnimation?: boolean
}

type TableCoreProps<T extends object> = NewType<T> &
  (SupportTableTextOnly | SupportTableNormal | SupportTableTextFilter | SupportTableExternal)

export const TableCore = <T extends object>(props: TableCoreProps<T>) => {
  const {
    data,
    columns,
    useFooter = true,
    initialRows = 20,
    isStickyColumnRow = true,
    hiddenColumns = [],
    useLoadingAnimation = true,
  } = props

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState<string>('')
  const [columnVisibility, setColumnVisibility] = useState({} as any)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
    },
    enableFilters: true,
    enableColumnFilters: true,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  })

  const checkValidWeekDaterange = () => {
    if (props.useFilterCalendar) {
      return props.dateFiltration[1]?.getDate() - props.dateFiltration[0]?.getDate() > 4
        ? true
        : props.dateFiltration[1] === null
        ? true
        : false
    } else {
      return false
    }
  }

  // Optimized: Memoize filter options to avoid recalculating on every render
  const getFilteredDataTable = useMemo(() => {
    if (!data || props.supportTableType === 'external') return {}

    const buttons = props.supportTableType === 'text-only' ? [] : props.buttons || []

    return buttons.reduce((acc, { id, column: path, isArray = false }) => {
      const getListSelectOptions = table.getCoreRowModel().flatRows.map((obj) => {
        if (isArray) {
          const keys = path.split(/\.|\[\]/)
          const result = keys.reduce((object, key) => {
            if (Array.isArray(object)) {
              if (key !== '') {
                return object.map((item) => item[key])
              }
              return object
            } else {
              return object[key]
            }
          }, obj.original)

          return [...new Set(result)]
        } else {
          const getNestedPointer = accessPropertyDynamicParameter(path, obj.original)
          return getNestedPointer
        }
      })

      const selectOptionItems = [...new Set(getListSelectOptions)]

      let uniqueValues: string[]
      if (isArray) {
        const flattenedArray = selectOptionItems.filter(Boolean).flat()
        uniqueValues = [...new Set(flattenedArray)]
      } else {
        uniqueValues = selectOptionItems
      }

      // Transform to ComboboxOption format with proper formatting
      const options: ComboboxOption[] = [
        // { value: '', label }, // Empty value represents "All"
        ...uniqueValues
          .filter((val) => val !== null && val !== undefined)
          .map((val) => {
            const strVal = String(val)
            const formattedLabel = strVal.includes('_')
              ? capitalizeOfString(transformToNormalFormat(strVal))
              : capitalizeFirstLetter(strVal)
            return {
              value: strVal,
              label: formattedLabel,
            }
          }),
      ]

      acc[id] = options
      return acc
    }, {} as Record<string, ComboboxOption[]>)
  }, [data, table, props.supportTableType])

  // Optimized: Simplified filter change handler
  const handleFilterChange = (columnId: string, value: string) => {
    if (!value || value === '') {
      // Clear filter for this column
      setColumnFilters((prev) => prev.filter((filter) => filter.id !== columnId))
    } else {
      // Apply snake_case transformation for specific columns
      const filterValue = columnId === 'roles' || columnId === 'leave_type' ? snakeCase(value) : value

      setColumnFilters((prev) => {
        const existingFilter = prev.find((filter) => filter.id === columnId)
        if (existingFilter) {
          // Update existing filter
          return prev.map((filter) => (filter.id === columnId ? { ...filter, value: filterValue } : filter))
        } else {
          // Add new filter
          return [...prev, { id: columnId, value: filterValue }]
        }
      })
    }
  }

  // Get current filter value for a column
  const getFilterValue = (columnId: string): string => {
    const filter = columnFilters.find((f) => f.id === columnId)
    return filter?.value ? String(filter.value) : ''
  }

  useEffect(() => {
    table.setPageSize(initialRows)
  }, [initialRows, table])

  useEffect(() => {
    if (hiddenColumns.length > 0) {
      const result = hiddenColumns.reduce((obj, key) => {
        obj[key] = false
        return obj
      }, {})
      setColumnVisibility((prev) => ({ ...prev, ...result }))
    }
  }, [hiddenColumns])

  useEffect(() => {
    const tableContainers = document.querySelectorAll('.table-container')

    tableContainers.forEach((container) => {
      const topScrollbar = container.querySelector('.top-scrollbar')
      const tableWrapper = container.querySelector('.table-wrapper')

      if (!topScrollbar && !tableWrapper && !data) return

      // Create a dummy div to simulate scrollbar content
      const timeoutTopBar = setTimeout(() => {
        const scrollbarContent = document.createElement('div')
        scrollbarContent.style.width = `${tableWrapper.scrollWidth}px`
        scrollbarContent.style.height = '1px'
        topScrollbar.appendChild(scrollbarContent)
      }, 100)

      // Synchronize scroll positions
      const handleTopScroll = () => {
        tableWrapper.scrollLeft = topScrollbar.scrollLeft
      }
      const handleTableScroll = () => {
        topScrollbar.scrollLeft = tableWrapper.scrollLeft
      }

      topScrollbar.addEventListener('scroll', handleTopScroll)
      tableWrapper.addEventListener('scroll', handleTableScroll)

      // Cleanup event listeners on unmount
      return () => {
        topScrollbar.removeEventListener('scroll', handleTopScroll)
        tableWrapper.removeEventListener('scroll', handleTableScroll)
        clearTimeout(timeoutTopBar)
      }
    })
  }, [data])

  if (!data) {
    if (useLoadingAnimation) {
      return <LoadingTable totalRows={10} />
    }
    return <></>
  }

  return (
    <>
      <div className="w-full">
        {props.supportTableType === 'normal' && (
          <div className="mb-6 flex items-center justify-between">
            {props.manualInputValue?.find((button) => button.yearValue.getFullYear()).yearValue.getFullYear() ? (
              <>
                <p className="text-lg font-semibold text-gray-900">
                  Year:{' '}
                  {props.manualInputValue.find((button) => button.yearValue.getFullYear()).yearValue.getFullYear()}
                </p>
                <div className="ml-auto mr-4">
                  <YearPickerCalendar
                    size="md"
                    selected={props.manualInputValue.find((button) => button.yearValue).yearValue}
                    onChange={(date: Date) => {
                      props.manualInputValue.find((button) => button.yearValue).yearHandler(date.getFullYear())
                    }}
                    useArrow={true}
                    isBold={true}
                  />
                </div>
              </>
            ) : null}
            <div
              className={cn(
                'flex items-center justify-between gap-4',
                props.manualInputValue?.find((button) => button.yearValue.getFullYear()).yearValue.getFullYear()
                  ? ''
                  : 'w-full',
              )}
            >
              <div className="flex items-center gap-4">
                {props.buttons?.map(({ id, label }) => (
                  <Combobox
                    key={id}
                    options={getFilteredDataTable[id] || []}
                    value={getFilterValue(id)}
                    onValueChange={(value) => handleFilterChange(id, value)}
                    placeholder={label}
                    searchPlaceholder={`Search ${label.toLowerCase()}...`}
                    disabled={!getFilteredDataTable[id] || getFilteredDataTable[id].length === 0}
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
                    onChange={(value) => setGlobalFilter(String(value))}
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
                  options={getFilteredDataTable[id] || []}
                  value={getFilterValue(id)}
                  onValueChange={(value) => handleFilterChange(id, value)}
                  placeholder={label}
                  searchPlaceholder={`Search ${label.toLowerCase()}...`}
                  disabled={!getFilteredDataTable[id] || getFilteredDataTable[id].length === 0}
                />
              ))}
            </div>
          </div>
        )}
        <div className="table-container">
          <div className="top-scrollbar h-3 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50"></div>
          <div className="table-wrapper overflow-x-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300/50">
            <table className={cn('w-full', table.getRowModel().rows.length === 0 ? 'table-auto' : 'table-fixed')}>
              <thead className="border-y border-gray-200 bg-gray-50">
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
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
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
                {table.getRowModel().rows.length === 0 && (
                  <tr key={'empty-data'}>
                    <td colSpan={table.getAllFlatColumns().length} className="py-4 text-center text-sm">
                      Empty Data
                    </td>
                  </tr>
                )}
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
                      <p>Page</p>
                      <input
                        type="number"
                        min={1}
                        max={table.getPageCount()}
                        value={table.getState().pagination.pageIndex + 1}
                        onChange={(e) => {
                          const page = e.target.value ? Number(e.target.value) - 1 : 0
                          table.setPageIndex(page)
                        }}
                        className="form-input w-10 rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                      />
                      <p>of {table.getPageCount()} page</p>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <p>Show</p>
                      <select
                        className="form-select w-14 rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                          table.setPageSize(Number(e.target.value))
                        }}
                      >
                        {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                          <option key={pageSize} value={pageSize}>
                            {pageSize}
                          </option>
                        ))}
                      </select>
                      <p>data</p>
                    </div>
                  </div>
                </div>
                <div className="inline-flex items-center divide-x rounded-md border border-gray-200">
                  <button
                    className="flex h-8 w-8 items-center justify-center focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeftDoubleIcon className="h-5 w-5 stroke-gray-600" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-gray-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeftIcon className="h-4 w-4 stroke-gray-600" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-gray-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRightIcon className="h-4 w-4 stroke-gray-600" />
                  </button>
                  <button
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
      {/* <pre className="text-sm text-primary-500">
        {JSON.stringify(table.getState().pagination, null, 2)}
      </pre> */}
      {/* <pre className="text-xs text-error-500">
        {JSON.stringify(table.getPageOptions(), null, 2)}
      </pre> */}
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

const accessPropertyDynamicParameter = (path: string, obj: object) => {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, obj || self)
}
