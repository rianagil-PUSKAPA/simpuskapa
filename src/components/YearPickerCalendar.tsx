import { cn } from '@/lib/utils'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CalendarIcon } from './icon/CalendarIcon'
import { ChevronDownIcon } from './icon/ChevronDownIcon'

type Props = {
  id?: string
  placeholder?: string
  selected: Date
  onChange?: (date: Date) => void
  useArrow?: boolean
  disabled?: boolean
  error?: boolean
  isBold?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}
const classesStyles = {
  size: {
    sm: 'py-2 pl-10 pr-3',
    md: 'py-2.5 pl-10 pr-3',
  },
  fontSize: {
    sm: 'text-xs',
    md: 'text-sm',
  },
}
export const YearPickerCalendar = ({
  placeholder,
  selected,
  onChange,
  useArrow = false,
  error,
  id,
  disabled,
  isBold,
  size = 'md',
}: Props) => {
  return (
    <div className="relative" id={id}>
      <span className="absolute inset-y-0 left-3 z-10 my-auto inline-flex h-full items-center hover:cursor-help">
        <CalendarIcon className="h-5 w-5 stroke-gray-500" />
      </span>
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder || 'Select Dates'}
        showPopperArrow={false}
        dateFormat="yyyy"
        showYearPicker
        disabled={disabled}
        className={cn(
          'form-input w-full rounded-lg border shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
          classesStyles.size[size],
          classesStyles.fontSize[size],
          isBold && 'font-semibold',
          selected ? 'font-medium text-gray-700' : 'font-normal text-gray-500',
          error
            ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
            : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
        )}
      />
      {useArrow && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDownIcon className="h-5 w-5 stroke-gray-500" />
        </span>
      )}
    </div>
  )
}
