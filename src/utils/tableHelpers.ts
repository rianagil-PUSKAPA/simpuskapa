import { ComboboxOption } from '@/components/ui/combobox'
import { capitalizeFirstLetter, capitalizeOfString, transformToNormalFormat } from './globalHelper'

/**
 * Access nested object property using dot notation
 * @example accessPropertyDynamicParameter('user.name', obj) => obj.user.name
 */
export const accessPropertyDynamicParameter = (path: string, obj: object): any => {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null
  }, obj || self)
}

/**
 * Format column value for display (snake_case to Title Case)
 */
export const formatColumnValue = (value: string): string => {
  if (!value) return ''

  return value.includes('_') ? capitalizeOfString(transformToNormalFormat(value)) : capitalizeFirstLetter(value)
}

/**
 * Convert array of values to ComboboxOption format
 */
export const valuesToComboboxOptions = (values: Iterable<any>, label: string): ComboboxOption[] => {
  const options: ComboboxOption[] = [
    { value: '', label }, // "All" option
  ]

  for (const val of values) {
    if (val !== null && val !== undefined) {
      options.push({
        value: String(val),
        label: formatColumnValue(String(val)),
      })
    }
  }

  return options
}
