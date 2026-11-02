import { useState } from 'react'

export function useSearch() {
  const [globalFilter, setGlobalFilter] = useState('')

  const handleKeywordChange = (text: string) => {
    setGlobalFilter(text)
  }

  return {
    globalFilter,
    onGlobalFilterChange: setGlobalFilter,
    handleKeywordChange,
  }
}
