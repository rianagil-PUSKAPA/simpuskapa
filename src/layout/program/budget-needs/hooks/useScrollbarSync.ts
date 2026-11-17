import { useEffect } from 'react'

/**
 * Custom hook to synchronize scrolling between top scrollbar and table wrapper
 * Useful for tables with horizontal scroll that need a top scrollbar
 * @param isReady - Boolean indicating when the table data is ready
 */
export const useScrollbarSync = (isReady: boolean) => {
  useEffect(() => {
    if (!isReady) return

    const tableContainers = document.querySelectorAll('.table-container')

    const cleanupFunctions: Array<() => void> = []

    tableContainers.forEach((container) => {
      const topScrollbar = container.querySelector('.top-scrollbar') as HTMLElement
      const tableWrapper = container.querySelector('.table-wrapper') as HTMLElement

      if (!topScrollbar || !tableWrapper) return

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

      // Store cleanup function
      cleanupFunctions.push(() => {
        topScrollbar.removeEventListener('scroll', handleTopScroll)
        tableWrapper.removeEventListener('scroll', handleTableScroll)
        clearTimeout(timeoutTopBar)
      })
    })

    // Cleanup all event listeners on unmount
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isReady])
}
