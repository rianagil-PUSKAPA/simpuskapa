import { cn } from '@/lib/utils'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ChevronDownIcon } from './icon/ChevronDownIcon'
import { ClockStopwatchIcon } from './icon/ClockStopwatchIcon'

type Props = {
  id?: string
  placeholder?: string
  selected: Date
  onChange?: (date: Date) => void
  useArrow?: boolean
  error?: boolean
  required?: boolean
  size?: 'sm' | 'md'
  dateFormat?: string
}

const classesStyles = {
  base: 'form-input w-full rounded-lg border shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50',
  sizeContainer: {
    sm: 'py-2.5 pl-10 pr-4',
    md: 'py-2.5 pl-10 pr-3',
  },
  fontSize: {
    sm: 'text-sm',
    md: 'text-base',
  },
}

export const TimePicker = ({
  placeholder,
  selected,
  onChange,
  useArrow = false,
  error,
  required,
  id,
  size = 'md',
  dateFormat = 'h:mm aa',
}: Props) => {
  return (
    <div className="relative" id={id}>
      <span className={cn('absolute inset-y-0 left-3 z-10 my-auto inline-flex h-full items-center hover:cursor-help')}>
        <ClockStopwatchIcon className="h-5 w-5 stroke-gray-600" />
      </span>
      <DatePicker
        selected={selected}
        onChange={onChange}
        showPopperArrow={false}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption="Select Time"
        dateFormat={dateFormat}
        timeFormat={dateFormat}
        required={required}
        className={cn(
          classesStyles.base,
          classesStyles.sizeContainer[size],
          classesStyles.fontSize[size],
          selected ? 'font-medium text-gray-700' : 'font-normal text-gray-500',
          error
            ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
            : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
        )}
        placeholderText={placeholder || 'Select Dates'}
      />
      {useArrow && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDownIcon className="h-5 w-5 stroke-gray-500" />
        </span>
      )}
    </div>
  )
}
