import { cn } from '@/lib/utils'
import { slugify } from '@/utils/globalHelper'
import { Tab } from '@headlessui/react'
import { Fragment } from 'react'
import { Badge } from './Badge'

type HorizontalTabsProps = {
  children: React.ReactNode | React.ReactNode[]
  type: 'gray' | 'underline' | 'bordered'
  size: 'sm' | 'md'
  isFullwidth?: boolean
  tabLists: string[]
  disabled?: string[]
  handleIndex?: (value: number) => void
  index?: number
  gapLayout?: boolean
  removedLayout?: boolean
  numberIndicator?: number[]
}

const classesStyles = {
  base: 'border-b-2 px-1 text-sm font-semibold focus:outline-none whitespace-nowrap',
  size: {
    sm: 'text-sm',
    md: 'text-base',
  },
}

export const HorizontalTabs = ({
  children,
  type,
  size,
  isFullwidth,
  tabLists,
  index,
  handleIndex,
  gapLayout = false,
  removedLayout = false,
  disabled,
  numberIndicator,
}: HorizontalTabsProps) => {
  return (
    <>
      {removedLayout ? (
        <>{children[0]}</>
      ) : (
        <Tab.Group
          defaultIndex={index}
          onChange={(index) => {
            handleIndex(index)
          }}
        >
          {type === 'underline' && (
            <>
              <Tab.List
                className={cn(
                  'flex min-w-full items-center gap-4 overflow-auto border-b scrollbar-none sm:gap-6',
                  gapLayout ? 'px-7 xl:px-10' : 'px-0',
                )}
              >
                {tabLists.map((tabList, index) => {
                  const isDisabled = disabled?.includes(tabList)
                  return (
                    <Tab as={Fragment} key={slugify(tabList)}>
                      {({ selected }) => (
                        <button
                          type="button"
                          data-testid={slugify(tabList)}
                          key={index}
                          disabled={isDisabled}
                          className={cn(
                            classesStyles.base,
                            classesStyles.size[size],
                            selected ? 'border-primary-600 text-primary-700' : 'border-white text-gray-700',
                            isFullwidth ? 'w-full' : 'w-auto',
                            numberIndicator?.length > 0 ? 'py-2' : 'py-2.5',
                          )}
                        >
                          {tabList}
                          {numberIndicator ? (
                            <Badge
                              size="sm"
                              color="gray"
                              icon="none"
                              className={cn('ml-2', selected ? 'font-semibold' : 'font-medium')}
                            >
                              {numberIndicator[index]}
                            </Badge>
                          ) : (
                            ''
                          )}
                        </button>
                      )}
                    </Tab>
                  )
                })}
              </Tab.List>
              <Tab.Panels className={cn('my-4 xs:my-6 sm:my-8', gapLayout ? 'px-7 xl:px-10' : 'px-0')}>
                {Array.isArray(children) ? (
                  children.map((childrenPanel, index) => <Tab.Panel key={index}>{childrenPanel}</Tab.Panel>)
                ) : (
                  <Tab.Panel>{children}</Tab.Panel>
                )}
              </Tab.Panels>
            </>
          )}
        </Tab.Group>
      )}
    </>
  )
}
