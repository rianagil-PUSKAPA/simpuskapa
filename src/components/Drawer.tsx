import { cn } from '@/lib/utils'
import { Fragment, useEffect, useRef } from 'react'
import { XCloseIcon } from './icon/XCloseIcon'

interface DrawerPropsHeader {
  usingHeader?: boolean
  title: string
  description: string
  icon: React.ReactNode
}

type DrawerProps = {
  children: React.ReactNode
  isOpen: boolean
  setIsOpen: any
  usingFooter?: boolean
  footerButton?: React.ReactNode[]
  drawerWidth?: string
} & DrawerPropsHeader

export const Drawer = ({
  children,
  isOpen,
  setIsOpen,
  usingHeader = true,
  usingFooter = true,
  title,
  description,
  icon,
  footerButton,
  drawerWidth = 'w-[25rem]',
}: DrawerProps) => {
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // document.body.style.marginRight = '15px'
      document.body.style.overflowY = 'hidden'

      // document.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.marginRight = '0'
      document.body.style.overflowY = 'auto'

      // document.removeEventListener('keydown', handleKeyDown)
    }

    return () => {
      // document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [setIsOpen])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <>
      <div className="relative">
        <div
          className={`fixed inset-0 z-50 border-l border-l-gray-200 bg-gray-400/50 shadow-xl duration-300 ${
            isOpen ? 'visible opacity-100 duration-300 ease-out' : 'invisible opacity-0 duration-200 ease-in'
          }`}
          onClick={handleOverlayClick}
        ></div>
        <div
          className={cn(
            'fixed inset-y-0 right-0 z-50 overflow-y-auto bg-white duration-300 scrollbar scrollbar-track-gray-50 scrollbar-thumb-gray-300/70',
            drawerWidth,
            isOpen ? 'translate-x-0 duration-300 ease-out' : 'translate-x-full duration-200 ease-in',
          )}
          ref={wrapperRef}
        >
          <div className="flex h-screen flex-col">
            {usingHeader && (
              <div className={cn('flex gap-4 p-6', description ? 'items-start' : 'items-center')}>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[6px] border-primary-50 bg-primary-100">
                  {icon}
                </div>
                <div>
                  <h6 className={cn('text-xl font-semibold text-gray-900', description && 'mb-1')}>{title}</h6>
                  {description && <p className="text-sm capitalize text-gray-600">{description}</p>}
                </div>
                <span className="ml-auto hover:cursor-pointer" onClick={() => setIsOpen((prev) => !prev)}>
                  <XCloseIcon className="h-5 w-5 stroke-gray-500" />
                </span>
              </div>
            )}
            <div className="px-6 pb-6">{children}</div>
            {usingFooter && (
              <div className="sticky inset-x-0 bottom-0 z-20 mt-auto flex items-stretch justify-end gap-3 border-t border-t-gray-200 bg-white px-6 py-4">
                {footerButton?.map((footerBtn, index) => (
                  <Fragment key={index}>{footerBtn}</Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
