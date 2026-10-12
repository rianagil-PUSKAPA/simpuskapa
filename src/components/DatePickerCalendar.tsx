import { CalendarIcon } from '@/components/icon/CalendarIcon'
import { ChevronDownIcon } from '@/components/icon/ChevronDownIcon'
import { ChevronLeftIcon } from '@/components/icon/ChevronLeftIcon'
import { ChevronRightIcon } from '@/components/icon/ChevronRightIcon'
import { cn } from '@/lib/utils'
import { generateArrayOfYears, handleFilterDate } from '@/utils/globalHelper'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Props = {
  id?: string
  placeholder?: string
  selected: Date
  onChange?: (date: Date) => void
  useArrow?: boolean
  error?: boolean
  required?: boolean
  isUsingCustomHeader?: boolean
  isWeekday?: boolean
  typeYears?: 'past' | 'future'
  size?: 'sm' | 'md'
  dateFormat?: string
  inline?: boolean
  selectsRange?: boolean
  startDate?: Date | null
  endDate?: Date | null
  isCurrentYear?: boolean
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

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

const LAST_DATE_OF_YEAR = `12/31/${new Date().getFullYear() + 150}`
const FIRST_DATE_OF_YEAR = `01/01/${new Date().getFullYear() - 150}`

export const DatePickerCalendar = ({
  placeholder,
  selected,
  onChange,
  useArrow = false,
  error,
  required,
  id,
  isUsingCustomHeader = false,
  typeYears = 'past',
  isWeekday = false,
  size = 'md',
  dateFormat = 'MMMM d, yyyy',
  inline = false,
  selectsRange = false,
  startDate,
  endDate,
  isCurrentYear = false,
}: Props) => {
  const [years, setYears] = useState<number[]>([])
  const [firstDateState, setFirstDateState] = useState(FIRST_DATE_OF_YEAR)
  const [lastDateState, setLastDateState] = useState(LAST_DATE_OF_YEAR)

  useEffect(() => {
    switch (typeYears) {
      case 'past':
        setYears(generateArrayOfYears('past'))
        break
      case 'future':
        setYears(generateArrayOfYears('future'))
        break

      default:
        break
    }
  }, [typeYears])

  useEffect(() => {
    if (isCurrentYear) {
      setFirstDateState(`01/01/${new Date().getFullYear()}`)
      setLastDateState(`12/31/${new Date().getFullYear()}`)
    } else {
      setFirstDateState(FIRST_DATE_OF_YEAR)
      setLastDateState(LAST_DATE_OF_YEAR)
    }
  }, [isCurrentYear])

  return (
    <div className="relative" id={id} data-testid={id}>
      <span
        className={cn(
          'absolute inset-y-0 left-3 z-10 my-auto inline-flex h-full items-center hover:cursor-help',
          inline ? 'hidden' : 'flex',
        )}
      >
        <CalendarIcon className="h-5 w-5 stroke-gray-600" />
      </span>
      <DatePicker
        inline={inline}
        selectsRange={selectsRange}
        renderCustomHeader={
          isUsingCustomHeader
            ? ({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="m-2.5 mt-0 flex items-center justify-center gap-2">
                  <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
                    <ChevronLeftIcon className="h-5 w-5 stroke-gray-500" />
                  </button>
                  <select
                    className="form-select w-24 rounded-lg border border-gray-300 py-1.5 pr-8 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                    value={dayjs(date).year()}
                    onChange={({ target: { value } }) => changeYear(value)}
                  >
                    {years.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-select w-full rounded-lg border border-gray-300 py-1.5 text-sm text-gray-900 shadow-xs placeholder:text-gray-500 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 disabled:border-gray-300 disabled:bg-gray-50"
                    value={months[dayjs(date).month()]}
                    onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                  >
                    {months.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
                    <ChevronRightIcon className="h-5 w-5 stroke-gray-500" />
                  </button>
                </div>
              )
            : undefined
        }
        filterDate={(date: Date) => handleFilterDate(isWeekday, date)}
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder || 'Select Dates'}
        showPopperArrow={false}
        dateFormat={dateFormat}
        required={required}
        minDate={new Date(firstDateState)}
        maxDate={new Date(lastDateState)}
        className={cn(
          classesStyles.base,
          classesStyles.sizeContainer[size],
          classesStyles.fontSize[size],
          selected ? 'text-gray-900' : 'text-gray-500',
          error
            ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
            : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
        )}
        startDate={startDate}
        endDate={endDate}
      />
      {useArrow && inline === false && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDownIcon className="h-5 w-5 stroke-gray-500" />
        </span>
      )}
    </div>
  )
}
