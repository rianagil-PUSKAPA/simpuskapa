import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { IMaskInput } from 'react-imask'
import { ListboxSelect } from './ListboxSelect'

type InputSelectionType = {
  id: string
  value: string
}

type InputProps = {
  type: 'text' | 'email' | 'password' | 'number'
  id?: string
  value?: string | number
  placeholder?: string
  primaryIcon?: React.ReactNode
  supportIcon?: React.ReactNode
  groupText?: string
  groupTextPosition?: 'start' | 'end'
  align?: 'start' | 'end'
  groupTextXAxisStyles?: string
  groupStyles?: string
  inputSelectionInit?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: boolean
  className?: string
  inputGroup?: boolean
  inputSelectionValues?: InputSelectionType[]
  fixedWidthMenu?: string
  isPlaceholder?: boolean
  onChange?: any
  inputSelectionHandler?: (value: string) => void
  size?: 'sm' | 'md'
  maxLength?: number
  isCurrency?: boolean
  inputRef?: any
  name?: string
  defaultValue?: string | number
  step?: number | 'any'
}

const classesStyles = {
  size: {
    sm: 'text-sm placeholder:text-sm py-2.5 px-3.5', //font-medium
    md: 'text-base placeholder:text-base px-3 py-2',
  },
}

export const Input = ({
  type,
  primaryIcon,
  supportIcon,
  disabled,
  readonly,
  required,
  id,
  value,
  placeholder,
  error,
  className,
  groupText,
  groupStyles,
  groupTextPosition,
  groupTextXAxisStyles,
  inputGroup,
  fixedWidthMenu,
  inputSelectionInit,
  onChange,
  inputSelectionHandler,
  isPlaceholder,
  inputSelectionValues,
  align = 'start',
  size = 'md',
  maxLength,
  isCurrency = false,
  inputRef,
  name,
  defaultValue,
  step,
}: InputProps) => {
  const [optionValues, setOptionValues] = useState<InputSelectionType[]>([])
  const [selection, setSelection] = useState(inputSelectionInit || 'IDR')

  useEffect(() => {
    setOptionValues(inputSelectionValues)
  }, [inputSelectionValues])

  useEffect(() => {
    setSelection(inputSelectionInit)
  }, [inputSelectionInit])

  return (
    <div className={`relative ${className}`}>
      {inputGroup && (
        <div className="absolute inset-y-0 left-0 my-auto inline-flex h-full items-center">
          <ListboxSelect
            className="border-none focus:!ring-0"
            lists={optionValues.map((input) => ({
              name: input.value,
            }))}
            handleChange={(value) => {
              setSelection(value)
              inputSelectionHandler(value)
            }}
            id="emergencyContactNumber"
            isBold={true}
            fixedWidthMenu={fixedWidthMenu}
            isPlaceholder={isPlaceholder}
            value={selection}
          >
            {selection}
          </ListboxSelect>
        </div>
      )}
      {primaryIcon && (
        <span className="absolute inset-y-0 left-3 my-auto inline-flex h-full items-center">{primaryIcon}</span>
      )}
      {isCurrency ? (
        <IMaskInput
          name={name}
          id={id}
          data-testid={id}
          inputRef={inputRef}
          onAccept={(value: any) => onChange(value)}
          mask={Number}
          radix={selection === 'IDR' ? ',' : '.'}
          value={String(value)}
          unmask={true}
          thousandsSeparator={selection === 'IDR' ? '.' : ','}
          scale={2}
          padFractionalZeros={false}
          normalizeZeros={true}
          min={0}
          placeholder={placeholder}
          className={cn(
            'form-input w-full rounded-lg border text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500',
            error
              ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
              : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
            primaryIcon && !inputGroup && 'pl-10',
            supportIcon && 'pr-9',
            groupText && groupTextXAxisStyles,
            align === 'start' ? 'text-start' : 'text-end',
            inputGroup && 'pl-20',
            classesStyles.size[size],
          )}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          defaultValue={defaultValue}
        />
      ) : (
        <input
          name={name}
          onChange={onChange}
          // ref={ref}
          id={id}
          data-testid={id}
          type={type}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          className={cn(
            'form-input w-full rounded-lg border text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500',
            error
              ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
              : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
            primaryIcon && !inputGroup && 'pl-10',
            supportIcon && 'pr-9',
            groupText && groupTextXAxisStyles,
            align === 'start' ? 'text-start' : 'text-end',
            inputGroup && 'pl-20',
            classesStyles.size[size],
          )}
          placeholder={placeholder}
          value={value}
          min={type === 'number' ? 0 : ''}
          step={type === 'number' ? step ?? 'any' : undefined}
          onWheel={(e) => e.currentTarget.blur()}
          maxLength={maxLength}
          defaultValue={defaultValue}
        />
      )}
      {supportIcon && (
        <span className="absolute inset-y-0 right-3 my-auto inline-flex h-full items-center hover:cursor-help">
          {supportIcon}
        </span>
      )}
      {groupText && (
        <span
          className={cn(
            'absolute inset-y-0 my-auto inline-flex h-full items-center border-gray-300',
            groupStyles,
            groupTextPosition === 'end' ? 'right-4 border-l pl-4' : 'left-4 border-r pr-4',
          )}
        >
          {groupText}
        </span>
      )}
    </div>
  )
}
