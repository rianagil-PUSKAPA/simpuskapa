import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Props = {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  ariaLabel: string
  disabled?: boolean
  id?: string
  searchable?: boolean
}

const splitLabel = (value: string) => {
  const index = value.indexOf(' -- ')

  return index < 0 ? [value, ''] : [value.slice(0, index), value.slice(index + 4)]
}

export function AarSelect({ value, options, onChange, ariaLabel, disabled, id, searchable }: Props) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open && !disabled}
          disabled={disabled}
          title={selected?.label || 'Select an option'}
          className="flex min-h-[46px] w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-800 focus-visible:border-primary-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100 disabled:bg-gray-50"
        >
          <span className="min-w-0 flex-1 truncate">
            {selected ? splitLabel(selected.label)[0] : 'Select an option'}
          </span>

          <ChevronDown size={17} className="shrink-0 text-gray-500" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        collisionPadding={12}
        className="z-[120] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
      >
        <Command className="min-w-0">
          {searchable && <CommandInput placeholder="Search options..." />}

          <CommandList className="max-h-72 overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No matching options.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const [primary, secondary] = splitLabel(option.label)

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className="flex min-w-0 max-w-full items-start gap-3 whitespace-normal rounded-lg px-3 py-3 aria-selected:bg-primary-50"
                  >
                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-5">
                      <span className="block text-sm text-gray-800">{primary}</span>

                      {secondary && <em className="mt-1 block break-words text-xs text-gray-500">{secondary}</em>}
                    </span>

                    <Check
                      size={16}
                      className={'mt-0.5 shrink-0 text-primary-600 ' + (value === option.value ? '' : 'opacity-0')}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
