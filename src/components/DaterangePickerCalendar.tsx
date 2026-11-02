import { cn } from '@/lib/utils'
import { handleFilterDate } from '@/utils/globalHelper'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CalendarIcon } from './icon/CalendarIcon'

type DateRangePickerType = {
  size?: 'sm' | 'md'
  isWeekday?: boolean
  dateRange: Date[]
  handleDateRangePicker: (dateRange: Date[]) => void
}

const classesStyles = {
  base: 'form-input w-full rounded-lg border border-gray-300 font-semibold text-gray-700 shadow-xs placeholder:text-gray-700 focus:border-gray-300 focus:ring-0 disabled:border-gray-300 disabled:bg-gray-50',
  sizeContainer: {
    sm: 'py-2 pl-10 pr-4',
    md: 'py-2.5 pl-10 pr-4',
  },
  fontSize: {
    sm: 'text-xs',
    md: 'text-sm',
  },
}

export const DaterangePickerCalendar = ({
  size,
  isWeekday = false,
  dateRange = [null, null],
  handleDateRangePicker,
}: DateRangePickerType) => {
  const [startDate, endDate] = dateRange

  return (
    <div className="relative w-64 shrink-0">
      <div className="absolute inset-y-0 left-3 z-10 my-auto inline-flex h-full items-center hover:cursor-help">
        <CalendarIcon className="h-5 w-5 stroke-gray-700" />
      </div>
      <DatePicker
        isClearable={true}
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        dateFormat="MMM d, yyyy"
        filterDate={(date: Date) => handleFilterDate(isWeekday, date)}
        showPopperArrow={false}
        onChange={(update) => handleDateRangePicker(update)}
        placeholderText="Select Dates"
        className={cn(classesStyles.base, classesStyles.fontSize[size], classesStyles.sizeContainer[size])}
      />
    </div>
  )
}
