import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon'
import { formatCurrency } from '@/utils/globalHelper'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

type BudgetInfoItem = {
  label: string
  amount: number
}

type BudgetInfoDropdownProps = {
  totalAmount: number
  items: BudgetInfoItem[]
  widthClass?: string
}

/**
 * Reusable dropdown component to display budget information breakdown
 */
export const BudgetInfoDropdown = ({ totalAmount, items, widthClass = 'w-[22rem]' }: BudgetInfoDropdownProps) => {
  return (
    <Menu as="div" className={`relative inline-block text-left ${widthClass}`}>
      <Menu.Button className="button secondary h-full w-full justify-between gap-2 border border-gray-300 bg-white py-4 pl-6 pr-3 text-base !font-extrabold text-gray-600 duration-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-white focus:ring-4 focus:ring-gray-100 focus-visible:outline-none disabled:border-gray-25 disabled:bg-gray-25 disabled:text-gray-300 disabled:hover:bg-gray-25 disabled:hover:text-gray-300">
        <p className="font-extrabold">Rp</p>
        <p className="w-60 text-right text-3xl">{formatCurrency('IDR', totalAmount, true)}</p>
        <div className="shrink-0 p-2">
          <ChevronDownIcon data-icon="rotation" className="h-5 w-5 stroke-gray-700" />
        </div>
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
        <Menu.Items className="absolute right-0 z-20 mt-2 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          {items.map((item, index) => (
            <Menu.Item key={index}>
              <div className="w-full px-6 py-4">
                <span className="mb-1 block text-xs font-semibold text-gray-400">{item.label}</span>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Rp</p>
                    <p className="text-sm font-bold text-gray-600">{formatCurrency('IDR', item.amount, true)}</p>
                  </div>
                </div>
              </div>
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
