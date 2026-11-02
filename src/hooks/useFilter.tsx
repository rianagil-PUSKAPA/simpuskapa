import { ColumnFiltersState } from '@tanstack/react-table'
import { useState } from 'react'

export function useFilter() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const setEmptyColumnFilters = () => {
    setColumnFilters([])
  }

  return {
    columnFilters,
    onColumnFiltersChange: setColumnFilters,
    setEmptyColumnFilters,
  }
}
