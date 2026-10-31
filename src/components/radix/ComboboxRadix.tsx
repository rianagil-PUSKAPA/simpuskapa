import { CheckIcon } from '@/components/icon/CheckIcon'
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon'
import { AvatarLabelGroup } from '@/components/AvatarLabelGroup'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ComboboxType } from '@/types/global'
import { slugify, titleCase } from '@/utils/globalHelper'
import { useState } from 'react'

type ComboboxRadixType = {
  id?: string
  value: string
  listData: ComboboxType[]
  widthControllerStyles: string
  placeholder: string
  handleChange?: (e: any) => void
  valueCategory?: 'explicit' | 'implicit'
  valueController?: string
  emptyMessage?: string
  error?: boolean
  showAvatar?: boolean
}

export function ComboboxRadix({
  id,
  listData,
  widthControllerStyles,
  placeholder,
  handleChange,
  value: incomingValue,
  valueCategory = 'explicit',
  valueController,
  emptyMessage,
  error,
  showAvatar = false,
}: ComboboxRadixType) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(incomingValue || '')

  const handleValueCategory = (innerValue: string) => {
    if (innerValue === value) return ''

    if (valueCategory == 'implicit') {
      const findObject = listData.find((listDataItem) => listDataItem.name.toLowerCase() === innerValue.toLowerCase())
      return findObject[valueController]
    } else {
      return innerValue
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger data-testid={id} asChild>
        <Button
          variant={error ? 'error' : 'secondary-gray'}
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between bg-white text-left',
            value ? 'text-gray-900' : 'text-gray-500',
            widthControllerStyles,
          )}
        >
          {value
            ? titleCase(
                listData.find((listDataItem) => listDataItem.name.toLowerCase() === value.toLowerCase())?.name,
              ) || `Select ${placeholder.toLowerCase()}...`
            : `Select ${placeholder.toLowerCase()}...`}
          <div className="shrink-0">
            <ChevronDownIcon className="h-5 w-5 stroke-gray-500" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          'z-10 max-h-72 overflow-auto rounded-md bg-white p-0 px-1.5 py-1 text-sm shadow-lg ring-1 ring-gray-300 focus:outline-none',
          widthControllerStyles === 'w-full' ? 'w-72' : 'w-80',
        )}
      >
        {listData.length === 0 ? (
          <div className="relative cursor-not-allowed select-none px-2.5 py-2 text-gray-700">
            {emptyMessage ? emptyMessage : `Empty ${placeholder.toLowerCase()}`}
          </div>
        ) : (
          <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandEmpty>{`No ${placeholder.toLowerCase()} found.`}</CommandEmpty>
            <CommandGroup>
              {listData.map((listDataItem) => (
                <CommandItem
                  data-testid={`${slugify(placeholder.toLowerCase())}_${listDataItem.name.toLowerCase()}`}
                  key={listDataItem.id}
                  value={listDataItem.name}
                  onSelect={() => {
                    const newValue = handleValueCategory(listDataItem.name)
                    setValue(newValue)
                    handleChange(newValue)
                    setOpen(false)
                  }}
                >
                  {showAvatar ? (
                    <AvatarLabelGroup
                      size="sm"
                      image={
                        Array.isArray((listDataItem as any).avatarUrl)
                          ? (listDataItem as any).avatarUrl?.[0]
                          : (listDataItem as any).avatarUrl
                      }
                      text={listDataItem.name}
                      statusIcon={false}
                    />
                  ) : (
                    titleCase(listDataItem.name)
                  )}
                  <span
                    className={cn(
                      value.toLowerCase() === listDataItem.name.toLowerCase() ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    <CheckIcon className="h-5 w-5 stroke-primary-500" />
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
