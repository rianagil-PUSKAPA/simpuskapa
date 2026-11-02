import { cn } from '@/lib/utils'
import { Menu, Transition } from '@headlessui/react'
import Link from 'next/link'
import { Fragment } from 'react'
import { AvatarLabelGroup } from './AvatarLabelGroup'
import { ChevronDownIcon } from './icon/ChevronDownIcon'

interface IDropdownData {
  icon?: JSX.Element
  action: string
  link?: string
  text: string
  handleClick?: (e: any) => void
}

type DropdownButtonProps = {
  children: React.ReactNode
  dropdownData: IDropdownData[][]
  isUsingAvatar?: boolean
  buttonSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  menuItemSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  id?: string
  dropdownType: 'button' | 'icon' | 'avatar'
  className?: string
}

const classesStyles = {
  base: 'text-left',
  dropdownType: {
    button: 'button border-gray-300 text-gray-700 border',
    icon: 'p-0',
  },
  buttonSize: {
    button: {
      sm: 'py-2 px-3 text-xs gap-2',
      md: 'py-2.5 px-4 text-sm gap-2',
      lg: 'py-2.5 px-[18px] text-base gap-2',
      xl: 'py-3 px-5 text-base gap-2',
      '2xl': 'py-4 px-7 text-lg gap-3',
    },
    icon: {
      sm: '',
    },
  },
  menuItemSize: {
    sm: 'py-1.5 px-2.5 text-xs gap-2',
    md: 'py-2.5 px-4 text-sm gap-2',
  },
}

export const DropdownButton = ({
  children,
  dropdownData,
  isUsingAvatar,
  buttonSize,
  menuItemSize = 'md',
  id,
  dropdownType,
  className,
}: DropdownButtonProps) => {
  return (
    <Menu as="div" className="relative flex justify-center">
      {({}) => (
        <>
          <Menu.Button
            className={cn(
              classesStyles.base,
              classesStyles.buttonSize[dropdownType][buttonSize],
              classesStyles.dropdownType[dropdownType],
            )}
          >
            {dropdownType === 'button' && (
              <>
                {children}
                <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-500" />
              </>
            )}

            {dropdownType === 'icon' && <>{children}</>}
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              className={cn(
                'absolute right-0 z-10 mt-6 origin-top-right divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-lg',
                className,
              )}
            >
              {isUsingAvatar && (
                <div className="flex items-center p-3">
                  <AvatarLabelGroup
                    size={'md'}
                    statusIcon="online"
                    image="/images/avatar-placeholder.png"
                    text="Olivia Rhye"
                    supportingText="olivia@untitledui.com"
                  />
                </div>
              )}
              {dropdownData.map((dropdownOuter, outerIndex) => (
                <div className="p-1" key={outerIndex}>
                  {dropdownOuter.map((dropdownInner, innerIndex) => (
                    <Menu.Item key={innerIndex}>
                      {({ active }) => (
                        <>
                          {dropdownInner.action === 'link' ? (
                            <Link
                              href={dropdownInner.link}
                              id={id}
                              className={cn(
                                active ? 'bg-gray-50 text-gray-900' : 'text-gray-700',
                                'group flex w-full items-center rounded-md font-medium duration-300 hover:bg-gray-50',
                                classesStyles.menuItemSize[menuItemSize],
                              )}
                            >
                              {dropdownInner.icon}
                              {dropdownInner.text}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              id={id}
                              onClick={dropdownInner.handleClick}
                              className={cn(
                                active ? 'bg-gray-50 text-gray-900' : 'text-gray-700',
                                'group flex w-full items-center rounded-md font-medium duration-300 hover:bg-gray-50',
                                classesStyles.menuItemSize[menuItemSize],
                              )}
                            >
                              {dropdownInner.icon}
                              {dropdownInner.text}
                            </button>
                          )}
                        </>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  )
}
