import { capitalizeFirstLetter, capitalizeOfString, transformToNormalFormat } from '@/utils/globalHelper'
import { Listbox, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { Fragment, useEffect, useState } from 'react'
import { AvatarPlacement } from './AvatarPlacement'
import { ChevronDownIcon } from './icon/ChevronDownIcon'

interface ListboxSelectProps {
  id: string
  icon?: JSX.Element
  className?: string
  children: string
  isPlaceholder?: boolean
  isBold?: boolean
  lists?: Array<{ name: string; avatarUrl?: string | undefined | null }>
  fixedWidthMenu?: string
  value?: string
  error?: boolean
  handleChange: (labelOption: string, id: string, detectIndexOfList: number) => void
  emptyMessage?: string
  size?: 'sm' | 'md'
}

const classesStyles = {
  base: 'button text-gray-900 focus-visible:outline-0 focus-visible:ring-4 focus:ring-4 border leading-6 pl-3.5 pr-10 gap-2 relative',
  fontSize: {
    sm: 'text-sm',
    md: 'text-base',
  },
  paddingY: {
    sm: 'py-1.5',
    md: 'py-2',
  },
}

export const ListboxSelect = ({
  id,
  lists,
  children,
  handleChange,
  className,
  isPlaceholder = false,
  icon,
  isBold = false,
  fixedWidthMenu,
  value = '',
  error,
  emptyMessage,
  size = 'md',
}: ListboxSelectProps) => {
  const [listsData, setListData] = useState<Array<{ name: string; avatarUrl?: string | undefined | null }>>([])
  const [avatarIcon, setAvatarIcon] = useState(undefined)

  const handleMultipleFunctions = (labelOption: string, handleChangeFilterButton: any) => {
    const detectIndexOfList = listsData.map((item) => item.name).indexOf(labelOption)
    const avatarUrl = listsData.find((item) => item.name === labelOption)?.avatarUrl
    if (avatarUrl) {
      setAvatarIcon(avatarUrl)
    }
    handleChangeFilterButton(labelOption, id, detectIndexOfList)
  }

  useEffect(() => {
    if (isPlaceholder === false) {
      setListData([].concat({ name: 'All' }, lists))
    } else {
      setListData(lists)
    }
  }, [children, lists])

  useEffect(() => {
    if (listsData && value) {
      const avatarUrl = listsData.find((item) => item.name === value)?.avatarUrl
      if (avatarUrl) {
        setAvatarIcon(avatarUrl)
      }
    }
  }, [value, listsData])

  return (
    <Listbox value={value} onChange={(e) => handleMultipleFunctions(e, handleChange)}>
      <div className="relative">
        <Listbox.Button
          className={cn(
            classesStyles.base,
            classesStyles.fontSize[size],
            classesStyles.paddingY[size],
            className,
            error
              ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
              : 'border-gray-300 focus-within:border-primary-300 focus-within:ring-primary-100 focus:border-primary-300 focus:ring-primary-100 focus-visible:border-primary-300 focus-visible:ring-primary-100',
          )}
          data-element="listbox-button"
          data-testid={`${id}_listbox_select_button`}
        >
          {avatarIcon ? <AvatarPlacement size="xs" image={avatarIcon} /> : icon}
          <p className="block truncate">
            {value ? (
              <span className={cn(isBold && 'font-medium')}>{capitalizeOfString(transformToNormalFormat(value))}</span>
            ) : (
              <span
                className={cn(
                  'font-normal',
                  isBold ? 'font-semibold text-gray-700' : value ? 'font-semibold text-gray-700' : 'text-gray-500',
                )}
              >
                {capitalizeOfString(transformToNormalFormat(value)) ||
                  capitalizeOfString(transformToNormalFormat(children))}
              </span>
            )}
          </p>
          <span
            data-testid={`${id}_listbox_dropdown_button`}
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <ChevronDownIcon className="h-5 w-5 stroke-gray-500" />
          </span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options
            className={cn(
              'absolute z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white p-1 text-sm shadow-lg focus:outline-none',
              fixedWidthMenu ? fixedWidthMenu : 'w-full',
            )}
          >
            {(listsData?.length === 0 || listsData === undefined) && (
              <div className="cursor-default select-none p-2 text-center">
                {emptyMessage ? emptyMessage : `Empty ${capitalizeOfString(transformToNormalFormat(id))} found`}
              </div>
            )}
            {listsData?.map((list, listIdx) => (
              <Listbox.Option
                key={listIdx}
                className={({ active }) =>
                  cn(
                    'group flex w-full select-none items-center gap-2 rounded-md px-2 py-2.5 text-gray-700 duration-300 hover:cursor-pointer',
                    active ? 'bg-gray-50' : '',
                  )
                }
                value={
                  list.name.includes('_')
                    ? capitalizeOfString(transformToNormalFormat(list.name))
                    : capitalizeFirstLetter(list.name)
                }
              >
                {({ selected }) => (
                  <>
                    {list.avatarUrl ? <AvatarPlacement size="xs" image={list.avatarUrl} /> : null}
                    <span className={`block truncate font-medium ${selected ? 'font-semibold' : ''}`}>
                      {list.name.includes('_')
                        ? capitalizeOfString(transformToNormalFormat(list.name))
                        : capitalizeFirstLetter(list.name)}
                    </span>
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}
