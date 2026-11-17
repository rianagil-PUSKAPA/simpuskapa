import { cn } from '@/lib/utils'
import { Fragment, useEffect, useRef } from 'react'
import { XCloseIcon } from './icon/XCloseIcon'

interface DrawerPropsHeader {
  usingHeader?: boolean
  title: string
  description: string
  icon: React.ReactNode
}

type ModalStatement = {
  uniqueKey: boolean
}
type DrawerProps = {
  children: React.ReactNode
  isOpen: ModalStatement
  setIsOpen: any
  usingFooter?: boolean
  footerButton?: React.ReactNode[]
  drawerWidth?: string
  keyCodeIndex: string
} & DrawerPropsHeader

const useOutsideAlerter = (ref: any, isOpen: ModalStatement, setIsOpen: any, keyCodeIndex) => {
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen((prev) => ({ ...prev, [keyCodeIndex]: false }))
      }
    }

    const handleEsc = (event: any) => {
      if (event.keyCode === 27) {
        setIsOpen((prev) => ({ ...prev, [keyCodeIndex]: false }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, ref, setIsOpen, keyCodeIndex])
}

export const DrawerMultiple = ({
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
  keyCodeIndex,
}: DrawerProps) => {
  const wrapperRef = useRef(null)

  useOutsideAlerter(wrapperRef, isOpen[keyCodeIndex], setIsOpen, keyCodeIndex)

  useEffect(() => {
    if (isOpen[keyCodeIndex]) {
      document.body.style.marginRight = '15px'
      document.body.style.overflowY = 'hidden'
    } else {
      document.body.style.marginRight = '0'
      document.body.style.overflowY = 'auto'
    }
  }, [isOpen[keyCodeIndex]])

  return (
    <>
      <div className="relative">
        <div
          className={`fixed inset-0 z-50 border-l border-l-gray-200 bg-gray-400/50 shadow-xl duration-300 ${
            isOpen[keyCodeIndex]
              ? 'visible opacity-100 duration-300 ease-out'
              : 'invisible opacity-0 duration-200 ease-in'
          }`}
        ></div>
        <div
          className={cn(
            'fixed inset-y-0 right-0 z-50 overflow-y-auto bg-white duration-300',
            drawerWidth,
            isOpen[keyCodeIndex] ? 'translate-x-0 duration-300 ease-out' : 'translate-x-full duration-200 ease-in',
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
                <span
                  className="ml-auto hover:cursor-pointer"
                  onClick={setIsOpen((prev) => ({
                    ...prev,
                    [keyCodeIndex]: !prev,
                  }))}
                >
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
