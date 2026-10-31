import { cn } from '@/lib/utils'
import { ComboboxType } from '@/types/global'
import { SwitchingLayoutType } from '@/types/table'
import { Combobox, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AvatarPlacement } from './AvatarPlacement'
import { CheckIcon } from './icon/CheckIcon'
import { ChevronDownIcon } from './icon/ChevronDownIcon'

type NoneType = {
  others?: 'none'
}
type SubmitValueType = {
  others?: 'submit-value'
  identifierText?: string
}
type UndecidedType = {
  others?: 'undecided'
}
type SelfDefinedType = {
  others?: 'self-define'
  dynamicInput?: SwitchingLayoutType[]
  handleDynamicInput?: (identifier: any, status: boolean) => void
}

type Props = {
  id: string
  primaryIcon?: React.ReactNode
  icon?: JSX.Element
  groupText?: string
  placeholder?: string
  error?: boolean
  className?: string
  size?: 'sm' | 'md'
  listData: ComboboxType[]
  otherOptions?: ComboboxType[]
  value?: ComboboxType
  handleChange?: (e: any) => void
} & (NoneType | UndecidedType | SelfDefinedType | SubmitValueType)

const classesStyles = {
  fontSize: {
    sm: 'text-sm',
    md: 'text-base',
  },
  paddingYInput: {
    sm: 'py-2.5',
    md: 'py-2',
  },
  paddingYDropdown: {
    sm: 'py-3',
    md: 'py-2.5',
  },
}

export const ComboboxAutocomplete = (props: Props) => {
  const { size: sizeEl = 'md', icon } = props
  const [selected, setSelected] = useState<ComboboxType | null>(null)
  const [query, setQuery] = useState('')

  const filteredOptions =
    query === ''
      ? props.listData
      : props.listData.filter((person) =>
          person.name.toLowerCase().replace(/\s+/g, '').includes(query.toLowerCase().replace(/\s+/g, '')),
        )

  const handleComboboxChange = (value: any) => {
    props.handleChange && props.handleChange(value)
    setSelected(value)
  }

  const handleCaseSubmitValue = (e: any, value: any) => {
    if (props.others === 'submit-value' && query !== '' && e.keyCode === 13) {
      const result = {
        id: uuidv4(),
        name: value || query,
      }
      props.handleChange && props.handleChange(result)
      setSelected(null)
    }
  }

  useEffect(() => {
    if (props.value?.pass_photo || props.value?.avatarUrl) {
      setSelected(props.value)
    }
  }, [props.value?.pass_photo, props.value?.avatarUrl])

  return (
    <div data-testid={`${props.id}_combobox_outer`} id={props.id}>
      <Combobox value={props.value || selected} onChange={(value) => handleComboboxChange(value)}>
        <div className={cn('relative', props.className)}>
          <div className={cn('relative')}>
            <Combobox.Input
              placeholder={props.placeholder || 'Placeholder'}
              className={cn(
                'form-input w-full rounded-lg border pr-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
                icon ? 'pl-[2.65rem]' : 'pl-3',
                props.error
                  ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
                  : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
                props.primaryIcon && 'pl-[2.65rem]',
                props.groupText && 'pr-36',
                classesStyles.fontSize[sizeEl],
                classesStyles.paddingYInput[sizeEl],
              )}
              displayValue={(person: ComboboxType) => person?.name}
              onChange={(event) => (event.target.value ? setQuery(event.target.value) : setSelected(null))}
              onKeyUp={(event) => {
                handleCaseSubmitValue(event, (event.target as HTMLInputElement).value)
              }}
            />
            {icon ? (
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {selected?.avatarUrl ? (
                  <AvatarPlacement size="xs" image={selected.avatarUrl[0]} />
                ) : selected?.pass_photo ? (
                  <AvatarPlacement size="xs" image={selected.pass_photo[0]} />
                ) : (
                  icon
                )}
              </span>
            ) : null}
            <Combobox.Button
              data-testid={`${props.id}_combobox_button`}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <ChevronDownIcon className="h-5 w-5 stroke-gray-500" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options
              className={cn(
                'absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-md bg-white px-1.5 py-1 shadow-lg ring-1 ring-gray-300 focus:outline-none',
                classesStyles.fontSize[sizeEl],
              )}
            >
              {filteredOptions.length === 0 && query !== '' ? (
                <>
                  {props.others === 'submit-value' && (
                    <div
                      className={cn(
                        'relative cursor-default select-none px-4 text-gray-700',
                        classesStyles.paddingYDropdown[sizeEl],
                      )}
                    >
                      No {props.identifierText} found, click{' '}
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-semibold text-gray-700 mix-blend-multiply">
                        enter
                      </span>{' '}
                      to add this as new {props.identifierText} to "{query}" type
                    </div>
                  )}
                  {props.others === 'none' && (
                    <div
                      className={cn(
                        'relative cursor-default select-none px-4 text-gray-700',
                        classesStyles.paddingYDropdown[sizeEl],
                      )}
                    >
                      Nothing found.
                    </div>
                  )}
                  {props.others === 'self-define' && (
                    <div
                      className={cn(
                        'relative cursor-pointer select-none rounded-md p-2 text-gray-800 hover:bg-gray-50',
                        classesStyles.fontSize[sizeEl],
                      )}
                      onClick={() => {
                        const findLayoutType = props.dynamicInput?.find((x: SwitchingLayoutType) => x.name === props.id)

                        props.handleDynamicInput(props.id, !findLayoutType?.status)
                      }}
                    >
                      Custom Type
                    </div>
                  )}
                  {props.others === 'undecided' && (
                    <>
                      {props.otherOptions.map((option) => (
                        <Combobox.Option
                          key={option.id}
                          className={({ active }) =>
                            cn(
                              'relative flex cursor-default select-none items-center rounded-md pl-2 pr-10',
                              active ? 'bg-gray-50' : 'text-gray-800',
                              classesStyles.paddingYDropdown[sizeEl],
                            )
                          }
                          value={option}
                        >
                          {({ selected, active }) => (
                            <div className="inline-flex items-center gap-2">
                              {/* <User01Icon className="h-5 w-5 stroke-gray-500" /> */}
                              <p>{option.name}</p>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                    active ? 'text-primary-500' : ''
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5 stroke-primary-500" />
                                </span>
                              ) : null}
                            </div>
                          )}
                        </Combobox.Option>
                      ))}
                    </>
                  )}
                </>
              ) : (
                filteredOptions.map((person) => (
                  <Combobox.Option
                    key={person.id}
                    className={({ active }) =>
                      cn(
                        'relative flex cursor-default select-none items-center rounded-md pl-2 pr-10',
                        active ? 'bg-gray-50' : 'text-gray-800',
                        classesStyles.paddingYDropdown[sizeEl],
                      )
                    }
                    value={person}
                  >
                    {({ selected, active }) => (
                      <div className="inline-flex items-center gap-2">
                        {person.avatarUrl ? (
                          <AvatarPlacement size="xs" image={person.avatarUrl[0]} />
                        ) : person.pass_photo ? (
                          <AvatarPlacement size="xs" image={person.pass_photo[0]} />
                        ) : null}
                        {/* <User01Icon className="h-5 w-5 stroke-gray-500" /> */}
                        <p>{person.name}</p>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                              active ? 'text-primary-500' : ''
                            }`}
                          >
                            <CheckIcon className="h-5 w-5 stroke-primary-500" />
                          </span>
                        ) : null}
                      </div>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  )
}
