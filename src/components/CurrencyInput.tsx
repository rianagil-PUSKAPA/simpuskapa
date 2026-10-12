import { forwardRef } from 'react'
import { InputV2 } from './InputV2'
import { FieldError } from 'react-hook-form'

/**
 * CurrencyInput - Simplified wrapper for currency inputs
 *
 * This component simplifies the complex currency input pattern by
 * encapsulating all the required props (isCurrency, inputGroup,
 * inputSelectionValues, etc.) into a clean, simple API.
 *
 * Benefits:
 * - Reduces prop count from 10+ to 4-5
 * - Type-safe currency codes
 * - Centralized currency configuration
 * - Consistent formatting across currencies
 *
 * Usage Examples:
 *
 * // Simple usage with react-hook-form Controller
 * <Controller
 *   control={control}
 *   name="price"
 *   render={({ field, fieldState }) => (
 *     <CurrencyInput
 *       {...field}
 *       label="Price"
 *       currency={currencyCode}
 *       onCurrencyChange={setCurrency}
 *       error={fieldState.error}
 *     />
 *   )}
 * />
 *
 * // Standalone usage
 * <CurrencyInput
 *   label="Package Price"
 *   currency="USD"
 *   onCurrencyChange={(code) => console.log('Selected:', code)}
 *   value={price}
 *   onChange={(value) => setPrice(value)}
 *   availableCurrencies={['USD', 'EUR', 'GBP']}
 *   error={errors.price}
 * />
 *
 * // With helper text
 * <CurrencyInput
 *   label="Budget"
 *   currency="IDR"
 *   value={budget}
 *   onChange={setBudget}
 *   helperText="Enter your total budget"
 *   required
 * />
 */

// Supported currency codes
export type CurrencyCode = 'IDR' | 'USD' | 'AUD' | 'EUR' | 'GBP' | 'SGD' | 'MYR'

// Configuration for each currency
const CURRENCY_CONFIG = {
  IDR: {
    id: 'id',
    value: 'IDR',
    radix: ',', // Decimal separator
    separator: '.', // Thousands separator
    symbol: 'Rp',
  },
  USD: {
    id: 'us',
    value: 'USD',
    radix: '.',
    separator: ',',
    symbol: '$',
  },
  AUD: {
    id: 'au',
    value: 'AUD',
    radix: '.',
    separator: ',',
    symbol: 'A$',
  },
  EUR: {
    id: 'eu',
    value: 'EUR',
    radix: ',',
    separator: '.',
    symbol: '€',
  },
  GBP: {
    id: 'gb',
    value: 'GBP',
    radix: '.',
    separator: ',',
    symbol: '£',
  },
  SGD: {
    id: 'sg',
    value: 'SGD',
    radix: '.',
    separator: ',',
    symbol: 'S$',
  },
  MYR: {
    id: 'my',
    value: 'MYR',
    radix: '.',
    separator: ',',
    symbol: 'RM',
  },
}

// Default available currencies
const DEFAULT_CURRENCIES: CurrencyCode[] = ['IDR', 'USD', 'AUD']

type CurrencyInputProps = {
  // Value and change handler
  value?: string | number
  onChange?: (value: string | number) => void

  // Currency selection
  currency?: CurrencyCode
  onCurrencyChange?: (currency: CurrencyCode) => void
  availableCurrencies?: CurrencyCode[]

  // Label and text
  label?: string
  placeholder?: string
  helperText?: string
  required?: boolean

  // Error handling
  error?: boolean | FieldError
  errorMessage?: string

  // States
  disabled?: boolean
  readonly?: boolean

  // Styling
  size?: 'sm' | 'md'
  className?: string
  align?: 'start' | 'end'

  // Form integration
  id?: string
  name?: string

  // ARIA
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      currency = 'IDR',
      onCurrencyChange,
      availableCurrencies = DEFAULT_CURRENCIES,
      value,
      onChange,
      label,
      placeholder,
      helperText,
      required,
      error,
      errorMessage,
      disabled,
      readonly,
      size = 'md',
      className,
      align = 'end', // Default to right-align for currency
      id,
      name,
      ...ariaProps
    },
    ref,
  ) => {
    // Map currency codes to the format expected by InputV2
    const currencyOptions = availableCurrencies.map((code) => CURRENCY_CONFIG[code])

    return (
      <InputV2
        ref={ref}
        type="number"
        // Currency-specific props
        isCurrency={true}
        inputGroup={true}
        inputSelectionInit={currency}
        inputSelectionValues={currencyOptions}
        inputSelectionHandler={onCurrencyChange}
        fixedWidthMenu="w-20"
        isPlaceholder={true}
        // Standard props
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        label={label}
        placeholder={placeholder || '0'}
        helperText={helperText}
        required={required}
        error={error}
        errorMessage={errorMessage}
        disabled={disabled}
        readonly={readonly}
        size={size}
        className={className}
        align={align}
        {...ariaProps}
      />
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'

// Export currency config for external use if needed
export { CURRENCY_CONFIG }
