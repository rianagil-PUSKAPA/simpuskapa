import { cn } from '@/lib/utils'
import { forwardRef, useId } from 'react'
import { FieldError } from 'react-hook-form'

/**
 * Textarea - Improved textarea component with consistent API
 *
 * This component provides the same API and features as InputV2,
 * but for multi-line text input. It includes:
 * - Full TypeScript type safety
 * - WCAG 2.1 AA accessibility compliance
 * - Built-in error and helper text rendering
 * - Automatic ID generation
 * - forwardRef support for react-hook-form register()
 * - Automatic FieldError message extraction
 *
 * Usage Examples:
 *
 * // Simple usage with react-hook-form register()
 * <Textarea
 *   {...register('description', {
 *     required: 'Description is required',
 *     maxLength: { value: 250, message: 'Max 250 characters' }
 *   })}
 *   label="Description"
 *   placeholder="Enter description"
 *   rows={3}
 *   maxLength={250}
 *   error={errors.description}
 *   helperText="Maximum 250 characters"
 * />
 *
 * // With Controller
 * <Controller
 *   control={control}
 *   name="notes"
 *   render={({ field, fieldState }) => (
 *     <Textarea
 *       {...field}
 *       label="Notes"
 *       placeholder="Additional notes"
 *       rows={5}
 *       error={fieldState.error}
 *     />
 *   )}
 * />
 *
 * // With character counter
 * <Textarea
 *   label="Comments"
 *   value={comments}
 *   onChange={(e) => setComments(e.target.value)}
 *   rows={4}
 *   maxLength={500}
 *   helperText={`${comments.length}/500 characters`}
 * />
 *
 * // Non-resizable
 * <Textarea
 *   label="Fixed Size"
 *   resize="none"
 *   rows={3}
 * />
 */

type TextareaProps = {
  // Value
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void

  // Label and text
  label?: string
  placeholder?: string
  helperText?: string
  required?: boolean

  // Error handling - accepts both boolean and FieldError
  error?: boolean | FieldError
  errorMessage?: string

  // Textarea specific
  rows?: number
  cols?: number
  maxLength?: number
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'

  // States
  disabled?: boolean
  readonly?: boolean

  // Styling
  className?: string

  // Form integration
  id?: string
  name?: string

  // ARIA
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      value,
      onChange,
      label,
      placeholder,
      helperText,
      required,
      error,
      errorMessage,
      rows = 3,
      cols,
      maxLength,
      resize = 'none',
      disabled,
      readonly,
      className,
      id: providedId,
      name,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-required': ariaRequired,
    },
    ref,
  ) => {
    // Generate stable unique IDs
    const generatedId = useId()
    const textareaId = providedId || generatedId
    const errorId = `${textareaId}-error`
    const helperId = `${textareaId}-helper`

    // Extract error message from FieldError object or use explicit errorMessage
    const displayErrorMessage = errorMessage || (typeof error === 'object' && error?.message) || ''

    // Determine if textarea has error
    const hasError = Boolean(error) || Boolean(errorMessage)

    // Compute aria-describedby
    const describedByIds = [
      ariaDescribedBy,
      displayErrorMessage ? errorId : null,
      helperText && !displayErrorMessage ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ')

    // Compute ARIA attributes
    const computedAriaInvalid = ariaInvalid !== undefined ? ariaInvalid : hasError
    const computedAriaRequired = ariaRequired !== undefined ? ariaRequired : required

    return (
      <div>
        {/* Label */}
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 inline-block text-sm font-medium text-gray-700">
            {label}
            {required && (
              <span className="ml-0.5 text-error-500" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Textarea element */}
        <textarea
          ref={ref}
          id={textareaId}
          data-testid={textareaId}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          cols={cols}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readonly}
          aria-invalid={computedAriaInvalid}
          aria-describedby={describedByIds || undefined}
          aria-required={computedAriaRequired}
          className={cn(
            // Base styles
            'form-textarea w-full rounded-lg border px-3.5 py-3 text-gray-900 shadow-xs placeholder:text-gray-500 focus:ring-4 disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-500',
            // Error styles
            hasError
              ? 'border-error-300 focus:border-error-300 focus:ring-error-100'
              : 'border-gray-300 focus:border-primary-300 focus:ring-primary-100',
            // Resize behavior
            resize === 'none' && 'resize-none',
            resize === 'vertical' && 'resize-y',
            resize === 'horizontal' && 'resize-x',
            resize === 'both' && 'resize',
            // Custom className
            className,
          )}
        />

        {/* Error message - auto-rendered with proper ARIA */}
        {displayErrorMessage && (
          <span id={errorId} className="input-hint-text error mt-1.5 block text-sm text-error-600" role="alert">
            {displayErrorMessage}
          </span>
        )}

        {/* Helper text - shown only when no error exists */}
        {helperText && !displayErrorMessage && (
          <span id={helperId} className="input-hint-text mt-1.5 block text-sm text-gray-600">
            {helperText}
          </span>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
