import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

type Props = {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isFullSize?: boolean
  customText?: string
}

const classesStyles = {
  loaderSize: {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
    xl: 'h-16 w-16',
  },
  textSize: {
    sm: 'text-sm mt-4',
    md: 'text-base mt-4',
    lg: 'text-lg mt-4',
    xl: 'text-lg mt-5',
  },
}
export const Loader = (props: Props) => {
  const containerLoaderRef = useRef(null)

  const { size = 'md', isFullSize = false, customText } = props

  useEffect(() => {
    const mainDashboard = document.querySelectorAll('.main-dashboard > div')
    let totalGap = 0
    mainDashboard.forEach((element: HTMLElement, index: number) => {
      if (index < 2) {
        totalGap += element.offsetHeight
      }
    })

    if (isFullSize) {
      containerLoaderRef.current.style.height = `calc(100vh - ${totalGap}px - 110px)`
    }
  }, [isFullSize])

  return (
    <div
      ref={containerLoaderRef}
      className={cn(isFullSize ? 'flex items-center justify-center' : 'inline-flex items-center justify-center')}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div aria-label="Loading..." role="status" className={cn(isFullSize && 'flex items-center justify-center')}>
          <svg className={cn('animate-spin fill-primary-600', classesStyles.loaderSize[size])} viewBox="3 3 18 18">
            <path
              className="fill-gray-100"
              d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"
            ></path>
            <path d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
          </svg>
        </div>
        <p className={cn('font-medium text-gray-700', classesStyles.textSize[size])}>
          {customText ? customText : 'Loading...'}
        </p>
      </div>
    </div>
  )
}
